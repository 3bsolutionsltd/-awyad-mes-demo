/**
 * Support Data Management Page
 * CRUD interface for managing case types and their categories dynamically.
 * Routes: #support-data
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';

// Module-level selected type ID so it survives a refresh inside the page
let _selectedTypeId = null;

export async function renderSupportData(container) {
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted">Loading support data...</p>
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

// ─── Internal re-render (called after every save/delete) ────────────────────

async function _refresh(container) {
    const [typesRes, allCatsRes] = await Promise.all([
        apiService.get('/cases/types/all'),
        apiService.get('/cases/categories/all')
    ]);

    const types = typesRes.data || [];
    const allCats = allCatsRes.data || [];

    // Group categories by case_type_id
    const catByType = {};
    allCats.forEach(c => {
        if (!catByType[c.case_type_id]) catByType[c.case_type_id] = [];
        catByType[c.case_type_id].push(c);
    });

    const selType = _selectedTypeId ? types.find(t => t.id === _selectedTypeId) : null;

    container.innerHTML = _buildPage(types, catByType, selType);
    _attachHandlers(container, types, catByType, () => _refresh(container));
}

// ─── Page structure ─────────────────────────────────────────────────────────

function _buildPage(types, catByType, selType) {
    const totalCats = Object.values(catByType).reduce((s, c) => s + c.length, 0);
    const typesNoCats = types.filter(t => !catByType[t.id] || catByType[t.id].length === 0).length;

    return `
    <div class="container-fluid">

        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1><i class="bi bi-gear-wide-connected"></i> Support Data Management</h1>
                <p class="text-muted mb-0">Manage case types and their sub-categories dynamically</p>
            </div>
        </div>

        <!-- Summary row -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card border-0 bg-primary bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-primary">${types.length}</div>
                        <div class="text-muted small">Case Types</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-success bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-success">${types.filter(t => t.is_active).length}</div>
                        <div class="text-muted small">Active Types</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 bg-info bg-opacity-10">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold text-info">${totalCats}</div>
                        <div class="text-muted small">Total Categories</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 ${typesNoCats > 0 ? 'bg-warning bg-opacity-10' : 'bg-light'}">
                    <div class="card-body text-center">
                        <div class="fs-2 fw-bold ${typesNoCats > 0 ? 'text-warning' : 'text-muted'}">${typesNoCats}</div>
                        <div class="text-muted small">Types Without Categories</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Two-column layout -->
        <div class="row g-3">

            <!-- Case Types column -->
            <div class="col-md-5">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <strong><i class="bi bi-tags"></i> Case Types</strong>
                        <button class="btn btn-sm btn-primary" id="btnAddType">
                            <i class="bi bi-plus-lg"></i> Add Type
                        </button>
                    </div>
                    <div class="card-body p-0">
                        ${types.length === 0
                            ? '<p class="text-muted text-center py-4">No case types defined.</p>'
                            : `<div class="list-group list-group-flush">
                                ${types.map(t => _typeRow(t, catByType, selType)).join('')}
                               </div>`
                        }
                    </div>
                </div>
            </div>

            <!-- Categories column -->
            <div class="col-md-7">
                <div id="categoriesCard" class="card h-100">
                    ${selType
                        ? _categoriesPanel(selType, catByType[selType.id] || [])
                        : _categoriesEmpty()
                    }
                </div>
            </div>

        </div>
    </div>`;
}

function _typeRow(type, catByType, selType) {
    const cats = catByType[type.id] || [];
    const isSelected = selType && selType.id === type.id;
    const cls = isSelected ? 'list-group-item list-group-item-action active' : 'list-group-item list-group-item-action';
    const cntBadge = `<span class="badge ${isSelected ? 'bg-light text-dark' : 'bg-secondary'} ms-1">${cats.length}</span>`;
    const inactiveBadge = type.is_active ? '' : `<span class="badge bg-secondary ms-1">Inactive</span>`;

    return `
    <div class="${cls} d-flex justify-content-between align-items-center py-2 px-3"
         data-select-type="${type.id}" style="cursor: pointer;">
        <div>
            <strong>${_esc(type.name)}</strong>
            <code class="ms-2 small">${_esc(type.code)}</code>
            ${inactiveBadge}
            ${cntBadge}
            <br>
            <small class="${isSelected ? 'text-white-50' : 'text-muted'}">
                ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}
                ${!type.is_active ? ' · Inactive' : ''}
            </small>
        </div>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
            <button class="btn btn-sm ${isSelected ? 'btn-outline-light' : 'btn-outline-secondary'}"
                    data-edit-type="${type.id}" title="Edit type">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm ${isSelected ? 'btn-outline-light' : 'btn-outline-danger'} btn-sm"
                    data-delete-type="${type.id}" data-type-name="${_esc(type.name)}" title="Deactivate type">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>`;
}

function _categoriesEmpty() {
    return `
    <div class="card-body d-flex flex-column align-items-center justify-content-center text-muted py-5" style="min-height: 200px;">
        <i class="bi bi-arrow-left-circle fs-1 mb-3"></i>
        <p class="mb-0">Select a case type to manage its categories.</p>
    </div>`;
}

function _categoriesPanel(type, cats) {
    const rows = cats.length === 0
        ? `<tr><td colspan="5" class="text-center text-muted py-4">
                <i class="bi bi-inbox fs-4 d-block mb-2"></i>
                No categories yet — click <strong>Add Category</strong> to create one.
           </td></tr>`
        : cats.map(c => `
            <tr>
                <td><code>${_esc(c.code)}</code></td>
                <td>
                    <strong>${_esc(c.name)}</strong>
                    ${c.description ? `<br><small class="text-muted">${_esc(c.description)}</small>` : ''}
                </td>
                <td class="text-center">${c.display_order ?? '—'}</td>
                <td>${c.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-cat="${c.id}" title="Edit category">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger"
                            data-delete-cat="${c.id}" data-cat-name="${_esc(c.name)}" title="Deactivate category">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`).join('');

    return `
    <div class="card-header d-flex justify-content-between align-items-center">
        <strong>
            <i class="bi bi-list-ul"></i> Categories —
            <span class="text-primary">${_esc(type.name)}</span>
            <span class="badge bg-secondary ms-1">${cats.length}</span>
        </strong>
        <button class="btn btn-sm btn-primary" id="btnAddCategory"
                data-type-id="${type.id}" data-type-name="${_esc(type.name)}">
            <i class="bi bi-plus-lg"></i> Add Category
        </button>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Code</th>
                        <th>Name / Description</th>
                        <th class="text-center">Order</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

// ─── Event handlers ──────────────────────────────────────────────────────────

function _attachHandlers(container, types, catByType, reload) {
    // Click a type row → select it and show categories
    container.querySelectorAll('[data-select-type]').forEach(el => {
        el.addEventListener('click', () => {
            const typeId = el.dataset.selectType;
            _selectedTypeId = typeId;
            const type = types.find(t => t.id === typeId);
            if (!type) return;

            // Update active state on all rows
            container.querySelectorAll('[data-select-type]').forEach(r => r.classList.remove('active'));
            el.classList.add('active');

            // Swap categories panel
            document.getElementById('categoriesCard').innerHTML =
                _categoriesPanel(type, catByType[typeId] || []);

            // Attach handlers to new panel
            _attachCatHandlers(container, type, catByType[typeId] || [], reload);
        });
    });

    // Add Type
    const btnAddType = document.getElementById('btnAddType');
    if (btnAddType) btnAddType.addEventListener('click', () => _showTypeModal(null, reload));

    // Edit Type buttons
    container.querySelectorAll('[data-edit-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = types.find(t => t.id === btn.dataset.editType);
            if (type) _showTypeModal(type, reload);
        });
    });

    // Delete (deactivate) Type buttons
    container.querySelectorAll('[data-delete-type]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const typeId = btn.dataset.deleteType;
            const name = btn.dataset.typeName;
            if (!confirm(`Deactivate case type "${name}"? It will no longer appear in case forms but existing cases are preserved.`)) return;
            try {
                await apiService.delete(`/cases/types/${typeId}`);
                showNotification('Case type deactivated.', 'success');
                if (_selectedTypeId === typeId) _selectedTypeId = null;
                await reload();
            } catch (err) {
                showNotification(`Failed: ${err.message}`, 'danger');
            }
        });
    });

    // If we have a selected type, attach category handlers right away
    if (_selectedTypeId) {
        const selType = types.find(t => t.id === _selectedTypeId);
        if (selType) _attachCatHandlers(container, selType, catByType[_selectedTypeId] || [], reload);
    }
}

function _attachCatHandlers(container, type, cats, reload) {
    const btnAddCat = document.getElementById('btnAddCategory');
    if (btnAddCat) {
        btnAddCat.addEventListener('click', () => _showCategoryModal(null, type, reload));
    }

    container.querySelectorAll('[data-edit-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = cats.find(c => c.id === btn.dataset.editCat);
            if (cat) _showCategoryModal(cat, type, reload);
        });
    });

    container.querySelectorAll('[data-delete-cat]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const catId = btn.dataset.deleteCat;
            const name = btn.dataset.catName;
            if (!confirm(`Deactivate category "${name}"?`)) return;
            try {
                await apiService.delete(`/cases/categories/${catId}`);
                showNotification('Category deactivated.', 'success');
                await reload();
            } catch (err) {
                showNotification(`Failed: ${err.message}`, 'danger');
            }
        });
    });
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function _showTypeModal(type, onSave) {
    const isEdit = !!type;
    const id = 'caseTypeFormModal';

    const existingModal = document.getElementById(id);
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', createModal({
        id,
        title: `<i class="bi bi-tags"></i> ${isEdit ? 'Edit Case Type' : 'New Case Type'}`,
        body: `
            <form id="caseTypeForm" novalidate>
                <div class="mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="100"
                           value="${isEdit ? _esc(type.name) : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="code" required maxlength="50"
                           value="${isEdit ? _esc(type.code) : ''}"
                           ${isEdit ? 'readonly class="form-control bg-light"' : ''}
                           placeholder="e.g. GBV, CP, LEGAL">
                    ${isEdit ? '<div class="form-text">Code cannot be changed after creation.</div>' : ''}
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="2" maxlength="500">${isEdit ? _esc(type.description || '') : ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Display Order</label>
                    <input type="number" class="form-control" name="display_order" min="0"
                           value="${isEdit ? (type.display_order ?? 0) : 0}">
                </div>
                ${isEdit ? `
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="typeActive" name="is_active"
                               ${type.is_active ? 'checked' : ''}>
                        <label class="form-check-label" for="typeActive">Active</label>
                    </div>
                </div>` : ''}
            </form>`,
        footer: `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveTypeBtn">
                <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Type'}
            </button>`,
        size: 'md'
    }));

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('saveTypeBtn').addEventListener('click', async () => {
        const form = document.getElementById('caseTypeForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        data.display_order = parseInt(data.display_order) || 0;
        if (isEdit) data.is_active = document.getElementById('typeActive')?.checked ?? true;

        const btn = document.getElementById('saveTypeBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            if (isEdit) {
                await apiService.put(`/cases/types/${type.id}`, data);
                showNotification('Case type updated.', 'success');
            } else {
                await apiService.post('/cases/types', data);
                showNotification('Case type created.', 'success');
            }
            modal.hide();
            await onSave();
        } catch (err) {
            showNotification(`Failed: ${err.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Type'}`;
        }
    });

    document.getElementById(id).addEventListener('hidden.bs.modal', function () { this.remove(); });
}

function _showCategoryModal(cat, type, onSave) {
    const isEdit = !!cat;
    const id = 'caseCatFormModal';

    const existingModal = document.getElementById(id);
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', createModal({
        id,
        title: `<i class="bi bi-list-ul"></i> ${isEdit ? 'Edit Category' : 'New Category'}`,
        body: `
            <form id="caseCatForm" novalidate>
                <input type="hidden" name="case_type_id" value="${type.id}">
                <div class="alert alert-light border py-2 mb-3 small">
                    <i class="bi bi-tag"></i> Case Type: <strong>${_esc(type.name)}</strong>
                </div>
                <div class="mb-3">
                    <label class="form-label">Category Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="100"
                           value="${isEdit ? _esc(cat.name) : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="code" required maxlength="50"
                           value="${isEdit ? _esc(cat.code) : ''}"
                           ${isEdit ? 'readonly' : ''}
                           placeholder="e.g. GBV_SEXUAL, CP_ABUSE">
                    ${isEdit ? '<div class="form-text">Code cannot be changed after creation.</div>' : ''}
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="2" maxlength="500">${isEdit ? _esc(cat.description || '') : ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Display Order</label>
                    <input type="number" class="form-control" name="display_order" min="0"
                           value="${isEdit ? (cat.display_order ?? 0) : 0}">
                </div>
                ${isEdit ? `
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="catActive" name="is_active"
                               ${cat.is_active ? 'checked' : ''}>
                        <label class="form-check-label" for="catActive">Active</label>
                    </div>
                </div>` : ''}
            </form>`,
        footer: `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveCatBtn">
                <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Category'}
            </button>`,
        size: 'md'
    }));

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('saveCatBtn').addEventListener('click', async () => {
        const form = document.getElementById('caseCatForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        data.display_order = parseInt(data.display_order) || 0;
        if (isEdit) data.is_active = document.getElementById('catActive')?.checked ?? true;

        const btn = document.getElementById('saveCatBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            if (isEdit) {
                await apiService.put(`/cases/categories/${cat.id}`, data);
                showNotification('Category updated.', 'success');
            } else {
                await apiService.post('/cases/categories', data);
                showNotification('Category created.', 'success');
            }
            modal.hide();
            await onSave();
        } catch (err) {
            showNotification(`Failed: ${err.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Category'}`;
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
