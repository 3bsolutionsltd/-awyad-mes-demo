/**
 * Unified Indicator Form Component
 * Supports both AWYAD-level and Project-level indicators
 * with dynamic field display based on selected scope
 */

import { authManager } from '../authManager.js';

const API_BASE = '/api/v1';

export class IndicatorForm {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.mode = options.mode || 'create'; // 'create' or 'edit'
        this.indicatorId = options.indicatorId || null;
        this.onSuccess = options.onSuccess || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        this.formData = {
            indicator_scope: 'project',
            indicator_level: 'output',
            data_type: 'number'
        };
        
        this.projects = [];
        this.thematicAreas = [];
        this.aywadIndicators = [];
    }

    async init() {
        await this.loadReferenceData();
        if (this.mode === 'edit' && this.indicatorId) {
            await this.loadIndicatorData();
        }
        this.render();
        this.attachEventListeners();
    }

    async loadReferenceData() {
        try {
            // Load projects
            const projectsResponse = await authManager.authenticatedFetch(`${API_BASE}/projects`);
            const projectsData = await projectsResponse.json();
            if (projectsData.success) {
                this.projects = projectsData.data;
            }

            // Load thematic areas (for AWYAD indicators)
            const thematicResponse = await authManager.authenticatedFetch(`${API_BASE}/configurations?parent_code=THEMATIC_AREAS`);
            const thematicData = await thematicResponse.json();
            if (thematicData.success) {
                this.thematicAreas = thematicData.data;
            }

            // Load AWYAD indicators (for project indicator mapping)
            const aywadResponse = await authManager.authenticatedFetch(`${API_BASE}/indicators?scope=awyad`);
            const aywadData = await aywadResponse.json();
            if (aywadData.success) {
                this.aywadIndicators = aywadData.data;
            }
        } catch (error) {
            console.error('Error loading reference data:', error);
            this.showError('Failed to load reference data');
        }
    }

    async loadIndicatorData() {
        try {
            const response = await authManager.authenticatedFetch(`${API_BASE}/indicators/${this.indicatorId}`);
            const data = await response.json();
            if (data.success) {
                this.formData = data.data;
            }
        } catch (error) {
            console.error('Error loading indicator:', error);
            this.showError('Failed to load indicator data');
        }
    }

    render() {
        const isAwyad = this.formData.indicator_scope === 'awyad';
        const isProject = this.formData.indicator_scope === 'project';

        this.container.innerHTML = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">
                        <i class="bi bi-${this.mode === 'create' ? 'plus-circle' : 'pencil'}"></i>
                        ${this.mode === 'create' ? 'Create New' : 'Edit'} Indicator
                    </h4>
                </div>
                <div class="card-body">
                    <form id="indicator-form">
                        <!-- Alert area for messages -->
                        <div id="form-alert" class="alert alert-dismissible fade" role="alert" style="display: none;">
                            <span id="alert-message"></span>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>

                        <!-- Indicator Scope Selection -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label required">
                                    Indicator Scope
                                    <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                       title="AWYAD indicators are organizational-level. Project indicators are specific to a project."></i>
                                </label>
                                <select class="form-select" id="indicator_scope" name="indicator_scope" required>
                                    <option value="awyad" ${isAwyad ? 'selected' : ''}>AWYAD Indicator (Organizational Level)</option>
                                    <option value="project" ${isProject ? 'selected' : ''}>Project Indicator (Project-Specific)</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label required">
                                    Indicator Level
                                    <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                       title="Output: Direct results, Outcome: Effects on beneficiaries, Impact: Long-term changes"></i>
                                </label>
                                <select class="form-select" id="indicator_level" name="indicator_level" required>
                                    <option value="output" ${this.formData.indicator_level === 'output' ? 'selected' : ''}>Output</option>
                                    <option value="outcome" ${this.formData.indicator_level === 'outcome' ? 'selected' : ''}>Outcome</option>
                                    <option value="impact" ${this.formData.indicator_level === 'impact' ? 'selected' : ''}>Impact</option>
                                </select>
                            </div>
                        </div>

                        <!-- Conditional Fields: Thematic Area (AWYAD) -->
                        <div class="row mb-3 scope-field awyad-only" style="display: ${isAwyad ? 'flex' : 'none'};">
                            <div class="col-md-12">
                                <label class="form-label required">Thematic Area</label>
                                <select class="form-select" id="thematic_area_id" name="thematic_area_id">
                                    <option value="">Select Thematic Area...</option>
                                    ${this.thematicAreas.map(ta => `
                                        <option value="${ta.id}" ${this.formData.thematic_area_id === ta.id ? 'selected' : ''}>
                                            ${ta.code} - ${ta.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Conditional Fields: Project & Result Area (Project) -->
                        <div class="row mb-3 scope-field project-only" style="display: ${isProject ? 'flex' : 'none'};">
                            <div class="col-md-6">
                                <label class="form-label required">Project</label>
                                <select class="form-select" id="project_id" name="project_id">
                                    <option value="">Select Project...</option>
                                    ${this.projects.map(project => `
                                        <option value="${project.id}" ${this.formData.project_id === project.id ? 'selected' : ''}>
                                            ${project.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label required">Result Area</label>
                                <input type="text" class="form-control" id="result_area" name="result_area" 
                                       value="${this.formData.result_area || ''}"
                                       placeholder="e.g., Protection, Education, Health">
                            </div>
                        </div>

                        <!-- Conditional Field: Link to AWYAD Indicator (Project only) -->
                        <div class="row mb-3 scope-field project-only" style="display: ${isProject ? 'flex' : 'none'};">
                            <div class="col-md-12">
                                <label class="form-label">
                                    Link to AWYAD Indicator (Optional)
                                    <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                       title="Link this project indicator to an organizational-level AWYAD indicator for roll-up reporting"></i>
                                </label>
                                <select class="form-select" id="awyad_indicator_id" name="awyad_indicator_id">
                                    <option value="">No linkage (standalone indicator)</option>
                                    ${this.aywadIndicators.map(ind => `
                                        <option value="${ind.id}">
                                            ${ind.name} (${ind.indicator_level})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Basic Information -->
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <label class="form-label required">Indicator Name</label>
                                <input type="text" class="form-control" id="name" name="name" 
                                       value="${this.formData.name || ''}" required
                                       placeholder="Enter descriptive indicator name">
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-12">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="description" name="description" 
                                          rows="3" placeholder="Optional detailed description">${this.formData.description || ''}</textarea>
                            </div>
                        </div>

                        <!-- Data Type & Unit -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label required">Data Type</label>
                                <select class="form-select" id="data_type" name="data_type" required>
                                    <option value="number" ${this.formData.data_type === 'number' ? 'selected' : ''}>Number</option>
                                    <option value="percentage" ${this.formData.data_type === 'percentage' ? 'selected' : ''}>Percentage</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">
                                    Unit of Measurement
                                    <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                       title="e.g., persons, households, services, cases"></i>
                                </label>
                                <input type="text" class="form-control" id="unit" name="unit" 
                                       value="${this.formData.unit || ''}"
                                       placeholder="e.g., persons">
                            </div>
                        </div>

                        <!-- Baseline -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Baseline Value</label>
                                <input type="number" step="0.01" class="form-control" id="baseline" name="baseline" 
                                       value="${this.formData.baseline || ''}"
                                       placeholder="Starting value">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Baseline Date</label>
                                <input type="date" class="form-control" id="baseline_date" name="baseline_date" 
                                       value="${this.formData.baseline_date || ''}">
                            </div>
                        </div>

                        <!-- LOP Target -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">
                                    LOP Target (Life of Project)
                                    <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                       title="Total target value for the entire project duration"></i>
                                </label>
                                <input type="number" step="0.01" class="form-control" id="lop_target" name="lop_target" 
                                       value="${this.formData.lop_target || ''}"
                                       placeholder="Total project target">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Annual Target</label>
                                <input type="number" step="0.01" class="form-control" id="annual_target" name="annual_target" 
                                       value="${this.formData.annual_target || ''}"
                                       placeholder="Current year target">
                            </div>
                        </div>

                        <!-- Quarterly Targets -->
                        <div class="card mb-3 bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Quarterly Targets</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <label class="form-label">Q1 Target</label>
                                        <input type="number" step="0.01" class="form-control" id="q1_target" name="q1_target" 
                                               value="${this.formData.q1_target || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q2 Target</label>
                                        <input type="number" step="0.01" class="form-control" id="q2_target" name="q2_target" 
                                               value="${this.formData.q2_target || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q3 Target</label>
                                        <input type="number" step="0.01" class="form-control" id="q3_target" name="q3_target" 
                                               value="${this.formData.q3_target || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q4 Target</label>
                                        <input type="number" step="0.01" class="form-control" id="q4_target" name="q4_target" 
                                               value="${this.formData.q4_target || ''}" placeholder="0">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Quarterly Achieved (for edit mode) -->
                        ${this.mode === 'edit' ? `
                        <div class="card mb-3 bg-light">
                            <div class="card-header">
                                <h6 class="mb-0">Quarterly Achieved Values</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <label class="form-label">Q1 Achieved</label>
                                        <input type="number" step="0.01" class="form-control" id="q1_achieved" name="q1_achieved" 
                                               value="${this.formData.q1_achieved || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q2 Achieved</label>
                                        <input type="number" step="0.01" class="form-control" id="q2_achieved" name="q2_achieved" 
                                               value="${this.formData.q2_achieved || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q3 Achieved</label>
                                        <input type="number" step="0.01" class="form-control" id="q3_achieved" name="q3_achieved" 
                                               value="${this.formData.q3_achieved || ''}" placeholder="0">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Q4 Achieved</label>
                                        <input type="number" step="0.01" class="form-control" id="q4_achieved" name="q4_achieved" 
                                               value="${this.formData.q4_achieved || ''}" placeholder="0">
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Form Actions -->
                        <div class="d-flex justify-content-end gap-2">
                            <button type="button" class="btn btn-secondary" id="cancel-btn">
                                <i class="bi bi-x-circle"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" id="submit-btn">
                                <i class="bi bi-check-circle"></i> ${this.mode === 'create' ? 'Create' : 'Update'} Indicator
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>
                .required::after {
                    content: ' *';
                    color: red;
                }
                
                .form-label {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
                
                #indicator-form .card {
                    border: none;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                #indicator-form .bg-light {
                    background-color: #f8f9fa !important;
                }
                
                .gap-2 {
                    gap: 0.5rem !important;
                }
            </style>
        `;

        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    attachEventListeners() {
        const form = document.getElementById('indicator-form');
        const scopeSelect = document.getElementById('indicator_scope');
        const cancelBtn = document.getElementById('cancel-btn');
        const submitBtn = document.getElementById('submit-btn');

        // Handle scope change
        scopeSelect.addEventListener('change', (e) => {
            const scope = e.target.value;
            this.formData.indicator_scope = scope;
            
            // Show/hide conditional fields
            document.querySelectorAll('.awyad-only').forEach(el => {
                el.style.display = scope === 'awyad' ? 'flex' : 'none';
            });
            document.querySelectorAll('.project-only').forEach(el => {
                el.style.display = scope === 'project' ? 'flex' : 'none';
            });

            // Update required attributes
            const thematicArea = document.getElementById('thematic_area_id');
            const projectId = document.getElementById('project_id');
            const resultArea = document.getElementById('result_area');

            if (scope === 'awyad') {
                thematicArea.required = true;
                projectId.required = false;
                resultArea.required = false;
            } else {
                thematicArea.required = false;
                projectId.required = true;
                resultArea.required = true;
            }
        });

        // Handle data type change for formatting hint
        const dataTypeSelect = document.getElementById('data_type');
        dataTypeSelect.addEventListener('change', (e) => {
            const unitField = document.getElementById('unit');
            if (e.target.value === 'percentage') {
                unitField.placeholder = 'e.g., % of beneficiaries';
            } else {
                unitField.placeholder = 'e.g., persons';
            }
        });

        // Handle cancel
        cancelBtn.addEventListener('click', () => {
            this.onCancel();
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

            try {
                const formData = this.getFormData();
                let response;

                if (this.mode === 'create') {
                    response = await authManager.authenticatedFetch(`${API_BASE}/indicators`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                } else {
                    response = await authManager.authenticatedFetch(`${API_BASE}/indicators/${this.indicatorId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                }

                const data = await response.json();

                if (data.success) {
                    // If this is a project indicator with AWYAD linkage, create the mapping
                    if (formData.indicator_scope === 'project' && formData.awyad_indicator_id) {
                        await this.createIndicatorMapping(data.data.id, formData.awyad_indicator_id);
                    }

                    this.showSuccess(`Indicator ${this.mode === 'create' ? 'created' : 'updated'} successfully!`);
                    setTimeout(() => {
                        this.onSuccess(data.data);
                    }, 1500);
                } else {
                    throw new Error(data.message || 'Failed to save indicator');
                }
            } catch (error) {
                console.error('Error saving indicator:', error);
                this.showError(error.message || 'Failed to save indicator');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-check-circle"></i> ${this.mode === 'create' ? 'Create' : 'Update'} Indicator`;
            }
        });
    }

    async createIndicatorMapping(projectIndicatorId, aywadIndicatorId) {
        try {
            await authManager.authenticatedFetch(`${API_BASE}/indicators/mappings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_indicator_id: projectIndicatorId,
                    awyad_indicator_id: aywadIndicatorId
                })
            });
        } catch (error) {
            console.error('Error creating indicator mapping:', error);
            // Don't fail the whole operation if mapping fails
        }
    }

    validateForm() {
        const scope = document.getElementById('indicator_scope').value;
        const name = document.getElementById('name').value.trim();

        if (!name) {
            this.showError('Indicator name is required');
            return false;
        }

        if (scope === 'awyad') {
            const thematicAreaId = document.getElementById('thematic_area_id').value;
            if (!thematicAreaId) {
                this.showError('Thematic Area is required for AWYAD indicators');
                return false;
            }
        } else if (scope === 'project') {
            const projectId = document.getElementById('project_id').value;
            const resultArea = document.getElementById('result_area').value.trim();
            
            if (!projectId) {
                this.showError('Project is required for Project indicators');
                return false;
            }
            if (!resultArea) {
                this.showError('Result Area is required for Project indicators');
                return false;
            }
        }

        return true;
    }

    getFormData() {
        const form = document.getElementById('indicator-form');
        const formData = new FormData(form);
        const data = {};

        // Get all form fields
        for (let [key, value] of formData.entries()) {
            // Handle empty values
            if (value === '' || value === null) {
                data[key] = null;
            } else if (['lop_target', 'annual_target', 'baseline', 'q1_target', 'q2_target', 'q3_target', 'q4_target',
                       'q1_achieved', 'q2_achieved', 'q3_achieved', 'q4_achieved'].includes(key)) {
                // Convert numeric fields
                data[key] = value ? parseFloat(value) : null;
            } else {
                data[key] = value;
            }
        }

        // Handle scope-specific nulls
        if (data.indicator_scope === 'awyad') {
            data.project_id = null;
            data.result_area = null;
        } else {
            data.thematic_area_id = null;
        }

        // Extract AWYAD indicator ID (not a direct field in indicators table)
        const aywadIndicatorId = document.getElementById('awyad_indicator_id')?.value;
        if (aywadIndicatorId) {
            data.awyad_indicator_id = aywadIndicatorId;
        }

        return data;
    }

    showSuccess(message) {
        const alert = document.getElementById('form-alert');
        const alertMessage = document.getElementById('alert-message');
        
        alert.className = 'alert alert-success alert-dismissible fade show';
        alertMessage.textContent = message;
        alert.style.display = 'block';
        
        // Scroll to top
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showError(message) {
        const alert = document.getElementById('form-alert');
        const alertMessage = document.getElementById('alert-message');
        
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alertMessage.textContent = message;
        alert.style.display = 'block';
        
        // Scroll to top
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Export function to create and initialize the form
export async function showIndicatorForm(containerId, options = {}) {
    const form = new IndicatorForm(containerId, options);
    await form.init();
    return form;
}
