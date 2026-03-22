/**
 * Activity Service - Enhanced with multi-currency and PWD tracking
 * 
 * Handles:
 * - Activity budget calculations (including transfers)
 * - PWD (People with Disabilities) disaggregation validation
 * - Gender options validation (Male, Female, Other, Prefer not to say)
 * - Non-costed activity handling
 * - Multi-currency budget conversion
 * 
 * @module activityService
 */

import databaseService from './databaseService.js';
import currencyService from './currencyService.js';
import budgetTransferService from './budgetTransferService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

// Valid gender options
export const VALID_GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

/**
 * Calculate total budget for an activity (original + transfers in - transfers out)
 * @param {UUID} activityId - Activity ID
 * @returns {Promise<Object>} Budget breakdown
 */
export async function calculateTotalBudget(activityId) {
    try {
        // Get activity base budget
        const activityQuery = `
            SELECT 
                id,
                activity_name,
                budget as original_budget,
                actual_cost as expenditure,
                currency,
                is_costed
            FROM activities
            WHERE id = $1
        `;

        const activityResult = await databaseService.query(activityQuery, [activityId]);
        
        if (activityResult.rows.length === 0) {
            throw new AppError('Activity not found', 404);
        }

        const activity = activityResult.rows[0];

        // If not costed, return zeros
        if (!activity.is_costed) {
            return {
                activityId,
                activityName: activity.activity_name,
                isCosted: false,
                originalBudget: 0,
                transfersIn: 0,
                transfersOut: 0,
                totalBudget: 0,
                expenditure: 0,
                availableBudget: 0,
                currency: activity.currency || 'UGX'
            };
        }

        // Get transfers into this activity
        const transfersQuery = `
            SELECT COALESCE(SUM(amount_ugx), 0) as total_transfers
            FROM activity_budget_transfers
            WHERE destination_activity_id = $1
                AND status = 'completed'
        `;

        const transfersResult = await databaseService.query(transfersQuery, [activityId]);
        const transfersIn = parseFloat(transfersResult.rows[0].total_transfers);

        const originalBudget = parseFloat(activity.original_budget) || 0;
        const expenditure = parseFloat(activity.expenditure) || 0;
        
        // Total budget = original + transfers in
        // Note: transfers out are tracked at project level, not activity level
        const totalBudget = originalBudget + transfersIn;
        const availableBudget = totalBudget - expenditure;

        return {
            activityId,
            activityName: activity.activity_name,
            isCosted: true,
            originalBudget,
            transfersIn,
            transfersOut: 0, // Activities don't transfer out
            totalBudget,
            expenditure,
            availableBudget,
            currency: activity.currency || 'UGX',
            burnRate: totalBudget > 0 ? ((expenditure / totalBudget) * 100).toFixed(2) : 0
        };
    } catch (error) {
        logger.error('Error calculating total budget:', error);
        throw error;
    }
}

/**
 * Validate PWD disaggregation
 * PWDs Male + PWDs Female + PWDs Other must equal Total PWDs
 * Total PWDs must be <= Total Beneficiaries
 * @param {Object} data - Activity data with PWD fields
 * @returns {Object} Validation result
 */
export function validatePWDDisaggregation(data) {
    const pwdsMale = parseInt(data.pwds_male) || 0;
    const pwdsFemale = parseInt(data.pwds_female) || 0;
    const pwdsOther = parseInt(data.pwds_other) || 0;
    const totalPWDs = pwdsMale + pwdsFemale + pwdsOther;

    // Calculate total beneficiaries from all disaggregation fields
    const totalBeneficiaries = calculateTotalBeneficiaries(data);

    const errors = [];

    // PWDs cannot exceed total beneficiaries
    if (totalPWDs > totalBeneficiaries) {
        errors.push(`Total PWDs (${totalPWDs}) cannot exceed total beneficiaries (${totalBeneficiaries})`);
    }

    // Check for negative values
    if (pwdsMale < 0 || pwdsFemale < 0 || pwdsOther < 0) {
        errors.push('PWD disaggregation values cannot be negative');
    }

    return {
        valid: errors.length === 0,
        errors,
        totalPWDs,
        totalBeneficiaries,
        breakdown: {
            male: pwdsMale,
            female: pwdsFemale,
            other: pwdsOther
        }
    };
}

/**
 * Calculate total beneficiaries from disaggregation fields
 * @param {Object} data - Activity data
 * @returns {number} Total beneficiaries
 */
