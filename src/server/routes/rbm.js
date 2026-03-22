/**
 * RBM API Routes
 * All routes are under /api/v1/rbm/ — NO existing routes are modified.
 * Requires valid JWT (authenticate middleware).
 */

import express from 'express';
import { IndicatorEngine } from '../services/rbm/indicatorEngine.js';
import { AggregationEngine } from '../services/rbm/aggregationEngine.js';
import { ValidationEngine, VALIDATION_STATUS } from '../services/rbm/validationEngine.js';
import { authenticate, checkAnyRole } from '../middleware/auth.js';
import databaseService from '../services/databaseService.js';

const router = express.Router();

// All RBM routes require a valid JWT
router.use(authenticate);

// Lazy-initialise engines (db pool ready by the time first request arrives)
let _indicatorEngine = null;
let _aggregationEngine = null;
let _validationEngine = null;

function engines() {
  if (!_indicatorEngine) _indicatorEngine = new IndicatorEngine(databaseService);
  if (!_aggregationEngine) _aggregationEngine = new AggregationEngine(databaseService);
  if (!_validationEngine) _validationEngine = new ValidationEngine(databaseService);
  return {
    indicator: _indicatorEngine,
    aggregation: _aggregationEngine,
    validation: _validationEngine,
  };
}

// ── Dashboard Summary ─────────────────────────────────────────────────────

/**
 * GET /api/v1/rbm/dashboard/summary
 * Returns pillar count, pending validation count, and recent activity.
 */
