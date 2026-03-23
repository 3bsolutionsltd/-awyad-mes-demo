import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

/**
 * GET /api/v1/dashboard/strategic-hierarchy
 * Get complete strategic hierarchy: Strategies → Pillars → Components → Projects
 */
router.get('/strategic-hierarchy', authenticate, async (req, res, next) => {
    try {
        // Get all strategies with their nested structure
        const strategiesResult = await databaseService.query(`
            SELECT * FROM strategies 
            WHERE is_active = true 
            ORDER BY display_order ASC, name ASC
        `);
        const strategies = strategiesResult.rows;

        // For each strategy, get pillars
        for (const strategy of strategies) {
            const pillarsResult = await databaseService.query(`
                SELECT * FROM pillars 
                WHERE strategy_id = $1 AND is_active = true
                ORDER BY display_order ASC, name ASC
            `, [strategy.id]);
            const pillars = pillarsResult.rows;

            // For each pillar, get components
            for (const pillar of pillars) {
                const componentsResult = await databaseService.query(`
                    SELECT * FROM core_program_components 
                    WHERE pillar_id = $1 AND is_active = true
                    ORDER BY display_order ASC, name ASC
                `, [pillar.id]);
                const components = componentsResult.rows;

                // For each component, get projects with stats
                for (const component of components) {
                    const projectsResult = await databaseService.query(`
                        SELECT 
                            p.*,
                            (SELECT COUNT(*) FROM activities WHERE project_id = p.id) as activity_count,
                            (SELECT COUNT(*) FROM indicators WHERE project_id = p.id AND indicator_scope = 'project') as indicator_count,
                            (SELECT COUNT(*) FROM cases WHERE project_id = p.id) as case_count,
                            CASE 
                                WHEN p.budget > 0 THEN (p.expenditure / p.budget * 100)::NUMERIC(5,2)
                                ELSE 0 
                            END as burn_rate_percentage
                        FROM projects p
                        WHERE p.core_program_component_id = $1
                        ORDER BY p.name ASC
                    `, [component.id]);
                    const projects = projectsResult.rows;

                    component.projects = projects;
                    component.project_count = projects.length;
                }

                pillar.components = components;
                pillar.component_count = components.length;
            }

            strategy.pillars = pillars;
            strategy.pillar_count = pillars.length;
        }

        res.json({
            success: true,
            data: strategies
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/awyad-indicators
 * Get all AWYAD-level (strategic) indicators with aggregated data
 */
router.get('/awyad-indicators', authenticate, async (req, res, next) => {
    try {
        const indicatorsResult = await databaseService.query(`
            SELECT 
                i.*,
                ta.name as thematic_area_name,
                (
                    SELECT COUNT(*) 
                    FROM indicator_mappings im 
                    WHERE im.awyad_indicator_id = i.id
                ) as linked_project_indicators_count,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage
            FROM indicators i
            LEFT JOIN thematic_areas ta ON i.thematic_area_id = ta.id
            WHERE i.indicator_scope = 'awyad'
            ORDER BY i.result_area ASC, i.name ASC
        `);
        const indicators = indicatorsResult.rows;

        // Get quarterly breakdown for each indicator
        for (const indicator of indicators) {
            indicator.quarterly_data = {
                q1: { target: indicator.q1_target, achieved: indicator.q1_achieved },
                q2: { target: indicator.q2_target, achieved: indicator.q2_achieved },
                q3: { target: indicator.q3_target, achieved: indicator.q3_achieved },
                q4: { target: indicator.q4_target, achieved: indicator.q4_achieved }
            };

            // Get linked project indicators
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
            `, [indicator.id]);
            const linkedIndicators = linkedIndicatorsResult.rows;

            indicator.linked_indicators = linkedIndicators;
        }

        res.json({
            success: true,
            data: indicators,
            count: indicators.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/project-indicators
 * Get all project-level indicators grouped by project
 */
router.get('/project-indicators', authenticate, async (req, res, next) => {
    try {
        const { project_id } = req.query;

        let query = `
            SELECT 
                i.*,
                p.name as project_name,
                p.id as project_id,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage,
                (
                    SELECT COUNT(*) 
                    FROM indicator_mappings im 
                    WHERE im.project_indicator_id = i.id
                ) as linked_to_awyad_count
            FROM indicators i
            LEFT JOIN projects p ON i.project_id = p.id
            WHERE i.indicator_scope = 'project'
        `;

        const params = [];
        if (project_id) {
            query += ` AND i.project_id = $1`;
            params.push(project_id);
        }

        query += ` ORDER BY p.name ASC, i.result_area ASC, i.name ASC`;

        const indicators = await databaseService.query(query, params);

        // Get quarterly breakdown for each indicator
        for (const indicator of indicators) {
            indicator.quarterly_data = {
                q1: { target: indicator.q1_target, achieved: indicator.q1_achieved },
                q2: { target: indicator.q2_target, achieved: indicator.q2_achieved },
                q3: { target: indicator.q3_target, achieved: indicator.q3_achieved },
                q4: { target: indicator.q4_target, achieved: indicator.q4_achieved }
            };
        }

        // Group by project
        const groupedByProject = indicators.reduce((acc, indicator) => {
            const projectKey = indicator.project_id || 'unassigned';
            if (!acc[projectKey]) {
                acc[projectKey] = {
                    project_id: indicator.project_id,
                    project_name: indicator.project_name,
                    indicators: []
                };
            }
            acc[projectKey].indicators.push(indicator);
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(groupedByProject),
            total_indicators: indicators.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/stats
 * Get overall dashboard statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const stats = await databaseService.queryOne(`
            SELECT 
                (SELECT COUNT(*) FROM strategies WHERE is_active = true) as total_strategies,
                (SELECT COUNT(*) FROM pillars WHERE is_active = true) as total_pillars,
                (SELECT COUNT(*) FROM core_program_components WHERE is_active = true) as total_components,
                (SELECT COUNT(*) FROM projects WHERE status = 'Active') as active_projects,
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COUNT(*) FROM indicators WHERE indicator_scope = 'awyad') as total_awyad_indicators,
                (SELECT COUNT(*) FROM indicators WHERE indicator_scope = 'project') as project_indicators,
                (SELECT COUNT(*) FROM activities) as total_activities,
                (SELECT COUNT(*) FROM activities WHERE status = 'Completed') as completed_activities,
                (SELECT COUNT(*) FROM cases) as total_cases,
                (SELECT COUNT(*) FROM cases WHERE status = 'Open') as open_cases,
                (SELECT SUM(budget) FROM projects) as total_budget,
                (SELECT SUM(expenditure) FROM projects) as total_expenditure,
                (SELECT SUM(total_beneficiaries) FROM activities) as total_beneficiaries
        `);

        // Calculate overall burn rate
        stats.overall_burn_rate = stats.total_budget > 0 
            ? ((stats.total_expenditure / stats.total_budget) * 100).toFixed(2)
            : 0;

        // Calculate activity completion rate
        stats.activity_completion_rate = stats.total_activities > 0
            ? ((stats.completed_activities / stats.total_activities) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/financial-summary
 * Get financial summary across all projects
 */
router.get('/financial-summary', authenticate, async (req, res, next) => {
    try {
        const summaryResult = await databaseService.query(`
            SELECT 
                p.currency,
                COUNT(*) as project_count,
                SUM(p.budget) as total_budget,
                SUM(p.expenditure) as total_expenditure,
                AVG(
                    CASE 
                        WHEN p.budget > 0 THEN (p.expenditure / p.budget * 100)
                        ELSE 0 
                    END
                )::NUMERIC(5,2) as avg_burn_rate
            FROM projects p
            GROUP BY p.currency
            ORDER BY total_budget DESC
        `);
        const summary = summaryResult.rows;

        // Get currency exchange rates
        const ratesResult = await databaseService.query(`
            SELECT * FROM currency_rates 
            ORDER BY currency ASC
        `);
        const rates = ratesResult.rows;

        res.json({
            success: true,
            data: {
                by_currency: summary,
                exchange_rates: rates
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/overview
 * Get complete dashboard overview with all key data
 */
router.get('/overview', authenticate, async (req, res, next) => {
    try {
        // Get all data in parallel for better performance
        const [stats, strategiesResult, awyadIndicatorsResult, recentActivitiesResult, activeCasesResult] = await Promise.all([
            // Stats
            databaseService.queryOne(`
                SELECT 
                    (SELECT COUNT(*) FROM strategies WHERE is_active = true) as active_strategies,
                    (SELECT COUNT(*) FROM projects WHERE status = 'Active') as active_projects,
                    (SELECT COUNT(*) FROM indicators WHERE indicator_scope = 'awyad') as awyad_indicators,
                    (SELECT COUNT(*) FROM indicators WHERE indicator_scope = 'project') as project_indicators,
                    (SELECT COUNT(*) FROM activities) as total_activities,
                    (SELECT COUNT(*) FROM cases WHERE status = 'Open') as open_cases,
                    (SELECT SUM(budget) FROM projects) as total_budget,
                    (SELECT SUM(expenditure) FROM projects) as total_expenditure
            `),
            
            // Strategies count
            databaseService.query(`
                SELECT 
                    s.id,
                    s.name,
                    (SELECT COUNT(*) FROM pillars WHERE strategy_id = s.id) as pillar_count
                FROM strategies s
                WHERE s.is_active = true
                ORDER BY s.display_order ASC
                LIMIT 10
            `),

            // Top AWYAD indicators
            databaseService.query(`
                SELECT 
                    i.id,
                    i.name,
                    i.annual_target,
                    i.achieved,
                    i.result_area,
                    CASE 
                        WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                        ELSE 0 
                    END as achievement_percentage
                FROM indicators i
                WHERE i.indicator_scope = 'awyad'
                ORDER BY i.result_area ASC
                LIMIT 10
            `),

            // Recent activities
            databaseService.query(`
                SELECT 
                    a.id,
                    a.activity_name,
                    a.planned_date,
                    a.status,
                    a.total_beneficiaries,
                    p.name as project_name
                FROM activities a
                LEFT JOIN projects p ON a.project_id = p.id
                ORDER BY a.created_at DESC
                LIMIT 10
            `),

            // Active cases
            databaseService.query(`
                SELECT 
                    c.case_number,
                    c.status,
                    c.date_reported,
                    ct.name as case_type,
                    p.name as project_name
                FROM cases c
                LEFT JOIN case_types ct ON c.case_type_id = ct.id
                LEFT JOIN projects p ON c.project_id = p.id
                WHERE c.status IN ('Open', 'In Progress')
                ORDER BY c.date_reported DESC
                LIMIT 10
            `)
        ]);

        // Extract rows from results
        const strategies = strategiesResult.rows;
        const awyadIndicators = awyadIndicatorsResult.rows;
        const recentActivities = recentActivitiesResult.rows;
        const activeCases = activeCasesResult.rows;

        // Calculate burn rate
        stats.overall_burn_rate = stats.total_budget > 0 
            ? ((stats.total_expenditure / stats.total_budget) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                stats,
                strategies,
                awyad_indicators: awyadIndicators,
                recent_activities: recentActivities,
                active_cases: activeCases
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/performance-summary
 * Per-project indicator performance rates (achieved / target) via v_project_performance view
 */
router.get('/performance-summary', authenticate, async (req, res, next) => {
    try {
        const result = await databaseService.query(`
            SELECT * FROM v_project_performance
            ORDER BY performance_rate DESC NULLS LAST
        `);
        const rows = result.rows;

        const totalTarget   = rows.reduce((s, r) => s + Number(r.total_target),   0);
        const totalAchieved = rows.reduce((s, r) => s + Number(r.total_achieved), 0);
        const overallRate   = totalTarget > 0
            ? Math.round((totalAchieved / totalTarget) * 1000) / 10
            : 0;

        res.json({
            success: true,
            data: rows,
            summary: {
                overall_performance_rate: overallRate,
                projects_count:    rows.length,
                on_track_projects:  rows.filter(r => Number(r.performance_rate) >= 80).length,
                at_risk_projects:   rows.filter(r => Number(r.performance_rate) >= 50 && Number(r.performance_rate) < 80).length,
                off_track_projects: rows.filter(r => Number(r.performance_rate) < 50).length,
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/reach-vs-target
 * Beneficiary reach vs target per project via v_reach_vs_target view
 */
router.get('/reach-vs-target', authenticate, async (req, res, next) => {
    try {
        const result = await databaseService.query(`
            SELECT * FROM v_reach_vs_target
            ORDER BY reach_rate DESC NULLS LAST
        `);
        const rows = result.rows;

        const totalTarget = rows.reduce((s, r) => s + Number(r.total_target_beneficiaries), 0);
        const totalActual = rows.reduce((s, r) => s + Number(r.total_actual_beneficiaries), 0);
        const overallRate = totalTarget > 0
            ? Math.round((totalActual / totalTarget) * 1000) / 10
            : 0;

        res.json({
            success: true,
            data: rows,
            summary: {
                overall_reach_rate:            overallRate,
                total_target_beneficiaries:    totalTarget,
                total_actual_beneficiaries:    totalActual,
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/dashboard/thematic-areas
 * Get all thematic areas (backward compatibility)
 */
router.get('/thematic-areas', authenticate, async (req, res, next) => {
    try {
        const thematicAreasResult = await databaseService.query(`
            SELECT 
                ta.*,
                (SELECT COUNT(*) FROM indicators WHERE thematic_area_id = ta.id) as indicator_count
            FROM thematic_areas ta
            ORDER BY ta.name ASC
        `);

        res.json({
            success: true,
            data: thematicAreasResult.rows
        });
    } catch (error) {
        next(error);
    }
});

export default router;
