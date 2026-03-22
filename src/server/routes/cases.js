import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Enhanced validation schemas with privacy model and JSONB support
const createCaseSchema = Joi.object({
    case_number: Joi.string().required().max(100),
    project_id: Joi.string().uuid().allow(null),
    
    // Privacy-focused fields (no client_name)
    client_identifier: Joi.string().required().max(100),
    client_age: Joi.number().integer().min(0).allow(null),
    client_gender: Joi.string().valid('Male', 'Female', 'Other').required(),
    
    // Case type and category (linked to lookup tables)
    case_type_id: Joi.string().uuid().required(),
    case_category_id: Joi.string().uuid().allow(null),
    
    description: Joi.string().allow('', null),
    status: Joi.string().valid('Open', 'In Progress', 'Pending', 'Closed', 'Referred').default('Open'),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
    date_reported: Joi.date().required(),
    date_closed: Joi.date().allow(null),
    
    // Referral tracking
    referred_from: Joi.string().max(255).allow('', null),
    referred_to: Joi.string().max(255).allow('', null),
    
    // Support and follow-up
    support_offered: Joi.string().allow('', null),
    follow_up_required: Joi.boolean().default(false),
    follow_up_date: Joi.date().allow(null),
    
    resolution: Joi.string().allow('', null),
    
    // Dynamic tags (JSONB)
    tags: Joi.array().items(Joi.string()).default([]),
    
    notes: Joi.string().allow('', null)
});

const updateCaseSchema = Joi.object({
    case_number: Joi.string().max(100),
    project_id: Joi.string().uuid().allow(null),
    client_identifier: Joi.string().max(100),
    client_age: Joi.number().integer().min(0).allow(null),
    client_gender: Joi.string().valid('Male', 'Female', 'Other'),
    case_type_id: Joi.string().uuid(),
    case_category_id: Joi.string().uuid().allow(null),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('Open', 'In Progress', 'Pending', 'Closed', 'Referred'),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical'),
    date_reported: Joi.date(),
    date_closed: Joi.date().allow(null),
    referred_from: Joi.string().max(255).allow('', null),
    referred_to: Joi.string().max(255).allow('', null),
    support_offered: Joi.string().allow('', null),
    follow_up_required: Joi.boolean(),
    follow_up_date: Joi.date().allow(null),
    resolution: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()),
    notes: Joi.string().allow('', null)
}).min(1);

/**
 * GET /api/v1/cases
 * List all cases with enhanced filtering
 */
