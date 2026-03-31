/**
 * Donor Management Page
 * CRUD interface for managing the donors lookup table.
 * Routes: #donors
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';

export async function renderDonorManagement(container) {
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Loading donors...</p>
        </div>`;
    try {
        await _refresh(container);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load: ${error.message}
            </div>`;
    }
}

// ─── Internal re-render ──────────────────────────────────────────────────────

async function _refresh(container) {
    const res = await apiService.get('/donors?include_inactive=true');
    const donors = res.data || [];
    container.innerHTML = _buildPage(donors);
    _attachHandlers(container, donors, () => _refresh(container));
}

// ─── Page structure ──────────────────────────────────────────────────────────

function _buildPage(donors) {
    const active = donors.filter(d => d.is_active).length;
    const inactive = donors.length - active;

    const rows = donors.length === 0
        ? `<tr><td colspan="6" class="text-center text-muted py-4">
                <i class="bi bi-inbox fs-4 d-block mb-2"></i>
                No donors yet — click <strong>Add Donor</strong> to create one.
           </td></tr>`
        : donors.map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${_esc(d.name)}</strong></td>
                <td>${_esc(d.short_name || '—')}</td>
                <td>${d.website
                    ? `<a href="${_esc(d.website)}" target="_blank" rel="noopener noreferrer" class="small">${_esc(d.website)}</a>`
                    : '<span class="text-muted">—</span>'}</td>
                <td>${d.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-donor="${d.id}" title="Edit donor">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm ${d.is_active ? 'btn-outline-warning' : 'btn-outline-success'}"
                            data-toggle-donor="${d.id}" data-active="${d.is_active}" title="${d.is_active ? 'Deactivate' : 'Activate'}">
                        <i class="bi bi-${d.is_active ? 'pause-circle' : 'play-circle'}"></i>
                        ${d.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>`).join('');

    return `
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1><i class="bi bi-people-fill"></i> Donor Management</h1>
                <p class="text-muted mb-0">Manage the list of donors that appear in project forms</p>
            </div>
            <button class="btn btn-primary" id="btnAddDonor">
                <i class="bi bi-plus-lg"></i> Add Donor
            </button>
        </div>

        <!-- Summary cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card border-0 bg-primary bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-primary">${donors.length}</div>
                        <div class="text-muted small">Total Donors</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-success bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-success">${active}</div>
                        <div class="text-muted small">Active</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 bg-secondary bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-secondary">${inactive}</div>
                        <div class="text-muted small">Inactive</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Donors table -->
        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Short Name</th>
                                <th>Website</th>
                                <th>Status</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
}

// ─── Event handlers ──────────────────────────────────────────────────────────

function _attachHandlers(container, donors, reload) {
    const btnAdd = document.getElementById('btnAddDonor');
    if (btnAdd) btnAdd.addEventListener('click', () => _showDonorModal(null, reload));

    container.querySelectorAll('[data-edit-donor]').forEach(btn => {
        btn.addEventListener('click', () => {
            const donor = donors.find(d => d.id === btn.dataset.editDonor);
            if (donor) _showDonorModal(donor, reload);
        });
    });

    container.querySelectorAll('[data-toggle-donor]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.toggleDonor;
            const currentlyActive = btn.dataset.active === 'true';
            try {
                await apiService.put(`/donors/${id}`, { is_active: !currentlyActive });
                showNotification(currentlyActive ? 'Donor deactivated.' : 'Donor activated.', 'success');
                await reload();
            } catch (err) {
                showNotification(`Failed: ${err.message}`, 'danger');
            }
        });
    });
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function _showDonorModal(donor, onSave) {
    const isEdit = !!donor;
    const id = 'donorFormModal';

    const existingModal = document.getElementById(id);
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', createModal({
        id,
        title: `<i class="bi bi-people-fill"></i> ${isEdit ? 'Edit Donor' : 'New Donor'}`,
        body: `
            <form id="donorForm" novalidate>
                <div class="mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="150"
                           value="${isEdit ? _esc(donor.name) : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Short Name</label>
                    <input type="text" class="form-control" name="short_name" maxlength="50"
                           value="${isEdit ? _esc(donor.short_name || '') : ''}"
                           placeholder="e.g. USAID, UNHCR">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="2" maxlength="500">${isEdit ? _esc(donor.description || '') : ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Website</label>
                    <input type="url" class="form-control" name="website" maxlength="255"
                           value="${isEdit ? _esc(donor.website || '') : ''}"
                           placeholder="https://...">
                </div>
                ${isEdit ? `
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="donorActive" name="is_active"
                               ${donor.is_active ? 'checked' : ''}>
                        <label class="form-check-label" for="donorActive">Active</label>
                    </div>
                </div>` : ''}
                <div id="donorModalError"></div>
            </form>`,
        footer: `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveDonorBtn">
                <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Donor'}
            </button>`,
        size: 'md'
    }));

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('saveDonorBtn').addEventListener('click', async () => {
        const form = document.getElementById('donorForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        if (isEdit) data.is_active = document.getElementById('donorActive')?.checked ?? true;

        const btn = document.getElementById('saveDonorBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            if (isEdit) {
                await apiService.put(`/donors/${donor.id}`, data);
                showNotification('Donor updated.', 'success');
            } else {
                await apiService.post('/donors', data);
                showNotification('Donor created.', 'success');
            }
            modal.hide();
            await onSave();
        } catch (err) {
            document.getElementById('donorModalError').innerHTML =
                `<div class="alert alert-danger mt-2 mb-0 py-2">${_esc(err.message)}</div>`;
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Donor'}`;
        }
    });

    document.getElementById(id).addEventListener('hidden.bs.modal', function () { this.remove(); });
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function _esc(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
}
