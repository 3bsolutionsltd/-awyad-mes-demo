/**
 * Indicators Module (ITT - Indicator Tracking Table)
 * 
 * Displays indicators grouped by thematic area with quarterly breakdown and achievement tracking.
 * Shows progress against annual targets with color-coded status indicators.
 * Supports filtering by thematic area and performance status.
 * 
 * @module indicators
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import { transformIndicators } from './dataTransformer.js';
import {
    createPageHeader,
    createSummaryCard,
    createCard,
    createLoadingSpinner,
    createErrorAlert,
    createEmptyState,
    createProgressBar,
    createStatusBadge
} from './components.js';
import { formatNumber, getProgressColorClass } from './utils.js';
import { exportIndicatorsWithNotification } from './exportUtils.js';
import { createIndicatorAchievementChart, createQuarterlyProgressChart } from './charts.js';

/**
 * Render indicators page (ITT - Indicator Tracking Table)
 * Groups indicators by thematic area and shows quarterly achievement breakdown
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {Promise<void>}
 * 
 * @example
 * await renderIndicators(document.getElementById('content-area'));
 */
export async function renderIndicators(contentArea) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading indicators...');

        // Fetch data - get all indicators (no pagination limit)
        const indicatorsRes = await apiService.get('/indicators?limit=1000');

        // Transform data
        const indicators = transformIndicators(indicatorsRes.data?.indicators || indicatorsRes.data || []);
        
        // Store indicators for export
        window.currentIndicatorsData = indicators;
        
        // Extract thematic areas from indicators
        const thematicAreasMap = new Map();
        indicators.forEach(ind => {
            if (ind.thematicAreaId && ind.thematicArea) {
                if (!thematicAreasMap.has(ind.thematicAreaId)) {
                    thematicAreasMap.set(ind.thematicAreaId, {
                        id: ind.thematicAreaId,
                        name: ind.thematicArea
                    });
                }
            }
        });
        const thematicAreas = Array.from(thematicAreasMap.values());

        // Calculate summary metrics
        const totalIndicators = indicators.length;
        const onTrackIndicators = indicators.filter(ind => (ind.percentAchieved || 0) >= 70).length;
        const atRiskIndicators = indicators.filter(ind => {
            const pct = ind.percentAchieved || 0;
            return pct >= 40 && pct < 70;
        }).length;
        const offTrackIndicators = indicators.filter(ind => (ind.percentAchieved || 0) < 40).length;
        const avgAchievement = totalIndicators > 0
            ? (indicators.reduce((sum, ind) => sum + (ind.percentAchieved || 0), 0) / totalIndicators).toFixed(1)
            : 0;

        // Create header
        const header = createPageHeader({
            title: 'Indicator Tracking Table (ITT)',
            subtitle: 'Monitor progress towards strategic results and performance targets',
            icon: 'graph-up',
            actions: [
                {
                    label: 'New Indicator',
                    icon: 'plus-circle',
                    variant: 'primary',
                    onClick: 'window.createIndicator()'
                },
                {
                    label: 'Export',
                    icon: 'download',
                    variant: 'outline-secondary',
                    onClick: 'window.exportIndicators()'
                }
            ]
        });

        // Create summary cards
        const summaryCards = `
            <div class="row mb-4">
                ${createSummaryCard({
                    title: 'Total Indicators',
                    value: totalIndicators,
                    subtitle: 'Being monitored',
                    bgColor: 'primary',
                    icon: 'list-check'
                })}
                ${createSummaryCard({
                    title: 'On Track',
                    value: onTrackIndicators,
                    subtitle: '≥70% achieved',
                    bgColor: 'success',
                    icon: 'check-circle'
                })}
                ${createSummaryCard({
                    title: 'At Risk',
                    value: atRiskIndicators,
                    subtitle: '40-69% achieved',
                    bgColor: 'warning',
                    icon: 'exclamation-triangle'
                })}
                ${createSummaryCard({
                    title: 'Off Track',
                    value: offTrackIndicators,
                    subtitle: '<40% achieved',
                    bgColor: 'danger',
                    icon: 'x-circle'
                })}
            </div>
        `;

        // Group indicators by thematic area
        const indicatorsByArea = groupIndicatorsByThematicArea(indicators, thematicAreas);

        // Create indicators table
        const indicatorsTable = createIndicatorsTable(indicatorsByArea);

        // Create quarterly breakdown
        const quarterlyBreakdown = createQuarterlyBreakdown(indicators);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${summaryCards}
            
            <!-- Data Visualizations -->
            <div class="row mb-4">
                <div class="col-md-6">
                    ${createCard({
                        title: 'Achievement Overview',
                        subtitle: 'Target vs Achieved (Top 10)',
                        body: '<canvas id="indicators-achievement-chart" style="height: 350px;"></canvas>'
                    })}
                </div>
                <div class="col-md-6">
                    ${createCard({
                        title: 'Quarterly Progress',
                        subtitle: 'Cumulative Performance',
                        body: '<canvas id="indicators-quarterly-chart" style="height: 350px;"></canvas>'
                    })}
                </div>
            </div>
            
            ${createCard({
                title: 'Results Framework',
                subtitle: `${totalIndicators} indicator(s) | Avg: ${avgAchievement}% achieved`,
                body: indicatorsTable
            })}
            ${createCard({
                title: 'Quarterly Breakdown',
                subtitle: 'Performance by quarter',
                body: quarterlyBreakdown
            })}
        `;
        
        // Initialize charts after DOM is ready
        setTimeout(async () => {
            try {
                await createIndicatorAchievementChart('indicators-achievement-chart', indicators);
                await createQuarterlyProgressChart('indicators-quarterly-chart', indicators);
            } catch (chartError) {
                console.error('Chart initialization error:', chartError);
            }
        }, 100);

        // Add event listeners for action buttons
        contentArea.querySelectorAll('.view-indicator-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const indicatorId = btn.dataset.indicatorId;
                showViewIndicatorModal(indicatorId);
            });
        });

        contentArea.querySelectorAll('.edit-indicator-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const indicatorId = btn.dataset.indicatorId;
                showEditIndicatorModal(indicatorId, () => {
                    renderIndicators(contentArea);
                });
            });
        });

    } catch (error) {
        console.error('Indicators error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load indicators',
            () => renderIndicators(contentArea)
        );
    }
}

/**
 * Group indicators by thematic area
 * @param {Array} indicators - Array of indicators
 * @param {Array} thematicAreas - Array of thematic areas
 * @returns {Object} Grouped indicators
 */
function groupIndicatorsByThematicArea(indicators, thematicAreas) {
    const grouped = {};

    // Initialize groups
    thematicAreas.forEach(area => {
        const areaId = area.id || area.thematic_area_id;
        const areaName = area.name || area.thematic_area_name;
        grouped[areaId] = {
            name: areaName,
            indicators: []
        };
    });

    // Add "Unknown" group for indicators without thematic area
    grouped['unknown'] = {
        name: 'Other Indicators',
        indicators: []
    };

    // Group indicators
    indicators.forEach(indicator => {
        const areaId = indicator.thematicAreaId || 'unknown';
        if (grouped[areaId]) {
            grouped[areaId].indicators.push(indicator);
        } else {
            grouped['unknown'].indicators.push(indicator);
        }
    });

    return grouped;
}

/**
 * Create indicators table HTML
 * @param {Object} indicatorsByArea - Indicators grouped by thematic area
 * @returns {string} HTML string
 */
function createIndicatorsTable(indicatorsByArea) {
    if (Object.keys(indicatorsByArea).length === 0) {
        return createEmptyState('No indicators found', 'graph-up');
    }

    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th rowspan="2">Code</th>
                        <th rowspan="2">Indicator Name</th>
                        <th rowspan="2">Type</th>
                        <th rowspan="2">Baseline</th>
                        <th colspan="5" class="text-center">Targets</th>
                        <th rowspan="2">Achieved</th>
                        <th rowspan="2">Variance</th>
                        <th rowspan="2" style="width: 120px;">Progress</th>
                        <th rowspan="2" style="width: 140px;">Actions</th>
                    </tr>
                    <tr>
                        <th class="text-center">LOP</th>
                        <th class="text-center">Annual</th>
                        <th class="text-center">Q1</th>
                        <th class="text-center">Q2</th>
                        <th class="text-center">Q3</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add rows for each thematic area
    Object.keys(indicatorsByArea).forEach(areaId => {
        const area = indicatorsByArea[areaId];
        
        if (area.indicators.length === 0 && areaId !== 'unknown') {
            return; // Skip empty areas except "unknown"
        }

        if (area.indicators.length > 0) {
            // Thematic area header row
            tableHTML += `
                <tr class="table-secondary">
                    <td colspan="14"><strong><i class="bi bi-folder"></i> ${area.name}</strong></td>
                </tr>
            `;

            // Indicator rows
            area.indicators.forEach(indicator => {
                const percentAchieved = indicator.percentAchieved || 0;
                const progressClass = getProgressColorClass(percentAchieved);
                const progressBar = createProgressBar(percentAchieved, true);

                tableHTML += `
                    <tr>
                        <td><small class="text-muted">${indicator.code || 'N/A'}</small></td>
                        <td><strong>${indicator.name || 'Unnamed Indicator'}</strong></td>
                        <td><span class="badge bg-info">${indicator.type || 'N/A'}</span></td>
                        <td class="text-end">${formatNumber(indicator.baseline || 0)}</td>
                        <td class="text-end">${formatNumber(indicator.targetLOP || 0)}</td>
                        <td class="text-end">${formatNumber(indicator.targetAnnual || 0)}</td>
                        <td class="text-end">${formatNumber(indicator.targetQ1 || 0)}</td>
                        <td class="text-end">${formatNumber(indicator.targetQ2 || 0)}</td>
                        <td class="text-end">${formatNumber(indicator.targetQ3 || 0)}</td>
                        <td class="text-end"><strong>${formatNumber(indicator.achieved || 0)}</strong></td>
                        <td class="text-end ${indicator.variance >= 0 ? 'text-success' : 'text-danger'}">
                            ${indicator.variance >= 0 ? '+' : ''}${formatNumber(indicator.variance || 0)}
                        </td>
                        <td>${progressBar}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-indicator-btn" data-indicator-id="${indicator.id}" title="View">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary edit-indicator-btn" data-indicator-id="${indicator.id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    return tableHTML;
}

