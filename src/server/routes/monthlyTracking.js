import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';
import monthlySnapshotService from '../services/monthlySnapshotService.js';
import performanceRateService from '../services/performanceRateService.js';
import reachVsTargetService from '../services/reachVsTargetService.js';

const router = express.Router();

// Validation schemas for monthly snapshots
const createSnapshotSchema = Joi.object({
    project_id: Joi.string().uuid().required(),
    snapshot_date: Joi.date().required(),
    
    // Activity metrics
    planned_activities: Joi.number().integer().min(0).default(0),
    completed_activities: Joi.number().integer().min(0).default(0),
    
    // Beneficiary metrics
    target_beneficiaries: Joi.number().integer().min(0).default(0),
    actual_beneficiaries: Joi.number().integer().min(0).default(0),
    
    // Financial metrics
    total_budget: Joi.number().min(0).default(0),
    total_expenditure: Joi.number().min(0).default(0),
    
    // Indicator metrics
    total_indicators: Joi.number().integer().min(0).default(0),
    indicators_on_track: Joi.number().integer().min(0).default(0),
    
    notes: Joi.string().allow('', null)
});

const updateSnapshotSchema = Joi.object({
    snapshot_date: Joi.date(),
    planned_activities: Joi.number().integer().min(0),
    completed_activities: Joi.number().integer().min(0),
    target_beneficiaries: Joi.number().integer().min(0),
    actual_beneficiaries: Joi.number().integer().min(0),
    total_budget: Joi.number().min(0),
    total_expenditure: Joi.number().min(0),
    total_indicators: Joi.number().integer().min(0),
    indicators_on_track: Joi.number().integer().min(0),
    notes: Joi.string().allow('', null)
}).min(1);

/**
 * GET /api/v1/monthly-tracking
 * List all monthly snapshots with filtering
 */
