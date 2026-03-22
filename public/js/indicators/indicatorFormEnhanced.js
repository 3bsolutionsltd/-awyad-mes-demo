/**
 * Enhanced Indicator Form Module - Two-Tier System
 * 
 * Supports:
 * - AWYAD indicators (strategic, linked to thematic areas)
 * - Project indicators (project-specific, linked to result areas)
 * - Dynamic form fields based on scope selection
 * - Q4 quarterly breakdown
 * - LOP (Life of Project) targets
 * - Percentage vs Number data types
 * - Indicator levels (Output, Outcome, Impact)
 * 
 * @module indicatorFormEnhanced
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';
import { 
    formatIndicatorValue, 
    validateIndicatorValue, 
    validateQuarterlySum,
    createScopeBadge,
    createLevelBadge
} from './utils/indicatorUtils.js';

/**
 * Show create indicator modal with two-tier support
 */
export async function showCreateIndicatorModal(onSuccess) {
    try {
        // Fetch required data
        const [projectsRes, thematicAreasRes] = await Promise.all([
            apiService.get('/projects?limit=1000'),
            apiService.get('/dashboard/thematic-areas')
        ]);

        const projects = projectsRes.data?.projects || projectsRes.data || [];
        const thematicAreas = thematicAreasRes.data || [];

        const formHTML = createIndicatorFormHTML(null, projects, thematicAreas);

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveIndicatorBtn">
                <i class="bi bi-check-lg"></i> Create Indicator
            </button>
        `;

        const modalHTML = createModal({
            id: 'createIndicatorModal',
            title: '<i class="bi bi-plus-circle"></i> Create New Indicator',
            body: formHTML,
            footer: footerHTML,
            size: 'xl'
        });

        // Remove existing modal if present
        const existingModal = document.getElementById('createIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('createIndicatorModal'));
        modal.show();

        // Initialize form handlers
        initializeFormHandlers('createIndicatorForm', null, onSuccess, modal);

    } catch (error) {
        console.error('Error showing create indicator modal:', error);
        showNotification(`Failed to load form: ${error.message}`, 'danger');
    }
}

/**
 * Show edit indicator modal
 */
export async function showEditIndicatorModal(indicatorId, onSuccess) {
    try {
        // Fetch required data
        const [indicatorRes, projectsRes, thematicAreasRes, awyadIndicatorsRes] = await Promise.all([
            apiService.get(`/indicators/${indicatorId}`),
            apiService.get('/projects?limit=1000'),
            apiService.get('/dashboard/thematic-areas'),
            apiService.get('/indicators/scope/awyad')
        ]);

        const indicator = indicatorRes.data;
        const projects = projectsRes.data?.projects || projectsRes.data || [];
        const thematicAreas = thematicAreasRes.data || [];
        const awyadIndicators = awyadIndicatorsRes.data || [];

        const formHTML = createIndicatorFormHTML(indicator, projects, thematicAreas, awyadIndicators);

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveIndicatorBtn">
                <i class="bi bi-check-lg"></i> Update Indicator
            </button>
        `;

        const modalHTML = createModal({
            id: 'editIndicatorModal',
            title: '<i class="bi bi-pencil-square"></i> Edit Indicator',
            body: formHTML,
            footer: footerHTML,
            size: 'xl'
        });

        // Remove existing modal if present
        const existingModal = document.getElementById('editIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editIndicatorModal'));
        modal.show();

        // Initialize form handlers
        initializeFormHandlers('editIndicatorForm', indicator, onSuccess, modal);

    } catch (error) {
        console.error('Error showing edit indicator modal:', error);
        showNotification(`Failed to load indicator: ${error.message}`, 'danger');
    }
}

/**
 * Create indicator form HTML
 */
