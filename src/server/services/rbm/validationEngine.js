/**
 * RBM Data Validation Engine
 * Workflow: pending → verified | rejected | flagged
 * Runs automated quality checks and writes an immutable audit trail.
 */

export const VALIDATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  FLAGGED: 'flagged',
};

const QUALITY_PENALTIES = {
  error: 20,
  warning: 5,
};

export const QUALITY_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
};

export class ValidationEngine {
  /**
   * @param {import('../databaseService.js').default} db
   */
  constructor(db) {
    this.db = db;
  }

  // ── Workflow Actions ──────────────────────────────────────────────────────

  /**
   * Run automated checks and move entry to pending (or flag it if errors found).
   * @param {string} indicatorValueId - UUID
   * @param {string} submittedBy - User UUID
   */
  async submitForValidation(indicatorValueId, submittedBy) {
    const entry = await this._fetchIndicatorValue(indicatorValueId);
    if (!entry) throw new Error(`Indicator value ${indicatorValueId} not found`);
    if (entry.validation_status !== VALIDATION_STATUS.PENDING) {
      throw new Error(`Entry is already in status: ${entry.validation_status}`);
    }

    const checks = await this._runValidationChecks(entry);
    const qualityScore = this._computeQualityScore(checks);
    const autoErrors = checks.filter(c => c.severity === 'error');

    if (autoErrors.length > 0) {
      await this._updateValidationStatus(indicatorValueId, VALIDATION_STATUS.FLAGGED, null, {
        reason: 'Automatic validation flags detected',
        checks,
        qualityScore,
      });
      await this._writeAuditLog(indicatorValueId, 'flagged', submittedBy, {
        reason: 'Auto-flagged during submission',
        checks,
      });
      return { status: VALIDATION_STATUS.FLAGGED, qualityScore, checks };
    }

    await this._updateQualityScore(indicatorValueId, qualityScore, checks);
    await this._writeAuditLog(indicatorValueId, 'submitted', submittedBy, {
      qualityScore,
      checkCount: checks.length,
    });

    return { status: VALIDATION_STATUS.PENDING, qualityScore, checks };
  }

  /**
   * Approve an entry (pending or flagged → verified).
   * @param {string} indicatorValueId - UUID
   * @param {string} verifiedBy - User UUID
   * @param {string} [notes]
   */
  async verify(indicatorValueId, verifiedBy, notes = '') {
    const entry = await this._fetchIndicatorValue(indicatorValueId);
    if (!entry) throw new Error(`Indicator value ${indicatorValueId} not found`);

    const allowed = [VALIDATION_STATUS.PENDING, VALIDATION_STATUS.FLAGGED];
    if (!allowed.includes(entry.validation_status)) {
      throw new Error(`Cannot verify entry with status: ${entry.validation_status}`);
    }

    await this._updateValidationStatus(indicatorValueId, VALIDATION_STATUS.VERIFIED, verifiedBy, {
      notes,
      verifiedAt: new Date().toISOString(),
    });
    await this._writeAuditLog(indicatorValueId, 'verified', verifiedBy, { notes });

    return { status: VALIDATION_STATUS.VERIFIED, verifiedBy, notes };
  }

  /**
   * Reject an entry (requires a reason).
   * @param {string} indicatorValueId - UUID
   * @param {string} rejectedBy - User UUID
   * @param {string} reason - Non-empty reason for rejection
   */
  async reject(indicatorValueId, rejectedBy, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required');
    }

    const entry = await this._fetchIndicatorValue(indicatorValueId);
    if (!entry) throw new Error(`Indicator value ${indicatorValueId} not found`);

    const allowed = [VALIDATION_STATUS.PENDING, VALIDATION_STATUS.FLAGGED];
    if (!allowed.includes(entry.validation_status)) {
      throw new Error(`Cannot reject entry with status: ${entry.validation_status}`);
    }

    await this._updateValidationStatus(indicatorValueId, VALIDATION_STATUS.REJECTED, rejectedBy, {
      reason,
      rejectedAt: new Date().toISOString(),
    });
    await this._writeAuditLog(indicatorValueId, 'rejected', rejectedBy, { reason });

