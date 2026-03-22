/**
 * Activity Forms Module
 * Handles Create, Edit, View operations for Activities
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';

/**
 * Show create activity modal
 */
export async function showCreateActivityModal(onSuccess) {
    try {
        // Fetch dependencies
        const [projectsRes, indicatorsRes, thematicAreasRes] = await Promise.all([
            apiService.get('/projects'),
            apiService.get('/indicators'),
            apiService.get('/dashboard/thematic-areas')
        ]);

        const projects = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : (Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const indicators = Array.isArray(indicatorsRes.data?.indicators) ? indicatorsRes.data.indicators : (Array.isArray(indicatorsRes.data) ? indicatorsRes.data : []);
        const thematicAreas = Array.isArray(thematicAreasRes.data) ? thematicAreasRes.data : [];

        console.log('Activity form data:', { projectsCount: projects.length, indicatorsCount: indicators.length, thematicAreasCount: thematicAreas.length });

        const today = new Date().toISOString().split('T')[0];

        const formHTML = `
            <form id="createActivityForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="activityName" class="form-label">Activity Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="activityName" name="activity_name" required maxlength="500">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="activityLocation" class="form-label">Location <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="activityLocation" name="location" required maxlength="100">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="activityThematicArea" class="form-label">Thematic Area <span class="text-danger">*</span></label>
                        <select class="form-select" id="activityThematicArea" name="thematic_area_id" required>
                            <option value="">Select Thematic Area</option>
                            ${thematicAreas.map(ta => `<option value="${ta.id}">${ta.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityIndicator" class="form-label">Indicator <span class="text-danger">*</span></label>
                        <select class="form-select" id="activityIndicator" name="indicator_id" required>
                            <option value="">Select Indicator</option>
                            ${indicators.map(ind => `<option value="${ind.id}">${ind.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityProject" class="form-label">Project</label>
                        <select class="form-select" id="activityProject" name="project_id">
                            <option value="">Select Project (Optional)</option>
                            ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="activityDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="activityDescription" name="description" rows="2"></textarea>
                </div>
                
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="activityPlannedDate" class="form-label">Planned Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="activityPlannedDate" name="planned_date" required value="${today}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityCompletionDate" class="form-label">Completion Date</label>
                        <input type="date" class="form-control" id="activityCompletionDate" name="completion_date">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityStatus" class="form-label">Status</label>
                        <select class="form-select" id="activityStatus" name="status">
                            <option value="Planned" selected>Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Activity Targets & Achievement</h6>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="targetValue" class="form-label">Target Value</label>
                        <input type="number" class="form-control" id="targetValue" name="target_value" min="0" value="0">
                        <small class="text-muted">Planned number of beneficiaries</small>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="achievedValue" class="form-label">Achieved Value</label>
                        <input type="number" class="form-control" id="achievedValue" name="achieved_value" min="0" value="0">
                        <small class="text-muted">Actual number reached</small>
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Direct Beneficiaries</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="directMale" class="form-label">Male</label>
                        <input type="number" class="form-control" id="directMale" name="direct_male" min="0" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="directFemale" class="form-label">Female</label>
                        <input type="number" class="form-control" id="directFemale" name="direct_female" min="0" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="directOther" class="form-label">Other</label>
                        <input type="number" class="form-control" id="directOther" name="direct_other" min="0" value="0">
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Indirect Beneficiaries</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="indirectMale" class="form-label">Male</label>
                        <input type="number" class="form-control" id="indirectMale" name="indirect_male" min="0" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="indirectFemale" class="form-label">Female</label>
                        <input type="number" class="form-control" id="indirectFemale" name="indirect_female" min="0" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="indirectOther" class="form-label">Other</label>
                        <input type="number" class="form-control" id="indirectOther" name="indirect_other" min="0" value="0">
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Financial Information</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="activityType" class="form-label">Activity Type</label>
                        <select class="form-select" id="activityType" name="activity_type">
                            <option value="program" selected>Program Activity</option>
                            <option value="non_program">Non-Program Activity</option>
                        </select>
                        <div class="form-text">Program activities are linked to a project and indicator.</div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityBudget" class="form-label">Budget</label>
                        <input type="number" class="form-control" id="activityBudget" name="budget" min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="activityActualCost" class="form-label">Actual Cost</label>
                        <input type="number" class="form-control" id="activityActualCost" name="actual_cost" min="0" step="0.01" value="0">
                    </div>
                </div>

                <h6 class="mt-3 mb-2">Funding Sources <small class="text-muted fw-normal">(optional)</small></h6>
                <div id="fundingSourcesContainer">
                    <table class="table table-sm table-bordered mb-2" id="fundingSourcesTable">
                        <thead class="table-light"><tr>
                            <th>Source Name</th><th>Type</th><th>Amount</th><th>Currency</th><th></th>
                        </tr></thead>
                        <tbody id="fundingSourcesBody"></tbody>
                    </table>
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="addFundingSourceBtn">
                        <i class="bi bi-plus-circle me-1"></i>Add Funding Source
                    </button>
                </div>
                
                <div class="mb-3">
                    <label for="activityNotes" class="form-label">Notes</label>
                    <textarea class="form-control" id="activityNotes" name="notes" rows="2"></textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="createActivityBtn">
                <i class="bi bi-check-lg"></i> Create Activity
            </button>
        `;

        const modalHTML = createModal({
            id: 'createActivityModal',
            title: '<i class="bi bi-plus-circle"></i> Create New Activity',
            body: formHTML,
            footer: footerHTML,
            size: 'xl'
        });

        const existingModal = document.getElementById('createActivityModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Funding sources state for create form
        let _createFundingSources = [];
        function renderCreateFundingRows() {
            const tbody = document.getElementById('fundingSourcesBody');
            if (!tbody) return;
            tbody.innerHTML = _createFundingSources.map((src, i) => `
                <tr>
                    <td><input class="form-control form-control-sm" value="${src.source_name}" oninput="window._csFS[${i}].source_name=this.value" required></td>
                    <td><select class="form-select form-select-sm" onchange="window._csFS[${i}].source_type=this.value">
                        ${['donor','grant','co-funding','own-funds','other'].map(t=>`<option value="${t}" ${src.source_type===t?'selected':''}>${t}</option>`).join('')}
                    </select></td>
                    <td><input type="number" class="form-control form-control-sm" min="0" step="0.01" value="${src.amount}" oninput="window._csFS[${i}].amount=parseFloat(this.value)||0"></td>
                    <td><select class="form-select form-select-sm" onchange="window._csFS[${i}].currency=this.value">
                        ${['UGX','USD','EUR','GBP'].map(c=>`<option value="${c}" ${src.currency===c?'selected':''}>${c}</option>`).join('')}
                    </select></td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger" onclick="window._csFS.splice(${i},1);window._renderCsFS()"><i class="bi bi-trash"></i></button></td>
                </tr>`).join('');
        }
        window._csFS = _createFundingSources;
        window._renderCsFS = renderCreateFundingRows;

        document.getElementById('addFundingSourceBtn').addEventListener('click', () => {
            _createFundingSources.push({ source_name: '', source_type: 'donor', amount: 0, currency: 'UGX' });
            renderCreateFundingRows();
        });

        const modal = new bootstrap.Modal(document.getElementById('createActivityModal'));
        modal.show();

        document.getElementById('createActivityBtn').addEventListener('click', async () => {
            const form = document.getElementById('createActivityForm');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.activity_type = document.getElementById('activityType').value || 'program';

            // Convert numeric fields
            ['direct_male', 'direct_female', 'direct_other', 'indirect_male', 'indirect_female', 'indirect_other', 'budget', 'actual_cost'].forEach(field => {
                data[field] = parseFloat(data[field]) || 0;
            });

            // Handle empty project_id
            if (!data.project_id) {
                data.project_id = null;
            }

            try {
                const createBtn = document.getElementById('createActivityBtn');
                createBtn.disabled = true;
                createBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating...';

                const response = await apiService.post('/activities', data);

                if (response.success) {
                    // Save any funding sources
                    const activityId = response.data?.id;
                    if (activityId && _createFundingSources.length > 0) {
                        for (const src of _createFundingSources) {
                            if (src.source_name && src.amount > 0) {
                                try { await apiService.post(`/activities/${activityId}/funding-sources`, src); } catch {}
                            }
                        }
                    }
                    showNotification('Activity created successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to create activity: ${error.message}`, 'danger');
                const createBtn = document.getElementById('createActivityBtn');
                createBtn.disabled = false;
                createBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Activity';
            }
        });

        document.getElementById('createActivityModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load form: ${error.message}`, 'danger');
    }
}

/**
 * Show edit activity modal
 */
export async function showEditActivityModal(activityId, onSuccess) {
    try {
        const [activityRes, projectsRes, indicatorsRes, thematicAreasRes, fundingRes] = await Promise.all([
            apiService.get(`/activities/${activityId}`),
            apiService.get('/projects'),
            apiService.get('/indicators'),
            apiService.get('/dashboard/thematic-areas'),
            apiService.get(`/activities/${activityId}/funding-sources`).catch(() => ({ data: [] })),
        ]);

        const activity = activityRes.data;
        const projects = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : (Array.isArray(projectsRes.data) ? projectsRes.data : []);
        const indicators = Array.isArray(indicatorsRes.data?.indicators) ? indicatorsRes.data.indicators : (Array.isArray(indicatorsRes.data) ? indicatorsRes.data : []);
        const thematicAreas = Array.isArray(thematicAreasRes.data) ? thematicAreasRes.data : [];
        const existingFunding = Array.isArray(fundingRes.data) ? fundingRes.data : (fundingRes.data?.data || []);

        const formHTML = `
            <form id="editActivityForm">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="editActivityName" class="form-label">Activity Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="editActivityName" name="activity_name" required maxlength="500" value="${activity.activity_name || ''}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="editActivityLocation" class="form-label">Location <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="editActivityLocation" name="location" required maxlength="100" value="${activity.location || ''}">
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="editActivityThematicArea" class="form-label">Thematic Area <span class="text-danger">*</span></label>
                        <select class="form-select" id="editActivityThematicArea" name="thematic_area_id" required>
                            <option value="">Select Thematic Area</option>
                            ${thematicAreas.map(ta => `<option value="${ta.id}" ${ta.id === activity.thematic_area_id ? 'selected' : ''}>${ta.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityIndicator" class="form-label">Indicator <span class="text-danger">*</span></label>
                        <select class="form-select" id="editActivityIndicator" name="indicator_id" required>
                            <option value="">Select Indicator</option>
                            ${indicators.map(ind => `<option value="${ind.id}" ${ind.id === activity.indicator_id ? 'selected' : ''}>${ind.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityProject" class="form-label">Project</label>
                        <select class="form-select" id="editActivityProject" name="project_id">
                            <option value="">Select Project (Optional)</option>
                            ${projects.map(p => `<option value="${p.id}" ${p.id === activity.project_id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="editActivityDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editActivityDescription" name="description" rows="2">${activity.description || ''}</textarea>
                </div>
                
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="editActivityPlannedDate" class="form-label">Planned Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="editActivityPlannedDate" name="planned_date" required value="${activity.planned_date ? activity.planned_date.split('T')[0] : ''}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityCompletionDate" class="form-label">Completion Date</label>
                        <input type="date" class="form-control" id="editActivityCompletionDate" name="completion_date" value="${activity.completion_date ? activity.completion_date.split('T')[0] : ''}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityStatus" class="form-label">Status</label>
                        <select class="form-select" id="editActivityStatus" name="status">
                            <option value="Planned" ${activity.status === 'Planned' ? 'selected' : ''}>Planned</option>
                            <option value="In Progress" ${activity.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${activity.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${activity.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Direct Beneficiaries</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="editDirectMale" class="form-label">Male</label>
                        <input type="number" class="form-control" id="editDirectMale" name="direct_male" min="0" value="${activity.direct_male || 0}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editDirectFemale" class="form-label">Female</label>
                        <input type="number" class="form-control" id="editDirectFemale" name="direct_female" min="0" value="${activity.direct_female || 0}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editDirectOther" class="form-label">Other</label>
                        <input type="number" class="form-control" id="editDirectOther" name="direct_other" min="0" value="${activity.direct_other || 0}">
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Indirect Beneficiaries</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="editIndirectMale" class="form-label">Male</label>
                        <input type="number" class="form-control" id="editIndirectMale" name="indirect_male" min="0" value="${activity.indirect_male || 0}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editIndirectFemale" class="form-label">Female</label>
                        <input type="number" class="form-control" id="editIndirectFemale" name="indirect_female" min="0" value="${activity.indirect_female || 0}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editIndirectOther" class="form-label">Other</label>
                        <input type="number" class="form-control" id="editIndirectOther" name="indirect_other" min="0" value="${activity.indirect_other || 0}">
                    </div>
                </div>
                
                <h6 class="mt-3 mb-2">Financial Information</h6>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="editActivityType" class="form-label">Activity Type</label>
                        <select class="form-select" id="editActivityType" name="activity_type">
                            <option value="program" ${(activity.activity_type || 'program') === 'program' ? 'selected' : ''}>Program Activity</option>
                            <option value="non_program" ${activity.activity_type === 'non_program' ? 'selected' : ''}>Non-Program Activity</option>
                        </select>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityBudget" class="form-label">Budget</label>
                        <input type="number" class="form-control" id="editActivityBudget" name="budget" min="0" step="0.01" value="${activity.budget || 0}">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="editActivityActualCost" class="form-label">Actual Cost</label>
                        <input type="number" class="form-control" id="editActivityActualCost" name="actual_cost" min="0" step="0.01" value="${activity.actual_cost || 0}">
                    </div>
                </div>

                <h6 class="mt-3 mb-2">Funding Sources <small class="text-muted fw-normal">(optional)</small></h6>
                <div id="editFundingSourcesContainer">
                    <table class="table table-sm table-bordered mb-2" id="editFundingSourcesTable">
                        <thead class="table-light"><tr>
                            <th>Source Name</th><th>Type</th><th>Amount</th><th>Currency</th><th></th>
                        </tr></thead>
                        <tbody id="editFundingSourcesBody"></tbody>
                    </table>
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="editAddFundingSourceBtn">
                        <i class="bi bi-plus-circle me-1"></i>Add Funding Source
                    </button>
                </div>
                
                <div class="mb-3">
                    <label for="editActivityNotes" class="form-label">Notes</label>
                    <textarea class="form-control" id="editActivityNotes" name="notes" rows="2">${activity.notes || ''}</textarea>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="updateActivityBtn">
                <i class="bi bi-check-lg"></i> Update Activity
            </button>
        `;

        const modalHTML = createModal({
            id: 'editActivityModal',
            title: '<i class="bi bi-pencil"></i> Edit Activity',
            body: formHTML,
            footer: footerHTML,
            size: 'xl'
        });

        const existingModal = document.getElementById('editActivityModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editActivityModal'));
        modal.show();

        // --- Funding sources wiring ---
        let _editNewFundingSources = [];

        function renderEditExistingFunding(sources) {
            const tbody = document.getElementById('editFundingSourcesBody');
            if (!tbody) return;
            // Clear rows added by this renderer (existing rows have data-existing="true")
            [...tbody.querySelectorAll('tr[data-existing="true"]')].forEach(r => r.remove());
            sources.forEach(src => {
                const tr = document.createElement('tr');
                tr.dataset.existing = 'true';
                tr.dataset.id = src.id;
                tr.innerHTML = `
                    <td>${src.source_name || ''}</td>
                    <td>${src.source_type || ''}</td>
                    <td>${src.amount != null ? Number(src.amount).toLocaleString() : ''}</td>
                    <td>${src.currency || 'UGX'}</td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-del-id="${src.id}"><i class="bi bi-trash"></i></button></td>`;
                tbody.appendChild(tr);
                tr.querySelector('[data-del-id]').addEventListener('click', async () => {
                    try {
                        await apiService.delete(`/activities/${activityId}/funding-sources/${src.id}`);
                        tr.remove();
                    } catch (e) {
                        showNotification(`Failed to delete funding source: ${e.message}`, 'danger');
                    }
                });
            });
        }

        function renderEditNewFundingRows() {
            const tbody = document.getElementById('editFundingSourcesBody');
            if (!tbody) return;
            [...tbody.querySelectorAll('tr[data-new="true"]')].forEach(r => r.remove());
            _editNewFundingSources.forEach((src, idx) => {
                const tr = document.createElement('tr');
                tr.dataset.new = 'true';
                tr.innerHTML = `
                    <td><input class="form-control form-control-sm" placeholder="Source name *" value="${src.source_name || ''}" oninput="window._editFSNew[${idx}].source_name=this.value"></td>
                    <td><select class="form-select form-select-sm" onchange="window._editFSNew[${idx}].source_type=this.value">
                        ${['donor','grant','co-funding','own-funds','other'].map(t => `<option value="${t}" ${src.source_type===t?'selected':''}>${t}</option>`).join('')}
                    </select></td>
                    <td><input type="number" class="form-control form-control-sm" min="0" step="0.01" value="${src.amount || 0}" oninput="window._editFSNew[${idx}].amount=parseFloat(this.value)||0"></td>
                    <td><input class="form-control form-control-sm" value="${src.currency || 'UGX'}" oninput="window._editFSNew[${idx}].currency=this.value"></td>
                    <td><button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" onclick="window._editFSNew.splice(${idx},1);window._renderEditFSNew()"><i class="bi bi-trash"></i></button></td>`;
                tbody.appendChild(tr);
            });
        }

        window._editFSNew = _editNewFundingSources;
        window._renderEditFSNew = renderEditNewFundingRows;

        renderEditExistingFunding(existingFunding);

        document.getElementById('editAddFundingSourceBtn').addEventListener('click', () => {
            _editNewFundingSources.push({ source_name: '', source_type: 'donor', amount: 0, currency: 'UGX' });
            renderEditNewFundingRows();
        });
        // --- End funding sources wiring ---

        document.getElementById('updateActivityBtn').addEventListener('click', async () => {
            const form = document.getElementById('editActivityForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Activity type
            data.activity_type = document.getElementById('editActivityType').value || 'program';

            // Convert numeric fields
            ['direct_male', 'direct_female', 'direct_other', 'indirect_male', 'indirect_female', 'indirect_other', 'budget', 'actual_cost'].forEach(field => {
                if (data[field] !== undefined) {
                    data[field] = parseFloat(data[field]) || 0;
                }
            });

            // Handle empty project_id
            if (!data.project_id) {
                data.project_id = null;
            }

            // Handle empty completion_date
            if (!data.completion_date) {
                data.completion_date = null;
            }

            try {
                const updateBtn = document.getElementById('updateActivityBtn');
                updateBtn.disabled = true;
                updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Updating...';

                const response = await apiService.put(`/activities/${activityId}`, data);

                if (response.success) {
                    // POST any new funding sources
                    for (const src of _editNewFundingSources) {
                        if (src.source_name && src.amount > 0) {
                            try {
                                await apiService.post(`/activities/${activityId}/funding-sources`, src);
                            } catch (fsErr) {
                                console.warn('Failed to save funding source:', fsErr.message);
                            }
                        }
                    }
                    showNotification('Activity updated successfully!', 'success');
                    modal.hide();
                    if (onSuccess) onSuccess(response.data);
                }
            } catch (error) {
                showNotification(`Failed to update activity: ${error.message}`, 'danger');
                const updateBtn = document.getElementById('updateActivityBtn');
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Update Activity';
            }
        });

        document.getElementById('editActivityModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load activity: ${error.message}`, 'danger');
    }
}

/**
 * Show view activity modal (read-only)
 */
export async function showViewActivityModal(activityId) {
    try {
        const activityRes = await apiService.get(`/activities/${activityId}`);
        const activity = activityRes.data;

        const totalDirect = (activity.direct_male || 0) + (activity.direct_female || 0) + (activity.direct_other || 0);
        const totalIndirect = (activity.indirect_male || 0) + (activity.indirect_female || 0) + (activity.indirect_other || 0);
        const totalBeneficiaries = totalDirect + totalIndirect;

        const getStatusBadge = (status) => {
            const colors = {
                'Planned': 'primary',
                'In Progress': 'info',
                'Completed': 'success',
                'Cancelled': 'secondary'
            };
            return `<span class="badge bg-${colors[status] || 'secondary'}">${status}</span>`;
        };

        const bodyHTML = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">${activity.activity_name}</h5>
                    ${activity.description ? `<p class="text-muted">${activity.description}</p>` : ''}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Location:</strong><br>
                    <i class="bi bi-geo-alt"></i> ${activity.location || 'N/A'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Status:</strong><br>
                    ${getStatusBadge(activity.status)}
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-4 mb-3">
                    <strong>Thematic Area:</strong><br>
                    ${activity.thematic_area_name || 'N/A'}
                </div>
                <div class="col-md-4 mb-3">
                    <strong>Indicator:</strong><br>
                    ${activity.indicator_name || 'N/A'}
                </div>
                <div class="col-md-4 mb-3">
                    <strong>Project:</strong><br>
                    ${activity.project_name || 'N/A'}
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Planned Date:</strong><br>
                    ${activity.planned_date ? new Date(activity.planned_date).toLocaleDateString() : 'N/A'}
                </div>
                ${activity.completion_date ? `
                    <div class="col-md-6 mb-3">
                        <strong>Completion Date:</strong><br>
                        ${new Date(activity.completion_date).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
            
            <hr>
            
            <h6 class="mt-3 mb-2">Beneficiaries Summary</h6>
            <div class="row mb-3">
                <div class="col-md-12">
                    <div class="alert alert-info">
                        <strong>Total Beneficiaries: ${totalBeneficiaries}</strong> (Direct: ${totalDirect}, Indirect: ${totalIndirect})
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <h6>Direct Beneficiaries</h6>
                    <table class="table table-sm">
                        <tr>
                            <td>Male:</td>
                            <td class="text-end"><strong>${activity.direct_male || 0}</strong></td>
                        </tr>
                        <tr>
                            <td>Female:</td>
                            <td class="text-end"><strong>${activity.direct_female || 0}</strong></td>
                        </tr>
                        <tr>
                            <td>Other:</td>
                            <td class="text-end"><strong>${activity.direct_other || 0}</strong></td>
                        </tr>
                        <tr class="table-light">
                            <td><strong>Total:</strong></td>
                            <td class="text-end"><strong>${totalDirect}</strong></td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Indirect Beneficiaries</h6>
                    <table class="table table-sm">
                        <tr>
                            <td>Male:</td>
                            <td class="text-end"><strong>${activity.indirect_male || 0}</strong></td>
                        </tr>
                        <tr>
                            <td>Female:</td>
                            <td class="text-end"><strong>${activity.indirect_female || 0}</strong></td>
                        </tr>
                        <tr>
                            <td>Other:</td>
                            <td class="text-end"><strong>${activity.indirect_other || 0}</strong></td>
                        </tr>
                        <tr class="table-light">
                            <td><strong>Total:</strong></td>
                            <td class="text-end"><strong>${totalIndirect}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <hr>
            
            <h6 class="mt-3 mb-2">Financial Information</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Budget:</strong><br>
                    $${(activity.budget || 0).toFixed(2)}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Actual Cost:</strong><br>
                    $${(activity.actual_cost || 0).toFixed(2)}
                </div>
            </div>
            
            ${activity.notes ? `
                <hr>
                <div class="row">
                    <div class="col-12 mb-3">
                        <strong>Notes:</strong><br>
                        <p class="text-muted">${activity.notes}</p>
                    </div>
                </div>
            ` : ''}
            
            <hr>
            
            <div class="row mt-3">
                <div class="col-12">
                    <small class="text-muted">
                        Created by ${activity.created_by_username || 'Unknown'} on ${activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'N/A'}
                    </small>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewActivityModal',
            title: '<i class="bi bi-eye"></i> Activity Details',
            body: bodyHTML,
            footer: footerHTML,
            size: 'xl'
        });

        const existingModal = document.getElementById('viewActivityModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('viewActivityModal'));
        modal.show();

        document.getElementById('viewActivityModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load activity: ${error.message}`, 'danger');
    }
}
