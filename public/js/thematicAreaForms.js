/**
 * Thematic Area Forms Module
 * Handles Create, Edit, View operations for Thematic Areas
 */

import { apiService } from './apiService.js';
import { createModal } from './components.js';
import { showNotification } from './components.js';

/**
 * Show create thematic area modal
 */
export async function showCreateThematicAreaModal(onSuccess) {
    const formHTML = `
        <form id="createThematicAreaForm">
            <div class="mb-3">
                <label for="thematicAreaCode" class="form-label">Code <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="thematicAreaCode" name="code" required maxlength="50" placeholder="e.g., RESULT 4">
                <small class="text-muted">A unique identifier for this thematic area</small>
            </div>
            
            <div class="mb-3">
                <label for="thematicAreaName" class="form-label">Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="thematicAreaName" name="name" required maxlength="500">
            </div>
            
            <div class="mb-3">
                <label for="thematicAreaDescription" class="form-label">Description</label>
                <textarea class="form-control" id="thematicAreaDescription" name="description" rows="3"></textarea>
            </div>
            
            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="thematicAreaActive" name="is_active" checked>
                <label class="form-check-label" for="thematicAreaActive">
                    Active (available for selection in projects and indicators)
                </label>
            </div>
        </form>
    `;

    const footerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="saveThematicAreaBtn">
            <i class="bi bi-check-lg"></i> Create Thematic Area
        </button>
    `;

    const modalHTML = createModal({
        id: 'createThematicAreaModal',
        title: '<i class="bi bi-plus-circle"></i> Create New Thematic Area',
        body: formHTML,
        footer: footerHTML,
        size: 'lg'
    });

    const existingModal = document.getElementById('createThematicAreaModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('createThematicAreaModal'));
    modal.show();

    document.getElementById('saveThematicAreaBtn').addEventListener('click', async () => {
        const form = document.getElementById('createThematicAreaForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = {
            code: formData.get('code'),
            name: formData.get('name'),
            description: formData.get('description') || '',
            is_active: formData.get('is_active') ? true : false
        };

        try {
            const saveBtn = document.getElementById('saveThematicAreaBtn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

            const response = await apiService.post('/thematic-areas', data);

            if (response.success) {
                showNotification('Thematic area created successfully!', 'success');
                modal.hide();
                if (onSuccess) onSuccess(response.data);
            }
        } catch (error) {
            showNotification(`Failed to create thematic area: ${error.message}`, 'danger');
            const saveBtn = document.getElementById('saveThematicAreaBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Thematic Area';
        }
    });

    document.getElementById('createThematicAreaModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

/**
 * Show edit thematic area modal
 */
export async function showEditThematicAreaModal(thematicAreaId, onSuccess) {
    try {
        const thematicAreaRes = await apiService.get(`/thematic-areas/${thematicAreaId}`);
        const thematicArea = thematicAreaRes.data;

        const formHTML = `
            <form id="editThematicAreaForm">
                <div class="mb-3">
                    <label for="editThematicAreaCode" class="form-label">Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editThematicAreaCode" name="code" required maxlength="50" value="${thematicArea.code || ''}">
                    <small class="text-muted">A unique identifier for this thematic area</small>
                </div>
                
                <div class="mb-3">
                    <label for="editThematicAreaName" class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="editThematicAreaName" name="name" required maxlength="500" value="${thematicArea.name || ''}">
                </div>
                
                <div class="mb-3">
                    <label for="editThematicAreaDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editThematicAreaDescription" name="description" rows="3">${thematicArea.description || ''}</textarea>
                </div>
                
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="editThematicAreaActive" name="is_active" ${thematicArea.is_active ? 'checked' : ''}>
                    <label class="form-check-label" for="editThematicAreaActive">
                        Active (available for selection in projects and indicators)
                    </label>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="updateThematicAreaBtn">
                <i class="bi bi-check-lg"></i> Update Thematic Area
            </button>
        `;

        const modalHTML = createModal({
            id: 'editThematicAreaModal',
            title: '<i class="bi bi-pencil-square"></i> Edit Thematic Area',
            body: formHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('editThematicAreaModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editThematicAreaModal'));
        modal.show();

        document.getElementById('updateThematicAreaBtn').addEventListener('click', async () => {
            const form = document.getElementById('editThematicAreaForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = {
                code: formData.get('code'),
                name: formData.get('name'),
                description: formData.get('description') || '',
                is_active: formData.get('is_active') ? true : false
            };

            try {
                const updateBtn = document.getElementById('updateThematicAreaBtn');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                const response = await apiService.put(`/thematic-areas/${thematicAreaId}`, data);

                if (response.success) {
                    showNotification('Thematic area updated successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to update thematic area: ${error.message}`, 'danger');
                const updateBtn = document.getElementById('updateThematicAreaBtn');
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Update Thematic Area';
            }
        });

        document.getElementById('editThematicAreaModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load thematic area: ${error.message}`, 'danger');
    }
}

