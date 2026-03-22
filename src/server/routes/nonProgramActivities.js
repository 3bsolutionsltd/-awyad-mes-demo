import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas for non-program categories
const createCategorySchema = Joi.object({
    name: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    color: Joi.string().max(50).allow('', null),
    icon: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0).default(0)
});

const updateCategorySchema = Joi.object({
    name: Joi.string().max(255),
    description: Joi.string().allow('', null),
    color: Joi.string().max(50).allow('', null),
    icon: Joi.string().max(50).allow('', null),
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
}).min(1);

// Validation schemas for non-program activities
const createActivitySchema = Joi.object({
    category_id: Joi.string().uuid().required(),
    activity_name: Joi.string().required().max(500),
    description: Joi.string().allow('', null),
    reporting_period: Joi.string().max(100).allow('', null),
    target: Joi.number().min(0).default(0),
    achieved: Joi.number().min(0).default(0),
    unit_of_measure: Joi.string().max(100).allow('', null),
    start_date: Joi.date().allow(null),
    end_date: Joi.date().allow(null).greater(Joi.ref('start_date')),
    notes: Joi.string().allow('', null)
});

const updateActivitySchema = Joi.object({
    category_id: Joi.string().uuid(),
    activity_name: Joi.string().max(500),
    description: Joi.string().allow('', null),
    reporting_period: Joi.string().max(100).allow('', null),
    target: Joi.number().min(0),
    achieved: Joi.number().min(0),
    unit_of_measure: Joi.string().max(100).allow('', null),
    start_date: Joi.date().allow(null),
    end_date: Joi.date().allow(null),
    notes: Joi.string().allow('', null),
    is_active: Joi.boolean()
}).min(1);

// ============================================
// NON-PROGRAM CATEGORIES ENDPOINTS
// ============================================

/**
 * GET /api/v1/non-program-activities/categories
 * List all non-program activity categories
 */
