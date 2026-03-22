/**
 * Indicator Mapping Module
 * 
 * Manages relationships between Project indicators and AWYAD indicators
 * - View mappings
 * - Create new mappings
 * - Delete mappings
 * - Update contribution weights
 * - Trigger aggregation
 * 
 * @module indicatorMapping
 */

import { apiService } from '../apiService.js';
import { createModal, showNotification } from '../components.js';
import { formatIndicatorValue, createScopeBadge, createProgressBar } from '../utils/indicatorUtils.js';

/**
 * Show indicator mapping interface modal
 * @param {string} awyadIndicatorId - AWYAD indicator ID
 * @param {Function} onSuccess - Callback after successful operation
 */
export async function showIndicatorMappingModal(awyadIndicatorId, onSuccess) {
    try {
        // Fetch AWYAD indicator details and current mappings
        const [indicatorRes, mappingsRes, unmappedRes] = await Promise.all([
            apiService.get(`/indicators/${awyadIndicatorId}`),
            apiService.get(`/indicators/mappings/awyad/${awyadIndicatorId}`),
            apiService.get(`/indicators/mappings/unmapped/${awyadIndicatorId}`)
        ]);

        const awyadIndicator = indicatorRes.data;
        const currentMappings = mappingsRes.data || [];
        const unmappedIndicators = unmappedRes.data || [];

        const bodyHTML = createMappingInterfaceHTML(awyadIndicator, currentMappings, unmappedIndicators);

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" id="triggerAggregationBtn">
                <i class="bi bi-arrow-repeat"></i> Recalculate Aggregation
            </button>
        `;

        const modalHTML = createModal({
            id: 'indicatorMappingModal',
            title: `<i class="bi bi-diagram-3"></i> Indicator Mappings - ${awyadIndicator.name}`,
            body: bodyHTML,
            footer: footerHTML,
            size: 'xl'
        });

        // Remove existing modal if present
        const existingModal = document.getElementById('indicatorMappingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('indicatorMappingModal'));
        modal.show();

        // Initialize handlers
        initializeMappingHandlers(awyadIndicatorId, onSuccess, modal);

    } catch (error) {
        console.error('Error showing mapping modal:', error);
        showNotification(`Failed to load mappings: ${error.message}`, 'danger');
    }
}

/**
 * Create mapping interface HTML
 */
function createMappingInterfaceHTML(awyadIndicator, currentMappings, unmappedIndicators) {
    const aggregatedAchieved = awyadIndicator.achieved || 0;
    const aggregatedTarget = awyadIndicator.annual_target || 0;
    const achievementPct = aggregatedTarget > 0 ? ((aggregatedAchieved / aggregatedTarget) * 100).toFixed(1) : 0;

    return `
        <div class="container-fluid">
            
            <!-- AWYAD Indicator Overview -->
            <div class="card mb-3 border-primary">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-globe"></i> AWYAD Indicator Overview
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="text-primary">${awyadIndicator.name}</h6>
                            <p class="text-muted mb-2">${awyadIndicator.description || 'No description provided'}</p>
                            <div class="mb-2">
                                ${createScopeBadge('awyad')}
                                <span class="badge bg-info">${awyadIndicator.data_type}</span>
                                <span class="badge bg-secondary">${awyadIndicator.unit}</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <div class="display-6 text-primary">${achievementPct}%</div>
                                <small class="text-muted">Aggregated Achievement</small>
                                <div class="mt-2">
                                    <strong>${formatIndicatorValue(aggregatedAchieved, awyadIndicator.data_type, awyadIndicator.unit)}</strong>
                                    <span class="text-muted">of</span>
                                    <strong>${formatIndicatorValue(aggregatedTarget, awyadIndicator.data_type, awyadIndicator.unit)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${createProgressBar(aggregatedAchieved, aggregatedTarget, awyadIndicator.data_type)}
                </div>
            </div>

            <!-- Current Mappings -->
            <div class="card mb-3">
                <div class="card-header">
                    <i class="bi bi-link-45deg"></i> Currently Linked Project Indicators
                    <span class="badge bg-primary">${currentMappings.length}</span>
                </div>
                <div class="card-body">
                    ${currentMappings.length === 0 ? `
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle"></i> No project indicators linked yet. Add mappings below to aggregate values.
                        </div>
                    ` : `
                        <div class="table-responsive">
                            <table class="table table-sm table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Project</th>
                                        <th>Indicator</th>
                                        <th>Achieved</th>
                                        <th>Target</th>
                                        <th>Progress</th>
                                        <th style="width: 100px;">Weight</th>
                                        <th style="width: 80px;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="currentMappingsTable">
                                    ${currentMappings.map(mapping => createMappingRow(mapping, awyadIndicator.data_type)).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Aggregation Formula -->
                        <div class="alert alert-light mt-3">
                            <strong><i class="bi bi-calculator"></i> Aggregation Formula:</strong><br>
                            <code>
                                Aggregated Value = Σ (Project Indicator Achieved × Weight) / Total Weight
                            </code>
                        </div>
                    `}
                </div>
            </div>

            <!-- Add New Mapping -->
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-plus-circle"></i> Add New Mapping
                </div>
                <div class="card-body">
                    ${unmappedIndicators.length === 0 ? `
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle"></i> All available project indicators are already mapped.
                        </div>
                    ` : `
                        <form id="addMappingForm" class="row g-3">
                            <div class="col-md-6">
                                <label for="projectIndicatorSelect" class="form-label">Select Project Indicator</label>
                                <select class="form-select" id="projectIndicatorSelect" required>
                                    <option value="">Choose indicator...</option>
                                    ${unmappedIndicators.map(ind => `
                                        <option value="${ind.id}" 
                                                data-achieved="${ind.achieved}"
                                                data-target="${ind.annual_target}"
                                                data-project="${ind.project_name}">
                                            [${ind.project_name}] ${ind.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="contributionWeight" class="form-label">
                                    Contribution Weight
                                    <i class="bi bi-question-circle" data-bs-toggle="tooltip" 
                                       title="Multiplier for this indicator's contribution (default: 1.0)"></i>
                                </label>
                                <input type="number" class="form-control" id="contributionWeight" 
                                       min="0.01" max="100" step="0.1" value="1.0" required>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">&nbsp;</label>
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="bi bi-plus-lg"></i> Add Mapping
                                </button>
                            </div>
                        </form>
                        
                        <!-- Preview Selected Indicator -->
                        <div id="indicatorPreview" class="mt-3" style="display: none;">
                            <div class="alert alert-info">
                                <strong>Selected Indicator:</strong><br>
                                <span id="previewText"></span>
                            </div>
                        </div>
                    `}
                </div>
            </div>

        </div>
    `;
}

/**
 * Create mapping row HTML
 */
function createMappingRow(mapping, dataType) {
    const progress = mapping.annual_target > 0 
        ? ((mapping.achieved / mapping.annual_target) * 100).toFixed(1) 
        : 0;

    return `
        <tr data-mapping-id="${mapping.mapping_id}">
            <td>${mapping.project_name}</td>
            <td>
                <small>${mapping.indicator_name}</small>
            </td>
            <td>${formatIndicatorValue(mapping.achieved, dataType, mapping.unit)}</td>
            <td>${formatIndicatorValue(mapping.annual_target, dataType, mapping.unit)}</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${progress >= 70 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-danger'}" 
                         style="width: ${Math.min(progress, 100)}%">
                        ${progress}%
                    </div>
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm weight-input" 
                       value="${mapping.contribution_weight}" 
                       min="0.01" max="100" step="0.1"
                       data-mapping-id="${mapping.mapping_id}">
            </td>
            <td>
                <button class="btn btn-sm btn-danger delete-mapping-btn" 
                        data-mapping-id="${mapping.mapping_id}"
                        title="Remove mapping">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Initialize mapping handlers
 */
function initializeMappingHandlers(awyadIndicatorId, onSuccess, modal) {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle add mapping form
    const addMappingForm = document.getElementById('addMappingForm');
    if (addMappingForm) {
        addMappingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddMapping(awyadIndicatorId, onSuccess, modal);
        });

        // Handle indicator preview
        const indicatorSelect = document.getElementById('projectIndicatorSelect');
        indicatorSelect.addEventListener('change', (e) => {
            const selected = e.target.selectedOptions[0];
            if (selected && selected.value) {
                const preview = document.getElementById('indicatorPreview');
                const previewText = document.getElementById('previewText');
                previewText.textContent = `Project: ${selected.dataset.project} | Achieved: ${selected.dataset.achieved} | Target: ${selected.dataset.target}`;
                preview.style.display = 'block';
            } else {
                document.getElementById('indicatorPreview').style.display = 'none';
            }
        });
    }

    // Handle delete mapping
    document.querySelectorAll('.delete-mapping-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const mappingId = e.currentTarget.dataset.mappingId;
            await handleDeleteMapping(mappingId, awyadIndicatorId, onSuccess, modal);
        });
    });

    // Handle weight updates
    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const mappingId = e.target.dataset.mappingId;
            const newWeight = parseFloat(e.target.value);
            await handleUpdateWeight(mappingId, newWeight, awyadIndicatorId, onSuccess, modal);
        });
    });

    // Handle trigger aggregation
    document.getElementById('triggerAggregationBtn').addEventListener('click', async () => {
        await handleTriggerAggregation(awyadIndicatorId, onSuccess, modal);
    });

    // Clean up modal on hide
    const modalElement = modal._element;
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalElement.remove();
    });
}

/**
 * Handle add mapping
 */
async function handleAddMapping(awyadIndicatorId, onSuccess, modal) {
    const indicatorId = document.getElementById('projectIndicatorSelect').value;
    const weight = parseFloat(document.getElementById('contributionWeight').value);

    if (!indicatorId) {
        showNotification('Please select a project indicator', 'warning');
        return;
    }

    try {
        const response = await apiService.post('/indicators/mappings', {
            awyad_indicator_id: awyadIndicatorId,
            project_indicator_id: indicatorId,
            contribution_weight: weight
        });

        if (response.success) {
            showNotification('Mapping created successfully!', 'success');
            modal.hide();
            // Reopen modal to show updated mappings
            setTimeout(() => {
                showIndicatorMappingModal(awyadIndicatorId, onSuccess);
            }, 300);
        }
    } catch (error) {
        console.error('Error creating mapping:', error);
        showNotification(`Failed to create mapping: ${error.message}`, 'danger');
    }
}

/**
 * Handle delete mapping
 */
async function handleDeleteMapping(mappingId, awyadIndicatorId, onSuccess, modal) {
    if (!confirm('Are you sure you want to remove this mapping?')) {
        return;
    }

    try {
        const response = await apiService.delete(`/indicators/mappings/${mappingId}`);

        if (response.success) {
            showNotification('Mapping removed successfully!', 'success');
            modal.hide();
            // Reopen modal to show updated mappings
            setTimeout(() => {
                showIndicatorMappingModal(awyadIndicatorId, onSuccess);
            }, 300);
        }
    } catch (error) {
        console.error('Error deleting mapping:', error);
        showNotification(`Failed to remove mapping: ${error.message}`, 'danger');
    }
}

/**
 * Handle update weight
 */
async function handleUpdateWeight(mappingId, newWeight, awyadIndicatorId, onSuccess, modal) {
    try {
        const response = await apiService.put(`/indicators/mappings/${mappingId}`, {
            contribution_weight: newWeight
        });

        if (response.success) {
            showNotification('Weight updated successfully!', 'success');
            // Optionally reload modal to show updated aggregation
            setTimeout(() => {
                modal.hide();
                showIndicatorMappingModal(awyadIndicatorId, onSuccess);
            }, 500);
        }
    } catch (error) {
        console.error('Error updating weight:', error);
        showNotification(`Failed to update weight: ${error.message}`, 'danger');
    }
}

/**
 * Handle trigger aggregation
 */
async function handleTriggerAggregation(awyadIndicatorId, onSuccess, modal) {
    try {
        const btn = document.getElementById('triggerAggregationBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Calculating...';

        const response = await apiService.post(`/indicators/${awyadIndicatorId}/aggregate`);

        if (response.success) {
            showNotification('Aggregation calculated successfully!', 'success');
            modal.hide();
            setTimeout(() => {
                showIndicatorMappingModal(awyadIndicatorId, onSuccess);
            }, 300);
        }
    } catch (error) {
        console.error('Error triggering aggregation:', error);
        showNotification(`Failed to calculate aggregation: ${error.message}`, 'danger');
        const btn = document.getElementById('triggerAggregationBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Recalculate Aggregation';
    }
}

// Global function for easy access
window.showIndicatorMappingModal = showIndicatorMappingModal;

export {
    showIndicatorMappingModal
};
