/**
 * Monthly Snapshot Service - Comprehensive monthly tracking and snapshot generation
 * 
 * Handles:
 * - Automated monthly snapshot generation
 * - Project performance tracking
 * - Indicator achievement monitoring
 * - Activity completion tracking
 * - Beneficiary reach calculation
 * - Financial burn rate analysis
 * - Performance rate calculations and storage
 * - Historical trend analysis
 * 
 * @module monthlySnapshotService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Generate a comprehensive monthly snapshot for a specific month/year
 * Captures current state of all indicators, activities, beneficiaries, and financials
 * 
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2026)
 * @param {string} projectId - Optional specific project ID
 * @returns {Promise<Object>} Generated snapshots
 */
export async function generateSnapshot(month, year, projectId = null) {
    try {
        logger.info(`Generating monthly snapshot for ${month}/${year}${projectId ? ` (Project: ${projectId})` : ' (All Projects)'}`);
        
        const snapshotMonth = new Date(year, month - 1, 1);
        const snapshots = [];
        
        // Get all active projects or specific project
        const projectsQuery = projectId 
            ? `SELECT * FROM projects WHERE id = $1 AND status = 'Active'`
            : `SELECT * FROM projects WHERE status = 'Active'`;
        
        const projects = projectId 
            ? await databaseService.query(projectsQuery, [projectId])
            : await databaseService.query(projectsQuery);
        
        if (projects.length === 0) {
            throw new AppError('No active projects found', 404);
        }
        
        // Generate snapshot for each project
        for (const project of projects) {
            const projectSnapshot = await generateProjectSnapshot(project, snapshotMonth);
            snapshots.push(projectSnapshot);
        }
        
        logger.info(`Successfully generated ${snapshots.length} monthly snapshot(s)`);
        
        return {
            month,
            year,
            snapshot_date: snapshotMonth,
            projects_count: snapshots.length,
            snapshots
        };
        
    } catch (error) {
        logger.error('Error generating monthly snapshot:', error);
        throw error;
    }
}

/**
 * Generate snapshot for a single project
 * @private
 */
async function generateProjectSnapshot(project, snapshotMonth) {
    const projectId = project.id;
    
    // Calculate activity metrics
    const activityMetrics = await calculateActivityMetrics(projectId, snapshotMonth);
    
    // Calculate beneficiary metrics
    const beneficiaryMetrics = await calculateBeneficiaryMetrics(projectId, snapshotMonth);
    
    // Calculate financial metrics
    const financialMetrics = await calculateFinancialMetrics(projectId);
    
    // Calculate indicator metrics for this project
    const indicatorSnapshots = await calculateIndicatorSnapshots(projectId, snapshotMonth);
    
    // Calculate performance rates
    const performanceRates = await calculatePerformanceRates(
        projectId, 
        snapshotMonth,
        activityMetrics,
        beneficiaryMetrics,
        financialMetrics,
        indicatorSnapshots
    );
    
    // Store or update snapshot in database
    const snapshot = await storeSnapshot({
        project_id: projectId,
        snapshot_month: snapshotMonth,
        ...activityMetrics,
        ...beneficiaryMetrics,
        ...financialMetrics,
        ...performanceRates
    });
    
    return {
        ...snapshot,
        indicator_snapshots: indicatorSnapshots,
        project_name: project.name
    };
}

/**
 * Calculate activity completion metrics
 * @private
 */
async function calculateActivityMetrics(projectId, snapshotMonth) {
    const query = `
        SELECT 
            COUNT(*) as total_activities,
            COUNT(*) FILTER (WHERE status = 'Completed') as completed_activities,
            COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_activities,
            COUNT(*) FILTER (WHERE status = 'Planned') as planned_activities,
            COUNT(*) FILTER (WHERE status = 'Overdue') as overdue_activities
        FROM activities
        WHERE project_id = $1
            AND activity_date <= $2
    `;
    
    const result = await databaseService.queryOne(query, [projectId, snapshotMonth]);
    
    return {
        total_activities: parseInt(result.total_activities) || 0,
        completed_activities: parseInt(result.completed_activities) || 0,
        in_progress_activities: parseInt(result.in_progress_activities) || 0,
        planned_activities: parseInt(result.planned_activities) || 0,
        overdue_activities: parseInt(result.overdue_activities) || 0
    };
}

