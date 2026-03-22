import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';
import indicatorService from '../services/indicatorService.js';
import indicatorMappingService from '../services/indicatorMappingService.js';

const router = express.Router();

// Validation schemas for the enhanced two-tier indicator system
const createIndicatorSchema = Joi.object({
    // Scope: AWYAD or Project
    indicator_scope: Joi.string().valid('awyad', 'project').required(),
    
    // Basic fields
    name: Joi.string().required().max(500),
    description: Joi.string().allow('', null),
    
    // Type and level
    indicator_level: Joi.string().valid('Output', 'Outcome', 'Impact').required(),
    data_type: Joi.string().valid('Number', 'Percentage').default('Number'),
    
    // For AWYAD indicators: use thematic_area_id
    // For Project indicators: use project_id and result_area
    thematic_area_id: Joi.string().uuid().allow(null),
    project_id: Joi.string().uuid().allow(null),
    result_area: Joi.string().max(200).allow('', null),
    
    // Targets
    lop_target: Joi.number().min(0).default(0),
    annual_target: Joi.number().min(0).default(0),
    baseline: Joi.number().min(0).default(0),
    baseline_date: Joi.date().allow(null),
    
    // Quarterly targets
    q1_target: Joi.number().min(0).default(0),
    q2_target: Joi.number().min(0).default(0),
    q3_target: Joi.number().min(0).default(0),
    q4_target: Joi.number().min(0).default(0),
    
    // Quarterly achieved (optional on creation)
    q1_achieved: Joi.number().min(0).default(0),
    q2_achieved: Joi.number().min(0).default(0),
    q3_achieved: Joi.number().min(0).default(0),
    q4_achieved: Joi.number().min(0).default(0),
    
    // Total achieved
    achieved: Joi.number().min(0).default(0),
    
    unit: Joi.string().allow('', null)
});

const updateIndicatorSchema = Joi.object({
    name: Joi.string().max(500),
    description: Joi.string().allow('', null),
    indicator_level: Joi.string().valid('Output', 'Outcome', 'Impact'),
    data_type: Joi.string().valid('Number', 'Percentage'),
    thematic_area_id: Joi.string().uuid().allow(null),
    project_id: Joi.string().uuid().allow(null),
    result_area: Joi.string().max(200).allow('', null),
    lop_target: Joi.number().min(0),
    annual_target: Joi.number().min(0),
    baseline: Joi.number().min(0),
    baseline_date: Joi.date().allow(null),
    q1_target: Joi.number().min(0),
    q2_target: Joi.number().min(0),
    q3_target: Joi.number().min(0),
    q4_target: Joi.number().min(0),
    q1_achieved: Joi.number().min(0),
    q2_achieved: Joi.number().min(0),
    q3_achieved: Joi.number().min(0),
    q4_achieved: Joi.number().min(0),
    achieved: Joi.number().min(0),
    unit: Joi.string().allow('', null)
}).min(1);

/**
 * GET /api/v1/indicators
 * List all indicators with filtering by scope, project, thematic area
 */
