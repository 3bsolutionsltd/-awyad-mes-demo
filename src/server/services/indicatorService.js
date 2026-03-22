/**
 * Indicator Service - Business logic for two-tier indicator system
 * 
 * Handles:
 * - Indicator validation by scope (AWYAD vs Project)
 * - Quarterly calculations and validations
 * - Percentage vs Number data type handling
 * - Progress calculations
 * - AWYAD indicator aggregation from project indicators
 * 
 * @module indicatorService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';

/**
 * Validate indicator based on scope
 * @param {Object} indicator - Indicator data
 * @returns {Object} Validation result
 */
export function validateIndicatorScope(indicator) {
    const errors = [];
    
    if (indicator.indicator_scope === 'awyad') {
        // AWYAD indicators MUST have thematic_area_id
        if (!indicator.thematic_area_id) {
            errors.push('AWYAD indicators must have a thematic area');
        }
        // AWYAD indicators CANNOT have project_id
        if (indicator.project_id) {
            errors.push('AWYAD indicators cannot be linked to a specific project');
        }
        // AWYAD indicators don't require result_area
    } else if (indicator.indicator_scope === 'project') {
        // Project indicators MUST have project_id
        if (!indicator.project_id) {
            errors.push('Project indicators must have a project');
        }
        // Project indicators MUST have result_area
        if (!indicator.result_area) {
            errors.push('Project indicators must have a result area');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate quarterly totals match annual target
 * @param {Object} indicator - Indicator data with quarterly values
 * @param {number} tolerance - Acceptable variance (default 5%)
 * @returns {Object} Validation result
 */
export function validateQuarterlyTotals(indicator, tolerance = 0.05) {
    const q1 = parseFloat(indicator.q1_target) || 0;
    const q2 = parseFloat(indicator.q2_target) || 0;
    const q3 = parseFloat(indicator.q3_target) || 0;
    const q4 = parseFloat(indicator.q4_target) || 0;
    const annual = parseFloat(indicator.annual_target) || 0;
    
    const quarterlySum = q1 + q2 + q3 + q4;
    
    if (annual === 0) {
        return {
            valid: true,
            message: 'No annual target set'
        };
    }
    
    const difference = Math.abs(quarterlySum - annual);
    const percentDiff = difference / annual;
    
    if (percentDiff > tolerance) {
        return {
            valid: false,
            message: `Quarterly targets sum (${quarterlySum}) does not match annual target (${annual}). Difference: ${difference.toFixed(2)}`,
            quarterlySum,
            annual,
            difference
        };
    }
    
    return {
        valid: true,
        quarterlySum,
        annual,
        difference
    };
}

/**
 * Calculate quarterly totals from individual values
 * @param {Object} indicator - Indicator data
 * @returns {Object} Calculated totals
 */
export function calculateQuarterlyTotals(indicator) {
    const q1Target = parseFloat(indicator.q1_target) || 0;
    const q2Target = parseFloat(indicator.q2_target) || 0;
    const q3Target = parseFloat(indicator.q3_target) || 0;
    const q4Target = parseFloat(indicator.q4_target) || 0;
    
    const q1Achieved = parseFloat(indicator.q1_achieved) || 0;
    const q2Achieved = parseFloat(indicator.q2_achieved) || 0;
    const q3Achieved = parseFloat(indicator.q3_achieved) || 0;
    const q4Achieved = parseFloat(indicator.q4_achieved) || 0;
    
    return {
        totalTargets: q1Target + q2Target + q3Target + q4Target,
        totalAchieved: q1Achieved + q2Achieved + q3Achieved + q4Achieved,
        quarters: {
            q1: { target: q1Target, achieved: q1Achieved },
            q2: { target: q2Target, achieved: q2Achieved },
            q3: { target: q3Target, achieved: q3Achieved },
            q4: { target: q4Target, achieved: q4Achieved }
        }
    };
}

/**
 * Validate percentage values
 * @param {number} value - Value to validate
 * @returns {Object} Validation result
 */
export function validatePercentage(value) {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
        return {
            valid: false,
            message: 'Value must be a number'
        };
    }
    
    if (numValue < 0) {
        return {
            valid: false,
            message: 'Percentage cannot be negative'
        };
    }
    
    if (numValue > 100) {
        return {
            valid: false,
            message: 'Percentage cannot exceed 100%'
        };
    }
    
    return {
        valid: true,
        value: numValue
    };
}

/**
 * Format indicator value based on data type
 * @param {number} value - Value to format
 * @param {string} dataType - 'number' or 'percentage'
 * @param {string} unit - Unit of measurement
 * @returns {string} Formatted value
 */
export function formatIndicatorValue(value, dataType, unit = '') {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
        return 'N/A';
    }
    
    if (dataType === 'percentage') {
        return `${numValue.toFixed(1)}%`;
    } else {
        const formatted = numValue.toLocaleString('en-US');
        return unit ? `${formatted} ${unit}` : formatted;
    }
}

/**
 * Calculate progress percentage
 * @param {number} achieved - Achieved value
 * @param {number} target - Target value
 * @param {string} dataType - 'number' or 'percentage'
 * @returns {Object} Progress information
 */
export function getIndicatorProgress(achieved, target, dataType = 'number') {
    const achievedNum = parseFloat(achieved) || 0;
    const targetNum = parseFloat(target) || 0;
    
    if (targetNum === 0) {
        return {
            percentage: 0,
            status: 'no-target',
            label: 'No target set',
            color: 'secondary'
        };
    }
    
    let percentage;
    if (dataType === 'percentage') {
        // For percentages, the achieved value is already a percentage
        // So we compare directly
        percentage = (achievedNum / targetNum) * 100;
    } else {
        // For numbers, calculate as normal
        percentage = (achievedNum / targetNum) * 100;
    }
    
    // Determine status and color
    let status, label, color;
    if (percentage >= 100) {
        status = 'achieved';
        label = 'Target Achieved';
        color = 'success';
    } else if (percentage >= 70) {
        status = 'on-track';
        label = 'On Track';
        color = 'success';
    } else if (percentage >= 40) {
        status = 'at-risk';
        label = 'At Risk';
        color = 'warning';
    } else {
        status = 'off-track';
        label = 'Off Track';
        color = 'danger';
    }
    
    return {
        percentage: Math.round(percentage),
        achieved: achievedNum,
        target: targetNum,
        variance: achievedNum - targetNum,
        status,
        label,
        color
    };
}

/**
 * Aggregate AWYAD indicator from linked project indicators
 * @param {string} awyadIndicatorId - AWYAD indicator ID
 * @returns {Promise<Object>} Aggregated values
 */
export async function aggregateAWYADIndicator(awyadIndicatorId) {
    try {
        // Get the AWYAD indicator
        const awyadIndicator = await databaseService.queryOne(
            'SELECT * FROM indicators WHERE id = $1 AND indicator_scope = $2',
            [awyadIndicatorId, 'awyad']
        );
        
        if (!awyadIndicator) {
            throw new AppError('AWYAD indicator not found', 404);
        }
        
        // Get all linked project indicators with their mappings
        const linkedIndicators = await databaseService.query(`
            SELECT 
                i.*,
                im.contribution_weight,
                p.name as project_name
            FROM indicator_mappings im
            JOIN indicators i ON im.project_indicator_id = i.id
            JOIN projects p ON i.project_id = p.id
            WHERE im.awyad_indicator_id = $1
            AND i.indicator_scope = 'project'
        `, [awyadIndicatorId]);
        
        if (linkedIndicators.length === 0) {
            return {
                achieved: 0,
                q1_achieved: 0,
                q2_achieved: 0,
                q3_achieved: 0,
                q4_achieved: 0,
                linkedCount: 0
            };
        }
        
        // Calculate weighted aggregation
        let totalAchieved = 0;
        let q1Total = 0;
        let q2Total = 0;
        let q3Total = 0;
        let q4Total = 0;
        let totalWeight = 0;
        
        linkedIndicators.forEach(indicator => {
            const weight = parseFloat(indicator.contribution_weight) || 1.0;
            totalWeight += weight;
            
            totalAchieved += (parseFloat(indicator.achieved) || 0) * weight;
            q1Total += (parseFloat(indicator.q1_achieved) || 0) * weight;
            q2Total += (parseFloat(indicator.q2_achieved) || 0) * weight;
            q3Total += (parseFloat(indicator.q3_achieved) || 0) * weight;
            q4Total += (parseFloat(indicator.q4_achieved) || 0) * weight;
        });
        
        // Normalize by total weight if needed
        if (totalWeight > 0) {
            totalAchieved = totalAchieved / totalWeight;
            q1Total = q1Total / totalWeight;
            q2Total = q2Total / totalWeight;
            q3Total = q3Total / totalWeight;
            q4Total = q4Total / totalWeight;
        }
        
        return {
            achieved: Math.round(totalAchieved),
            q1_achieved: Math.round(q1Total),
            q2_achieved: Math.round(q2Total),
            q3_achieved: Math.round(q3Total),
            q4_achieved: Math.round(q4Total),
            linkedCount: linkedIndicators.length,
            linkedIndicators: linkedIndicators.map(ind => ({
                id: ind.id,
                name: ind.name,
                project: ind.project_name,
                achieved: ind.achieved,
                weight: ind.contribution_weight
            }))
        };
    } catch (error) {
        console.error('Error aggregating AWYAD indicator:', error);
        throw error;
    }
}

/**
 * Update AWYAD indicator with aggregated values
 * @param {string} awyadIndicatorId - AWYAD indicator ID
 * @returns {Promise<Object>} Updated indicator
 */
export async function updateAWYADIndicatorAggregation(awyadIndicatorId) {
    try {
        const aggregated = await aggregateAWYADIndicator(awyadIndicatorId);
        
        const updated = await databaseService.queryOne(`
            UPDATE indicators
            SET 
                achieved = $1,
                q1_achieved = $2,
                q2_achieved = $3,
                q3_achieved = $4,
                q4_achieved = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *
        `, [
            aggregated.achieved,
            aggregated.q1_achieved,
            aggregated.q2_achieved,
            aggregated.q3_achieved,
            aggregated.q4_achieved,
            awyadIndicatorId
        ]);
        
        return {
            ...updated,
            aggregation_info: aggregated
        };
    } catch (error) {
        console.error('Error updating AWYAD indicator aggregation:', error);
        throw error;
    }
}

export default {
    validateIndicatorScope,
    validateQuarterlyTotals,
    calculateQuarterlyTotals,
    validatePercentage,
    formatIndicatorValue,
    getIndicatorProgress,
    aggregateAWYADIndicator,
    updateAWYADIndicatorAggregation
};