router.get('/', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            project_id,
            date_from,
            date_to,
            year,
            month
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (project_id) {
            filters.push(`ms.project_id = $${paramIndex++}`);
            params.push(project_id);
        }

        if (date_from) {
            filters.push(`ms.snapshot_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            filters.push(`ms.snapshot_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        if (year) {
            filters.push(`EXTRACT(YEAR FROM ms.snapshot_date) = $${paramIndex++}`);
            params.push(parseInt(year));
        }

        if (month) {
            filters.push(`EXTRACT(MONTH FROM ms.snapshot_date) = $${paramIndex++}`);
            params.push(parseInt(month));
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) as total FROM monthly_snapshots ms ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                ms.*,
                p.name as project_name,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM monthly_snapshots ms
            LEFT JOIN projects p ON ms.project_id = p.id
            LEFT JOIN users u1 ON ms.created_by = u1.id
            LEFT JOIN users u2 ON ms.updated_by = u2.id
            ${whereClause}
            ORDER BY ms.snapshot_date DESC, p.name
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const snapshots = await databaseService.query(query, params);

        res.json({
            success: true,
            data: {
                snapshots,
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
 * GET /api/v1/monthly-tracking/:id
 * Get a single monthly snapshot
 */
router.get('/:id', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                ms.*,
                p.name as project_name,
                p.budget as project_budget,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM monthly_snapshots ms
            LEFT JOIN projects p ON ms.project_id = p.id
            LEFT JOIN users u1 ON ms.created_by = u1.id
            LEFT JOIN users u2 ON ms.updated_by = u2.id
            WHERE ms.id = $1
        `;

        const snapshot = await databaseService.queryOne(query, [id]);

        if (!snapshot) {
            throw new AppError('Monthly snapshot not found', 404);
        }

        // Add performance metrics breakdown
        snapshot.performance_breakdown = {
            activity_completion: {
                rate: snapshot.activity_completion_rate,
                planned: snapshot.planned_activities,
                completed: snapshot.completed_activities
            },
            beneficiary_reach: {
                rate: snapshot.beneficiary_reach_rate,
                target: snapshot.target_beneficiaries,
                actual: snapshot.actual_beneficiaries
            },
            financial_burn: {
                rate: snapshot.financial_burn_rate,
                budget: snapshot.total_budget,
                expenditure: snapshot.total_expenditure
            },
            programmatic_performance: {
                rate: snapshot.programmatic_performance_rate,
                total_indicators: snapshot.total_indicators,
                on_track: snapshot.indicators_on_track
            }
        };

        res.json({
            success: true,
            data: snapshot
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/project/:project_id/trend
 * Get performance trend for a project over time
 */
router.get('/project/:project_id/trend', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { project_id } = req.params;
        const { months = 12 } = req.query;

        // Verify project exists
        const project = await databaseService.queryOne(
            'SELECT id, name FROM projects WHERE id = $1',
            [project_id]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const query = `
            SELECT 
                ms.*,
                TO_CHAR(ms.snapshot_date, 'YYYY-MM') as month_label
            FROM monthly_snapshots ms
            WHERE ms.project_id = $1
            ORDER BY ms.snapshot_date DESC
            LIMIT $2
        `;

        const snapshots = await databaseService.query(query, [project_id, parseInt(months)]);

        // Calculate averages
        const avgActivityRate = snapshots.length > 0 
            ? snapshots.reduce((sum, s) => sum + (s.activity_completion_rate || 0), 0) / snapshots.length 
            : 0;
        const avgBeneficiaryRate = snapshots.length > 0 
            ? snapshots.reduce((sum, s) => sum + (s.beneficiary_reach_rate || 0), 0) / snapshots.length 
            : 0;
        const avgBurnRate = snapshots.length > 0 
            ? snapshots.reduce((sum, s) => sum + (s.financial_burn_rate || 0), 0) / snapshots.length 
            : 0;
        const avgProgrammaticRate = snapshots.length > 0 
            ? snapshots.reduce((sum, s) => sum + (s.programmatic_performance_rate || 0), 0) / snapshots.length 
            : 0;

        res.json({
            success: true,
            data: {
                project_name: project.name,
                project_id: project.id,
                snapshots: snapshots.reverse(), // Oldest to newest for trend display
                averages: {
                    activity_completion_rate: avgActivityRate.toFixed(2),
                    beneficiary_reach_rate: avgBeneficiaryRate.toFixed(2),
                    financial_burn_rate: avgBurnRate.toFixed(2),
                    programmatic_performance_rate: avgProgrammaticRate.toFixed(2)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/monthly-tracking
 * Create a new monthly snapshot
 */
router.post('/', authenticate, checkPermission('monthly_tracking.create'), async (req, res, next) => {
    try {
        const { error, value } = createSnapshotSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Verify project exists
        const project = await databaseService.queryOne(
            'SELECT id FROM projects WHERE id = $1',
            [value.project_id]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Check if snapshot already exists for this project and date (same month)
        const existing = await databaseService.queryOne(
            `SELECT id FROM monthly_snapshots 
             WHERE project_id = $1 
             AND DATE_TRUNC('month', snapshot_date) = DATE_TRUNC('month', $2::date)`,
            [value.project_id, value.snapshot_date]
        );

        if (existing) {
            throw new AppError('A snapshot for this project and month already exists', 400);
        }

        const query = `
            INSERT INTO monthly_snapshots (
                project_id, snapshot_date,
                planned_activities, completed_activities,
                target_beneficiaries, actual_beneficiaries,
                total_budget, total_expenditure,
                total_indicators, indicators_on_track,
                notes, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
            RETURNING *
        `;

        const snapshot = await databaseService.queryOne(query, [
            value.project_id,
            value.snapshot_date,
            value.planned_activities || 0,
            value.completed_activities || 0,
            value.target_beneficiaries || 0,
            value.actual_beneficiaries || 0,
            value.total_budget || 0,
            value.total_expenditure || 0,
            value.total_indicators || 0,
            value.indicators_on_track || 0,
            value.notes,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Monthly snapshot created successfully',
            data: snapshot
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/monthly-tracking/:id
 * Update a monthly snapshot
 */
router.put('/:id', authenticate, checkPermission('monthly_tracking.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateSnapshotSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const existing = await databaseService.queryOne(
            'SELECT id FROM monthly_snapshots WHERE id = $1',
            [id]
        );

        if (!existing) {
            throw new AppError('Monthly snapshot not found', 404);
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
            UPDATE monthly_snapshots
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const snapshot = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            message: 'Monthly snapshot updated successfully',
            data: snapshot
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/monthly-tracking/:id
 * Delete a monthly snapshot
 */
router.delete('/:id', authenticate, checkPermission('monthly_tracking.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const snapshot = await databaseService.queryOne(
            'SELECT id FROM monthly_snapshots WHERE id = $1',
            [id]
        );

        if (!snapshot) {
            throw new AppError('Monthly snapshot not found', 404);
        }

        await databaseService.query('DELETE FROM monthly_snapshots WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Monthly snapshot deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/stats/summary
 * Get overall summary statistics across all projects
 */
router.get('/stats/summary', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { date_from, date_to } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (date_from) {
            filters.push(`ms.snapshot_date >= $${paramIndex++}`);
            params.push(date_from);
        }

        if (date_to) {
            filters.push(`ms.snapshot_date <= $${paramIndex++}`);
            params.push(date_to);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        const query = `
            SELECT 
                COUNT(DISTINCT ms.project_id) as total_projects,
                COUNT(*) as total_snapshots,
                AVG(ms.activity_completion_rate) as avg_activity_rate,
                AVG(ms.beneficiary_reach_rate) as avg_beneficiary_rate,
                AVG(ms.financial_burn_rate) as avg_burn_rate,
                AVG(ms.programmatic_performance_rate) as avg_programmatic_rate,
                SUM(ms.completed_activities) as total_completed_activities,
                SUM(ms.actual_beneficiaries) as total_beneficiaries_reached,
                SUM(ms.total_expenditure) as total_expenditure
            FROM monthly_snapshots ms
            ${whereClause}
        `;

        const summary = await databaseService.queryOne(query, params);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
});

// ============ ENHANCED MONTHLY SNAPSHOT ROUTES ============

/**
 * POST /api/v1/monthly-tracking/snapshots/generate
 * Generate monthly snapshot for current or specified month
 */
router.post('/snapshots/generate', authenticate, checkPermission('monthly_tracking.create'), async (req, res, next) => {
    try {
        const { month, year, project_id } = req.body;
        
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();
        
        const result = await monthlySnapshotService.generateSnapshot(targetMonth, targetYear, project_id);
        
        res.json({
            success: true,
            message: 'Monthly snapshot(s) generated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/snapshots/:month/:year
 * Get snapshots for a specific month/year
 */
router.get('/snapshots/:month/:year', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { month, year } = req.params;
        const { project_id } = req.query;
        
        const snapshots = await monthlySnapshotService.getSnapshot(
            parseInt(month),
            parseInt(year),
            project_id
        );
        
        res.json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                snapshots
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/snapshots/project/:projectId
 * Get all snapshots for a project over date range
 */
router.get('/snapshots/project/:projectId', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { start_month, end_month } = req.query;
        
        const startDate = start_month ? new Date(start_month) : new Date(new Date().setMonth(new Date().getMonth() - 6));
        const endDate = end_month ? new Date(end_month) : new Date();
        
        const snapshots = await monthlySnapshotService.getSnapshotsByProject(projectId, startDate, endDate);
        
        res.json({
            success: true,
            data: {
                project_id: projectId,
                start_date: startDate,
                end_date: endDate,
                snapshots
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/snapshots/indicator/:indicatorId
 * Get indicator trends over time
 */
router.get('/snapshots/indicator/:indicatorId', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { indicatorId } = req.params;
        const { start_month, end_month } = req.query;
        
        const startDate = start_month ? new Date(start_month) : new Date(new Date().setMonth(new Date().getMonth() - 6));
        const endDate = end_month ? new Date(end_month) : new Date();
        
        const snapshots = await monthlySnapshotService.getSnapshotsByIndicator(indicatorId, startDate, endDate);
        
        res.json({
            success: true,
            data: {
                indicator_id: indicatorId,
                start_date: startDate,
                end_date: endDate,
                snapshots
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/snapshots/compare
 * Compare two months for a project
 */
router.get('/snapshots/compare', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { month1, month2, project_id } = req.query;
        
        if (!month1 || !month2) {
            throw new AppError('Both month1 and month2 parameters are required', 400);
        }
        
        const date1 = new Date(month1);
        const date2 = new Date(month2);
        
        const comparison = await monthlySnapshotService.compareMonths(date1, date2, project_id);
        
        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        next(error);
    }
});

// ============ PERFORMANCE RATES ROUTES ============

/**
 * GET /api/v1/monthly-tracking/performance-rates/:projectId
 * Get all 4 performance rates for a project
 */
router.get('/performance-rates/:projectId', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { month, year } = req.query;
        
        const now = new Date();
        const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
        const targetYear = year ? parseInt(year) : now.getFullYear();
        
        const rates = await performanceRateService.calculateAllRates(projectId, targetMonth, targetYear);
        
        res.json({
            success: true,
            data: rates
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/performance-rates/:projectId/history
 * Get rate history for a project
 */
router.get('/performance-rates/:projectId/history', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { start_month, end_month } = req.query;
        
        const startDate = start_month ? new Date(start_month) : new Date(new Date().setMonth(new Date().getMonth() - 6));
        const endDate = end_month ? new Date(end_month) : new Date();
        
        const history = await performanceRateService.getRateHistory(projectId, startDate, endDate);
        
        res.json({
            success: true,
            data: {
                project_id: projectId,
                start_date: startDate,
                end_date: endDate,
                history
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/performance-rates/all/:month/:year
 * Get performance rates for all projects in a specific month
 */
router.get('/performance-rates/all/:month/:year', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { month, year } = req.params;
        
        const rates = await performanceRateService.getAllProjectRates(parseInt(month), parseInt(year));
        
        res.json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                projects: rates
            }
        });
    } catch (error) {
        next(error);
    }
});

// ============ REACH VS TARGET ROUTES ============

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/indicator/:id
 * Get gap analysis for a single indicator
 */
router.get('/reach-vs-target/indicator/:id', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const gapData = await reachVsTargetService.getIndicatorGapPercentage(id);
        
        res.json({
            success: true,
            data: gapData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/project/:id
 * Get all indicator gaps for a project
 */
router.get('/reach-vs-target/project/:id', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const gaps = await reachVsTargetService.getAllIndicatorGaps(id);
        
        res.json({
            success: true,
            data: {
                project_id: id,
                total_indicators: gaps.length,
                gaps
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/at-risk
 * Get at-risk indicators (< 60% achieved)
 */
router.get('/reach-vs-target/at-risk', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { project_id } = req.query;
        
        const atRiskIndicators = await reachVsTargetService.getAtRiskIndicators(project_id);
        
        res.json({
            success: true,
            data: {
                project_id: project_id || 'all',
                count: atRiskIndicators.length,
                indicators: atRiskIndicators
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/on-track
 * Get on-track indicators (> 80% achieved)
 */
router.get('/reach-vs-target/on-track', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { project_id } = req.query;
        
        const onTrackIndicators = await reachVsTargetService.getOnTrackIndicators(project_id);
        
        res.json({
            success: true,
            data: {
                project_id: project_id || 'all',
                count: onTrackIndicators.length,
                indicators: onTrackIndicators
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/projection/:indicatorId
 * Get target projection for indicator
 */
router.get('/reach-vs-target/projection/:indicatorId', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { indicatorId } = req.params;
        const { target_month } = req.query;
        
        const targetDate = target_month ? new Date(target_month) : new Date(new Date().setMonth(new Date().getMonth() + 3));
        
        const projection = await reachVsTargetService.projectReachByMonth(indicatorId, targetDate);
        
        res.json({
            success: true,
            data: projection
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/recommendations/:indicatorId
 * Get AI-powered recommendations for indicator
 */
router.get('/reach-vs-target/recommendations/:indicatorId', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { indicatorId } = req.params;
        
        const recommendations = await reachVsTargetService.getRecommendations(indicatorId);
        
        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/monthly-tracking/reach-vs-target/summary
 * Get summary statistics for reach vs target
 */
router.get('/reach-vs-target/summary', authenticate, checkPermission('monthly_tracking.read'), async (req, res, next) => {
    try {
        const { project_id } = req.query;
        
        const summary = await reachVsTargetService.getSummaryStatistics(project_id);
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
});

export default router;
