/**
 * Project Forms Module
 * Handles Create, Edit, View operations for Projects
 */

import { apiService } from './apiService.js';
import { createModal } from './components.js';
import { showNotification } from './components.js';
import { formatCurrency } from './utils/currencyUtils.js';
import { stateManager } from './stateManager.js';
import { formatDate } from './utils.js';

/**
 * Show create project modal
 */
export async function showCreateProjectModal(onSuccess) {
    try {
        // Get pillars and donors in parallel
        const [pillarsRes, donorsRes] = await Promise.all([
            apiService.get('/pillars'),
            apiService.get('/donors'),
        ]);
        const pillars = Array.isArray(pillarsRes.data) ? pillarsRes.data : [];
        const donors = Array.isArray(donorsRes.data) ? donorsRes.data : [];
        
        // Build <optgroup> HTML grouped by pillar
        const componentOptionsHTML = pillars
            .filter(p => p.components && p.components.length > 0)
            .map(p => `
                <optgroup label="${p.name}">
                    ${p.components.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </optgroup>
            `).join('');
        
        const formHTML = `
            <form id="createProjectForm">
                <div class="mb-3">
                    <label for="projectName" class="form-label">Project Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="projectName" name="name" required maxlength="255">
                </div>
                
                <div class="mb-3">
                    <label for="projectDonors" class="form-label">Donor(s) <span class="text-danger">*</span></label>
                    <select class="form-select" id="projectDonors" name="donor_ids" multiple required size="4">
                        ${donors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>
                    <div class="form-text">Hold <kbd>Ctrl</kbd> / <kbd>&#8984; Cmd</kbd> to select multiple.</div>
                </div>
                
                <div class="mb-3">
                    <label for="projectDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="projectDescription" name="description" rows="3"></textarea>
                </div>
                
                <div class="mb-3">
                    <label for="projectComponents" class="form-label">Core Program Components <span class="text-danger">*</span></label>
                    <select class="form-select" id="projectComponents" multiple required size="6">
                        ${componentOptionsHTML}
                    </select>
                    <div class="form-text">Hold <kbd>Ctrl</kbd> / <kbd>&#8984; Cmd</kbd> to select multiple.</div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="projectStartDate" class="form-label">Start Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="projectStartDate" name="start_date" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="projectEndDate" class="form-label">End Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="projectEndDate" name="end_date" required>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Budget</label>
                        <div class="input-group">
                            <select class="form-select" id="projectBudgetCurrency" name="budget_currency" style="max-width:90px">
                                <option value="USD">USD</option>
                                <option value="UGX">UGX</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                            <input type="number" class="form-control" id="projectBudget" name="budget" min="0" step="0.01" value="0">
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="projectStatus" class="form-label">Status <span class="text-danger">*</span></label>
                        <select class="form-select" id="projectStatus" name="status" required>
                            <option value="Planning" selected>Planning</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveProjectBtn">
                <i class="bi bi-check-lg"></i> Create Project
            </button>
        `;

        const modalHTML = createModal({
            id: 'createProjectModal',
            title: '<i class="bi bi-plus-circle"></i> Create New Project',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        // Remove existing modal if any
        const existingModal = document.getElementById('createProjectModal');
        if (existingModal) existingModal.remove();

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById('createProjectModal'));
        modal.show();

        // Handle form submission
        document.getElementById('saveProjectBtn').addEventListener('click', async () => {
            const form = document.getElementById('createProjectForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Collect multi-select donor IDs
            const donorSelect = document.getElementById('projectDonors');
            const selectedDonors = [...donorSelect.selectedOptions].map(o => o.value);
            if (selectedDonors.length === 0) {
                showNotification('Please select at least one Donor', 'danger');
                return;
            }
            data.donor_ids = selectedDonors;
            delete data.donor_id;

            // Collect multi-select component IDs
            const componentSelect = document.getElementById('projectComponents');
            const selectedComponents = [...componentSelect.selectedOptions].map(o => o.value);
            if (selectedComponents.length === 0) {
                showNotification('Please select at least one Core Program Component', 'danger');
                return;
            }
            data.component_ids = selectedComponents;

            // Validate dates
            if (new Date(data.end_date) <= new Date(data.start_date)) {
                showNotification('End date must be after start date', 'danger');
                return;
            }

            const saveBtn = document.getElementById('saveProjectBtn');
            try {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

                const response = await apiService.post('/projects', data);

                if (response.success) {
                    showNotification('Project created successfully!', 'success');
                    modal.hide();
                    
                    if (onSuccess) {
                        onSuccess(response.data);
                    }
                }
            } catch (error) {
                showNotification(`Failed to create project: ${error.message}`, 'danger');
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Project';
            }
        });

        // Cleanup modal on hide
        document.getElementById('createProjectModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load form: ${error.message}`, 'danger');
    }
}

/**
 * Show edit project modal
 */
export async function showEditProjectModal(projectId, onSuccess) {
    try {
        // Get project details, pillars, and donors in parallel
        const [projectResponse, pillarsRes, donorsRes] = await Promise.all([
            apiService.get(`/projects/${projectId}`),
            apiService.get('/pillars'),
            apiService.get('/donors'),
        ]);

        const project = projectResponse.data;
        const pillars = Array.isArray(pillarsRes.data) ? pillarsRes.data : [];
        const donors = Array.isArray(donorsRes.data) ? donorsRes.data : [];
        const existingComponentIds = (project.components || []).map(c => c.id);
        
        // Build <optgroup> HTML grouped by pillar, pre-selecting existing components
        const componentOptionsHTML = pillars
            .filter(p => p.components && p.components.length > 0)
            .map(p => `
                <optgroup label="${p.name}">
                    ${p.components.map(c => `<option value="${c.id}" ${existingComponentIds.includes(c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
                </optgroup>
            `).join('');

        const formHTML = `
            <form id="editProjectForm">
                <div class="mb-3">
                    <label for="editProjectName" class="form-label">Project Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editProjectName" name="name" required maxlength="255" value="${project.name || ''}">
                </div>
                
                <div class="mb-3">
                    <label for="editProjectDonors" class="form-label">Donor(s) <span class="text-danger">*</span></label>
                    <select class="form-select" id="editProjectDonors" name="donor_ids" multiple required size="4">
                        ${(() => { const sel = new Set((project.donors || []).map(d => d.id)); return donors.map(d => `<option value="${d.id}" ${sel.has(d.id) ? 'selected' : ''}>${d.name}</option>`).join(''); })()}
                    </select>
                    <div class="form-text">Hold <kbd>Ctrl</kbd> / <kbd>&#8984; Cmd</kbd> to select multiple.</div>
                </div>
                
                <div class="mb-3">
                    <label for="editProjectDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editProjectDescription" name="description" rows="3">${project.description || ''}</textarea>
                </div>
                
                <div class="mb-3">
                    <label for="editProjectComponents" class="form-label">Core Program Components <span class="text-danger">*</span></label>
                    <select class="form-select" id="editProjectComponents" multiple required size="6">
                        ${componentOptionsHTML}
                    </select>
                    <div class="form-text">Hold <kbd>Ctrl</kbd> / <kbd>&#8984; Cmd</kbd> to select multiple.</div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editProjectStartDate" class="form-label">Start Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="editProjectStartDate" name="start_date" required value="${project.start_date ? project.start_date.split('T')[0] : ''}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editProjectEndDate" class="form-label">End Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="editProjectEndDate" name="end_date" required value="${project.end_date ? project.end_date.split('T')[0] : ''}">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Budget</label>
                        <div class="input-group">
                            <select class="form-select" id="editProjectBudgetCurrency" name="budget_currency" style="max-width:90px">
                                <option value="USD" ${(project.budget_currency || 'USD') === 'USD' ? 'selected' : ''}>USD</option>
                                <option value="UGX" ${project.budget_currency === 'UGX' ? 'selected' : ''}>UGX</option>
                                <option value="EUR" ${project.budget_currency === 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="GBP" ${project.budget_currency === 'GBP' ? 'selected' : ''}>GBP</option>
                            </select>
                            <input type="number" class="form-control" id="editProjectBudget" name="budget" min="0" step="0.01" value="${project.budget || 0}">
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editProjectStatus" class="form-label">Status <span class="text-danger">*</span></label>
                        <select class="form-select" id="editProjectStatus" name="status" required>
                            <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                            <option value="Active" ${project.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Cancelled" ${project.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="updateProjectBtn">
                <i class="bi bi-check-lg"></i> Update Project
            </button>
        `;

        const modalHTML = createModal({
            id: 'editProjectModal',
            title: '<i class="bi bi-pencil-square"></i> Edit Project',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        // Remove existing modal if any
        const existingModal = document.getElementById('editProjectModal');
        if (existingModal) existingModal.remove();

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
        modal.show();

        // Handle form submission
        document.getElementById('updateProjectBtn').addEventListener('click', async () => {
            const form = document.getElementById('editProjectForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Collect multi-select donor IDs
            const donorSelect = document.getElementById('editProjectDonors');
            const selectedDonors = [...donorSelect.selectedOptions].map(o => o.value);
            if (selectedDonors.length === 0) {
                showNotification('Please select at least one Donor', 'danger');
                return;
            }
            data.donor_ids = selectedDonors;
            delete data.donor_id;

            // Collect multi-select component IDs
            const componentSelect = document.getElementById('editProjectComponents');
            const selectedComponents = [...componentSelect.selectedOptions].map(o => o.value);
            if (selectedComponents.length === 0) {
                showNotification('Please select at least one Core Program Component', 'danger');
                return;
            }
            data.component_ids = selectedComponents;

            // Validate dates
            if (new Date(data.end_date) <= new Date(data.start_date)) {
                showNotification('End date must be after start date', 'danger');
                return;
            }

            try {
                const updateBtn = document.getElementById('updateProjectBtn');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                const response = await apiService.put(`/projects/${projectId}`, data);

                if (response.success) {
                    showNotification('Project updated successfully!', 'success');
                    modal.hide();
                    
                    if (onSuccess) {
                        onSuccess(response.data);
                    }
                }
            } catch (error) {
                showNotification(`Failed to update project: ${error.message}`, 'danger');
                const updateBtn = document.getElementById('updateProjectBtn');
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Update Project';
            }
        });

        // Cleanup modal on hide
        document.getElementById('editProjectModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load project: ${error.message}`, 'danger');
    }
}

/**
 * Show view project modal (read-only)
 */
export async function showViewProjectModal(projectId) {
    try {
        const projectResponse = await apiService.get(`/projects/${projectId}`);
        const project = projectResponse.data;

        const bodyHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">${project.name}</h5>
                    <p class="text-muted">${project.description || 'No description provided'}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Core Program Components:</strong><br>
                    ${(project.components && project.components.length > 0)
                        ? project.components.map(c => `<span class="badge bg-primary me-1">${c.name}</span>`).join(' ')
                        : '<span class="text-muted">N/A</span>'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Status:</strong><br>
                    <span class="badge bg-${project.status === 'Active' ? 'success' : project.status === 'Completed' ? 'primary' : project.status === 'Planning' ? 'warning' : 'secondary'}">${project.status}</span>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Start Date:</strong><br>
                    ${formatDate(project.start_date)}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>End Date:</strong><br>
                    ${formatDate(project.end_date)}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Donor(s):</strong><br>
                    ${(project.donors && project.donors.length > 0)
                        ? project.donors.map(d => `<span class="badge bg-info text-dark me-1">${d.name}</span>`).join('')
                        : (project.donor || '<span class="text-muted">N/A</span>')}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Budget:</strong><br>
                    ${formatCurrency(project.budget || 0, project.budget_currency || 'USD')}
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Location:</strong><br>
                    ${project.location || 'Not specified'}
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6 mb-2">
                    <strong>Activities:</strong> ${project.activity_count || 0}
                </div>
                <div class="col-md-6 mb-2">
                    <strong>Cases:</strong> ${project.case_count || 0}
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-12">
                    <small class="text-muted">
                        Created by ${project.created_by_username || 'Unknown'} on ${formatDate(project.created_at)}
                    </small>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewProjectModal',
            title: '<i class="bi bi-eye"></i> Project Details',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg'
        });

        // Remove existing modal if any
        const existingModal = document.getElementById('viewProjectModal');
        if (existingModal) existingModal.remove();

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize Bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById('viewProjectModal'));
        modal.show();

        // Cleanup modal on hide
        document.getElementById('viewProjectModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load project: ${error.message}`, 'danger');
    }
}
