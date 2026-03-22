/**
 * Kobo Toolbox Webhook + Power BI Feed Routes
 *
 * Kobo:
 *   POST /api/v1/integrations/kobo/webhook     — receive Kobo REST Service push
 *   GET  /api/v1/integrations/kobo/submissions — list received submissions
 *   POST /api/v1/integrations/kobo/:id/map     — map a submission to an activity
 *
 * Power BI:
 *   GET  /api/v1/integrations/powerbi/activities — activity metrics feed (JSON)
 *   GET  /api/v1/integrations/powerbi/indicators — indicator performance feed
 *   GET  /api/v1/integrations/powerbi/projects   — project financial feed
 */
import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// ═══════════════════════════ KOBO TOOLBOX ═══════════════════════════════════

/**
 * POST /api/v1/integrations/kobo/webhook
 * Receives a Kobo REST-service push payload and stores it for review.
 * The X-Kobo-Signature header can be used for HMAC validation (optional but recommended).
 * See: https://support.kobotoolbox.org/rest_services.html
 */
router.post('/kobo/webhook', async (req, res, next) => {
    try {
        // Validate basic payload shape
        const payload = req.body;
        if (!payload || typeof payload !== 'object') {
            throw new AppError('Invalid Kobo payload', 400);
        }

        // Extract Kobo form id and submission uuid from common fields
        const formId  = String(payload._xform_id_string || payload.formhub?.uuid || 'unknown');
        const subUuid = payload._uuid || payload['_uuid'] || null;

        await databaseService.query(
            `INSERT INTO kobo_submissions (form_id, submission_uuid, payload)
             VALUES ($1, $2, $3)
             ON CONFLICT (submission_uuid) DO NOTHING`,
            [formId, subUuid, JSON.stringify(payload)]
        );

        // Respond immediately per Kobo spec (2xx within 5 s)
        res.status(200).json({ success: true, message: 'Submission received' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/integrations/kobo/submissions
 * List Kobo submissions with optional status filter
 */
router.get('/kobo/submissions', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { status, form_id, page = 1, limit = 50 } = req.query;

        const filters = [];
        const params = [];
        let i = 1;

        if (status)  { filters.push(`status = $${i++}`);  params.push(status); }
        if (form_id) { filters.push(`form_id = $${i++}`); params.push(form_id); }

        const where  = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const rows = await databaseService.query(
            `SELECT ks.*, a.activity_name AS mapped_activity_name
             FROM kobo_submissions ks
             LEFT JOIN activities a ON ks.mapped_to = a.id
             ${where}
             ORDER BY ks.received_at DESC
             LIMIT $${i++} OFFSET $${i++}`,
            params
        );

        const { total } = await databaseService.queryOne(
            `SELECT COUNT(*) AS total FROM kobo_submissions ${where}`,
            params.slice(0, -2)
        );

        res.json({
            success: true,
            data: {
                submissions: rows.rows,
                pagination: { page: +page, limit: +limit, total: +total }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/integrations/kobo/:id/map
 * Manually map a Kobo submission to an activity
 * Body: { activity_id: UUID }
 */
router.post('/kobo/:id/map', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { activity_id } = req.body;

        if (!activity_id) throw new AppError('activity_id is required', 400);

        const sub = await databaseService.queryOne(
            'SELECT id FROM kobo_submissions WHERE id = $1',
            [id]
        );
        if (!sub) throw new AppError('Kobo submission not found', 404);

        const activity = await databaseService.queryOne(
            'SELECT id, is_locked FROM activities WHERE id = $1',
            [activity_id]
        );
        if (!activity) throw new AppError('Activity not found', 404);
        if (activity.is_locked) throw new AppError('Activity is locked', 403);

        const updated = await databaseService.queryOne(
            `UPDATE kobo_submissions
             SET mapped_to = $1, status = 'mapped', processed_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [activity_id, id]
        );

        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// ════════════════════════════ POWER BI FEED ══════════════════════════════════
// These endpoints return flat JSON suitable for Power BI "Web" connector.
// Use: Home → Get Data → Web → URL: http://host/api/v1/integrations/powerbi/...
// Authentication: pass Bearer token in custom header or use API token.

/**
 * GET /api/v1/integrations/powerbi/activities
 * Flat activity metrics for Power BI
 */
router.get('/powerbi/activities', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const rows = await databaseService.query(
            `SELECT
                a.id,
                a.activity_name,
                a.status,
                a.planned_date,
                a.completion_date,
                a.location,
                a.latitude,
                a.longitude,
                a.beneficiary_id,
                a.total_beneficiaries,
                a.pwds_male + a.pwds_female + a.pwds_other AS total_pwd,
                a.budget,
                a.actual_cost,
                a.currency,
                CASE WHEN a.budget > 0 THEN ROUND(a.actual_cost / a.budget * 100, 2) ELSE 0 END AS budget_utilization_pct,
                a.is_locked,
                p.name  AS project_name,
                i.name  AS indicator_name,
                ta.name AS thematic_area,
                a.created_at,
                a.updated_at
             FROM activities a
             LEFT JOIN projects p        ON a.project_id      = p.id
             LEFT JOIN indicators i      ON a.indicator_id    = i.id
             LEFT JOIN thematic_areas ta ON a.thematic_area_id = ta.id
             ORDER BY a.planned_date DESC`,
            []
        );
        res.json({ success: true, count: rows.rows.length, data: rows.rows });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/integrations/powerbi/indicators
 * Indicator performance for Power BI
 */
router.get('/powerbi/indicators', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const rows = await databaseService.query(
            `SELECT
                i.id,
                i.name AS indicator_name,
                i.indicator_scope,
                i.baseline_value,
                i.target_value,
                i.current_value,
                CASE WHEN i.target_value > 0
                     THEN ROUND(i.current_value::NUMERIC / i.target_value * 100, 2)
                     ELSE 0 END AS achievement_pct,
                i.unit_of_measurement,
                i.reporting_frequency,
                p.name AS project_name,
                i.created_at
             FROM indicators i
             LEFT JOIN projects p ON i.project_id = p.id
             ORDER BY i.name`,
            []
        );
        res.json({ success: true, count: rows.rows.length, data: rows.rows });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/integrations/powerbi/projects
 * Project financial & status summary for Power BI
 */
router.get('/powerbi/projects', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const rows = await databaseService.query(
            `SELECT
                p.id,
                p.name,
                p.status,
                p.start_date,
                p.end_date,
                p.budget,
                p.expenditure,
                CASE WHEN p.budget > 0 THEN ROUND(p.expenditure / p.budget * 100, 2) ELSE 0 END AS burn_rate_pct,
                p.donor,
                p.location,
                COUNT(DISTINCT a.id)  AS total_activities,
                COUNT(DISTINCT i.id)  AS total_indicators,
                SUM(a.total_beneficiaries) AS total_beneficiaries
             FROM projects p
             LEFT JOIN activities a ON a.project_id = p.id
             LEFT JOIN indicators i ON i.project_id = p.id
             GROUP BY p.id
             ORDER BY p.start_date DESC`,
            []
        );
        res.json({ success: true, count: rows.rows.length, data: rows.rows });
    } catch (error) {
        next(error);
    }
});

export default router;