router.get('/', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            indicator_scope,
            project_id,
            thematic_area_id,
            indicator_level,
            result_area,
            search 
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (indicator_scope) {
            filters.push(`i.indicator_scope = $${paramIndex++}`);
            params.push(indicator_scope);
        }

        if (project_id) {
            filters.push(`i.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (thematic_area_id) {
            filters.push(`i.thematic_area_id = $${paramIndex++}`);
            params.push(thematic_area_id);
        }

        if (indicator_level) {
            filters.push(`i.indicator_level = $${paramIndex++}`);
            params.push(indicator_level);
        }

        if (result_area) {
            filters.push(`i.result_area = $${paramIndex++}`);
            params.push(result_area);
        }

        if (search) {
            filters.push(`(i.name ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM indicators i ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        // Get paginated results
        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                i.*,
                ta.name as thematic_area_name,
                p.name as project_name,
                u.username as created_by_username,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage,
                (SELECT COUNT(*) FROM activities WHERE indicator_id = i.id) as activity_count,
                (SELECT COUNT(*) FROM indicator_mappings WHERE awyad_indicator_id = i.id) as linked_project_indicators_count,
                (SELECT COUNT(*) FROM indicator_mappings WHERE project_indicator_id = i.id) as linked_to_awyad_count
            FROM indicators i
            LEFT JOIN thematic_areas ta ON i.thematic_area_id = ta.id
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN users u ON i.created_by = u.id
            ${whereClause}
            ORDER BY 
                i.indicator_scope ASC,
                COALESCE(i.result_area, '') ASC,
                i.name ASC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const indicatorsResult = await databaseService.query(query, params);

        res.json({
            success: true,
            data: {
                indicators: indicatorsResult.rows,
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
 * GET /api/v1/indicators/:id
 * Get a single indicator by ID with quarterly breakdown
 */
router.get('/:id', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                i.*,
                ta.name as thematic_area_name,
                p.name as project_name,
                p.id as project_id,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage,
                (SELECT COUNT(*) FROM activities WHERE indicator_id = i.id) as activity_count,
                (SELECT SUM(total_beneficiaries) FROM activities WHERE indicator_id = i.id) as total_beneficiaries
            FROM indicators i
            LEFT JOIN thematic_areas ta ON i.thematic_area_id = ta.id
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN users u1 ON i.created_by = u1.id
            LEFT JOIN users u2 ON i.updated_by = u2.id
            WHERE i.id = $1
        `;

        const indicator = await databaseService.queryOne(query, [id]);

        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }

        // Add quarterly breakdown
        indicator.quarterly_data = {
            q1: { target: indicator.q1_target, achieved: indicator.q1_achieved },
            q2: { target: indicator.q2_target, achieved: indicator.q2_achieved },
            q3: { target: indicator.q3_target, achieved: indicator.q3_achieved },
            q4: { target: indicator.q4_target, achieved: indicator.q4_achieved }
        };

        // If AWYAD indicator, get linked project indicators
        if (indicator.indicator_scope === 'awyad') {
            const linkedIndicatorsResult = await databaseService.query(`
                SELECT 
                    i.id,
                    i.name,
                    i.achieved,
                    i.annual_target,
                    p.name as project_name
                FROM indicator_mappings im
                JOIN indicators i ON im.project_indicator_id = i.id
                JOIN projects p ON i.project_id = p.id
                WHERE im.awyad_indicator_id = $1
            `, [id]);

            indicator.linked_project_indicators = linkedIndicatorsResult.rows;
        }

        // If project indicator, check if linked to AWYAD indicator
        if (indicator.indicator_scope === 'project') {
            const awyadLink = await databaseService.queryOne(`
                SELECT 
                    i.id,
                    i.name
                FROM indicator_mappings im
                JOIN indicators i ON im.awyad_indicator_id = i.id
                WHERE im.project_indicator_id = $1
            `, [id]);

            indicator.linked_awyad_indicator = awyadLink;
        }

        res.json({
            success: true,
            data: indicator
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/indicators
 * Create a new indicator (AWYAD or Project level)
 */
router.post('/', authenticate, checkPermission('indicators.create'), async (req, res, next) => {
    try {
        const { error, value } = createIndicatorSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Validate scope-specific requirements
        if (value.indicator_scope === 'awyad') {
            if (!value.thematic_area_id) {
                throw new AppError('AWYAD indicators must have a thematic_area_id', 400);
            }
            if (value.project_id) {
                throw new AppError('AWYAD indicators cannot have a project_id', 400);
            }
        } else if (value.indicator_scope === 'project') {
            if (!value.project_id) {
                throw new AppError('Project indicators must have a project_id', 400);
            }
            if (!value.result_area) {
                throw new AppError('Project indicators must have a result_area', 400);
            }
        }

        // Verify thematic area exists if provided
        if (value.thematic_area_id) {
            const thematicArea = await databaseService.queryOne(
                'SELECT id FROM thematic_areas WHERE id = $1',
                [value.thematic_area_id]
            );

            if (!thematicArea) {
                throw new AppError('Thematic area not found', 404);
            }
        }

        // Verify project exists if provided
        if (value.project_id) {
            const project = await databaseService.queryOne(
                'SELECT id FROM projects WHERE id = $1',
                [value.project_id]
            );

            if (!project) {
                throw new AppError('Project not found', 404);
            }
        }

        const query = `
            INSERT INTO indicators (
                indicator_scope, name, description, indicator_level, data_type,
                thematic_area_id, project_id, result_area,
                lop_target, annual_target, baseline, baseline_date,
                q1_target, q2_target, q3_target, q4_target,
                q1_achieved, q2_achieved, q3_achieved, q4_achieved,
                achieved, unit, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *
        `;

        const indicator = await databaseService.queryOne(query, [
            value.indicator_scope,
            value.name,
            value.description,
            value.indicator_level,
            value.data_type,
            value.thematic_area_id,
            value.project_id,
            value.result_area,
            value.lop_target,
            value.annual_target,
            value.baseline,
            value.baseline_date,
            value.q1_target,
            value.q2_target,
            value.q3_target,
            value.q4_target,
            value.q1_achieved,
            value.q2_achieved,
            value.q3_achieved,
            value.q4_achieved,
            value.achieved,
            value.unit,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Indicator created successfully',
            data: indicator
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/indicators/:id
 * Update an indicator
 */
router.put('/:id', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateIndicatorSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if indicator exists
        const existing = await databaseService.queryOne(
            'SELECT id, indicator_scope FROM indicators WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Indicator not found', 404);
        }

        // Validate project_id if being updated
        if (value.project_id) {
            const project = await databaseService.queryOne(
                'SELECT id FROM projects WHERE id = $1',
                [value.project_id]
            );

            if (!project) {
                throw new AppError('Project not found', 404);
            }
        }

        // Validate thematic_area_id if being updated
        if (value.thematic_area_id) {
            const thematicArea = await databaseService.queryOne(
                'SELECT id FROM thematic_areas WHERE id = $1',
                [value.thematic_area_id]
            );

            if (!thematicArea) {
                throw new AppError('Thematic area not found', 404);
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

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const query = `
            UPDATE indicators
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const indicator = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Indicator updated successfully',
            data: indicator
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/indicators/:id
 * Delete an indicator
 */
router.delete('/:id', authenticate, checkPermission('indicators.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const indicator = await databaseService.queryOne(
            'SELECT id FROM indicators WHERE id = $1',
            [id]
        );

        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }

        // Check if indicator has activities
        const { count } = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM activities WHERE indicator_id = $1',
            [id]
        );

        if (count > 0) {
            throw new AppError('Cannot delete indicator with associated activities', 400);
        }

        // Delete indicator and its mappings (CASCADE will handle mappings)
        await databaseService.query('DELETE FROM indicators WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Indicator deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/indicators/:project_indicator_id/link-to-awyad/:awyad_indicator_id
 * Link a project indicator to an AWYAD indicator
 */
router.post('/:project_indicator_id/link-to-awyad/:awyad_indicator_id', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const { project_indicator_id, awyad_indicator_id } = req.params;

        // Verify both indicators exist and have correct scopes
        const projectIndicator = await databaseService.queryOne(
            'SELECT id, indicator_scope FROM indicators WHERE id = $1',
            [project_indicator_id]
        );

        if (!projectIndicator) {
            throw new AppError('Project indicator not found', 404);
        }

        if (projectIndicator.indicator_scope !== 'project') {
            throw new AppError('First indicator must be a project-level indicator', 400);
        }

        const awyadIndicator = await databaseService.queryOne(
            'SELECT id, indicator_scope FROM indicators WHERE id = $1',
            [awyad_indicator_id]
        );

        if (!awyadIndicator) {
            throw new AppError('AWYAD indicator not found', 404);
        }

        if (awyadIndicator.indicator_scope !== 'awyad') {
            throw new AppError('Second indicator must be an AWYAD-level indicator', 400);
        }

        // Check if mapping already exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM indicator_mappings WHERE project_indicator_id = $1 AND awyad_indicator_id = $2',
            [project_indicator_id, awyad_indicator_id]
        );

        if (existing) {
            throw new AppError('Indicators are already linked', 400);
        }

        // Create mapping
        await databaseService.query(
            'INSERT INTO indicator_mappings (project_indicator_id, awyad_indicator_id) VALUES ($1, $2)',
            [project_indicator_id, awyad_indicator_id]
        );

        res.json({
            success: true,
            message: 'Indicators linked successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/indicators/:project_indicator_id/unlink-from-awyad/:awyad_indicator_id
 * Unlink a project indicator from an AWYAD indicator
 */
router.delete('/:project_indicator_id/unlink-from-awyad/:awyad_indicator_id', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const { project_indicator_id, awyad_indicator_id } = req.params;

        const result = await databaseService.query(
            'DELETE FROM indicator_mappings WHERE project_indicator_id = $1 AND awyad_indicator_id = $2',
            [project_indicator_id, awyad_indicator_id]
        );

        if (result.rowCount === 0) {
            throw new AppError('Indicator mapping not found', 404);
        }

        res.json({
            success: true,
            message: 'Indicators unlinked successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/:id/activities
 * Get all activities for an indicator
 */
router.get('/:id/activities', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const indicator = await databaseService.queryOne(
            'SELECT id FROM indicators WHERE id = $1',
            [id]
        );

        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }

        const query = `
            SELECT 
                a.*,
                p.name as project_name
            FROM activities a
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.indicator_id = $1
            ORDER BY a.planned_date DESC
        `;

        const activitiesResult = await databaseService.query(query, [id]);

        res.json({
            success: true,
            data: activitiesResult.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/awyad
 * Get all AWYAD-level indicators
 */
router.get('/scope/awyad', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const query = `
            SELECT 
                i.*,
                ta.name as thematic_area_name,
                u.username as created_by_username,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage,
                (SELECT COUNT(*) FROM indicator_mappings WHERE awyad_indicator_id = i.id) as linked_project_indicators_count
            FROM indicators i
            LEFT JOIN thematic_areas ta ON i.thematic_area_id = ta.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.indicator_scope = 'awyad'
            ORDER BY ta.name, i.name
        `;

        const indicatorsResult = await databaseService.query(query);

        res.json({
            success: true,
            data: indicatorsResult.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/project/:projectId
 * Get all indicators for a specific project
 */
router.get('/project/:projectId', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Verify project exists
        const project = await databaseService.queryOne(
            'SELECT id, name FROM projects WHERE id = $1',
            [projectId]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const query = `
            SELECT 
                i.*,
                p.name as project_name,
                u.username as created_by_username,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage,
                (SELECT COUNT(*) FROM activities WHERE indicator_id = i.id) as activity_count,
                (SELECT COUNT(*) FROM indicator_mappings WHERE project_indicator_id = i.id) as linked_to_awyad_count
            FROM indicators i
            LEFT JOIN projects p ON i.project_id = p.id
            LEFT JOIN users u ON i.created_by = u.id
            WHERE i.project_id = $1 AND i.indicator_scope = 'project'
            ORDER BY i.result_area, i.name
        `;

        const indicatorsResult = await databaseService.query(query, [projectId]);

        res.json({
            success: true,
            data: {
                project,
                indicators: indicatorsResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/indicators/mappings
 * Create a mapping between project and AWYAD indicator
 */
router.post('/mappings', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const schema = Joi.object({
            awyad_indicator_id: Joi.string().uuid().required(),
            project_indicator_id: Joi.string().uuid().required(),
            contribution_weight: Joi.number().min(0.01).max(100).default(1.0)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const mapping = await indicatorMappingService.createMapping(value);

        res.status(201).json({
            success: true,
            message: 'Indicator mapping created successfully',
            data: mapping
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/mappings/awyad/:awyadId
 * Get all project indicators mapped to an AWYAD indicator
 */
router.get('/mappings/awyad/:awyadId', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { awyadId } = req.params;

        const mappings = await indicatorMappingService.getMappedIndicators(awyadId);

        res.json({
            success: true,
            data: mappings
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/mappings/project/:projectIndicatorId
 * Get AWYAD indicator(s) that a project indicator is mapped to
 */
router.get('/mappings/project/:projectIndicatorId', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { projectIndicatorId } = req.params;

        const mappings = await indicatorMappingService.getAWYADMappings(projectIndicatorId);

        res.json({
            success: true,
            data: mappings
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/mappings/unmapped/:awyadId
 * Get unmapped project indicators (candidates for linking to AWYAD indicator)
 */
router.get('/mappings/unmapped/:awyadId', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { awyadId } = req.params;
        const { project_id } = req.query;

        const unmapped = await indicatorMappingService.getUnmappedProjectIndicators(awyadId, project_id);

        res.json({
            success: true,
            data: unmapped
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/indicators/mappings/:mappingId
 * Update mapping weight
 */
router.put('/mappings/:mappingId', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const { mappingId } = req.params;
        const schema = Joi.object({
            contribution_weight: Joi.number().min(0.01).max(100).required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const mapping = await indicatorMappingService.updateMappingWeight(
            mappingId,
            value.contribution_weight
        );

        res.json({
            success: true,
            message: 'Mapping weight updated successfully',
            data: mapping
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/indicators/mappings/:mappingId
 * Delete a mapping
 */
router.delete('/mappings/:mappingId', authenticate, checkPermission('indicators.delete'), async (req, res, next) => {
    try {
        const { mappingId } = req.params;

        const result = await indicatorMappingService.deleteMapping(mappingId);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/indicators/:awyadId/aggregate
 * Manually trigger aggregation of AWYAD indicator from project indicators
 */
router.post('/:awyadId/aggregate', authenticate, checkPermission('indicators.update'), async (req, res, next) => {
    try {
        const { awyadId } = req.params;

        const updated = await indicatorService.updateAWYADIndicatorAggregation(awyadId);

        res.json({
            success: true,
            message: 'AWYAD indicator aggregated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/indicators/:id/progress
 * Get detailed progress information for an indicator
 */
router.get('/:id/progress', authenticate, checkPermission('indicators.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const indicator = await databaseService.queryOne(
            'SELECT * FROM indicators WHERE id = $1',
            [id]
        );

        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }

        const progress = indicatorService.getIndicatorProgress(
            indicator.achieved,
            indicator.annual_target,
            indicator.data_type
        );

        const quarterly = indicatorService.calculateQuarterlyTotals(indicator);

        res.json({
            success: true,
            data: {
                indicator: {
                    id: indicator.id,
                    name: indicator.name,
                    data_type: indicator.data_type,
                    unit: indicator.unit
                },
                progress,
                quarterly,
                lop: {
                    target: indicator.lop_target,
                    achieved: indicator.achieved,
                    percentage: indicator.lop_target > 0 
                        ? Math.round((indicator.achieved / indicator.lop_target) * 100)
                        : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