function createIndicatorFormHTML(indicator, projects, thematicAreas, awyadIndicators = []) {
    const isEdit = !!indicator;
    const scope = indicator?.indicator_scope || 'project';

    return `
        <form id="${isEdit ? 'edit' : 'create'}IndicatorForm" class="needs-validation" novalidate>
            
            <!-- Step 1: Indicator Scope Selection -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-1-circle"></i> Step 1: Select Indicator Scope
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="indicator_scope" 
                                       id="scopeAWYAD" value="awyad" 
                                       ${scope === 'awyad' ? 'checked' : ''} 
                                       ${isEdit ? 'disabled' : ''}>
                                <label class="form-check-label" for="scopeAWYAD">
                                    <strong><i class="bi bi-globe"></i> AWYAD Indicator</strong>
                                    <small class="d-block text-muted">Strategic/Overall indicator aggregated from projects</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="indicator_scope" 
                                       id="scopeProject" value="project" 
                                       ${scope === 'project' ? 'checked' : ''} 
                                       ${isEdit ? 'disabled' : ''}>
                                <label class="form-check-label" for="scopeProject">
                                    <strong><i class="bi bi-folder"></i> Project Indicator</strong>
                                    <small class="d-block text-muted">Project-specific indicator</small>
                                </label>
                            </div>
                        </div>
                    </div>
                    ${isEdit ? '<small class="text-info"><i class="bi bi-info-circle"></i> Scope cannot be changed after creation</small>' : ''}
                </div>
            </div>

            <!-- Step 2: Conditional Fields Based on Scope -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-2-circle"></i> Step 2: Indicator Details
                </div>
                <div class="card-body">
                    
                    <!-- AWYAD Specific Fields -->
                    <div id="awyadFields" class="scope-fields" style="display: ${scope === 'awyad' ? 'block' : 'none'};">
                        <div class="mb-3">
                            <label for="thematicArea" class="form-label">
                                Thematic Area <span class="text-danger">*</span>
                                <i class="bi bi-info-circle" data-bs-toggle="tooltip" 
                                   title="AWYAD indicators are linked to thematic areas, not specific projects"></i>
                            </label>
                            <select class="form-select" id="thematicArea" name="thematic_area_id">
                                <option value="">Select Thematic Area</option>
                                ${thematicAreas.map(ta => `
                                    <option value="${ta.id}" ${indicator?.thematic_area_id === ta.id ? 'selected' : ''}>
                                        ${ta.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Project Specific Fields -->
                    <div id="projectFields" class="scope-fields" style="display: ${scope === 'project' ? 'block' : 'none'};">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="project" class="form-label">
                                    Project <span class="text-danger">*</span>
                                </label>
                                <select class="form-select" id="project" name="project_id">
                                    <option value="">Select Project</option>
                                    ${projects.map(p => `
                                        <option value="${p.id}" ${indicator?.project_id === p.id ? 'selected' : ''}>
                                            ${p.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="resultArea" class="form-label">
                                    Result Area <span class="text-danger">*</span>
                                    <i class="bi bi-info-circle" data-bs-toggle="tooltip" 
                                       title="The result area this project indicator contributes to"></i>
                                </label>
                                <input type="text" class="form-control" id="resultArea" name="result_area" 
                                       placeholder="e.g., Education, Health, Livelihoods"
                                       value="${indicator?.result_area || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- Common Fields (Both Scopes) -->
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="indicatorLevel" class="form-label">
                                Indicator Level <span class="text-danger">*</span>
                                <i class="bi bi-info-circle" data-bs-toggle="tooltip" 
                                   title="Output: Direct results | Outcome: Medium-term effects | Impact: Long-term changes"></i>
                            </label>
                            <select class="form-select" id="indicatorLevel" name="indicator_level" required>
                                <option value="">Select Level</option>
                                <option value="Output" ${indicator?.indicator_level === 'Output' ? 'selected' : ''}>Output</option>
                                <option value="Outcome" ${indicator?.indicator_level === 'Outcome' ? 'selected' : ''}>Outcome</option>
                                <option value="Impact" ${indicator?.indicator_level === 'Impact' ? 'selected' : ''}>Impact</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="dataType" class="form-label">
                                Data Type <span class="text-danger">*</span>
                                <i class="bi bi-info-circle" data-bs-toggle="tooltip" 
                                   title="Number: Count/amount | Percentage: Values 0-100%"></i>
                            </label>
                            <select class="form-select" id="dataType" name="data_type" required>
                                <option value="Number" ${indicator?.data_type === 'Number' ? 'selected' : ''}>Number</option>
                                <option value="Percentage" ${indicator?.data_type === 'Percentage' ? 'selected' : ''}>Percentage</option>
                            </select>
                            <small class="text-muted">
                                <span id="dataTypeHelp">Choose Number for counts, Percentage for rates (will be validated to ≤100%)</span>
                            </small>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="indicatorName" class="form-label">
                            Indicator Name <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" id="indicatorName" name="name" 
                               required maxlength="500" 
                               placeholder="e.g., Number of beneficiaries reached"
                               value="${indicator?.name || ''}">
                    </div>

                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <textarea class="form-control" id="description" name="description" rows="2"
                                  placeholder="Optional: Additional details about this indicator">${indicator?.description || ''}</textarea>
                    </div>

                    <div class="mb-3">
                        <label for="unit" class="form-label">
                            Unit of Measurement <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" id="unit" name="unit" 
                               required maxlength="50"
                               placeholder="e.g., people, households, sessions, %, trainings"
                               value="${indicator?.unit || ''}">
                    </div>

                </div>
            </div>

            <!-- Step 3: Baseline and Targets -->
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-3-circle"></i> Step 3: Baseline & Targets
                </div>
                <div class="card-body">
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="baseline" class="form-label">
                                Baseline Value <span class="text-danger">*</span>
                            </label>
                            <input type="number" class="form-control" id="baseline" name="baseline" 
                                   required min="0" step="any"
                                   value="${indicator?.baseline || 0}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="baselineDate" class="form-label">
                                Baseline Date <span class="text-danger">*</span>
                            </label>
                            <input type="date" class="form-control" id="baselineDate" name="baseline_date" 
                                   required
                                   value="${indicator?.baseline_date || ''}">
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="lopTarget" class="form-label">
                                LOP Target <span class="text-danger">*</span>
                                <i class="bi bi-question-circle" data-bs-toggle="tooltip" 
                                   title="Life of Project Target: The total target to be achieved by project end"></i>
                            </label>
                            <input type="number" class="form-control" id="lopTarget" name="lop_target" 
                                   required min="0" step="any"
                                   value="${indicator?.lop_target || 0}">
                            <small class="text-muted">Life of Project Target</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="annualTarget" class="form-label">
                                Annual Target <span class="text-danger">*</span>
                            </label>
                            <input type="number" class="form-control" id="annualTarget" name="annual_target" 
                                   required min="0" step="any"
                                   value="${indicator?.annual_target || 0}">
                        </div>
                    </div>

                    <!-- Quarterly Breakdown -->
                    <div class="mb-3">
                        <label class="form-label fw-bold">
                            Quarterly Breakdown <span class="text-danger">*</span>
                            <i class="bi bi-info-circle" data-bs-toggle="tooltip" 
                               title="Quarterly targets should sum to annual target"></i>
                        </label>
                        <div class="row">
                            <div class="col-md-3 mb-2">
                                <label for="q1Target" class="form-label">Q1 Target</label>
                                <input type="number" class="form-control form-control-sm quarterly-target" 
                                       id="q1Target" name="q1_target" 
                                       min="0" step="any" required
                                       value="${indicator?.q1_target || 0}">
                            </div>
                            <div class="col-md-3 mb-2">
                                <label for="q2Target" class="form-label">Q2 Target</label>
                                <input type="number" class="form-control form-control-sm quarterly-target" 
                                       id="q2Target" name="q2_target" 
                                       min="0" step="any" required
                                       value="${indicator?.q2_target || 0}">
                            </div>
                            <div class="col-md-3 mb-2">
                                <label for="q3Target" class="form-label">Q3 Target</label>
                                <input type="number" class="form-control form-control-sm quarterly-target" 
                                       id="q3Target" name="q3_target" 
                                       min="0" step="any" required
                                       value="${indicator?.q3_target || 0}">
                            </div>
                            <div class="col-md-3 mb-2">
                                <label for="q4Target" class="form-label">Q4 Target</label>
                                <input type="number" class="form-control form-control-sm quarterly-target" 
                                       id="q4Target" name="q4_target" 
                                       min="0" step="any" required
                                       value="${indicator?.q4_target || 0}">
                            </div>
                        </div>
                        <div id="quarterlyValidation" class="mt-2"></div>
                    </div>

                </div>
            </div>

        </form>
    `;
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers(formId, indicator, onSuccess, modal) {
    const form = document.getElementById(formId);
    const saveBtn = document.getElementById('saveIndicatorBtn');

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle scope selection change
    const scopeRadios = form.querySelectorAll('input[name="indicator_scope"]');
    scopeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleScopeFields(e.target.value);
        });
    });

    // Handle data type change
    const dataTypeSelect = form.querySelector('#dataType');
    if (dataTypeSelect) {
        dataTypeSelect.addEventListener('change', (e) => {
            updateDataTypeHelp(e.target.value);
        });
    }

    // Handle quarterly validation
    const quarterlyInputs = form.querySelectorAll('.quarterly-target');
    const annualTargetInput = form.querySelector('#annualTarget');
    
    [...quarterlyInputs, annualTargetInput].forEach(input => {
        input.addEventListener('input', () => validateQuarterlyFields());
    });

    // Handle save button click
    saveBtn.addEventListener('click', async () => {
        await handleSave(formId, indicator, onSuccess, modal);
    });

    // Clean up modal on hide
    const modalElement = modal._element;
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalElement.remove();
    });
}

