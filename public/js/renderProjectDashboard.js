import { authManager } from '../auth.js';

const API_BASE = '/api/v1';

/**
 * Render Project Dashboard with tabbed interface
 * Tabs: Overview, Indicators, Activities, Cases, Team, Financial
 */
export async function renderProjectDashboard(projectId) {
    if (!projectId) {
        const html = `
            <div class="container-fluid">
                <div class="alert alert-info">
                    <h4><i class="bi bi-info-circle"></i> Select a Project</h4>
                    <p>Please select a project from the dropdown to view its dashboard.</p>
                    <div class="mt-3">
                        <select class="form-select" id="project-selector" onchange="selectProject(this.value)">
                            <option value="">-- Select Project --</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        // Load projects into selector after a short delay to ensure DOM is ready
        setTimeout(() => loadProjectSelector(), 0);
        
        return html;
    }

    const container = document.createElement('div');
    container.className = 'container-fluid project-dashboard';
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading project dashboard...</span>
            </div>
        </div>
    `;

    // Load data asynchronously
    loadProjectData(container, projectId);
    
    return container.outerHTML;
}

async function loadProjectData(container, projectId) {
    try {
        // Fetch project data, indicators, activities, cases in parallel
        const [projectResponse, indicatorsResponse, activitiesResponse, casesResponse] = await Promise.all([
            authManager.authenticatedFetch(`${API_BASE}/projects/${projectId}`),
            authManager.authenticatedFetch(`${API_BASE}/indicators?project_id=${projectId}`),
            authManager.authenticatedFetch(`${API_BASE}/activities?project_id=${projectId}`),
            authManager.authenticatedFetch(`${API_BASE}/cases?project_id=${projectId}`)
        ]);

        const project = await projectResponse.json();
        const indicators = await indicatorsResponse.json();
        const activities = await activitiesResponse.json();
        const cases = await casesResponse.json();

        if (!project.success) {
            throw new Error('Project not found');
        }

        // Render the complete dashboard
        container.innerHTML = renderDashboardContent(
            project.data,
            indicators.data || [],
            activities.data || [],
            cases.data || []
        );

        // Attach event listeners
        attachTabListeners();
        attachExportListeners(project.data, indicators.data, activities.data, cases.data);

    } catch (error) {
        console.error('Error loading project dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error Loading Project Dashboard</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                <button class="btn btn-secondary" onclick="navigateTo('projects')">Back to Projects</button>
            </div>
        `;
    }
}

function renderDashboardContent(project, indicators, activities, cases) {
    return `
        ${renderProjectHeader(project, indicators, activities, cases)}
        ${renderTabNavigation()}
        <div class="tab-content mt-3" id="projectTabContent">
            ${renderOverviewTab(project, indicators, activities, cases)}
            ${renderIndicatorsTab(indicators, project)}
            ${renderActivitiesTab(activities, project)}
            ${renderCasesTab(cases, project)}
            ${renderTeamTab(project)}
            ${renderFinancialTab(project, activities)}
        </div>
    `;
}

function renderProjectHeader(project, indicators, activities, cases) {
    const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A';
    const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A';
    const statusClass = project.status === 'Active' ? 'success' : project.status === 'Planned' ? 'warning' : 'secondary';
    
    const totalBudget = project.budget || 0;
    const totalExpenditure = project.expenditure || 0;
    const burnRate = totalBudget > 0 ? (totalExpenditure / totalBudget * 100) : 0;

    return `
        <div class="project-header mb-4">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h1 class="mb-2">
                        <i class="bi bi-folder2-open text-primary"></i>
                        ${escapeHtml(project.name)}
                    </h1>
                    <div class="mb-3">
                        <span class="badge bg-${statusClass} me-2">${escapeHtml(project.status)}</span>
                        ${project.donor ? `<span class="badge bg-info me-2"><i class="bi bi-bank"></i> ${escapeHtml(project.donor)}</span>` : ''}
                        ${project.result_area ? `<span class="badge bg-secondary"><i class="bi bi-bullseye"></i> ${escapeHtml(project.result_area)}</span>` : ''}
                    </div>
                    ${project.description ? `<p class="lead text-muted">${escapeHtml(project.description)}</p>` : ''}
                </div>
                <div class="btn-group">
                    <button class="btn btn-outline-primary" onclick="editProject('${project.id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-outline-success" onclick="exportProjectReport('${project.id}')">
                        <i class="bi bi-download"></i> Export
                    </button>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-3">
                    <div class="info-card">
                        <small class="text-muted">Start Date</small>
                        <div class="fw-bold">${startDate}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <small class="text-muted">End Date</small>
                        <div class="fw-bold">${endDate}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <small class="text-muted">Budget</small>
                        <div class="fw-bold">$${totalBudget.toLocaleString()}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="info-card">
                        <small class="text-muted">Burn Rate</small>
                        <div class="fw-bold ${burnRate > 80 ? 'text-danger' : burnRate > 60 ? 'text-warning' : 'text-success'}">
                            ${burnRate.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTabNavigation() {
    return `
        <ul class="nav nav-tabs" id="projectTab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                    <i class="bi bi-house"></i> Overview
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="indicators-tab" data-bs-toggle="tab" data-bs-target="#indicators" type="button" role="tab">
                    <i class="bi bi-graph-up"></i> Indicators
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="activities-tab" data-bs-toggle="tab" data-bs-target="#activities" type="button" role="tab">
                    <i class="bi bi-list-check"></i> Activities
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="cases-tab" data-bs-toggle="tab" data-bs-target="#cases" type="button" role="tab">
                    <i class="bi bi-briefcase"></i> Cases
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="team-tab" data-bs-toggle="tab" data-bs-target="#team" type="button" role="tab">
                    <i class="bi bi-people"></i> Team
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="financial-tab" data-bs-toggle="tab" data-bs-target="#financial" type="button" role="tab">
                    <i class="bi bi-currency-dollar"></i> Financial
                </button>
            </li>
        </ul>
    `;
}

function renderOverviewTab(project, indicators, activities, cases) {
    const activeIndicators = indicators.filter(ind => ind.indicator_scope === 'Project');
    const completedActivities = activities.filter(act => act.status === 'Completed');
    const ongoingActivities = activities.filter(act => act.status === 'In Progress');
    const activeCases = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');

    // Calculate indicator achievement
    const indicatorProgress = activeIndicators.length > 0
        ? activeIndicators.reduce((sum, ind) => {
            const progress = ind.lop_target > 0 ? (ind.lop_achieved / ind.lop_target * 100) : 0;
            return sum + progress;
        }, 0) / activeIndicators.length
        : 0;

    return `
        <div class="tab-pane fade show active" id="overview" role="tabpanel">
            <div class="row mt-3">
                <!-- Summary Cards -->
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-primary h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-graph-up display-4 text-primary"></i>
                            <h2 class="mt-2 mb-0">${activeIndicators.length}</h2>
                            <p class="text-muted mb-0">Project Indicators</p>
                            <small class="text-success">${indicatorProgress.toFixed(1)}% Average Progress</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-success h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-list-check display-4 text-success"></i>
                            <h2 class="mt-2 mb-0">${activities.length}</h2>
                            <p class="text-muted mb-0">Activities</p>
                            <small class="text-success">${completedActivities.length} Completed, ${ongoingActivities.length} Ongoing</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-info h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-briefcase display-4 text-info"></i>
                            <h2 class="mt-2 mb-0">${cases.length}</h2>
                            <p class="text-muted mb-0">Cases Managed</p>
                            <small class="text-info">${activeCases.length} Active</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6 mb-3">
                    <div class="card border-warning h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-people display-4 text-warning"></i>
                            <h2 class="mt-2 mb-0">${calculateTotalBeneficiaries(activities)}</h2>
                            <p class="text-muted mb-0">Total Beneficiaries</p>
                            <small class="text-muted">Reached</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="row mt-3">
                <div class="col-lg-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-pie-chart"></i> Activity Status Distribution</h5>
                        </div>
                        <div class="card-body">
                            ${renderActivityStatusChart(activities)}
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-3">
                    <div class="card">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Indicator Performance</h5>
                        </div>
                        <div class="card-body">
                            ${renderIndicatorPerformanceChart(activeIndicators)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities -->
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-clock-history"></i> Recent Activities</h5>
                        </div>
                        <div class="card-body">
                            ${renderRecentActivitiesList(activities.slice(0, 5))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderIndicatorsTab(indicators, project) {
    const projectIndicators = indicators.filter(ind => ind.indicator_scope === 'Project');
    
    if (projectIndicators.length === 0) {
        return `
            <div class="tab-pane fade" id="indicators" role="tabpanel">
                <div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle"></i> No project-specific indicators defined yet.
                    <button class="btn btn-sm btn-primary ms-2" onclick="createIndicator('${project.id}')">
                        <i class="bi bi-plus"></i> Create Indicator
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="tab-pane fade" id="indicators" role="tabpanel">
            <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                <h4><i class="bi bi-graph-up"></i> Project Indicators (${projectIndicators.length})</h4>
                <button class="btn btn-primary btn-sm" onclick="createIndicator('${project.id}')">
                    <i class="bi bi-plus"></i> Add Indicator
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Indicator</th>
                            <th>Level</th>
                            <th>Result Area</th>
                            <th>LOP Target</th>
                            <th>Q1</th>
                            <th>Q2</th>
                            <th>Q3</th>
                            <th>Q4</th>
                            <th>Progress</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projectIndicators.map(ind => renderIndicatorTableRow(ind)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderActivitiesTab(activities, project) {
    if (activities.length === 0) {
        return `
            <div class="tab-pane fade" id="activities" role="tabpanel">
                <div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle"></i> No activities recorded yet.
                    <button class="btn btn-sm btn-primary ms-2" onclick="createActivity('${project.id}')">
                        <i class="bi bi-plus"></i> Create Activity
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="tab-pane fade" id="activities" role="tabpanel">
            <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                <h4><i class="bi bi-list-check"></i> Project Activities (${activities.length})</h4>
                <button class="btn btn-primary btn-sm" onclick="createActivity('${project.id}')">
                    <i class="bi bi-plus"></i> Add Activity
                </button>
            </div>
            
            <!-- Activity Filters -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <select class="form-select form-select-sm" onchange="filterActivitiesByStatus(this.value)">
                        <option value="">All Statuses</option>
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Activity</th>
                            <th>Date</th>
                            <th>Location</th>
                            <th>Beneficiaries</th>
                            <th>Budget</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activities.map(act => renderActivityTableRow(act)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCasesTab(cases, project) {
    if (cases.length === 0) {
        return `
            <div class="tab-pane fade" id="cases" role="tabpanel">
                <div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle"></i> No cases recorded yet.
                    <button class="btn btn-sm btn-primary ms-2" onclick="createCase('${project.id}')">
                        <i class="bi bi-plus"></i> Create Case
                    </button>
                </div>
            </div>
        `;
    }

    const openCases = cases.filter(c => c.status === 'Open');
    const inProgressCases = cases.filter(c => c.status === 'In Progress');
    const closedCases = cases.filter(c => c.status === 'Closed');

    return `
        <div class="tab-pane fade" id="cases" role="tabpanel">
            <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                <h4><i class="bi bi-briefcase"></i> Project Cases (${cases.length})</h4>
                <button class="btn btn-primary btn-sm" onclick="createCase('${project.id}')">
                    <i class="bi bi-plus"></i> Add Case
                </button>
            </div>

            <!-- Case Status Summary -->
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <h3 class="text-warning">${openCases.length}</h3>
                            <small>Open Cases</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-info">
                        <div class="card-body text-center">
                            <h3 class="text-info">${inProgressCases.length}</h3>
                            <small>In Progress</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-success">
                        <div class="card-body text-center">
                            <h3 class="text-success">${closedCases.length}</h3>
                            <small>Closed Cases</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Case ID</th>
                            <th>Client Identifier</th>
                            <th>Case Type</th>
                            <th>Registration Date</th>
                            <th>Status</th>
                            <th>Support Offered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cases.map(caseItem => renderCaseTableRow(caseItem)).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderTeamTab(project) {
    return `
        <div class="tab-pane fade" id="team" role="tabpanel">
            <div class="mt-3">
                <h4><i class="bi bi-people"></i> Project Team</h4>
                <div class="alert alert-info mt-3">
                    <i class="bi bi-info-circle"></i> Team management feature coming soon.
                    <p class="mt-2 mb-0">This section will display project staff, roles, and responsibilities.</p>
                </div>
                
                <!-- Placeholder for team structure -->
                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Project Manager</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">To be assigned</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">M&E Officer</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">To be assigned</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderFinancialTab(project, activities) {
    const totalBudget = project.budget || 0;
    const totalExpenditure = project.expenditure || 0;
    const remaining = totalBudget - totalExpenditure;
    const burnRate = totalBudget > 0 ? (totalExpenditure / totalBudget * 100) : 0;

    // Calculate activity costs
    const activityCosts = activities.reduce((sum, act) => sum + (act.total_cost || 0), 0);
    const costedActivities = activities.filter(act => act.is_costed);

    return `
        <div class="tab-pane fade" id="financial" role="tabpanel">
            <div class="mt-3">
                <h4><i class="bi bi-currency-dollar"></i> Financial Overview</h4>
                
                <!-- Budget Summary -->
                <div class="row mt-3">
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-primary">
                            <div class="card-body text-center">
                                <small class="text-muted">Total Budget</small>
                                <h3 class="text-primary">$${totalBudget.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-danger">
                            <div class="card-body text-center">
                                <small class="text-muted">Total Expenditure</small>
                                <h3 class="text-danger">$${totalExpenditure.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-success">
                            <div class="card-body text-center">
                                <small class="text-muted">Remaining</small>
                                <h3 class="text-success">$${remaining.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 mb-3">
                        <div class="card border-warning">
                            <div class="card-body text-center">
                                <small class="text-muted">Burn Rate</small>
                                <h3 class="text-warning">${burnRate.toFixed(1)}%</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Budget Progress Bar -->
                <div class="card mt-3">
                    <div class="card-body">
                        <h5>Budget Utilization</h5>
                        <div class="progress" style="height: 30px;">
                            <div class="progress-bar ${burnRate > 80 ? 'bg-danger' : burnRate > 60 ? 'bg-warning' : 'bg-success'}" 
                                 role="progressbar" 
                                 style="width: ${Math.min(burnRate, 100)}%">
                                ${burnRate.toFixed(1)}% Spent
                            </div>
                        </div>
                        <div class="d-flex justify-content-between mt-2">
                            <small class="text-muted">$0</small>
                            <small class="text-muted">$${totalBudget.toLocaleString()}</small>
                        </div>
                    </div>
                </div>

                <!-- Activity Costs Breakdown -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Activity Costs Breakdown</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Total Activity Costs:</strong> $${activityCosts.toLocaleString()}</p>
                        <p><strong>Costed Activities:</strong> ${costedActivities.length} of ${activities.length}</p>
                        
                        ${costedActivities.length > 0 ? `
                            <div class="table-responsive mt-3">
                                <table class="table table-sm">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Activity</th>
                                            <th>Currency</th>
                                            <th>Cost</th>
                                            <th>USD Equivalent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${costedActivities.slice(0, 10).map(act => `
                                            <tr>
                                                <td>${escapeHtml(act.activity_name || 'Unnamed Activity')}</td>
                                                <td><span class="badge bg-secondary">${act.currency || 'USD'}</span></td>
                                                <td>${(act.total_cost || 0).toLocaleString()}</td>
                                                <td>$${(act.total_cost_usd || act.total_cost || 0).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="text-muted">No costed activities yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper rendering functions
function renderActivityStatusChart(activities) {
    const statusCounts = {
        'Planned': activities.filter(a => a.status === 'Planned').length,
        'In Progress': activities.filter(a => a.status === 'In Progress').length,
        'Completed': activities.filter(a => a.status === 'Completed').length,
        'Cancelled': activities.filter(a => a.status === 'Cancelled').length
    };

    const total = activities.length;
    if (total === 0) {
        return '<p class="text-muted">No activities to display</p>';
    }

    return `
        <div class="mb-3">
            ${Object.entries(statusCounts).map(([status, count]) => {
                const percentage = (count / total * 100).toFixed(1);
                const colorClass = status === 'Completed' ? 'success' : 
                                 status === 'In Progress' ? 'info' : 
                                 status === 'Planned' ? 'warning' : 'secondary';
                return `
                    <div class="mb-2">
                        <div class="d-flex justify-content-between mb-1">
                            <small>${status}</small>
                            <small><strong>${count}</strong> (${percentage}%)</small>
                        </div>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar bg-${colorClass}" 
                                 role="progressbar" 
                                 style="width: ${percentage}%">
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderIndicatorPerformanceChart(indicators) {
    if (indicators.length === 0) {
        return '<p class="text-muted">No indicators to display</p>';
    }

    return `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Indicator</th>
                        <th style="width: 50%;">Progress</th>
                    </tr>
                </thead>
                <tbody>
                    ${indicators.slice(0, 5).map(ind => {
                        const progress = ind.lop_target > 0 ? (ind.lop_achieved / ind.lop_target * 100) : 0;
                        const progressClass = progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'danger';
                        return `
                            <tr>
                                <td><small>${escapeHtml(ind.name)}</small></td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-${progressClass}" 
                                             role="progressbar" 
                                             style="width: ${Math.min(progress, 100)}%">
                                            ${progress.toFixed(0)}%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRecentActivitiesList(activities) {
    if (activities.length === 0) {
        return '<p class="text-muted">No recent activities</p>';
    }

    return `
        <ul class="list-group">
            ${activities.map(act => {
                const actDate = act.activity_date ? new Date(act.activity_date).toLocaleDateString() : 'N/A';
                const statusClass = act.status === 'Completed' ? 'success' : 
                                  act.status === 'In Progress' ? 'info' : 'warning';
                return `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${escapeHtml(act.activity_name || 'Unnamed Activity')}</strong>
                                <br>
                                <small class="text-muted">
                                    <i class="bi bi-calendar"></i> ${actDate} | 
                                    <i class="bi bi-geo-alt"></i> ${escapeHtml(act.location || 'N/A')}
                                </small>
                            </div>
                            <span class="badge bg-${statusClass}">${act.status}</span>
                        </div>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
}

function renderIndicatorTableRow(ind) {
    const lopProgress = ind.lop_target > 0 ? (ind.lop_achieved / ind.lop_target * 100) : 0;
    const progressClass = lopProgress >= 80 ? 'success' : lopProgress >= 60 ? 'warning' : 'danger';

    return `
        <tr>
            <td>
                <strong>${escapeHtml(ind.name)}</strong>
                ${ind.code ? `<br><small class="text-muted">${escapeHtml(ind.code)}</small>` : ''}
            </td>
            <td><span class="badge bg-info">${escapeHtml(ind.indicator_level || 'N/A')}</span></td>
            <td>${escapeHtml(ind.result_area || 'N/A')}</td>
            <td>${formatValue(ind.lop_target, ind.data_type, ind.unit)}</td>
            <td><small>${formatValue(ind.q1_achieved, ind.data_type, ind.unit)}</small></td>
            <td><small>${formatValue(ind.q2_achieved, ind.data_type, ind.unit)}</small></td>
            <td><small>${formatValue(ind.q3_achieved, ind.data_type, ind.unit)}</small></td>
            <td><small>${formatValue(ind.q4_achieved, ind.data_type, ind.unit)}</small></td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar bg-${progressClass}" 
                         role="progressbar" 
                         style="width: ${Math.min(lopProgress, 100)}%">
                        ${lopProgress.toFixed(0)}%
                    </div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editIndicator('${ind.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

function renderActivityTableRow(act) {
    const actDate = act.activity_date ? new Date(act.activity_date).toLocaleDateString() : 'N/A';
    const statusClass = act.status === 'Completed' ? 'success' : 
                       act.status === 'In Progress' ? 'info' : 
                       act.status === 'Planned' ? 'warning' : 'secondary';
    const totalBeneficiaries = (act.male_beneficiaries || 0) + (act.female_beneficiaries || 0);

    return `
        <tr>
            <td>
                <strong>${escapeHtml(act.activity_name || 'Unnamed Activity')}</strong>
                ${act.description ? `<br><small class="text-muted">${escapeHtml(act.description.substring(0, 50))}...</small>` : ''}
            </td>
            <td>${actDate}</td>
            <td>${escapeHtml(act.location || 'N/A')}</td>
            <td>${totalBeneficiaries}</td>
            <td>
                ${act.is_costed ? `
                    <span class="badge bg-secondary">${act.currency || 'USD'}</span>
                    ${(act.total_cost || 0).toLocaleString()}
                ` : '<small class="text-muted">Not costed</small>'}
            </td>
            <td><span class="badge bg-${statusClass}">${act.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editActivity('${act.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

function renderCaseTableRow(caseItem) {
    const regDate = caseItem.registration_date ? new Date(caseItem.registration_date).toLocaleDateString() : 'N/A';
    const statusClass = caseItem.status === 'Closed' ? 'success' : 
                       caseItem.status === 'In Progress' ? 'info' : 'warning';

    return `
        <tr>
            <td><code>${caseItem.case_number || 'N/A'}</code></td>
            <td>${escapeHtml(caseItem.client_identifier || 'N/A')}</td>
            <td>${escapeHtml(caseItem.case_type_name || 'N/A')}</td>
            <td>${regDate}</td>
            <td><span class="badge bg-${statusClass}">${caseItem.status}</span></td>
            <td><small>${escapeHtml(caseItem.support_offered || 'N/A')}</small></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCase('${caseItem.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        </tr>
    `;
}

// Utility functions
function calculateTotalBeneficiaries(activities) {
    return activities.reduce((sum, act) => {
        return sum + (act.male_beneficiaries || 0) + (act.female_beneficiaries || 0);
    }, 0);
}

function formatValue(value, dataType, unit) {
    if (value === null || value === undefined) return 'N/A';
    
    if (dataType === 'Percentage') {
        return `${value}%`;
    }
    
    return unit ? `${value} ${unit}` : value;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function attachTabListeners() {
    // Tab listeners are handled by Bootstrap automatically
    console.log('Project dashboard tabs initialized');
}

function attachExportListeners(project, indicators, activities, cases) {
    // Global export function
    window.exportProjectReport = function(projectId) {
        console.log('Exporting project report for:', projectId);
        alert('Export functionality will be implemented');
    };

    // Global edit functions
    window.editProject = function(projectId) {
        console.log('Edit project:', projectId);
        alert('Edit project functionality will be implemented');
    };

    window.createIndicator = function(projectId) {
        console.log('Create indicator for project:', projectId);
        alert('Create indicator functionality will be implemented');
    };

    window.editIndicator = function(indicatorId) {
        console.log('Edit indicator:', indicatorId);
        alert('Edit indicator functionality will be implemented');
    };

    window.createActivity = function(projectId) {
        console.log('Create activity for project:', projectId);
        alert('Create activity functionality will be implemented');
    };

    window.editActivity = function(activityId) {
        console.log('Edit activity:', activityId);
        alert('Edit activity functionality will be implemented');
    };

    window.createCase = function(projectId) {
        console.log('Create case for project:', projectId);
        alert('Create case functionality will be implemented');
    };

    window.editCase = function(caseId) {
        console.log('Edit case:', caseId);
        alert('Edit case functionality will be implemented');
    };

    window.filterActivitiesByStatus = function(status) {
        console.log('Filter activities by status:', status);
        // Filter logic will be implemented
    };
}

// Load projects for selector
export async function loadProjectSelector() {
    try {
        const response = await authManager.authenticatedFetch(`${API_BASE}/projects`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const selector = document.getElementById('project-selector');
            if (selector) {
                data.data.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    selector.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

window.selectProject = async function(projectId) {
    if (projectId) {
        // Navigate to project dashboard with selected project
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = await renderProjectDashboard(projectId);
        }
    }
};
