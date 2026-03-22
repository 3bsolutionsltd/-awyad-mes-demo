/**
 * Dashboard Module
 * 
 * Renders the main dashboard with KPIs, thematic area overview, and indicator summary.
 * Fetches data from multiple endpoints in parallel for fast loading.
 * Calculates real-time metrics and renders interactive visualizations.
 * 
 * @module dashboard
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import { transformProjects, transformIndicators, transformActivities, transformCases } from './dataTransformer.js';
import { createSummaryCard, createProgressBar, createCard, createLoadingSpinner, createErrorAlert, createPageHeader } from './components.js';
import { formatCurrency, formatNumber } from './utils.js';
import { exportDashboardWithNotification } from './exportUtils.js';
import { createIndicatorAchievementChart, createBeneficiaryDisaggregationChart, createGenderDisaggregationChart } from './charts.js';

/**
 * Render the dashboard view with summary cards and data tables
 * Fetches all entity data in parallel and calculates dashboard metrics
 * 
 * @param {HTMLElement} contentArea - DOM element to render dashboard into
 * @returns {Promise<void>}
 * 
 * @example
 * await renderDashboard(document.getElementById('content-area'));
 */
export async function renderDashboard(contentArea) {
    try {
        // Show loading
        contentArea.innerHTML = createLoadingSpinner('Loading dashboard...');
        
        // Fetch all dashboard data in parallel - get all records
        const [projRes, indRes, actRes, casesRes] = await Promise.all([
            apiService.get('/projects?limit=1000'),
            apiService.get('/indicators?limit=1000'),
            apiService.get('/activities?limit=1000'),
            apiService.get('/cases?limit=1000')
        ]);

        // Transform data
        const projects = transformProjects(projRes.data?.projects || projRes.data || []);
        const indicators = transformIndicators(indRes.data?.indicators || indRes.data || []);
        const activities = transformActivities(actRes.data?.activities || actRes.data || []);
        const cases = transformCases(casesRes.data?.cases || casesRes.data || []);
        
        // Store data for export
        dashboardData = { projects, indicators, activities, cases };
        
        // Extract unique thematic areas from indicators
        const thematicAreasSet = new Map();
        indicators.forEach(ind => {
            if (ind.thematicAreaId && ind.thematicArea) {
                if (!thematicAreasSet.has(ind.thematicAreaId)) {
                    thematicAreasSet.set(ind.thematicAreaId, {
                        id: ind.thematicAreaId,
                        name: ind.thematicArea
                    });
                }
            }
        });
        const thematicAreas = Array.from(thematicAreasSet.values());

        // Calculate metrics
        const dashCurrentMonth = new Date().getMonth();
        const dashCurrentYear = new Date().getFullYear();
        
        const indicatorsOnTrack = indicators.filter(ind => ind.percentAchieved >= 70).length;
        
        const activitiesThisMonth = activities.filter(act => {
            const date = act.date || act.plannedDate || act.planned_date;
            if (!date) return false;
            const actDate = new Date(date);
            return actDate.getMonth() === dashCurrentMonth && actDate.getFullYear() === dashCurrentYear;
        }).length;

        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalExpenditure = projects.reduce((sum, p) => sum + (p.expenditure || 0), 0);
        const avgBurnRate = totalBudget > 0 ? (totalExpenditure / totalBudget) * 100 : 0;

        // Group indicators by thematic area
        const thematicAreasMap = {};
        thematicAreas.forEach(ta => {
            thematicAreasMap[ta.id] = {
                ...ta,
                indicators: [],
                projects: projects.filter(p => p.thematicAreaId === ta.id)
            };
        });
        
        indicators.forEach(ind => {
            if (thematicAreasMap[ind.thematicAreaId]) {
                thematicAreasMap[ind.thematicAreaId].indicators.push(ind);
            }
        });

        // Render dashboard
        contentArea.innerHTML = `
            <div class="container-fluid">
                ${createPageHeader({
                    title: 'AWYAD M&E Dashboard',
                    icon: 'speedometer2',
                    subtitle: 'Real-time monitoring and evaluation overview',
                    actions: [
                        { label: 'Export Report', icon: 'file-earmark-excel', variant: 'success', onClick: 'window.exportDashboardData()' }
                    ]
                })}

                <!-- Summary Cards -->
                <div class="row mb-4">
                    ${createSummaryCard({
                        title: 'Active Projects',
                        value: projects.length,
                        subtitle: `of ${projects.length} total`,
                        bgColor: 'primary',
                        icon: 'folder'
                    })}
                    ${createSummaryCard({
                        title: 'Indicators On-Track',
                        value: indicatorsOnTrack,
                        subtitle: `of ${indicators.length} total`,
                        bgColor: 'success',
                        icon: 'graph-up'
                    })}
                    ${createSummaryCard({
                        title: 'Activities This Month',
                        value: activitiesThisMonth,
                        subtitle: `Total: ${activities.length}`,
                        bgColor: 'info',
                        icon: 'calendar-check'
                    })}
                    ${createSummaryCard({
                        title: 'Budget Burn Rate',
                        value: `${avgBurnRate.toFixed(1)}%`,
                        subtitle: `${formatCurrency(totalExpenditure)} / ${formatCurrency(totalBudget)}`,
                        bgColor: 'warning',
                        icon: 'cash-stack'
                    })}
                </div>

                <!-- Data Visualizations -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        ${createCard({
                            title: 'Indicator Performance',
                            subtitle: 'Target vs Achievement',
                            body: '<canvas id="dashboard-indicator-chart" style="height: 300px;"></canvas>'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Beneficiaries',
                            subtitle: 'Community Type',
                            body: '<canvas id="dashboard-beneficiary-chart" style="height: 300px;"></canvas>'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Gender',
                            subtitle: 'Distribution',
                            body: '<canvas id="dashboard-gender-chart" style="height: 300px;"></canvas>'
                        })}
                    </div>
                </div>

                <!-- Thematic Areas Overview -->
                ${createCard({
                    title: 'Thematic Areas Overview',
                    subtitle: 'Progress by strategic result area',
                    headerClass: 'bg-primary text-white',
                    body: renderThematicAreas(thematicAreasMap)
                })}

                <!-- Results Framework Summary -->
                ${createCard({
                    title: 'Results Framework Summary',
                    subtitle: 'All indicators with current achievement',
                    headerClass: 'bg-light',
                    body: renderIndicatorsTable(indicators)
                })}
            </div>
        `;
        
        // Initialize charts after DOM is ready
        setTimeout(async () => {
            try {
                await createIndicatorAchievementChart('dashboard-indicator-chart', indicators);
                await createBeneficiaryDisaggregationChart('dashboard-beneficiary-chart', activities);
                await createGenderDisaggregationChart('dashboard-gender-chart', activities);
            } catch (chartError) {
                console.error('Chart initialization error:', chartError);
            }
        }, 100);

    } catch (error) {
        console.error('Dashboard rendering error:', error);
        contentArea.innerHTML = createErrorAlert(
            `Failed to load dashboard: ${error.message}`,
            'renderDashboard(document.getElementById("content-area"))'
        );
    }
}