/**
 * Toggle scope-specific fields
 */
function toggleScopeFields(scope) {
    const awyadFields = document.getElementById('awyadFields');
    const projectFields = document.getElementById('projectFields');

    if (scope === 'awyad') {
        awyadFields.style.display = 'block';
        projectFields.style.display = 'none';
        
        // Make AWYAD fields required
        document.getElementById('thematicArea').required = true;
        document.getElementById('project').required = false;
        document.getElementById('resultArea').required = false;
    } else {
        awyadFields.style.display = 'none';
        projectFields.style.display = 'block';
        
        // Make Project fields required
        document.getElementById('thematicArea').required = false;
        document.getElementById('project').required = true;
        document.getElementById('resultArea').required = true;
    }
}

/**
 * Update data type help text
 */
function updateDataTypeHelp(dataType) {
    const helpEl = document.getElementById('dataTypeHelp');
    if (dataType === 'Percentage') {
        helpEl.textContent = 'Percentage values will be validated to be between 0-100%';
        helpEl.className = 'text-warning';
    } else {
        helpEl.textContent = 'Number values can be any positive value';
        helpEl.className = 'text-m uted';
    }
}

/**
 * Validate quarterly fields sum to annual
 */
function validateQuarterlyFields() {
    const q1 = parseFloat(document.getElementById('q1Target')?.value) || 0;
    const q2 = parseFloat(document.getElementById('q2Target')?.value) || 0;
    const q3 = parseFloat(document.getElementById('q3Target')?.value) || 0;
    const q4 = parseFloat(document.getElementById('q4Target')?.value) || 0;
    const annual = parseFloat(document.getElementById('annualTarget')?.value) || 0;

    const validation = validateQuarterlySum(q1, q2, q3, q4, annual);
    const validationEl = document.getElementById('quarterlyValidation');

    if (!validation.valid && annual > 0) {
        validationEl.innerHTML = `
            <div class="alert alert-warning alert-sm py-1">
                <i class="bi bi-exclamation-triangle"></i> ${validation.message}
            </div>
        `;
    } else if (validation.valid && annual > 0) {
        validationEl.innerHTML = `
            <div class="alert alert-success alert-sm py-1">
                <i class="bi bi-check-circle"></i> Quarterly targets match annual target
            </div>
        `;
    } else {
        validationEl.innerHTML = '';
    }
}

