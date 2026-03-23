/**
 * Project-Specific Dashboard
 * Comprehensive view for a single project
 * Sections: Header, Financial, Indicators, Activities, Cases, Team, Monthly Performance
 * 
 * @module dashboards/projectDashboard
 * @author AWYAD MES Team - Stream 6
 */

import { dashboardService } from '../services/dashboardService.js';

import { showEditProjectModal } from '../projectForms.js';
import { showCreateProjectIndicatorModal, showEditIndicatorModal } from '../indicatorForms.js';

/**
 * Render Project Dashboard
 * @param {string} projectId - Project UUID
 * @returns {Promise<string>} HTML string
 */
export async function renderProjectDashboardNew(projectId) {
    const container = document.createElement('div');
    container.className = 'container-fluid project-dashboard-new';
    
    // If no project selected, show selector
    if (!projectId) {
        container.innerHTML = `
            <div class="alert alert-info text-center" style="margin-top: 40px;">
                <i class="bi bi-info-circle fs-1"></i>
                <h4 class="mt-3">Select a Project</h4>
                <p>Please select a project from the dropdown above to view its dashboard.</p>
            </div>
        `;
        
        return container.outerHTML;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading project dashboard...</span>
            </div>
        </div>
    `;
    
    try {
        // Fetch all project data in parallel
        const [
            detailsResponse,
            financialsResponse,
            indicatorsResponse,
            activitiesResponse,
            casesResponse,
            teamResponse,
            performanceResponse
        ] = await Promise.all([
            dashboardService.getProjectDetails(projectId),
            dashboardService.getProjectFinancials(projectId),
            dashboardService.getProjectIndicators(projectId),
            dashboardService.getProjectActivities(projectId),
            dashboardService.getProjectCases(projectId),
            dashboardService.getProjectTeam(projectId),
            dashboardService.getProjectPerformance(projectId)
        ]);
        
        if (!detailsResponse.success) {
            throw new Error('Failed to load project details');
        }
        
        const project = detailsResponse.data;
        const financials = financialsResponse.success ? financialsResponse.data : null;
        const indicators = indicatorsResponse.success ? indicatorsResponse.data : [];
        const activities = activitiesResponse.success ? activitiesResponse.data : [];
        const cases = casesResponse.success ? casesResponse.data : { recent: [], stats: {} };
        const team = teamResponse.success ? teamResponse.data : [];
        const performance = performanceResponse.success ? performanceResponse.data : null;
        
        // Render complete dashboard
        container.innerHTML = `
            ${renderProjectHeader(project)}
            ${renderFinancialPerformance(financials, project)}
            ${renderIndicatorPerformance(indicators, project)}
            ${renderActivitiesSection(activities, projectId)}
            ${renderCasesSection(cases, projectId)}
            ${renderTeamSection(team)}
            ${renderMonthlyPerformance(performance)}
        `;
        
        // Initialize components
        setTimeout(() => {
            attachEventListeners(projectId);
        }, 100);
        
    } catch (error) {
        console.error('Error loading project dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-exclamation-triangle"></i> Error Loading Project</h4>
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
 * Section A: Project Header
 * @private
 */
function renderProjectHeader(project) {
    const progress = calculateProjectProgress(project.start_date, project.end_date);
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card project-header border-primary">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h2 class="mb-2">
                                    ${escapeHtml(project.name)}
                                    ${renderStatusBadge(project.status)}
                                </h2>
                                <div class="project-meta">
                                    ${project.donor ? `
                                        <span class="me-3">
                                            <i class="bi bi-building text-primary"></i>
                                            <strong>Donor:</strong> ${escapeHtml(project.donor)}
                                        </span>
                                    ` : ''}
                                    ${project.budget ? `
                                        <span class="me-3">
                                            <i class="bi bi-currency-dollar text-success"></i>
                                            <strong>Budget:</strong> ${formatCurrency(project.budget)}
                                        </span>
                                    ` : ''}
                                    ${project.location ? `
                                        <span class="me-3">
                                            <i class="bi bi-geo-alt text-danger"></i>
                                            ${escapeHtml(project.location)}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <button class="btn btn-primary" onclick="editProject('${project.id}')">
                                    <i class="bi bi-pencil"></i> Edit Project
                                </button>
                            </div>
                        </div>
                        
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <strong>Timeline:</strong>
                                ${formatDate(project.start_date)} → ${formatDate(project.end_date)}
                                <div class="progress mt-2" style="height: 25px;">
                                    <div class="progress-bar bg-info" role="progressbar" 
                                         style="width: ${progress}%">
                                        ${progress}% Time Elapsed
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                ${project.team_count ? `
                                    <strong>Team Members:</strong>
                                    <span class="badge bg-secondary ms-2">${project.team_count} members</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Section B: Financial Performance
 * @private
 */
function renderFinancialPerformance(financials, project) {
    if (!financials) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <h4><i class="bi bi-cash-stack"></i> Financial Performance</h4>
                    <div class="alert alert-info">No financial data available.</div>
                </div>
            </div>
        `;
    }
    
    const burnRate = financials.burn_rate || 0;
    const burnStatus = burnRate > 100 ? 'Over Budget' : burnRate > 90 ? 'At Risk' : 'On Track';
    const burnColor = burnRate > 100 ? 'danger' : burnRate > 90 ? 'warning' : 'success';
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-cash-stack"></i> Financial Performance</h4>
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="financial-metric">
                                    <small class="text-muted">Original Budget</small>
                                    <h5>${formatCurrency(financials.original_budget || project.budget)}</h5>
                                </div>
                            </div>
                            <div class="col-md-2 mb-3">
                                <div class="financial-metric">
                                    <small class="text-success">+ Transfers In</small>
                                    <h5 class="text-success">${formatCurrency(financials.transfers_in || 0)}</h5>
                                </div>
                            </div>
                            <div class="col-md-2 mb-3">
                                <div class="financial-metric">
                                    <small class="text-danger">- Transfers Out</small>
                                    <h5 class="text-danger">${formatCurrency(financials.transfers_out || 0)}</h5>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="financial-metric">
                                    <small class="text-muted">Total Available</small>
                                    <h5 class="fw-bold">${formatCurrency(financials.total_available || project.budget)}</h5>
                                </div>
                            </div>
                            <div class="col-md-2 mb-3">
                                <div class="financial-metric">
                                    <small class="text-muted">Status</small>
                                    <span class="badge bg-${burnColor} fs-6">${burnStatus}</span>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <small class="text-muted">Expenditure To Date</small>
                                <h5>${formatCurrency(financials.expenditure || project.expenditure || 0)}</h5>
                            </div>
                            <div class="col-md-4">
                                <small class="text-muted">Available Balance</small>
                                <h5>${formatCurrency(financials.available_balance || 0)}</h5>
                            </div>
                            <div class="col-md-4">
                                <small class="text-muted">Burn Rate</small>
                                <div class="d-flex align-items-center">
                                    <div class="progress flex-grow-1 me-2" style="height: 30px;">
                                        <div class="progress-bar bg-${burnColor}" role="progressbar" 
                                             style="width: ${Math.min(burnRate, 100)}%">
                                            ${burnRate.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Section C: Indicator Performance
 * @private
 */
function renderIndicatorPerformance(indicators, project) {
    if (!indicators || indicators.length === 0) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h4><i class="bi bi-graph-up"></i> Indicator Performance</h4>
                        <button class="btn btn-sm btn-primary" onclick="window.addProjectIndicator('${project?.id}', '${escapeHtml(project?.name || '')}')">
                            <i class="bi bi-plus-lg"></i> Add Indicator
                        </button>
                    </div>
                    <div class="alert alert-info">No indicators defined for this project.</div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h4>
                        <i class="bi bi-graph-up"></i> Indicator Performance
                        <span class="badge bg-warning text-dark ms-2">Project Indicators</span>
                    </h4>
                    <button class="btn btn-sm btn-primary" onclick="window.addProjectIndicator('${project?.id}', '${escapeHtml(project?.name || '')}')">
                        <i class="bi bi-plus-lg"></i> Add Indicator
                    </button>
                </div>
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
                                        <th>Q1</th>
                                        <th>Q2</th>
                                        <th>Q3</th>
                                        <th>Q4</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${indicators.map(ind => `
                                        <tr>
                                            <td onclick="showIndicatorDetail('${ind.id}')" style="cursor: pointer;">
                                                <strong>${escapeHtml(ind.name)}</strong>
                                            </td>
                                            <td>${formatNumber(ind.target || 0)}</td>
                                            <td>${formatNumber(ind.achieved || 0)}</td>
                                            <td style="min-width: 150px;">
                                                ${renderProgressBar(ind.achieved || 0, ind.target || 0)}
                                            </td>
                                            <td>${formatNumber(ind.q1 || 0)}</td>
                                            <td>${formatNumber(ind.q2 || 0)}</td>
                                            <td>${formatNumber(ind.q3 || 0)}</td>
                                            <td>${formatNumber(ind.q4 || 0)}</td>
                                            <td>${renderStatusBadgeSimple(ind.achieved || 0, ind.target || 0)}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-secondary" onclick="window.editProjectIndicator('${ind.id}')" title="Edit">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
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
 * Section D: Activities Section
 * @private
 */
function renderActivitiesSection(activities, projectId) {
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-calendar-event"></i> Activities</h4>
                <div class="card">
                    <div class="card-header">
                        <div class="row">
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="activity-status-filter" 
                                        onchange="filterActivities('${projectId}')">
                                    <option value="">All Status</option>
                                    <option value="Planned">Planned</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select form-select-sm" id="activity-location-filter"
                                        onchange="filterActivities('${projectId}')">
                                    <option value="">All Locations</option>
                                </select>
                            </div>
                            <div class="col-md-6 text-end">
                                <button class="btn btn-sm btn-primary" onclick="addActivity('${projectId}')">
                                    <i class="bi bi-plus-circle"></i> Add Activity
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        ${activities.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Activity</th>
                                            <th>Status</th>
                                            <th>Dates</th>
                                            <th>Location</th>
                                            <th>Beneficiaries</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activities.slice(0, 10).map(act => `
                                            <tr>
                                                <td>${escapeHtml(act.name || act.description)}</td>
                                                <td>${renderActivityStatus(act.status)}</td>
                                                <td><small>${formatDate(act.planned_date)}</small></td>
                                                <td><small>${escapeHtml(act.location || 'N/A')}</small></td>
                                                <td>${formatNumber(act.total_beneficiaries || 0)}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" 
                                                            onclick="viewActivity('${act.id}')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${activities.length > 10 ? `
                                <div class="text-center mt-2">
                                    <button class="btn btn-outline-secondary btn-sm" onclick="viewAllActivities('${projectId}')">
                                        View All ${activities.length} Activities
                                    </button>
                                </div>
                            ` : ''}
                        ` : '<p class="text-muted text-center">No activities recorded yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Section E: Cases Section (Privacy-Safe)
 * @private
 */
function renderCasesSection(cases, projectId) {
    const recentCases = cases.recent || [];
    const stats = cases.stats || {};
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-briefcase"></i> Case Management</h4>
                <div class="card">
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="text-center p-3 border rounded">
                                    <h3>${stats.total_cases || 0}</h3>
                                    <small class="text-muted">Total Cases</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 border rounded">
                                    <h3 class="text-success">${stats.active || 0}</h3>
                                    <small class="text-muted">Active</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 border rounded">
                                    <h3 class="text-primary">${stats.closed || 0}</h3>
                                    <small class="text-muted">Closed</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 border rounded">
                                    <h3 class="text-warning">${stats.pending || 0}</h3>
                                    <small class="text-muted">Pending</small>
                                </div>
                            </div>
                        </div>
                        
                        ${recentCases.length > 0 ? `
                            <h6>Recent Cases (Last 10)</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Case #</th>
                                            <th>Type</th>
                                            <th>Date Opened</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${recentCases.map(c => `
                                            <tr>
                                                <td>${escapeHtml(c.case_number)}</td>
                                                <td>${escapeHtml(c.case_type)}</td>
                                                <td>${formatDate(c.date_opened)}</td>
                                                <td>${renderCaseStatus(c.status)}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" 
                                                            onclick="viewCase('${c.id}')">
                                                        <i class="bi bi-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="text-muted text-center">No cases linked to this project.</p>'}
                        
                        <div class="text-center mt-3">
                            <button class="btn btn-outline-secondary" onclick="viewAllCases('${projectId}')">
                                View All Cases
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Section F: Team Section
 * @private
 */
function renderTeamSection(team) {
    if (!team || team.length === 0) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <h4><i class="bi bi-people"></i> Project Team</h4>
                    <div class="alert alert-info">No team members assigned.</div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-people"></i> Project Team</h4>
                <div class="row">
                    ${team.map(member => `
                        <div class="col-md-3 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <i class="bi bi-person-circle fs-1 text-primary"></i>
                                    <h6 class="mt-2">${escapeHtml(member.name)}</h6>
                                    <p class="text-muted small mb-1">${escapeHtml(member.role)}</p>
                                    ${member.email ? `
                                        <small><i class="bi bi-envelope"></i> ${escapeHtml(member.email)}</small>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Section G: Monthly Performance
 * @private
 */
function renderMonthlyPerformance(performance) {
    if (!performance) {
        return '';
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-bar-chart"></i> Monthly Performance Trends</h4>
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <small class="text-muted">Programmatic Rate</small>
                                <h3 class="text-primary">${(performance.programmatic_rate || 0).toFixed(1)}%</h3>
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar bg-primary" style="width: ${performance.programmatic_rate || 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <small class="text-muted">Activity Rate</small>
                                <h3 class="text-success">${(performance.activity_rate || 0).toFixed(1)}%</h3>
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar bg-success" style="width: ${performance.activity_rate || 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <small class="text-muted">Reach Rate</small>
                                <h3 class="text-info">${(performance.reach_rate || 0).toFixed(1)}%</h3>
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar bg-info" style="width: ${performance.reach_rate || 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <small class="text-muted">Burn Rate</small>
                                <h3 class="text-warning">${(performance.burn_rate || 0).toFixed(1)}%</h3>
                                <div class="progress" style="height: 5px;">
                                    <div class="progress-bar bg-warning" style="width: ${performance.burn_rate || 0}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================

function calculateProjectProgress(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function renderStatusBadge(status) {
    const statusMap = {
        'Active': 'success',
        'Completed': 'secondary',
        'On Hold': 'warning',
        'Cancelled': 'danger',
        'Planning': 'info'
    };
    const color = statusMap[status] || 'secondary';
    return `<span class="badge bg-${color} ms-2">${status}</span>`;
}

function renderStatusBadgeSimple(achieved, target) {
    if (!target) return '<span class="badge bg-secondary">N/A</span>';
    const pct = (achieved / target) * 100;
    if (pct >= 100) return '<span class="badge bg-success">Achieved</span>';
    if (pct >= 75) return '<span class="badge bg-primary">On Track</span>';
    if (pct >= 50) return '<span class="badge bg-warning">At Risk</span>';
    return '<span class="badge bg-danger">Behind</span>';
}

function renderActivityStatus(status) {
    const statusMap = {
        'Planned': 'info',
        'In Progress': 'primary',
        'Completed': 'success',
        'Overdue': 'danger',
        'Cancelled': 'secondary'
    };
    const color = statusMap[status] || 'secondary';
    return `<span class="badge bg-${color}">${status}</span>`;
}

function renderCaseStatus(status) {
    const statusMap = {
        'Open': 'success',
        'In Progress': 'primary',
        'Closed': 'secondary',
        'Pending': 'warning'
    };
    const color = statusMap[status] || 'secondary';
    return `<span class="badge bg-${color}">${status}</span>`;
}

function renderProgressBar(achieved, target) {
    if (!target) return '<span class="text-muted">N/A</span>';
    const percentage = Math.min(Math.round((achieved / target) * 100), 100);
    const colorClass = percentage >= 100 ? 'bg-success' : percentage >= 75 ? 'bg-primary' : percentage >= 50 ? 'bg-warning' : 'bg-danger';
    
    return `
        <div class="progress" style="height: 20px;">
            <div class="progress-bar ${colorClass}" role="progressbar" 
                 style="width: ${percentage}%">
                ${percentage}%
            </div>
        </div>
    `;
}

function formatCurrency(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString();
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function attachEventListeners(projectId) {
    console.log('Project dashboard event listeners attached for:', projectId);
}

// Export global functions for onclick handlers
window.editProject = async (id) => {
    console.log('Edit project:', id);
    await showEditProjectModal(id, () => {
        console.log('Project edited successfully');
        // Reload the dashboard
        window.location.reload();
    });
};

window.filterActivities = (projectId) => console.log('Filter activities:', projectId);

window.addActivity = (projectId) => {
    console.log('Add activity for project:', projectId);
    // Reuse the global createActivity function but pre-fill project
    if (window.createActivity) {
        window.createActivity(projectId);
    } else {
        console.error('createActivity function not found');
    }
};

window.viewActivity = (id) => {
    console.log('View activity:', id);
    if (window.viewActivityDetail) {
        window.viewActivityDetail(id);
    }
};

window.viewAllActivities = (projectId) => {
    console.log('View all activities:', projectId);
    window.location.hash = '#/activities';
};

window.showIndicatorDetail = (id) => {
    console.log('Show indicator:', id);
    if (window.viewIndicatorDetail) {
        window.viewIndicatorDetail(id);
    }
};

window.addProjectIndicator = (projectId, projectName) => {
    showCreateProjectIndicatorModal(projectId, projectName, () => {
        // Reload the dashboard after adding a new indicator
        renderProjectDashboardNew(projectId).then(html => {
            const container = document.getElementById('main-content') || document.querySelector('[data-section="project-dashboard"]');
            if (container) container.innerHTML = html;
        });
    });
};

window.editProjectIndicator = (indicatorId) => {
    showEditIndicatorModal(indicatorId, () => {
        const hash = window.location.hash;
        const projectId = new URLSearchParams(hash.split('?')[1] || '').get('id');
        if (projectId) {
            renderProjectDashboardNew(projectId).then(html => {
                const container = document.getElementById('main-content') || document.querySelector('[data-section="project-dashboard"]');
                if (container) container.innerHTML = html;
            });
        }
    });
};

window.viewCase = (id) => {
    console.log('View case:', id);
    if (window.viewCaseDetail) {
        window.viewCaseDetail(id);
    }
};

window.viewAllCases = (projectId) => {
    console.log('View all cases:', projectId);
    window.location.hash = '#/cases';
};