/**
 * Create quarterly breakdown section
 * @param {Array} indicators - Array of indicators
 * @returns {string} HTML string
 */
function createQuarterlyBreakdown(indicators) {
    // Since we don't have quarterly targets yet, show annual progress distributed across quarters
    // This gives a realistic view of expected progress vs actual
    
    const totalAnnualTarget = indicators.reduce((sum, ind) => sum + (ind.annualTarget || ind.lopTarget || 0), 0);
    const totalAchieved = indicators.reduce((sum, ind) => sum + (ind.achieved || 0), 0);
    
    // Distribute annual target evenly across quarters (25% each)
    const quarterTarget = Math.round(totalAnnualTarget / 4);
    
    // For now, show cumulative achievement distributed proportionally
    // In future, this can be replaced with actual quarterly data entry
    const quarters = [
        { name: 'Q1', target: quarterTarget, achieved: Math.round(totalAchieved * 0.20) }, // 20% typically in Q1
        { name: 'Q2', target: quarterTarget, achieved: Math.round(totalAchieved * 0.25) }, // 25% in Q2
        { name: 'Q3', target: quarterTarget, achieved: Math.round(totalAchieved * 0.30) }, // 30% in Q3
        { name: 'Q4', target: quarterTarget, achieved: Math.round(totalAchieved * 0.25) }  // 25% in Q4
    ];

    const cards = quarters.map(data => {
        const percentAchieved = data.target > 0 ? ((data.achieved / data.target) * 100).toFixed(1) : 0;
        
        return `
            <div class="col-md-3">
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">${data.name}</h6>
                        <p class="mb-1">
                            <small class="text-muted">Target:</small>
                            <strong>${formatNumber(data.target)}</strong>
                        </p>
                        <p class="mb-2">
                            <small class="text-muted">Achieved:</small>
                            <strong>${formatNumber(data.achieved)}</strong>
                        </p>
                        ${createProgressBar(percentAchieved, true)}
                        <small class="text-muted">${percentAchieved}% achieved</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="alert alert-info mb-2">
            <i class="bi bi-info-circle"></i> <strong>Note:</strong> Quarterly breakdown is estimated based on total achievement. 
            Enable monthly tracking to capture actual quarterly data.
        </div>
        <div class="row">${cards}</div>
    `;
}

import { showCreateIndicatorModal, showEditIndicatorModal, showViewIndicatorModal } from './indicatorForms.js';

/**
 * Window-level functions for button handlers
 */
window.createIndicator = function() {
    showCreateIndicatorModal(() => {
        const contentArea = document.getElementById('content-area');
        if (contentArea) renderIndicators(contentArea);
    });
};

window.exportIndicators = async function() {
    try {
        if (!window.currentIndicatorsData || window.currentIndicatorsData.length === 0) {
            alert('No indicators data to export');
            return;
        }
        await exportIndicatorsWithNotification(window.currentIndicatorsData);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export indicators: ' + error.message);
    }
};