/**
 * Render thematic areas section with progress bars
 * Shows project count and indicator on-track percentage for each area
 * 
 * @private
 * @param {Object} thematicAreasMap - Map of thematic area IDs to area data with indicators
 * @returns {string} HTML for thematic areas section
 */
function renderThematicAreas(thematicAreasMap) {
    const areas = Object.values(thematicAreasMap);
    
    if (areas.length === 0) {
        return '<p class="text-muted">No thematic areas defined</p>';
    }

    return areas.map(area => {
        const totalIndicators = area.indicators.length;
        const onTrackIndicators = area.indicators.filter(ind => ind.percentAchieved >= 70).length;
        const progress = totalIndicators > 0 ? (onTrackIndicators / totalIndicators) * 100 : 0;

        return `
            <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${area.name || 'Unnamed Area'}</h6>
                    <span class="badge bg-secondary">${area.projects.length} Projects</span>
                </div>
                ${createProgressBar(progress, true)}
                <small class="text-muted">
                    ${onTrackIndicators} of ${totalIndicators} indicators on track
                </small>
            </div>
        `;
    }).join('');
}

/**
 * Render indicators summary table with achievement progress
 * Displays all indicators with targets, achieved values, and progress bars
 * 
 * @private
 * @param {Array<Object>} indicators - Array of transformed indicator objects
 * @returns {string} HTML table of indicators with progress visualization
 */
function renderIndicatorsTable(indicators) {
    if (indicators.length === 0) {
        return '<p class="text-muted">No indicators defined</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Code</th>
                        <th>Indicator</th>
                        <th>Type</th>
                        <th>Annual Target</th>
                        <th>Achieved</th>
                        <th>% Achieved</th>
                        <th>Progress</th>
                    </tr>
                </thead>
                <tbody>
                    ${indicators.map(ind => `
                        <tr>
                            <td><span class="badge bg-secondary">${ind.code}</span></td>
                            <td>${ind.name}</td>
                            <td><span class="badge bg-info">${ind.type}</span></td>
                            <td>${formatNumber(ind.annualTarget)}</td>
                            <td><strong>${formatNumber(ind.achieved)}</strong></td>
                            <td>${ind.percentAchieved.toFixed(1)}%</td>
                            <td style="min-width: 150px;">
                                ${createProgressBar(ind.percentAchieved, false)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Store data globally for export
let dashboardData = { projects: [], indicators: [], activities: [], cases: [] };

// Export function for dashboard report
window.exportDashboardData = async function() {
    try {
        await exportDashboardWithNotification(
            dashboardData.projects,
            dashboardData.indicators,
            dashboardData.activities,
            dashboardData.cases
        );
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export dashboard data: ' + error.message);
    }
};
