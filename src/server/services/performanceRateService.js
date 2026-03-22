/**
 * Performance Rate Service - Calculate 4 key performance rates
 * 
 * Handles:
 * 1. Programmatic Performance Rate - Indicator achievement
 * 2. Activity Completion Rate - Activities completed on time
 * 3. Beneficiary Reach Rate - Beneficiaries reached vs target
 * 4. Financial Burn Rate - Budget spent vs allocated
 * 
 * @module performanceRateService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Calculate all 4 performance rates for a project in a specific month
 * 
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} All performance rates
 */
export async function calculateAllRates(projectId, month, year) {
    try {
        logger.info(`Calculating all rates for project ${projectId} - ${month}/${year}`);
        
        const snapshotDate = new Date(year, month - 1, 1);
        
        const [
            programmaticRate,
            activityRate,
            beneficiaryRate,
            financialRate
        ] = await Promise.all([
            getProgrammaticRate(projectId, month, year),
            getActivityCompletionRate(projectId, month, year),
            getBeneficiaryReachRate(projectId, month, year),
            getFinancialBurnRate(projectId, month, year)
        ]);
        
        // Calculate overall status
        const avgRate = (programmaticRate.rate + activityRate.rate + beneficiaryRate.rate) / 3;
        
        let overallStatus = 'Poor';
        if (avgRate >= 80) {
            overallStatus = 'Good';
        } else if (avgRate >= 60) {
            overallStatus = 'Fair';
        }
        
        return {
            project_id: projectId,
            month,
            year,
            snapshot_date: snapshotDate,
            programmatic_performance: programmaticRate,
            activity_completion: activityRate,
            beneficiary_reach: beneficiaryRate,
            financial_burn: financialRate,
            average_performance_rate: Math.round(avgRate * 100) / 100,
            overall_status: overallStatus,
            calculated_at: new Date()
        };
        
    } catch (error) {
        logger.error('Error calculating all rates:', error);
        throw error;
    }
}

/**
 * Calculate Programmatic Performance Rate
 * Formula: (Total Achieved / Total Target) × 100 across all indicators
 * 
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Programmatic rate data
 */
export async function getProgrammaticRate(projectId, month, year) {
    try {
        const snapshotDate = new Date(year, month - 1, 1);
        
        // Get all indicators for the project
        const query = `
            SELECT 
                id,
                code,
                name,
                annual_target,
                lop_target,
                achieved,
                indicator_level
            FROM indicators
            WHERE project_id = $1
                AND is_active = TRUE
        `;
        
        const indicators = await databaseService.query(query, [projectId]);
        
        if (indicators.length === 0) {
            return {
                rate: 0,
                status: 'Unknown',
                message: 'No indicators found for project',
                indicators_count: 0,
                on_track_count: 0,
                at_risk_count: 0,
                behind_count: 0
            };
        }
        
        let totalTarget = 0;
        let totalAchieved = 0;
        let onTrackCount = 0;
        let atRiskCount = 0;
        let behindCount = 0;
        
        const indicatorDetails = [];
        
        for (const indicator of indicators) {
            const target = indicator.annual_target || indicator.lop_target || 0;
            const achieved = indicator.achieved || 0;
            
            totalTarget += target;
            totalAchieved += achieved;
            
            let individualRate = 0;
            if (target > 0) {
                individualRate = (achieved / target) * 100;
            }
            
            let status = 'Unknown';
            if (individualRate >= 80) {
                status = 'On Track';
                onTrackCount++;
            } else if (individualRate >= 60) {
                status = 'At Risk';
                atRiskCount++;
            } else if (target > 0) {
                status = 'Behind';
                behindCount++;
            }
            
            indicatorDetails.push({
                indicator_id: indicator.id,
                indicator_code: indicator.code,
                indicator_name: indicator.name,
                indicator_level: indicator.indicator_level,
                target,
                achieved,
                rate: Math.round(individualRate * 100) / 100,
                status
            });
        }
        
        // Calculate overall programmatic rate
        let overallRate = 0;
        if (totalTarget > 0) {
            overallRate = (totalAchieved / totalTarget) * 100;
        }
        
        let overallStatus = 'Poor';
        if (overallRate >= 80) {
            overallStatus = 'Good';
        } else if (overallRate >= 60) {
            overallStatus = 'Fair';
        }
        
        return {
            rate: Math.round(overallRate * 100) / 100,
            status: overallStatus,
            total_target: totalTarget,
            total_achieved: totalAchieved,
            indicators_count: indicators.length,
            on_track_count: onTrackCount,
            at_risk_count: atRiskCount,
            behind_count: behindCount,
            indicator_breakdown: indicatorDetails
        };
        
    } catch (error) {
        logger.error('Error calculating programmatic rate:', error);
        throw error;
    }
}

