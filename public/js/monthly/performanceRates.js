/**
 * Performance Rates Dashboard
 * Display and track 4 key performance rates with historical trends
 */

import monthlyTrackingService from '../services/monthlyTrackingService.js';
import * as utils from '../utils/monthlyUtils.js';

class PerformanceRatesDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();  this.selectedProject = null;
        this.ratesHistory = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadProjects();
            this.render();
            // Start with all projects view
            await this.loadAllProjectsRates();
        } catch (error) {
            console.error('Error initializing performance rates dashboard:', error);
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
    
    async loadAllProjectsRates() {
        try {
            this.showLoading(true);
            
            const data = await monthlyTrackingService.getAllProjectRates(
                this.currentMonth,
                this.currentYear
            );
            
            this.allProjectRates = data.projects || [];
            this.renderAllProjectsView();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading all project rates:', error);
            this.showError('Failed to load performance rates');
            this.showLoading(false);
        }
    }
    
    async loadSingleProjectRates(projectId) {
        try {
            this.showLoading(true);
            
            const [rates, history] = await Promise.all([
                monthlyTrackingService.getPerformanceRates(projectId, this.currentMonth, this.currentYear),
                this.loadRateHistory(projectId)
            ]);
            
            this.currentRates = rates;
            this.ratesHistory = history;
            
            this.renderSingleProjectView();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading single project rates:', error);
            this.showError('Failed to load performance rates');
            this.showLoading(false);
        }
    }
    
    async loadRateHistory(projectId) {
        const endDate = new Date(this.currentYear, this.currentMonth - 1, 1);
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 5); // 6 months total
        
        try {
            const data = await monthlyTrackingService.getRateHistory(
                projectId,
                startDate.toISOString(),
                endDate.toISOString()
            );
            return data.history || [];
        } catch (error) {
            console.error('Error loading rate history:', error);
            return [];
        }
    }
    
    render() {
        this.container.innerHTML = `
            <div class="performance-rates-dashboard">
                ${this.renderFilters()}
                <div id="loadingIndicator" class="text-center my-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="errorMessage" class="alert alert-danger" style="display: none;"></div>
                <div id="ratesContent"></div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderFilters() {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Project</label>
                            <select id="projectSelect" class="form-select">
                                <option value="">All Projects</option>
                                ${this.allProjects.map(p => `
                                    <option value="${p.id}">${p.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Month</label>
                            <select id="monthSelect" class="form-select">
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
                            <select id="yearSelect" class="form-select">
                                ${Array.from({length: 5}, (_, i) => {
                                    const year = this.currentYear - 2 + i;
                                    return `<option value="${year}" ${year === this.currentYear ? 'selected' : ''}>
                                        ${year}
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Actions</label>
                            <div class="d-grid gap-2">
                                <button id="applyFiltersBtn" class="btn btn-primary">
                                    <i class="bi bi-funnel"></i> Apply
                                </button>
                                <button id="exportBtn" class="btn btn-outline-secondary">
                                    <i class="bi bi-download"></i> Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAllProjectsView() {
        const contentEl = document.getElementById('ratesContent');
        
        if (!this.allProjectRates || this.allProjectRates.length === 0) {
            contentEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No performance data available for ${utils.formatMonth(this.currentMonth, this.currentYear)}.
                </div>
            `;
            return;
        }
        
        // Calculate aggregate rates
        const aggregateRates = this.calculateAggregateRates(this.allProjectRates);
        
        contentEl.innerHTML = `
            <h4 class="mb-4">Performance Overview - ${utils.formatMonth(this.currentMonth, this.currentYear)}</h4>
            
            <!-- Aggregate KPI Cards -->
            <div class="row g-3 mb-4">
                ${this.renderRateCard('Programmatic Performance', aggregateRates.programmatic, 'standard')}
                ${this.renderRateCard('Activity Completion', aggregateRates.activity, 'standard')}
                ${this.renderRateCard('Beneficiary Reach', aggregateRates.beneficiary, 'standard')}
                ${this.renderRateCard('Financial Burn Rate', aggregateRates.financial, 'financial')}
            </div>
            
            <!-- Project Breakdown Table -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Project Performance Breakdown</h5>
                </div>
                <div class="card-body">
                    ${this.renderProjectBreakdownTable()}
                </div>
            </div>
        `;
    }
    
    renderSingleProjectView() {
        const contentEl = document.getElementById('ratesContent');
        
        if (!this.currentRates) {
            contentEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No performance data available.
                </div>
            `;
            return;
        }
        
        const project = this.allProjects.find(p => p.id === this.selectedProject);
        const projectName = project ? project.name : 'Unknown Project';
        
        contentEl.innerHTML = `
            <div class="mb-3">
                <button id="backToAllBtn" class="btn btn-secondary btn-sm">
                    <i class="bi bi-arrow-left"></i> Back to All Projects
                </button>
            </div>
            
            <h4 class="mb-4">${projectName} - ${utils.formatMonth(this.currentMonth, this.currentYear)}</h4>
            
            <!-- KPI Cards -->
            <div class="row g-3 mb-4">
                ${this.renderDetailedRateCard('Programmatic Performance', this.currentRates.programmatic_performance)}
                ${this.renderDetailedRateCard('Activity Completion', this.currentRates.activity_completion)}
                ${this.renderDetailedRateCard('Beneficiary Reach', this.currentRates.beneficiary_reach)}
                ${this.renderDetailedRateCard('Financial Burn', this.currentRates.financial_burn)}
            </div>
            
            <!-- Trend Chart -->
            ${this.renderTrendChart()}
        `;
        
        // Attach back button event
        document.getElementById('backToAllBtn')?.addEventListener('click', () => {
            this.selectedProject = null;
            document.getElementById('projectSelect').value = '';
            this.loadAllProjectsRates();
        });
    }
    
    renderRateCard(title, rate, rateType) {
        const status = utils.getRateStatus(rate, rateType);
        const color = utils.calculateRateColor(rate, rateType);
        const statusIcon = utils.getStatusIcon(status);
        
        return `
            <div class="col-md-6 col-lg-3">
                <div class="card h-100" style="border-left: 4px solid ${color};">
                    <div class="card-body text-center">
                        <h6 class="card-title text-muted mb-2">${title}</h6>
                        <div class="display-4 fw-bold mb-2" style="color: ${color};">
                            ${utils.formatPercentage(rate, 1)}
                        </div>
                        <span class="badge ${utils.getStatusClass(status)}">
                            ${statusIcon} ${status}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDetailedRateCard(title, rateData) {
        const rate = rateData.rate || 0;
        const status = rateData.status || 'Unknown';
        const color = utils.calculateRateColor(rate);
        const statusIcon = utils.getStatusIcon(status);
        
        return `
            <div class="col-md-6 col-lg-3">
                <div class="card h-100" style="border-left: 4px solid ${color};">
                    <div class="card-body">
                        <h6 class="card-title text-muted mb-3">${title}</h6>
                        <div class="display-4 fw-bold mb-3" style="color: ${color};">
                            ${utils.formatPercentage(rate, 1)}
                        </div>
                        <span class="badge ${utils.getStatusClass(status)} mb-3">
                            ${statusIcon} ${status}
                        </span>
                        
                        ${this.renderRateDetails(title, rateData)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderRateDetails(title, rateData) {
        switch (title) {
            case 'Programmatic Performance':
                return `
                    <div class="small text-muted mt-2">
                        <div>Target: ${utils.formatLargeNumber(rateData.total_target || 0)}</div>
                        <div>Achieved: ${utils.formatLargeNumber(rateData.total_achieved || 0)}</div>
                        <div>Indicators: ${rateData.indicators_count || 0}</div>
                    </div>
                `;
            case 'Activity Completion':
                return `
                    <div class="small text-muted mt-2">
                        <div>Total: ${rateData.total_activities || 0}</div>
                        <div>Completed: ${rateData.completed_activities || 0}</div>
                        <div>In Progress: ${rateData.in_progress_activities || 0}</div>
                    </div>
                `;
            case 'Beneficiary Reach':
                return `
                    <div class="small text-muted mt-2">
                        <div>Target: ${utils.formatLargeNumber(rateData.target_beneficiaries || 0)}</div>
                        <div>Reached: ${utils.formatLargeNumber(rateData.actual_beneficiaries || 0)}</div>
                        <div>Gap: ${utils.formatLargeNumber(rateData.gap || 0)}</div>
                    </div>
                `;
            case 'Financial Burn':
                return `
                    <div class="small text-muted mt-2">
                        <div>Budget: ${utils.formatCurrency(rateData.total_budget || 0)}</div>
                        <div>Spent: ${utils.formatCurrency(rateData.total_expenditure || 0)}</div>
                        <div>Remaining: ${utils.formatCurrency(rateData.remaining_budget || 0)}</div>
                    </div>
                `;
            default:
                return '';
        }
    }
    
    renderProjectBreakdownTable() {
        if (!this.allProjectRates || this.allProjectRates.length === 0) {
            return '<p class="text-muted">No project data available</p>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th class="text-center">Programmatic</th>
                            <th class="text-center">Activity</th>
                            <th class="text-center">Beneficiary</th>
                            <th class="text-center">Financial</th>
                            <th class="text-center">Average</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.allProjectRates.map(project => {
                            const avgRate = (
                                (project.programmatic_rate || 0) +
                                (project.activity_rate || 0) +
                                (project.beneficiary_rate || 0)
                            ) / 3;
                            
                            return `
                                <tr>
                                    <td><strong>${project.project_name}</strong></td>
                                    <td class="text-center">
                                        <span class="badge" style="background-color: ${utils.calculateRateColor(project.programmatic_rate)};">
                                            ${utils.formatPercentage(project.programmatic_rate)}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge" style="background-color: ${utils.calculateRateColor(project.activity_rate)};">
                                            ${utils.formatPercentage(project.activity_rate)}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge" style="background-color: ${utils.calculateRateColor(project.beneficiary_rate)};">
                                            ${utils.formatPercentage(project.beneficiary_rate)}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge" style="background-color: ${utils.calculateRateColor(project.financial_rate, 'financial')};">
                                            ${utils.formatPercentage(project.financial_rate)}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <strong style="color: ${utils.calculateRateColor(avgRate)};">
                                            ${utils.formatPercentage(avgRate)}
                                        </strong>
                                    </td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary view-details-btn" 
                                                data-project-id="${project.project_id}">
                                            <i class="bi bi-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderTrendChart() {
        if (!this.ratesHistory || this.ratesHistory.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> Insufficient historical data for trend analysis.
                </div>
            `;
        }
        
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">6-Month Performance Trend</h5>
                </div>
                <div class="card-body">
                    <div id="trendChart" style="height: 300px;">
                        <!-- Chart would be rendered here with a charting library like Chart.js -->
                        <p class="text-muted">Trend chart visualization (requires Chart.js integration)</p>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Programmatic</th>
                                        <th>Activity</th>
                                        <th>Beneficiary</th>
                                        <th>Financial</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.ratesHistory.map(h => `
                                        <tr>
                                            <td>${utils.formatMonth(new Date(h.month).getMonth() + 1, new Date(h.month).getFullYear())}</td>
                                            <td>${utils.formatPercentage(h.programmatic_rate)}</td>
                                            <td>${utils.formatPercentage(h.activity_rate)}</td>
                                            <td>${utils.formatPercentage(h.beneficiary_rate)}</td>
                                            <td>${utils.formatPercentage(h.financial_rate)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    calculateAggregateRates(projects) {
        if (!projects || projects.length === 0) {
            return {
                programmatic: 0,
                activity: 0,
                beneficiary: 0,
                financial: 0
            };
        }
        
        const sum = projects.reduce((acc, p) => ({
            programmatic: acc.programmatic + (p.programmatic_rate || 0),
            activity: acc.activity + (p.activity_rate || 0),
            beneficiary: acc.beneficiary + (p.beneficiary_rate || 0),
            financial: acc.financial + (p.financial_rate || 0)
        }), { programmatic: 0, activity: 0, beneficiary: 0, financial: 0 });
        
        const count = projects.length;
        
        return {
            programmatic: sum.programmatic / count,
            activity: sum.activity / count,
            beneficiary: sum.beneficiary / count,
            financial: sum.financial / count
        };
    }
    
    attachEventListeners() {
        // Apply filters
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Export button
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        // View details buttons (delegated)
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn') || e.target.closest('.view-details-btn')) {
                const btn = e.target.classList.contains('view-details-btn') ? e.target : e.target.closest('.view-details-btn');
                const projectId = btn.getAttribute('data-project-id');
                if (projectId) {
                    this.viewProjectDetails(projectId);
                }
            }
        });
    }
    
    applyFilters() {
        const projectSelect = document.getElementById('projectSelect');
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        
        this.currentMonth = parseInt(monthSelect.value);
        this.currentYear = parseInt(yearSelect.value);
        this.selectedProject = projectSelect.value || null;
        
        if (this.selectedProject) {
            this.loadSingleProjectRates(this.selectedProject);
        } else {
            this.loadAllProjectsRates();
        }
    }
    
    viewProjectDetails(projectId) {
        this.selectedProject = projectId;
        document.getElementById('projectSelect').value = projectId;
        this.loadSingleProjectRates(projectId);
    }
    
    exportData() {
        if (!this.allProjectRates || this.allProjectRates.length === 0) {
            alert('No data to export');
            return;
        }
        
        const exportData = this.allProjectRates.map(p => ({
            Project: p.project_name,
            Donor: p.donor,
            'Programmatic Rate': p.programmatic_rate,
            'Activity Rate': p.activity_rate,
            'Beneficiary Rate': p.beneficiary_rate,
            'Financial Rate': p.financial_rate,
            Month: this.currentMonth,
            Year: this.currentYear
        }));
        
        utils.exportToCSV(exportData, `performance-rates-${this.currentMonth}-${this.currentYear}.csv`);
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
export default PerformanceRatesDashboard;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('performanceRatesDashboard');
    if (container) {
        window.performanceRatesDashboard = new PerformanceRatesDashboard('performanceRatesDashboard');
    }
});
