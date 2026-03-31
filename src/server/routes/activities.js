import express from 'express';
import databaseService from '../services/databaseService.js';
import currencyService from '../services/currencyService.js';
import budgetTransferService from '../services/budgetTransferService.js';
import activityService from '../services/activityService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Enhanced validation schemas with multi-currency and disaggregation
const createActivitySchema = Joi.object({
    thematic_area_id: Joi.string().uuid().allow(null),
    indicator_id: Joi.string().uuid().required(),
    project_id: Joi.string().uuid().required(),
    activity_name: Joi.string().required().max(500),
    description: Joi.string().allow('', null),
    planned_date: Joi.date().required(),
    completion_date: Joi.date().allow(null),
    status: Joi.string().valid('Planned', 'In Progress', 'Completed', 'Cancelled').default('Planned'),
    location: Joi.string().allow('', null).max(200),

    // Location hierarchy (overrides free-text location when provided)
    district_id: Joi.string().uuid().allow(null),
    settlement_id: Joi.string().uuid().allow(null),
    
    // Currency fields
    currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('UGX'),
    exchange_rate: Joi.number().min(0).default(1),
    budget: Joi.number().min(0).default(0),
    actual_cost: Joi.number().min(0).default(0),
    is_costed: Joi.boolean().default(true),
    
    // Age disaggregation (by gender)
    age_0_4_male: Joi.number().integer().min(0).default(0),
    age_0_4_female: Joi.number().integer().min(0).default(0),
    age_0_4_other: Joi.number().integer().min(0).default(0),
    age_5_17_male: Joi.number().integer().min(0).default(0),
    age_5_17_female: Joi.number().integer().min(0).default(0),
    age_5_17_other: Joi.number().integer().min(0).default(0),
    age_18_49_male: Joi.number().integer().min(0).default(0),
    age_18_49_female: Joi.number().integer().min(0).default(0),
    age_18_49_other: Joi.number().integer().min(0).default(0),
    age_50_plus_male: Joi.number().integer().min(0).default(0),
    age_50_plus_female: Joi.number().integer().min(0).default(0),
    age_50_plus_other: Joi.number().integer().min(0).default(0),
    
    // Disability disaggregation
    pwds_male: Joi.number().integer().min(0).default(0),
    pwds_female: Joi.number().integer().min(0).default(0),
    pwds_other: Joi.number().integer().min(0).default(0),
    
    // Refugee disaggregation
    refugee_male_0_4: Joi.number().integer().min(0).default(0),
    refugee_male_5_17: Joi.number().integer().min(0).default(0),
    refugee_male_18_49: Joi.number().integer().min(0).default(0),
    refugee_male_50_plus: Joi.number().integer().min(0).default(0),
    refugee_female_0_4: Joi.number().integer().min(0).default(0),
    refugee_female_5_17: Joi.number().integer().min(0).default(0),
    refugee_female_18_49: Joi.number().integer().min(0).default(0),
    refugee_female_50_plus: Joi.number().integer().min(0).default(0),
    
    // Host community disaggregation
    host_male_0_4: Joi.number().integer().min(0).default(0),
    host_male_5_17: Joi.number().integer().min(0).default(0),
    host_male_18_49: Joi.number().integer().min(0).default(0),
    host_male_50_plus: Joi.number().integer().min(0).default(0),
    host_female_0_4: Joi.number().integer().min(0).default(0),
    host_female_5_17: Joi.number().integer().min(0).default(0),
    host_female_18_49: Joi.number().integer().min(0).default(0),
    host_female_50_plus: Joi.number().integer().min(0).default(0),
    
    // Nationality disaggregation
    nationality_sudanese: Joi.number().integer().min(0).default(0),
    nationality_congolese: Joi.number().integer().min(0).default(0),
    nationality_south_sudanese: Joi.number().integer().min(0).default(0),
    nationality_others: Joi.number().integer().min(0).default(0),
    nationals: Joi.number().integer().min(0).default(0),
    refugees: Joi.number().integer().min(0).default(0),
    idps: Joi.number().integer().min(0).default(0),
    returnees: Joi.number().integer().min(0).default(0),

    // Dynamic nationality breakdown (junction table)
    nationality_breakdown: Joi.array().items(Joi.object({
        nationality_id: Joi.string().uuid().required(),
        count: Joi.number().integer().min(0).required()
    })).default([]),

    // Location hierarchy
    district_id: Joi.string().uuid().allow(null),
    settlement_id: Joi.string().uuid().allow(null),
    
    // Legacy fields (for backward compatibility)
    direct_male: Joi.number().integer().min(0).default(0),
    direct_female: Joi.number().integer().min(0).default(0),
    direct_other: Joi.number().integer().min(0).default(0),
    indirect_male: Joi.number().integer().min(0).default(0),
    indirect_female: Joi.number().integer().min(0).default(0),
    indirect_other: Joi.number().integer().min(0).default(0),
    
    notes: Joi.string().allow('', null),

    // New fields — Mission req 2026
    beneficiary_id: Joi.string().max(100).allow('', null),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),

    // Activity classification
    activity_type: Joi.string().valid('program', 'non_program').default('program'),

    target_value: Joi.number().integer().min(0).default(0),
});

