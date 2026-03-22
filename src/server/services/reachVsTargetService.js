/**
 * Reach vs Target Service - Gap analysis and target projection
 * 
 * Handles:
 * - Target vs achieved gap calculations
 * - At-risk indicator identification
 * - Target projection and forecasting
 * - Reach recommendations
 * 
 * @module reachVsTargetService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Get indicator gap (target - achieved)
 * 
 * @param {string} indicatorId - Indicator ID
 * @returns {Promise<Object>} Gap data
 */
export async function getIndicatorGap(indicatorId) {
    try {
        const query = `
            SELECT 
                id,
                code,
                name,
                annual_target,
                lop_target,
                achieved,
                baseline,
                indicator_level,
                data_type,
                project_id
            FROM indicators
            WHERE id = $1
        `;
        
        const indicator = await databaseService.queryOne(query, [indicatorId]);
        
        if (!indicator) {
            throw new AppError('Indicator not found', 404);
        }
        
        const target = indicator.annual_target || indicator.lop_target || 0;
        const achieved = indicator.achieved || 0;
        const gap = target - achieved;
        
        return {
            indicator_id: indicator.id,
            indicator_code: indicator.code,
            indicator_name: indicator.name,
            indicator_level: indicator.indicator_level,
            data_type: indicator.data_type,
            target,
            achieved,
            gap,
            baseline: indicator.baseline || 0
        };
        
    } catch (error) {
        logger.error('Error getting indicator gap:', error);
        throw error;
    }
}

/**
 * Get indicator gap as percentage
 * 
 * @param {string} indicatorId - Indicator ID
 * @returns {Promise<Object>} Gap percentage data
 */
export async function getIndicatorGapPercentage(indicatorId) {
    try {
        const gapData = await getIndicatorGap(indicatorId);
        
        let percentageAchieved = 0;
        let gapPercentage = 0;
        
        if (gapData.target > 0) {
            percentageAchieved = (gapData.achieved / gapData.target) * 100;
            gapPercentage = (gapData.gap / gapData.target) * 100;
        }
        
        // Determine status
        let status = 'Unknown';
        let statusIcon = '❓';
        
        if (percentageAchieved >= 80) {
            status = 'On Track';
            statusIcon = '✓';
        } else if (percentageAchieved >= 60) {
            status = 'Behind';
            statusIcon = '⚠';
        } else if (gapData.target > 0) {
            status = 'At Risk';
            statusIcon = '✗';
        }
        
        return {
            ...gapData,
            percentage_achieved: Math.round(percentageAchieved * 100) / 100,
            gap_percentage: Math.round(gapPercentage * 100) / 100,
            status,
            status_icon: statusIcon
        };
        
    } catch (error) {
        logger.error('Error getting indicator gap percentage:', error);
        throw error;
    }
}

/**
 * Get all indicator gaps for a project
 * 
 * @param {string} projectId - Optional project ID filter
 * @returns {Promise<Array>} All indicator gaps
 */
export async function getAllIndicatorGaps(projectId = null) {
    try {
        let query = `
            SELECT 
                i.id,
                i.code,
                i.name,
                i.annual_target,
                i.lop_target,
                i.achieved,
                i.baseline,
                i.indicator_level,
                i.data_type,
                i.project_id,
                p.name as project_name
            FROM indicators i
            LEFT JOIN projects p ON i.project_id = p.id
            WHERE i.is_active = TRUE
        `;
        
        const params = [];
        
        if (projectId) {
            query += ` AND i.project_id = $1`;
            params.push(projectId);
        }
        
        query += ` ORDER BY i.indicator_level, i.name`;
        
        const indicators = await databaseService.query(query, params);
        
        const gaps = [];
        
        for (const indicator of indicators) {
            const target = indicator.annual_target || indicator.lop_target || 0;
            const achieved = indicator.achieved || 0;
            const gap = target - achieved;
            
            let percentageAchieved = 0;
            let gapPercentage = 0;
            
            if (target > 0) {
                percentageAchieved = (achieved / target) * 100;
                gapPercentage = (gap / target) * 100;
            }
            
            let status = 'Unknown';
            if (percentageAchieved >= 80) {
                status = 'On Track';
            } else if (percentageAchieved >= 60) {
                status = 'Behind';
            } else if (target > 0) {
                status = 'At Risk';
            }
            
            gaps.push({
                indicator_id: indicator.id,
                indicator_code: indicator.code,
                indicator_name: indicator.name,
                indicator_level: indicator.indicator_level,
                project_id: indicator.project_id,
                project_name: indicator.project_name,
                target,
                achieved,
                gap,
                percentage_achieved: Math.round(percentageAchieved * 100) / 100,
                gap_percentage: Math.round(gapPercentage * 100) / 100,
                status
            });
        }
        
        // Sort by largest gap percentage first
        gaps.sort((a, b) => b.gap_percentage - a.gap_percentage);
        
        return gaps;
        
    } catch (error) {
        logger.error('Error getting all indicator gaps:', error);
        throw error;
    }
}

