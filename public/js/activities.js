/**
 * Activities Module (ATT - Activity Tracking Table)
 * 
 * Displays activities with beneficiary disaggregation, nationality breakdown, and financial tracking.
 * Shows detailed gender/age disaggregation for refugee and host communities.
 * Tracks approval status and budget burn rate for each activity.
 * 
 * @module activities
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
    createEmptyState,
    createStatusBadge,
    createBurnRateIndicator,
    createDisaggregationTable
} from './components.js';
import { formatCurrency, formatNumber, formatDate } from './utils.js';
import { exportActivitiesWithNotification } from './exportUtils.js';
import { createAgeDisaggregationChart, createNationalityChart, createThematicAreaChart } from './charts.js';
import { showCreateActivityModal, showEditActivityModal, showViewActivityModal } from './activityForms.js';

/**
 * Render activities page (ATT - Activity Tracking Table)
 * Displays activities with full disaggregation data and approval workflow
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @param {Object} filters - Optional filters { reporting_month: 'YYYY-MM' }
 * @returns {Promise<void>}
 * 
 * @example
 * await renderActivities(document.getElementById('content-area'));
 * await renderActivities(document.getElementById('content-area'), { reporting_month: '2024-01' });
 */
export async function renderActivities(contentArea, filters = {}) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading activities...');

        // Build query parameters
        const queryParams = new URLSearchParams({ limit: '1000' });
        if (filters.reporting_month) {
            queryParams.set('reporting_month', filters.reporting_month);
        }

        // Fetch data in parallel - get all records
        const [activitiesRes, projectsRes, indicatorsRes] = await Promise.all([
            apiService.get(`/activities?${queryParams.toString()}`),
            apiService.get('/projects?limit=1000'),
            apiService.get('/indicators?limit=1000')
        ]);

        // Transform data
        const activities = transformActivities(activitiesRes.data?.activities || activitiesRes.data || []);
        
        // Store activities for export
        window.currentActivitiesData = activities;
        const projects = projectsRes.data?.projects || projectsRes.data || [];
        const indicators = indicatorsRes.data?.indicators || indicatorsRes.data || [];

        // Calculate summary metrics
        const totalActivities = activities.length;
        const completedActivities = activities.filter(a => a.status === 'Completed').length;
        const reportedActivities = activities.filter(a => a.reportingMonth).length;
        const approvedActivities = activities.filter(a => a.approvalStatus === 'Approved').length;
        const totalBeneficiaries = activities.reduce((sum, a) => sum + (a.totalBeneficiaries || 0), 0);
        const totalBudget = activities.reduce((sum, a) => sum + (a.budget || 0), 0);
        const totalExpenditure = activities.reduce((sum, a) => sum + (a.expenditure || 0), 0);
        const avgBurnRate = totalBudget > 0 ? ((totalExpenditure / totalBudget) * 100).toFixed(1) : 0;

        // Create header
        const header = createPageHeader({
            title: 'Activity Tracking Table (ATT)',
            subtitle: 'Track implementation, beneficiaries, and budget utilization',
            icon: 'calendar-check',
            actions: [
                {
                    label: 'New Activity',
                    icon: 'plus-circle',
                    variant: 'primary',
                    onClick: 'window.createActivity()'
                },
                {
                    label: 'Export',
                    icon: 'download',
                    variant: 'outline-secondary',
                    onClick: 'window.exportActivities()'
                }
            ]
        });

        // Generate reporting month options (current month + last 12 months)
        const generateMonthOptions = () => {
            const months = [];
            const now = new Date();
            for (let i = 0; i < 13; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                months.push({ value, label });
            }
            return months;
        };

        const monthOptions = generateMonthOptions();
        const currentFilter = filters.reporting_month || '';
        
        // Create filter section
        const filterSection = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-end">
                        <div class="col-md-4">
                            <label for="filterReportingMonth" class="form-label">Filter by Reporting Month</label>
                            <select class="form-select" id="filterReportingMonth">
                                <option value="">All Months</option>
                                ${monthOptions.map(m => `<option value="${m.value}" ${m.value === currentFilter ? 'selected' : ''}>${m.label}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" id="clearFilterBtn">
                                <i class="bi bi-x-circle"></i> Clear Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const pathwayGuidance = `
            <div class="alert alert-info mb-3">
                <div class="d-flex align-items-start">
                    <i class="bi bi-signpost-2 me-2 mt-1"></i>
                    <div>
                        <strong>Recommended Pathway:</strong> For project-level work, use <strong>Project Dashboard</strong> to add and manage indicators and activities together.
                        ATT remains available for direct activity entry and updates.
                    </div>
                </div>
            </div>
        `;

        // Create summary cards
        const summaryCards = `
            <div class="row mb-4">
                ${createSummaryCard({
                    title: 'Total Activities',
                    value: totalActivities,
                    subtitle: `${completedActivities} completed`,
                    bgColor: 'primary',
                    icon: 'calendar-check'
                })}
                ${createSummaryCard({
                    title: 'Approved',
                    value: approvedActivities,
                    subtitle: `${(approvedActivities/totalActivities*100).toFixed(0)}% approval rate`,
                    bgColor: 'success',
                    icon: 'check-circle'
                })}
                ${createSummaryCard({
                    title: 'Reported',
                    value: reportedActivities,
                    subtitle: `${totalActivities ? ((reportedActivities/totalActivities)*100).toFixed(0) : 0}% with reports`,
                    bgColor: 'warning',
                    icon: 'journal-check'
                })}
                ${createSummaryCard({
                    title: 'Beneficiaries',
                    value: formatNumber(totalBeneficiaries),
                    subtitle: 'Total reached',
                    bgColor: 'info',
                    icon: 'people'
                })}
                ${createSummaryCard({
                    title: 'Burn Rate',
                    value: `${avgBurnRate}%`,
                    subtitle: `${formatCurrency(totalExpenditure)}/${formatCurrency(totalBudget)}`,
                    bgColor: avgBurnRate > 80 ? 'danger' : avgBurnRate > 60 ? 'warning' : 'success',
                    icon: 'speedometer2'
                })}
            </div>
        `;

        // Create activities table
        const activitiesTable = createActivitiesTable(activities, projects, indicators);

        // Create disaggregation summary (first 4 activities)
        const disaggregationSummary = createDisaggregationSummary(activities.slice(0, 4));

        // Create nationality breakdown
        const nationalityBreakdown = createNationalityBreakdown(activities);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${pathwayGuidance}
            ${filterSection}
            ${summaryCards}
            
            <!-- Data Visualizations -->
            <div class="row mb-4">
                <div class="col-md-4">
                    ${createCard({
                        title: 'Age Distribution',
                        subtitle: 'Beneficiaries by Age Group',
                        body: '<canvas id="activities-age-chart" style="height: 300px;"></canvas>'
                    })}
                </div>
                <div class="col-md-4">
                    ${createCard({
                        title: 'Nationality',
                        subtitle: 'Beneficiary Origins',
                        body: '<canvas id="activities-nationality-chart" style="height: 300px;"></canvas>'
                    })}
                </div>
                <div class="col-md-4">
                    ${createCard({
                        title: 'Thematic Areas',
                        subtitle: 'Activity Distribution',
                        body: '<canvas id="activities-thematic-chart" style="height: 300px;"></canvas>'
                    })}
                </div>
            </div>
            
            ${createCard({
                title: 'All Activities',
                subtitle: `Showing ${totalActivities} activity(ies)`,
                body: activitiesTable
            })}
            ${disaggregationSummary ? createCard({
                title: 'Disaggregation Summary',
                subtitle: 'Detailed breakdown by age, gender, and community (first 4 activities)',
                body: disaggregationSummary
            }) : ''}
            ${createCard({
                title: 'Nationality Breakdown',
                subtitle: 'Beneficiaries by nationality',
                body: nationalityBreakdown
            })}
        `;
        
        // Initialize charts after DOM is ready
        setTimeout(async () => {
            try {
                await createAgeDisaggregationChart('activities-age-chart', activities);
                await createNationalityChart('activities-nationality-chart', activities);
                await createThematicAreaChart('activities-thematic-chart', activities);
            } catch (chartError) {
                console.error('Chart initialization error:', chartError);
            }
        }, 100);
        // Attach event listeners to action buttons
        contentArea.querySelectorAll('.view-activity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.activityId;
                window.viewActivity(activityId);
            });
        });

        contentArea.querySelectorAll('.edit-activity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.activityId;
                window.editActivity(activityId);
            });
        });

        contentArea.querySelectorAll('.delete-activity-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const activityId = btn.dataset.activityId;
                const activityName = btn.dataset.activityName;
                
                if (!confirm(`Are you sure you want to delete activity "${activityName}"? This action cannot be undone.`)) {
                    return;
                }
                
                try {
                    await apiService.deleteActivity(activityId);
                    // Remove the row directly from DOM for instant feedback
                    const row = btn.closest('tr');
                    if (row) {
                        row.remove();
                    }
                    alert('Activity deleted successfully');
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Failed to delete activity: ' + error.message);
                }
            });
        });

        // Attach filter event listeners
        const filterDropdown = document.getElementById('filterReportingMonth');
        const clearFilterBtn = document.getElementById('clearFilterBtn');

        if (filterDropdown) {
            filterDropdown.addEventListener('change', () => {
                const selectedMonth = filterDropdown.value;
                if (selectedMonth) {
                    renderActivities(contentArea, { reporting_month: selectedMonth });
                }
            });
        }

        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                if (filterDropdown) {
                    filterDropdown.value = '';
                }
                renderActivities(contentArea);
            });
        }
    } catch (error) {
        console.error('Activities error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load activities',
            () => renderActivities(contentArea)
        );
    }
}

