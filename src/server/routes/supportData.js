import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/support-data/districts
 * Return all active district configs
 */
router.get('/districts', authenticate, async (req, res, next) => {
    try {
        const result = await databaseService.query(
            `SELECT id, config_code AS code, config_value AS name, display_order
             FROM system_configurations
             WHERE config_type = 'district' AND is_active = TRUE
             ORDER BY display_order, config_value`,
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/support-data/settlements/:districtId
 * Return settlements whose parent_id = districtId
 */
router.get('/settlements/:districtId', authenticate, async (req, res, next) => {
    try {
        const { districtId } = req.params;
        const result = await databaseService.query(
            `SELECT id, config_code AS code, config_value AS name, parent_id, display_order
             FROM system_configurations
             WHERE config_type = 'settlement' AND parent_id = $1 AND is_active = TRUE
             ORDER BY display_order, config_value`,
            [districtId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/support-data/age-groups
 * Return all active age group configs
 */
router.get('/age-groups', authenticate, async (req, res, next) => {
    try {
        const result = await databaseService.query(
            `SELECT id, config_code AS code, config_value AS name, display_order
             FROM system_configurations
             WHERE config_type = 'age_group' AND is_active = TRUE
             ORDER BY display_order, config_value`,
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/support-data/nationalities
 * Return all active nationality configs
 */
router.get('/nationalities', authenticate, async (req, res, next) => {
    try {
        const result = await databaseService.query(
            `SELECT id, config_code AS code, config_value AS name, display_order
             FROM system_configurations
             WHERE config_type = 'nationality' AND is_active = TRUE
             ORDER BY display_order, config_value`,
            []
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/support-data/config-items
 * Return all config items of a given type (query: ?type=district|settlement|nationality|age_group)
 * Includes inactive items for management UI
 */
router.get('/config-items', authenticate, async (req, res, next) => {
    try {
        const { type, parent_id } = req.query;
        const conditions = [];
        const params = [];
        if (type) { params.push(type); conditions.push(`config_type = $${params.length}`); }
        if (parent_id) { params.push(parent_id); conditions.push(`parent_id = $${params.length}`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await databaseService.query(
            `SELECT id, config_type, config_code AS code, config_value AS name, parent_id,
                    is_active, display_order, description
             FROM system_configurations
             ${where}
             ORDER BY config_type, display_order, config_value`,
            params
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/support-data/config-items
 * Create a new config item
 */
router.post('/config-items', authenticate, async (req, res, next) => {
    try {
        const { config_type, config_code, config_value, parent_id, description, display_order } = req.body;
        if (!config_type || !config_value) {
            return res.status(400).json({ success: false, message: 'config_type and config_value are required' });
        }
        const result = await databaseService.queryOne(
            `INSERT INTO system_configurations (config_type, config_code, config_value, parent_id, description, display_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE)
             RETURNING id, config_type, config_code AS code, config_value AS name, parent_id, is_active, display_order, description`,
            [config_type, config_code || null, config_value, parent_id || null, description || null, display_order ?? 0]
        );
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/v1/support-data/config-items/:id
 * Update a config item
 */
router.put('/config-items/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { config_code, config_value, description, display_order, is_active } = req.body;
        const result = await databaseService.queryOne(
            `UPDATE system_configurations
             SET config_code    = COALESCE($1, config_code),
                 config_value   = COALESCE($2, config_value),
                 description    = COALESCE($3, description),
                 display_order  = COALESCE($4, display_order),
                 is_active      = COALESCE($5, is_active),
                 updated_at     = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id, config_type, config_code AS code, config_value AS name, parent_id, is_active, display_order, description`,
            [config_code ?? null, config_value ?? null, description ?? null, display_order ?? null, is_active ?? null, id]
        );
        if (!result) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/v1/support-data/config-items/:id
 * Soft-delete (deactivate) a config item
 */
router.delete('/config-items/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        await databaseService.query(
            `UPDATE system_configurations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

export default router;
