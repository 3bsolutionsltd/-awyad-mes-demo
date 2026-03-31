/**
 * Support Data Management Page
 * Central hub for managing all dynamic lookup data:
 * - Case types & categories  (Case Data tab)
 * - Districts & Settlements  (Locations tab)
 * - Nationalities            (Nationalities tab)
 * - Age Groups               (Age Groups tab)
 * Routes: #support-data
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';

let _selectedTypeId   = null;
let _selectedDistrictId = null;
let _activeTab        = 'case-data';

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

// ─── Internal re-render ──────────────────────────────────────────────────────

async function _refresh(container) {
    const [typesRes, allCatsRes, districtsRes, settlementsRes, natRes, ageGroupsRes] = await Promise.all([
        apiService.get('/cases/types/all'),
        apiService.get('/cases/categories/all'),
        apiService.get('/support-data/config-items?type=district'),
        apiService.get('/support-data/config-items?type=settlement'),
        apiService.get('/support-data/config-items?type=nationality'),
        apiService.get('/support-data/config-items?type=age_group'),
    ]);

    const types       = typesRes.data || [];
    const allCats     = allCatsRes.data || [];
    const catByType   = {};
    allCats.forEach(c => {
        if (!catByType[c.case_type_id]) catByType[c.case_type_id] = [];
        catByType[c.case_type_id].push(c);
    });

    const districts    = districtsRes.data   || [];
    const allSetts     = settlementsRes.data  || [];
    const nationalities= natRes.data          || [];
    const ageGroups    = ageGroupsRes.data    || [];

    const settByDistrict = {};
    allSetts.forEach(s => {
        if (!settByDistrict[s.parent_id]) settByDistrict[s.parent_id] = [];
        settByDistrict[s.parent_id].push(s);
    });

    container.innerHTML = _buildPage(types, catByType, districts, settByDistrict, nationalities, ageGroups);
    _attachHandlers(container, types, catByType, districts, settByDistrict, nationalities, ageGroups,
        () => _refresh(container));

    // Restore the active Bootstrap tab
    const tabBtn = container.querySelector(`[data-bs-target="#tab-${_activeTab}"]`);
    if (tabBtn) {
        const bsTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
        bsTab.show();
    }
}

// ─── Page structure ──────────────────────────────────────────────────────────

function _buildPage(types, catByType, districts, settByDistrict, nationalities, ageGroups) {
    const selType    = _selectedTypeId     ? types.find(t => t.id === _selectedTypeId)         : null;
    const selDistrict= _selectedDistrictId ? districts.find(d => d.id === _selectedDistrictId) : null;

    return `
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1><i class="bi bi-gear-wide-connected"></i> Support Data Management</h1>
                <p class="text-muted mb-0">Manage all dynamic lookup data used across forms</p>
            </div>
        </div>

        <ul class="nav nav-tabs mb-4" id="supportDataTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-case-data" type="button">
                    <i class="bi bi-tags"></i> Case Data
                    <span class="badge bg-secondary ms-1">${types.length}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-locations" type="button">
                    <i class="bi bi-geo-alt"></i> Locations
                    <span class="badge bg-secondary ms-1">${districts.length}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-nationalities" type="button">
                    <i class="bi bi-flag"></i> Nationalities
                    <span class="badge bg-secondary ms-1">${nationalities.length}</span>
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-age-groups" type="button">
                    <i class="bi bi-person-badge"></i> Age Groups
                    <span class="badge bg-secondary ms-1">${ageGroups.length}</span>
                </button>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade" id="tab-case-data">
                ${_buildCaseDataTab(types, catByType, selType)}
            </div>
            <div class="tab-pane fade" id="tab-locations">
                ${_buildLocationsTab(districts, settByDistrict, selDistrict)}
            </div>
            <div class="tab-pane fade" id="tab-nationalities">
                ${_buildConfigListTab('nationality', 'Nationalities', nationalities, 'bi-flag')}
            </div>
            <div class="tab-pane fade" id="tab-age-groups">
                ${_buildConfigListTab('age_group', 'Age Groups', ageGroups, 'bi-person-badge')}
            </div>
        </div>
    </div>`;
}

// ─── Tab content builders ────────────────────────────────────────────────────

function _buildCaseDataTab(types, catByType, selType) {
    const totalCats   = Object.values(catByType).reduce((s, c) => s + c.length, 0);
    const activeTypes = types.filter(t => t.is_active).length;
    return `
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card border-0 bg-primary bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-primary">${types.length}</div>
                    <div class="text-muted small">Case Types</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 bg-success bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-success">${activeTypes}</div>
                    <div class="text-muted small">Active Types</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 bg-info bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-info">${totalCats}</div>
                    <div class="text-muted small">Total Categories</div>
                </div>
            </div>
        </div>
    </div>
    <div class="row g-3">
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
        <div class="col-md-7">
            <div id="categoriesCard" class="card h-100">
                ${selType ? _categoriesPanel(selType, catByType[selType.id] || []) : _categoriesEmpty()}
            </div>
        </div>
    </div>`;
}

function _buildLocationsTab(districts, settByDistrict, selDistrict) {
    const totalSetts = Object.values(settByDistrict).reduce((s, a) => s + a.length, 0);
    return `
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card border-0 bg-primary bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-primary">${districts.length}</div>
                    <div class="text-muted small">Districts / Towns</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 bg-success bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-success">${districts.filter(d => d.is_active).length}</div>
                    <div class="text-muted small">Active Districts</div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 bg-info bg-opacity-10">
                <div class="card-body text-center">
                    <div class="fs-2 fw-bold text-info">${totalSetts}</div>
                    <div class="text-muted small">Total Settlements / TCs</div>
                </div>
            </div>
        </div>
    </div>
    <div class="row g-3">
        <div class="col-md-5">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <strong><i class="bi bi-geo-alt"></i> Districts / Towns</strong>
                    <button class="btn btn-sm btn-primary" id="btnAddDistrict">
                        <i class="bi bi-plus-lg"></i> Add District
                    </button>
                </div>
                <div class="card-body p-0">
                    ${districts.length === 0
                        ? '<p class="text-muted text-center py-4">No districts defined.</p>'
                        : `<div class="list-group list-group-flush">
                            ${districts.map(d => _districtRow(d, settByDistrict, selDistrict)).join('')}
                           </div>`
                    }
                </div>
            </div>
        </div>
        <div class="col-md-7">
            <div id="settlementsCard" class="card h-100">
                ${selDistrict
                    ? _settlementsPanel(selDistrict, settByDistrict[selDistrict.id] || [])
                    : `<div class="card-body d-flex flex-column align-items-center justify-content-center text-muted py-5">
                           <i class="bi bi-arrow-left-circle fs-1 mb-3"></i>
                           <p class="mb-0">Select a district to manage its settlements.</p>
                       </div>`
                }
            </div>
        </div>
    </div>`;
}

function _buildConfigListTab(configType, title, items, icon) {
    const rows = items.length === 0
        ? `<tr><td colspan="4" class="text-center text-muted py-4">
               <i class="bi bi-inbox fs-4 d-block mb-2"></i>No ${title.toLowerCase()} yet.
           </td></tr>`
        : items.map(item => `
            <tr>
                <td><code>${_esc(item.code || '')}</code></td>
                <td><strong>${_esc(item.name)}</strong>
                    ${item.description ? `<br><small class="text-muted">${_esc(item.description)}</small>` : ''}
                </td>
                <td>${item.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-config="${item.id}" data-config-type="${configType}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm ${item.is_active ? 'btn-outline-warning' : 'btn-outline-success'}"
                            data-toggle-config="${item.id}" data-config-active="${item.is_active}">
                        <i class="bi bi-${item.is_active ? 'toggle-on' : 'toggle-off'}"></i>
                    </button>
                </td>
            </tr>`).join('');

    return `
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <strong><i class="bi ${icon}"></i> ${_esc(title)}</strong>
            <button class="btn btn-sm btn-primary" id="btnAdd_${configType}">
                <i class="bi bi-plus-lg"></i> Add ${title.replace(/s$/, '')}
            </button>
        </div>
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Code</th><th>Name</th><th>Status</th><th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    </div>`;
}

// ─── Row / panel helpers ─────────────────────────────────────────────────────

function _typeRow(type, catByType, selType) {
    const cats = catByType[type.id] || [];
    const isSel = selType && selType.id === type.id;
    const cls = isSel ? 'list-group-item list-group-item-action active' : 'list-group-item list-group-item-action';
    return `
    <div class="${cls} d-flex justify-content-between align-items-center py-2 px-3"
         data-select-type="${type.id}" style="cursor:pointer">
        <div>
            <strong>${_esc(type.name)}</strong>
            <code class="ms-2 small">${_esc(type.code)}</code>
            ${!type.is_active ? '<span class="badge bg-secondary ms-1">Inactive</span>' : ''}
            <span class="badge ${isSel ? 'bg-light text-dark' : 'bg-secondary'} ms-1">${cats.length}</span>
            <br>
            <small class="${isSel ? 'text-white-50' : 'text-muted'}">${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}</small>
        </div>
        <div class="d-flex gap-1" onclick="event.stopPropagation()">
            <button class="btn btn-sm ${isSel ? 'btn-outline-light' : 'btn-outline-secondary'}"
                    data-edit-type="${type.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm ${isSel ? 'btn-outline-light' : 'btn-outline-danger'}"
                    data-delete-type="${type.id}" data-type-name="${_esc(type.name)}">
                <i class="bi bi-trash"></i></button>
        </div>
    </div>`;
}

function _categoriesEmpty() {
    return `<div class="card-body d-flex flex-column align-items-center justify-content-center text-muted py-5" style="min-height:200px">
        <i class="bi bi-arrow-left-circle fs-1 mb-3"></i>
        <p class="mb-0">Select a case type to manage its categories.</p>
    </div>`;
}

function _categoriesPanel(type, cats) {
    const rows = cats.length === 0
        ? `<tr><td colspan="5" class="text-center text-muted py-4">
               <i class="bi bi-inbox fs-4 d-block mb-2"></i>
               No categories yet — click <strong>Add Category</strong>.
           </td></tr>`
        : cats.map(c => `
            <tr>
                <td><code>${_esc(c.code)}</code></td>
                <td><strong>${_esc(c.name)}</strong>
                    ${c.description ? `<br><small class="text-muted">${_esc(c.description)}</small>` : ''}
                </td>
                <td class="text-center">${c.display_order ?? '—'}</td>
                <td>${c.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-cat="${c.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger"
                            data-delete-cat="${c.id}" data-cat-name="${_esc(c.name)}">
                        <i class="bi bi-trash"></i></button>
                </td>
            </tr>`).join('');
    return `
    <div class="card-header d-flex justify-content-between align-items-center">
        <strong><i class="bi bi-list-ul"></i> Categories — <span class="text-primary">${_esc(type.name)}</span>
            <span class="badge bg-secondary ms-1">${cats.length}</span></strong>
        <button class="btn btn-sm btn-primary" id="btnAddCategory"
                data-type-id="${type.id}"><i class="bi bi-plus-lg"></i> Add Category</button>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr><th>Code</th><th>Name</th><th class="text-center">Order</th>
                        <th>Status</th><th class="text-end">Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

function _districtRow(district, settByDistrict, selDistrict) {
    const setts = settByDistrict[district.id] || [];
    const isSel = selDistrict && selDistrict.id === district.id;
    const cls = isSel ? 'list-group-item list-group-item-action active' : 'list-group-item list-group-item-action';
    return `
    <div class="${cls} d-flex justify-content-between align-items-center py-2 px-3"
         data-select-district="${district.id}" style="cursor:pointer">
        <div>
            <strong>${_esc(district.name)}</strong>
            ${!district.is_active ? '<span class="badge bg-secondary ms-1">Inactive</span>' : ''}
            <span class="badge ${isSel ? 'bg-light text-dark' : 'bg-secondary'} ms-1">${setts.length}</span>
            <br>
            <small class="${isSel ? 'text-white-50' : 'text-muted'}">${setts.length} settlement${setts.length !== 1 ? 's' : ''}</small>
        </div>
        <div onclick="event.stopPropagation()">
            <button class="btn btn-sm ${isSel ? 'btn-outline-light' : 'btn-outline-secondary'}"
                    data-edit-district="${district.id}"><i class="bi bi-pencil"></i></button>
        </div>
    </div>`;
}

function _settlementsPanel(district, settlements) {
    const rows = settlements.length === 0
        ? `<tr><td colspan="3" class="text-center text-muted py-4">
               <i class="bi bi-inbox fs-4 d-block mb-2"></i>
               No settlements yet — click <strong>Add Settlement</strong>.
           </td></tr>`
        : settlements.map(s => `
            <tr>
                <td><strong>${_esc(s.name)}</strong></td>
                <td>${s.is_active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-secondary">Inactive</span>'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            data-edit-settlement="${s.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm ${s.is_active ? 'btn-outline-warning' : 'btn-outline-success'}"
                            data-toggle-settlement="${s.id}" data-settlement-active="${s.is_active}">
                        <i class="bi bi-${s.is_active ? 'toggle-on' : 'toggle-off'}"></i></button>
                </td>
            </tr>`).join('');
    return `
    <div class="card-header d-flex justify-content-between align-items-center">
        <strong><i class="bi bi-house"></i> Settlements — <span class="text-primary">${_esc(district.name)}</span>
            <span class="badge bg-secondary ms-1">${settlements.length}</span></strong>
        <button class="btn btn-sm btn-primary" id="btnAddSettlement"
                data-district-id="${district.id}"><i class="bi bi-plus-lg"></i> Add Settlement</button>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr><th>Name</th><th>Status</th><th class="text-end">Actions</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

// ─── Event handlers ──────────────────────────────────────────────────────────

function _attachHandlers(container, types, catByType, districts, settByDistrict, nationalities, ageGroups, reload) {
    // Track active tab
    container.querySelectorAll('[data-bs-toggle="tab"]').forEach(btn => {
        btn.addEventListener('shown.bs.tab', e => {
            _activeTab = e.target.getAttribute('data-bs-target')?.replace('#tab-', '') ?? 'case-data';
        });
    });

    // ── Case Data tab ──
    document.getElementById('btnAddType')?.addEventListener('click', () => _showTypeModal(null, reload));

    container.querySelectorAll('[data-select-type]').forEach(el => {
        el.addEventListener('click', () => {
            _selectedTypeId = el.dataset.selectType;
            const type = types.find(t => t.id === _selectedTypeId);
            if (!type) return;
            container.querySelectorAll('[data-select-type]').forEach(r => r.classList.remove('active'));
            el.classList.add('active');
            document.getElementById('categoriesCard').innerHTML = _categoriesPanel(type, catByType[_selectedTypeId] || []);
            _attachCatHandlers(container, type, catByType[_selectedTypeId] || [], reload);
        });
    });

    container.querySelectorAll('[data-edit-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = types.find(t => t.id === btn.dataset.editType);
            if (type) _showTypeModal(type, reload);
        });
    });

    container.querySelectorAll('[data-delete-type]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm(`Deactivate case type "${btn.dataset.typeName}"?`)) return;
            try {
                await apiService.delete(`/cases/types/${btn.dataset.deleteType}`);
                showNotification('Case type deactivated.', 'success');
                if (_selectedTypeId === btn.dataset.deleteType) _selectedTypeId = null;
                await reload();
            } catch (err) { showNotification(`Failed: ${err.message}`, 'danger'); }
        });
    });

    if (_selectedTypeId) {
        const selType = types.find(t => t.id === _selectedTypeId);
        if (selType) _attachCatHandlers(container, selType, catByType[_selectedTypeId] || [], reload);
    }

    // ── Locations tab ──
    document.getElementById('btnAddDistrict')?.addEventListener('click', () => _showLocationModal(null, null, reload));

    container.querySelectorAll('[data-select-district]').forEach(el => {
        el.addEventListener('click', () => {
            _selectedDistrictId = el.dataset.selectDistrict;
            const dist = districts.find(d => d.id === _selectedDistrictId);
            if (!dist) return;
            container.querySelectorAll('[data-select-district]').forEach(r => r.classList.remove('active'));
            el.classList.add('active');
            document.getElementById('settlementsCard').innerHTML = _settlementsPanel(dist, settByDistrict[_selectedDistrictId] || []);
            _attachSettlementHandlers(container, dist, settByDistrict[_selectedDistrictId] || [], reload);
        });
    });

    container.querySelectorAll('[data-edit-district]').forEach(btn => {
        btn.addEventListener('click', () => {
            const dist = districts.find(d => d.id === btn.dataset.editDistrict);
            if (dist) _showLocationModal(dist, null, reload);
        });
    });

    if (_selectedDistrictId) {
        const selDist = districts.find(d => d.id === _selectedDistrictId);
        if (selDist) _attachSettlementHandlers(container, selDist, settByDistrict[_selectedDistrictId] || [], reload);
    }

    // ── Config list tabs (nationalities + age groups) ──
    for (const [configType, items] of [['nationality', nationalities], ['age_group', ageGroups]]) {
        document.getElementById(`btnAdd_${configType}`)?.addEventListener('click',
            () => _showConfigItemModal(null, configType, reload));

        container.querySelectorAll(`[data-edit-config][data-config-type="${configType}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                const item = items.find(i => i.id === btn.dataset.editConfig);
                if (item) _showConfigItemModal(item, configType, reload);
            });
        });

        container.querySelectorAll('[data-toggle-config]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const isActive = btn.dataset.configActive === 'true';
                try {
                    await apiService.put(`/support-data/config-items/${btn.dataset.toggleConfig}`, { is_active: !isActive });
                    showNotification(`Item ${isActive ? 'deactivated' : 'activated'}.`, 'success');
                    await reload();
                } catch (err) { showNotification(`Failed: ${err.message}`, 'danger'); }
            });
        });
    }
}

function _attachCatHandlers(container, type, cats, reload) {
    document.getElementById('btnAddCategory')?.addEventListener('click', () => _showCategoryModal(null, type, reload));

    container.querySelectorAll('[data-edit-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = cats.find(c => c.id === btn.dataset.editCat);
            if (cat) _showCategoryModal(cat, type, reload);
        });
    });

    container.querySelectorAll('[data-delete-cat]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm(`Deactivate category "${btn.dataset.catName}"?`)) return;
            try {
                await apiService.delete(`/cases/categories/${btn.dataset.deleteCat}`);
                showNotification('Category deactivated.', 'success');
                await reload();
            } catch (err) { showNotification(`Failed: ${err.message}`, 'danger'); }
        });
    });
}

function _attachSettlementHandlers(container, district, settlements, reload) {
    document.getElementById('btnAddSettlement')?.addEventListener('click',
        () => _showLocationModal(null, district, reload));

    container.querySelectorAll('[data-edit-settlement]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sett = settlements.find(s => s.id === btn.dataset.editSettlement);
            if (sett) _showLocationModal(sett, district, reload);
        });
    });

    container.querySelectorAll('[data-toggle-settlement]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const isActive = btn.dataset.settlementActive === 'true';
            try {
                await apiService.put(`/support-data/config-items/${btn.dataset.toggleSettlement}`, { is_active: !isActive });
                showNotification(`Settlement ${isActive ? 'deactivated' : 'activated'}.`, 'success');
                await reload();
            } catch (err) { showNotification(`Failed: ${err.message}`, 'danger'); }
        });
    });
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function _showTypeModal(type, onSave) {
    const isEdit = !!type;
    const id = 'caseTypeFormModal';
    document.getElementById(id)?.remove();

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
                           ${isEdit ? 'readonly' : ''} placeholder="e.g. GBV, CP, LEGAL">
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
                ${isEdit ? `<div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="typeActive"
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
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            if (isEdit) {
                await apiService.put(`/cases/types/${type.id}`, data);
                showNotification('Case type updated.', 'success');
            } else {
                await apiService.post('/cases/types', data);
                showNotification('Case type created.', 'success');
            }
            modal.hide(); await onSave();
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
    document.getElementById(id)?.remove();

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
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="100"
                           value="${isEdit ? _esc(cat.name) : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Code <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="code" required maxlength="50"
                           value="${isEdit ? _esc(cat.code) : ''}"
                           ${isEdit ? 'readonly' : ''} placeholder="e.g. GBV_SEXUAL, CP_ABUSE">
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
                ${isEdit ? `<div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="catActive"
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
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            if (isEdit) {
                await apiService.put(`/cases/categories/${cat.id}`, data);
                showNotification('Category updated.', 'success');
            } else {
                await apiService.post('/cases/categories', data);
                showNotification('Category created.', 'success');
            }
            modal.hide(); await onSave();
        } catch (err) {
            showNotification(`Failed: ${err.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create Category'}`;
        }
    });
    document.getElementById(id).addEventListener('hidden.bs.modal', function () { this.remove(); });
}

function _showLocationModal(item, parentDistrict, onSave) {
    const isEdit = !!item;
    const isSettlement = !!parentDistrict;
    const id = 'locationFormModal';
    document.getElementById(id)?.remove();

    const title = isSettlement
        ? `${isEdit ? 'Edit' : 'New'} Settlement / TC`
        : `${isEdit ? 'Edit' : 'New'} District / Major Town`;

    document.body.insertAdjacentHTML('beforeend', createModal({
        id,
        title: `<i class="bi bi-geo-alt"></i> ${title}`,
        body: `
            <form id="locationForm" novalidate>
                ${isSettlement ? `<div class="alert alert-light border py-2 mb-3 small">
                    <i class="bi bi-geo-alt"></i> District: <strong>${_esc(parentDistrict.name)}</strong>
                </div>` : ''}
                <div class="mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="100"
                           value="${isEdit ? _esc(item.name) : ''}"
                           placeholder="${isSettlement ? 'e.g., Nakivale, Oruchinga' : 'e.g., Mbarara, Kampala'}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Code</label>
                    <input type="text" class="form-control" name="code" maxlength="50"
                           value="${isEdit ? _esc(item.code || '') : ''}" placeholder="Optional short code">
                </div>
                <div class="mb-3">
                    <label class="form-label">Display Order</label>
                    <input type="number" class="form-control" name="display_order" min="0"
                           value="${isEdit ? (item.display_order ?? 0) : 0}">
                </div>
                ${isEdit ? `<div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="locActive"
                               ${item.is_active ? 'checked' : ''}>
                        <label class="form-check-label" for="locActive">Active</label>
                    </div>
                </div>` : ''}
            </form>`,
        footer: `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveLocationBtn">
                <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create'}
            </button>`,
        size: 'md'
    }));

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('saveLocationBtn').addEventListener('click', async () => {
        const form = document.getElementById('locationForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            config_value:  fd.get('name'),
            config_code:   fd.get('code') || null,
            display_order: parseInt(fd.get('display_order')) || 0,
        };
        const btn = document.getElementById('saveLocationBtn');
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            if (isEdit) {
                if (document.getElementById('locActive')) {
                    data.is_active = document.getElementById('locActive').checked;
                }
                await apiService.put(`/support-data/config-items/${item.id}`, data);
                showNotification(`${isSettlement ? 'Settlement' : 'District'} updated.`, 'success');
            } else {
                data.config_type = isSettlement ? 'settlement' : 'district';
                if (isSettlement) data.parent_id = parentDistrict.id;
                await apiService.post('/support-data/config-items', data);
                showNotification(`${isSettlement ? 'Settlement' : 'District'} created.`, 'success');
            }
            modal.hide(); await onSave();
        } catch (err) {
            showNotification(`Failed: ${err.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : 'Create'}`;
        }
    });
    document.getElementById(id).addEventListener('hidden.bs.modal', function () { this.remove(); });
}

function _showConfigItemModal(item, configType, onSave) {
    const isEdit = !!item;
    const labels = { nationality: 'Nationality', age_group: 'Age Group' };
    const label = labels[configType] || configType;
    const id = 'configItemFormModal';
    document.getElementById(id)?.remove();

    document.body.insertAdjacentHTML('beforeend', createModal({
        id,
        title: `<i class="bi bi-pencil-square"></i> ${isEdit ? 'Edit' : 'New'} ${label}`,
        body: `
            <form id="configItemForm" novalidate>
                <div class="mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" name="name" required maxlength="100"
                           value="${isEdit ? _esc(item.name) : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Code</label>
                    <input type="text" class="form-control" name="code" maxlength="50"
                           value="${isEdit ? _esc(item.code || '') : ''}" placeholder="Optional short code">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" name="description" rows="2" maxlength="500">${isEdit ? _esc(item.description || '') : ''}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Display Order</label>
                    <input type="number" class="form-control" name="display_order" min="0"
                           value="${isEdit ? (item.display_order ?? 0) : 0}">
                </div>
            </form>`,
        footer: `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="saveConfigItemBtn">
                <i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : `Create ${label}`}
            </button>`,
        size: 'md'
    }));

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('saveConfigItemBtn').addEventListener('click', async () => {
        const form = document.getElementById('configItemForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const fd = new FormData(form);
        const data = {
            config_value:  fd.get('name'),
            config_code:   fd.get('code') || null,
            description:   fd.get('description') || null,
            display_order: parseInt(fd.get('display_order')) || 0,
        };
        const btn = document.getElementById('saveConfigItemBtn');
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            if (isEdit) {
                await apiService.put(`/support-data/config-items/${item.id}`, data);
                showNotification(`${label} updated.`, 'success');
            } else {
                data.config_type = configType;
                await apiService.post('/support-data/config-items', data);
                showNotification(`${label} created.`, 'success');
            }
            modal.hide(); await onSave();
        } catch (err) {
            showNotification(`Failed: ${err.message}`, 'danger');
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-lg"></i> ${isEdit ? 'Save Changes' : `Create ${label}`}`;
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