/**
 * Get at-risk indicators (< 60% achieved)
 * 
 * @param {string} projectId - Optional project ID filter
 * @returns {Promise<Array>} At-risk indicators
 */
export async function getAtRiskIndicators(projectId = null) {
    try {
        const allGaps = await getAllIndicatorGaps(projectId);
        
        return allGaps.filter(gap => gap.status === 'At Risk');
        
    } catch (error) {
        logger.error('Error getting at-risk indicators:', error);
        throw error;
    }
}

/**
 * Get on-track indicators (> 80% achieved)
 * 
 * @param {string} projectId - Optional project ID filter
 * @returns {Promise<Array>} On-track indicators
 */
export async function getOnTrackIndicators(projectId = null) {
    try {
        const allGaps = await getAllIndicatorGaps(projectId);
        
        return allGaps.filter(gap => gap.status === 'On Track');
        
    } catch (error) {
        logger.error('Error getting on-track indicators:', error);
        throw error;
    }
}

/**
 * Project if indicator will reach target by a specific month
 * Uses linear projection based on historical trend
 * 
 * @param {string} indicatorId - Indicator ID
 * @param {Date} targetMonth - Target month to project to
 * @returns {Promise<Object>} Projection data
 */
export async function projectReachByMonth(indicatorId, targetMonth) {
    try {
        // Get indicator current state
        const gapData = await getIndicatorGapPercentage(indicatorId);
        
        // Get historical snapshots to calculate trend
        const historyQuery = `
            SELECT 
                snapshot_month,
                achieved_value,
                target_value
            FROM monthly_snapshots
            WHERE indicator_id = $1
            ORDER BY snapshot_month ASC
            LIMIT 6
        `;
        
        const history = await databaseService.query(historyQuery, [indicatorId]);
        
        if (history.length < 2) {
            return {
                ...gapData,
                projection: 'Insufficient historical data',
                will_reach_target: 'Unknown',
                projected_value: null,
                projected_percentage: null,
                trend: 'Unknown'
            };
        }
        
        // Calculate trend (simple linear regression)
        const firstSnapshot = history[0];
        const lastSnapshot = history[history.length - 1];
        
        const monthsDiff = Math.round((lastSnapshot.snapshot_month - firstSnapshot.snapshot_month) / (1000 * 60 * 60 * 24 * 30));
        const achievedDiff = lastSnapshot.achieved_value - firstSnapshot.achieved_value;
        
        if (monthsDiff === 0) {
            return {
                ...gapData,
                projection: 'Cannot calculate trend',
                will_reach_target: 'Unknown',
                projected_value: null,
                projected_percentage: null,
                trend: 'Flat'
            };
        }
        
        const monthlyGrowthRate = achievedDiff / monthsDiff;
        
        // Project to target month
        const now = new Date();
        const monthsToTarget = Math.round((targetMonth - now) / (1000 * 60 * 60 * 24 * 30));
        
        const projectedValue = gapData.achieved + (monthlyGrowthRate * monthsToTarget);
        const projectedPercentage = gapData.target > 0 ? (projectedValue / gapData.target) * 100 : 0;
        
        const willReach = projectedValue >= gapData.target;
        
        // Determine trend
        let trend = 'Stable';
        if (monthlyGrowthRate > 0) {
            trend = 'Improving';
        } else if (monthlyGrowthRate < 0) {
            trend = 'Declining';
        }
        
        return {
            ...gapData,
            projection: willReach ? 'Will reach target' : 'Will not reach target',
            will_reach_target: willReach,
            projected_value: Math.round(projectedValue),
            projected_percentage: Math.round(projectedPercentage * 100) / 100,
            monthly_growth_rate: Math.round(monthlyGrowthRate * 100) / 100,
            months_to_target: monthsToTarget,
            target_month: targetMonth,
            trend,
            historical_data_points: history.length
        };
        
    } catch (error) {
        logger.error('Error projecting reach by month:', error);
        throw error;
    }
}

/**
 * Get AI-powered recommendations based on indicator trend and status
 * 
 * @param {string} indicatorId - Indicator ID
 * @returns {Promise<Object>} Recommendations
 */
