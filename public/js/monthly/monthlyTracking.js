/**
 * Monthly Tracking Dashboard
 * Main dashboard for monthly tracking with project filtering, KPI cards, and drill-down
 */

import monthlyTrackingService from '../services/monthlyTrackingService.js';
import * as utils from '../utils/monthlyUtils.js';

class MonthlyTrackingDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();
        this.selectedProjects = [];
        this.allProjects = [];
        this.compareMode = false;
        this.currentSnapshot = null;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadProjects();
            this.render();
            await this.loadData();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }
    
    async loadProjects() {
        try {
            this.allProjects = await monthlyTrackingService.getAllProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            throw error;
        }
    }
    
    async loadData() {
        try {
            this.showLoading(true);
            
            if (this.selectedProjects.length === 0) {
                // Load all projects snapshot
                const data = await monthlyTrackingService.getSnapshot(
                    this.currentMonth,
                    this.currentYear
                );
                this.currentSnapshot = data;
                this.renderAllProjectsView();
            } else if (this.selectedProjects.length === 1) {
                // Load single project with drill-down
                const projectId = this.selectedProjects[0];
                const data = await monthlyTrackingService.getSnapshot(
                    this.currentMonth,
                    this.currentYear,
                    projectId
                );
                this.currentSnapshot = data;
                await this.renderSingleProjectView(projectId);
            } else {
                // Load multiple projects for comparison
                const data = await monthlyTrackingService.getSnapshot(
                    this.currentMonth,
                    this.currentYear
                );
                this.currentSnapshot = data;
                this.renderComparativeView();
            }
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load tracking data');
            this.showLoading(false);
        }
    }
    
    render() {
        this.container.innerHTML = `
            <div class="monthly-tracking-dashboard">
                ${this.renderFilters()}
                <div id="performance-overview"></div>
                <div id="project-content"></div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderFilters() {
        return `
            <div class="tracking-filters card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <!-- Project Filter -->
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Project Filter</label>
                            <select id="projectFilter" class="form-select" multiple size="5">
                                <option value="all">All Projects</option>
                                ${this.allProjects.map(p => `
                                    <option value="${p.id}">${p.name}</option>
                                `).join('')}
                            </select>
                            <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
                        </div>
                        
                        <!-- Time Range -->
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Month</label>
                            <select id="monthFilter" class="form-select">
                                ${Array.from({length: 12}, (_, i) => {
                                    const month = i + 1;
                                    return `<option value="${month}" ${month === this.currentMonth ? 'selected' : ''}>
                                        ${utils.formatMonth(month, this.currentYear)}
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <div class="col-md-2">
                            <label class="form-label fw-bold">Year</label>
                            <select id="yearFilter" class="form-select">
                                ${Array.from({length: 5}, (_, i) => {
                                    const year = this.currentYear - 2 + i;
                                    return `<option value="${year}" ${year === this.currentYear ? 'selected' : ''}>
                                        ${year}
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <!-- Actions -->
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Actions</label>
                            <div class="d-grid gap-2">
                                <button id="applyFilters" class="btn btn-primary btn-sm">
                                    <i class="bi bi-funnel"></i> Apply Filters
                                </button>
                                <button id="generateSnapshotBtn" class="btn btn-success btn-sm">
                                    <i class="bi bi-camera"></i> Generate Snapshot
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Compare Mode Toggle -->
                    <div class="form-check form-switch mt-3">
                        <input class="form-check-input" type="checkbox" id="compareModeToggle">
                        <label class="form-check-label" for="compareModeToggle">
                            Compare Mode (view projects side-by-side)
                        </label>
                    </div>
                </div>
            </div>
            
            <div id="loadingIndicator" class="text-center my-4" style="display: none;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading tracking data...</p>
            </div>
            
            <div id="errorMessage" class="alert alert-danger" style="display: none;"></div>
        `;
    }
    
    renderPerformanceOverview(snapshot) {
        const rates = {
            programmatic: snapshot.programmatic_performance_rate || 0,
            activity: snapshot.activity_completion_rate || 0,
            beneficiary: snapshot.beneficiary_reach_rate || 0,
            financial: snapshot.financial_burn_rate || 0
        };
        
        return `
            <div class="performance-overview mb-4">
                <h4 class="mb-3">Performance Overview - ${utils.formatMonth(this.currentMonth, this.currentYear)}</h4>
                <div class="row g-3">
                    ${this.renderKPICard('Programmatic Performance', rates.programmatic, 'standard', 'bi-graph-up')}
                    ${this.renderKPICard('Activity Completion', rates.activity, 'standard', 'bi-check-circle')}
                    ${this.renderKPICard('Beneficiary Reach Rate', rates.beneficiary, 'standard', 'bi-people')}
                    ${this.renderKPICard('Financial Burn Rate', rates.financial, 'financial', 'bi-cash-stack')}
                </div>
            </div>
        `;
    }
    
    renderKPICard(title, rate, rateType, icon) {
        const status = utils.getRateStatus(rate, rateType);
        const color = utils.calculateRateColor(rate, rateType);
        const statusIcon = utils.getStatusIcon(status);
        
        return `
            <div class="col-md-6 col-lg-3">
                <div class="kpi-card card h-100" style="border-left: 4px solid ${color};">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-muted mb-0">${title}</h6>
                            <i class="bi ${icon} fs-3" style="color: ${color};"></i>
                        </div>
                        <div class="kpi-value" style="font-size: 2.5rem; font-weight: bold; color: ${color};">
                            ${utils.formatPercentage(rate, 1)}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="badge ${utils.getStatusClass(status)}">
                                ${statusIcon} ${status}
                            </span>
                            <span class="text-muted small">
                                <!-- Trend indicator placeholder -->
                                →
                            </span>
                        </div>
                        <div class="mt-2" style="height: 30px;">
                            ${utils.generateSparkline([rate-10, rate-5, rate-2, rate], 100, 30)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAllProjectsView() {
        const overviewEl = document.getElementById('performance-overview');
        const contentEl = document.getElementById('project-content');
        
        if (this.currentSnapshot && this.currentSnapshot.snapshots) {
            // Calculate aggregate rates
            const aggregateSnapshot = this.calculateAggregateRates(this.currentSnapshot.snapshots);
            overviewEl.innerHTML = this.renderPerformanceOverview(aggregateSnapshot);
            
            // Render project summary table
            contentEl.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Project Performance Summary</h5>
                    </div>
                    <div class="card-body">
                        ${this.renderProjectSummaryTable(this.currentSnapshot.snapshots)}
                    </div>
                </div>
            `;
        } else {
            contentEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No snapshot data available for ${utils.formatMonth(this.currentMonth, this.currentYear)}.
                    Click "Generate Snapshot" to create one.
                </div>
            `;
        }
    }
    
    renderProjectSummaryTable(snapshots) {
        if (!snapshots || snapshots.length === 0) {
            return '<p class="text-muted">No projects found</p>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-hover" id="projectSummaryTable">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th class="text-center">Programmatic</th>
                            <th class="text-center">Activity</th>
                            <th class="text-center">Beneficiary</th>
                            <th class="text-center">Financial</th>
                            <th class="text-center">Overall Status</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${snapshots.map(s => this.renderProjectRow(s)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderProjectRow(snapshot) {
        const avgRate = (
            (snapshot.programmatic_performance_rate || 0) +
            (snapshot.activity_completion_rate || 0) +
            (snapshot.beneficiary_reach_rate || 0)
        ) / 3;
        
        const overallStatus = utils.getRateStatus(avgRate);
        
        return `
            <tr data-project-id="${snapshot.project_id}">
                <td>
                    <strong>${snapshot.project_name || 'Unknown Project'}</strong>
                </td>
                <td class="text-center">
                    <span class="badge" style="background-color: ${utils.calculateRateColor(snapshot.programmatic_performance_rate)};">
                        ${utils.formatPercentage(snapshot.programmatic_performance_rate)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge" style="background-color: ${utils.calculateRateColor(snapshot.activity_completion_rate)};">
                        ${utils.formatPercentage(snapshot.activity_completion_rate)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge" style="background-color: ${utils.calculateRateColor(snapshot.beneficiary_reach_rate)};">
                        ${utils.formatPercentage(snapshot.beneficiary_reach_rate)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge" style="background-color: ${utils.calculateRateColor(snapshot.financial_burn_rate, 'financial')};">
                        ${utils.formatPercentage(snapshot.financial_burn_rate)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${utils.getStatusClass(overallStatus)}">
                        ${utils.getStatusIcon(overallStatus)} ${overallStatus}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary drill-down-btn" data-project-id="${snapshot.project_id}">
                        <i class="bi bi-zoom-in"></i> Drill Down
                    </button>
                </td>
            </tr>
        `;
    }
    
    async renderSingleProjectView(projectId) {
        const overviewEl = document.getElementById('performance-overview');
        const contentEl = document.getElementById('project-content');
        
        if (this.currentSnapshot && this.currentSnapshot.snapshots && this.currentSnapshot.snapshots.length > 0) {
            const projectSnapshot = this.currentSnapshot.snapshots[0];
            overviewEl.innerHTML = this.renderPerformanceOverview(projectSnapshot);
            
            // Load activities for drill-down
            const activities = await monthlyTrackingService.getProjectActivities(projectId, {
                limit: 100
            });
            
            contentEl.innerHTML = `
                <div class="mb-4">
                    <button class="btn btn-secondary btn-sm" id="backToAllProjects">
                        <i class="bi bi-arrow-left"></i> Back to All Projects
                    </button>
                </div>
                
                ${this.renderActivityDrillDown(activities, projectSnapshot)}
            `;
            
            // Attach back button event
            document.getElementById('backToAllProjects')?.addEventListener('click', () => {
                this.selectedProjects = [];
                document.getElementById('projectFilter').value = 'all';
                this.loadData();
            });
        }
    }
    
    renderActivityDrillDown(activities, projectSnapshot) {
        return `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Activity Drill-Down</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" id="viewTimelineBtn">
                            <i class="bi bi-calendar3"></i> Timeline View
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Activity Stats -->
                    <div class="row mb-3">
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded">
                                <div class="fs-4 fw-bold">${projectSnapshot.total_activities || 0}</div>
                                <div class="text-muted small">Total Activities</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded" style="border-color: #10b981 !important;">
                                <div class="fs-4 fw-bold text-success">${projectSnapshot.completed_activities || 0}</div>
                                <div class="text-muted small">Completed</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded" style="border-color: #f59e0b !important;">
                                <div class="fs-4 fw-bold text-warning">${projectSnapshot.in_progress_activities || 0}</div>
                                <div class="text-muted small">In Progress</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded" style="border-color: #ef4444 !important;">
                                <div class="fs-4 fw-bold text-danger">${projectSnapshot.overdue_activities || 0}</div>
                                <div class="text-muted small">Overdue</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activity Filters -->
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <select class="form-select form-select-sm" id="activityStatusFilter">
                                <option value="">All Statuses</option>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Planned">Planned</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="text" class="form-control form-control-sm" id="activitySearchInput" placeholder="Search activities...">
                        </div>
                    </div>
                    
                    <!-- Activity List -->
                    <div id="activityList">
                        ${this.renderActivityList(activities)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderActivityList(activities) {
        if (!activities || activities.length === 0) {
            return '<p class="text-muted">No activities found</p>';
        }
        
        return `
            <div class="list-group">
                ${activities.map(activity => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${activity.activity_name || 'Unnamed Activity'}</h6>
                                <p class="mb-1 text-muted small">${activity.location || 'No location'}</p>
                                <div class="mt-2">
                                    <span class="badge me-2" style="background-color: ${utils.getActivityStatusColor(activity.status)};">
                                        ${activity.status}
                                    </span>
                                    ${activity.thematic_area ? `<span class="badge bg-secondary">${activity.thematic_area}</span>` : ''}
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="small text-muted mb-2">${utils.formatDate(activity.activity_date)}</div>
                                <div><strong>${activity.males + activity.females + activity.other_gender}</strong> beneficiaries</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderComparativeView() {
        // Similar to all projects but filtered to selected projects only
        this.renderAllProjectsView();
    }
    
    calculateAggregateRates(snapshots) {
        if (!snapshots || snapshots.length === 0) {
            return {
                programmatic_performance_rate: 0,
                activity_completion_rate: 0,
                beneficiary_reach_rate: 0,
                financial_burn_rate: 0
            };
        }
        
        const sum = snapshots.reduce((acc, s) => ({
            programmatic: acc.programmatic + (s.programmatic_performance_rate || 0),
            activity: acc.activity + (s.activity_completion_rate || 0),
            beneficiary: acc.beneficiary + (s.beneficiary_reach_rate || 0),
            financial: acc.financial + (s.financial_burn_rate || 0)
        }), { programmatic: 0, activity: 0, beneficiary: 0, financial: 0 });
        
        const count = snapshots.length;
        
        return {
            programmatic_performance_rate: sum.programmatic / count,
            activity_completion_rate: sum.activity / count,
            beneficiary_reach_rate: sum.beneficiary / count,
            financial_burn_rate: sum.financial / count
        };
    }
    
    attachEventListeners() {
        // Apply Filters button
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Generate Snapshot button
        document.getElementById('generateSnapshotBtn')?.addEventListener('click', () => {
            this.generateSnapshot();
        });
        
        // Compare Mode toggle
        document.getElementById('compareModeToggle')?.addEventListener('change', (e) => {
            this.compareMode = e.target.checked;
            this.loadData();
        });
        
        // Drill-down buttons (delegated)
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('drill-down-btn') || e.target.closest('.drill-down-btn')) {
                const btn = e.target.classList.contains('drill-down-btn') ? e.target : e.target.closest('.drill-down-btn');
                const projectId = btn.getAttribute('data-project-id');
                if (projectId) {
                    this.drillDownToProject(projectId);
                }
            }
        });
    }
    
    applyFilters() {
        const projectSelect = document.getElementById('projectFilter');
        const monthSelect = document.getElementById('monthFilter');
        const yearSelect = document.getElementById('yearFilter');
        
        this.currentMonth = parseInt(monthSelect.value);
        this.currentYear = parseInt(yearSelect.value);
        
        const selectedOptions = Array.from(projectSelect.selectedOptions);
        if (selectedOptions.some(opt => opt.value === 'all')) {
            this.selectedProjects = [];
        } else {
            this.selectedProjects = selectedOptions.map(opt => opt.value);
        }
        
        this.loadData();
    }
    
    async generateSnapshot() {
        try {
            const confirm = window.confirm(`Generate snapshot for ${utils.formatMonth(this.currentMonth, this.currentYear)}?`);
            if (!confirm) return;
            
            this.showLoading(true);
            
            await monthlyTrackingService.generateSnapshot(
                this.currentMonth,
                this.currentYear,
                this.selectedProjects.length === 1 ? this.selectedProjects[0] : null
            );
            
            alert('Snapshot generated successfully!');
            await this.loadData();
            
        } catch (error) {
            console.error('Error generating snapshot:', error);
            alert('Failed to generate snapshot. Please try again.');
            this.showLoading(false);
        }
    }
    
    drillDownToProject(projectId) {
        this.selectedProjects = [projectId];
        const projectSelect = document.getElementById('projectFilter');
        projectSelect.value = projectId;
        this.loadData();
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }
    
    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Export for use in other modules
export default MonthlyTrackingDashboard;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('monthlyTrackingDashboard');
    if (container) {
        window.monthlyTrackingDashboard = new MonthlyTrackingDashboard('monthlyTrackingDashboard');
    }
});
