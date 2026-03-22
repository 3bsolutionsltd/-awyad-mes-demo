/**
 * Monthly Comparison Charts Component
 * Visualizations for monthly trends and comparisons
 * Requires Chart.js library
 */

import monthlyTrackingService from '../services/monthlyTrackingService.js';
import * as utils from '../utils/monthlyUtils.js';

class MonthlyCharts {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();
        this.selectedProject = null;
        this.charts = {}; // Store chart instances for cleanup
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is required but not loaded');
            this.showError('Chart.js library is required. Please include it in your HTML.');
            return;
        }
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadProjects();
            this.render();
            await this.loadData();
        } catch (error) {
            console.error('Error initializing monthly charts:', error);
            this.showError('Failed to initialize charts');
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
            
            const projectId = this.selectedProject || (this.allProjects[0]?.id);
            
            if (!projectId) {
                this.showError('No projects available');
                this.showLoading(false);
                return;
            }
            
            // Get 6 months of historical data
            const endDate = new Date(this.currentYear, this.currentMonth - 1, 1);
            const startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 5); // 6 months total
            
            const [snapshotHistory, rateHistory, indicatorHistory] = await Promise.all([
                monthlyTrackingService.getProjectSnapshots(
                    projectId,
                    startDate.toISOString(),
                    endDate.toISOString()
                ),
                monthlyTrackingService.getRateHistory(
                    projectId,
                    startDate.toISOString(),
                    endDate.toISOString()
                ),
                this.loadIndicatorTrends(projectId, startDate, endDate)
            ]);
            
            this.snapshotHistory = snapshotHistory.snapshots || [];
            this.rateHistory = rateHistory.history || [];
            this.indicatorHistory = indicatorHistory;
            
            this.renderCharts();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading chart data:', error);
            this.showError('Failed to load chart data');
            this.showLoading(false);
        }
    }
    
    async loadIndicatorTrends(projectId, startDate, endDate) {
        try {
            // Get all indicators for project
            const project = this.allProjects.find(p => p.id === projectId);
            if (!project || !project.indicators) {
                return [];
            }
            
            // Load trends for each indicator
            const indicatorTrends = await Promise.all(
                project.indicators.slice(0, 5).map(async (indicator) => { // Limit to 5 indicators for readability
                    const data = await monthlyTrackingService.getIndicatorSnapshots(
                        indicator.id,
                        startDate.toISOString(),
                        endDate.toISOString()
                    );
                    return {
                        id: indicator.id,
                        name: indicator.name,
                        data: data.snapshots || []
                    };
                })
            );
            
            return indicatorTrends;
        } catch (error) {
            console.error('Error loading indicator trends:', error);
            return [];
        }
    }
    
    render() {
        this.container.innerHTML = `
            <div class="monthly-charts-container">
                ${this.renderFilters()}
                
                <div id="loadingIndicator" class="text-center my-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                
                <div id="errorMessage" class="alert alert-danger" style="display: none;"></div>
                
                <div id="chartsContent" class="row g-4">
                    <!-- Charts will be rendered here -->
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderFilters() {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Project</label>
                            <select id="projectSelect" class="form-select">
                                ${this.allProjects.map(p => `
                                    <option value="${p.id}" ${p.id === this.selectedProject ? 'selected' : ''}>
                                        ${p.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Period</label>
                            <select id="periodSelect" class="form-select">
                                <option value="6" selected>Last 6 Months</option>
                                <option value="12">Last 12 Months</option>
                                <option value="24">Last 24 Months</option>
                            </select>
                        </div>
                        
                        <div class="col-md-3">
                            <label class="form-label fw-bold">&nbsp;</label>
                            <button id="applyFiltersBtn" class="btn btn-primary w-100">
                                <i class="bi bi-funnel"></i> Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderCharts() {
        const contentEl = document.getElementById('chartsContent');
        
        // Destroy existing charts
        this.destroyCharts();
        
        contentEl.innerHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Performance Rates Trend (6 Months)</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="performanceRatesTrendChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Target vs Achieved</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="targetVsAchievedChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Activity Status Distribution</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="activityStatusChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Top 5 Indicators Achievement Trend</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="indicatorTrendsChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Budget vs Expenditure</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="budgetExpenditureChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Performance Radar</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="performanceRadarChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        // Render individual charts
        this.renderPerformanceRatesTrend();
        this.renderTargetVsAchieved();
        this.renderActivityStatus();
        this.renderIndicatorTrends();
        this.renderBudgetExpenditure();
        this.renderPerformanceRadar();
    }
    
    renderPerformanceRatesTrend() {
        const ctx = document.getElementById('performanceRatesTrendChart');
        if (!ctx || !this.rateHistory || this.rateHistory.length === 0) {
            return;
        }
        
        const labels = this.rateHistory.map(h => {
            const date = new Date(h.month);
            return utils.formatMonth(date.getMonth() + 1, date.getFullYear());
        });
        
        this.charts.performanceRatesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Programmatic',
                        data: this.rateHistory.map(h => h.programmatic_rate || 0),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Activity Completion',
                        data: this.rateHistory.map(h => h.activity_rate || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Beneficiary Reach',
                        data: this.rateHistory.map(h => h.beneficiary_rate || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Financial Burn',
                        data: this.rateHistory.map(h => h.financial_rate || 0),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderTargetVsAchieved() {
        const ctx = document.getElementById('targetVsAchievedChart');
        if (!ctx || !this.snapshotHistory || this.snapshotHistory.length === 0) {
            return;
        }
        
        // Get latest month data
        const latest = this.snapshotHistory[this.snapshotHistory.length - 1];
        
        // Aggregate target vs achieved across all indicators
        const totalTarget = this.snapshotHistory.reduce((sum, s) => sum + (s.target_value || 0), 0);
        const totalAchieved = this.snapshotHistory.reduce((sum, s) => sum + (s.achieved_value || 0), 0);
        
        this.charts.targetVsAchieved = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total'],
                datasets: [
                    {
                        label: 'Target',
                        data: [totalTarget],
                        backgroundColor: '#94a3b8',
                        borderColor: '#64748b',
                        borderWidth: 1
                    },
                    {
                        label: 'Achieved',
                        data: [totalAchieved],
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return utils.formatLargeNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderActivityStatus() {
        const ctx = document.getElementById('activityStatusChart');
        if (!ctx || !this.rateHistory || this.rateHistory.length === 0) {
            return;
        }
        
        // Get latest month activity data
        const latest = this.rateHistory[this.rateHistory.length - 1];
        
        this.charts.activityStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Planned', 'Overdue'],
                datasets: [{
                    data: [
                        latest.completed_activities || 0,
                        latest.in_progress_activities || 0,
                        latest.planned_activities || 0,
                        latest.overdue_activities || 0
                    ],
                    backgroundColor: [
                        '#10b981', // Green
                        '#3b82f6', // Blue
                        '#94a3b8', // Gray
                        '#ef4444'  // Red
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderIndicatorTrends() {
        const ctx = document.getElementById('indicatorTrendsChart');
        if (!ctx || !this.indicatorHistory || this.indicatorHistory.length === 0) {
            return;
        }
        
        const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        
        // Get all unique months across all indicators
        const allMonths = new Set();
        this.indicatorHistory.forEach(indicator => {
            indicator.data.forEach(d => {
                const date = new Date(d.snapshot_month, d.snapshot_year - 1, 1);
                allMonths.add(date.getTime());
            });
        });
        
        const sortedMonths = Array.from(allMonths).sort();
        const labels = sortedMonths.map(timestamp => {
            const date = new Date(timestamp);
            return utils.formatMonth(date.getMonth() + 1, date.getFullYear());
        });
        
        const datasets = this.indicatorHistory.map((indicator, index) => {
            // Map data to the sorted months
            const data = sortedMonths.map(timestamp => {
                const date = new Date(timestamp);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                
                const snapshot = indicator.data.find(d => 
                    d.snapshot_month === month && d.snapshot_year === year
                );
                
                return snapshot ? snapshot.percentage_complete : null;
            });
            
            return {
                label: indicator.name,
                data,
                borderColor: colors[index % colors.length],
                backgroundColor: 'transparent',
                tension: 0.4
            };
        });
        
        this.charts.indicatorTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.parsed.y === null) return null;
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderBudgetExpenditure() {
        const ctx = document.getElementById('budgetExpenditureChart');
        if (!ctx || !this.rateHistory || this.rateHistory.length === 0) {
            return;
        }
        
        // Get latest month data
        const latest = this.rateHistory[this.rateHistory.length - 1];
        
        this.charts.budgetExpenditure = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Budget vs Expenditure'],
                datasets: [
                    {
                        label: 'Total Budget',
                        data: [latest.total_budget || 0],
                        backgroundColor: '#94a3b8',
                        borderColor: '#64748b',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenditure',
                        data: [latest.total_expenditure || 0],
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    },
                    {
                        label: 'Remaining',
                        data: [latest.remaining_budget || 0],
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderPerformanceRadar() {
        const ctx = document.getElementById('performanceRadarChart');
        if (!ctx || !this.rateHistory || this.rateHistory.length === 0) {
            return;
        }
        
        // Get latest month data
        const latest = this.rateHistory[this.rateHistory.length - 1];
        
        this.charts.performanceRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Programmatic',
                    'Activity Completion',
                    'Beneficiary Reach',
                    'Financial Burn'
                ],
                datasets: [{
                    label: 'Current Performance',
                    data: [
                        latest.programmatic_rate || 0,
                        latest.activity_rate || 0,
                        latest.beneficiary_rate || 0,
                        latest.financial_rate || 0
                    ],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed.r.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    attachEventListeners() {
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });
    }
    
    applyFilters() {
        const projectSelect = document.getElementById('projectSelect');
        this.selectedProject = projectSelect.value;
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
export default MonthlyCharts;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('monthlyChartsContainer');
    if (container) {
        window.monthlyCharts = new MonthlyCharts('monthlyChartsContainer');
    }
});
