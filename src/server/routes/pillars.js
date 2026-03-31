import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createPillarSchema = Joi.object({
    strategy_id: Joi.string().uuid().required(),
    name: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true)
});

const updatePillarSchema = Joi.object({
    strategy_id: Joi.string().uuid(),
    name: Joi.string().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
}).min(1);

/**
 * GET /api/v1/pillars
 * List all pillars with optional filtering
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { strategy_id, is_active, include_inactive = 'false' } = req.query;

        let query = `
            SELECT 
                p.*,
                s.name as strategy_name,
                (SELECT COUNT(*) FROM core_program_components WHERE pillar_id = p.id) as component_count,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name, 'code', c.code) ORDER BY c.display_order, c.name)
                     FROM core_program_components c
                     WHERE c.pillar_id = p.id AND c.is_active = true),
                    '[]'::json
                ) as components,
                u.username as created_by_username
            FROM pillars p
            LEFT JOIN strategies s ON p.strategy_id = s.id
            LEFT JOIN users u ON p.created_by = u.id
        `;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (strategy_id) {
            filters.push(`p.strategy_id = $${paramIndex++}`);
            params.push(strategy_id);
        }

        // Filter by active status (default: show only active)
        if (include_inactive === 'false') {
            filters.push(`p.is_active = true`);
        } else if (is_active) {
            filters.push(`p.is_active = $${paramIndex++}`);
            params.push(is_active === 'true');
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }

        query += ` ORDER BY p.display_order ASC, p.name ASC`;

        const pillars = await databaseService.queryMany(query, params);

        res.json({
            success: true,
            data: pillars,
            count: pillars.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/pillars/:id
 * Get a single pillar by ID with its components
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const pillar = await databaseService.queryOne(
            `SELECT 
                p.*,
                s.name as strategy_name,
                s.id as strategy_id,
                (SELECT COUNT(*) FROM core_program_components WHERE pillar_id = p.id) as component_count,
                u.username as created_by_username
            FROM pillars p
            LEFT JOIN strategies s ON p.strategy_id = s.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = $1`,
            [id]
        );

        if (!pillar) {
            throw new AppError('Pillar not found', 404);
        }

        // Get components for this pillar
        const components = await databaseService.query(
            `SELECT 
                c.*,
                (SELECT COUNT(*) FROM projects WHERE core_program_component_id = c.id) as project_count
            FROM core_program_components c
            WHERE c.pillar_id = $1
            ORDER BY c.display_order ASC, c.name ASC`,
            [id]
        );

        pillar.components = components;

        res.json({
            success: true,
            data: pillar
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/pillars
 * Create a new pillar
 */
router.post('/', authenticate, checkPermission('pillars.create'), async (req, res, next) => {
    try {
        const { error, value } = createPillarSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const { strategy_id, name, description, code, display_order, is_active } = value;

        // Verify strategy exists
        const strategy = await databaseService.queryOne(
            'SELECT id FROM strategies WHERE id = $1',
            [strategy_id]
        );

        if (!strategy) {
            throw new AppError('Strategy not found', 404);
        }

        const pillar = await databaseService.queryOne(
            `INSERT INTO pillars (strategy_id, name, description, code, display_order, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [strategy_id, name, description, code, display_order, is_active, req.user.id]
        );

        res.status(201).json({
            success: true,
            data: pillar,
            message: 'Pillar created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/pillars/:id
 * Update an existing pillar
 */
router.put('/:id', authenticate, checkPermission('pillars.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updatePillarSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if pillar exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM pillars WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Pillar not found', 404);
        }

        // If updating strategy_id, verify new strategy exists
        if (value.strategy_id) {
            const strategy = await databaseService.queryOne(
                'SELECT id FROM strategies WHERE id = $1',
                [value.strategy_id]
            );

            if (!strategy) {
                throw new AppError('Strategy not found', 404);
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(value).forEach(key => {
            updates.push(`${key} = $${paramIndex++}`);
            params.push(value[key]);
        });

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE pillars
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const pillar = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            data: pillar,
            message: 'Pillar updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/pillars/:id
 * Delete a pillar (soft delete by setting is_active to false)
 */
router.delete('/:id', authenticate, checkPermission('pillars.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permanent = 'false' } = req.query;

        // Check if pillar exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM pillars WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Pillar not found', 404);
        }

        // Check if pillar has components
        const { count } = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM core_program_components WHERE pillar_id = $1',
            [id]
        );

        if (count > 0 && permanent === 'true') {
            throw new AppError('Cannot delete pillar with associated components', 400);
        }

        if (permanent === 'true') {
            // Hard delete
            await databaseService.query('DELETE FROM pillars WHERE id = $1', [id]);
            res.json({
                success: true,
                message: 'Pillar permanently deleted'
            });
        } else {
            // Soft delete
            await databaseService.query(
                'UPDATE pillars SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );
            res.json({
                success: true,
                message: 'Pillar deactivated successfully'
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/pillars/:id/reorder
 * Reorder pillars within a strategy
 */
router.post('/:id/reorder', authenticate, checkPermission('pillars.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_order } = req.body;

        if (typeof new_order !== 'number' || new_order < 0) {
            throw new AppError('Invalid order value', 400);
        }

        await databaseService.query(
            'UPDATE pillars SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [new_order, id]
        );

        res.json({
            success: true,
            message: 'Pillar order updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
