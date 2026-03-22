/**
 * Case Forms Module
 * Handles Create, Edit, View operations for Cases
 */

import { apiService } from './apiService.js';
import { createModal } from './components.js';
import { showNotification } from './components.js';

/**
 * Show create case modal
 */
export async function showCreateCaseModal(onSuccess) {
    try {
        const projectsRes = await apiService.get('/projects');
        const projects = projectsRes.data?.projects || projectsRes.data || [];

        const formHTML = `
            <form id="createCaseForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="caseNumber" class="form-label">Case Number <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="caseNumber" name="case_number" required maxlength="100" placeholder="e.g., CASE-2026-001">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="caseProject" class="form-label">Project</label>
                        <select class="form-select" id="caseProject" name="project_id">
                            <option value="">Select Project (Optional)</option>
                            ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="clientName" class="form-label">Client Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="clientName" name="client_name" required maxlength="255">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="clientAge" class="form-label">Client Age</label>
                        <input type="number" class="form-control" id="clientAge" name="client_age" min="0" max="120">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="clientGender" class="form-label">Gender <span class="text-danger">*</span></label>
                        <select class="form-select" id="clientGender" name="client_gender" required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="caseType" class="form-label">Case Type <span class="text-danger">*</span></label>
                        <select class="form-select" id="caseType" name="case_type" required>
                            <option value="">Select Type</option>
                            <option value="GBV">GBV (Gender-Based Violence)</option>
                            <option value="Protection">Protection</option>
                            <option value="Legal">Legal</option>
                            <option value="Medical">Medical</option>
                            <option value="Psychosocial">Psychosocial</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="openedDate" class="form-label">Opened Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="openedDate" name="opened_date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="casePriority" class="form-label">Priority</label>
                        <select class="form-select" id="casePriority" name="priority">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="caseStatus" class="form-label">Status</label>
                        <select class="form-select" id="caseStatus" name="status">
                            <option value="Open" selected>Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending">Pending</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="caseDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="caseDescription" name="description" rows="3"></textarea>
                </div>
                
                <div class="mb-3">
                    <label for="caseNotes" class="form-label">Additional Notes</label>
                    <textarea class="form-control" id="caseNotes" name="notes" rows="2"></textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveCaseBtn">
                <i class="bi bi-check-lg"></i> Create Case
            </button>
        `;

        const modalHTML = createModal({
            id: 'createCaseModal',
            title: '<i class="bi bi-plus-circle"></i> Create New Case',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('createCaseModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('createCaseModal'));
        modal.show();

        document.getElementById('saveCaseBtn').addEventListener('click', async () => {
            const form = document.getElementById('createCaseForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const saveBtn = document.getElementById('saveCaseBtn');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

                const response = await apiService.post('/cases', data);

                if (response.success) {
                    showNotification('Case created successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to create case: ${error.message}`, 'danger');
                const saveBtn = document.getElementById('saveCaseBtn');
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Case';
            }
        });

        document.getElementById('createCaseModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load form: ${error.message}`, 'danger');
    }
}

/**
 * Show edit case modal
 */
export async function showEditCaseModal(caseId, onSuccess) {
    try {
        const [caseRes, projectsRes] = await Promise.all([
            apiService.get(`/cases/${caseId}`),
            apiService.get('/projects')
        ]);

        const caseData = caseRes.data;
        const projects = projectsRes.data?.projects || projectsRes.data || [];

        const formHTML = `
            <form id="editCaseForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCaseNumber" class="form-label">Case Number <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="editCaseNumber" name="case_number" required maxlength="100" value="${caseData.case_number || ''}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editCaseProject" class="form-label">Project</label>
                        <select class="form-select" id="editCaseProject" name="project_id">
                            <option value="">Select Project (Optional)</option>
                            ${projects.map(p => `<option value="${p.id}" ${p.id === caseData.project_id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editClientName" class="form-label">Client Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="editClientName" name="client_name" required maxlength="255" value="${caseData.client_name || ''}">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="editClientAge" class="form-label">Client Age</label>
                        <input type="number" class="form-control" id="editClientAge" name="client_age" min="0" max="120" value="${caseData.client_age || ''}">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="editClientGender" class="form-label">Gender <span class="text-danger">*</span></label>
                        <select class="form-select" id="editClientGender" name="client_gender" required>
                            <option value="">Select</option>
                            <option value="Male" ${caseData.client_gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${caseData.client_gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${caseData.client_gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCaseType" class="form-label">Case Type <span class="text-danger">*</span></label>
                        <select class="form-select" id="editCaseType" name="case_type" required>
                            <option value="">Select Type</option>
                            <option value="GBV" ${caseData.case_type === 'GBV' ? 'selected' : ''}>GBV (Gender-Based Violence)</option>
                            <option value="Protection" ${caseData.case_type === 'Protection' ? 'selected' : ''}>Protection</option>
                            <option value="Legal" ${caseData.case_type === 'Legal' ? 'selected' : ''}>Legal</option>
                            <option value="Medical" ${caseData.case_type === 'Medical' ? 'selected' : ''}>Medical</option>
                            <option value="Psychosocial" ${caseData.case_type === 'Psychosocial' ? 'selected' : ''}>Psychosocial</option>
                            <option value="Other" ${caseData.case_type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editOpenedDate" class="form-label">Opened Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="editOpenedDate" name="opened_date" required value="${caseData.opened_date ? caseData.opened_date.split('T')[0] : ''}">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editCasePriority" class="form-label">Priority</label>
                        <select class="form-select" id="editCasePriority" name="priority">
                            <option value="Low" ${caseData.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Medium" ${caseData.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="High" ${caseData.priority === 'High' ? 'selected' : ''}>High</option>
                            <option value="Critical" ${caseData.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editCaseStatus" class="form-label">Status</label>
                        <select class="form-select" id="editCaseStatus" name="status">
                            <option value="Open" ${caseData.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Progress" ${caseData.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Pending" ${caseData.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Closed" ${caseData.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editCaseDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editCaseDescription" name="description" rows="3">${caseData.description || ''}</textarea>
                </div>
                
                <div class="mb-3">
                    <label for="editCaseNotes" class="form-label">Additional Notes</label>
                    <textarea class="form-control" id="editCaseNotes" name="notes" rows="2">${caseData.notes || ''}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="updateCaseBtn">
                <i class="bi bi-check-lg"></i> Update Case
            </button>
        `;

        const modalHTML = createModal({
            id: 'editCaseModal',
            title: '<i class="bi bi-pencil-square"></i> Edit Case',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('editCaseModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editCaseModal'));
        modal.show();

        document.getElementById('updateCaseBtn').addEventListener('click', async () => {
            const form = document.getElementById('editCaseForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const updateBtn = document.getElementById('updateCaseBtn');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                const response = await apiService.put(`/cases/${caseId}`, data);

                if (response.success) {
                    showNotification('Case updated successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to update case: ${error.message}`, 'danger');
                const updateBtn = document.getElementById('updateCaseBtn');
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Update Case';
            }
        });

        document.getElementById('editCaseModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load case: ${error.message}`, 'danger');
    }
}

/**
 * Show view case modal (read-only)
 */
export async function showViewCaseModal(caseId) {
    try {
        const caseRes = await apiService.get(`/cases/${caseId}`);
        const caseData = caseRes.data;

        const getPriorityBadge = (priority) => {
            const colors = {
                'Critical': 'danger',
                'High': 'warning',
                'Medium': 'info',
                'Low': 'secondary'
            };
            return `<span class="badge bg-${colors[priority] || 'secondary'}">${priority}</span>`;
        };

        const getStatusBadge = (status) => {
            const colors = {
                'Open': 'primary',
                'In Progress': 'info',
                'Pending': 'warning',
                'Closed': 'secondary'
            };
            return `<span class="badge bg-${colors[status] || 'secondary'}">${status}</span>`;
        };

        const bodyHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">Case #${caseData.case_number}</h5>
                    ${caseData.description ? `<p class="text-muted">${caseData.description}</p>` : ''}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Client Name:</strong><br>
                    ${caseData.client_name || 'N/A'}
                </div>
                <div class="col-md-3 mb-3">
                    <strong>Age:</strong><br>
                    ${caseData.client_age || 'Not specified'}
                </div>
                <div class="col-md-3 mb-3">
                    <strong>Gender:</strong><br>
                    ${caseData.client_gender || 'Not specified'}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Case Type:</strong><br>
                    ${caseData.case_type || 'Not specified'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Project:</strong><br>
                    ${caseData.project_name || 'N/A'}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Priority:</strong><br>
                    ${getPriorityBadge(caseData.priority)}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Status:</strong><br>
                    ${getStatusBadge(caseData.status)}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Opened Date:</strong><br>
                    ${caseData.opened_date ? new Date(caseData.opened_date).toLocaleDateString() : 'N/A'}
                </div>
                ${caseData.closed_date ? `
                    <div class="col-md-6 mb-3">
                        <strong>Closed Date:</strong><br>
                        ${new Date(caseData.closed_date).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
            
            ${caseData.notes ? `
                <div class="row">
                    <div class="col-12 mb-3">
                        <strong>Notes:</strong><br>
                        <p class="text-muted">${caseData.notes}</p>
                    </div>
                </div>
            ` : ''}
            
            ${caseData.resolution ? `
                <div class="row">
                    <div class="col-12 mb-3">
                        <strong>Resolution:</strong><br>
                        <p class="text-muted">${caseData.resolution}</p>
                    </div>
                </div>
            ` : ''}
            
            <hr>
            
            <div class="row mt-3">
                <div class="col-12">
                    <small class="text-muted">
                        Created by ${caseData.created_by_username || 'Unknown'} on ${caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'N/A'}
                    </small>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewCaseModal',
            title: '<i class="bi bi-eye"></i> Case Details',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('viewCaseModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('viewCaseModal'));
        modal.show();

        document.getElementById('viewCaseModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load case: ${error.message}`, 'danger');
    }
}
