import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas for system configurations
const createConfigSchema = Joi.object({
    config_key: Joi.string().required().max(100),
    config_value: Joi.string().required(),
    description: Joi.string().allow('', null),
    category: Joi.string().required().max(50),
    data_type: Joi.string().valid('string', 'number', 'boolean', 'json').default('string'),
    is_editable: Joi.boolean().default(true),
    is_visible: Joi.boolean().default(true),
    parent_id: Joi.string().uuid().allow(null),
    display_order: Joi.number().integer().min(0).default(0),
    metadata: Joi.object().default({})
});

const updateConfigSchema = Joi.object({
    config_key: Joi.string().max(100),
    config_value: Joi.string(),
    description: Joi.string().allow('', null),
    category: Joi.string().max(50),
    data_type: Joi.string().valid('string', 'number', 'boolean', 'json'),
    is_editable: Joi.boolean(),
    is_visible: Joi.boolean(),
    parent_id: Joi.string().uuid().allow(null),
    display_order: Joi.number().integer().min(0),
    metadata: Joi.object()
}).min(1);

/**
 * GET /api/v1/configurations
 * List all configurations with filtering and hierarchical support
 */
router.get('/', authenticate, checkPermission('configurations.read'), async (req, res, next) => {
    try {
        const { 
            category,
            is_editable,
            is_visible,
            parent_id,
            include_children = 'false',
            search 
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (category) {
            filters.push(`sc.category = $${paramIndex++}`);
            params.push(category);
        }

        if (is_editable !== undefined) {
            filters.push(`sc.is_editable = $${paramIndex++}`);
            params.push(is_editable === 'true');
        }

        if (is_visible !== undefined) {
            filters.push(`sc.is_visible = $${paramIndex++}`);
            params.push(is_visible === 'true');
        }

        if (parent_id !== undefined) {
            if (parent_id === 'null' || parent_id === '') {
                filters.push('sc.parent_id IS NULL');
            } else {
                filters.push(`sc.parent_id = $${paramIndex++}`);
                params.push(parent_id);
            }
        }

        if (search) {
            filters.push(`(sc.config_key ILIKE $${paramIndex} OR sc.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const query = `
            SELECT 
                sc.*,
                parent.config_key as parent_config_key,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                (SELECT COUNT(*) FROM system_configurations WHERE parent_id = sc.id) as child_count
            FROM system_configurations sc
            LEFT JOIN system_configurations parent ON sc.parent_id = parent.id
            LEFT JOIN users u1 ON sc.created_by = u1.id
            LEFT JOIN users u2 ON sc.updated_by = u2.id
            ${whereClause}
            ORDER BY sc.category, sc.display_order, sc.config_key
        `;

        const configurations = await databaseService.query(query, params);

        // If include_children is true, build hierarchical structure
        if (include_children === 'true') {
            const configMap = new Map();
            const rootConfigs = [];

            // First pass: create map of all configs
            configurations.forEach(config => {
                configMap.set(config.id, { ...config, children: [] });
            });

            // Second pass: build hierarchy
            configurations.forEach(config => {
                const configWithChildren = configMap.get(config.id);
                if (config.parent_id && configMap.has(config.parent_id)) {
                    configMap.get(config.parent_id).children.push(configWithChildren);
                } else {
                    rootConfigs.push(configWithChildren);
                }
            });

            res.json({
                success: true,
                data: rootConfigs
            });
        } else {
            res.json({
                success: true,
                data: configurations
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/configurations/categories
 * Get all unique configuration categories
 */
router.get('/categories', authenticate, checkPermission('configurations.read'), async (req, res, next) => {
    try {
        const query = `
            SELECT 
                category,
                COUNT(*) as config_count
            FROM system_configurations
            GROUP BY category
            ORDER BY category
        `;

        const categories = await databaseService.query(query);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/configurations/:id
 * Get a single configuration with children
 */
router.get('/:id', authenticate, checkPermission('configurations.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                sc.*,
                parent.config_key as parent_config_key,
                parent.category as parent_category,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM system_configurations sc
            LEFT JOIN system_configurations parent ON sc.parent_id = parent.id
            LEFT JOIN users u1 ON sc.created_by = u1.id
            LEFT JOIN users u2 ON sc.updated_by = u2.id
            WHERE sc.id = $1
        `;

        const configuration = await databaseService.queryOne(query, [id]);

        if (!configuration) {
            throw new AppError('Configuration not found', 404);
        }

        // Get children if any
        const childrenQuery = `
            SELECT 
                sc.*,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM system_configurations sc
            LEFT JOIN users u1 ON sc.created_by = u1.id
            LEFT JOIN users u2 ON sc.updated_by = u2.id
            WHERE sc.parent_id = $1
            ORDER BY sc.display_order, sc.config_key
        `;

        const children = await databaseService.query(childrenQuery, [id]);
        configuration.children = children;

        res.json({
            success: true,
            data: configuration
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/configurations/key/:key
 * Get a configuration by its key
 */
router.get('/key/:key', authenticate, checkPermission('configurations.read'), async (req, res, next) => {
    try {
        const { key } = req.params;

        const query = `
            SELECT 
                sc.*,
                parent.config_key as parent_config_key
            FROM system_configurations sc
            LEFT JOIN system_configurations parent ON sc.parent_id = parent.id
            WHERE sc.config_key = $1
        `;

        const configuration = await databaseService.queryOne(query, [key]);

        if (!configuration) {
            throw new AppError('Configuration not found', 404);
        }

        res.json({
            success: true,
            data: configuration
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/configurations
 * Create a new configuration
 */
router.post('/', authenticate, checkPermission('configurations.create'), async (req, res, next) => {
    try {
        const { error, value } = createConfigSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if config_key already exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM system_configurations WHERE config_key = $1',
            [value.config_key]
        );

        if (existing) {
            throw new AppError('Configuration key already exists', 400);
        }

        // Verify parent_id exists if provided
        if (value.parent_id) {
            const parent = await databaseService.queryOne(
                'SELECT id FROM system_configurations WHERE id = $1',
                [value.parent_id]
            );

            if (!parent) {
                throw new AppError('Parent configuration not found', 404);
            }
        }

        const query = `
            INSERT INTO system_configurations (
                config_key, config_value, description, category, data_type,
                is_editable, is_visible, parent_id, display_order, metadata,
                created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
            RETURNING *
        `;

        const configuration = await databaseService.queryOne(query, [
            value.config_key,
            value.config_value,
            value.description,
            value.category,
            value.data_type || 'string',
            value.is_editable !== undefined ? value.is_editable : true,
            value.is_visible !== undefined ? value.is_visible : true,
            value.parent_id,
            value.display_order || 0,
            JSON.stringify(value.metadata || {}),
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Configuration created successfully',
            data: configuration
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/configurations/:id
 * Update a configuration
 */
router.put('/:id', authenticate, checkPermission('configurations.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateConfigSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id, is_editable FROM system_configurations WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Configuration not found', 404);
        }

        // Check if configuration is editable
        if (!existing.is_editable && value.config_value !== undefined) {
            throw new AppError('This configuration is not editable', 403);
        }

        // If config_key is being updated, check uniqueness
        if (value.config_key) {
            const keyExists = await databaseService.queryOne(
                'SELECT id FROM system_configurations WHERE config_key = $1 AND id != $2',
                [value.config_key, id]
            );

            if (keyExists) {
                throw new AppError('Configuration key already exists', 400);
            }
        }

        // Verify parent_id if being updated
        if (value.parent_id) {
            // Prevent circular reference
            if (value.parent_id === id) {
                throw new AppError('Configuration cannot be its own parent', 400);
            }

            const parent = await databaseService.queryOne(
                'SELECT id FROM system_configurations WHERE id = $1',
                [value.parent_id]
            );

            if (!parent) {
                throw new AppError('Parent configuration not found', 404);
            }
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            // Convert metadata object to JSON string for JSONB storage
            if (key === 'metadata' && typeof val === 'object') {
                updates.push(`${key} = $${paramIndex++}`);
                params.push(JSON.stringify(val));
            } else {
                updates.push(`${key} = $${paramIndex++}`);
                params.push(val);
            }
        });

        updates.push(`updated_by = $${paramIndex++}`, `updated_at = CURRENT_TIMESTAMP`);
        params.push(req.user.id, id);

        const query = `
            UPDATE system_configurations
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const configuration = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Configuration updated successfully',
            data: configuration
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/configurations/:id
 * Delete a configuration
 */
router.delete('/:id', authenticate, checkPermission('configurations.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const configuration = await databaseService.queryOne(
            'SELECT id, config_key, is_editable FROM system_configurations WHERE id = $1',
            [id]
        );

        if (!configuration) {
            throw new AppError('Configuration not found', 404);
        }

        if (!configuration.is_editable) {
            throw new AppError('This configuration cannot be deleted', 403);
        }

        // Check if configuration has children
        const children = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM system_configurations WHERE parent_id = $1',
            [id]
        );

        if (children.count > 0) {
            throw new AppError('Cannot delete configuration with child configurations. Delete children first.', 400);
        }

        await databaseService.query('DELETE FROM system_configurations WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Configuration deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/configurations/:id/reorder
 * Update display order of a configuration
 */
router.post('/:id/reorder', authenticate, checkPermission('configurations.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_order } = req.body;

        if (new_order === undefined || new_order < 0) {
            throw new AppError('Valid new_order is required', 400);
        }

        const configuration = await databaseService.queryOne(
            'SELECT id FROM system_configurations WHERE id = $1',
            [id]
        );

        if (!configuration) {
            throw new AppError('Configuration not found', 404);
        }

        await databaseService.query(
            'UPDATE system_configurations SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [new_order, id]
        );

        res.json({
            success: true,
            message: 'Configuration order updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
