/**
 * Monthly Tracking Utility Functions
 * Helper functions for formatting, calculations, and UI rendering
 */

/**
 * Format month/year to readable string
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {string} Formatted month name
 */
export function formatMonth(month, year) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[month - 1]} ${year}`;
}

/**
 * Get array of months between start and end
 * @param {Date} startMonth - Start date
 * @param {Date} endMonth - End date
 * @returns {Array} Array of month objects {month, year, label}
 */
export function getMonthRange(startMonth, endMonth) {
    const months = [];
    const current = new Date(startMonth);
    
    while (current <= endMonth) {
        months.push({
            month: current.getMonth() + 1,
            year: current.getFullYear(),
            label: formatMonth(current.getMonth() + 1, current.getFullYear()),
            date: new Date(current)
        });
        current.setMonth(current.getMonth() + 1);
    }
    
    return months;
}

/**
 * Calculate color for rate based on value
 * @param {number} rate - Rate value (0-100)
 * @param {string} rateType - Type of rate (standard or financial)
 * @returns {string} CSS color code
 */
export function calculateRateColor(rate, rateType = 'standard') {
    if (rateType === 'financial') {
        // Financial burn rate: 40-90% is good
        if (rate >= 40 && rate <= 90) {
            return '#10b981'; // Green
        } else if ((rate >= 30 && rate < 40) || (rate > 90 && rate <= 100)) {
            return '#f59e0b'; // Yellow
        } else {
            return '#ef4444'; // Red
        }
    }
    
    // Standard rates: >80% good, 60-80% fair, <60% poor
    if (rate >= 80) {
        return '#10b981'; // Green
    } else if (rate >= 60) {
        return '#f59e0b'; // Yellow
    } else {
        return '#ef4444'; // Red
    }
}

/**
 * Get status text for rate
 * @param {number} rate - Rate value
 * @param {string} rateType - Type of rate
 * @returns {string} Status (Good/Fair/Poor)
 */
export function getRateStatus(rate, rateType = 'standard') {
    if (rateType === 'financial') {
        if (rate >= 40 && rate <= 90) {
            return 'Good';
        } else if ((rate >= 30 && rate < 40) || (rate > 90 && rate <= 100)) {
            return 'Fair';
        } else {
            return 'Poor';
        }
    }
    
    if (rate >= 80) {
        return 'Good';
    } else if (rate >= 60) {
        return 'Fair';
    } else {
        return 'Poor';
    }
}

/**
 * Format percentage with symbol
 * @param {number} rate - Rate value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(rate, decimals = 1) {
    if (rate === null || rate === undefined || isNaN(rate)) {
        return 'N/A';
    }
    return `${rate.toFixed(decimals)}%`;
}

/**
 * Get trend indicator based on current vs previous
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {string} Trend indicator (↑/→/↓)
 */
export function getTrendIndicator(current, previous) {
    if (previous === null || previous === undefined || previous === 0) {
        return '→';
    }
    
    const change = ((current - previous) / previous) * 100;
    
    if (change > 5) {
        return '↑';
    } else if (change < -5) {
        return '↓';
    } else {
        return '→';
    }
}

/**
 * Get trend text description
 * @param {string} indicator - Trend indicator (↑/→/↓)
 * @returns {string} Trend description
 */
export function getTrendText(indicator) {
    const trendMap = {
        '↑': 'Improving',
        '→': 'Stable',
        '↓': 'Declining'
    };
    return trendMap[indicator] || 'Unknown';
}

/**
 * Project if target will be reached
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} monthsRemaining - Months until target date
 * @param {Array} history - Historical data points
 * @returns {Object} Projection result
 */
export function projectToTarget(current, target, monthsRemaining, history = []) {
    if (monthsRemaining <= 0) {
        return {
            willReach: current >= target,
            projectedValue: current,
            confidence: 'N/A'
        };
    }
    
    if (!history || history.length < 2) {
        // Simple linear projection without history
        const monthlyRequired = (target - current) / monthsRemaining;
        
        return {
            willReach: false,
            projectedValue: current,
            monthlyRequired,
            confidence: 'Low'
        };
    }
    
    // Calculate growth rate from history
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstValue = sortedHistory[0].value;
    const lastValue = sortedHistory[sortedHistory.length - 1].value;
    const monthsInHistory = sortedHistory.length;
    
    const monthlyGrowth = (lastValue - firstValue) / monthsInHistory;
    const projectedValue = current + (monthlyGrowth * monthsRemaining);
    
    return {
        willReach: projectedValue >= target,
        projectedValue: Math.round(projectedValue),
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        confidence: history.length >= 6 ? 'High' : 'Medium'
    };
}

/**
 * Generate sparkline SVG for mini charts
 * @param {Array} data - Array of numbers
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} SVG markup
 */
export function generateSparkline(data, width = 100, height = 30) {
    if (!data || data.length === 0) {
        return `<svg width="${width}" height="${height}"></svg>`;
    }
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    
    return `
        <svg width="${width}" height="${height}" style="display: block;">
            <polyline
                points="${points}"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `;
}

/**
 * Format currency with symbol
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return 'N/A';
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
}

/**
 * Format large numbers with K, M suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatLargeNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return 'N/A';
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
 * Get status icon for indicator status
 * @param {string} status - Status text
 * @returns {string} Icon HTML
 */
export function getStatusIcon(status) {
    const icons = {
        'Good': '✓',
        'On Track': '✓',
        'Fair': '⚠',
        'Behind': '⚠',
        'Poor': '✗',
        'At Risk': '✗',
        'Unknown': '❓'
    };
    return icons[status] || '❓';
}

/**
 * Get CSS class for status badge
 * @param {string} status - Status text
 * @returns {string} CSS class
 */
export function getStatusClass(status) {
    const classes = {
        'Good': 'bg-green-100 text-green-800 border-green-300',
        'On Track': 'bg-green-100 text-green-800 border-green-300',
        'Fair': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Behind': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'Poor': 'bg-red-100 text-red-800 border-red-300',
        'At Risk': 'bg-red-100 text-red-800 border-red-300',
        'Unknown': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return classes[status] || classes['Unknown'];
}

/**
 * Calculate percentage complete for progress bar
 * @param {number} achieved - Achieved value
 * @param {number} target - Target value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(achieved, target) {
    if (!target || target === 0) {
        return 0;
    }
    const percentage = (achieved / target) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
}

/**
 * Get activity status color
 * @param {string} status - Activity status
 * @returns {string} Color code
 */
export function getActivityStatusColor(status) {
    const colors = {
        'Planned': '#3b82f6',      // Blue
        'In Progress': '#f59e0b',  // Yellow
        'Completed': '#10b981',    // Green
        'Overdue': '#ef4444'       // Red
    };
    return colors[status] || '#6b7280'; // Gray default
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Export data to CSV
 * @param {Array} data - Array of objects
 * @param {string} filename - File name
 */
export function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(field => {
            let value = row[field] ?? '';
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Debounce function for search/filter inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
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

export default {
    formatMonth,
    getMonthRange,
    calculateRateColor,
    getRateStatus,
    formatPercentage,
    getTrendIndicator,
    getTrendText,
    projectToTarget,
    generateSparkline,
    formatCurrency,
    formatLargeNumber,
    getStatusIcon,
    getStatusClass,
    calculatePercentage,
    getActivityStatusColor,
    formatDate,
    exportToCSV,
    debounce
};