const updateActivitySchema = Joi.object({
    thematic_area_id: Joi.string().uuid().allow(null),
    indicator_id: Joi.string().uuid(),
    project_id: Joi.string().uuid(),
    activity_name: Joi.string().max(500),
    description: Joi.string().allow('', null),
    planned_date: Joi.date(),
    completion_date: Joi.date().allow(null),
    status: Joi.string().valid('Planned', 'In Progress', 'Completed', 'Cancelled'),
    location: Joi.string().max(100),
    currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP'),
    exchange_rate: Joi.number().min(0),
    budget: Joi.number().min(0),
    actual_cost: Joi.number().min(0),
    is_costed: Joi.boolean(),
    activity_type: Joi.string().valid('program', 'non_program'),
    age_0_4_male: Joi.number().integer().min(0),
    age_0_4_female: Joi.number().integer().min(0),
    age_0_4_other: Joi.number().integer().min(0),
    age_5_17_male: Joi.number().integer().min(0),
    age_5_17_female: Joi.number().integer().min(0),
    age_5_17_other: Joi.number().integer().min(0),
    age_18_49_male: Joi.number().integer().min(0),
    age_18_49_female: Joi.number().integer().min(0),
    age_18_49_other: Joi.number().integer().min(0),
    age_50_plus_male: Joi.number().integer().min(0),
    age_50_plus_female: Joi.number().integer().min(0),
    age_50_plus_other: Joi.number().integer().min(0),
    pwds_male: Joi.number().integer().min(0),
    pwds_female: Joi.number().integer().min(0),
    pwds_other: Joi.number().integer().min(0),
    refugee_male_0_4: Joi.number().integer().min(0),
    refugee_male_5_17: Joi.number().integer().min(0),
    refugee_male_18_49: Joi.number().integer().min(0),
    refugee_male_50_plus: Joi.number().integer().min(0),
    refugee_female_0_4: Joi.number().integer().min(0),
    refugee_female_5_17: Joi.number().integer().min(0),
    refugee_female_18_49: Joi.number().integer().min(0),
    refugee_female_50_plus: Joi.number().integer().min(0),
    host_male_0_4: Joi.number().integer().min(0),
    host_male_5_17: Joi.number().integer().min(0),
    host_male_18_49: Joi.number().integer().min(0),
    host_male_50_plus: Joi.number().integer().min(0),
    host_female_0_4: Joi.number().integer().min(0),
    host_female_5_17: Joi.number().integer().min(0),
    host_female_18_49: Joi.number().integer().min(0),
    host_female_50_plus: Joi.number().integer().min(0),
    nationality_sudanese: Joi.number().integer().min(0),
    nationality_congolese: Joi.number().integer().min(0),
    nationality_south_sudanese: Joi.number().integer().min(0),
    nationality_others: Joi.number().integer().min(0),

    // Dynamic nationality breakdown (junction table)
    nationality_breakdown: Joi.array().items(Joi.object({
        nationality_id: Joi.string().uuid().required(),
        count: Joi.number().integer().min(0).required()
    })),

    // Location hierarchy
    district_id: Joi.string().uuid().allow(null),
    settlement_id: Joi.string().uuid().allow(null),

    direct_male: Joi.number().integer().min(0),
    direct_female: Joi.number().integer().min(0),
    direct_other: Joi.number().integer().min(0),
    indirect_male: Joi.number().integer().min(0),
    indirect_female: Joi.number().integer().min(0),
    indirect_other: Joi.number().integer().min(0),
    notes: Joi.string().allow('', null),

    // New fields — Mission req 2026
    beneficiary_id: Joi.string().max(100).allow('', null),
    latitude: Joi.number().min(-90).max(90).allow(null),
    longitude: Joi.number().min(-180).max(180).allow(null),

    target_value: Joi.number().integer().min(0)
}).min(1);