/**
 * Calculate beneficiary reach metrics
 * @private
 */
async function calculateBeneficiaryMetrics(projectId, snapshotMonth) {
    const query = `
        SELECT 
            COALESCE(SUM(males), 0) as total_males,
            COALESCE(SUM(females), 0) as total_females,
            COALESCE(SUM(other_gender), 0) as total_other,
            COALESCE(SUM(males) + SUM(females) + SUM(other_gender), 0) as total_beneficiaries,
            COALESCE(SUM(disability_count), 0) as total_pwds
        FROM activities
        WHERE project_id = $1
            AND activity_date <= $2
            AND status IN ('Completed', 'In Progress')
    `;
    
    const result = await databaseService.queryOne(query, [projectId, snapshotMonth]);
    
    // Get project target beneficiaries
    const projectQuery = `
        SELECT 
            COALESCE(target_beneficiaries, 0) as target_beneficiaries
        FROM projects
        WHERE id = $1
    `;
    
    const projectData = await databaseService.queryOne(projectQuery, [projectId]);
    
    return {
        target_beneficiaries: parseInt(projectData.target_beneficiaries) || 0,
        actual_beneficiaries: parseInt(result.total_beneficiaries) || 0,
        male_beneficiaries: parseInt(result.total_males) || 0,
        female_beneficiaries: parseInt(result.total_females) || 0,
        other_beneficiaries: parseInt(result.total_other) || 0,
        pwds_beneficiaries: parseInt(result.total_pwds) || 0
    };
}

/**
 * Calculate financial metrics
 * @private
 */
async function calculateFinancialMetrics(projectId) {
    const query = `
        SELECT 
            budget,
            expenditure,
            burn_rate
        FROM projects
        WHERE id = $1
    `;
    
    const result = await databaseService.queryOne(query, [projectId]);
    
    return {
        total_budget: parseFloat(result.budget) || 0,
        total_expenditure: parseFloat(result.expenditure) || 0,
        financial_burn_rate: parseFloat(result.burn_rate) || 0
    };
}

/**
 * Calculate indicator snapshots for a project
 * @private
 */
