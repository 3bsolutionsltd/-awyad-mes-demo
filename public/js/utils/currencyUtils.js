/**
 * Currency Utilities - Frontend multi-currency support
 * 
 * Provides helper functions for:
 * - Currency formatting and display
 * - Currency conversion
 * - PWD validation
 * - Currency symbols
 */

// Supported currencies
export const SUPPORTED_CURRENCIES = ['UGX', 'USD', 'EUR', 'GBP'];
export const DEFAULT_CURRENCY = 'UGX';

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
    'UGX': 'UGX',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
};

/**
 * Get currency symbol for currency code
 * @param {string} currencyCode - Currency code (UGX, USD, EUR, GBP)
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode) {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted amount with symbol
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY, decimals = 2) {
    if (amount === null || amount === undefined) {
        return `${getCurrencySymbol(currency)} 0.00`;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        return `${getCurrencySymbol(currency)} 0.00`;
    }

    const symbol = getCurrencySymbol(currency);
    const formattedAmount = numAmount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    // For currencies with symbols (not codes), put symbol before amount
    if (symbol === '$' || symbol === '€' || symbol === '£') {
        return `${symbol}${formattedAmount}`;
    }

    // For currency codes like UGX, put after amount
    return `${formattedAmount} ${symbol}`;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {number} exchangeRate - Exchange rate
 * @returns {number} Converted amount
 */
export function convertAmount(amount, exchangeRate) {
    if (!amount || !exchangeRate) return 0;
    return parseFloat((amount * exchangeRate).toFixed(2));
}

/**
 * Parse formatted currency string to number
 * @param {string} currencyString - Formatted currency string
 * @returns {number} Parsed number
 */
export function parseCurrency(currencyString) {
    if (!currencyString) return 0;
    
    // Remove currency symbols and commas
    const cleaned = currencyString
        .replace(/[UGX$€£,\s]/g, '')
        .trim();
    
    return parseFloat(cleaned) || 0;
}

/**
 * Validate PWD sum equals total
 * @param {number} male - PWDs Male
 * @param {number} female - PWDs Female
 * @param {number} other - PWDs Other
 * @param {number} total - Total PWDs
 * @returns {Object} Validation result
 */
export function validatePWDSum(male, female, other, total) {
    const maleNum = parseInt(male) || 0;
    const femaleNum = parseInt(female) || 0;
    const otherNum = parseInt(other) || 0;
    const totalNum = parseInt(total) || 0;

    const sum = maleNum + femaleNum + otherNum;

    return {
        valid: sum === totalNum,
        sum,
        total: totalNum,
        difference: Math.abs(sum - totalNum),
        message: sum === totalNum 
            ? 'PWD disaggregation is valid' 
            : `PWD sum (${sum}) does not match total (${totalNum})`
    };
}

/**
 * Validate PWDs do not exceed total beneficiaries
 * @param {number} pwdTotal - Total PWDs
 * @param {number} beneficiaryTotal - Total beneficiaries
 * @returns {Object} Validation result
 */
export function validatePWDBeneficiaries(pwdTotal, beneficiaryTotal) {
    const pwds = parseInt(pwdTotal) || 0;
    const beneficiaries = parseInt(beneficiaryTotal) || 0;

    return {
        valid: pwds <= beneficiaries,
        pwds,
        beneficiaries,
        message: pwds <= beneficiaries 
            ? 'PWD count is valid'
            : `PWDs (${pwds}) cannot exceed total beneficiaries (${beneficiaries})`
    };
}

/**
 * Get default currency
 * @returns {string} Default currency code
 */
export function getDefaultCurrency() {
    return DEFAULT_CURRENCY;
}

/**
 * Check if currency is supported
 * @param {string} currency - Currency code to check
 * @returns {boolean} True if supported
 */
export function isCurrencySupported(currency) {
    return SUPPORTED_CURRENCIES.includes(currency);
}

