/**
 * Case Forms Module
 * Handles Create, Edit, View operations for Cases
 *
 * PRIVACY: No name fields — cases are identified by case_number only.
 * Fields aligned with /api/v1/cases backend (casesNew.js / caseService.js).
 */

import { apiService } from './apiService.js';
import { createModal } from './components.js';
import { showNotification } from './components.js';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function toDateVal(v) {
    if (!v) return '';
    try { return new Date(v).toISOString().split('T')[0]; } catch { return ''; }
}

async function loadDropdowns() {
    const [typesRes, projectsRes] = await Promise.all([
        apiService.get('/cases/types/active'),
        apiService.get('/projects'),
    ]);
    return {
        caseTypes: typesRes.data || [],
        projects: projectsRes.data?.projects || projectsRes.data || [],
    };
}

async function loadCategories(caseTypeId) {
    if (!caseTypeId) return [];
    try {
        const res = await apiService.get(`/cases/categories/type/${caseTypeId}`);
        return res.data || [];
    } catch { return []; }
}

function caseTypeOptions(types, selectedId = '') {
    return types.map(t =>
        `<option value="${esc(t.id)}" ${t.id === selectedId ? 'selected' : ''}>${esc(t.name)}</option>`
    ).join('');
}

function projectOptions(projects, selectedId = '') {
    return projects.map(p =>
        `<option value="${esc(p.id)}" ${p.id === selectedId ? 'selected' : ''}>${esc(p.name)}</option>`
    ).join('');
}

function categoryOptions(categories, selectedId = '') {
    if (!categories.length) return '<option value="">— Select Type First —</option>';
    return `<option value="">— Select Category —</option>` +
        categories.map(c =>
            `<option value="${esc(c.id)}" ${c.id === selectedId ? 'selected' : ''}>${esc(c.name)}</option>`
        ).join('');
}

function getStatusBadge(status) {
    const map = { Open: 'primary', 'In Progress': 'info', Pending: 'warning', Closed: 'secondary' };
    return `<span class="badge bg-${map[status] || 'secondary'}">${esc(status)}</span>`;
}

