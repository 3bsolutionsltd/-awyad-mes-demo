/**
 * Indicator Forms Module
 * Handles Create, Edit, View operations for Indicators
 */

import { apiService } from './apiService.js';
import { createModal } from './components.js';
import { showNotification } from './components.js';

/**
 * Show create indicator modal
 */
export async function showCreateIndicatorModal(onSuccess) {
    try {
        // Get projects and thematic areas
        const [projectsRes, thematicAreasRes] = await Promise.all([
            apiService.get('/projects'),
            apiService.get('/dashboard/thematic-areas')
        ]);

        const projects = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : (Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const thematicAreas = Array.isArray(thematicAreasRes.data) ? thematicAreasRes.data : [];

        console.log('Indicator form data:', { projectsCount: projects.length, thematicAreasCount: thematicAreas.length });

        const formHTML = `
            <form id="createIndicatorForm">
                <div class="mb-3">
                    <label for="indicatorName" class="form-label">Indicator Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="indicatorName" name="name" required maxlength="255">
                </div>
                
                <div class="mb-3">
                    <label for="indicatorDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="indicatorDescription" name="description" rows="2"></textarea>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="indicatorProject" class="form-label">Project <span class="text-danger">*</span></label>
                        <select class="form-select" id="indicatorProject" name="project_id" required>
                            <option value="">Select Project</option>
                            ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="indicatorThematicArea" class="form-label">Thematic Area <span class="text-danger">*</span></label>
                        <select class="form-select" id="indicatorThematicArea" name="thematic_area_id" required>
                            <option value="">Select Thematic Area</option>
                            ${thematicAreas.map(ta => `<option value="${ta.id}">${ta.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="indicatorTarget" class="form-label">Target <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" id="indicatorTarget" name="target" required min="0" step="1">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="indicatorUnit" class="form-label">Unit <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="indicatorUnit" name="unit" required placeholder="e.g., people, sessions, workshops">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="indicatorFrequency" class="form-label">Reporting Frequency</label>
                        <select class="form-select" id="indicatorFrequency" name="reporting_frequency">
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly" selected>Quarterly</option>
                            <option value="Semi-Annual">Semi-Annual</option>
                            <option value="Annual">Annual</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="indicatorStatus" class="form-label">Status</label>
                        <select class="form-select" id="indicatorStatus" name="status">
                            <option value="Active" selected>Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

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
            size: 'lg'
        });

        const existingModal = document.getElementById('createIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('createIndicatorModal'));
        modal.show();

        document.getElementById('saveIndicatorBtn').addEventListener('click', async () => {
            const form = document.getElementById('createIndicatorForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const saveBtn = document.getElementById('saveIndicatorBtn');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

                const response = await apiService.post('/indicators', data);

                if (response.success) {
                    showNotification('Indicator created successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to create indicator: ${error.message}`, 'danger');
                const saveBtn = document.getElementById('saveIndicatorBtn');
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Indicator';
            }
        });

        document.getElementById('createIndicatorModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load form: ${error.message}`, 'danger');
    }
}

/**
 * Show edit indicator modal
 */
export async function showEditIndicatorModal(indicatorId, onSuccess) {
    try {
        const [indicatorRes, projectsRes, thematicAreasRes] = await Promise.all([
            apiService.get(`/indicators/${indicatorId}`),
            apiService.get('/projects'),
            apiService.get('/dashboard/thematic-areas')
        ]);

        const indicator = indicatorRes.data;
        const projects = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : ( Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const thematicAreas = Array.isArray(thematicAreasRes.data) ? thematicAreasRes.data : [];

        const formHTML = `
            <form id="editIndicatorForm">
                <div class="mb-3">
                    <label for="editIndicatorName" class="form-label">Indicator Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editIndicatorName" name="name" required maxlength="255" value="${indicator.name || ''}">
                </div>
                
                <div class="mb-3">
                    <label for="editIndicatorDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editIndicatorDescription" name="description" rows="2">${indicator.description || ''}</textarea>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorProject" class="form-label">Project <span class="text-danger">*</span></label>
                        <select class="form-select" id="editIndicatorProject" name="project_id" required>
                            <option value="">Select Project</option>
                            ${projects.map(p => `<option value="${p.id}" ${p.id === indicator.project_id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorThematicArea" class="form-label">Thematic Area <span class="text-danger">*</span></label>
                        <select class="form-select" id="editIndicatorThematicArea" name="thematic_area_id" required>
                            <option value="">Select Thematic Area</option>
                            ${thematicAreas.map(ta => `<option value="${ta.id}" ${ta.id === indicator.thematic_area_id ? 'selected' : ''}>${ta.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorTarget" class="form-label">Target <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" id="editIndicatorTarget" name="target" required min="0" step="1" value="${indicator.target || 0}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorUnit" class="form-label">Unit <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="editIndicatorUnit" name="unit" required value="${indicator.unit || ''}">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorFrequency" class="form-label">Reporting Frequency</label>
                        <select class="form-select" id="editIndicatorFrequency" name="reporting_frequency">
                            <option value="Monthly" ${indicator.reporting_frequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
                            <option value="Quarterly" ${indicator.reporting_frequency === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
                            <option value="Semi-Annual" ${indicator.reporting_frequency === 'Semi-Annual' ? 'selected' : ''}>Semi-Annual</option>
                            <option value="Annual" ${indicator.reporting_frequency === 'Annual' ? 'selected' : ''}>Annual</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editIndicatorStatus" class="form-label">Status</label>
                        <select class="form-select" id="editIndicatorStatus" name="status">
                            <option value="Active" ${indicator.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${indicator.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Completed" ${indicator.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="updateIndicatorBtn">
                <i class="bi bi-check-lg"></i> Update Indicator
            </button>
        `;

        const modalHTML = createModal({
            id: 'editIndicatorModal',
            title: '<i class="bi bi-pencil-square"></i> Edit Indicator',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('editIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editIndicatorModal'));
        modal.show();

        document.getElementById('updateIndicatorBtn').addEventListener('click', async () => {
            const form = document.getElementById('editIndicatorForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const updateBtn = document.getElementById('updateIndicatorBtn');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                const response = await apiService.put(`/indicators/${indicatorId}`, data);

                if (response.success) {
                    showNotification('Indicator updated successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to update indicator: ${error.message}`, 'danger');
                const updateBtn = document.getElementById('updateIndicatorBtn');
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Update Indicator';
            }
        });

        document.getElementById('editIndicatorModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load indicator: ${error.message}`, 'danger');
    }
}

/**
 * Show view indicator modal (read-only)
 */
export async function showViewIndicatorModal(indicatorId) {
    try {
        const indicatorRes = await apiService.get(`/indicators/${indicatorId}`);
        const indicator = indicatorRes.data;

        const bodyHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">${indicator.name}</h5>
                    <p class="text-muted">${indicator.description || 'No description provided'}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Project:</strong><br>
                    ${indicator.project_name || 'N/A'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Thematic Area:</strong><br>
                    <span class="badge bg-info">${indicator.thematic_area_name || 'N/A'}</span>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Target:</strong><br>
                    ${(indicator.target || 0).toLocaleString()} ${indicator.unit || 'units'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Achieved:</strong><br>
                    ${(indicator.achieved || 0).toLocaleString()} ${indicator.unit || 'units'}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Achievement Rate:</strong><br>
                    <div class="progress">
                        ${(() => { const pct = parseFloat(indicator.achievement_percentage) || 0; return `<div class="progress-bar ${pct >= 100 ? 'bg-success' : pct >= 75 ? 'bg-info' : pct >= 50 ? 'bg-warning' : 'bg-danger'}" style="width: ${Math.min(pct, 100)}%">${pct.toFixed(1)}%</div>`; })()}
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Status:</strong><br>
                    <span class="badge bg-${indicator.status === 'Active' ? 'success' : indicator.status === 'Completed' ? 'primary' : 'secondary'}">${indicator.status}</span>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Reporting Frequency:</strong><br>
                    ${indicator.reporting_frequency || 'Not specified'}
                </div>
            </div>
            
            <hr>
            
            <div class="row mt-3">
                <div class="col-12">
                    <small class="text-muted">
                        Created on ${indicator.created_at ? new Date(indicator.created_at).toLocaleDateString() : 'N/A'}
                    </small>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewIndicatorModal',
            title: '<i class="bi bi-eye"></i> Indicator Details',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('viewIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('viewIndicatorModal'));
        modal.show();

        document.getElementById('viewIndicatorModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load indicator: ${error.message}`, 'danger');
    }
}