/**
 * Show view thematic area modal (read-only)
 */
export async function showViewThematicAreaModal(thematicAreaId) {
    try {
        const thematicAreaRes = await apiService.get(`/thematic-areas/${thematicAreaId}`);
        const thematicArea = thematicAreaRes.data;

        const bodyHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">${thematicArea.name}</h5>
                    <span class="badge bg-secondary">${thematicArea.code}</span>
                    ${thematicArea.is_active ? '<span class="badge bg-success ms-2">Active</span>' : '<span class="badge bg-danger ms-2">Inactive</span>'}
                </div>
            </div>
            
            <div class="row">
                <div class="col-12 mb-3">
                    <strong>Description:</strong><br>
                    <p class="text-muted">${thematicArea.description || 'No description provided'}</p>
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Projects using this area:</strong><br>
                    <span class="badge bg-primary">${thematicArea.project_count || 0}</span>
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Indicators using this area:</strong><br>
                    <span class="badge bg-info">${thematicArea.indicator_count || 0}</span>
                </div>
            </div>
            
            <hr>
            
            <div class="row mt-3">
                <div class="col-12">
                    <small class="text-muted">
                        Created on ${thematicArea.created_at ? new Date(thematicArea.created_at).toLocaleDateString() : 'N/A'}
                    </small>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewThematicAreaModal',
            title: '<i class="bi bi-eye"></i> Thematic Area Details',
            body: bodyHTML,
            footer: footerHTML,
            size: 'lg'
        });

        const existingModal = document.getElementById('viewThematicAreaModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('viewThematicAreaModal'));
        modal.show();

        document.getElementById('viewThematicAreaModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load thematic area: ${error.message}`, 'danger');
    }
}

/**
 * Show delete confirmation modal
 */
export async function showDeleteThematicAreaModal(thematicAreaId, thematicAreaName, onSuccess) {
    const bodyHTML = `
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Warning!</strong> This action cannot be undone.
        </div>
        <p>Are you sure you want to delete the thematic area:</p>
        <p class="text-center"><strong>"${thematicAreaName}"</strong></p>
        <p class="text-muted"><small>Note: This will only work if no projects or indicators are using this thematic area.</small></p>
    `;

    const footerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
            <i class="bi bi-trash"></i> Delete Thematic Area
        </button>
    `;

    const modalHTML = createModal({
        id: 'deleteThematicAreaModal',
        title: '<i class="bi bi-trash"></i> Delete Thematic Area',
        body: bodyHTML,
        footer: footerHTML
    });

    const existingModal = document.getElementById('deleteThematicAreaModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('deleteThematicAreaModal'));
    modal.show();

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        try {
            const deleteBtn = document.getElementById('confirmDeleteBtn');
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';

            const response = await apiService.delete(`/thematic-areas/${thematicAreaId}`);

            if (response.success) {
                showNotification('Thematic area deleted successfully!', 'success');
                modal.hide();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            showNotification(`Failed to delete thematic area: ${error.message}`, 'danger');
            const deleteBtn = document.getElementById('confirmDeleteBtn');
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete Thematic Area';
        }
    });

    document.getElementById('deleteThematicAreaModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}