function buildFormHTML(id, caseData, { caseTypes, projects, categories }) {
    const isEdit = !!caseData;
    const d = caseData || {};
    return `
<div class="alert alert-info py-2 mb-3 small">
  <i class="bi bi-shield-lock me-1"></i>
  <strong>Confidential:</strong> No names are recorded. Cases are identified by case number only.
</div>
<form id="${id}" novalidate>

  <!-- Row 1: Case Number + Date Reported -->
  <div class="row g-3 mb-3">
    <div class="col-md-6">
      <label class="form-label">Case Number ${isEdit ? '' : '<span class="text-danger">*</span>'}</label>
      <input type="text" class="form-control" name="case_number" ${isEdit ? 'readonly' : 'required'}
        maxlength="50" placeholder="e.g. CASE-2026-001" value="${esc(d.case_number || '')}">
    </div>
    <div class="col-md-6">
      <label class="form-label">Date Reported <span class="text-danger">*</span></label>
      <input type="date" class="form-control" name="date_reported" required
        value="${toDateVal(d.date_reported) || toDateVal(new Date())}">
    </div>
  </div>

  <!-- Row 2: Case Type + Category -->
  <div class="row g-3 mb-3">
    <div class="col-md-6">
      <label class="form-label">Case Type <span class="text-danger">*</span></label>
      <select class="form-select" name="case_type_id" id="${id}_typeSelect" required>
        <option value="">— Select Type —</option>
        ${caseTypeOptions(caseTypes, d.case_type_id)}
      </select>
    </div>
    <div class="col-md-6">
      <label class="form-label">Case Category</label>
      <select class="form-select" name="case_category_id" id="${id}_categorySelect"
        ${!d.case_type_id ? 'disabled' : ''}>
        ${categoryOptions(categories, d.case_category_id)}
      </select>
    </div>
  </div>

  <!-- Row 3: Status + Case Worker -->
  <div class="row g-3 mb-3">
    <div class="col-md-6">
      <label class="form-label">Status</label>
      <select class="form-select" name="status">
        ${['Open','In Progress','Pending','Closed'].map(s =>
            `<option value="${s}" ${(d.status || 'Open') === s ? 'selected' : ''}>${s}</option>`
        ).join('')}
      </select>
    </div>
    <div class="col-md-6">
      <label class="form-label">Case Worker</label>
      <input type="text" class="form-control" name="case_worker"
        maxlength="200" placeholder="Assigned case worker" value="${esc(d.case_worker || '')}">
    </div>
  </div>

  <!-- Row 4: Project + Location -->
  <div class="row g-3 mb-3">
    <div class="col-md-6">
      <label class="form-label">Project</label>
      <select class="form-select" name="project_id">
        <option value="">— None —</option>
        ${projectOptions(projects, d.project_id)}
      </select>
    </div>
    <div class="col-md-6">
      <label class="form-label">Location</label>
      <input type="text" class="form-control" name="location"
        maxlength="100" placeholder="e.g., Adjumani, Kampala" value="${esc(d.location || '')}">
    </div>
  </div>

  <!-- Row 5: Demographics -->
  <div class="row g-3 mb-3">
    <div class="col-md-4">
      <label class="form-label">Gender <span class="text-danger">*</span></label>
      <select class="form-select" name="gender" required>
        <option value="">— Select —</option>
        ${['Male','Female','Other','Prefer not to say'].map(g =>
            `<option value="${g}" ${d.gender === g ? 'selected' : ''}>${g}</option>`
        ).join('')}
      </select>
    </div>
    <div class="col-md-4">
      <label class="form-label">Age Group <span class="text-danger">*</span></label>
      <select class="form-select" name="age_group" required>
        <option value="">— Select —</option>
        ${['0-4','5-17','18-49','50+'].map(a =>
            `<option value="${a}" ${d.age_group === a ? 'selected' : ''}>${a} years</option>`
        ).join('')}
      </select>
    </div>
    <div class="col-md-4">
      <label class="form-label">Nationality</label>
      <input type="text" class="form-control" name="nationality"
        maxlength="100" placeholder="e.g., Sudanese Refugee" value="${esc(d.nationality || '')}">
    </div>
  </div>

  <!-- Row 6: Disability -->
  <div class="row g-3 mb-3">
    <div class="col-md-4">
      <label class="form-label">Person with Disability?</label>
      <select class="form-select" name="has_disability" id="${id}_disabilityToggle">
        <option value="false" ${!d.has_disability ? 'selected' : ''}>No</option>
        <option value="true" ${d.has_disability ? 'selected' : ''}>Yes</option>
      </select>
    </div>
    <div class="col-md-8" id="${id}_disabilityDetails" style="display:${d.has_disability ? 'block' : 'none'}">
      <label class="form-label">Disability Details</label>
      <input type="text" class="form-control" name="disability_status"
        maxlength="50" placeholder="Type of disability" value="${esc(d.disability_status || '')}">
    </div>
  </div>

  <!-- Row 7: Case Source (NEW) -->
  <div class="row g-3 mb-3">
    <div class="col-12">
      <label class="form-label">Case Source</label>
      <input type="text" class="form-control" name="case_source"
        maxlength="200" placeholder="How/where the case originated (e.g., Community referral, Self-referral, Partner NGO)"
        value="${esc(d.case_source || '')}">
      <div class="form-text">Where or how this case was first identified or received.</div>
    </div>
  </div>

  <!-- Row 8: Referral -->
  <div class="row g-3 mb-3">
    <div class="col-md-5">
      <label class="form-label">Referred From</label>
      <input type="text" class="form-control" name="referred_from"
        maxlength="200" placeholder="Organization/partner who referred" value="${esc(d.referred_from || '')}">
    </div>
    <div class="col-md-5">
      <label class="form-label">Referred To</label>
      <input type="text" class="form-control" name="referred_to"
        maxlength="200" placeholder="Organization/partner we referred to" value="${esc(d.referred_to || '')}">
    </div>
    <div class="col-md-2">
      <label class="form-label">Referral Date</label>
      <input type="date" class="form-control" name="referral_date" value="${toDateVal(d.referral_date)}">
    </div>
  </div>

  <!-- Row 9: Support Offered -->
  <div class="mb-3">
    <label class="form-label">Support Offered <span class="text-danger">*</span></label>
    <textarea class="form-control" name="support_offered" rows="4" required minlength="50"
      placeholder="Describe the support/services offered (minimum 50 characters)…">${esc(d.support_offered || '')}</textarea>
    <div class="form-text"><span id="${id}_charCount">${(d.support_offered || '').length}</span> characters (50 minimum)</div>
  </div>

  <!-- Row 10: Follow-up -->
  <div class="row g-3 mb-3">
    <div class="col-md-6">
      <label class="form-label">Follow-up Date</label>
      <input type="date" class="form-control" name="follow_up_date" value="${toDateVal(d.follow_up_date)}">
    </div>
    ${isEdit ? `
    <div class="col-md-6">
      <label class="form-label">Closure Date</label>
      <input type="date" class="form-control" name="closure_date" value="${toDateVal(d.closure_date)}">
    </div>` : ''}
  </div>

  <!-- Row 11: Notes -->
  <div class="mb-3">
    <label class="form-label">Notes</label>
    <textarea class="form-control" name="notes" rows="2"
      placeholder="Additional notes…">${esc(d.notes || '')}</textarea>
  </div>

</form>`;
}