/**
 * Calculate Activity Completion Rate
 * Formula: (Completed Activities / Total Activities) × 100
 * 
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Activity completion rate data
 */
export async function getActivityCompletionRate(projectId, month, year) {
    try {
        const snapshotDate = new Date(year, month - 1, 1);
        
        const query = `
            SELECT 
                COUNT(*) as total_activities,
                COUNT(*) FILTER (WHERE status = 'Completed') as completed,
                COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'Planned') as planned,
                COUNT(*) FILTER (WHERE status = 'Overdue') as overdue
            FROM activities
            WHERE project_id = $1
                AND activity_date <= $2
        `;
        
        const result = await databaseService.queryOne(query, [projectId, snapshotDate]);
        
        const total = parseInt(result.total_activities) || 0;
        const completed = parseInt(result.completed) || 0;
        const inProgress = parseInt(result.in_progress) || 0;
        const planned = parseInt(result.planned) || 0;
        const overdue = parseInt(result.overdue) || 0;
        
        let rate = 0;
        if (total > 0) {
            rate = (completed / total) * 100;
        }
        
        let status = 'Poor';
        if (rate >= 80) {
            status = 'Good';
        } else if (rate >= 60) {
            status = 'Fair';
        }
        
        return {
            rate: Math.round(rate * 100) / 100,
            status,
            total_activities: total,
            completed_activities: completed,
            in_progress_activities: inProgress,
            planned_activities: planned,
            overdue_activities: overdue,
            completion_percentage: Math.round(rate * 100) / 100
        };
        
    } catch (error) {
        logger.error('Error calculating activity completion rate:', error);
        throw error;
    }
}

/**
 * Calculate Beneficiary Reach Rate
 * Formula: (Actual Beneficiaries / Target Beneficiaries) × 100
 * 
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Beneficiary reach rate data
 */