async function calculateIndicatorSnapshots(projectId, snapshotMonth) {
    const indicatorsQuery = `
        SELECT 
            id,
            code,
            name,
            annual_target,
            achieved,
            lop_target,
            baseline,
            indicator_level,
            data_type
        FROM indicators
        WHERE project_id = $1
            AND is_active = TRUE
        ORDER BY indicator_level, name
    `;
    
    const indicators = await databaseService.query(indicatorsQuery, [projectId]);
    
    const indicatorSnapshots = [];
    
    for (const indicator of indicators) {
        const targetValue = indicator.annual_target || indicator.lop_target || 0;
        const achievedValue = indicator.achieved || 0;
        
        let percentageComplete = 0;
        if (targetValue > 0) {
            percentageComplete = (achievedValue / targetValue) * 100;
        }
        
        // Determine on_track status
        let onTrack = 'Unknown';
        if (percentageComplete >= 80) {
            onTrack = 'On Track';
        } else if (percentageComplete >= 60) {
            onTrack = 'At Risk';
        } else if (targetValue > 0) {
            onTrack = 'Behind';
        }
        
        // Check if snapshot already exists
        const existingQuery = `
            SELECT id FROM monthly_snapshots
            WHERE project_id = $1 
                AND indicator_id = $2 
                AND snapshot_month = $3
        `;
        
        const existing = await databaseService.queryOne(existingQuery, [projectId, indicator.id, snapshotMonth]);
        
        let snapshotId;
        if (existing) {
            // Update existing snapshot
            const updateQuery = `
                UPDATE monthly_snapshots
                SET 
                    target_value = $1,
                    achieved_value = $2,
                    percentage_complete = $3,
                    on_track = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING id
            `;
            
            const updated = await databaseService.queryOne(updateQuery, [
                targetValue,
                achievedValue,
                percentageComplete,
                onTrack,
                existing.id
            ]);
            snapshotId = updated.id;
        } else {
            // Insert new snapshot
            const insertQuery = `
                INSERT INTO monthly_snapshots (
                    project_id,
                    indicator_id,
                    snapshot_month,
                    target_value,
                    achieved_value,
                    percentage_complete,
                    on_track
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const inserted = await databaseService.queryOne(insertQuery, [
                projectId,
                indicator.id,
                snapshotMonth,
                targetValue,
                achievedValue,
                percentageComplete,
                onTrack
            ]);
            snapshotId = inserted.id;
        }
        
        indicatorSnapshots.push({
            snapshot_id: snapshotId,
            indicator_id: indicator.id,
            indicator_code: indicator.code,
            indicator_name: indicator.name,
            indicator_level: indicator.indicator_level,
            target_value: targetValue,
            achieved_value: achievedValue,
            percentage_complete: percentageComplete,
            on_track: onTrack
        });
    }
    
    return indicatorSnapshots;
}

/**
 * Calculate all performance rates
 * @private
 */
async function calculatePerformanceRates(projectId, snapshotMonth, activityMetrics, beneficiaryMetrics, financialMetrics, indicatorSnapshots) {
    // 1. Programmatic Performance Rate: Average of all indicator achievement rates
    let programmaticRate = 0;
    if (indicatorSnapshots.length > 0) {
        const totalPercentage = indicatorSnapshots.reduce((sum, ind) => sum + ind.percentage_complete, 0);
        programmaticRate = totalPercentage / indicatorSnapshots.length;
    }
    
    // 2. Activity Completion Rate: Completed / Total
    let activityCompletionRate = 0;
    if (activityMetrics.total_activities > 0) {
        activityCompletionRate = (activityMetrics.completed_activities / activityMetrics.total_activities) * 100;
    }
    
    // 3. Beneficiary Reach Rate: Actual / Target
    let beneficiaryReachRate = 0;
    if (beneficiaryMetrics.target_beneficiaries > 0) {
        beneficiaryReachRate = (beneficiaryMetrics.actual_beneficiaries / beneficiaryMetrics.target_beneficiaries) * 100;
    }
    
    // 4. Financial Burn Rate: From project data
    const financialBurnRate = financialMetrics.financial_burn_rate;
    
    return {
        programmatic_performance_rate: Math.round(programmaticRate * 100) / 100,
        activity_completion_rate: Math.round(activityCompletionRate * 100) / 100,
        beneficiary_reach_rate: Math.round(beneficiaryReachRate * 100) / 100,
        financial_burn_rate: Math.round(financialBurnRate * 100) / 100
    };
}

/**
 * Store snapshot data in monthly_snapshots summary table
 * @private
 */
async function storeSnapshot(snapshotData) {
    // Check if project-level summary snapshot exists
    const existingQuery = `
        SELECT id FROM monthly_snapshots
        WHERE project_id = $1 
            AND snapshot_month = $2
            AND indicator_id IS NULL
    `;
    
    const existing = await databaseService.queryOne(existingQuery, [
        snapshotData.project_id,
        snapshotData.snapshot_month
    ]);
    
    if (existing) {
        // Update existing
        const updateQuery = `
            UPDATE monthly_snapshots
            SET 
                total_activities = $1,
                completed_activities = $2,
                in_progress_activities = $3,
                planned_activities = $4,
                overdue_activities = $5,
                target_beneficiaries = $6,
                actual_beneficiaries = $7,
                male_beneficiaries = $8,
                female_beneficiaries = $9,
                other_beneficiaries = $10,
                pwds_beneficiaries = $11,
                total_budget = $12,
                total_expenditure = $13,
                programmatic_performance_rate = $14,
                activity_completion_rate = $15,
                beneficiary_reach_rate = $16,
                financial_burn_rate = $17,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $18
            RETURNING *
        `;
        
        return await databaseService.queryOne(updateQuery, [
            snapshotData.total_activities,
            snapshotData.completed_activities,
            snapshotData.in_progress_activities,
            snapshotData.planned_activities,
            snapshotData.overdue_activities,
            snapshotData.target_beneficiaries,
            snapshotData.actual_beneficiaries,
            snapshotData.male_beneficiaries,
            snapshotData.female_beneficiaries,
            snapshotData.other_beneficiaries,
            snapshotData.pwds_beneficiaries,
            snapshotData.total_budget,
            snapshotData.total_expenditure,
            snapshotData.programmatic_performance_rate,
            snapshotData.activity_completion_rate,
            snapshotData.beneficiary_reach_rate,
            snapshotData.financial_burn_rate,
            existing.id
        ]);
    } else {
        // Insert new
        const insertQuery = `
            INSERT INTO monthly_snapshots (
                project_id,
                snapshot_month,
                total_activities,
                completed_activities,
                in_progress_activities,
                planned_activities,
                overdue_activities,
                target_beneficiaries,
                actual_beneficiaries,
                male_beneficiaries,
                female_beneficiaries,
                other_beneficiaries,
                pwds_beneficiaries,
                total_budget,
                total_expenditure,
                programmatic_performance_rate,
                activity_completion_rate,
                beneficiary_reach_rate,
                financial_burn_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `;
        
        return await databaseService.queryOne(insertQuery, [
            snapshotData.project_id,
            snapshotData.snapshot_month,
            snapshotData.total_activities,
            snapshotData.completed_activities,
            snapshotData.in_progress_activities,
            snapshotData.planned_activities,
            snapshotData.overdue_activities,
            snapshotData.target_beneficiaries,
            snapshotData.actual_beneficiaries,
            snapshotData.male_beneficiaries,
            snapshotData.female_beneficiaries,
            snapshotData.other_beneficiaries,
            snapshotData.pwds_beneficiaries,
            snapshotData.total_budget,
            snapshotData.total_expenditure,
            snapshotData.programmatic_performance_rate,
            snapshotData.activity_completion_rate,
            snapshotData.beneficiary_reach_rate,
            snapshotData.financial_burn_rate
        ]);
    }
}

/**
 * Get snapshot for a specific month/year
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Array>} Snapshots
 */
export async function getSnapshot(month, year, projectId = null) {
    try {
        const snapshotMonth = new Date(year, month - 1, 1);
        
        let query = `
            SELECT 
                ms.*,
                p.name as project_name,
                p.donor,
                p.thematic_area_id
            FROM monthly_snapshots ms
            JOIN projects p ON ms.project_id = p.id
            WHERE ms.snapshot_month = $1
                AND ms.indicator_id IS NULL
        `;
        
        const params = [snapshotMonth];
        
        if (projectId) {
            query += ` AND ms.project_id = $2`;
            params.push(projectId);
        }
        
        query += ` ORDER BY p.name`;
        
        const snapshots = await databaseService.query(query, params);
        
        // Get indicator snapshots for each project
        for (const snapshot of snapshots) {
            const indicatorQuery = `
                SELECT 
                    ms.*,
                    i.code as indicator_code,
                    i.name as indicator_name,
                    i.indicator_level
                FROM monthly_snapshots ms
                JOIN indicators i ON ms.indicator_id = i.id
                WHERE ms.project_id = $1
                    AND ms.snapshot_month = $2
                    AND ms.indicator_id IS NOT NULL
                ORDER BY i.indicator_level, i.name
            `;
            
            snapshot.indicator_snapshots = await databaseService.query(indicatorQuery, [
                snapshot.project_id,
                snapshotMonth
            ]);
        }
        
        return snapshots;
        
    } catch (error) {
        logger.error('Error getting snapshot:', error);
        throw error;
    }
}

/**
 * Get snapshots for a project over a date range
 * @param {string} projectId - Project ID
 * @param {Date} startMonth - Start month
 * @param {Date} endMonth - End month
 * @returns {Promise<Array>} Snapshots
 */
export async function getSnapshotsByProject(projectId, startMonth, endMonth) {
    try {
        const query = `
            SELECT 
                ms.*,
                p.name as project_name
            FROM monthly_snapshots ms
            JOIN projects p ON ms.project_id = p.id
            WHERE ms.project_id = $1
                AND ms.snapshot_month >= $2
                AND ms.snapshot_month <= $3
                AND ms.indicator_id IS NULL
            ORDER BY ms.snapshot_month DESC
        `;
        
        return await databaseService.query(query, [projectId, startMonth, endMonth]);
        
    } catch (error) {
        logger.error('Error getting project snapshots:', error);
        throw error;
    }
}

/**
 * Get snapshots for an indicator over time
 * @param {string} indicatorId - Indicator ID
 * @param {Date} startMonth - Start month
 * @param {Date} endMonth - End month
 * @returns {Promise<Array>} Indicator snapshots
 */
export async function getSnapshotsByIndicator(indicatorId, startMonth, endMonth) {
    try {
        const query = `
            SELECT 
                ms.*,
                i.code as indicator_code,
                i.name as indicator_name,
                i.indicator_level
            FROM monthly_snapshots ms
            JOIN indicators i ON ms.indicator_id = i.id
            WHERE ms.indicator_id = $1
                AND ms.snapshot_month >= $2
                AND ms.snapshot_month <= $3
            ORDER BY ms.snapshot_month ASC
        `;
        
        return await databaseService.query(query, [indicatorId, startMonth, endMonth]);
        
    } catch (error) {
        logger.error('Error getting indicator snapshots:', error);
        throw error;
    }
}

/**
 * Compare two months for a project
 * @param {Date} month1 - First month
 * @param {Date} month2 - Second month
 * @param {string} projectId - Optional project ID
 * @returns {Promise<Object>} Comparison
 */
export async function compareMonths(month1, month2, projectId = null) {
    try {
        const snapshots1 = await getSnapshot(
            month1.getMonth() + 1,
            month1.getFullYear(),
            projectId
        );
        
        const snapshots2 = await getSnapshot(
            month2.getMonth() + 1,
            month2.getFullYear(),
            projectId
        );
        
        // Calculate differences
        const comparison = {
            month1,
            month2,
            projects: []
        };
        
        for (const snap1 of snapshots1) {
            const snap2 = snapshots2.find(s => s.project_id === snap1.project_id);
            
            if (snap2) {
                comparison.projects.push({
                    project_id: snap1.project_id,
                    project_name: snap1.project_name,
                    programmatic_rate_change: snap2.programmatic_performance_rate - snap1.programmatic_performance_rate,
                    activity_rate_change: snap2.activity_completion_rate - snap1.activity_completion_rate,
                    beneficiary_rate_change: snap2.beneficiary_reach_rate - snap1.beneficiary_reach_rate,
                    financial_rate_change: snap2.financial_burn_rate - snap1.financial_burn_rate,
                    beneficiaries_change: snap2.actual_beneficiaries - snap1.actual_beneficiaries,
                    activities_completed_change: snap2.completed_activities - snap1.completed_activities,
                    month1_data: snap1,
                    month2_data: snap2
                });
            }
        }
        
        return comparison;
        
    } catch (error) {
        logger.error('Error comparing months:', error);
        throw error;
    }
}

/**
 * Get trend data for an indicator
 * @param {string} indicatorId - Indicator ID
 * @param {number} months - Number of months to look back
 * @returns {Promise<Array>} Trend data
 */
export async function getTrendData(indicatorId, months = 6) {
    try {
        const query = `
            SELECT 
                snapshot_month,
                target_value,
                achieved_value,
                percentage_complete,
                on_track
            FROM monthly_snapshots
            WHERE indicator_id = $1
            ORDER BY snapshot_month DESC
            LIMIT $2
        `;
        
        const trends = await databaseService.query(query, [indicatorId, months]);
        
        return trends.reverse(); // Oldest to newest
        
    } catch (error) {
        logger.error('Error getting trend data:', error);
        throw error;
    }
}

/**
 * Schedule automatic monthly snapshot generation
 * This would typically be called by a cron job on the 1st of each month
 * 
 * @returns {Promise<Object>} Result
 */
export async function scheduleMonthlySnapshot() {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        logger.info(`Running scheduled monthly snapshot for ${month}/${year}`);
        
        const result = await generateSnapshot(month, year);
        
        logger.info(`Scheduled snapshot completed: ${result.projects_count} projects processed`);
        
        return result;
        
    } catch (error) {
        logger.error('Error in scheduled snapshot:', error);
        throw error;
    }
}

export default {
    generateSnapshot,
    getSnapshot,
    getSnapshotsByProject,
    getSnapshotsByIndicator,
    compareMonths,
    getTrendData,
    scheduleMonthlySnapshot
};
