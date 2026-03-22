import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createStrategySchema = Joi.object({
    name: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true)
});

const updateStrategySchema = Joi.object({
    name: Joi.string().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
}).min(1);

/**
 * GET /api/v1/strategies
 * List all strategies with optional filtering
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { is_active, include_inactive = 'false' } = req.query;

        let query = `
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM pillars WHERE strategy_id = s.id) as pillar_count,
                u.username as created_by_username
            FROM strategies s
            LEFT JOIN users u ON s.created_by = u.id
        `;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        // Filter by active status (default: show only active)
        if (include_inactive === 'false') {
            filters.push(`s.is_active = true`);
        } else if (is_active) {
            filters.push(`s.is_active = $${paramIndex++}`);
            params.push(is_active === 'true');
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }

        query += ` ORDER BY s.display_order ASC, s.name ASC`;

        const strategies = await databaseService.query(query, params);

        res.json({
            success: true,
            data: strategies,
            count: strategies.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/strategies/:id
 * Get a single strategy by ID with its pillars
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const strategy = await databaseService.queryOne(
            `SELECT 
                s.*,
                (SELECT COUNT(*) FROM pillars WHERE strategy_id = s.id) as pillar_count,
                u.username as created_by_username
            FROM strategies s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.id = $1`,
            [id]
        );

        if (!strategy) {
            throw new AppError('Strategy not found', 404);
        }

        // Get pillars for this strategy
        const pillars = await databaseService.query(
            `SELECT 
                p.*,
                (SELECT COUNT(*) FROM core_program_components WHERE pillar_id = p.id) as component_count
            FROM pillars p
            WHERE p.strategy_id = $1
            ORDER BY p.display_order ASC, p.name ASC`,
            [id]
        );

        strategy.pillars = pillars;

        res.json({
            success: true,
            data: strategy
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/strategies
 * Create a new strategy
 */
router.post('/', authenticate, checkPermission('strategies.create'), async (req, res, next) => {
    try {
        const { error, value } = createStrategySchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const { name, description, code, display_order, is_active } = value;

        const strategy = await databaseService.queryOne(
            `INSERT INTO strategies (name, description, code, display_order, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [name, description, code, display_order, is_active, req.user.id]
        );

        res.status(201).json({
            success: true,
            data: strategy,
            message: 'Strategy created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/strategies/:id
 * Update an existing strategy
 */
router.put('/:id', authenticate, checkPermission('strategies.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateStrategySchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if strategy exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM strategies WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Strategy not found', 404);
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
            UPDATE strategies
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const strategy = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            data: strategy,
            message: 'Strategy updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/strategies/:id
 * Delete a strategy (soft delete by setting is_active to false)
 */
router.delete('/:id', authenticate, checkPermission('strategies.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permanent = 'false' } = req.query;

        // Check if strategy exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM strategies WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Strategy not found', 404);
        }

        // Check if strategy has pillars
        const { count } = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM pillars WHERE strategy_id = $1',
            [id]
        );

        if (count > 0 && permanent === 'true') {
            throw new AppError('Cannot delete strategy with associated pillars', 400);
        }

        if (permanent === 'true') {
            // Hard delete
            await databaseService.query('DELETE FROM strategies WHERE id = $1', [id]);
            res.json({
                success: true,
                message: 'Strategy permanently deleted'
            });
        } else {
            // Soft delete
            await databaseService.query(
                'UPDATE strategies SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );
            res.json({
                success: true,
                message: 'Strategy deactivated successfully'
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/strategies/:id/reorder
 * Reorder strategies
 */
router.post('/:id/reorder', authenticate, checkPermission('strategies.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_order } = req.body;

        if (typeof new_order !== 'number' || new_order < 0) {
            throw new AppError('Invalid order value', 400);
        }

        await databaseService.query(
            'UPDATE strategies SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [new_order, id]
        );

        res.json({
            success: true,
            message: 'Strategy order updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