/**
 * Create activities table HTML
 * @param {Array} activities - Array of activities
 * @param {Array} projects - Array of projects
 * @param {Array} indicators - Array of indicators
 * @returns {string} HTML string
 */
function createActivitiesTable(activities, projects, indicators) {
    if (!activities || activities.length === 0) {
        return createEmptyState('No activities found', 'calendar-check');
    }

    // Create lookup maps
    const projectMap = {};
    projects.forEach(p => projectMap[p.id || p.project_id] = p.name || p.project_name);

    const indicatorMap = {};
    indicators.forEach(ind => indicatorMap[ind.id || ind.indicator_id] = ind.code || ind.indicator_code);

    const rows = activities.map(activity => {
        const projectName = projectMap[activity.projectId] || 'N/A';
        const indicatorCode = indicatorMap[activity.indicatorId] || 'N/A';
        const statusBadge = createStatusBadge(activity.status || 'Unknown');
        const approvalBadge = createStatusBadge(activity.approvalStatus || 'Pending');
        const reportBadge = activity.reportingMonth
            ? `<span class="badge bg-warning text-dark">Reported ${activity.reportingMonth}</span>`
            : '<span class="badge bg-secondary">Not Reported</span>';
        const actualCost = activity.actual_cost || activity.expenditure || 0;
        const burnRateIndicator = createBurnRateIndicator(activity.budget || 0, actualCost);

        return `
            <tr>
                <td><small class="text-muted">${activity.activityCode || 'N/A'}</small></td>
                <td>
                    <strong>${activity.title || 'Unnamed Activity'}</strong>
                    ${activity.location ? '<br><small class="text-muted"><i class="bi bi-geo-alt"></i> ' + activity.location + '</small>' : ''}
                </td>
                <td><small>${indicatorCode}</small></td>
                <td><small>${formatDate(activity.date)}</small></td>
                <td>${statusBadge}</td>
                <td>${approvalBadge}</td>
                <td>${reportBadge}</td>
                <td class="text-end">${formatCurrency(activity.budget || 0)}</td>
                <td class="text-end">${formatCurrency(actualCost)}</td>
                <td>${burnRateIndicator}</td>
                <td class="text-center"><strong>${formatNumber(activity.totalBeneficiaries || 0)}</strong></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-activity-btn" data-activity-id="${activity.id}" title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary edit-activity-btn" data-activity-id="${activity.id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-activity-btn" data-activity-id="${activity.id}" data-activity-name="${activity.title}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Code</th>
                        <th>Activity Name</th>
                        <th>Indicator</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Approval</th>
                        <th>Report</th>
                        <th class="text-end">Budget</th>
                        <th class="text-end">Spent</th>
                        <th style="width: 120px;">Burn Rate</th>
                        <th class="text-center">Beneficiaries</th>
                        <th style="width: 100px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Create disaggregation summary for first N activities
 * @param {Array} activities - Array of activities (limited to first N)
 * @returns {string} HTML string
 */
function createDisaggregationSummary(activities) {
    if (!activities || activities.length === 0) {
        return '';
    }

    const cards = activities.map(activity => {
        const disagg = activity.disaggregation || {};
        const totals = {
            refugeeMale: activity.refugeeMaleTotal || 0,
            refugeeFemale: activity.refugeeFemaleTotal || 0,
            refugeeTotal: activity.refugeeTotal || 0,
            hostMale: activity.hostMaleTotal || 0,
            hostFemale: activity.hostFemaleTotal || 0,
            hostTotal: activity.hostTotal || 0,
            grandTotal: activity.totalBeneficiaries || 0
        };

        const disaggTable = createDisaggregationTable(disagg, totals);

        return `
            <div class="col-md-6 mb-3">
                ${createCard({
                    title: activity.title || 'Activity',
                    subtitle: `Code: ${activity.activityCode || 'N/A'} | Total: ${formatNumber(totals.grandTotal)}`,
                    body: disaggTable,
                    headerClass: 'bg-light'
                })}
            </div>
        `;
    }).join('');

    return `<div class="row">${cards}</div>`;
}

/**
 * Create nationality breakdown table
 * @param {Array} activities - Array of activities
 * @returns {string} HTML string
 */
function createNationalityBreakdown(activities) {
    // Aggregate by nationality
    const nationalities = {
        sudanese: activities.reduce((sum, a) => sum + (a.nationalitySudanese || 0), 0),
        congolese: activities.reduce((sum, a) => sum + (a.nationalityCongolese || 0), 0),
        southSudanese: activities.reduce((sum, a) => sum + (a.nationalitySouthSudanese || 0), 0),
        others: activities.reduce((sum, a) => sum + (a.nationalityOthers || 0), 0)
    };

    const total = Object.values(nationalities).reduce((sum, val) => sum + val, 0);

    const rows = [
        { name: 'Sudanese', count: nationalities.sudanese },
        { name: 'Congolese', count: nationalities.congolese },
        { name: 'South Sudanese', count: nationalities.southSudanese },
        { name: 'Others', count: nationalities.others }
    ].map(row => {
        const percentage = total > 0 ? ((row.count / total) * 100).toFixed(1) : 0;
        return `
            <tr>
                <td><strong>${row.name}</strong></td>
                <td class="text-end">${formatNumber(row.count)}</td>
                <td class="text-end">${percentage}%</td>
                <td style="width: 200px;">
                    <div class="progress">
                        <div class="progress-bar bg-info" role="progressbar" 
                             style="width: ${percentage}%" 
                             aria-valuenow="${percentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Nationality</th>
                        <th class="text-end">Beneficiaries</th>
                        <th class="text-end">Percentage</th>
                        <th>Distribution</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="table-secondary">
                        <td><strong>Total</strong></td>
                        <td class="text-end"><strong>${formatNumber(total)}</strong></td>
                        <td class="text-end"><strong>100%</strong></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Window-level functions for button handlers
 */
window.exportActivities = async function() {
    try {
        if (!window.currentActivitiesData || window.currentActivitiesData.length === 0) {
            alert('No activities data to export');
            return;
        }
        await exportActivitiesWithNotification(window.currentActivitiesData);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export activities: ' + error.message);
    }
};

window.viewActivity = function(activityId) {
    showViewActivityModal(activityId);
};

window.editActivity = function(activityId) {
    const contentArea = document.getElementById('content-area');
    showEditActivityModal(activityId, () => {
        if (contentArea) renderActivities(contentArea);
    });
};

window.createActivity = function() {
    const contentArea = document.getElementById('content-area');
    showCreateActivityModal(() => {
        if (contentArea) renderActivities(contentArea);
    });
};
