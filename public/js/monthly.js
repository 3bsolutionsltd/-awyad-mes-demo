/**
 * Monthly Tracking Module
 * 
 * Displays calendar view, quarterly summaries, and monthly activity breakdown.
 * Provides month-by-month analysis of activities, beneficiaries, and budget execution.
 * Includes interactive calendar navigation and quarterly rollups.
 * 
 * @module monthly
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import { transformActivities } from './dataTransformer.js';
import {
    createPageHeader,
    createSummaryCard,
    createCard,
    createLoadingSpinner,
    createErrorAlert,
    createEmptyState
} from './components.js';
import { formatCurrency, formatNumber } from './utils.js';
import { exportMonthlyTrackingWithNotification } from './exportUtils.js';
import { createMonthlyTimelineChart } from './charts.js';

/**
 * Render monthly tracking page with calendar and quarterly summaries
 * Groups activities by month and quarter for time-series analysis
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {Promise<void>}
 * 
 * @example
 * await renderMonthlyTracking(document.getElementById('content-area'));
 */
export async function renderMonthlyTracking(contentArea) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading monthly data...');

        // Fetch activities
        const activitiesRes = await apiService.get('/activities?limit=1000');
        const activities = transformActivities(activitiesRes.data?.activities || activitiesRes.data || []);
        
        // Get current date
        const today = new Date();
        const currentMonth = today.getMonth(); // 0-11
        let currentYear = window.currentMonthlyYear || today.getFullYear();
        
        // Store activities for export
        window.currentMonthlyData = { activities, year: currentYear };

        // Group activities by month
        const activitiesByMonth = groupActivitiesByMonth(activities, currentYear);

        // Calculate summary metrics
        const ytdActivities = activities.filter(a => {
            const date = a.date || a.plannedDate || a.planned_date;
            if (!date) return false;
            const actDate = new Date(date);
            return actDate.getFullYear() === currentYear;
        }).length;

        const ytdBeneficiaries = activities
            .filter(a => {
                const date = a.date || a.plannedDate || a.planned_date;
                return date && new Date(date).getFullYear() === currentYear;
            })
            .reduce((sum, a) => sum + (a.totalBeneficiaries || 0), 0);

        const ytdBudget = activities
            .filter(a => {
                const date = a.date || a.plannedDate || a.planned_date;
                return date && new Date(date).getFullYear() === currentYear;
            })
            .reduce((sum, a) => sum + (a.budget || 0), 0);

        const currentMonthActivities = activitiesByMonth[currentMonth]?.length || 0;

        // Extract unique years from activities dynamically
        const activityYears = [...new Set(
            activities
                .map(activity => {
                    const date = activity.date || activity.plannedDate || activity.planned_date;
                    if (!date) return null;
                    const year = new Date(date).getFullYear();
                    return (year >= 2020 && year <= 2030) ? year : null;
                })
                .filter(year => year !== null)
        )].sort((a, b) => a - b);
        
        console.log('📅 Monthly Tracking - Detected years:', activityYears);
        console.log('📊 Total activities:', activities.length);
        
        // Generate year button actions dynamically
        const yearActions = activityYears.map(year => ({
            label: String(year),
            icon: 'calendar',
            variant: currentYear === year ? 'primary' : 'outline-secondary',
            onClick: `window.switchMonthlyYear(${year})`
        }));

        // Create header with dynamic year selector
        const header = createPageHeader({
            title: 'Monthly Activity Tracking',
            subtitle: `Calendar year ${currentYear} overview and monthly breakdown`,
            icon: 'calendar3',
            actions: [
                ...yearActions,
                {
                    label: 'Export',
                    icon: 'download',
                    variant: 'outline-secondary',
                    onClick: 'window.exportMonthly()'
                }
            ]
        });

        // Create summary cards
        const summaryCards = `
            <div class="row mb-4">
                ${createSummaryCard({
                    title: 'Current Month',
                    value: currentMonthActivities,
                    subtitle: getMonthName(currentMonth) + ' ' + currentYear,
                    bgColor: 'primary',
                    icon: 'calendar-day'
                })}
                ${createSummaryCard({
                    title: 'YTD Activities',
                    value: ytdActivities,
                    subtitle: 'Year to date',
                    bgColor: 'success',
                    icon: 'calendar-check'
                })}
                ${createSummaryCard({
                    title: 'YTD Beneficiaries',
                    value: formatNumber(ytdBeneficiaries),
                    subtitle: 'Total reached',
                    bgColor: 'info',
                    icon: 'people'
                })}
                ${createSummaryCard({
                    title: 'YTD Budget',
                    value: formatCurrency(ytdBudget),
                    subtitle: 'Total allocated',
                    bgColor: 'warning',
                    icon: 'cash-stack'
                })}
            </div>
        `;

        // Create calendar view
        const calendarView = createCalendarView(activitiesByMonth, currentMonth);

        // Create quarterly summary
        const quarterlySummary = createQuarterlySummary(activities, currentYear);

        // Create monthly breakdown (accordion)
        const monthlyBreakdown = createMonthlyBreakdown(activitiesByMonth);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${summaryCards}
            
            <!-- Data Visualization -->
            ${createCard({
                title: 'Monthly Trends',
                subtitle: 'Activities and Beneficiaries Over Time',
                body: '<canvas id="monthly-timeline-chart" style="height: 350px;"></canvas>'
            })}
            
            ${createCard({
                title: 'Calendar View',
                subtitle: 'Activities by month',
                body: calendarView
            })}
            ${createCard({
                title: 'Quarterly Summary',
                subtitle: 'Aggregated metrics by quarter',
                body: quarterlySummary
            })}
            ${createCard({
                title: 'Monthly Breakdown',
                subtitle: 'Detailed view for each month',
                body: monthlyBreakdown
            })}
        `;
        
        // Prepare monthly data for chart
        const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
            const monthActivities = activitiesByMonth[i] || [];
            return {
                activityCount: monthActivities.length,
                beneficiaryCount: monthActivities.reduce((sum, a) => sum + (a.totalBeneficiaries || 0), 0)
            };
        });
        
        // Initialize chart after DOM is ready
        setTimeout(async () => {
            try {
                await createMonthlyTimelineChart('monthly-timeline-chart', monthlyChartData);
            } catch (chartError) {
                console.error('Chart initialization error:', chartError);
            }
        }, 100);

    } catch (error) {
        console.error('Monthly tracking error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load monthly data',
            () => renderMonthlyTracking(contentArea)
        );
    }
}

/**
 * Group activities by month
 * @param {Array} activities - Array of activities
 * @param {number} year - Year to filter by
 * @returns {Object} Activities grouped by month (0-11)
 */
function groupActivitiesByMonth(activities, year) {
    const grouped = {};
    for (let i = 0; i < 12; i++) {
        grouped[i] = [];
    }

    activities.forEach(activity => {
        const date = activity.date || activity.plannedDate || activity.planned_date;
        if (!date) return;
        
        const actDate = new Date(date);
        if (actDate.getFullYear() === year) {
            const month = actDate.getMonth();
            grouped[month].push(activity);
        }
    });

    return grouped;
}

/**
 * Create calendar view HTML
 * @param {Object} activitiesByMonth - Activities grouped by month
 * @param {number} currentMonth - Current month (0-11)
 * @returns {string} HTML string
 */
function createCalendarView(activitiesByMonth, currentMonth) {
    const monthHeaders = [];
    const monthCounts = [];

    for (let i = 0; i < 12; i++) {
        const isCurrentMonth = i === currentMonth;
        const count = activitiesByMonth[i]?.length || 0;
        
        monthHeaders.push(`
            <th class="text-center ${isCurrentMonth ? 'table-primary' : ''}">
                ${getMonthAbbr(i)}
            </th>
        `);

        monthCounts.push(`
            <td class="text-center ${isCurrentMonth ? 'table-primary' : ''}">
                <strong>${count}</strong>
            </td>
        `);
    }

    return `
        <div class="table-responsive">
            <table class="table table-bordered table-sm">
                <thead>
                    <tr>${monthHeaders.join('')}</tr>
                </thead>
                <tbody>
                    <tr>${monthCounts.join('')}</tr>
                </tbody>
            </table>
        </div>
        <small class="text-muted">
            <i class="bi bi-info-circle"></i> 
            Current month highlighted in blue. Numbers represent activity count.
        </small>
    `;
}

/**
 * Create quarterly summary
 * @param {Array} activities - All activities
 * @param {number} year - Year to filter by
 * @returns {string} HTML string
 */
function createQuarterlySummary(activities, year) {
    const quarters = [
        { name: 'Q1', months: [0, 1, 2], activities: 0, beneficiaries: 0, budget: 0 },
        { name: 'Q2', months: [3, 4, 5], activities: 0, beneficiaries: 0, budget: 0 },
        { name: 'Q3', months: [6, 7, 8], activities: 0, beneficiaries: 0, budget: 0 },
        { name: 'Q4', months: [9, 10, 11], activities: 0, beneficiaries: 0, budget: 0 }
    ];

    activities.forEach(activity => {
        const actDate = new Date(activity.date);
        if (actDate.getFullYear() === year) {
            const month = actDate.getMonth();
            const quarter = quarters.find(q => q.months.includes(month));
            if (quarter) {
                quarter.activities++;
                quarter.beneficiaries += activity.totalBeneficiaries || 0;
                quarter.budget += activity.budget || 0;
            }
        }
    });

    const cards = quarters.map(q => `
        <div class="col-md-3">
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="card-title">${q.name}</h6>
                    <p class="mb-1">
                        <small class="text-muted">Activities:</small>
                        <strong>${q.activities}</strong>
                    </p>
                    <p class="mb-1">
                        <small class="text-muted">Beneficiaries:</small>
                        <strong>${formatNumber(q.beneficiaries)}</strong>
                    </p>
                    <p class="mb-0">
                        <small class="text-muted">Budget:</small>
                        <strong>${formatCurrency(q.budget)}</strong>
                    </p>
                </div>
            </div>
        </div>
    `).join('');

    return `<div class="row">${cards}</div>`;
}

/**
 * Create monthly breakdown accordion
 * @param {Object} activitiesByMonth - Activities grouped by month
 * @returns {string} HTML string
 */
function createMonthlyBreakdown(activitiesByMonth) {
    const accordionItems = [];

    for (let i = 0; i < 12; i++) {
        const activities = activitiesByMonth[i] || [];
        const count = activities.length;
        const beneficiaries = activities.reduce((sum, a) => sum + (a.totalBeneficiaries || 0), 0);
        const budget = activities.reduce((sum, a) => sum + (a.budget || 0), 0);

        const activityRows = activities.map(a => `
            <tr>
                <td><small>${a.activityCode || 'N/A'}</small></td>
                <td>${a.title || 'Unnamed'}</td>
                <td>${a.location || 'N/A'}</td>
                <td class="text-center">${formatNumber(a.totalBeneficiaries || 0)}</td>
                <td class="text-end">${formatCurrency(a.budget || 0)}</td>
            </tr>
        `).join('');

        const tableHTML = count > 0 ? `
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Code</th>
                            <th>Activity</th>
                            <th>Location</th>
                            <th class="text-center">Beneficiaries</th>
                            <th class="text-end">Budget</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activityRows}
                    </tbody>
                </table>
            </div>
        ` : '<p class="text-muted">No activities this month</p>';

        accordionItems.push(`
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${i}">
                    <button class="accordion-button ${i !== new Date().getMonth() ? 'collapsed' : ''}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#collapse${i}" 
                            aria-expanded="${i === new Date().getMonth()}" 
                            aria-controls="collapse${i}">
                        <strong>${getMonthName(i)}</strong>
                        <span class="ms-auto me-3">
                            ${count} activities | ${formatNumber(beneficiaries)} beneficiaries | ${formatCurrency(budget)}
                        </span>
                    </button>
                </h2>
                <div id="collapse${i}" 
                     class="accordion-collapse collapse ${i === new Date().getMonth() ? 'show' : ''}" 
                     aria-labelledby="heading${i}">
                    <div class="accordion-body">
                        ${tableHTML}
                    </div>
                </div>
            </div>
        `);
    }

    return `
        <div class="accordion" id="monthlyAccordion">
            ${accordionItems.join('')}
        </div>
    `;
}

/**
 * Get month name
 * @param {number} month - Month index (0-11)
 * @returns {string} Month name
 */
function getMonthName(month) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month] || 'Unknown';
}

/**
 * Get month abbreviation
 * @param {number} month - Month index (0-11)
 * @returns {string} Month abbreviation
 */
function getMonthAbbr(month) {
    const abbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return abbrs[month] || '?';
}

/**
 * Window-level functions for button handlers
 */
window.exportMonthly = async function() {
    try {
        if (!window.currentMonthlyData || !window.currentMonthlyData.activities) {
            alert('No monthly data to export');
            return;
        }
        await exportMonthlyTrackingWithNotification(
            window.currentMonthlyData.activities,
            window.currentMonthlyData.year
        );
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export monthly tracking: ' + error.message);
    }
};