function attachFormBehaviours(formId, caseTypeId = '') {
    // Disability toggle
    const disToggle = document.getElementById(`${formId}_disabilityToggle`);
    const disDetails = document.getElementById(`${formId}_disabilityDetails`);
    if (disToggle && disDetails) {
        disToggle.addEventListener('change', () => {
            disDetails.style.display = disToggle.value === 'true' ? 'block' : 'none';
        });
    }

    // Support offered char count
    const supportField = document.querySelector(`#${formId} [name="support_offered"]`);
    const charCount = document.getElementById(`${formId}_charCount`);
    if (supportField && charCount) {
        supportField.addEventListener('input', () => {
            charCount.textContent = supportField.value.length;
        });
    }

    // Case type → categories
    const typeSelect = document.getElementById(`${formId}_typeSelect`);
    const catSelect = document.getElementById(`${formId}_categorySelect`);
    if (typeSelect && catSelect) {
        typeSelect.addEventListener('change', async () => {
            const id = typeSelect.value;
            catSelect.disabled = !id;
            if (!id) { catSelect.innerHTML = '<option value="">— Select Type First —</option>'; return; }
            catSelect.innerHTML = '<option>Loading…</option>';
            const cats = await loadCategories(id);
            catSelect.innerHTML = categoryOptions(cats);
            catSelect.disabled = false;
        });
        // Pre-load categories if editing with existing type
        if (caseTypeId) {
            loadCategories(caseTypeId).then(cats => {
                const prev = catSelect.dataset.selected;
                catSelect.innerHTML = categoryOptions(cats, prev);
                catSelect.disabled = false;
            });
        }
    }
}

function collectFormData(formId) {
    const form = document.getElementById(formId);
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    // Coerce has_disability to boolean
    if ('has_disability' in data) data.has_disability = data.has_disability === 'true';
    // Remove empty strings for optional fields (let backend COALESCE handle)
    for (const k of Object.keys(data)) {
        if (data[k] === '') delete data[k];
    }
    return data;
}

/* ── Exported Modal Functions ─────────────────────────────────────────── */

/**
 * Show modal to create a new case.
 * @param {Function} onSuccess - called with the new case object on success
 */
