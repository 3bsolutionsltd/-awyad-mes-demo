/**
 * Utility Functions Module
 * 
 * Provides shared helper functions used across the AWYAD MES application.
 * Includes formatting, calculation, UI generation, and data extraction utilities.
 * 
 * @module utils
 * @author AWYAD MES Team
 * @since 1.0.0
 */

/**
 * Format a date to YYYY-MM-DD string format
 * 
 * @param {string|Date|null} date - The date to format (ISO string, Date object, or null)
 * @returns {string} Formatted date string or 'N/A' if invalid
 * 
 * @example
 * formatDate('2026-01-12T10:30:00Z') // Returns: '2026-01-12'
 * formatDate(new Date()) // Returns: '2026-01-12'
 * formatDate(null) // Returns: 'N/A'
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/**
 * Format a number as currency with dollar sign and thousand separators
 * 
 * @param {number|null|undefined} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., '$1,234.56')
 * 
 * @example
 * formatCurrency(1234.56) // Returns: '$1,234.56'
 * formatCurrency(1000000) // Returns: '$1,000,000'
 * formatCurrency(null) // Returns: '$0'
 */
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '$0';
    return `$${Number(amount).toLocaleString()}`;
}

/**
 * Format a number with thousand separators
 * 
 * @param {number|null|undefined} num - The number to format
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumber(1234) // Returns: '1,234'
 * formatNumber(1000000) // Returns: '1,000,000'
 * formatNumber(null) // Returns: '0'
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString();
}

/**
 * Calculate percentage from value and total
 * 
 * @param {number} value - The partial value
 * @param {number} total - The total value (denominator)
 * @returns {number} Percentage as a number (0-100)
 * 
 * @example
 * calculatePercentage(25, 100) // Returns: 25
 * calculatePercentage(75, 200) // Returns: 37.5
 * calculatePercentage(50, 0) // Returns: 0
 */
export function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Get Bootstrap color class for progress bars based on percentage
 * 
 * @param {number} percentage - The percentage value (0-100)
 * @returns {string} Bootstrap color class: 'success', 'warning', or 'danger'
 * 
 * @example
 * getProgressColorClass(80) // Returns: 'success' (green)
 * getProgressColorClass(50) // Returns: 'warning' (yellow)
 * getProgressColorClass(30) // Returns: 'danger' (red)
 */
export function getProgressColorClass(percentage) {
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'danger';
}

/**
 * Get Bootstrap color class for burn rate indicators
 * Uses inverted logic: lower is better (green), higher is worse (red)
 * 
 * @param {number} burnRate - The burn rate percentage (0-100)
 * @returns {string} Bootstrap color class: 'success', 'warning', or 'danger'
 * 
 * @example
 * getBurnRateColorClass(50) // Returns: 'success' (good spending)
 * getBurnRateColorClass(75) // Returns: 'warning' (moderate spending)
 * getBurnRateColorClass(95) // Returns: 'danger' (overspending risk)
 */
export function getBurnRateColorClass(burnRate) {
    if (burnRate >= 90) return 'danger';
    if (burnRate >= 75) return 'warning';
    return 'success';
}

/**
 * Safely parse JSON string with fallback to default value
 * Handles objects, strings, and invalid JSON gracefully
 * 
 * @param {string|Object} str - JSON string to parse or object to return as-is
 * @param {*} [defaultValue={}] - Default value to return if parsing fails
 * @returns {*} Parsed object or default value
 * 
 * @example
 * safeJSONParse('{"name":"John"}') // Returns: { name: 'John' }
 * safeJSONParse('invalid', {}) // Returns: {}
 * safeJSONParse({ already: 'object' }) // Returns: { already: 'object' }
 */
export function safeJSONParse(str, defaultValue = {}) {
    try {
        if (typeof str === 'object') return str;
        if (typeof str === 'string') return JSON.parse(str);
        return defaultValue;
    } catch (e) {
        console.warn('JSON parse error:', e);
        return defaultValue;
    }
}

/**
 * Display a loading spinner in the specified element
 * Replaces element content with Bootstrap spinner
 * 
 * @param {string} elementId - The ID of the DOM element to show loading in
 * @returns {void}
 * 
 * @example
 * showLoading('content-area')
 * // Element will show centered loading spinner
 */
export function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

/**
 * Display an error alert in the specified element
 * Replaces element content with Bootstrap danger alert
 * 
 * @param {string} elementId - The ID of the DOM element to show error in
 * @param {string} message - The error message to display
 * @returns {void}
 * 
 * @example
 * showError('content-area', 'Failed to load data')
 */
export function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
}

/**
 * Display a success alert in the specified element
 * Replaces element content with Bootstrap success alert
 * 
 * @param {string} elementId - The ID of the DOM element to show success in
 * @param {string} message - The success message to display
 * @returns {void}
 * 
 * @example
 * showSuccess('content-area', 'Data saved successfully')
 */
