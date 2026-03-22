/**
 * Indicator Utility Functions
 * 
 * Helper functions for working with indicators:
 * - Value formatting (numbers vs percentages)
 * - Validation
 * - Progress calculation
 * - Color coding
 * 
 * @module indicatorUtils
 */

/**
 * Format indicator value based on data type
 * @param {number|string} value - Value to format
 * @param {string} dataType - 'Number' or 'Percentage'
 * @param {string} unit - Unit of measurement
 * @returns {string} Formatted value
 */
export function formatIndicatorValue(value, dataType, unit = '') {
    if (value === null || value === undefined || value === '') {
        return 'N/A';
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
        return 'N/A';
    }
    
    if (dataType === 'Percentage' || dataType === 'percentage') {
        return `${numValue.toFixed(1)}%`;
    } else {
        const formatted = numValue.toLocaleString('en-US');
        return unit ? `${formatted} ${unit}` : formatted;
    }
}

/**
 * Validate indicator value based on data type
 * @param {number|string} value - Value to validate
 * @param {string} dataType - 'Number' or 'Percentage'
 * @returns {Object} Validation result
 */
export function validateIndicatorValue(value, dataType) {
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
            message: 'Value cannot be negative'
        };
    }
    
    if ((dataType === 'Percentage' || dataType === 'percentage') && numValue > 100) {
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
 * Calculate progress percentage and status
 * @param {number} achieved - Achieved value
 * @param {number} target - Target value
 * @param {string} dataType - 'Number' or 'Percentage'
 * @returns {Object} Progress information
 */
export function calculateProgress(achieved, target, dataType = 'Number') {
    const achievedNum = parseFloat(achieved) || 0;
    const targetNum = parseFloat(target) || 0;
    
    if (targetNum === 0) {
        return {
            percentage: 0,
            status: 'no-target',
            label: 'No target set',
            color: 'secondary',
            cssClass: 'bg-secondary'
        };
    }
    
    let percentage;
    if (dataType === 'Percentage' || dataType === 'percentage') {
        // For percentage indicators, achieved is already a percentage
        percentage = (achievedNum / targetNum) * 100;
    } else {
        // For number indicators, calculate normally
        percentage = (achievedNum / targetNum) * 100;
    }
    
    // Determine status and color
    let status, label, color, cssClass;
    if (percentage >= 100) {
        status = 'achieved';
        label = 'Target Achieved';
        color = 'success';
        cssClass = 'bg-success';
    } else if (percentage >= 70) {
        status = 'on-track';
        label = 'On Track';
        color = 'success';
        cssClass = 'bg-success';
    } else if (percentage >= 40) {
        status = 'at-risk';
        label = 'At Risk';
        color = 'warning';
        cssClass = 'bg-warning';
    } else {
        status = 'off-track';
        label = 'Off Track';
        color = 'danger';
        cssClass = 'bg-danger';
    }
    
    return {
        percentage: Math.min(Math.round(percentage), 100), // Cap at 100 for display
        actualPercentage: Math.round(percentage), // Actual percentage (can exceed 100)
        achieved: achievedNum,
        target: targetNum,
        variance: achievedNum - targetNum,
        status,
        label,
        color,
        cssClass
    };
}

/**
 * Get progress bar color class based on percentage
 * @param {number} percentage - Achievement percentage
 * @returns {string} Bootstrap color class
 */
export function getProgressColor(percentage) {
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'danger';
}

/**
 * Validate quarterly sum equals annual target
 * @param {number} q1 - Q1 value
 * @param {number} q2 - Q2 value
 * @param {number} q3 - Q3 value
 * @param {number} q4 - Q4 value
 * @param {number} annual - Annual target
 * @param {number} tolerance - Tolerance percentage (default 5%)
 * @returns {Object} Validation result
 */
export function validateQuarterlySum(q1, q2, q3, q4, annual, tolerance = 0.05) {
    const q1Val = parseFloat(q1) || 0;
    const q2Val = parseFloat(q2) || 0;
    const q3Val = parseFloat(q3) || 0;
    const q4Val = parseFloat(q4) || 0;
    const annualVal = parseFloat(annual) || 0;
    
    const quarterlySum = q1Val + q2Val + q3Val + q4Val;
    
    if (annualVal === 0) {
        return {
            valid: true,
            message: 'No annual target set',
            quarterlySum: 0,
            annual: 0,
            difference: 0
        };
    }
    
    const difference = Math.abs(quarterlySum - annualVal);
    const percentDiff = difference / annualVal;
    
    if (percentDiff > tolerance) {
        return {
            valid: false,
            message: `Quarterly targets sum (${quarterlySum}) should match annual target (${annualVal}). Difference: ${difference.toFixed(2)}`,
            quarterlySum,
            annual: annualVal,
            difference
        };
    }
    
    return {
        valid: true,
        message: 'Quarterly totals match annual target',
        quarterlySum,
        annual: annualVal,
        difference
    };
}

/**
 * Create progress bar HTML
 * @param {number} achieved - Achieved value
 * @param {number} target - Target value
 * @param {string} dataType - 'Number' or 'Percentage'
 * @param {boolean} showLabel - Show percentage label
 * @returns {string} HTML string
 */
export function createProgressBar(achieved, target, dataType, showLabel = true) {
    const progress = calculateProgress(achieved, target, dataType);
    
    const barWidth = Math.min(progress.percentage, 100);
    const displayPercentage = progress.actualPercentage;
    
    let html = `
        <div class="progress" style="height: 20px;">
            <div class="progress-bar ${progress.cssClass}" 
                 role="progressbar" 
                 style="width: ${barWidth}%;" 
                 aria-valuenow="${barWidth}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
    `;
    
    if (showLabel) {
        html += `${displayPercentage}%`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    if (showLabel) {
        html += `
            <small class="text-${progress.color}">
                <i class="bi bi-${progress.percentage >= 70 ? 'check-circle' : progress.percentage >= 40 ? 'exclamation-triangle' : 'x-circle'}"></i>
                ${progress.label}
            </small>
        `;
    }
    
    return html;
}

/**
 * Create scope badge HTML
 * @param {string} scope - 'awyad' or 'project'
 * @returns {string} HTML string
 */
export function createScopeBadge(scope) {
    if (scope === 'awyad') {
        return `<span class="badge bg-primary"><i class="bi bi-globe"></i> AWYAD</span>`;
    } else {
        return `<span class="badge bg-info"><i class="bi bi-folder"></i> Project</span>`;
    }
}

/**
 * Create indicator level badge HTML
 * @param {string} level - 'Output', 'Outcome', or 'Impact'
 * @returns {string} HTML string
 */
export function createLevelBadge(level) {
    const colors = {
        'Output': 'success',
        'Outcome': 'warning',
        'Impact': 'danger'
    };
    
    const icons = {
        'Output': 'activity',
        'Outcome': 'graph-up',
        'Impact': 'star'
    };
    
    const color = colors[level] || 'secondary';
    const icon = icons[level] || 'tag';
    
    return `<span class="badge bg-${color}"><i class="bi bi-${icon}"></i> ${level}</span>`;
}

/**
 * Calculate quarterly progress for each quarter
 * @param {Object} indicator - Indicator object with quarterly data
 * @returns {Object} Quarterly progress information
 */
export function calculateQuarterlyProgress(indicator) {
    const quarters = ['q1', 'q2', 'q3', 'q4'];
    const result = {};
    
    quarters.forEach(q => {
        const target = indicator[`${q}_target`] || 0;
        const achieved = indicator[`${q}_achieved`] || 0;
        result[q] = calculateProgress(achieved, target, indicator.data_type);
    });
    
    return result;
}

/**
 * Format LOP (Life of Project) progress
 * @param {number} achieved - Current achieved
 * @param {number} lopTarget - LOP target
 * @param {string} dataType - 'Number' or 'Percentage'
 * @returns {Object} LOP progress information
 */
export function calculateLOPProgress(achieved, lopTarget, dataType) {
    return calculateProgress(achieved, lopTarget, dataType);
}

/**
 * Check if indicator values are valid for data type
 * @param {Object} indicator - Indicator data
 * @returns {Object} Validation results
 */
export function validateIndicatorData(indicator) {
    const errors = [];
    const dataType = indicator.data_type || indicator.dataType;
    
    // Validate targets
    const targetFields = [
        'lop_target', 'annual_target', 'baseline',
        'q1_target', 'q2_target', 'q3_target', 'q4_target'
    ];
    
    targetFields.forEach(field => {
        const value = indicator[field];
        if (value !== null && value !== undefined && value !== '') {
            const validation = validateIndicatorValue(value, dataType);
            if (!validation.valid) {
                errors.push(`${field}: ${validation.message}`);
            }
        }
    });
    
    // Validate achieved values
    const achievedFields = [
        'achieved', 'q1_achieved', 'q2_achieved', 'q3_achieved', 'q4_achieved'
    ];
    
    achievedFields.forEach(field => {
        const value = indicator[field];
        if (value !== null && value !== undefined && value !== '') {
            const validation = validateIndicatorValue(value, dataType);
            if (!validation.valid) {
                errors.push(`${field}: ${validation.message}`);
            }
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export default {
    formatIndicatorValue,
    validateIndicatorValue,
    calculateProgress,
    getProgressColor,
    validateQuarterlySum,
    createProgressBar,
    createScopeBadge,
    createLevelBadge,
    calculateQuarterlyProgress,
    calculateLOPProgress,
    validateIndicatorData
};
