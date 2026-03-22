/**
 * Charts Utility Module
 * 
 * Provides data visualization functionality using Chart.js library.
 * Creates interactive charts for dashboard, indicators, activities, and financial data.
 * Supports multiple chart types: line, bar, pie, doughnut, and gauge charts.
 * 
 * @module charts
 * @author AWYAD MES Team
 * @since 2.1.0
 */

import { formatCurrency, formatNumber, calculatePercentage } from './utils.js';

/**
 * Chart.js instance - loaded dynamically
 * @type {Object}
 */
let Chart = null;

/**
 * Store for active chart instances (for cleanup/updates)
 * @type {Map<string, Object>}
 */
const activeCharts = new Map();

/**
 * Load Chart.js library dynamically from CDN
 * 
 * @async
 * @returns {Promise<Object>} Chart.js library instance
 * @throws {Error} If Chart.js fails to load
 */
async function loadChartJS() {
    if (Chart) return Chart;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        script.onload = () => {
            Chart = window.Chart;
            resolve(Chart);
        };
        script.onerror = () => reject(new Error('Failed to load Chart.js library'));
        document.head.appendChild(script);
    });
}

/**
 * Default chart color palette (AWYAD brand colors)
 */
const COLORS = {
    primary: '#0d6efd',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    secondary: '#6c757d',
    refugee: '#e74c3c',
    host: '#3498db',
    male: '#3498db',
    female: '#e91e63',
    children: '#9b59b6',
    youth: '#3498db',
    adults: '#2ecc71',
    elderly: '#f39c12'
};

/**
 * Generate color palette for charts
 * 
 * @param {number} count - Number of colors needed
 * @returns {string[]} Array of color hex codes
 */
