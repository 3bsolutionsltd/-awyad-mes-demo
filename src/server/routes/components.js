import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createComponentSchema = Joi.object({
    pillar_id: Joi.string().uuid().required(),
    name: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    interventions: Joi.array().items(Joi.string()).default([]),
    approaches: Joi.array().items(Joi.string()).default([]),
    display_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true)
});

const updateComponentSchema = Joi.object({
    pillar_id: Joi.string().uuid(),
    name: Joi.string().max(255),
    description: Joi.string().allow('', null),
    code: Joi.string().max(50).allow('', null),
    interventions: Joi.array().items(Joi.string()),
    approaches: Joi.array().items(Joi.string()),
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
}).min(1);

/**
 * GET /api/v1/components
 * List all core program components with optional filtering
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { pillar_id, strategy_id, is_active, include_inactive = 'false' } = req.query;

        let query = `
            SELECT 
                c.*,
                p.name as pillar_name,
                p.id as pillar_id,
                s.name as strategy_name,
                s.id as strategy_id,
                (SELECT COUNT(*) FROM projects WHERE core_program_component_id = c.id) as project_count,
                u.username as created_by_username
            FROM core_program_components c
            LEFT JOIN pillars p ON c.pillar_id = p.id
            LEFT JOIN strategies s ON p.strategy_id = s.id
            LEFT JOIN users u ON c.created_by = u.id
        `;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (pillar_id) {
            filters.push(`c.pillar_id = $${paramIndex++}`);
            params.push(pillar_id);
        }

        if (strategy_id) {
            filters.push(`s.id = $${paramIndex++}`);
            params.push(strategy_id);
        }

        // Filter by active status (default: show only active)
        if (include_inactive === 'false') {
            filters.push(`c.is_active = true`);
        } else if (is_active) {
            filters.push(`c.is_active = $${paramIndex++}`);
            params.push(is_active === 'true');
        }

        if (filters.length > 0) {
            query += ` WHERE ${filters.join(' AND ')}`;
        }

        query += ` ORDER BY c.display_order ASC, c.name ASC`;

        const components = await databaseService.query(query, params);

        res.json({
            success: true,
            data: components,
            count: components.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/components/:id
 * Get a single component by ID with its projects
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const component = await databaseService.queryOne(
            `SELECT 
                c.*,
                p.name as pillar_name,
                p.id as pillar_id,
                s.name as strategy_name,
                s.id as strategy_id,
                (SELECT COUNT(*) FROM projects WHERE core_program_component_id = c.id) as project_count,
                u.username as created_by_username
            FROM core_program_components c
            LEFT JOIN pillars p ON c.pillar_id = p.id
            LEFT JOIN strategies s ON p.strategy_id = s.id
            LEFT JOIN users u ON c.created_by = u.id
            WHERE c.id = $1`,
            [id]
        );

        if (!component) {
            throw new AppError('Component not found', 404);
        }

        // Get projects for this component
        const projects = await databaseService.query(
            `SELECT 
                pr.*,
                (SELECT COUNT(*) FROM activities WHERE project_id = pr.id) as activity_count,
                (SELECT COUNT(*) FROM indicators WHERE project_id = pr.id) as indicator_count
            FROM projects pr
            WHERE pr.core_program_component_id = $1
            ORDER BY pr.name ASC`,
            [id]
        );

        component.projects = projects;

        res.json({
            success: true,
            data: component
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/components
 * Create a new core program component
 */
router.post('/', authenticate, checkPermission('components.create'), async (req, res, next) => {
    try {
        const { error, value } = createComponentSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const { pillar_id, name, description, code, interventions, approaches, display_order, is_active } = value;

        // Verify pillar exists
        const pillar = await databaseService.queryOne(
            'SELECT id FROM pillars WHERE id = $1',
            [pillar_id]
        );

        if (!pillar) {
            throw new AppError('Pillar not found', 404);
        }

        const component = await databaseService.queryOne(
            `INSERT INTO core_program_components 
            (pillar_id, name, description, code, interventions, approaches, display_order, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                pillar_id, 
                name, 
                description, 
                code, 
                JSON.stringify(interventions), 
                JSON.stringify(approaches), 
                display_order, 
                is_active, 
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            data: component,
            message: 'Component created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/components/:id
 * Update an existing component
 */
router.put('/:id', authenticate, checkPermission('components.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateComponentSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if component exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM core_program_components WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Component not found', 404);
        }

        // If updating pillar_id, verify new pillar exists
        if (value.pillar_id) {
            const pillar = await databaseService.queryOne(
                'SELECT id FROM pillars WHERE id = $1',
                [value.pillar_id]
            );

            if (!pillar) {
                throw new AppError('Pillar not found', 404);
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.keys(value).forEach(key => {
            if (key === 'interventions' || key === 'approaches') {
                updates.push(`${key} = $${paramIndex++}`);
                params.push(JSON.stringify(value[key]));
            } else {
                updates.push(`${key} = $${paramIndex++}`);
                params.push(value[key]);
            }
        });

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE core_program_components
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const component = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            data: component,
            message: 'Component updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/components/:id
 * Delete a component (soft delete by setting is_active to false)
 */
router.delete('/:id', authenticate, checkPermission('components.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permanent = 'false' } = req.query;

        // Check if component exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM core_program_components WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Component not found', 404);
        }

        // Check if component has projects
        const { count } = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM projects WHERE core_program_component_id = $1',
            [id]
        );

        if (count > 0 && permanent === 'true') {
            throw new AppError('Cannot delete component with associated projects', 400);
        }

        if (permanent === 'true') {
            // Hard delete
            await databaseService.query('DELETE FROM core_program_components WHERE id = $1', [id]);
            res.json({
                success: true,
                message: 'Component permanently deleted'
            });
        } else {
            // Soft delete
            await databaseService.query(
                'UPDATE core_program_components SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );
            res.json({
                success: true,
                message: 'Component deactivated successfully'
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/components/:id/reorder
 * Reorder components within a pillar
 */
router.post('/:id/reorder', authenticate, checkPermission('components.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_order } = req.body;

        if (typeof new_order !== 'number' || new_order < 0) {
            throw new AppError('Invalid order value', 400);
        }

        await databaseService.query(
            'UPDATE core_program_components SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [new_order, id]
        );

        res.json({
            success: true,
            message: 'Component order updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/components/:id/interventions
 * Get interventions for a component
 */
router.get('/:id/interventions', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const component = await databaseService.queryOne(
            'SELECT interventions FROM core_program_components WHERE id = $1',
            [id]
        );

        if (!component) {
            throw new AppError('Component not found', 404);
        }

        res.json({
            success: true,
            data: component.interventions || []
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/components/:id/approaches
 * Get implementation approaches for a component
 */
router.get('/:id/approaches', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const component = await databaseService.queryOne(
            'SELECT approaches FROM core_program_components WHERE id = $1',
            [id]
        );

        if (!component) {
            throw new AppError('Component not found', 404);
        }

        res.json({
            success: true,
            data: component.approaches || []
        });
    } catch (error) {
        next(error);
    }
});

export default router;