/**
 * Create currency dropdown options HTML
 * @param {string} selectedCurrency - Currently selected currency
 * @returns {string} HTML options string
 */
export function createCurrencyOptions(selectedCurrency = DEFAULT_CURRENCY) {
    return SUPPORTED_CURRENCIES.map(curr => {
        const selected = curr === selectedCurrency ? 'selected' : '';
        return `<option value="${curr}" ${selected}>${curr} (${getCurrencySymbol(curr)})</option>`;
    }).join('');
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
export function calculatePercentage(value, total, decimals = 2) {
    if (!total || total === 0) return '0.00%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format large numbers with suffixes (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Create conversion display text
 * @param {number} amount - Original amount
 * @param {string} fromCurrency - Source currency
 * @param {number} convertedAmount - Converted amount
 * @param {string} toCurrency - Target currency
 * @param {number} rate - Exchange rate
 * @returns {string} Formatted conversion text
 */
export function createConversionDisplay(amount, fromCurrency, convertedAmount, toCurrency, rate) {
    return `${formatCurrency(amount, fromCurrency)} = ${formatCurrency(convertedAmount, toCurrency)} (Rate: ${rate.toFixed(4)})`;
}

/**
 * Calculate burn rate
 * @param {number} expenditure - Amount spent
 * @param {number} budget - Total budget
 * @returns {Object} Burn rate data
 */
export function calculateBurnRate(expenditure, budget) {
    if (!budget || budget === 0) {
        return {
            percentage: 0,
            remaining: 0,
            status: 'N/A'
        };
    }

    const percentage = (expenditure / budget) * 100;
    const remaining = budget - expenditure;

    let status = 'good';
    if (percentage >= 90) status = 'critical';
    else if (percentage >= 75) status = 'warning';

    return {
        percentage: parseFloat(percentage.toFixed(2)),
        remaining,
        status
    };
}

/**
 * Get burn rate color class
 * @param {number} percentage - Burn rate percentage
 * @returns {string} CSS class name
 */
export function getBurnRateColor(percentage) {
    if (percentage >= 90) return 'text-danger';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
}

/**
 * Validate activity budget data
 * @param {Object} data - Activity data
 * @returns {Object} Validation result
 */
export function validateActivityBudget(data) {
    const errors = [];
    const warnings = [];

    // If non-costed, skip budget validation
    if (data.is_costed === false) {
        return { valid: true, errors: [], warnings: [] };
    }

    // Budget validation
    if (data.budget && data.budget < 0) {
        errors.push('Budget cannot be negative');
    }

    if (data.actual_cost && data.actual_cost < 0) {
        errors.push('Actual cost cannot be negative');
    }

    if (data.budget && data.actual_cost && data.actual_cost > data.budget) {
        warnings.push('Actual cost exceeds budget');
    }

    // Currency validation
    if (data.currency && !isCurrencySupported(data.currency)) {
        errors.push(`Unsupported currency: ${data.currency}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Create currency badge HTML
 * @param {string} currency - Currency code
 * @returns {string} HTML badge
 */
export function createCurrencyBadge(currency) {
    const symbol = getCurrencySymbol(currency);
    return `<span class="badge bg-info">${symbol}</span>`;
}

/**
 * Format exchange rate
 * @param {number} rate - Exchange rate
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {string} Formatted rate string
 */
export function formatExchangeRate(rate, fromCurrency, toCurrency) {
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
}

// Export all functions as default
export default {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    getCurrencySymbol,
    formatCurrency,
    convertAmount,
    parseCurrency,
    validatePWDSum,
    validatePWDBeneficiaries,
    getDefaultCurrency,
    isCurrencySupported,
    createCurrencyOptions,
    calculatePercentage,
    formatLargeNumber,
    createConversionDisplay,
    calculateBurnRate,
    getBurnRateColor,
    validateActivityBudget,
    createCurrencyBadge,
    formatExchangeRate
};