const budgetTransferSchema = Joi.object({
    from_activity_id: Joi.string().uuid().required(),
    to_activity_id: Joi.string().uuid().required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('UGX'),
    reason: Joi.string().required().max(500),
    requested_by: Joi.string().uuid().allow(null)
});

const approveBudgetTransferSchema = Joi.object({
    approval_status: Joi.string().valid('approved', 'rejected').required(),
    approval_notes: Joi.string().allow('', null)
});

/**
 * GET /api/v1/activities
 * List all activities with enhanced filtering
 */
router.get('/', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status,
            indicator_id,
            project_id,
            currency,
            is_costed,
            search 
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            filters.push(`a.status = $${paramIndex++}`);
            params.push(status);
        }

        if (indicator_id) {
            filters.push(`a.indicator_id = $${paramIndex++}`);
            params.push(indicator_id);
        }

        if (project_id) {
            filters.push(`a.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (currency) {
            filters.push(`a.currency = $${paramIndex++}`);
            params.push(currency);
        }

        if (is_costed !== undefined) {
            filters.push(`a.is_costed = $${paramIndex++}`);
            params.push(is_costed === 'true');
        }

        if (search) {
            filters.push(`(a.activity_name ILIKE $${paramIndex} OR a.location ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) as total FROM activities a ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                a.*,
                ta.name as thematic_area_name,
                i.name as indicator_name,
                i.indicator_scope,
                p.name as project_name,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                a.total_beneficiaries,
                CASE 
                    WHEN a.budget > 0 THEN (a.actual_cost / a.budget * 100)::NUMERIC(12,2)
                    ELSE 0 
                END as budget_utilization_percentage
            FROM activities a
            LEFT JOIN thematic_areas ta ON a.thematic_area_id = ta.id
            LEFT JOIN indicators i ON a.indicator_id = i.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u1 ON a.created_by = u1.id
            LEFT JOIN users u2 ON a.updated_by = u2.id
            ${whereClause}
            ORDER BY a.planned_date DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const activitiesResult = await databaseService.query(query, params);

        res.json({
            success: true,
            data: {
                activities: activitiesResult.rows,
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
 * POST /api/v1/activities
 * Create a new activity with enhanced fields
 */
router.post('/', authenticate, checkPermission('activities.create'), async (req, res, next) => {
    try {
        const { error, value } = createActivitySchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Verify indicator exists
        const indicator = await databaseService.queryOne(
            'SELECT id FROM indicators WHERE id = $1',
            [value.indicator_id]
        );

        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }

        // Verify project exists
        const project = await databaseService.queryOne(
            'SELECT id FROM projects WHERE id = $1',
            [value.project_id]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Resolve location from district/settlement if provided
        let resolvedLocation = value.location || '';
        if (value.district_id) {
            const districtRow = await databaseService.queryOne(
                'SELECT config_value FROM system_configurations WHERE id = $1 AND config_type = $2',
                [value.district_id, 'district']
            );
            const districtName = districtRow?.config_value || value.district_id;
            resolvedLocation = districtName;
            if (value.settlement_id) {
                const settlementRow = await databaseService.queryOne(
                    'SELECT config_value FROM system_configurations WHERE id = $1 AND config_type = $2',
                    [value.settlement_id, 'settlement']
                );
                if (settlementRow) resolvedLocation = `${districtName} / ${settlementRow.config_value}`;
            }
        }

        const nationalityBreakdown = value.nationality_breakdown || [];

        const query = `
                thematic_area_id, indicator_id, project_id, activity_name, description,
                planned_date, completion_date, status, location,
                currency, exchange_rate, budget, actual_cost, is_costed,
                age_0_4_male, age_0_4_female, age_0_4_other,
                age_5_17_male, age_5_17_female, age_5_17_other,
                age_18_49_male, age_18_49_female, age_18_49_other,
                age_50_plus_male, age_50_plus_female, age_50_plus_other,
                pwds_male, pwds_female, pwds_other,
                refugee_male_0_4, refugee_male_5_17, refugee_male_18_49, refugee_male_50_plus,
                refugee_female_0_4, refugee_female_5_17, refugee_female_18_49, refugee_female_50_plus,
                host_male_0_4, host_male_5_17, host_male_18_49, host_male_50_plus,
                host_female_0_4, host_female_5_17, host_female_18_49, host_female_50_plus,
                nationality_sudanese, nationality_congolese, nationality_south_sudanese, nationality_others,
                nationals, refugees, idps, returnees,
                direct_male, direct_female, direct_other,
                indirect_male, indirect_female, indirect_other,
                notes, activity_type, created_by, updated_by, target_value
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
                $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
                $61, $62, $63, $64
            )
            RETURNING *
        `;

        const activity = await databaseService.queryOne(query, [
            value.thematic_area_id,
            value.indicator_id,
            value.project_id,
            value.activity_name,
            value.description,
            value.planned_date,
            value.completion_date,
            value.status || 'Planned',
            resolvedLocation,
            value.currency || 'UGX',
            value.exchange_rate || 1,
            value.budget || 0,
            value.actual_cost || 0,
            value.is_costed !== undefined ? value.is_costed : true,
            value.age_0_4_male || 0,
            value.age_0_4_female || 0,
            value.age_0_4_other || 0,
            value.age_5_17_male || 0,
            value.age_5_17_female || 0,
            value.age_5_17_other || 0,
            value.age_18_49_male || 0,
            value.age_18_49_female || 0,
            value.age_18_49_other || 0,
            value.age_50_plus_male || 0,
            value.age_50_plus_female || 0,
            value.age_50_plus_other || 0,
            value.pwds_male || 0,
            value.pwds_female || 0,
            value.pwds_other || 0,
            value.refugee_male_0_4 || 0,
            value.refugee_male_5_17 || 0,
            value.refugee_male_18_49 || 0,
            value.refugee_male_50_plus || 0,
            value.refugee_female_0_4 || 0,
            value.refugee_female_5_17 || 0,
            value.refugee_female_18_49 || 0,
            value.refugee_female_50_plus || 0,
            value.host_male_0_4 || 0,
            value.host_male_5_17 || 0,
            value.host_male_18_49 || 0,
            value.host_male_50_plus || 0,
            value.host_female_0_4 || 0,
            value.host_female_5_17 || 0,
            value.host_female_18_49 || 0,
            value.host_female_50_plus || 0,
            value.nationality_sudanese || 0,
            value.nationality_congolese || 0,
            value.nationality_south_sudanese || 0,
            value.nationality_others || 0,
            value.nationals || 0,
            value.refugees || 0,
            value.idps || 0,
            value.returnees || 0,
            value.direct_male || 0,
            value.direct_female || 0,
            value.direct_other || 0,
            value.indirect_male || 0,
            value.indirect_female || 0,
            value.indirect_other || 0,
            value.notes,
            value.activity_type || 'program',
            req.user.id,
            req.user.id,
            value.target_value || 0,
        ]);

        // Upsert nationality breakdown rows
        if (nationalityBreakdown.length > 0) {
            for (const nb of nationalityBreakdown) {
                await databaseService.query(
                    `INSERT INTO activity_nationality_breakdown (activity_id, nationality_id, count)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (activity_id, nationality_id) DO UPDATE SET count = EXCLUDED.count`,
                    [activity.id, nb.nationality_id, nb.count]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Activity created successfully',
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/budget-transfers/list
 * Get all budget transfers with filtering
 */
router.get('/budget-transfers/list', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { 
            approval_status,
            project_id,
            page = 1,
            limit = 50
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (approval_status) {
            filters.push(`bt.approval_status = $${paramIndex++}`);
            params.push(approval_status);
        }

        if (project_id) {
            filters.push(`(a_from.project_id = $${paramIndex} OR a_to.project_id = $${paramIndex})`);
            params.push(project_id);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM activity_budget_transfers bt
            LEFT JOIN activities a_from ON bt.from_activity_id = a_from.id
            LEFT JOIN activities a_to ON bt.to_activity_id = a_to.id
            ${whereClause}
        `;
        const { total } = await databaseService.queryOne(countQuery, params);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const query = `
            SELECT 
                bt.*,
                a_from.activity_name as from_activity_name,
                a_from.project_id as from_project_id,
                p_from.name as from_project_name,
                a_to.activity_name as to_activity_name,
                a_to.project_id as to_project_id,
                p_to.name as to_project_name,
                u_req.username as requested_by_username,
                u_app.username as approved_by_username
            FROM activity_budget_transfers bt
            LEFT JOIN activities a_from ON bt.from_activity_id = a_from.id
            LEFT JOIN activities a_to ON bt.to_activity_id = a_to.id
            LEFT JOIN projects p_from ON a_from.project_id = p_from.id
            LEFT JOIN projects p_to ON a_to.project_id = p_to.id
            LEFT JOIN users u_req ON bt.requested_by = u_req.id
            LEFT JOIN users u_app ON bt.approved_by = u_app.id
            ${whereClause}
            ORDER BY bt.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const transfersResult = await databaseService.query(query, params);

        res.json({
            success: true,
            data: {
                transfers: transfersResult.rows,
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
 * POST /api/v1/activities/budget-transfers
 * Create a new budget transfer request
 */
router.post('/budget-transfers', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { error, value } = budgetTransferSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Verify both activities exist
        const fromActivity = await databaseService.queryOne(
            'SELECT id, budget, actual_cost, currency FROM activities WHERE id = $1',
            [value.from_activity_id]
        );

        if (!fromActivity) {
            throw new AppError('Source activity not found', 404);
        }

        const toActivity = await databaseService.queryOne(
            'SELECT id FROM activities WHERE id = $1',
            [value.to_activity_id]
        );

        if (!toActivity) {
            throw new AppError('Destination activity not found', 404);
        }

        // Check if source activity has enough budget
        const availableBudget = fromActivity.budget - fromActivity.actual_cost;
        if (value.amount > availableBudget) {
            throw new AppError(`Insufficient budget. Available: ${availableBudget}`, 400);
        }

        const query = `
            INSERT INTO activity_budget_transfers (
                from_activity_id, to_activity_id, amount, currency,
                reason, requested_by, approval_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `;

        const transfer = await databaseService.queryOne(query, [
            value.from_activity_id,
            value.to_activity_id,
            value.amount,
            value.currency || fromActivity.currency,
            value.reason,
            value.requested_by || req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Budget transfer request created successfully',
            data: transfer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/activities/budget-transfers/:id/approve
 * Approve or reject a budget transfer
 */
router.put('/budget-transfers/:id/approve', authenticate, checkPermission('activities.approve_transfers'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = approveBudgetTransferSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const transfer = await databaseService.queryOne(
            'SELECT * FROM activity_budget_transfers WHERE id = $1',
            [id]
        );

        if (!transfer) {
            throw new AppError('Budget transfer not found', 404);
        }

        if (transfer.approval_status !== 'pending') {
            throw new AppError('Budget transfer has already been processed', 400);
        }

        const query = `
            UPDATE activity_budget_transfers
            SET 
                approval_status = $1,
                approved_by = $2,
                approval_date = CURRENT_TIMESTAMP,
                approval_notes = $3
            WHERE id = $4
            RETURNING *
        `;

        const updatedTransfer = await databaseService.queryOne(query, [
            value.approval_status,
            req.user.id,
            value.approval_notes,
            id
        ]);

        // If approved, update activity budgets
        if (value.approval_status === 'approved') {
            await databaseService.query(
                'UPDATE activities SET budget = budget - $1 WHERE id = $2',
                [transfer.amount, transfer.from_activity_id]
            );

            await databaseService.query(
                'UPDATE activities SET budget = budget + $1 WHERE id = $2',
                [transfer.amount, transfer.to_activity_id]
            );
        }

        res.json({
            success: true,
            message: `Budget transfer ${value.approval_status} successfully`,
            data: updatedTransfer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/activities/budget-transfers/:id
 * Delete a pending budget transfer
 */
router.delete('/budget-transfers/:id', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const transfer = await databaseService.queryOne(
            'SELECT approval_status FROM activity_budget_transfers WHERE id = $1',
            [id]
        );

        if (!transfer) {
            throw new AppError('Budget transfer not found', 404);
        }

        if (transfer.approval_status !== 'pending') {
            throw new AppError('Only pending transfers can be deleted', 400);
        }

        await databaseService.query(
            'DELETE FROM activity_budget_transfers WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Budget transfer deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/activities/budget-transfers/new
 * Create a new budget transfer between projects/activities (Enhanced)
 */
router.post('/budget-transfers/new', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const transferSchema = Joi.object({
            sourceProjectId: Joi.string().uuid().required(),
            destinationProjectId: Joi.string().uuid().required(),
            destinationActivityId: Joi.string().uuid().required(),
            amount: Joi.number().min(0).required(),
            currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('UGX'),
            reason: Joi.string().required().min(20).max(500)
        });

        const { error, value } = transferSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const transfer = await budgetTransferService.createTransfer({
            ...value,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Budget transfer created successfully',
            data: transfer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/budget-transfers/activity/:activityId
 * Get budget transfer history for an activity
 */
router.get('/budget-transfers/activity/:activityId', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { activityId } = req.params;

        const history = await budgetTransferService.getActivityTransferHistory(activityId);

        res.json({
            success: true,
            data: {
                activityId,
                transfers: history,
                count: history.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/budget-transfers/project/:projectId
 * Get budget transfer history for a project
 */
router.get('/budget-transfers/project/:projectId', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { direction = 'both' } = req.query;

        const history = await budgetTransferService.getProjectTransferHistory(projectId, direction);

        res.json({
            success: true,
            data: {
                projectId,
                direction,
                transfers: history,
                count: history.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/activities/budget-transfers/:transferId/reverse
 * Reverse a budget transfer
 */
router.post('/budget-transfers/:transferId/reverse', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { transferId } = req.params;
        const reverseSchema = Joi.object({
            reason: Joi.string().required().min(20).max(500)
        });

        const { error, value } = reverseSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const reversedTransfer = await budgetTransferService.reverseTransfer(
            transferId,
            value.reason,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Budget transfer reversed successfully',
            data: reversedTransfer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/budget-transfers/:transferId
 * Get specific transfer details
 */
router.get('/budget-transfers/:transferId', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { transferId } = req.params;

        const transfer = await budgetTransferService.getTransferById(transferId);

        res.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/activities/currency-rates
 * Create or update exchange rate
 */
router.post('/currency-rates', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const rateSchema = Joi.object({
            fromCurrency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').required(),
            toCurrency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').required(),
            rate: Joi.number().min(0).required(),
            effectiveDate: Joi.date().required(),
            source: Joi.string().valid('manual', 'api', 'official').default('manual')
        });

        const { error, value } = rateSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const rate = await currencyService.updateExchangeRate(
            value.fromCurrency,
            value.toCurrency,
            value.rate,
            value.effectiveDate,
            value.source,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Exchange rate created successfully',
            data: rate
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/currency-rates
 * Get all active exchange rates
 */
router.get('/currency-rates', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { date } = req.query;
        const effectiveDate = date ? new Date(date) : new Date();

        const rates = await currencyService.getAllRates(effectiveDate);

        res.json({
            success: true,
            data: {
                rates,
                effectiveDate,
                supportedCurrencies: currencyService.SUPPORTED_CURRENCIES,
                defaultCurrency: currencyService.DEFAULT_CURRENCY
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/currency-rates/:from/:to
 * Get specific exchange rate
 */
router.get('/currency-rates/:from/:to', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { from, to } = req.params;
        const { date } = req.query;
        const effectiveDate = date ? new Date(date) : new Date();

        const rate = await currencyService.getExchangeRate(from, to, effectiveDate);

        res.json({
            success: true,
            data: {
                fromCurrency: from,
                toCurrency: to,
                rate,
                effectiveDate
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/currency-rates/:from/:to/history
 * Get exchange rate history
 */
router.get('/currency-rates/:from/:to/history', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { from, to } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate) {
            throw new AppError('Start date is required', 400);
        }

        const history = await currencyService.getRateHistory(
            from,
            to,
            new Date(startDate),
            endDate ? new Date(endDate) : new Date()
        );

        res.json({
            success: true,
            data: {
                fromCurrency: from,
                toCurrency: to,
                history,
                count: history.length
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/financial-summary/:projectId
 * Get comprehensive financial summary for a project
 */
router.get('/financial-summary/:projectId', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const summary = await activityService.getProjectFinancialSummary(projectId);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/activities/:activityId/budget
 * Get activity budget with all calculations
 */
router.get('/:activityId/budget', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { activityId } = req.params;
        const { convertTo } = req.query;

        let budgetData;
        if (convertTo) {
            budgetData = await activityService.convertActivityBudget(activityId, convertTo);
        } else {
            budgetData = await activityService.calculateTotalBudget(activityId);
        }

        res.json({
            success: true,
            data: budgetData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/activities/validate-transfer
 * Validate if a budget transfer is possible
 */
router.post('/validate-transfer', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const validateSchema = Joi.object({
            sourceProjectId: Joi.string().uuid().required(),
            amount: Joi.number().min(0).required(),
            currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('UGX')
        });

        const { error, value } = validateSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const validation = await budgetTransferService.validateTransfer(
            value.sourceProjectId,
            value.amount,
            value.currency
        );

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// GENERIC CRUD ROUTES (Must be LAST to not catch specific routes)
// ============================================================================

/**
 * GET /api/v1/activities/:id
 * Get a single activity with full disaggregation details
 */
router.get('/:id', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                a.*,
                ta.name as thematic_area_name,
                i.name as indicator_name,
                i.indicator_scope,
                p.name as project_name,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                a.total_beneficiaries,
                CASE 
                    WHEN a.budget > 0 THEN (a.actual_cost / a.budget * 100)::NUMERIC(12,2)
                    ELSE 0 
                END as budget_utilization_percentage
            FROM activities a
            LEFT JOIN thematic_areas ta ON a.thematic_area_id = ta.id
            LEFT JOIN indicators i ON a.indicator_id = i.id
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u1 ON a.created_by = u1.id
            LEFT JOIN users u2 ON a.updated_by = u2.id
            WHERE a.id = $1
        `;

        const activity = await databaseService.queryOne(query, [id]);

        if (!activity) {
            throw new AppError('Activity not found', 404);
        }

        // Add disaggregation breakdown
        activity.disaggregation = {
            age: {
                age_0_5: activity.age_0_5,
                age_6_12: activity.age_6_12,
                age_13_17: activity.age_13_17,
                age_18_24: activity.age_18_24,
                age_25_49: activity.age_25_49,
                age_50_plus: activity.age_50_plus
            },
            gender: {
                male: activity.male_beneficiaries,
                female: activity.female_beneficiaries
            },
            disability: {
                pwd: activity.pwd_beneficiaries
            },
            nationality: {
                nationals: activity.nationals,
                refugees: activity.refugees,
                idps: activity.idps,
                returnees: activity.returnees
            }
        };

        // Get budget transfers for this activity
        const transfersQuery = `
            SELECT 
                bt.*,
                a_from.activity_name as from_activity_name,
                a_to.activity_name as to_activity_name,
                u_req.username as requested_by_username,
                u_app.username as approved_by_username
            FROM activity_budget_transfers bt
            LEFT JOIN activities a_from ON bt.from_activity_id = a_from.id
            LEFT JOIN activities a_to ON bt.to_activity_id = a_to.id
            LEFT JOIN users u_req ON bt.requested_by = u_req.id
            LEFT JOIN users u_app ON bt.approved_by = u_app.id
            WHERE bt.from_activity_id = $1 OR bt.to_activity_id = $1
            ORDER BY bt.created_at DESC
        `;

        const btResult = await databaseService.query(transfersQuery, [id]);
        activity.budget_transfers = btResult.rows;

        // Fetch nationality breakdown if the table exists
        try {
            const nbResult = await databaseService.query(
                `SELECT anb.nationality_id, anb.count, sc.config_value AS nationality_name, sc.config_code AS nationality_code
                 FROM activity_nationality_breakdown anb
                 JOIN system_configurations sc ON anb.nationality_id = sc.id
                 WHERE anb.activity_id = $1
                 ORDER BY sc.display_order`,
                [id]
            );
            activity.nationality_breakdown = nbResult.rows;
        } catch (_) {
            activity.nationality_breakdown = [];
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
 * PUT /api/v1/activities/:id
 * Update an activity
 */
router.put('/:id', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateActivitySchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id, is_locked FROM activities WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Activity not found', 404);
        }

        if (existing.is_locked) {
            throw new AppError('Activity is locked. Unlock it before making changes.', 403);
        }

        // Validate indicator_id if being updated
        if (value.indicator_id) {
            const indicator = await databaseService.queryOne(
                'SELECT id FROM indicators WHERE id = $1',
                [value.indicator_id]
            );

            if (!indicator) {
                throw new AppError('Indicator not found', 404);
            }
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

        // Build dynamic update query
        const updates = [];
        const params = [];
        let paramIndex = 1;

        // Extract special fields before building column updates
        const nationalityBreakdown = value.nationality_breakdown;
        const districtId = value.district_id;
        const settlementId = value.settlement_id;

        const updatePayload = { ...value };
        delete updatePayload.nationality_breakdown;
        delete updatePayload.district_id;
        delete updatePayload.settlement_id;

        // Resolve location from district/settlement if provided
        if (districtId) {
            const districtRow = await databaseService.queryOne(
                'SELECT config_value FROM system_configurations WHERE id = $1 AND config_type = $2',
                [districtId, 'district']
            );
            const districtName = districtRow?.config_value || districtId;
            let resolvedLoc = districtName;
            if (settlementId) {
                const settlementRow = await databaseService.queryOne(
                    'SELECT config_value FROM system_configurations WHERE id = $1 AND config_type = $2',
                    [settlementId, 'settlement']
                );
                if (settlementRow) resolvedLoc = `${districtName} / ${settlementRow.config_value}`;
            }
            updatePayload.location = resolvedLoc;
        }

        Object.entries(updatePayload).forEach(([key, val]) => {
            updates.push(`${key} = $${paramIndex++}`);
            params.push(val);
        });

        updates.push(`updated_by = $${paramIndex++}`, `updated_at = CURRENT_TIMESTAMP`);
        params.push(req.user.id, id);

        const query = `
            UPDATE activities
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const activity = await databaseService.queryOne(query, params);

        // Upsert nationality breakdown if provided
        if (Array.isArray(nationalityBreakdown) && nationalityBreakdown.length > 0) {
            for (const nb of nationalityBreakdown) {
                await databaseService.query(
                    `INSERT INTO activity_nationality_breakdown (activity_id, nationality_id, count)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (activity_id, nationality_id) DO UPDATE SET count = EXCLUDED.count`,
                    [id, nb.nationality_id, nb.count]
                );
            }
        }

        res.json({
            success: true,
            message: 'Activity updated successfully',
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/activities/:id
 * Delete an activity
 */
router.delete('/:id', authenticate, checkPermission('activities.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const activity = await databaseService.queryOne(
            'SELECT id, is_locked FROM activities WHERE id = $1',
            [id]
        );

        if (!activity) {
            throw new AppError('Activity not found', 404);
        }

        if (activity.is_locked) {
            throw new AppError('Activity is locked and cannot be deleted.', 403);
        }

        // Check for budget transfers
        const transfers = await databaseService.queryOne(
            'SELECT COUNT(*) as count FROM activity_budget_transfers WHERE from_activity_id = $1 OR to_activity_id = $1',
            [id]
        );

        if (transfers.count > 0) {
            throw new AppError('Cannot delete activity with budget transfers. Please remove transfers first.', 400);
        }

        await databaseService.query('DELETE FROM activities WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/v1/activities/:id/lock
 * Lock or unlock an activity.
 * Body: { locked: true|false }
 * Requires activities.update permission.
 */
router.patch('/:id/lock', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { locked } = req.body;

        if (typeof locked !== 'boolean') {
            throw new AppError('Body must contain { locked: true } or { locked: false }', 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id FROM activities WHERE id = $1',
            [id]
        );
        if (!existing) throw new AppError('Activity not found', 404);

        const userId = req.user.userId || req.user.id || null;

        const activity = await databaseService.queryOne(
            `UPDATE activities
             SET is_locked  = $1,
                 locked_by  = $2,
                 locked_at  = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, activity_name, is_locked, locked_by, locked_at`,
            [locked, locked ? userId : null, locked ? new Date() : null, id]
        );

        res.json({
            success: true,
            message: `Activity ${locked ? 'locked' : 'unlocked'} successfully`,
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Activity Funding Sources  (#6 — multi-source funding)
// ─────────────────────────────────────────────────────────────────────────────

const fundingSourceSchema = Joi.object({
    source_name: Joi.string().required().max(200),
    source_type: Joi.string().valid('donor','grant','co-funding','own-funds','other').default('donor'),
    amount:      Joi.number().min(0).required(),
    currency:    Joi.string().max(10).default('UGX'),
    percentage:  Joi.number().min(0).max(100).allow(null),
    notes:       Joi.string().allow('', null),
});

/**
 * GET /api/v1/activities/:id/funding-sources
 * List all funding sources for an activity.
 */
router.get('/:id/funding-sources', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const fsResult = await databaseService.query(
            `SELECT afs.*, u.full_name AS created_by_name
             FROM activity_funding_sources afs
             LEFT JOIN users u ON u.id = afs.created_by
             WHERE afs.activity_id = $1
             ORDER BY afs.created_at ASC`,
            [id]
        );
        res.json({ success: true, data: fsResult.rows });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/activities/:id/funding-sources
 * Add a funding source to an activity.
 */
router.post('/:id/funding-sources', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = fundingSourceSchema.validate(req.body);
        if (error) throw new AppError(error.details[0].message, 400);

        const { source_name, source_type, amount, currency, percentage, notes } = value;
        const userId = req.user.id;

        const row = await databaseService.queryOne(
            `INSERT INTO activity_funding_sources
               (activity_id, source_name, source_type, amount, currency, percentage, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [id, source_name, source_type, amount, currency, percentage ?? null, notes ?? null, userId]
        );
        res.status(201).json({ success: true, data: row });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/activities/:id/funding-sources/:sourceId
 * Remove a funding source.
 */
router.delete('/:id/funding-sources/:sourceId', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { id, sourceId } = req.params;
        const result = await databaseService.query(
            `DELETE FROM activity_funding_sources WHERE id = $1 AND activity_id = $2 RETURNING id`,
            [sourceId, id]
        );
        if (!result.rows.length) throw new AppError('Funding source not found', 404);
        res.json({ success: true, message: 'Funding source removed' });
    } catch (error) {
        next(error);
    }
});

export default router;

