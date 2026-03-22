/**
 * Reach vs Target Visualization
 * Visual progress bars and gap analysis for indicators
 */

import monthlyTrackingService from '../services/monthlyTrackingService.js';
import * as utils from '../utils/monthlyUtils.js';

class ReachVsTargetVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.projectFilter = null;
        this.sortBy = 'gap_percentage'; // gap_percentage, percentage_achieved, indicator_name
        this.sortOrder = 'desc';
        this.indicators = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadProjects();
            this.render();
            await this.loadData();
        } catch (error) {
            console.error('Error initializing reach vs target:', error);
            this.showError('Failed to initialize visualization');
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
            
            let data;
            if (this.projectFilter) {
                data = await monthlyTrackingService.getProjectIndicatorGaps(this.projectFilter);
                this.indicators = data.gaps || [];
            } else {
                data = await monthlyTrackingService.getReachVsTargetSummary();
                this.indicators = data.largest_gaps || [];
            }
            
            this.sortIndicators();
            this.renderIndicators();
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading reach vs target data:', error);
            this.showError('Failed to load indicator gaps');
            this.showLoading(false);
        }
    }
    
    sortIndicators() {
        this.indicators.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'gap_percentage':
                    aVal = a.gap_percentage || 0;
                    bVal = b.gap_percentage || 0;
                    break;
                case 'percentage_achieved':
                    aVal = a.percentage_achieved || 0;
                    bVal = b.percentage_achieved || 0;
                    break;
                case 'indicator_name':
                    return this.sortOrder === 'asc' 
                        ? a.indicator_name.localeCompare(b.indicator_name)
                        : b.indicator_name.localeCompare(a.indicator_name);
                default:
                    aVal = a.gap_percentage || 0;
                    bVal = b.gap_percentage || 0;
            }
            
            return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }
    
    render() {
        this.container.innerHTML = `
            <div class="reach-vs-target-viz">
                ${this.renderHeader()}
                ${this.renderSummaryStats()}
                <div id="loadingIndicator" class="text-center my-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div id="errorMessage" class="alert alert-danger" style="display: none;"></div>
                <div id="indicatorList"></div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderHeader() {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <!-- Project Filter -->
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Filter by Project</label>
                            <select id="projectFilterSelect" class="form-select">
                                <option value="">All Projects</option>
                                ${this.allProjects.map(p => `
                                    <option value="${p.id}">${p.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <!-- Sort By -->
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Sort By</label>
                            <select id="sortBySelect" class="form-select">
                                <option value="gap_percentage" selected>Largest Gap</option>
                                <option value="percentage_achieved">Percentage Complete</option>
                                <option value="indicator_name">Indicator Name</option>
                            </select>
                        </div>
                        
                        <!-- Sort Order -->
                        <div class="col-md-2">
                            <label class="form-label fw-bold">Order</label>
                            <select id="sortOrderSelect" class="form-select">
                                <option value="desc" selected>Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                        
                        <!-- Actions -->
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Actions</label>
                            <div class="d-grid">
                                <button id="applyFiltersBtn" class="btn btn-primary">
                                    <i class="bi bi-funnel"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSummaryStats() {
        return `<div id="summaryStats"></div>`;
    }
    
    renderIndicators() {
        const listEl = document.getElementById('indicatorList');
        
        if (!this.indicators || this.indicators.length === 0) {
            listEl.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> No indicator gaps found.
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = `
            <div class="row g-3">
                ${this.indicators.map(indicator => this.renderIndicatorCard(indicator)).join('')}
            </div>
        `;
    }
    
    renderIndicatorCard(indicator) {
        const percentageComplete = indicator.percentage_achieved || 0;
        const gap = indicator.gap || 0;
        const gapPercentage = indicator.gap_percentage || 0;
        const status = indicator.status || 'Unknown';
        const statusIcon = utils.getStatusIcon(status);
        const statusColor = utils.calculateRateColor(percentageComplete);
        
        return `
            <div class="col-md-6">
                <div class="card indicator-gap-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${indicator.indicator_name}</h6>
                                <small class="text-muted">${indicator.indicator_code || 'N/A'}</small>
                                ${indicator.project_name ? `<br><small class="text-muted">${indicator.project_name}</small>` : ''}
                            </div>
                            <span class="badge ${utils.getStatusClass(status)}" style="font-size: 0.85rem;">
                                ${statusIcon} ${status}
                            </span>
                        </div>
                        
                        <!-- Target vs Reached -->
                        <div class="row mb-3">
                            <div class="col-6">
                                <div class="small text-muted">Target</div>
                                <div class="fs-5 fw-bold">${utils.formatLargeNumber(indicator.target)}</div>
                            </div>
                            <div class="col-6">
                                <div class="small text-muted">Reached</div>
                                <div class="fs-5 fw-bold">${utils.formatLargeNumber(indicator.achieved)}</div>
                            </div>
                        </div>
                        
                        <!-- Gap Info -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between small text-muted mb-1">
                                <span>Gap: <strong class="text-danger">${utils.formatLargeNumber(gap)}</strong> (${utils.formatPercentage(gapPercentage)})</span>
                                <span>${utils.formatPercentage(percentageComplete)}</span>
                            </div>
                            
                            <!-- Progress Bar -->
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: ${percentageComplete}%; background-color: ${statusColor};"
                                     aria-valuenow="${percentageComplete}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                    ${utils.formatPercentage(percentageComplete, 0)}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Trend & Actions -->
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <small class="text-muted">
                                    <!-- Trend placeholder -->
                                    <i class="bi bi-arrow-right"></i> Stable
                                </small>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary view-details-btn" 
                                        data-indicator-id="${indicator.indicator_id}">
                                    <i class="bi bi-info-circle"></i> Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachEventListeners() {
        // Apply filters button
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // View details buttons (delegated)
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn') || e.target.closest('.view-details-btn')) {
                const btn = e.target.classList.contains('view-details-btn') ? e.target : e.target.closest('.view-details-btn');
                const indicatorId = btn.getAttribute('data-indicator-id');
                if (indicatorId) {
                    this.showIndicatorDetails(indicatorId);
                }
            }
        });
    }
    
    applyFilters() {
        const projectSelect = document.getElementById('projectFilterSelect');
        const sortBySelect = document.getElementById('sortBySelect');
        const sortOrderSelect = document.getElementById('sortOrderSelect');
        
        this.projectFilter = projectSelect.value || null;
        this.sortBy = sortBySelect.value;
        this.sortOrder = sortOrderSelect.value;
        
        this.loadData();
    }
    
    async showIndicatorDetails(indicatorId) {
        try {
            this.showLoading(true);
            
            const [gapData, recommendations] = await Promise.all([
                monthlyTrackingService.getIndicatorGap(indicatorId),
                monthlyTrackingService.getRecommendations(indicatorId)
            ]);
            
            this.renderDetailsModal(gapData, recommendations);
            
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading indicator details:', error);
            alert('Failed to load indicator details');
            this.showLoading(false);
        }
    }
    
    renderDetailsModal(gapData, recommendations) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="indicatorDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${gapData.indicator_name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-3">
                                    <div class="text-center p-3 border rounded">
                                        <div class="fs-4 fw-bold">${utils.formatLargeNumber(gapData.target)}</div>
                                        <div class="text-muted small">Target</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center p-3 border rounded">
                                        <div class="fs-4 fw-bold text-primary">${utils.formatLargeNumber(gapData.achieved)}</div>
                                        <div class="text-muted small">Achieved</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center p-3 border rounded">
                                        <div class="fs-4 fw-bold text-danger">${utils.formatLargeNumber(gapData.gap)}</div>
                                        <div class="text-muted small">Gap</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="text-center p-3 border rounded">
                                        <div class="fs-4 fw-bold text-success">${utils.formatPercentage(gapData.percentage_achieved)}</div>
                                        <div class="text-muted small">Complete</div>
                                    </div>
                                </div>
                            </div>
                            
                            ${recommendations.projection ? `
                                <div class="alert alert-${recommendations.projection.will_reach_target ? 'success' : 'warning'}">
                                    <h6>Projection</h6>
                                    <p class="mb-0">
                                        <strong>${recommendations.projection.projection}</strong>
                                        ${recommendations.projection.projected_value ? ` - Projected value: ${recommendations.projection.projected_value}` : ''}
                                    </p>
                                    <p class="mb-0 small">
                                        Trend: ${recommendations.projection.trend} 
                                        ${recommendations.projection.monthly_growth_rate ? `(${recommendations.projection.monthly_growth_rate}/month)` : ''}
                                    </p>
                                </div>
                            ` : ''}
                            
                            ${recommendations.recommendations && recommendations.recommendations.length > 0 ? `
                                <h6 class="mt-4 mb-3">Recommendations</h6>
                                ${recommendations.recommendations.map(rec => `
                                    <div class="alert alert-${rec.priority === 'High' ? 'danger' : rec.priority === 'Medium' ? 'warning' : 'info'}">
                                        <div class="d-flex justify-content-between">
                                            <strong>${rec.type}</strong>
                                            <span class="badge bg-${rec.priority === 'High' ? 'danger' : rec.priority === 'Medium' ? 'warning' : 'info'}">
                                                ${rec.priority} Priority
                                            </span>
                                        </div>
                                        <p class="mb-1">${rec.message}</p>
                                        <p class="mb-0 small"><em>${rec.action}</em></p>
                                    </div>
                                `).join('')}
                            ` : ''}
                            
                            ${recommendations.suggested_actions && recommendations.suggested_actions.length > 0 ? `
                                <h6 class="mt-4 mb-3">Suggested Actions</h6>
                                <ul>
                                    ${recommendations.suggested_actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('indicatorDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('indicatorDetailsModal'));
        modal.show();
        
        // Clean up modal after close
        document.getElementById('indicatorDetailsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
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
export default ReachVsTargetVisualization;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('reachVsTargetVisualization');
    if (container) {
        window.reachVsTargetVisualization = new ReachVsTargetVisualization('reachVsTargetVisualization');
    }
});