    return { status: VALIDATION_STATUS.REJECTED, rejectedBy, reason };
  }

  // ── Audit Trail ───────────────────────────────────────────────────────────

  async getAuditTrail(indicatorValueId) {
    return this.db.queryMany(
      `SELECT * FROM validation_audit_log
       WHERE indicator_value_id = $1
       ORDER BY created_at ASC`,
      [indicatorValueId]
    );
  }

  // ── Quality Scoring ───────────────────────────────────────────────────────

  _computeQualityScore(checks) {
    if (!checks || checks.length === 0) return 100;
    const penalty = checks.reduce((acc, c) => {
      return acc + (QUALITY_PENALTIES[c.severity] || 0);
    }, 0);
    return Math.max(0, 100 - penalty);
  }

  getQualityLevel(score) {
    if (score >= QUALITY_THRESHOLDS.HIGH) return 'high';
    if (score >= QUALITY_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  // ── Automated Validation Checks ───────────────────────────────────────────

  async _runValidationChecks(entry) {
    const checks = await Promise.all([
      this._checkRequiredFields(entry),
      this._checkTemporalConsistency(entry),
      this._checkValueRange(entry),
      this._checkDuplicates(entry),
      this._checkStatisticalAnomaly(entry),
    ]);
    return checks.filter(Boolean);
  }

  async _checkRequiredFields(entry) {
    const required = [
      'value',
      'reporting_period_start',
      'reporting_period_end',
      'organizational_indicator_id',
    ];
    const missing = required.filter(
      f => entry[f] === null || entry[f] === undefined || entry[f] === ''
    );
    if (missing.length > 0) {
      return {
        check: 'required_fields',
        severity: 'error',
        message: `Missing required fields: ${missing.join(', ')}`,
        missingFields: missing,
      };
    }
    return { check: 'required_fields', severity: 'pass', message: 'All required fields present' };
  }

  async _checkTemporalConsistency(entry) {
    const start = new Date(entry.reporting_period_start);
    const end = new Date(entry.reporting_period_end);

    if (start > end) {
      return {
        check: 'temporal_consistency',
        severity: 'error',
        message: 'Period start date is after period end date',
      };
    }
    if (end > new Date()) {
      return {
        check: 'temporal_consistency',
        severity: 'warning',
        message: 'Reporting period end date is in the future',
      };
    }
    return { check: 'temporal_consistency', severity: 'pass', message: 'Temporal data is consistent' };
  }

  async _checkValueRange(entry) {
    const indicator = await this._fetchIndicatorDefinition(entry.organizational_indicator_id);
    if (!indicator) {
      return { check: 'value_range', severity: 'pass', message: 'Indicator definition not found — skipped' };
    }

    const value = parseFloat(entry.value);
    const min = parseFloat(indicator.min_value);
    const max = parseFloat(indicator.max_value);

    if (!isNaN(min) && value < min) {
      return {
        check: 'value_range',
        severity: 'error',
        message: `Value ${value} is below the minimum allowed value (${min})`,
      };
    }
    if (!isNaN(max) && value > max) {
      return {
        check: 'value_range',
        severity: 'warning',
        message: `Value ${value} exceeds the maximum expected value (${max})`,
      };
    }
    return { check: 'value_range', severity: 'pass', message: 'Value within expected range' };
  }

  async _checkDuplicates(entry) {
    const result = await this.db.queryOne(
      `SELECT COUNT(*) AS cnt FROM indicator_values
       WHERE organizational_indicator_id = $1
         AND project_id IS NOT DISTINCT FROM $2
         AND reporting_period_start = $3
         AND reporting_period_end = $4
         AND id != $5
         AND validation_status != 'rejected'`,
      [
        entry.organizational_indicator_id,
        entry.project_id,
        entry.reporting_period_start,
        entry.reporting_period_end,
        entry.id,
      ]
    );
    const count = parseInt(result?.cnt ?? 0, 10);
    if (count > 0) {
      return {
        check: 'duplicates',
        severity: 'error',
        message: `${count} duplicate entry(s) found for the same indicator and period`,
        duplicateCount: count,
      };
    }
    return { check: 'duplicates', severity: 'pass', message: 'No duplicates found' };
  }

  async _checkStatisticalAnomaly(entry) {
    const row = await this.db.queryOne(
      `SELECT AVG(value::numeric) AS avg, STDDEV(value::numeric) AS stddev
       FROM indicator_values
       WHERE organizational_indicator_id = $1
         AND validation_status = 'verified'
         AND id != $2`,
      [entry.organizational_indicator_id, entry.id]
    );

    const avg = parseFloat(row?.avg);
    const stddev = parseFloat(row?.stddev);

    if (isNaN(avg) || isNaN(stddev) || stddev === 0) {
      return {
        check: 'statistical_anomaly',
        severity: 'pass',
        message: 'Insufficient historical data for anomaly check',
      };
    }

    const value = parseFloat(entry.value);
    const zScore = Math.abs((value - avg) / stddev);

    if (zScore > 3) {
      return {
        check: 'statistical_anomaly',
        severity: 'warning',
        message: `Value is ${zScore.toFixed(1)}σ from historical mean (avg: ${avg.toFixed(2)})`,
        zScore: parseFloat(zScore.toFixed(2)),
      };
    }
    return { check: 'statistical_anomaly', severity: 'pass', message: 'No statistical anomaly detected' };
  }

  // ── DB Helpers ────────────────────────────────────────────────────────────

  async _fetchIndicatorValue(id) {
    return this.db.queryOne(`SELECT * FROM indicator_values WHERE id = $1`, [id]);
  }

  async _fetchIndicatorDefinition(organizationalIndicatorId) {
    return this.db.queryOne(
      `SELECT * FROM organizational_indicators WHERE id = $1`,
      [organizationalIndicatorId]
    );
  }

  async _updateValidationStatus(id, status, userId, metadata) {
    await this.db.query(
      `UPDATE indicator_values
       SET validation_status = $1,
           validated_by = $2,
           validation_metadata = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [status, userId, JSON.stringify(metadata), id]
    );
  }

  async _updateQualityScore(id, score, checks) {
    await this.db.query(
      `UPDATE indicator_values
       SET quality_score = $1,
           quality_checks = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [score, JSON.stringify(checks), id]
    );
  }

  async _writeAuditLog(indicatorValueId, action, userId, metadata = {}) {
    await this.db.query(
      `INSERT INTO validation_audit_log
         (indicator_value_id, action, performed_by, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [indicatorValueId, action, userId, JSON.stringify(metadata)]
    );
  }
}
