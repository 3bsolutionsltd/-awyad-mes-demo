/**
 * Financial Dashboard - Multi-currency financial overview
 * 
 * Features:
 * - Project financial cards with transfers
 * - Multi-currency display
 * - Budget transfer summary
 * - Burn rate visualization
 * - Currency toggle
 */

import { formatCurrency, calculateBurnRate, getBurnRateColor, formatLargeNumber } from '../utils/currencyUtils.js';
import apiService from '../apiService.js';

/**
 * Render project financial card
 * @param {UUID} projectId - Project ID
 * @param {string} displayCurrency - Currency to display (default: UGX)
 * @returns {Promise<string>} HTML for financial card
 */
export async function renderProjectFinancialCard(projectId, displayCurrency = 'UGX') {
    try {
        const response = await apiService.get(`/activities/financial-summary/${projectId}`);
        
        if (!response.success) {
            return '<div class="alert alert-danger">Error loading financial data</div>';
        }

        const summary = response.data;
        const burnRate = calculateBurnRate(summary.expenditure.total, summary.budget.total);

        return `
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${summary.projectName}</h5>
                        <select class="form-select form-select-sm w-auto" id="currency-toggle-${projectId}">
                            <option value="UGX" ${displayCurrency === 'UGX' ? 'selected' : ''}>UGX</option>
                            <option value="USD" ${displayCurrency === 'USD' ? 'selected' : ''}>USD</option>
                            <option value="EUR" ${displayCurrency === 'EUR' ? 'selected' : ''}>EUR</option>
                            <option value="GBP" ${displayCurrency === 'GBP' ? 'selected' : ''}>GBP</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Budget Overview -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6 class="text-muted mb-3">Budget Overview</h6>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Original Budget:</span>
                                <strong>${formatCurrency(summary.budget.original, displayCurrency)}</strong>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between text-success">
                                <span>Transfers In:</span>
                                <strong>+${formatCurrency(summary.budget.transfersIn, displayCurrency)}</strong>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between text-danger">
                                <span>Transfers Out:</span>
                                <strong>-${formatCurrency(summary.budget.transfersOut, displayCurrency)}</strong>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Net Transfers:</span>
                                <strong class="${summary.budget.netTransfers >= 0 ? 'text-success' : 'text-danger'}">
                                    ${summary.budget.netTransfers >= 0 ? '+' : ''}${formatCurrency(summary.budget.netTransfers, displayCurrency)}
                                </strong>
                            </div>
                        </div>
                        <div class="col-12">
                            <hr>
                            <div class="d-flex justify-content-between">
                                <span class="fw-bold">Total Budget:</span>
                                <strong class="text-primary fs-5">${formatCurrency(summary.budget.total, displayCurrency)}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Expenditure -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <h6 class="text-muted mb-3">Expenditure</h6>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Total Expenditure:</span>
                                <strong>${formatCurrency(summary.expenditure.total, displayCurrency)}</strong>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Available Budget:</span>
                                <strong class="text-success">${formatCurrency(summary.budget.available, displayCurrency)}</strong>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="mb-2">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Burn Rate:</span>
                                    <strong class="${getBurnRateColor(burnRate.percentage)}">${burnRate.percentage}%</strong>
                                </div>
                                <div class="progress" style="height: 20px;">
                                    <div class="progress-bar ${getBurnRateClass(burnRate.percentage)}" 
                                         role="progressbar" 
                                         style="width: ${Math.min(burnRate.percentage, 100)}%"
                                         aria-valuenow="${burnRate.percentage}" 
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                        ${burnRate.percentage}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Activities Summary -->
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6 class="text-muted mb-3">Activities Summary</h6>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-2 border rounded">
                                <div class="fs-4 fw-bold text-primary">${summary.activities.total}</div>
                                <small class="text-muted">Total Activities</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-2 border rounded">
                                <div class="fs-4 fw-bold text-success">${summary.activities.costed}</div>
                                <small class="text-muted">Costed</small>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center p-2 border rounded">
                                <div class="fs-4 fw-bold text-info">${summary.activities.nonCosted}</div>
                                <small class="text-muted">Non-Costed</small>
                            </div>
                        </div>
                    </div>

                    <!-- Transfer Summary -->
                    <div class="row">
                        <div class="col-12">
                            <h6 class="text-muted mb-3">Budget Transfers</h6>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between">
                                <span>Transfers In:</span>
                                <span class="text-success">${summary.transfers.transfersIn.count} (${formatCurrency(summary.transfers.transfersIn.total)})</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex justify-content-between">
                                <span>Transfers Out:</span>
                                <span class="text-danger">${summary.transfers.transfersOut.count} (${formatCurrency(summary.transfers.transfersOut.total)})</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewDetailedFinancials('${projectId}')">
                            <i class="fas fa-chart-line"></i> View Details
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewTransferHistory('${projectId}')">
                            <i class="fas fa-exchange-alt"></i> Transfer History
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering financial card:', error);
        return '<div class="alert alert-danger">Error loading financial data</div>';
    }
}

/**
 * Get burn rate progress bar class
 * @param {number} percentage - Burn rate percentage
 * @returns {string} Bootstrap class
 */
function getBurnRateClass(percentage) {
    if (percentage >= 90) return 'bg-danger';
    if (percentage >= 75) return 'bg-warning';
    if (percentage >= 50) return 'bg-info';
    return 'bg-success';
}

/**
 * Render multi-project financial dashboard
 * @returns {Promise<void>}
 */
export async function renderFinancialDashboard() {
    try {
        // Fetch all projects
        const projectsResponse = await apiService.get('/projects?limit=1000');
        
        if (!projectsResponse.success) {
            document.getElementById('financial-dashboard-container').innerHTML = 
                '<div class="alert alert-danger">Error loading projects</div>';
            return;
        }

        const projects = projectsResponse.data.projects || [];
        
        let dashboardHTML = `
            <div class="container-fluid">
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <h2>Financial Dashboard</h2>
                            <div class="btn-group">
                                <button class="btn btn-primary" onclick="openBudgetTransferModal()">
                                    <i class="fas fa-exchange-alt"></i> New Transfer
                                </button>
                                <button class="btn btn-outline-secondary" onclick="refreshFinancialDashboard()">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Overall Summary Cards -->
                <div class="row mb-4" id="overall-summary">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Budget</h6>
                                <h3 id="total-budget-display">-</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h6 class="card-title">Available Budget</h6>
                                <h3 id="available-budget-display">-</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-dark">
                            <div class="card-body">
                                <h6 class="card-title">Total Expenditure</h6>
                                <h3 id="expenditure-display">-</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <h6 class="card-title">Active Projects</h6>
                                <h3>${projects.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Individual Project Cards -->
                <div class="row" id="project-cards-container">
                    ${projects.length === 0 ? 
                        '<div class="col-12"><div class="alert alert-info">No projects found</div></div>' :
                        '<div class="col-12"><div class="spinner-border text-primary"></div> Loading financial data...</div>'
                    }
                </div>
            </div>
        `;

        const container = document.getElementById('financial-dashboard-container');
        if (container) {
            container.innerHTML = dashboardHTML;
        }

        // Load individual project cards
        if (projects.length > 0) {
            await loadProjectCards(projects);
            await calculateOverallSummary(projects);
        }

    } catch (error) {
        console.error('Error rendering financial dashboard:', error);
        const container = document.getElementById('financial-dashboard-container');
        if (container) {
            container.innerHTML = '<div class="alert alert-danger">Error loading financial dashboard</div>';
        }
    }
}

/**
 * Load individual project financial cards
 */
async function loadProjectCards(projects) {
    const container = document.getElementById('project-cards-container');
    if (!container) return;

    let cardsHTML = '';
    
    for (const project of projects) {
        const cardHTML = await renderProjectFinancialCard(project.id);
        cardsHTML += `<div class="col-md-6 col-lg-4 mb-4">${cardHTML}</div>`;
    }

    container.innerHTML = cardsHTML;

    // Add currency toggle event listeners
    projects.forEach(project => {
        const toggleSelect = document.getElementById(`currency-toggle-${project.id}`);
        if (toggleSelect) {
            toggleSelect.addEventListener('change', async function() {
                const card = this.closest('.card');
                card.innerHTML = '<div class="card-body text-center"><div class="spinner-border text-primary"></div></div>';
                
                const newCard = await renderProjectFinancialCard(project.id, this.value);
                card.outerHTML = newCard;
            });
        }
    });
}

/**
 * Calculate overall summary across all projects
 */
async function calculateOverallSummary(projects) {
    let totalBudget = 0;
    let totalExpenditure = 0;
    let totalAvailable = 0;

    for (const project of projects) {
        try {
            const response = await apiService.get(`/activities/financial-summary/${project.id}`);
            if (response.success) {
                const summary = response.data;
                totalBudget += summary.budget.total;
                totalExpenditure += summary.expenditure.total;
                totalAvailable += summary.budget.available;
            }
        } catch (error) {
            console.error(`Error loading summary for project ${project.id}:`, error);
        }
    }

    document.getElementById('total-budget-display').textContent = formatLargeNumber(totalBudget);
    document.getElementById('available-budget-display').textContent = formatLargeNumber(totalAvailable);
    document.getElementById('expenditure-display').textContent = formatLargeNumber(totalExpenditure);
}

/**
 * Refresh financial dashboard
 */
window.refreshFinancialDashboard = async function() {
    await renderFinancialDashboard();
};

/**
 * View detailed financials for a project
 */
window.viewDetailedFinancials = function(projectId) {
    // Navigate to project detail page or open modal
    window.location.href = `/project-dashboard.html?id=${projectId}`;
};

/**
 * View transfer history for a project
 */
window.viewTransferHistory = async function(projectId) {
    // Import and show transfer history modal
    const { renderTransferHistory } = await import('./budgetTransfer.js');
    
    const historyHTML = await renderTransferHistory(projectId);
    
    // Create modal
    const modalHTML = `
        <div class="modal fade" id="transferHistoryModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Budget Transfer History</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${historyHTML}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if present
    const existingModal = document.getElementById('transferHistoryModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('transferHistoryModal'));
    modal.show();
};

/**
 * Open budget transfer modal
 */
window.openBudgetTransferModal = async function() {
    const { renderBudgetTransferModal } = await import('./budgetTransfer.js');
    await renderBudgetTransferModal();
    
    const modal = new bootstrap.Modal(document.getElementById('budgetTransferModal'));
    modal.show();
};

/**
 * Export financial data to CSV
 * @param {UUID} projectId - Project ID
 */
export async function exportFinancialData(projectId) {
    try {
        const response = await apiService.get(`/activities/financial-summary/${projectId}`);
        
        if (!response.success) {
            throw new Error('Failed to fetch financial data');
        }

        const summary = response.data;
        
        // Create CSV content
        const csvContent = `
Project Financial Summary
Project Name,${summary.projectName}
Currency,${summary.currency}

Budget Overview
Original Budget,${summary.budget.original}
Transfers In,${summary.budget.transfersIn}
Transfers Out,${summary.budget.transfersOut}
Net Transfers,${summary.budget.netTransfers}
Total Budget,${summary.budget.total}
Available Budget,${summary.budget.available}

Expenditure
Total Expenditure,${summary.expenditure.total}
Burn Rate,${summary.expenditure.burnRate}%

Activities
Total Activities,${summary.activities.total}
Costed Activities,${summary.activities.costed}
Non-Costed Activities,${summary.activities.nonCosted}
        `.trim();

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-summary-${summary.projectName}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting financial data:', error);
        alert('Error exporting financial data');
    }
}

export default {
    renderProjectFinancialCard,
    renderFinancialDashboard,
    exportFinancialData
};
