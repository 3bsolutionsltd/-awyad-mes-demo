/**
 * RBM Indicator Calculation Engine
 * Computes indicator values dynamically from indicator_values rows.
 * Does NOT store computed results — always derives on demand.
 *
 * Supported calculation types: SUM | COUNT | AVG | RATIO | PERCENTAGE | CUMULATIVE
 */

export const CALCULATION_TYPES = {
  SUM: 'SUM',
  COUNT: 'COUNT',
  AVG: 'AVG',
  RATIO: 'RATIO',
  PERCENTAGE: 'PERCENTAGE',
  CUMULATIVE: 'CUMULATIVE',
};

export class IndicatorEngine {
  /**
   * @param {import('../databaseService.js').default} db - databaseService singleton
   */
  constructor(db) {
    this.db = db;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Calculate a single organizational indicator.
   * @param {string} indicatorId - UUID
   * @param {{ periodStart?: string, periodEnd?: string, projectId?: string }} [options]
   */
  async calculateOrganizationalIndicator(indicatorId, options = {}) {
    const indicator = await this._fetchOrganizationalIndicator(indicatorId);
    if (!indicator) throw new Error(`Organizational indicator ${indicatorId} not found`);

    const values = await this._fetchIndicatorValues(indicatorId, options);
    return this._compute(indicator, values);
  }

  /**
   * Calculate a single project indicator.
   * @param {string} projectIndicatorId - UUID
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   */
  async calculateProjectIndicator(projectIndicatorId, options = {}) {
    const indicator = await this._fetchProjectIndicator(projectIndicatorId);
    if (!indicator) throw new Error(`Project indicator ${projectIndicatorId} not found`);

    const values = await this._fetchIndicatorValues(indicator.organizational_indicator_id, {
      ...options,
      projectId: indicator.project_id,
    });
    return this._compute(indicator, values);
  }

  /**
   * Batch calculate all active organizational indicators for a thematic area.
   * @param {string} thematicAreaId - UUID
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   * @returns {Promise<Array>}
   */
  async calculateThematicAreaIndicators(thematicAreaId, options = {}) {
    const indicators = await this._fetchIndicatorsByThematicArea(thematicAreaId);
    return Promise.all(
      indicators.map(ind =>
        this.calculateOrganizationalIndicator(ind.id, options).catch(err => ({
          indicatorId: ind.id,
          indicatorName: ind.name,
          resultLevel: ind.result_level,
          error: err.message,
          calculatedValue: null,
          achievementRate: null,
        }))
      )
    );
  }

  /**
   * Batch calculate all active project indicators for a project.
   * @param {string} projectId - UUID
   * @param {{ periodStart?: string, periodEnd?: string }} [options]
   * @returns {Promise<Array>}
   */
  async calculateProjectIndicators(projectId, options = {}) {
    const indicators = await this._fetchProjectIndicators(projectId);
    return Promise.all(
      indicators.map(pi =>
        this.calculateProjectIndicator(pi.id, options).catch(err => ({
          projectIndicatorId: pi.id,
          indicatorName: pi.name,
          error: err.message,
          calculatedValue: null,
          achievementRate: null,
        }))
      )
    );
  }

  // ── Core Computation ──────────────────────────────────────────────────────

  _compute(indicator, values) {
    const calcType = (indicator.calculation_type || 'SUM').toUpperCase();
    const numericValues = values
      .map(v => parseFloat(v.value))
      .filter(v => !isNaN(v));

    let calculatedValue = null;
    let breakdown = {};

    switch (calcType) {
      case CALCULATION_TYPES.SUM:
      case CALCULATION_TYPES.CUMULATIVE:
        calculatedValue = numericValues.reduce((a, b) => a + b, 0);
        if (calcType === CALCULATION_TYPES.CUMULATIVE) {
          breakdown = { periodCount: numericValues.length };
        }
        break;

      case CALCULATION_TYPES.COUNT:
        calculatedValue = values.filter(
          v => v.value !== null && v.value !== undefined && v.value !== ''
        ).length;
        break;

      case CALCULATION_TYPES.AVG:
        calculatedValue =
          numericValues.length > 0
            ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
            : 0;
        break;

      case CALCULATION_TYPES.RATIO: {
        const nums = values.filter(v => v.disaggregation_type === 'numerator');
        const dens = values.filter(v => v.disaggregation_type === 'denominator');
        const numerator = nums.reduce((a, v) => a + parseFloat(v.value || 0), 0);
        const denominator = dens.reduce((a, v) => a + parseFloat(v.value || 0), 0);
        calculatedValue = denominator !== 0 ? numerator / denominator : null;
        breakdown = { numerator, denominator };
        break;
      }

      case CALCULATION_TYPES.PERCENTAGE: {
        const achieved = numericValues.reduce((a, b) => a + b, 0);
        const target = parseFloat(indicator.target_value) || 1;
        calculatedValue = (achieved / target) * 100;
        breakdown = { achieved, target };
        break;
      }

      default:
        calculatedValue = numericValues.reduce((a, b) => a + b, 0);
    }

    const targetValue = parseFloat(indicator.target_value);
    const achievementRate =
      targetValue && targetValue > 0 && calculatedValue !== null
        ? Math.min((calculatedValue / targetValue) * 100, 999.99)
        : null;

    return {
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      resultLevel: indicator.result_level,
      calculationType: calcType,
      calculatedValue:
        calculatedValue !== null ? parseFloat(calculatedValue.toFixed(4)) : null,
      targetValue: isNaN(targetValue) ? null : targetValue,
      achievementRate:
        achievementRate !== null ? parseFloat(achievementRate.toFixed(2)) : null,
      dataPointCount: values.length,
      breakdown,
      computedAt: new Date().toISOString(),
    };
  }

  // ── DB Helpers ────────────────────────────────────────────────────────────

  async _fetchOrganizationalIndicator(id) {
    return this.db.queryOne(
      `SELECT oi.*, ta.name AS thematic_area_name, ta.core_program_component_id
       FROM organizational_indicators oi
       JOIN thematic_areas ta ON ta.id = oi.thematic_area_id
       WHERE oi.id = $1`,
      [id]
    );
  }

  async _fetchProjectIndicator(id) {
    return this.db.queryOne(
      `SELECT pi.*, oi.name, oi.calculation_type, oi.target_value,
              oi.thematic_area_id, oi.result_level
       FROM project_indicators pi
       JOIN organizational_indicators oi ON oi.id = pi.organizational_indicator_id
       WHERE pi.id = $1`,
      [id]
    );
  }

  async _fetchIndicatorValues(organizationalIndicatorId, filters = {}) {
    const conditions = [
      'iv.organizational_indicator_id = $1',
      "iv.validation_status != 'rejected'",
    ];
    const params = [organizationalIndicatorId];
    let idx = 2;

    if (filters.periodStart) {
      conditions.push(`iv.reporting_period_start >= $${idx++}`);
      params.push(filters.periodStart);
    }
    if (filters.periodEnd) {
      conditions.push(`iv.reporting_period_end <= $${idx++}`);
      params.push(filters.periodEnd);
    }
    if (filters.projectId) {
      conditions.push(`iv.project_id = $${idx++}`);
      params.push(filters.projectId);
    }

    return this.db.queryMany(
      `SELECT iv.*, p.name AS project_name
       FROM indicator_values iv
       LEFT JOIN projects p ON p.id = iv.project_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY iv.reporting_period_start ASC`,
      params
    );
  }

  async _fetchIndicatorsByThematicArea(thematicAreaId) {
    return this.db.queryMany(
      `SELECT * FROM organizational_indicators
       WHERE thematic_area_id = $1 AND is_active = TRUE
       ORDER BY result_level, name`,
      [thematicAreaId]
    );
  }

  async _fetchProjectIndicators(projectId) {
    return this.db.queryMany(
      `SELECT pi.*, oi.name, oi.calculation_type, oi.target_value, oi.result_level
       FROM project_indicators pi
       JOIN organizational_indicators oi ON oi.id = pi.organizational_indicator_id
       WHERE pi.project_id = $1 AND pi.is_active = TRUE`,
      [projectId]
    );
  }
}