function calculateTotalBeneficiaries(data) {
    // Age-based disaggregation
    const ageGroups = [
        'age_0_4_male', 'age_0_4_female', 'age_0_4_other',
        'age_5_17_male', 'age_5_17_female', 'age_5_17_other',
        'age_18_49_male', 'age_18_49_female', 'age_18_49_other',
        'age_50_plus_male', 'age_50_plus_female', 'age_50_plus_other'
    ];

    let total = 0;
    for (const field of ageGroups) {
        total += parseInt(data[field]) || 0;
    }

    // If no age disaggregation, try direct beneficiaries
    if (total === 0) {
        total += (parseInt(data.direct_male) || 0);
        total += (parseInt(data.direct_female) || 0);
        total += (parseInt(data.direct_other) || 0);
    }

    return total;
}

/**
 * Validate gender options
 * @param {string} gender - Gender value
 * @returns {Object} Validation result
 */
export function validateGenderOptions(gender) {
    if (!gender) {
        return {
            valid: false,
            error: 'Gender is required'
        };
    }

    if (!VALID_GENDER_OPTIONS.includes(gender)) {
        return {
            valid: false,
            error: `Invalid gender option. Valid options: ${VALID_GENDER_OPTIONS.join(', ')}`
        };
    }

    return {
        valid: true,
        gender
    };
}

/**
 * Handle non-costed activity data
 * Skip budget-related validations and set budget fields to 0
 * @param {Object} data - Activity data
 * @returns {Object} Cleaned data for non-costed activity
 */
export function handleNonCostedActivity(data) {
    if (!data.is_costed) {
        return {
            ...data,
            budget: 0,
            actual_cost: 0,
            currency: 'UGX',
            exchange_rate: 1
        };
    }
    return data;
}

/**
 * Convert activity budget to different currency
 * @param {UUID} activityId - Activity ID
 * @param {string} toCurrency - Target currency
 * @param {Date} date - Date for conversion
 * @returns {Promise<Object>} Converted budget
 */
export async function convertActivityBudget(activityId, toCurrency, date = new Date()) {
    try {
        const budgetData = await calculateTotalBudget(activityId);

        if (!budgetData.isCosted) {
            return {
                ...budgetData,
                converted: false,
                message: 'Activity is not costed'
            };
        }

        const fromCurrency = budgetData.currency;

        if (fromCurrency === toCurrency) {
            return {
                ...budgetData,
                converted: false,
                targetCurrency: toCurrency,
                message: 'Already in target currency'
            };
        }

        // Convert each amount
        const originalBudgetConverted = await currencyService.convertAmount(
            budgetData.originalBudget,
            fromCurrency,
            toCurrency,
            date
        );

        const expenditureConverted = await currencyService.convertAmount(
            budgetData.expenditure,
            fromCurrency,
            toCurrency,
            date
        );

        const totalBudgetConverted = await currencyService.convertAmount(
            budgetData.totalBudget,
            fromCurrency,
            toCurrency,
            date
        );

        const availableBudgetConverted = await currencyService.convertAmount(
            budgetData.availableBudget,
            fromCurrency,
            toCurrency,
            date
        );

        return {
            activityId: budgetData.activityId,
            activityName: budgetData.activityName,
            isCosted: true,
            converted: true,
            sourceCurrency: fromCurrency,
            targetCurrency: toCurrency,
            exchangeRate: originalBudgetConverted.exchangeRate,
            conversionDate: date,
            originalBudget: originalBudgetConverted.convertedAmount,
            expenditure: expenditureConverted.convertedAmount,
            totalBudget: totalBudgetConverted.convertedAmount,
            availableBudget: availableBudgetConverted.convertedAmount,
            transfersIn: budgetData.transfersIn, // Already in UGX
            burnRate: budgetData.burnRate
        };
    } catch (error) {
        logger.error('Error converting activity budget:', error);
        throw error;
    }
}

/**
 * Validate complete activity data before creation/update
 * @param {Object} data - Activity data
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result
 */
