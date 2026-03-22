/**
 * AWYAD Strategic Dashboard
 * Organizational-wide view showing full strategic hierarchy
 * Strategies → Pillars → Components → Projects
 * 
 * @module dashboards/strategicDashboard
 * @author AWYAD MES Team - Stream 6
 */

import { dashboardService } from '../services/dashboardService.js';
import { createStrategyCard } from '../components/strategyCard.js';


/**
 * Render AWYAD Strategic Dashboard
 * @returns {Promise<string>} HTML string
 */
export async function renderAWYADStrategicDashboard() {
    const container = document.createElement('div');
    container.className = 'container-fluid strategic-dashboard-new';
    
    // Show loading state
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading AWYAD Strategic Framework...</span>
            </div>
        </div>
    `;
    
    try {
        // Fetch all data in parallel
        const [hierarchyResponse, indicatorsResponse, summaryResponse] = await Promise.all([
            dashboardService.getStrategicHierarchy(),
            dashboardService.getAWYADIndicators(),
            dashboardService.getOverallSummary()
        ]);
        
        if (!hierarchyResponse.success || !summaryResponse.success) {
            throw new Error('Failed to load strategic data');
        }
        
        const hierarchy = hierarchyResponse.data || [];
        const indicators = indicatorsResponse.success ? indicatorsResponse.data || [] : [];
        const summary = summaryResponse.data || {};
        
        // Render complete dashboard
        container.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2 class="mb-3">
                        <i class="bi bi-diagram-3 text-primary"></i>
                        AWYAD Strategic Dashboard
                    </h2>
                    <p class="text-muted">
                        Organizational view of strategic framework, core program components, and AWYAD-level indicators
                    </p>
                </div>
            </div>
            
            ${renderSummaryCards(summary)}
            ${renderStrategicHierarchy(hierarchy)}
            ${renderAWYADIndicators(indicators)}
        `;
        
        // Initialize interactive components after DOM update
        setTimeout(() => {
            attachEventListeners();
        }, 100);
        
    } catch (error) {
        console.error('Error loading strategic dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-exclamation-triangle"></i> Error Loading Dashboard</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
    }
    
    return container.outerHTML;
}

/**
 * Render summary statistics cards
 * @private
 */
function renderSummaryCards(summary) {
    return `
        <div class="row mb-4 summary-cards">
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-primary">
                    <div class="card-body">
                        <i class="bi bi-bullseye fs-1 text-primary"></i>
                        <h3 class="mt-2 mb-0">${summary.total_strategies || 0}</h3>
                        <p class="text-muted small mb-0">Strategies</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-info">
                    <div class="card-body">
                        <i class="bi bi-diagram-3 fs-1 text-info"></i>
                        <h3 class="mt-2 mb-0">${summary.total_pillars || 0}</h3>
                        <p class="text-muted small mb-0">Pillars</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-success">
                    <div class="card-body">
                        <i class="bi bi-boxes fs-1 text-success"></i>
                        <h3 class="mt-2 mb-0">${summary.total_components || 0}</h3>
                        <p class="text-muted small mb-0">Components</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-warning">
                    <div class="card-body">
                        <i class="bi bi-folder fs-1 text-warning"></i>
                        <h3 class="mt-2 mb-0">${summary.total_projects || 0}</h3>
                        <p class="text-muted small mb-0">Projects</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-secondary">
                    <div class="card-body">
                        <i class="bi bi-currency-dollar fs-1 text-secondary"></i>
                        <h3 class="mt-2 mb-0">${formatCurrency(summary.total_budget || 0)}</h3>
                        <p class="text-muted small mb-0">Total Budget</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2 col-sm-4 col-6 mb-3">
                <div class="card text-center h-100 border-danger">
                    <div class="card-body">
                        <i class="bi bi-people fs-1 text-danger"></i>
                        <h3 class="mt-2 mb-0">${formatNumber(summary.total_beneficiaries || 0)}</h3>
                        <p class="text-muted small mb-0">Beneficiaries</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render strategic hierarchy
 * @private
 */
function renderStrategicHierarchy(hierarchy) {
    if (!hierarchy || hierarchy.length === 0) {
        return `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                No strategic framework data available. Please contact system administrator.
            </div>
        `;
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4 class="mb-3">
                    <i class="bi bi-diagram-2"></i> Strategic Hierarchy
                </h4>
                <div class="hierarchy-container">
                    ${hierarchy.map(strategy => createStrategyCard(strategy, false)).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render AWYAD indicators section
 * @private
 */
function renderAWYADIndicators(indicators) {
    if (!indicators || indicators.length === 0) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <h4 class="mb-3">
                        <i class="bi bi-graph-up"></i> AWYAD Indicators
                    </h4>
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        No AWYAD indicators configured yet. These will be aggregated from project indicators.
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4 class="mb-3">
                    <i class="bi bi-graph-up"></i> AWYAD Indicators
                    <span class="badge bg-primary ms-2">AWYAD Scope</span>
                </h4>
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Indicator</th>
                                        <th>Target</th>
                                        <th>Achieved</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                        <th>Components</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${indicators.map(indicator => `
                                        <tr>
                                            <td>
                                                <strong>${escapeHtml(indicator.name)}</strong>
                                                ${indicator.description ? `
                                                    <br><small class="text-muted">${escapeHtml(indicator.description)}</small>
                                                ` : ''}
                                            </td>
                                            <td>${formatNumber(indicator.target || 0)}</td>
                                            <td>${formatNumber(indicator.achieved || 0)}</td>
                                            <td style="min-width: 200px;">
                                                ${renderProgressBar(indicator.achieved || 0, indicator.target || 0)}
                                            </td>
                                            <td>${renderStatusBadge(indicator.achieved || 0, indicator.target || 0)}</td>
                                            <td>
                                                <span class="badge bg-secondary">
                                                    ${indicator.component_count || 0} Components
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render progress bar
 * @private
 */
function renderProgressBar(achieved, target) {
    if (!target) return '<span class="text-muted">N/A</span>';
    
    const percentage = Math.min(Math.round((achieved / target) * 100), 100);
    const colorClass = percentage >= 100 ? 'bg-success' : percentage >= 75 ? 'bg-primary' : percentage >= 50 ? 'bg-warning' : 'bg-danger';
    
    return `
        <div class="progress" style="height: 25px;">
            <div class="progress-bar ${colorClass}" role="progressbar" 
                 style="width: ${percentage}%" 
                 aria-valuenow="${percentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
                ${percentage}%
            </div>
        </div>
    `;
}

/**
 * Render status badge
 * @private
 */
function renderStatusBadge(achieved, target) {
    if (!target) return '<span class="badge bg-secondary">N/A</span>';
    
    const percentage = (achieved / target) * 100;
    
    if (percentage >= 100) {
        return '<span class="badge bg-success">Achieved</span>';
    } else if (percentage >= 75) {
        return '<span class="badge bg-primary">On Track</span>';
    } else if (percentage >= 50) {
        return '<span class="badge bg-warning">At Risk</span>';
    } else {
        return '<span class="badge bg-danger">Behind</span>';
    }
}

/**
 * Attach event listeners
 * @private
 */
function attachEventListeners() {
    // Add any additional event listeners here
    console.log('Strategic dashboard event listeners attached');
}

/**
 * Format currency
 * @private
 */
function formatCurrency(amount) {
    if (!amount) return '$0';
    
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
    }
    
    return `$${amount.toFixed(0)}`;
}

/**
 * Format number
 * @private
 */
function formatNumber(num) {
    if (!num) return '0';
    
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    
    return num.toLocaleString();
}

/**
 * Escape HTML
 * @private
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