export async function getBeneficiaryReachRate(projectId, month, year) {
    try {
        const snapshotDate = new Date(year, month - 1, 1);
        
        // Get project target
        const projectQuery = `
            SELECT 
                target_beneficiaries
            FROM projects
            WHERE id = $1
        `;
        
        const projectData = await databaseService.queryOne(projectQuery, [projectId]);
        const target = parseInt(projectData.target_beneficiaries) || 0;
        
        // Get actual beneficiaries from activities
        const activityQuery = `
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
        
        const activityData = await databaseService.queryOne(activityQuery, [projectId, snapshotDate]);
        
        const actualBeneficiaries = parseInt(activityData.total_beneficiaries) || 0;
        const males = parseInt(activityData.total_males) || 0;
        const females = parseInt(activityData.total_females) || 0;
        const other = parseInt(activityData.total_other) || 0;
        const pwds = parseInt(activityData.total_pwds) || 0;
        
        let rate = 0;
        if (target > 0) {
            rate = (actualBeneficiaries / target) * 100;
        }
        
        let status = 'Poor';
        if (rate >= 80) {
            status = 'Good';
        } else if (rate >= 60) {
            status = 'Fair';
        } else if (target === 0) {
            status = 'Unknown';
        }
        
        const gap = target - actualBeneficiaries;
        const gapPercentage = target > 0 ? (gap / target) * 100 : 0;
        
        return {
            rate: Math.round(rate * 100) / 100,
            status,
            target_beneficiaries: target,
            actual_beneficiaries: actualBeneficiaries,
            gap: gap,
            gap_percentage: Math.round(gapPercentage * 100) / 100,
            male_beneficiaries: males,
            female_beneficiaries: females,
            other_beneficiaries: other,
            pwds_beneficiaries: pwds,
            gender_breakdown: {
                male_percentage: actualBeneficiaries > 0 ? Math.round((males / actualBeneficiaries) * 10000) / 100 : 0,
                female_percentage: actualBeneficiaries > 0 ? Math.round((females / actualBeneficiaries) * 10000) / 100 : 0,
                other_percentage: actualBeneficiaries > 0 ? Math.round((other / actualBeneficiaries) * 10000) / 100 : 0
            }
        };
        
    } catch (error) {
        logger.error('Error calculating beneficiary reach rate:', error);
        throw error;
    }
}

/**
 * Calculate Financial Burn Rate
 * Formula: (Total Expenditure / Total Budget) × 100
 * 
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Financial burn rate data
 */
export async function getFinancialBurnRate(projectId, month, year) {
    try {
        const query = `
            SELECT 
                budget,
                expenditure,
                burn_rate,
                currency
            FROM projects
            WHERE id = $1
        `;
        
        const result = await databaseService.queryOne(query, [projectId]);
        
        const budget = parseFloat(result.budget) || 0;
        const expenditure = parseFloat(result.expenditure) || 0;
        const burnRate = parseFloat(result.burn_rate) || 0;
        const currency = result.currency || 'USD';
        
        const remaining = budget - expenditure;
        
        // For financial burn rate, different status thresholds
        // Good: 40-90% (spending on track)
        // Fair: 30-40% or 90-100% (slow or too fast)
        // Poor: <30% (too slow) or >100% (overspent)
        
        let status = 'Unknown';
        if (burnRate >= 40 && burnRate <= 90) {
            status = 'Good';
        } else if ((burnRate >= 30 && burnRate < 40) || (burnRate > 90 && burnRate <= 100)) {
            status = 'Fair';
        } else if (budget > 0) {
            status = 'Poor';
        }
        
        return {
            rate: burnRate,
            status,
            total_budget: budget,
            total_expenditure: expenditure,
            remaining_budget: remaining,
            currency,
            overspent: expenditure > budget,
            overspent_amount: expenditure > budget ? expenditure - budget : 0
        };
        
    } catch (error) {
        logger.error('Error calculating financial burn rate:', error);
        throw error;
    }
}

/**
 * Get rate history for a project over a date range
 * 
 * @param {string} projectId - Project ID
 * @param {Date} startMonth - Start month
 * @param {Date} endMonth - End month
 * @returns {Promise<Array>} Historical rates
 */
export async function getRateHistory(projectId, startMonth, endMonth) {
    try {
        const query = `
            SELECT 
                snapshot_month,
                programmatic_performance_rate,
                activity_completion_rate,
                beneficiary_reach_rate,
                financial_burn_rate
            FROM monthly_snapshots
            WHERE project_id = $1
                AND snapshot_month >= $2
                AND snapshot_month <= $3
                AND indicator_id IS NULL
            ORDER BY snapshot_month ASC
        `;
        
        const history = await databaseService.query(query, [projectId, startMonth, endMonth]);
        
        return history.map(h => ({
            month: h.snapshot_month,
            programmatic_rate: h.programmatic_performance_rate,
            activity_rate: h.activity_completion_rate,
            beneficiary_rate: h.beneficiary_reach_rate,
            financial_rate: h.financial_burn_rate
        }));
        
    } catch (error) {
        logger.error('Error getting rate history:', error);
        throw error;
    }
}

/**
 * Get performance rates for all projects in a specific month
 * 
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Array>} All project rates
 */
export async function getAllProjectRates(month, year) {
    try {
        const snapshotDate = new Date(year, month - 1, 1);
        
        const query = `
            SELECT 
                ms.*,
                p.name as project_name,
                p.donor,
                p.status as project_status
            FROM monthly_snapshots ms
            JOIN projects p ON ms.project_id = p.id
            WHERE ms.snapshot_month = $1
                AND ms.indicator_id IS NULL
                AND p.status = 'Active'
            ORDER BY ms.programmatic_performance_rate DESC
        `;
        
        const snapshots = await databaseService.query(query, [snapshotDate]);
        
        return snapshots.map(s => ({
            project_id: s.project_id,
            project_name: s.project_name,
            donor: s.donor,
            programmatic_rate: s.programmatic_performance_rate,
            activity_rate: s.activity_completion_rate,
            beneficiary_rate: s.beneficiary_reach_rate,
            financial_rate: s.financial_burn_rate,
            snapshot_month: s.snapshot_month
        }));
        
    } catch (error) {
        logger.error('Error getting all project rates:', error);
        throw error;
    }
}

/**
 * Calculate rate status based on value
 * 
 * @param {number} rate - Rate value (0-100)
 * @param {string} rateType - Type of rate (for special thresholds)
 * @returns {string} Status (Good/Fair/Poor)
 */
export function getRateStatus(rate, rateType = 'standard') {
    if (rateType === 'financial') {
        // Financial burn rate has different thresholds
        if (rate >= 40 && rate <= 90) {
            return 'Good';
        } else if ((rate >= 30 && rate < 40) || (rate > 90 && rate <= 100)) {
            return 'Fair';
        } else {
            return 'Poor';
        }
    }
    
    // Standard thresholds for other rates
    if (rate >= 80) {
        return 'Good';
    } else if (rate >= 60) {
        return 'Fair';
    } else {
        return 'Poor';
    }
}

/**
 * Get rate color for UI display
 * 
 * @param {number} rate - Rate value
 * @param {string} rateType - Type of rate
 * @returns {string} Color code
 */
export function getRateColor(rate, rateType = 'standard') {
    const status = getRateStatus(rate, rateType);
    const colors = {
        'Good': '#10b981',
        'Fair': '#f59e0b',
        'Poor': '#ef4444',
        'Unknown': '#6b7280'
    };
    
    return colors[status] || colors['Unknown'];
}

export default {
    calculateAllRates,
    getProgrammaticRate,
    getActivityCompletionRate,
    getBeneficiaryReachRate,
    getFinancialBurnRate,
    getRateHistory,
    getAllProjectRates,
    getRateStatus,
    getRateColor
};