export function validateActivityData(data, isUpdate = false) {
    const errors = [];
    const warnings = [];

    // Validate PWD disaggregation
    if (data.pwds_male || data.pwds_female || data.pwds_other) {
        const pwdValidation = validatePWDDisaggregation(data);
        if (!pwdValidation.valid) {
            errors.push(...pwdValidation.errors);
        }
    }

    // Validate currency
    if (data.currency && !currencyService.SUPPORTED_CURRENCIES.includes(data.currency)) {
        errors.push(`Unsupported currency: ${data.currency}. Supported: ${currencyService.SUPPORTED_CURRENCIES.join(', ')}`);
    }

    // Validate budget for costed activities
    if (data.is_costed !== false) {
        if (data.budget < 0) {
            errors.push('Budget cannot be negative');
        }
        if (data.actual_cost < 0) {
            errors.push('Actual cost cannot be negative');
        }
        if (data.actual_cost > data.budget) {
            warnings.push('Actual cost exceeds budget');
        }
    }

    // Validate dates
    if (data.planned_date && data.completion_date) {
        const planned = new Date(data.planned_date);
        const completed = new Date(data.completion_date);
        if (completed < planned) {
            errors.push('Completion date cannot be before planned date');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get activities by project with budget calculations
 * @param {UUID} projectId - Project ID
 * @param {string} convertToCurrency - Optional currency to convert to
 * @returns {Promise<Array>} Activities with budget data
 */
export async function getProjectActivitiesWithBudgets(projectId, convertToCurrency = null) {
    try {
        const query = `
            SELECT 
                a.*,
                i.name as indicator_name,
                p.name as project_name
            FROM activities a
            LEFT JOIN indicators i ON a.indicator_id = i.id
            LEFT JOIN projects p ON a.project_id = p.id
            WHERE a.project_id = $1
            ORDER BY a.planned_date DESC
        `;

        const result = await databaseService.query(query, [projectId]);
        const activities = [];

        for (const activity of result.rows) {
            let budgetData;
            
            if (convertToCurrency && activity.currency !== convertToCurrency) {
                budgetData = await convertActivityBudget(activity.id, convertToCurrency);
            } else {
                budgetData = await calculateTotalBudget(activity.id);
            }

            activities.push({
                ...activity,
                budgetData
            });
        }

        return activities;
    } catch (error) {
        logger.error('Error getting project activities with budgets:', error);
        throw error;
    }
}

/**
 * Get financial summary for a project
 * @param {UUID} projectId - Project ID
 * @returns {Promise<Object>} Financial summary
 */
export async function getProjectFinancialSummary(projectId) {
    try {
        // Get project details
        const projectQuery = `
            SELECT 
                id,
                name,
                budget as total_budget,
                expenditure as total_expenditure
            FROM projects
            WHERE id = $1
        `;

        const projectResult = await databaseService.query(projectQuery, [projectId]);
        
        if (projectResult.rows.length === 0) {
            throw new AppError('Project not found', 404);
        }

        const project = projectResult.rows[0];

        // Get budget transfer summary
        const transferReport = await budgetTransferService.generateTransferReport(
            projectId,
            new Date('2000-01-01'), // From beginning
            new Date()
        );

        // Get activities summary
        const activitiesQuery = `
            SELECT 
                COUNT(*) as total_activities,
                COUNT(*) FILTER (WHERE is_costed = true) as costed_activities,
                COUNT(*) FILTER (WHERE is_costed = false) as non_costed_activities,
                COALESCE(SUM(budget) FILTER (WHERE is_costed = true), 0) as total_activity_budgets,
                COALESCE(SUM(actual_cost) FILTER (WHERE is_costed = true), 0) as total_activity_expenditure
            FROM activities
            WHERE project_id = $1
        `;

        const activitiesResult = await databaseService.query(activitiesQuery, [projectId]);
        const activityStats = activitiesResult.rows[0];

        const totalBudget = parseFloat(project.total_budget);
        const totalExpenditure = parseFloat(project.total_expenditure);
        const transfersOut = transferReport.transfersOut.total;
        const transfersIn = transferReport.transfersIn.total;
        
        const availableBudget = totalBudget - totalExpenditure - transfersOut + transfersIn;
        const burnRate = totalBudget > 0 ? ((totalExpenditure / totalBudget) * 100).toFixed(2) : 0;

        return {
            projectId: project.id,
            projectName: project.name,
            budget: {
                original: totalBudget,
                transfersOut,
                transfersIn,
                netTransfers: transfersIn - transfersOut,
                available: availableBudget,
                total: totalBudget + transfersIn - transfersOut
            },
            expenditure: {
                total: totalExpenditure,
                activities: parseFloat(activityStats.total_activity_expenditure),
                burnRate: parseFloat(burnRate)
            },
            activities: {
                total: parseInt(activityStats.total_activities),
                costed: parseInt(activityStats.costed_activities),
                nonCosted: parseInt(activityStats.non_costed_activities),
                totalBudgets: parseFloat(activityStats.total_activity_budgets)
            },
            transfers: transferReport,
            currency: 'UGX'
        };
    } catch (error) {
        logger.error('Error getting project financial summary:', error);
        throw error;
    }
}

export default {
    calculateTotalBudget,
    validatePWDDisaggregation,
    validateGenderOptions,
    handleNonCostedActivity,
    convertActivityBudget,
    validateActivityData,
    getProjectActivitiesWithBudgets,
    getProjectFinancialSummary,
    VALID_GENDER_OPTIONS
};