export function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="alert alert-success" role="alert">
                <i class="bi bi-check-circle"></i>
                ${message}
            </div>
        `;
    }
}

/**
 * Create a debounced function that delays execution until after wait milliseconds
 * Useful for limiting rapid function calls like search input, window resize
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * // Call rapidly, but only executes once after 300ms of no calls
 * debouncedSearch('term');
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Extract and normalize beneficiary disaggregation data from activity object
 * Handles both JSON format and individual database columns
 * Maps refugee/host, male/female, and 4 age groups
 * 
 * @param {Object} activity - Activity object with disaggregation data
 * @param {Object|string} [activity.disaggregation] - JSON disaggregation object or string
 * @param {number} [activity.refugee_male_0_4] - Fallback column values
 * @returns {Object} Normalized disaggregation object with refugee, host, and nationality data
 * 
 * @example
 * const disagg = extractDisaggregation({
 *   refugee_male_0_4: 10,
 *   refugee_female_0_4: 12,
 *   nationality_sudanese: 50
 * });
 * // Returns structured object with all age groups and communities
 */
export function extractDisaggregation(activity) {
    const disagg = safeJSONParse(activity.disaggregation, {});
    
    return {
        refugee: {
            male: {
                age0to4: disagg?.refugee?.male?.age0to4 || activity.refugee_male_0_4 || 0,
                age5to17: disagg?.refugee?.male?.age5to17 || activity.refugee_male_5_17 || 0,
                age18to49: disagg?.refugee?.male?.age18to49 || activity.refugee_male_18_49 || 0,
                age50plus: disagg?.refugee?.male?.age50plus || activity.refugee_male_50_plus || 0
            },
            female: {
                age0to4: disagg?.refugee?.female?.age0to4 || activity.refugee_female_0_4 || 0,
                age5to17: disagg?.refugee?.female?.age5to17 || activity.refugee_female_5_17 || 0,
                age18to49: disagg?.refugee?.female?.age18to49 || activity.refugee_female_18_49 || 0,
                age50plus: disagg?.refugee?.female?.age50plus || activity.refugee_female_50_plus || 0
            }
        },
        host: {
            male: {
                age0to4: disagg?.host?.male?.age0to4 || activity.host_male_0_4 || 0,
                age5to17: disagg?.host?.male?.age5to17 || activity.host_male_5_17 || 0,
                age18to49: disagg?.host?.male?.age18to49 || activity.host_male_18_49 || 0,
                age50plus: disagg?.host?.male?.age50plus || activity.host_male_50_plus || 0
            },
            female: {
                age0to4: disagg?.host?.female?.age0to4 || activity.host_female_0_4 || 0,
                age5to17: disagg?.host?.female?.age5to17 || activity.host_female_5_17 || 0,
                age18to49: disagg?.host?.female?.age18to49 || activity.host_female_18_49 || 0,
                age50plus: disagg?.host?.female?.age50plus || activity.host_female_50_plus || 0
            }
        },
        nationality: {
            sudanese: disagg?.nationality?.sudanese || activity.nationality_sudanese || 0,
            congolese: disagg?.nationality?.congolese || activity.nationality_congolese || 0,
            southSudanese: disagg?.nationality?.southSudanese || activity.nationality_south_sudanese || 0,
            others: disagg?.nationality?.others || activity.nationality_others || 0
        }
    };
}

/**
 * Calculate totals and subtotals from disaggregation data
 * Sums all age groups for each gender/community category
 * 
 * @param {Object} disagg - Disaggregation object from extractDisaggregation()
 * @param {Object} disagg.refugee - Refugee community data with male/female breakdown
 * @param {Object} disagg.host - Host community data with male/female breakdown
 * @returns {Object} Object with calculated totals: refugeeMale, refugeeFemale, refugeeTotal, hostMale, hostFemale, hostTotal, grandTotal
 * 
 * @example
 * const totals = calculateDisaggregationTotals(disaggregation);
 * console.log(totals.grandTotal); // Total beneficiaries across all categories
 * console.log(totals.refugeeTotal); // Total refugee beneficiaries
 */
export function calculateDisaggregationTotals(disagg) {
    const refugeeMaleTotal = Object.values(disagg.refugee.male).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const refugeeFemaleTotal = Object.values(disagg.refugee.female).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const hostMaleTotal = Object.values(disagg.host.male).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const hostFemaleTotal = Object.values(disagg.host.female).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    return {
        refugeeMale: refugeeMaleTotal,
        refugeeFemale: refugeeFemaleTotal,
        refugeeTotal: refugeeMaleTotal + refugeeFemaleTotal,
        hostMale: hostMaleTotal,
        hostFemale: hostFemaleTotal,
        hostTotal: hostMaleTotal + hostFemaleTotal,
        grandTotal: refugeeMaleTotal + refugeeFemaleTotal + hostMaleTotal + hostFemaleTotal
    };
}

/**
 * Validate that all required fields have values
 * Checks for null, undefined, empty strings, or whitespace-only strings
 * 
 * @param {Object} fields - Object with field names as keys and values to validate
 * @returns {string[]} Array of error messages for missing fields, empty if all valid
 * 
 * @example
 * const errors = validateRequired({
 *   'Project Name': projectName,
 *   'Start Date': startDate,
 *   'Budget': budget
 * });
 * if (errors.length > 0) {
 *   alert('Errors: ' + errors.join(', '));
 * }
 */
export function validateRequired(fields) {
    const errors = [];
    for (const [name, value] of Object.entries(fields)) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(`${name} is required`);
        }
    }
    return errors;
}

/**
 * Generate Bootstrap alert HTML string with icon
 * 
 * @param {string} type - Bootstrap alert type: 'success', 'danger', 'warning', or 'info'
 * @param {string} message - The message text to display in the alert
 * @param {string} [icon=null] - Optional Bootstrap icon name (without 'bi-' prefix), auto-selected if null
 * @returns {string} HTML string for Bootstrap alert component
 * 
 * @example
 * const alertHTML = createAlert('success', 'Operation completed!');
 * document.getElementById('alerts').innerHTML = alertHTML;
 * 
 * @example
 * const customIconAlert = createAlert('warning', 'Check this', 'bell');
 */
export function createAlert(type, message, icon = null) {
    const iconMap = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    const iconClass = icon || iconMap[type] || 'info-circle';
    
    return `
        <div class="alert alert-${type}" role="alert">
            <i class="bi bi-${iconClass}"></i>
            ${message}
        </div>
    `;
}
