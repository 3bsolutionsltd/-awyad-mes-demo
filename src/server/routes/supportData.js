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

export default router;
