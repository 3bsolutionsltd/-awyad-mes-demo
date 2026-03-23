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

        const formHTML = `
            <form id="createIndicatorForm">
                <!-- Scope selector -->
                <div class="mb-3">
                    <label class="form-label fw-bold">Indicator Scope <span class="text-danger">*</span></label>
                    <div class="d-flex gap-3">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="indicator_scope" id="scopeAwyad" value="awyad" checked>
                            <label class="form-check-label" for="scopeAwyad">
                                <i class="bi bi-building"></i> Organizational (AWYAD-level)
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="indicator_scope" id="scopeProject" value="project">
                            <label class="form-check-label" for="scopeProject">
                                <i class="bi bi-folder"></i> Project-Specific
                            </label>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="indicatorName" class="form-label">Indicator Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="indicatorName" name="name" required maxlength="500">
                </div>

                <div class="mb-3">
                    <label for="indicatorDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="indicatorDescription" name="description" rows="2"></textarea>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="indicatorLevel" class="form-label">Indicator Level <span class="text-danger">*</span></label>
                        <select class="form-select" id="indicatorLevel" name="indicator_level" required>
                            <option value="">Select Level</option>
                            <option value="output">Output</option>
                            <option value="outcome">Outcome</option>
                            <option value="impact">Impact</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="indicatorDataType" class="form-label">Data Type</label>
                        <select class="form-select" id="indicatorDataType" name="data_type">
                            <option value="number" selected>Number</option>
                            <option value="percentage">Percentage</option>
                        </select>
                    </div>
                </div>

                <!-- AWYAD scope: thematic area (shown when scope = 'awyad') -->
                <div id="awyadScopeFields" class="mb-3">
                    <label for="indicatorThematicArea" class="form-label">Thematic Area <span class="text-danger">*</span></label>
                    <select class="form-select" id="indicatorThematicArea" name="thematic_area_id">
                        <option value="">Select Thematic Area</option>
                        ${thematicAreas.map(ta => `<option value="${ta.id}">${ta.name}</option>`).join('')}
                    </select>
                </div>

                <!-- Project scope: project + result area (shown when scope = 'project') -->
                <div id="projectScopeFields" class="d-none">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="indicatorProject" class="form-label">Project <span class="text-danger">*</span></label>
                            <select class="form-select" id="indicatorProject" name="project_id">
                                <option value="">Select Project</option>
                                ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="indicatorResultArea" class="form-label">Result Area <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="indicatorResultArea" name="result_area" maxlength="200" placeholder="e.g., Protection Services">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label for="indicatorBaseline" class="form-label">Baseline</label>
                        <input type="number" class="form-control" id="indicatorBaseline" name="baseline" min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="indicatorLopTarget" class="form-label">LOP Target <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" id="indicatorLopTarget" name="lop_target" required min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="indicatorAnnualTarget" class="form-label">Annual Target</label>
                        <input type="number" class="form-control" id="indicatorAnnualTarget" name="annual_target" min="0" step="0.01" value="0">
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-3 mb-3">
                        <label for="indicatorQ1" class="form-label">Q1 Target</label>
                        <input type="number" class="form-control" id="indicatorQ1" name="q1_target" min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="indicatorQ2" class="form-label">Q2 Target</label>
                        <input type="number" class="form-control" id="indicatorQ2" name="q2_target" min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="indicatorQ3" class="form-label">Q3 Target</label>
                        <input type="number" class="form-control" id="indicatorQ3" name="q3_target" min="0" step="0.01" value="0">
                    </div>
                    <div class="col-md-3 mb-3">
                        <label for="indicatorQ4" class="form-label">Q4 Target</label>
                        <input type="number" class="form-control" id="indicatorQ4" name="q4_target" min="0" step="0.01" value="0">
                    </div>
                </div>

                <div class="mb-3">
                    <label for="indicatorUnit" class="form-label">Unit of Measurement</label>
                    <input type="text" class="form-control" id="indicatorUnit" name="unit" placeholder="e.g., people, sessions, workshops">
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

        // Toggle scope-specific fields based on radio selection
        document.querySelectorAll('input[name="indicator_scope"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const isProject = document.getElementById('scopeProject').checked;
                document.getElementById('awyadScopeFields').classList.toggle('d-none', isProject);
                document.getElementById('projectScopeFields').classList.toggle('d-none', !isProject);
                document.getElementById('indicatorThematicArea').required = !isProject;
                document.getElementById('indicatorProject').required = isProject;
                document.getElementById('indicatorResultArea').required = isProject;
            });
        });

        document.getElementById('saveIndicatorBtn').addEventListener('click', async () => {
            const form = document.getElementById('createIndicatorForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            // Convert numeric fields
            ['baseline', 'lop_target', 'annual_target', 'q1_target', 'q2_target', 'q3_target', 'q4_target'].forEach(f => {
                if (data[f] !== undefined) data[f] = parseFloat(data[f]) || 0;
            });

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

        const pct = parseFloat(indicator.achievement_percentage) || 0;
        const pctColor = pct >= 100 ? 'bg-success' : pct >= 75 ? 'bg-info' : pct >= 50 ? 'bg-warning' : 'bg-danger';

        const detailsPane = `
            <div class="row">
                <div class="col-12 mb-3">
                    <h5 class="text-primary">${indicator.name}</h5>
                    <p class="text-muted mb-0">${indicator.description || 'No description provided'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Project:</strong><br>${indicator.project_name || 'N/A'}
                </div>
                <div class="col-md-6 mb-3">
                    <strong>Thematic Area:</strong><br>
                    <span class="badge bg-info">${indicator.thematic_area_name || 'N/A'}</span>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <strong>LOP Target:</strong><br>
                    ${(indicator.lop_target || indicator.target || 0).toLocaleString()} ${indicator.unit || 'units'}
                </div>
                <div class="col-md-4 mb-3">
                    <strong>Annual Target:</strong><br>
                    ${(indicator.annual_target || 0).toLocaleString()} ${indicator.unit || 'units'}
                </div>
                <div class="col-md-4 mb-3">
                    <strong>Achieved:</strong><br>
                    ${(indicator.achieved || 0).toLocaleString()} ${indicator.unit || 'units'}
                </div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <strong>Achievement Rate:</strong><br>
                    <div class="progress mt-1">
                        <div class="progress-bar ${pctColor}" style="width:${Math.min(pct, 100)}%">${pct.toFixed(1)}%</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <strong>Status:</strong><br>
                    <span class="badge bg-${indicator.status === 'Active' ? 'success' : indicator.status === 'Completed' ? 'primary' : 'secondary'}">${indicator.status || 'N/A'}</span>
                </div>
                <div class="col-md-3 mb-3">
                    <strong>Level:</strong><br>
                    <span class="badge bg-secondary text-capitalize">${indicator.indicator_level || 'N/A'}</span>
                </div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-2"><strong>Q1:</strong><br>${(indicator.q1_target || 0).toLocaleString()} / <span class="text-success">${(indicator.q1_achieved || 0).toLocaleString()}</span></div>
                <div class="col-md-3 mb-2"><strong>Q2:</strong><br>${(indicator.q2_target || 0).toLocaleString()} / <span class="text-success">${(indicator.q2_achieved || 0).toLocaleString()}</span></div>
                <div class="col-md-3 mb-2"><strong>Q3:</strong><br>${(indicator.q3_target || 0).toLocaleString()} / <span class="text-success">${(indicator.q3_achieved || 0).toLocaleString()}</span></div>
                <div class="col-md-3 mb-2"><strong>Q4:</strong><br>${(indicator.q4_target || 0).toLocaleString()} / <span class="text-success">${(indicator.q4_achieved || 0).toLocaleString()}</span></div>
            </div>
            <hr class="my-2">
            <small class="text-muted">Created ${indicator.created_at ? new Date(indicator.created_at).toLocaleDateString() : 'N/A'}</small>
        `;

        const bodyHTML = `
            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#indTabDetails" type="button" role="tab">
                        <i class="bi bi-info-circle"></i> Details
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#indTabActivities" type="button" role="tab"
                            id="activitiesTabBtn">
                        <i class="bi bi-calendar-check"></i> Linked Activities
                    </button>
                </li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="indTabDetails" role="tabpanel">
                    ${detailsPane}
                </div>
                <div class="tab-pane fade" id="indTabActivities" role="tabpanel">
                    <div id="indicatorActivitiesBody">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary"></div>
                            <p class="mt-2 text-muted small">Loading activities...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;

        const modalHTML = createModal({
            id: 'viewIndicatorModal',
            title: `<i class="bi bi-graph-up"></i> ${indicator.code ? `[${indicator.code}]` : ''} Indicator Details`,
            body: bodyHTML,
            footer: footerHTML,
            size: 'xl'
        });

        const existingModal = document.getElementById('viewIndicatorModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('viewIndicatorModal'));
        modal.show();

        // Lazy-load activities when the Activities tab is first clicked
        let activitiesLoaded = false;
        document.getElementById('activitiesTabBtn').addEventListener('shown.bs.tab', async () => {
            if (activitiesLoaded) return;
            activitiesLoaded = true;
            try {
                const actRes = await apiService.get(`/activities?indicator_id=${indicatorId}&limit=100`);
                const acts = actRes.data?.activities || actRes.data || [];
                document.getElementById('indicatorActivitiesBody').innerHTML =
                    _renderActivitiesTab(acts, indicator.unit);
            } catch (err) {
                document.getElementById('indicatorActivitiesBody').innerHTML =
                    `<div class="alert alert-danger">Failed to load activities: ${err.message}</div>`;
            }
        });

        document.getElementById('viewIndicatorModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        showNotification(`Failed to load indicator: ${error.message}`, 'danger');
    }
}

function _renderActivitiesTab(activities, unit) {
    if (activities.length === 0) {
        return `
            <div class="text-center text-muted py-5">
                <i class="bi bi-calendar-x fs-2 d-block mb-2"></i>
                No activities linked to this indicator yet.
            </div>`;
    }

    const statusColor = { 'Completed': 'success', 'In Progress': 'primary', 'Planned': 'secondary', 'Cancelled': 'danger' };

    const rows = activities.map(a => {
        const totalBenef = (a.age_18_49_female || 0) + (a.age_18_49_male || 0) +
            (a.age_5_17_female || 0) + (a.age_5_17_male || 0) +
            (a.age_0_4_female || 0) + (a.age_0_4_male || 0) +
            (a.age_50_plus_female || 0) + (a.age_50_plus_male || 0);
        const badgeColor = statusColor[a.status] || 'secondary';
        const date = a.planned_date ? new Date(a.planned_date).toLocaleDateString() : '—';
        const doneDate = a.completion_date ? new Date(a.completion_date).toLocaleDateString() : '—';
        const budget = a.budget ? `${parseFloat(a.budget).toLocaleString()} ${a.currency || ''}` : '—';

        return `
        <tr>
            <td>
                <strong>${a.activity_name || 'Unnamed'}</strong>
                ${a.description ? `<br><small class="text-muted">${a.description.substring(0, 80)}${a.description.length > 80 ? '…' : ''}</small>` : ''}
            </td>
            <td>${a.location || '—'}</td>
            <td>${date}</td>
            <td>${doneDate}</td>
            <td class="text-center">
                <span class="badge bg-${badgeColor}">${a.status || 'Unknown'}</span>
            </td>
            <td class="text-end">${totalBenef.toLocaleString()}</td>
            <td class="text-end">${budget}</td>
        </tr>`;
    }).join('');

    const total = activities.reduce((s, a) =>
        s + (a.age_18_49_female || 0) + (a.age_18_49_male || 0) +
        (a.age_5_17_female || 0) + (a.age_5_17_male || 0) +
        (a.age_0_4_female || 0) + (a.age_0_4_male || 0) +
        (a.age_50_plus_female || 0) + (a.age_50_plus_male || 0), 0);

    const completed = activities.filter(a => a.status === 'Completed').length;
    const inProgress = activities.filter(a => a.status === 'In Progress').length;
    const planned = activities.filter(a => a.status === 'Planned').length;

    return `
        <div class="d-flex gap-3 mb-3 small">
            <span class="badge bg-success py-1 px-2">${completed} Completed</span>
            <span class="badge bg-primary py-1 px-2">${inProgress} In Progress</span>
            <span class="badge bg-secondary py-1 px-2">${planned} Planned</span>
            <span class="ms-auto text-muted"><strong>${total.toLocaleString()}</strong> total beneficiaries across ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}</span>
        </div>
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Activity</th>
                        <th>Location</th>
                        <th>Planned Date</th>
                        <th>Completed</th>
                        <th class="text-center">Status</th>
                        <th class="text-end">Beneficiaries</th>
                        <th class="text-end">Budget</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

/**
 * Show create project-specific indicator modal, pre-scoped to a project
 * @param {string} projectId - UUID of the project to link the indicator to
 * @param {string} projectName - Display name of the project
 * @param {Function} onSuccess - Callback after successful creation
 */
export async function showCreateProjectIndicatorModal(projectId, projectName, onSuccess) {
    const formHTML = `
        <form id="createProjectIndicatorForm">
            <input type="hidden" name="indicator_scope" value="project">
            <input type="hidden" name="project_id" value="${projectId}">

            <div class="alert alert-info py-2 mb-3">
                <i class="bi bi-folder"></i> Creating indicator for <strong>${projectName || 'this project'}</strong>
            </div>

            <div class="mb-3">
                <label for="piName" class="form-label">Indicator Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="piName" name="name" required maxlength="500">
            </div>

            <div class="mb-3">
                <label for="piDescription" class="form-label">Description</label>
                <textarea class="form-control" id="piDescription" name="description" rows="2"></textarea>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="piLevel" class="form-label">Indicator Level <span class="text-danger">*</span></label>
                    <select class="form-select" id="piLevel" name="indicator_level" required>
                        <option value="">Select Level</option>
                        <option value="output">Output</option>
                        <option value="outcome">Outcome</option>
                        <option value="impact">Impact</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="piDataType" class="form-label">Data Type</label>
                    <select class="form-select" id="piDataType" name="data_type">
                        <option value="number" selected>Number</option>
                        <option value="percentage">Percentage</option>
                    </select>
                </div>
            </div>

            <div class="mb-3">
                <label for="piResultArea" class="form-label">Result Area <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="piResultArea" name="result_area" required maxlength="200" placeholder="e.g., Protection Services, Livelihood Support">
            </div>

            <div class="row">
                <div class="col-md-4 mb-3">
                    <label for="piBaseline" class="form-label">Baseline</label>
                    <input type="number" class="form-control" id="piBaseline" name="baseline" min="0" step="0.01" value="0">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="piLopTarget" class="form-label">LOP Target <span class="text-danger">*</span></label>
                    <input type="number" class="form-control" id="piLopTarget" name="lop_target" required min="0" step="0.01" value="0">
                </div>
                <div class="col-md-4 mb-3">
                    <label for="piAnnualTarget" class="form-label">Annual Target</label>
                    <input type="number" class="form-control" id="piAnnualTarget" name="annual_target" min="0" step="0.01" value="0">
                </div>
            </div>

            <div class="row">
                <div class="col-md-3 mb-3">
                    <label class="form-label">Q1 Target</label>
                    <input type="number" class="form-control" name="q1_target" min="0" step="0.01" value="0">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Q2 Target</label>
                    <input type="number" class="form-control" name="q2_target" min="0" step="0.01" value="0">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Q3 Target</label>
                    <input type="number" class="form-control" name="q3_target" min="0" step="0.01" value="0">
                </div>
                <div class="col-md-3 mb-3">
                    <label class="form-label">Q4 Target</label>
                    <input type="number" class="form-control" name="q4_target" min="0" step="0.01" value="0">
                </div>
            </div>

            <div class="mb-3">
                <label for="piUnit" class="form-label">Unit of Measurement</label>
                <input type="text" class="form-control" id="piUnit" name="unit" placeholder="e.g., people, sessions">
            </div>
        </form>
    `;

    const footerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary" id="savePIBtn">
            <i class="bi bi-check-lg"></i> Create Indicator
        </button>
    `;

    const modalHTML = createModal({
        id: 'createProjectIndicatorModal',
        title: '<i class="bi bi-plus-circle"></i> Add Project Indicator',
        body: formHTML,
        footer: footerHTML,
        size: 'lg'
    });

    const existingModal = document.getElementById('createProjectIndicatorModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('createProjectIndicatorModal'));
    modal.show();

    document.getElementById('savePIBtn').addEventListener('click', async () => {
        const form = document.getElementById('createProjectIndicatorForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        ['baseline', 'lop_target', 'annual_target', 'q1_target', 'q2_target', 'q3_target', 'q4_target'].forEach(f => {
            if (data[f] !== undefined) data[f] = parseFloat(data[f]) || 0;
        });

        try {
            const saveBtn = document.getElementById('savePIBtn');
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
            const saveBtn = document.getElementById('savePIBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Indicator';
        }
    });

    document.getElementById('createProjectIndicatorModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}