/**
 * Handle form save
 */
async function handleSave(formId, indicator, onSuccess, modal) {
    const form = document.getElementById(formId);
    const saveBtn = document.getElementById('saveIndicatorBtn');

    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Additional validation for percentage values
    const dataType = data.data_type;
    if (dataType === 'Percentage') {
        const percentageFields = [
            'baseline', 'lop_target', 'annual_target',
            'q1_target', 'q2_target', 'q3_target', 'q4_target'
        ];

        for (const field of percentageFields) {
            const value = parseFloat(data[field]);
            if (value > 100) {
                showNotification(`${field.replace(/_/g, ' ')} cannot exceed 100% for percentage indicators`, 'danger');
                return;
            }
        }
    }

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

        let response;
        if (indicator) {
            // Update
            response = await apiService.put(`/indicators/${indicator.id}`, data);
        } else {
            // Create
            response = await apiService.post('/indicators', data);
        }

        if (response.success) {
            showNotification(
                `Indicator ${indicator ? 'updated' : 'created'} successfully!`,
                'success'
            );
            modal.hide();
            if (onSuccess) onSuccess(response.data);
        }
    } catch (error) {
        console.error('Error saving indicator:', error);
        showNotification(
            `Failed to ${indicator ? 'update' : 'create'} indicator: ${error.message}`,
            'danger'
        );
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="bi bi-check-lg"></i> ${indicator ? 'Update' : 'Create'} Indicator`;
    }
}

// Global functions for backward compatibility
window.createIndicator = () => {
    showCreateIndicatorModal(() => {
        if (typeof window.renderIndicators === 'function') {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                window.renderIndicators(contentArea);
            }
        }
    });
};

export {
    showCreateIndicatorModal,
    showEditIndicatorModal
};