export async function getRecommendations(indicatorId) {
    try {
        const gapData = await getIndicatorGapPercentage(indicatorId);
        
        // Get projection for 3 months from now
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        
        const projection = await projectReachByMonth(indicatorId, threeMonthsFromNow);
        
        const recommendations = [];
        const actions = [];
        
        // Generate recommendations based on status
        if (gapData.status === 'At Risk') {
            recommendations.push({
                priority: 'High',
                type: 'Urgent Action Required',
                message: `${gapData.indicator_name} is significantly behind target (${gapData.percentage_achieved}% achieved).`,
                action: 'Immediate intervention needed to accelerate progress.'
            });
            
            actions.push('Review project activities and reallocate resources');
            actions.push('Identify and remove blockers to implementation');
            actions.push('Consider scaling up activities in this area');
            actions.push('Engage stakeholders for additional support');
            
        } else if (gapData.status === 'Behind') {
            recommendations.push({
                priority: 'Medium',
                type: 'Attention Needed',
                message: `${gapData.indicator_name} is behind target (${gapData.percentage_achieved}% achieved).`,
                action: 'Adjust implementation plan to improve performance.'
            });
            
            actions.push('Analyze causes of slower than expected progress');
            actions.push('Adjust activity schedule to catch up');
            actions.push('Consider additional resources if needed');
            
        } else if (gapData.status === 'On Track') {
            recommendations.push({
                priority: 'Low',
                type: 'Monitor',
                message: `${gapData.indicator_name} is on track (${gapData.percentage_achieved}% achieved).`,
                action: 'Continue current implementation pace.'
            });
            
            actions.push('Maintain current activity levels');
            actions.push('Continue monitoring for any issues');
            actions.push('Document successful approaches for other indicators');
        }
        
        // Add trend-based recommendations
        if (projection.trend === 'Declining') {
            recommendations.push({
                priority: 'High',
                type: 'Negative Trend',
                message: 'Performance is declining over recent months.',
                action: 'Investigate root causes and implement corrective measures.'
            });
            
            actions.push('Conduct detailed analysis of declining trend');
            actions.push('Identify external factors affecting performance');
            actions.push('Review and revise implementation strategy');
        }
        
        if (projection.trend === 'Improving' && gapData.status !== 'On Track') {
            recommendations.push({
                priority: 'Medium',
                type: 'Positive Trend',
                message: 'Performance is improving, but still below target.',
                action: 'Continue current improvements while accelerating progress.'
            });
            
            actions.push('Scale up successful activities');
            actions.push('Share best practices across teams');
            actions.push('Consider additional activities if capacity allows');
        }
        
        // Add projection-based recommendations
        if (!projection.will_reach_target && projection.projection !== 'Unknown') {
            recommendations.push({
                priority: 'High',
                type: 'Projection Warning',
                message: `At current pace, indicator will not reach target by ${projection.target_month.toLocaleDateString()}.`,
                action: 'Significant acceleration needed to meet targets.'
            });
        }
        
        return {
            indicator: gapData,
            projection,
            recommendations,
            suggested_actions: actions,
            generated_at: new Date()
        };
        
    } catch (error) {
        logger.error('Error getting recommendations:', error);
        throw error;
    }
}

/**
 * Get summary statistics for all indicators
 * 
 * @param {string} projectId - Optional project ID filter
 * @returns {Promise<Object>} Summary stats
 */
export async function getSummaryStatistics(projectId = null) {
    try {
        const allGaps = await getAllIndicatorGaps(projectId);
        
        const onTrack = allGaps.filter(g => g.status === 'On Track').length;
        const behind = allGaps.filter(g => g.status === 'Behind').length;
        const atRisk = allGaps.filter(g => g.status === 'At Risk').length;
        const unknown = allGaps.filter(g => g.status === 'Unknown').length;
        
        const totalTarget = allGaps.reduce((sum, g) => sum + g.target, 0);
        const totalAchieved = allGaps.reduce((sum, g) => sum + g.achieved, 0);
        const totalGap = totalTarget - totalAchieved;
        
        const overallPercentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
        
        return {
            total_indicators: allGaps.length,
            on_track: onTrack,
            behind: behind,
            at_risk: atRisk,
            unknown: unknown,
            total_target: totalTarget,
            total_achieved: totalAchieved,
            total_gap: totalGap,
            overall_achievement_percentage: Math.round(overallPercentage * 100) / 100,
            largest_gaps: allGaps.slice(0, 5) // Top 5 largest gaps
        };
        
    } catch (error) {
        logger.error('Error getting summary statistics:', error);
        throw error;
    }
}

export default {
    getIndicatorGap,
    getIndicatorGapPercentage,
    getAllIndicatorGaps,
    getAtRiskIndicators,
    getOnTrackIndicators,
    projectReachByMonth,
    getRecommendations,
    getSummaryStatistics
};