router.get('/categories', authenticate, checkPermission('non_program_activities.read'), async (req, res, next) => {
    try {
        const { include_counts = false, is_active } = req.query;

        let query = `
            SELECT 
                npc.*,
                u1.username as created_by_username,
                u2.username as updated_by_username
        `;

        if (include_counts === 'true') {
            query += `,
                (SELECT COUNT(*) FROM non_program_activities 
                 WHERE category_id = npc.id AND is_active = true) as active_activities_count,
                (SELECT COUNT(*) FROM non_program_activities 
                 WHERE category_id = npc.id) as total_activities_count
            `;
        }

        query += `
            FROM non_program_categories npc
            LEFT JOIN users u1 ON npc.created_by = u1.id
            LEFT JOIN users u2 ON npc.updated_by = u2.id
        `;

        if (is_active !== undefined) {
            query += ` WHERE npc.is_active = $1`;
        }

        query += ` ORDER BY npc.display_order, npc.name`;

        const params = is_active !== undefined ? [is_active === 'true'] : [];
        const result = await databaseService.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/non-program-activities/categories/:id
 * Get a single non-program category
 */
router.get('/categories/:id', authenticate, checkPermission('non_program_activities.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                npc.*,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                (SELECT COUNT(*) FROM non_program_activities 
                 WHERE category_id = npc.id AND is_active = true) as active_activities_count,
                (SELECT COUNT(*) FROM non_program_activities 
                 WHERE category_id = npc.id) as total_activities_count
            FROM non_program_categories npc
            LEFT JOIN users u1 ON npc.created_by = u1.id
            LEFT JOIN users u2 ON npc.updated_by = u2.id
            WHERE npc.id = $1
        `;

        const category = await databaseService.queryOne(query, [id]);

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/non-program-activities/categories
 * Create a new non-program category
 */
router.post('/categories', authenticate, checkPermission('non_program_activities.create'), async (req, res, next) => {
    try {
        const { error, value } = createCategorySchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check for duplicate name
        const existing = await databaseService.queryOne(
            'SELECT id FROM non_program_categories WHERE LOWER(name) = LOWER($1)',
            [value.name]
        );

        if (existing) {
            throw new AppError('A category with this name already exists', 400);
        }

        const query = `
            INSERT INTO non_program_categories (
                name, description, color, icon, display_order,
                created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $6)
            RETURNING *
        `;

        const category = await databaseService.queryOne(query, [
            value.name,
            value.description,
            value.color,
            value.icon,
            value.display_order || 0,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/non-program-activities/categories/:id
 * Update a non-program category
 */
router.put('/categories/:id', authenticate, checkPermission('non_program_activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCategorySchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id FROM non_program_categories WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Category not found', 404);
        }

        // Check for duplicate name if name is being updated
        if (value.name) {
            const duplicate = await databaseService.queryOne(
                'SELECT id FROM non_program_categories WHERE LOWER(name) = LOWER($1) AND id != $2',
                [value.name, id]
            );

            if (duplicate) {
                throw new AppError('A category with this name already exists', 400);
            }
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            updates.push(`${key} = $${paramIndex++}`);
            params.push(val);
        });

        updates.push(`updated_by = $${paramIndex++}`, `updated_at = CURRENT_TIMESTAMP`);
        params.push(req.user.id, id);

        const query = `
            UPDATE non_program_categories
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const category = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/non-program-activities/categories/:id
 * Delete a non-program category
 */
router.delete('/categories/:id', authenticate, checkPermission('non_program_activities.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { force = false } = req.query;

        const category = await databaseService.queryOne(
            'SELECT id FROM non_program_categories WHERE id = $1',
            [id]
        );

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        // Check if category has activities
        const { count } = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM non_program_activities WHERE category_id = $1',
            [id]
        );

        if (parseInt(count) > 0 && force !== 'true') {
            throw new AppError(
                `Cannot delete category with ${count} associated activities. Use force=true to delete anyway.`,
                400
            );
        }

        // If force delete, first delete all associated activities
        if (force === 'true') {
            await databaseService.query(
                'DELETE FROM non_program_activities WHERE category_id = $1',
                [id]
            );
        }

        await databaseService.query('DELETE FROM non_program_categories WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/non-program-activities/categories/:id/reorder
 * Update category display order
 */
router.post('/categories/:id/reorder', authenticate, checkPermission('non_program_activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { display_order } = req.body;

        if (display_order === undefined || display_order === null) {
            throw new AppError('display_order is required', 400);
        }

        const category = await databaseService.queryOne(
            'SELECT id FROM non_program_categories WHERE id = $1',
            [id]
        );

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        const updated = await databaseService.queryOne(
            `UPDATE non_program_categories 
             SET display_order = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [display_order, req.user.id, id]
        );

        res.json({
            success: true,
            message: 'Category order updated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// NON-PROGRAM ACTIVITIES ENDPOINTS
// ============================================

/**
 * GET /api/v1/non-program-activities
 * List all non-program activities with filtering
 */
router.get('/', authenticate, checkPermission('non_program_activities.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            category_id,
            is_active,
            search,
            date_from,
            date_to
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (category_id) {
            filters.push(`npa.category_id = $${paramIndex++}`);
            params.push(category_id);
        }

        if (is_active !== undefined) {
            filters.push(`npa.is_active = $${paramIndex++}`);
            params.push(is_active === 'true');
        }

        if (search) {
            filters.push(`(
                npa.activity_name ILIKE $${paramIndex} OR 
                npa.description ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (date_from) {
            filters.push(`npa.start_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            filters.push(`npa.end_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) as total FROM non_program_activities npa ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                npa.*,
                npc.name as category_name,
                npc.color as category_color,
                npc.icon as category_icon,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                CASE 
                    WHEN npa.target > 0 THEN ROUND((npa.achieved::numeric / npa.target::numeric) * 100, 2)
                    ELSE 0
                END as achievement_percentage
            FROM non_program_activities npa
            LEFT JOIN non_program_categories npc ON npa.category_id = npc.id
            LEFT JOIN users u1 ON npa.created_by = u1.id
            LEFT JOIN users u2 ON npa.updated_by = u2.id
            ${whereClause}
            ORDER BY npa.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const activitiesResult = await databaseService.query(query, params);
        const activities = activitiesResult.rows;

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/non-program-activities/:id
 * Get a single non-program activity
 */
router.get('/:id', authenticate, checkPermission('non_program_activities.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                npa.*,
                npc.name as category_name,
                npc.color as category_color,
                npc.icon as category_icon,
                npc.description as category_description,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                CASE 
                    WHEN npa.target > 0 THEN ROUND((npa.achieved::numeric / npa.target::numeric) * 100, 2)
                    ELSE 0
                END as achievement_percentage,
                npa.target - npa.achieved as remaining
            FROM non_program_activities npa
            LEFT JOIN non_program_categories npc ON npa.category_id = npc.id
            LEFT JOIN users u1 ON npa.created_by = u1.id
            LEFT JOIN users u2 ON npa.updated_by = u2.id
            WHERE npa.id = $1
        `;

        const activity = await databaseService.queryOne(query, [id]);

        if (!activity) {
            throw new AppError('Activity not found', 404);
        }

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/non-program-activities
 * Create a new non-program activity
 */
router.post('/', authenticate, checkPermission('non_program_activities.create'), async (req, res, next) => {
    try {
        const { error, value } = createActivitySchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Verify category exists and is active
        const category = await databaseService.queryOne(
            'SELECT id, is_active FROM non_program_categories WHERE id = $1',
            [value.category_id]
        );

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        if (!category.is_active) {
            throw new AppError('Cannot create activity in inactive category', 400);
        }

        const query = `
            INSERT INTO non_program_activities (
                category_id, activity_name, description, reporting_period,
                target, achieved, unit_of_measure, start_date, end_date, notes,
                created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
            RETURNING *
        `;

        const activity = await databaseService.queryOne(query, [
            value.category_id,
            value.activity_name,
            value.description,
            value.reporting_period,
            value.target || 0,
            value.achieved || 0,
            value.unit_of_measure,
            value.start_date,
            value.end_date,
            value.notes,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Non-program activity created successfully',
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/non-program-activities/:id
 * Update a non-program activity
 */
router.put('/:id', authenticate, checkPermission('non_program_activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateActivitySchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id FROM non_program_activities WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Activity not found', 404);
        }

        // Verify category if being updated
        if (value.category_id) {
            const category = await databaseService.queryOne(
                'SELECT id, is_active FROM non_program_categories WHERE id = $1',
                [value.category_id]
            );

            if (!category) {
                throw new AppError('Category not found', 404);
            }

            if (!category.is_active) {
                throw new AppError('Cannot move activity to inactive category', 400);
            }
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            updates.push(`${key} = $${paramIndex++}`);
            params.push(val);
        });

        updates.push(`updated_by = $${paramIndex++}`, `updated_at = CURRENT_TIMESTAMP`);
        params.push(req.user.id, id);

        const query = `
            UPDATE non_program_activities
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const activity = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Non-program activity updated successfully',
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/non-program-activities/:id
 * Delete a non-program activity
 */
router.delete('/:id', authenticate, checkPermission('non_program_activities.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const activity = await databaseService.queryOne(
            'SELECT id FROM non_program_activities WHERE id = $1',
            [id]
        );

        if (!activity) {
            throw new AppError('Activity not found', 404);
        }

        await databaseService.query('DELETE FROM non_program_activities WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Non-program activity deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/non-program-activities/stats/summary
 * Get summary statistics for non-program activities
 */
router.get('/stats/summary', authenticate, checkPermission('non_program_activities.read'), async (req, res, next) => {
    try {
        const { category_id } = req.query;

        const filters = category_id ? 'WHERE npa.category_id = $1' : '';
        const params = category_id ? [category_id] : [];

        const query = `
            SELECT 
                COUNT(*) as total_activities,
                COUNT(CASE WHEN npa.is_active = true THEN 1 END) as active_activities,
                SUM(npa.target) as total_target,
                SUM(npa.achieved) as total_achieved,
                CASE 
                    WHEN SUM(npa.target) > 0 THEN 
                        ROUND((SUM(npa.achieved)::numeric / SUM(npa.target)::numeric) * 100, 2)
                    ELSE 0
                END as overall_achievement_percentage,
                COUNT(DISTINCT npa.category_id) as total_categories
            FROM non_program_activities npa
            ${filters}
        `;

        const summary = await databaseService.queryOne(query, params);

        // Get category breakdown
        const categoryQuery = `
            SELECT 
                npc.id,
                npc.name,
                npc.color,
                npc.icon,
                COUNT(npa.id) as activity_count,
                SUM(npa.target) as total_target,
                SUM(npa.achieved) as total_achieved,
                CASE 
                    WHEN SUM(npa.target) > 0 THEN 
                        ROUND((SUM(npa.achieved)::numeric / SUM(npa.target)::numeric) * 100, 2)
                    ELSE 0
                END as achievement_percentage
            FROM non_program_categories npc
            LEFT JOIN non_program_activities npa ON npc.id = npa.category_id AND npa.is_active = true
            WHERE npc.is_active = true
            GROUP BY npc.id, npc.name, npc.color, npc.icon, npc.display_order
            ORDER BY npc.display_order, npc.name
        `;

        const breakdownResult = await databaseService.query(categoryQuery);

        res.json({
            success: true,
            data: {
                summary,
                category_breakdown: breakdownResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