router.get('/', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status,
            priority,
            case_type_id,
            case_category_id,
            project_id,
            follow_up_required,
            search 
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            filters.push(`c.status = $${paramIndex++}`);
            params.push(status);
        }

        if (priority) {
            filters.push(`c.priority = $${paramIndex++}`);
            params.push(priority);
        }

        if (case_type_id) {
            filters.push(`c.case_type_id = $${paramIndex++}`);
            params.push(case_type_id);
        }

        if (case_category_id) {
            filters.push(`c.case_category_id = $${paramIndex++}`);
            params.push(case_category_id);
        }

        if (project_id) {
            filters.push(`c.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (follow_up_required !== undefined) {
            filters.push(`c.follow_up_required = $${paramIndex++}`);
            params.push(follow_up_required === 'true');
        }

        if (search) {
            filters.push(`(c.case_number ILIKE $${paramIndex} OR c.client_identifier ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) as total FROM cases c ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                c.*,
                ct.name as case_type_name,
                ct.description as case_type_description,
                cc.name as case_category_name,
                cc.description as case_category_description,
                p.name as project_name,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM cases c
            LEFT JOIN case_types ct ON c.case_type_id = ct.id
            LEFT JOIN case_categories cc ON c.case_category_id = cc.id
            LEFT JOIN projects p ON c.project_id = p.id
            LEFT JOIN users u1 ON c.created_by = u1.id
            LEFT JOIN users u2 ON c.updated_by = u2.id
            ${whereClause}
            ORDER BY c.date_reported DESC, c.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const cases = await databaseService.query(query, params);

        res.json({
            success: true,
            data: {
                cases,
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
 * GET /api/v1/cases/:id
 * Get a single case with full details
 */
router.get('/:id', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                c.*,
                ct.name as case_type_name,
                ct.description as case_type_description,
                cc.name as case_category_name,
                cc.description as case_category_description,
                p.name as project_name,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM cases c
            LEFT JOIN case_types ct ON c.case_type_id = ct.id
            LEFT JOIN case_categories cc ON c.case_category_id = cc.id
            LEFT JOIN projects p ON c.project_id = p.id
            LEFT JOIN users u1 ON c.created_by = u1.id
            LEFT JOIN users u2 ON c.updated_by = u2.id
            WHERE c.id = $1
        `;

        const caseData = await databaseService.queryOne(query, [id]);

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        // Add referral information summary
        caseData.referral_info = {
            has_incoming_referral: !!caseData.referred_from,
            has_outgoing_referral: !!caseData.referred_to,
            incoming_source: caseData.referred_from,
            outgoing_destination: caseData.referred_to
        };

        res.json({
            success: true,
            data: caseData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/cases
 * Create a new case with privacy-focused fields
 */
router.post('/', authenticate, checkPermission('cases.create'), async (req, res, next) => {
    try {
        const { error, value } = createCaseSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if case_number already exists
        const existing = await databaseService.queryOne(
            'SELECT id FROM cases WHERE case_number = $1',
            [value.case_number]
        );

        if (existing) {
            throw new AppError('Case number already exists', 400);
        }

        // Verify case_type_id exists
        const caseType = await databaseService.queryOne(
            'SELECT id FROM case_types WHERE id = $1',
            [value.case_type_id]
        );

        if (!caseType) {
            throw new AppError('Case type not found', 404);
        }

        // Verify case_category_id if provided
        if (value.case_category_id) {
            const caseCategory = await databaseService.queryOne(
                'SELECT id FROM case_categories WHERE id = $1 AND case_type_id = $2',
                [value.case_category_id, value.case_type_id]
            );

            if (!caseCategory) {
                throw new AppError('Case category not found or does not belong to the specified case type', 404);
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
            INSERT INTO cases (
                case_number, project_id, client_identifier, client_age, client_gender,
                case_type_id, case_category_id, description, status, priority,
                date_reported, date_closed, referred_from, referred_to,
                support_offered, follow_up_required, follow_up_date,
                resolution, tags, notes, created_by, updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
            )
            RETURNING *
        `;

        const caseData = await databaseService.queryOne(query, [
            value.case_number,
            value.project_id,
            value.client_identifier,
            value.client_age,
            value.client_gender,
            value.case_type_id,
            value.case_category_id,
            value.description,
            value.status || 'Open',
            value.priority || 'Medium',
            value.date_reported,
            value.date_closed,
            value.referred_from,
            value.referred_to,
            value.support_offered,
            value.follow_up_required || false,
            value.follow_up_date,
            value.resolution,
            JSON.stringify(value.tags || []),
            value.notes,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Case created successfully',
            data: caseData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/cases/:id
 * Update a case
 */
router.put('/:id', authenticate, checkPermission('cases.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateCaseSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id, case_type_id FROM cases WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Case not found', 404);
        }

        // If case_number is being updated, check uniqueness
        if (value.case_number) {
            const numberExists = await databaseService.queryOne(
                'SELECT id FROM cases WHERE case_number = $1 AND id != $2',
                [value.case_number, id]
            );

            if (numberExists) {
                throw new AppError('Case number already exists', 400);
            }
        }

        // Verify case_type_id if being updated
        if (value.case_type_id) {
            const caseType = await databaseService.queryOne(
                'SELECT id FROM case_types WHERE id = $1',
                [value.case_type_id]
            );

            if (!caseType) {
                throw new AppError('Case type not found', 404);
            }
        }

        // Verify case_category_id if provided
        if (value.case_category_id) {
            const typeId = value.case_type_id || existing.case_type_id;
            const caseCategory = await databaseService.queryOne(
                'SELECT id FROM case_categories WHERE id = $1 AND case_type_id = $2',
                [value.case_category_id, typeId]
            );

            if (!caseCategory) {
                throw new AppError('Case category not found or does not belong to the case type', 404);
            }
        }

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            // Convert tags array to JSON string for JSONB storage
            if (key === 'tags' && Array.isArray(val)) {
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
            UPDATE cases
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const caseData = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Case updated successfully',
            data: caseData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/cases/:id
 * Delete a case
 */
router.delete('/:id', authenticate, checkPermission('cases.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const caseData = await databaseService.queryOne(
            'SELECT id FROM cases WHERE id = $1',
            [id]
        );

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        await databaseService.query('DELETE FROM cases WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Case deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/cases/types/list
 * Get all case types
 */
router.get('/types/list', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const query = `
            SELECT 
                ct.*,
                (SELECT COUNT(*) FROM cases WHERE case_type_id = ct.id) as case_count,
                (SELECT COUNT(*) FROM case_categories WHERE case_type_id = ct.id) as category_count
            FROM case_types ct
            WHERE ct.is_active = true
            ORDER BY ct.display_order, ct.name
        `;

        const caseTypes = await databaseService.query(query);

        res.json({
            success: true,
            data: caseTypes
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/cases/categories/list
 * Get all case categories, optionally filtered by case_type_id
 */
router.get('/categories/list', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { case_type_id } = req.query;

        let query = `
            SELECT 
                cc.*,
                ct.name as case_type_name,
                (SELECT COUNT(*) FROM cases WHERE case_category_id = cc.id) as case_count
            FROM case_categories cc
            LEFT JOIN case_types ct ON cc.case_type_id = ct.id
            WHERE cc.is_active = true
        `;

        const params = [];
        if (case_type_id) {
            query += ' AND cc.case_type_id = $1';
            params.push(case_type_id);
        }

        query += ' ORDER BY cc.display_order, cc.name';

        const categories = await databaseService.query(query, params);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/cases/stats/referrals
 * Get referral statistics
 */
router.get('/stats/referrals', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { project_id, date_from, date_to } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (project_id) {
            filters.push(`c.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            filters.push(`c.date_reported >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            filters.push(`c.date_reported <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE referred_from IS NOT NULL AND referred_from != '') as incoming_referrals,
                COUNT(*) FILTER (WHERE referred_to IS NOT NULL AND referred_to != '') as outgoing_referrals,
                COUNT(*) as total_cases
            FROM cases c
            ${whereClause}
        `;

        const stats = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/cases/stats/follow-ups
 * Get cases requiring follow-up
 */
router.get('/stats/follow-ups', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { overdue_only = 'false' } = req.query;

        let whereClause = 'WHERE c.follow_up_required = true AND c.status != \'Closed\'';
        
        if (overdue_only === 'true') {
            whereClause += ' AND c.follow_up_date < CURRENT_DATE';
        }

        const query = `
            SELECT 
                c.*,
                ct.name as case_type_name,
                cc.name as case_category_name,
                p.name as project_name,
                CASE 
                    WHEN c.follow_up_date < CURRENT_DATE THEN true
                    ELSE false
                END as is_overdue
            FROM cases c
            LEFT JOIN case_types ct ON c.case_type_id = ct.id
            LEFT JOIN case_categories cc ON c.case_category_id = cc.id
            LEFT JOIN projects p ON c.project_id = p.id
            ${whereClause}
            ORDER BY c.follow_up_date ASC
        `;

        const followUps = await databaseService.query(query);

        res.json({
            success: true,
            data: followUps
        });
    } catch (error) {
        next(error);
    }
});

export default router;