router.get('/dashboard/summary', async (req, res) => {
  try {
    const [pillarsResult, pendingResult, recentResult] = await Promise.all([
      databaseService.query(
        `SELECT DISTINCT core_program_component_id AS id
         FROM thematic_areas
         WHERE core_program_component_id IS NOT NULL`
      ),
      databaseService.query(
        `SELECT COUNT(*) AS cnt FROM indicator_values WHERE validation_status = 'pending'`
      ),
      databaseService.query(
        `SELECT iv.id, oi.name AS indicator_name, p.name AS project_name,
                iv.value, iv.validation_status, iv.created_at
         FROM indicator_values iv
         JOIN organizational_indicators oi ON oi.id = iv.organizational_indicator_id
         LEFT JOIN projects p ON p.id = iv.project_id
         ORDER BY iv.created_at DESC
         LIMIT 20`
      ),
    ]);

    res.json({
      success: true,
      data: {
        pillarCount: pillarsResult.rows.length,
        pendingValidations: parseInt(pendingResult.rows[0]?.cnt ?? 0, 10),
        recentActivity: recentResult.rows,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Indicator Calculation ─────────────────────────────────────────────────

/**
 * GET /api/v1/rbm/indicators/organizational/:id/calculate
 * Query params: periodStart, periodEnd, projectId
 */
router.get('/indicators/organizational/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd, projectId } = req.query;
    const result = await engines().indicator.calculateOrganizationalIndicator(id, {
      periodStart,
      periodEnd,
      projectId,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/indicators/project/:id/calculate
 * Query params: periodStart, periodEnd
 */
router.get('/indicators/project/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    const result = await engines().indicator.calculateProjectIndicator(id, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/thematic-areas/:id/indicators/calculate
 */
router.get('/thematic-areas/:id/indicators/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    const results = await engines().indicator.calculateThematicAreaIndicators(id, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/projects/:id/indicators/calculate
 */
router.get('/projects/:id/indicators/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    const results = await engines().indicator.calculateProjectIndicators(id, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Aggregation ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/rbm/aggregation/pillar/:pillarId
 */
router.get('/aggregation/pillar/:pillarId', async (req, res) => {
  try {
    const { pillarId } = req.params;
    const { periodStart, periodEnd } = req.query;
    const result = await engines().aggregation.aggregateByStrategicPillar(pillarId, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/aggregation/thematic-area/:id
 */
router.get('/aggregation/thematic-area/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    const result = await engines().aggregation.aggregateByThematicArea(id, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/aggregation/project/:id
 */
router.get('/aggregation/project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodStart, periodEnd } = req.query;
    const result = await engines().aggregation.aggregateByProject(id, {
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/aggregation/time-series/:indicatorId
 * Query params: granularity (monthly|quarterly|annual), startYear, endYear
 */
router.get('/aggregation/time-series/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params;
    const {
      granularity = 'monthly',
      startYear,
      endYear,
    } = req.query;
    const result = await engines().aggregation.generateTimeSeries(
      indicatorId,
      granularity,
      {
        startYear: startYear ? parseInt(startYear, 10) : undefined,
        endYear: endYear ? parseInt(endYear, 10) : undefined,
      }
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/reports/donor
 * Body: { pillarIds, thematicAreaIds, periodStart, periodEnd }
 */
router.post('/reports/donor', async (req, res) => {
  try {
    const { pillarIds, thematicAreaIds, periodStart, periodEnd } = req.body;
    const report = await engines().aggregation.buildDonorReport({
      pillarIds: Array.isArray(pillarIds) ? pillarIds : [],
      thematicAreaIds: Array.isArray(thematicAreaIds) ? thematicAreaIds : [],
      periodStart,
      periodEnd,
    });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Indicator Values (direct entry) ──────────────────────────────────────

/**
 * GET /api/v1/rbm/indicator-values/:id
 * Retrieve a single indicator value entry (used by validation UI).
 */
router.get('/indicator-values/:id', async (req, res) => {
  try {
    const row = await databaseService.queryOne(
      `SELECT iv.*,
              oi.name AS indicator_name,
              p.name  AS project_name
       FROM indicator_values iv
       JOIN organizational_indicators oi ON oi.id = iv.organizational_indicator_id
       LEFT JOIN projects p ON p.id = iv.project_id
       WHERE iv.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: 'Entry not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/indicator-values
 * Submit a new indicator value (status starts as 'pending').
 * Body: { organizational_indicator_id, project_id?, activity_id?, value,
 *         reporting_period_start, reporting_period_end, notes?, data_source? }
 */
router.post('/indicator-values', async (req, res) => {
  try {
    const {
      organizational_indicator_id,
      project_id,
      activity_id,
      value,
      disaggregation_type,
      disaggregation_value,
      reporting_period_start,
      reporting_period_end,
      notes,
      data_source,
      collection_method,
    } = req.body;

    // Basic server-side validation
    if (!organizational_indicator_id || value === undefined || value === null) {
      return res.status(400).json({ success: false, error: 'organizational_indicator_id and value are required' });
    }
    if (!reporting_period_start || !reporting_period_end) {
      return res.status(400).json({ success: false, error: 'reporting_period_start and reporting_period_end are required' });
    }

    const userId = req.user?.userId ?? req.user?.id ?? null;

    const result = await databaseService.queryOne(
      `INSERT INTO indicator_values
         (organizational_indicator_id, project_id, activity_id, value,
          disaggregation_type, disaggregation_value,
          reporting_period_start, reporting_period_end,
          notes, data_source, collection_method,
          validation_status, entered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12)
       RETURNING *`,
      [
        organizational_indicator_id,
        project_id ?? null,
        activity_id ?? null,
        value,
        disaggregation_type ?? null,
        disaggregation_value ?? null,
        reporting_period_start,
        reporting_period_end,
        notes ?? null,
        data_source ?? null,
        collection_method ?? null,
        userId,
      ]
    );

    // Run auto-validation checks
    const validationResult = await engines().validation
      .submitForValidation(result.id, userId)
      .catch(() => ({ status: 'pending' }));

    res.status(201).json({
      success: true,
      data: { ...result, validationStatus: validationResult.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Validation Workflow ───────────────────────────────────────────────────

/**
 * POST /api/v1/rbm/validation/:id/submit
 */
router.post('/validation/:id/submit', async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    const result = await engines().validation.submitForValidation(req.params.id, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/validation/:id/verify
 * Body: { notes? }
 * Requires: admin or manager role
 */
router.post('/validation/:id/verify', checkAnyRole(['admin', 'manager']), async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    const { notes } = req.body;
    const result = await engines().validation.verify(req.params.id, userId, notes);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/validation/:id/reject
 * Body: { reason }
 * Requires: admin or manager role
 */
router.post('/validation/:id/reject', checkAnyRole(['admin', 'manager']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }
    const userId = req.user?.userId ?? req.user?.id;
    const result = await engines().validation.reject(req.params.id, userId, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/validation/:id/audit
 */
router.get('/validation/:id/audit', async (req, res) => {
  try {
    const trail = await engines().validation.getAuditTrail(req.params.id);
    res.json({ success: true, data: trail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Organizational Indicators CRUD ───────────────────────────────────────

/**
 * GET /api/v1/rbm/organizational-indicators
 * Query params: thematicAreaId, resultLevel, isActive, dataType, indicatorLevel
 */
router.get('/organizational-indicators', async (req, res) => {
  try {
    const { thematicAreaId, resultLevel, isActive, dataType, indicatorLevel } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (thematicAreaId) { conditions.push(`oi.thematic_area_id = $${idx++}`); params.push(thematicAreaId); }
    if (resultLevel)    { conditions.push(`oi.result_level = $${idx++}`);      params.push(resultLevel); }
    if (dataType)       { conditions.push(`oi.data_type = $${idx++}`);         params.push(dataType); }
    if (indicatorLevel) { conditions.push(`oi.indicator_level = $${idx++}`);   params.push(indicatorLevel); }
    if (isActive !== undefined) {
      conditions.push(`oi.is_active = $${idx++}`);
      params.push(isActive === 'true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await databaseService.queryMany(
      `SELECT oi.*,
              ta.name AS thematic_area_name
       FROM organizational_indicators oi
       JOIN thematic_areas ta ON ta.id = oi.thematic_area_id
       ${where}
       ORDER BY oi.result_level, oi.name`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/organizational-indicators
 * Create a new organizational indicator.
 * Body: { name, description?, thematic_area_id, result_level, calculation_type?,
 *         unit_of_measure?, target_value?, baseline_value?, baseline_year?,
 *         data_type?, indicator_level?, reporting_frequency?, disaggregation_types?,
 *         data_source?, collection_method?, responsible_team? }
 */
router.post('/organizational-indicators', async (req, res) => {
  try {
    const {
      name, description, thematic_area_id, result_level,
      calculation_type = 'SUM', unit_of_measure,
      target_value, baseline_value, baseline_year,
      data_type = 'number', indicator_level,
      min_value, max_value,
      disaggregation_types = [],
      reporting_frequency = 'quarterly',
      data_source, collection_method, responsible_team,
    } = req.body;

    if (!name || !thematic_area_id || !result_level) {
      return res.status(400).json({
        success: false,
        error: 'name, thematic_area_id, and result_level are required',
      });
    }

    const userId = req.user?.userId ?? req.user?.id ?? null;
    const row = await databaseService.queryOne(
      `INSERT INTO organizational_indicators
         (name, description, thematic_area_id, result_level, calculation_type,
          unit_of_measure, target_value, baseline_value, baseline_year,
          data_type, indicator_level, min_value, max_value,
          disaggregation_types, reporting_frequency,
          data_source, collection_method, responsible_team,
          is_active, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true,$19,$19)
       RETURNING *`,
      [
        name, description ?? null, thematic_area_id, result_level, calculation_type,
        unit_of_measure ?? null, target_value ?? null, baseline_value ?? null, baseline_year ?? null,
        data_type, indicator_level ?? null, min_value ?? null, max_value ?? null,
        JSON.stringify(disaggregation_types), reporting_frequency,
        data_source ?? null, collection_method ?? null, responsible_team ?? null,
        userId,
      ]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/rbm/organizational-indicators/:id
 * Retrieve a single organizational indicator by ID.
 */
router.get('/organizational-indicators/:id', async (req, res) => {
  try {
    const row = await databaseService.queryOne(
      `SELECT oi.*, ta.name AS thematic_area_name
       FROM organizational_indicators oi
       JOIN thematic_areas ta ON ta.id = oi.thematic_area_id
       WHERE oi.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: 'Indicator not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/rbm/organizational-indicators/:id
 * Update an existing organizational indicator (partial update supported).
 */
router.put('/organizational-indicators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      'name', 'description', 'thematic_area_id', 'result_level', 'calculation_type',
      'unit_of_measure', 'target_value', 'baseline_value', 'baseline_year',
      'data_type', 'indicator_level', 'min_value', 'max_value',
      'disaggregation_types', 'reporting_frequency',
      'data_source', 'collection_method', 'responsible_team', 'is_active',
    ];
    const updates = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates.push(`${key} = $${idx++}`);
        params.push(key === 'disaggregation_types' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const userId = req.user?.userId ?? req.user?.id ?? null;
    updates.push(`updated_by = $${idx++}`, `updated_at = NOW()`);
    params.push(userId, id);

    const row = await databaseService.queryOne(
      `UPDATE organizational_indicators SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      params
    );
    if (!row) return res.status(404).json({ success: false, error: 'Indicator not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/v1/rbm/organizational-indicators/:id
 * Soft-delete (sets is_active = false) to preserve audit trail.
 */
router.delete('/organizational-indicators/:id', async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    const row = await databaseService.queryOne(
      `UPDATE organizational_indicators
       SET is_active = false, updated_by = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, is_active`,
      [userId, req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, error: 'Indicator not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Project Indicators (list for dashboard) ───────────────────────────────

/**
 * GET /api/v1/rbm/project-indicators
 * Query params: projectId (required)
 * Returns list of project indicators with latest actual values and achievement rate.
 * Thematic Area = org level; Result Area = project level.
 */
router.get('/project-indicators', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const rows = await databaseService.queryMany(
      `SELECT
         pi.id,
         oi.name,
         oi.result_level,
         oi.data_type,
         oi.unit_of_measure,
         oi.indicator_level,
         COALESCE(pi.project_target_value, oi.target_value) AS target_value,
         COALESCE(pi.project_baseline_value, oi.baseline_value) AS baseline_value,
         ra.name AS result_area_name,
         ta.name AS thematic_area_name,
         -- sum of reported values as actualValue
         (SELECT COALESCE(SUM(iv.value), 0)
          FROM indicator_values iv
          WHERE iv.organizational_indicator_id = oi.id
            AND iv.project_id = pi.project_id
            AND iv.validation_status != 'rejected') AS "actualValue",
         -- achievement rate  
         CASE
           WHEN COALESCE(pi.project_target_value, oi.target_value) > 0 THEN
             LEAST(
               ROUND(
                 (SELECT COALESCE(SUM(iv.value), 0)
                  FROM indicator_values iv
                  WHERE iv.organizational_indicator_id = oi.id
                    AND iv.project_id = pi.project_id
                    AND iv.validation_status != 'rejected')
                 / COALESCE(pi.project_target_value, oi.target_value) * 100,
               2),
             999.99)
           ELSE NULL
         END AS "achievementRate"
       FROM project_indicators pi
       JOIN organizational_indicators oi ON oi.id = pi.organizational_indicator_id
       JOIN thematic_areas ta ON ta.id = oi.thematic_area_id
       LEFT JOIN result_areas ra ON ra.id = pi.result_area_id
       WHERE pi.project_id = $1
         AND pi.is_active = TRUE
       ORDER BY oi.result_level, oi.name`,
      [projectId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Strategy Hierarchy ────────────────────────────────────────────────────

/**
 * GET /api/v1/rbm/strategy-tree
 * Returns the full strategy → pillar → core-program-component → thematic-area hierarchy.
 */
router.get('/strategy-tree', async (req, res) => {
  try {
    const rows = await databaseService.queryMany(
      `SELECT
         s.id              AS strategy_id,
         s.code            AS strategy_code,
         s.name            AS strategy_name,
         s.description     AS strategy_description,
         s.is_active       AS strategy_active,
         p.id              AS pillar_id,
         p.code            AS pillar_code,
         p.name            AS pillar_name,
         p.description     AS pillar_description,
         p.is_active       AS pillar_active,
         c.id              AS cpc_id,
         c.code            AS cpc_code,
         c.name            AS cpc_name,
         c.description     AS cpc_description,
         c.interventions   AS cpc_interventions,
         c.is_active       AS cpc_active,
         t.id              AS ta_id,
         t.code            AS ta_code,
         t.name            AS ta_name,
         t.description     AS ta_description,
         t.is_active       AS ta_active
       FROM strategies s
       LEFT JOIN pillars p ON p.strategy_id = s.id AND p.is_active = TRUE
       LEFT JOIN core_program_components c ON c.pillar_id = p.id AND c.is_active = TRUE
       LEFT JOIN thematic_areas t ON t.core_program_component_id = c.id AND t.is_active = TRUE
       WHERE s.is_active = TRUE
       ORDER BY s.code, p.display_order, c.display_order, t.name`,
      []
    );

    // Build nested tree
    const stratMap = new Map();
    for (const r of rows) {
      if (!stratMap.has(r.strategy_id)) {
        stratMap.set(r.strategy_id, {
          id: r.strategy_id, code: r.strategy_code, name: r.strategy_name,
          description: r.strategy_description, pillars: new Map(),
        });
      }
      if (!r.pillar_id) continue;
      const strat = stratMap.get(r.strategy_id);
      if (!strat.pillars.has(r.pillar_id)) {
        strat.pillars.set(r.pillar_id, {
          id: r.pillar_id, code: r.pillar_code, name: r.pillar_name,
          description: r.pillar_description, components: new Map(),
        });
      }
      if (!r.cpc_id) continue;
      const pillar = strat.pillars.get(r.pillar_id);
      if (!pillar.components.has(r.cpc_id)) {
        pillar.components.set(r.cpc_id, {
          id: r.cpc_id, code: r.cpc_code, name: r.cpc_name,
          description: r.cpc_description, interventions: r.cpc_interventions,
          thematicAreas: [],
        });
      }
      if (!r.ta_id) continue;
      const cpc = pillar.components.get(r.cpc_id);
      if (!cpc.thematicAreas.find(t => t.id === r.ta_id)) {
        cpc.thematicAreas.push({ id: r.ta_id, code: r.ta_code, name: r.ta_name, description: r.ta_description });
      }
    }

    // Serialize Maps to arrays
    const tree = Array.from(stratMap.values()).map(s => ({
      ...s,
      pillars: Array.from(s.pillars.values()).map(p => ({
        ...p,
        components: Array.from(p.components.values()),
      })),
    }));

    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Result Areas ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/rbm/result-areas
 * Query params: projectId
 */
router.get('/result-areas', async (req, res) => {
  try {
    const { projectId } = req.query;
    const rows = await databaseService.queryMany(
      `SELECT ra.*, p.name AS project_name
       FROM result_areas ra
       LEFT JOIN projects p ON p.id = ra.project_id
       WHERE ra.is_active = true
         ${projectId ? 'AND ra.project_id = $1' : ''}
       ORDER BY p.name, ra.name`,
      projectId ? [projectId] : []
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/rbm/result-areas
 * Body: { name, description?, project_id? }
 */
router.post('/result-areas', async (req, res) => {
  try {
    const { name, description, project_id } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name is required' });

    const userId = req.user?.userId ?? req.user?.id ?? null;
    const row = await databaseService.queryOne(
      `INSERT INTO result_areas (name, description, project_id, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description ?? null, project_id ?? null, userId]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
