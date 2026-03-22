/**
 * Enhanced Indicator List Component
 * 
 * Features:
 * - Scope filtering tabs (All / AWYAD / Project)
 * - Additional filters (Level, Project, Thematic Area)
 * - Q4 quarterly display
 * - LOP progress
 * - Mapping interface for AWYAD indicators
 * - Color-coded progress bars
 * 
 * @module indicatorListEnhanced
 */

import { apiService } from '../apiService.js';
import { createCard, showNotification } from '../components.js';
import {
    formatIndicatorValue,
    calculateProgress,
    createScopeBadge,
    createLevelBadge,
    createProgressBar
} from '../utils/indicatorUtils.js';
import { showCreateIndicatorModal, showEditIndicatorModal } from './indicatorFormEnhanced.js';
import { showIndicatorMappingModal } from './indicatorMapping.js';

/**
 * Render enhanced indicator list
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Filter options
 */
export async function renderIndicatorList(container, options = {}) {
    try {
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div><p>Loading indicators...</p></div>';

        // Fetch indicators with filters
        const queryParams = new URLSearchParams(options);
        const response = await apiService.get(`/indicators?${queryParams.toString()}&limit=1000`);
        const indicators = response.data?.indicators || response.data || [];

        // Fetch additional data for filters
        const [projectsRes, thematicAreasRes] = await Promise.all([
            apiService.get('/projects?limit=1000'),
            apiService.get('/dashboard/thematic-areas')
        ]);

        const projects = projectsRes.data?.projects || projectsRes.data || [];
        const thematicAreas = thematicAreasRes.data || [];

        // Render the complete interface
        container.innerHTML = createIndicatorListHTML(indicators, projects, thematicAreas, options);

        // Initialize handlers
        initializeListHandlers(container, options);

    } catch (error) {
        console.error('Error rendering indicator list:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load indicators: ${error.message}
            </div>
        `;
    }
}

/**
 * Create indicator list HTML
 */
function createIndicatorListHTML(indicators, projects, thematicAreas, currentFilters) {
    // Calculate summary statistics
    const awyadCount = indicators.filter(i => i.indicator_scope === 'awyad').length;
    const projectCount = indicators.filter(i => i.indicator_scope === 'project').length;
    const onTrack = indicators.filter(i => {
        const pct = i.annual_target > 0 ? (i.achieved / i.annual_target) * 100 : 0;
        return pct >= 70;
    }).length;

    return `
        <!-- Action Bar -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h4 class="mb-0"><i class="bi bi-graph-up"></i> Indicators</h4>
                <small class="text-muted">${indicators.length} total indicators</small>
            </div>
            <div>
                <button class="btn btn-primary" onclick="window.createIndicator()">
                    <i class="bi bi-plus-circle"></i> New Indicator
                </button>
            </div>
        </div>

        <!-- Scope Filters (Tabs) -->
        <ul class="nav nav-tabs mb-3" id="indicatorScopeTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link ${!currentFilters.indicator_scope ? 'active' : ''}" 
                        data-scope="" type="button">
                    All <span class="badge bg-secondary">${indicators.length}</span>
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link ${currentFilters.indicator_scope === 'awyad' ? 'active' : ''}" 
                        data-scope="awyad" type="button">
                    <i class="bi bi-globe"></i> AWYAD <span class="badge bg-primary">${awyadCount}</span>
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link ${currentFilters.indicator_scope === 'project' ? 'active' : ''}" 
                        data-scope="project" type="button">
                    <i class="bi bi-folder"></i> Project <span class="badge bg-info">${projectCount}</span>
                </button>
            </li>
        </ul>

        <!-- Additional Filters -->
        <div class="card mb-3">
            <div class="card-body">
                <form id="indicatorFiltersForm" class="row g-3">
                    <div class="col-md-3">
                        <label for="filterLevel" class="form-label">Level</label>
                        <select class="form-select form-select-sm" id="filterLevel" name="indicator_level">
                            <option value="">All Levels</option>
                            <option value="Output" ${currentFilters.indicator_level === 'Output' ? 'selected' : ''}>Output</option>
                            <option value="Outcome" ${currentFilters.indicator_level === 'Outcome' ? 'selected' : ''}>Outcome</option>
                            <option value="Impact" ${currentFilters.indicator_level === 'Impact' ? 'selected' : ''}>Impact</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filterProject" class="form-label">Project</label>
                        <select class="form-select form-select-sm" id="filterProject" name="project_id">
                            <option value="">All Projects</option>
                            ${projects.map(p => `
                                <option value="${p.id}" ${currentFilters.project_id === p.id ? 'selected' : ''}>
                                    ${p.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filterThematicArea" class="form-label">Thematic Area</label>
                        <select class="form-select form-select-sm" id="filterThematicArea" name="thematic_area_id">
                            <option value="">All Thematic Areas</option>
                            ${thematicAreas.map(ta => `
                                <option value="${ta.id}" ${currentFilters.thematic_area_id === ta.id ? 'selected' : ''}>
                                    ${ta.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filterSearch" class="form-label">Search</label>
                        <input type="text" class="form-control form-control-sm" id="filterSearch" 
                               name="search" placeholder="Search indicators..."
                               value="${currentFilters.search || ''}">
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-sm btn-primary">
                            <i class="bi bi-funnel"></i> Apply Filters
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" id="clearFiltersBtn">
                            <i class="bi bi-x-circle"></i> Clear
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Indicators Table -->
        <div class="card">
            <div class="card-body">
                ${indicators.length === 0 ? `
                    <div class="alert alert-info text-center">
                        <i class="bi bi-info-circle"></i> No indicators found. Try adjusting your filters or create a new indicator.
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="table table-hover table-sm">
                            <thead class="table-light">
                                <tr>
                                    <th style="width: 80px;">Scope</th>
                                    <th style="width: 80px;">Level</th>
                                    <th>Indicator Name</th>
                                    <th style="width: 120px;">Type</th>
                                    <th style="width: 100px;">Q1</th>
                                    <th style="width: 100px;">Q2</th>
                                    <th style="width: 100px;">Q3</th>
                                    <th style="width: 100px;">Q4</th>
                                    <th style="width: 150px;">LOP Progress</th>
                                    <th style="width: 200px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${indicators.map(indicator => createIndicatorRow(indicator)).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

/**
 * Create indicator row HTML
 */
function createIndicatorRow(indicator) {
    const q1Progress = calculateProgress(indicator.q1_achieved || 0, indicator.q1_target || 0, indicator.data_type);
    const q2Progress = calculateProgress(indicator.q2_achieved || 0, indicator.q2_target || 0, indicator.data_type);
    const q3Progress = calculateProgress(indicator.q3_achieved || 0, indicator.q3_target || 0, indicator.data_type);
    const q4Progress = calculateProgress(indicator.q4_achieved || 0, indicator.q4_target || 0, indicator.data_type);
    const lopProgress = calculateProgress(indicator.achieved || 0, indicator.lop_target || 0, indicator.data_type);

    return `
        <tr data-indicator-id="${indicator.id}">
            <td>${createScopeBadge(indicator.indicator_scope)}</td>
            <td>${createLevelBadge(indicator.indicator_level)}</td>
            <td>
                <div>
                    <strong>${indicator.name}</strong>
                    ${indicator.indicator_scope === 'project' && indicator.project_name ? `
                        <br><small class="text-muted"><i class="bi bi-folder"></i> ${indicator.project_name}</small>
                    ` : ''}
                    ${indicator.indicator_scope === 'awyad' && indicator.thematic_area_name ? `
                        <br><small class="text-muted"><i class="bi bi-tag"></i> ${indicator.thematic_area_name}</small>
                    ` : ''}
                    ${indicator.result_area ? `
                        <br><small class="text-muted"><i class="bi bi-bullseye"></i> ${indicator.result_area}</small>
                    ` : ''}
                </div>
            </td>
            <td>
                <span class="badge ${indicator.data_type === 'Percentage' ? 'bg-warning' : 'bg-info'}">
                    ${indicator.data_type}
                </span>
                <br><small class="text-muted">${indicator.unit}</small>
            </td>
            <td>${createQuarterBadge(q1Progress)}</td>
            <td>${createQuarterBadge(q2Progress)}</td>
            <td>${createQuarterBadge(q3Progress)}</td>
            <td>${createQuarterBadge(q4Progress)}</td>
            <td>
                <div class="progress mb-1" style="height: 20px;">
                    <div class="progress-bar ${lopProgress.cssClass}" 
                         style="width: ${Math.min(lopProgress.percentage, 100)}%">
                        ${lopProgress.percentage}%
                    </div>
                </div>
                <small class="text-muted">
                    ${formatIndicatorValue(indicator.achieved, indicator.data_type, indicator.unit)} / 
                    ${formatIndicatorValue(indicator.lop_target, indicator.data_type, indicator.unit)}
                </small>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    ${indicator.indicator_scope === 'awyad' ? `
                        <button class="btn btn-outline-primary mapping-btn" 
                                data-indicator-id="${indicator.id}"
                                title="Manage Mappings">
                            <i class="bi bi-diagram-3"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-secondary edit-btn" 
                            data-indicator-id="${indicator.id}"
                            title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-btn" 
                            data-indicator-id="${indicator.id}"
                            title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Create quarter badge
 */
function createQuarterBadge(progress) {
    const color = progress.percentage >= 70 ? 'success' : progress.percentage >= 40 ? 'warning' : 'danger';
    return `
        <div class="text-center">
            <span class="badge bg-${color} rounded-pill" style="font-size: 0.85rem;">
                ${progress.percentage}%
            </span>
            <br>
            <small class="text-muted" style="font-size: 0.75rem;">
                ${progress.achieved}/${progress.target}
            </small>
        </div>
    `;
}

/**
 * Initialize list handlers
 */
function initializeListHandlers(container, currentFilters) {
    // Handle scope tab clicks
    container.querySelectorAll('#indicatorScopeTabs button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scope = e.currentTarget.dataset.scope;
            const newFilters = { ...currentFilters };
            if (scope) {
                newFilters.indicator_scope = scope;
            } else {
                delete newFilters.indicator_scope;
            }
            renderIndicatorList(container, newFilters);
        });
    });

    // Handle filter form submission
    const filterForm = container.querySelector('#indicatorFiltersForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            const newFilters = { ...currentFilters };
            
            for (const [key, value] of formData.entries()) {
                if (value) {
                    newFilters[key] = value;
                } else {
                    delete newFilters[key];
                }
            }
            
            renderIndicatorList(container, newFilters);
        });
    }

    // Handle clear filters
    const clearBtn = container.querySelector('#clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            renderIndicatorList(container, {});
        });
    }

    // Handle edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indicatorId = e.currentTarget.dataset.indicatorId;
            showEditIndicatorModal(indicatorId, () => {
                renderIndicatorList(container, currentFilters);
            });
        });
    });

    // Handle delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const indicatorId = e.currentTarget.dataset.indicatorId;
            await handleDeleteIndicator(indicatorId, container, currentFilters);
        });
    });

    // Handle mapping buttons
    container.querySelectorAll('.mapping-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indicatorId = e.currentTarget.dataset.indicatorId;
            showIndicatorMappingModal(indicatorId, () => {
                renderIndicatorList(container, currentFilters);
            });
        });
    });
}

/**
 * Handle delete indicator
 */
async function handleDeleteIndicator(indicatorId, container, currentFilters) {
    if (!confirm('Are you sure you want to delete this indicator? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await apiService.delete(`/indicators/${indicatorId}`);

        if (response.success) {
            showNotification('Indicator deleted successfully!', 'success');
            renderIndicatorList(container, currentFilters);
        }
    } catch (error) {
        console.error('Error deleting indicator:', error);
        showNotification(`Failed to delete indicator: ${error.message}`, 'danger');
    }
}

// Global function for backward compatibility
window.renderIndicatorList = renderIndicatorList;

export {
    renderIndicatorList
};