function generateColorPalette(count) {
    const baseColors = Object.values(COLORS);
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

/**
 * Destroy existing chart instance if it exists
 * 
 * @param {string} canvasId - Canvas element ID
 */
function destroyChart(canvasId) {
    if (activeCharts.has(canvasId)) {
        activeCharts.get(canvasId).destroy();
        activeCharts.delete(canvasId);
    }
}

/**
 * Create KPI summary cards with mini trend charts for dashboard
 * 
 * @async
 * @param {Object} data - Dashboard summary data
 * @param {number} data.totalProjects - Total active projects
 * @param {number} data.totalIndicators - Total indicators being tracked
 * @param {number} data.totalActivities - Total activities conducted
 * @param {number} data.totalCases - Total cases managed
 * @param {number} data.totalBeneficiaries - Total beneficiaries reached
 * @param {number} data.totalBudget - Total budget across all projects
 * @returns {Promise<Object[]>} Array of created chart instances
 */
export async function createDashboardKPICharts(data) {
    await loadChartJS();
    
    const kpiData = [
        { label: 'Projects', value: data.totalProjects, color: COLORS.primary, trend: [5, 8, 12, 15, data.totalProjects] },
        { label: 'Indicators', value: data.totalIndicators, color: COLORS.success, trend: [10, 18, 25, 32, data.totalIndicators] },
        { label: 'Activities', value: data.totalActivities, color: COLORS.info, trend: [20, 45, 78, 120, data.totalActivities] },
        { label: 'Beneficiaries', value: data.totalBeneficiaries, color: COLORS.warning, trend: [500, 1200, 2500, 4000, data.totalBeneficiaries] }
    ];
    
    const charts = [];
    
    kpiData.forEach((kpi, index) => {
        const canvasId = `kpi-chart-${index}`;
        const canvas = document.getElementById(canvasId);
        
        if (canvas) {
            destroyChart(canvasId);
            
            const chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: ['', '', '', '', ''],
                    datasets: [{
                        data: kpi.trend,
                        borderColor: kpi.color,
                        backgroundColor: `${kpi.color}20`,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
            
            activeCharts.set(canvasId, chart);
            charts.push(chart);
        }
    });
    
    return charts;
}

/**
 * Create indicator achievement chart (bar chart showing targets vs achieved)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} indicators - Array of indicator objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createIndicatorAchievementChart(canvasId, indicators) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Take top 10 indicators or all if less than 10
    const topIndicators = indicators.slice(0, 10);
    
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: topIndicators.map(ind => ind.code || ind.name?.substring(0, 15) + '...'),
            datasets: [
                {
                    label: 'Annual Target',
                    data: topIndicators.map(ind => ind.annualTarget || 0),
                    backgroundColor: `${COLORS.primary}80`,
                    borderColor: COLORS.primary,
                    borderWidth: 1
                },
                {
                    label: 'Achieved',
                    data: topIndicators.map(ind => ind.achieved || 0),
                    backgroundColor: `${COLORS.success}80`,
                    borderColor: COLORS.success,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Indicator Performance: Target vs Achievement'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create quarterly indicator progress chart (line chart)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} indicators - Array of indicator objects with quarterly data
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createQuarterlyProgressChart(canvasId, indicators) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Aggregate quarterly data across all indicators
    const quarterlyTotals = {
        q1: { target: 0, achieved: 0 },
        q2: { target: 0, achieved: 0 },
        q3: { target: 0, achieved: 0 },
        q4: { target: 0, achieved: 0 }
    };
    
    indicators.forEach(ind => {
        quarterlyTotals.q1.target += ind.q1Target || 0;
        quarterlyTotals.q1.achieved += ind.q1Achieved || 0;
        quarterlyTotals.q2.target += ind.q2Target || 0;
        quarterlyTotals.q2.achieved += ind.q2Achieved || 0;
        quarterlyTotals.q3.target += ind.q3Target || 0;
        quarterlyTotals.q3.achieved += ind.q3Achieved || 0;
        quarterlyTotals.q4.target += ind.q4Target || 0;
        quarterlyTotals.q4.achieved += ind.q4Achieved || 0;
    });
    
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [
                {
                    label: 'Target',
                    data: [
                        quarterlyTotals.q1.target,
                        quarterlyTotals.q2.target,
                        quarterlyTotals.q3.target,
                        quarterlyTotals.q4.target
                    ],
                    borderColor: COLORS.primary,
                    backgroundColor: `${COLORS.primary}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Achieved',
                    data: [
                        quarterlyTotals.q1.achieved,
                        quarterlyTotals.q2.achieved,
                        quarterlyTotals.q3.achieved,
                        quarterlyTotals.q4.achieved
                    ],
                    borderColor: COLORS.success,
                    backgroundColor: `${COLORS.success}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Quarterly Progress Tracking'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create beneficiary disaggregation pie chart (refugee vs host community)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} activities - Array of activity objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createBeneficiaryDisaggregationChart(canvasId, activities) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Aggregate beneficiary data
    let refugeeTotal = 0;
    let hostTotal = 0;
    
    activities.forEach(activity => {
        refugeeTotal += activity.refugeeTotal || 0;
        hostTotal += activity.hostTotal || 0;
    });
    
    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Refugee Community', 'Host Community'],
            datasets: [{
                data: [refugeeTotal, hostTotal],
                backgroundColor: [COLORS.refugee, COLORS.host],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Beneficiaries by Community Type'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const total = refugeeTotal + hostTotal;
                            const percentage = calculatePercentage(context.parsed, total);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create gender disaggregation chart
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} activities - Array of activity objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createGenderDisaggregationChart(canvasId, activities) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Aggregate gender data from disaggregation or direct fields
    let maleTotal = 0;
    let femaleTotal = 0;
    
    activities.forEach(activity => {
        // Use the transformed totals from dataTransformer
        maleTotal += (activity.refugeeMaleTotal || 0) + (activity.hostMaleTotal || 0);
        femaleTotal += (activity.refugeeFemaleTotal || 0) + (activity.hostFemaleTotal || 0);
    });
    
    const chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Male', 'Female'],
            datasets: [{
                data: [maleTotal, femaleTotal],
                backgroundColor: [COLORS.male, COLORS.female],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Beneficiaries by Gender'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const total = maleTotal + femaleTotal;
                            const percentage = calculatePercentage(context.parsed, total);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create age disaggregation chart (stacked bar chart)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} activities - Array of activity objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createAgeDisaggregationChart(canvasId, activities) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Aggregate age group data from transformed activities
    const ageGroups = {
        '0-4': 0,
        '5-17': 0,
        '18-49': 0,
        '50+': 0
    };
    
    activities.forEach(activity => {
        // Access disaggregation object structure from dataTransformer
        if (activity.disaggregation) {
            const disagg = activity.disaggregation;
            // Sum all communities and genders for each age group
            ageGroups['0-4'] += (disagg.refugee?.male?.age0to4 || 0) + 
                                 (disagg.refugee?.female?.age0to4 || 0) + 
                                 (disagg.host?.male?.age0to4 || 0) + 
                                 (disagg.host?.female?.age0to4 || 0);
            
            ageGroups['5-17'] += (disagg.refugee?.male?.age5to17 || 0) + 
                                  (disagg.refugee?.female?.age5to17 || 0) + 
                                  (disagg.host?.male?.age5to17 || 0) + 
                                  (disagg.host?.female?.age5to17 || 0);
            
            ageGroups['18-49'] += (disagg.refugee?.male?.age18to49 || 0) + 
                                   (disagg.refugee?.female?.age18to49 || 0) + 
                                   (disagg.host?.male?.age18to49 || 0) + 
                                   (disagg.host?.female?.age18to49 || 0);
            
            ageGroups['50+'] += (disagg.refugee?.male?.age50plus || 0) + 
                                 (disagg.refugee?.female?.age50plus || 0) + 
                                 (disagg.host?.male?.age50plus || 0) + 
                                 (disagg.host?.female?.age50plus || 0);
        }
    });
    
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Age Distribution'],
            datasets: [
                {
                    label: '0-4 years',
                    data: [ageGroups['0-4']],
                    backgroundColor: COLORS.children
                },
                {
                    label: '5-17 years',
                    data: [ageGroups['5-17']],
                    backgroundColor: COLORS.youth
                },
                {
                    label: '18-49 years',
                    data: [ageGroups['18-49']],
                    backgroundColor: COLORS.adults
                },
                {
                    label: '50+ years',
                    data: [ageGroups['50+']],
                    backgroundColor: COLORS.elderly
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Beneficiaries by Age Group'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create nationality breakdown chart
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} activities - Array of activity objects with nationality data
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createNationalityChart(canvasId, activities) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Aggregate nationality data from transformed activities
    const nationalities = {
        sudanese: 0,
        congolese: 0,
        southSudanese: 0,
        others: 0
    };
    
    activities.forEach(activity => {
        // Use transformed field names (from dataTransformer.js with nationality prefix)
        nationalities.sudanese += activity.nationalitySudanese || 0;
        nationalities.congolese += activity.nationalityCongolese || 0;
        nationalities.southSudanese += activity.nationalitySouthSudanese || 0;
        nationalities.others += activity.nationalityOthers || 0;
    });
    
    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Sudanese', 'Congolese', 'South Sudanese', 'Others'],
            datasets: [{
                data: [
                    nationalities.sudanese,
                    nationalities.congolese,
                    nationalities.southSudanese,
                    nationalities.others
                ],
                backgroundColor: generateColorPalette(4),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Beneficiaries by Nationality'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatNumber(context.parsed);
                            const total = Object.values(nationalities).reduce((sum, val) => sum + val, 0);
                            const percentage = calculatePercentage(context.parsed, total);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create project budget visualization (horizontal bar chart)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} projects - Array of project objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createProjectBudgetChart(canvasId, projects) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Take top 10 projects by budget
    const topProjects = projects
        .sort((a, b) => (b.budget || 0) - (a.budget || 0))
        .slice(0, 10);
    
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: topProjects.map(p => p.code || p.name?.substring(0, 20)),
            datasets: [
                {
                    label: 'Total Budget',
                    data: topProjects.map(p => p.budget || 0),
                    backgroundColor: `${COLORS.primary}80`,
                    borderColor: COLORS.primary,
                    borderWidth: 1
                },
                {
                    label: 'Expenditure',
                    data: topProjects.map(p => p.expenditure || 0),
                    backgroundColor: `${COLORS.warning}80`,
                    borderColor: COLORS.warning,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Project Budget vs Expenditure'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.x)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create burn rate gauge chart (showing budget utilization)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {number} budget - Total budget
 * @param {number} expenditure - Total expenditure
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createBurnRateGauge(canvasId, budget, expenditure) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    const burnRate = budget > 0 ? ((expenditure / budget) * 100) : 0;
    const remaining = 100 - burnRate;
    
    // Determine color based on burn rate
    let color = COLORS.success;
    if (burnRate > 90) color = COLORS.danger;
    else if (burnRate > 75) color = COLORS.warning;
    
    const chart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Utilized', 'Remaining'],
            datasets: [{
                data: [burnRate, remaining],
                backgroundColor: [color, '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: -90,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Budget Utilization: ${burnRate.toFixed(1)}%`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.label === 'Utilized') {
                                return `Spent: ${formatCurrency(expenditure)}`;
                            } else {
                                return `Remaining: ${formatCurrency(budget - expenditure)}`;
                            }
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create monthly tracking timeline chart (line chart with multiple series)
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} monthlyData - Array of monthly activity data
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createMonthlyTimelineChart(canvasId, monthlyData) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Activities',
                    data: monthlyData.map(m => m.activityCount || 0),
                    borderColor: COLORS.primary,
                    backgroundColor: `${COLORS.primary}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Beneficiaries',
                    data: monthlyData.map(m => m.beneficiaryCount || 0),
                    borderColor: COLORS.success,
                    backgroundColor: `${COLORS.success}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Monthly Activity and Beneficiary Trends'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Activities'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Beneficiaries'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Create thematic area distribution chart
 * 
 * @async
 * @param {string} canvasId - Canvas element ID
 * @param {Array<Object>} activities - Array of activity objects
 * @returns {Promise<Object>} Chart.js instance
 */
export async function createThematicAreaChart(canvasId, activities) {
    await loadChartJS();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    destroyChart(canvasId);
    
    // Count activities by thematic area
    const thematicCounts = {};
    activities.forEach(activity => {
        const thematic = activity.thematicArea || 'Unspecified';
        thematicCounts[thematic] = (thematicCounts[thematic] || 0) + 1;
    });
    
    const labels = Object.keys(thematicCounts);
    const data = Object.values(thematicCounts);
    
    const chart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColorPalette(labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Activities by Thematic Area'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = data.reduce((sum, val) => sum + val, 0);
                            const percentage = calculatePercentage(value, total);
                            return `${label}: ${value} activities (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    activeCharts.set(canvasId, chart);
    return chart;
}

/**
 * Destroy all active charts (useful for page cleanup)
 */
export function destroyAllCharts() {
    activeCharts.forEach(chart => chart.destroy());
    activeCharts.clear();
}

/**
 * Update chart data dynamically (without recreating)
 * 
 * @param {string} canvasId - Canvas element ID
 * @param {Object} newData - New chart data
 * @returns {boolean} Success status
 */
export function updateChartData(canvasId, newData) {
    const chart = activeCharts.get(canvasId);
    if (!chart) return false;
    
    chart.data = newData;
    chart.update();
    return true;
}