export async function showCreateCaseModal(onSuccess) {
    try {
        const { caseTypes, projects } = await loadDropdowns();

        const formHTML = buildFormHTML('createCaseForm', null, { caseTypes, projects, categories: [] });

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
            size: 'xl'
        });

        const existingModal = document.getElementById('createCaseModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('createCaseModal'));
        modal.show();

        attachFormBehaviours('createCaseForm');

        document.getElementById('saveCaseBtn').addEventListener('click', async () => {
            const form = document.getElementById('createCaseForm');

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const data = collectFormData('createCaseForm');

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
 * Show modal to edit an existing case.
 * @param {number|string} caseId
 * @param {Function} onSuccess - called with updated case object on success
 */
export async function showEditCaseModal(caseId, onSuccess) {
    try {
        const [caseRes, { caseTypes, projects }] = await Promise.all([
            apiService.get(`/cases/${caseId}`),
            loadDropdowns(),
        ]);

        const caseData = caseRes.data;
        // Load categories for the existing type (needed to pre-populate select)
        const categories = caseData.case_type_id
            ? await loadCategories(caseData.case_type_id)
            : [];

        const formHTML = buildFormHTML('editCaseForm', caseData, { caseTypes, projects, categories });

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
            size: 'xl'
        });

        const existingModal = document.getElementById('editCaseModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editCaseModal'));
        modal.show();

        // Mark selected category after DOM insertion
        const catSelect = document.getElementById('editCaseForm_categorySelect');
        if (catSelect && caseData.case_category_id) {
            catSelect.dataset.selected = caseData.case_category_id;
        }

        attachFormBehaviours('editCaseForm', caseData.case_type_id);

        document.getElementById('updateCaseBtn').addEventListener('click', async () => {
            const form = document.getElementById('editCaseForm');

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const data = collectFormData('editCaseForm');

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
 * Show read-only view modal for a case.
 * @param {number|string} caseId
 */
export async function showViewCaseModal(caseId) {
    try {
        const caseRes = await apiService.get(`/cases/${caseId}`);
        const d = caseRes.data;

        const row = (label, value) => value
            ? `<div class="col-md-6 mb-2"><strong>${esc(label)}:</strong><br>${esc(String(value))}</div>`
            : '';
        const rowFull = (label, value) => value
            ? `<div class="col-12 mb-2"><strong>${esc(label)}:</strong><br><p class="text-muted mb-0">${esc(String(value))}</p></div>`
            : '';

        const bodyHTML = `
            <div class="row mb-3">
                <div class="col-12">
                    <h5 class="text-primary mb-1">Case #${esc(d.case_number || '—')}</h5>
                    <div class="d-flex gap-2 flex-wrap">
                        ${getStatusBadge(d.status)}
                        ${d.case_type_name ? `<span class="badge bg-dark">${esc(d.case_type_name)}</span>` : ''}
                        ${d.case_category_name ? `<span class="badge bg-secondary">${esc(d.case_category_name)}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="row">
                ${row('Date Reported', d.date_reported ? new Date(d.date_reported).toLocaleDateString() : null)}
                ${row('Project', d.project_name)}
                ${row('Location', d.location)}
                ${row('Case Worker', d.case_worker)}
            </div>

            <hr class="my-2">
            <h6 class="text-muted">Demographics</h6>
            <div class="row">
                ${row('Gender', d.gender)}
                ${row('Age Group', d.age_group ? d.age_group + ' years' : null)}
                ${row('Nationality', d.nationality)}
                ${row('Person with Disability', d.has_disability ? 'Yes' : 'No')}
                ${d.has_disability && d.disability_status ? row('Disability Details', d.disability_status) : ''}
            </div>

            <hr class="my-2">
            <h6 class="text-muted">Referral &amp; Source</h6>
            <div class="row">
                ${row('Case Source', d.case_source)}
                ${row('Referred From', d.referred_from)}
                ${row('Referred To', d.referred_to)}
                ${row('Referral Date', d.referral_date ? new Date(d.referral_date).toLocaleDateString() : null)}
            </div>

            <hr class="my-2">
            <h6 class="text-muted">Support &amp; Follow-up</h6>
            <div class="row">
                ${rowFull('Support Offered', d.support_offered)}
                ${row('Follow-up Date', d.follow_up_date ? new Date(d.follow_up_date).toLocaleDateString() : null)}
                ${row('Closure Date', d.closure_date ? new Date(d.closure_date).toLocaleDateString() : null)}
                ${rowFull('Notes', d.notes)}
            </div>

            <hr class="my-2">
            <small class="text-muted">
                Created: ${d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A'}
            </small>
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
