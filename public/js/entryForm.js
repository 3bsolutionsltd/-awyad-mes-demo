/**
 * Entry Form Module
 * 
 * New Activity Report form with auto-calculation, real-time validation, and disaggregation input.
 * Handles beneficiary data entry with automatic totaling and budget tracking.
 * Supports nationality breakdown and approval workflow submission.
 * 
 * @module entryForm
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import {
    createPageHeader,
    createCard,
    createLoadingSpinner,
    createErrorAlert,
    createSuccessAlert
} from './components.js';

/**
 * Render entry form page for creating new activity reports
 * Includes disaggregation inputs with auto-calculation and form validation
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {Promise<void>}
 * 
 * @example
 * await renderEntryForm(document.getElementById('content-area'));
 */
export async function renderEntryForm(contentArea) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading form...');

        // Fetch dropdown data
        const [projectsRes, indicatorsRes, districtsRes] = await Promise.all([
            apiService.get('/projects'),
            apiService.get('/indicators'),
            apiService.get('/support-data/districts').catch(() => ({ data: [] }))
        ]);

        const projects = projectsRes.data?.projects || projectsRes.data || [];
        const indicators = indicatorsRes.data?.indicators || indicatorsRes.data || [];
        const districts = Array.isArray(districtsRes.data) ? districtsRes.data : [];

        // Create header
        const header = createPageHeader({
            title: 'New Activity Report',
            subtitle: 'Submit activity implementation data with disaggregation',
            icon: 'file-earmark-plus',
            actions: [
                {
                    label: 'Back to Activities',
                    icon: 'arrow-left',
                    variant: 'outline-secondary',
                    onClick: "window.location.hash='activities'"
                }
            ]
        });

        // Create form HTML
        const formHTML = createActivityForm(projects, indicators, districts);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${createCard({
                title: 'Activity Information',
                subtitle: 'All fields marked with * are required',
                body: formHTML
            })}
        `;

        // Initialize form handlers
        initializeFormHandlers();

        // District → Settlement cascade
        const districtSel = document.getElementById('districtId');
        const settlementSel = document.getElementById('settlementId');
        if (districtSel && settlementSel) {
            districtSel.addEventListener('change', async function () {
                settlementSel.disabled = true;
                settlementSel.innerHTML = '<option value="">Loading...</option>';
                if (!this.value) {
                    settlementSel.innerHTML = '<option value="">Select District first...</option>';
                    return;
                }
                const res = await apiService.get(`/support-data/settlements/${this.value}`).catch(() => ({ data: [] }));
                const settlements = Array.isArray(res.data) ? res.data : [];
                settlementSel.innerHTML = settlements.length
                    ? '<option value="">— Select Settlement —</option>' +
                      settlements.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
                    : '<option value="">— No settlements —</option>';
                settlementSel.disabled = !settlements.length;
            });
        }

    } catch (error) {
        console.error('Entry form error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load form',
            () => renderEntryForm(contentArea)
        );
    }
}

/**
 * Create activity form HTML
 * @param {Array} projects - Array of projects
 * @param {Array} indicators - Array of indicators
 * @returns {string} HTML string
 */
function createActivityForm(projects, indicators, districts = []) {
    // Create project options
    const projectOptions = projects.map(p => 
        `<option value="${p.id || p.project_id}">${p.name || p.project_name}</option>`
    ).join('');

    // Create indicator options
    const indicatorOptions = indicators.map(ind =>
        `<option value="${ind.id || ind.indicator_id}" data-thematic-area="${ind.thematic_area_id || ind.thematicAreaId}">${ind.code || ind.indicator_code} - ${ind.name || ind.indicator_name}</option>`
    ).join('');

    const districtOptions = districts.map(d =>
        `<option value="${d.id}">${d.name}</option>`
    ).join('');

    return `
        <form id="activityForm">
            <!-- Basic Information -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-info-circle"></i> Basic Information</h6>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label for="activityCode" class="form-label">Activity Code</label>
                    <input type="text" class="form-control" id="activityCode" 
                           placeholder="e.g., 1.2.3, 3.2.4 (optional)">
                </div>

                <div class="col-md-6 mb-3">
                    <label for="activityTitle" class="form-label">Activity Title *</label>
                    <input type="text" class="form-control" id="activityTitle" required 
                           placeholder="Brief descriptive title">
                </div>

                <div class="col-md-4 mb-3">
                    <label for="projectId" class="form-label">Project *</label>
                    <select class="form-select" id="projectId" required>
                        <option value="">Select Project</option>
                        ${projectOptions}
                    </select>
                </div>

                <div class="col-md-4 mb-3">
                    <label for="indicatorId" class="form-label">Indicator *</label>
                    <select class="form-select" id="indicatorId" required>
                        <option value="">Select Indicator</option>
                        ${indicatorOptions}
                    </select>
                </div>

                <div class="col-md-4 mb-3">
                    <label for="activityDate" class="form-label">Activity Date *</label>
                    <input type="date" class="form-control" id="activityDate" required>
                </div>

                <div class="col-md-3 mb-3">
                    <label for="districtId" class="form-label">District *</label>
                    <select class="form-select" id="districtId" required>
                        <option value="">Select District</option>
                        ${districtOptions}
                    </select>
                </div>

                <div class="col-md-3 mb-3">
                    <label for="settlementId" class="form-label">Settlement / TC</label>
                    <select class="form-select" id="settlementId" disabled>
                        <option value="">Select District first...</option>
                    </select>
                </div>

                <div class="col-md-3 mb-3">
                    <label for="status" class="form-label">Status *</label>
                    <select class="form-select" id="status" required>
                        <option value="">Select Status</option>
                        <option value="Planned">Planned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                <div class="col-md-3 mb-3">
                    <label for="approvalStatus" class="form-label">Approval Status</label>
                    <select class="form-select" id="approvalStatus">
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <!-- Refugee Disaggregation -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-people"></i> Refugee Beneficiaries</h6>
                </div>

                <div class="col-12 mb-3">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Age Group</th>
                                <th class="text-center">Male</th>
                                <th class="text-center">Female</th>
                                <th class="text-center">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0-4 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_male_0_4" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_female_0_4" min="0" value="0"></td>
                                <td class="text-center align-middle" id="refugee_subtotal_0_4">0</td>
                            </tr>
                            <tr>
                                <td>5-17 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_male_5_17" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_female_5_17" min="0" value="0"></td>
                                <td class="text-center align-middle" id="refugee_subtotal_5_17">0</td>
                            </tr>
                            <tr>
                                <td>18-49 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_male_18_49" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_female_18_49" min="0" value="0"></td>
                                <td class="text-center align-middle" id="refugee_subtotal_18_49">0</td>
                            </tr>
                            <tr>
                                <td>50+ years</td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_male_50plus" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center refugee-input" 
                                           id="refugee_female_50plus" min="0" value="0"></td>
                                <td class="text-center align-middle" id="refugee_subtotal_50plus">0</td>
                            </tr>
                            <tr class="table-secondary">
                                <td><strong>Refugee Total</strong></td>
                                <td class="text-center align-middle" id="refugee_male_total">0</td>
                                <td class="text-center align-middle" id="refugee_female_total">0</td>
                                <td class="text-center align-middle"><strong id="refugee_grand_total">0</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Host Community Disaggregation -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-house"></i> Host Community Beneficiaries</h6>
                </div>

                <div class="col-12 mb-3">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Age Group</th>
                                <th class="text-center">Male</th>
                                <th class="text-center">Female</th>
                                <th class="text-center">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0-4 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_male_0_4" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_female_0_4" min="0" value="0"></td>
                                <td class="text-center align-middle" id="host_subtotal_0_4">0</td>
                            </tr>
                            <tr>
                                <td>5-17 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_male_5_17" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_female_5_17" min="0" value="0"></td>
                                <td class="text-center align-middle" id="host_subtotal_5_17">0</td>
                            </tr>
                            <tr>
                                <td>18-49 years</td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_male_18_49" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_female_18_49" min="0" value="0"></td>
                                <td class="text-center align-middle" id="host_subtotal_18_49">0</td>
                            </tr>
                            <tr>
                                <td>50+ years</td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_male_50plus" min="0" value="0"></td>
                                <td><input type="number" class="form-control form-control-sm text-center host-input" 
                                           id="host_female_50plus" min="0" value="0"></td>
                                <td class="text-center align-middle" id="host_subtotal_50plus">0</td>
                            </tr>
                            <tr class="table-secondary">
                                <td><strong>Host Community Total</strong></td>
                                <td class="text-center align-middle" id="host_male_total">0</td>
                                <td class="text-center align-middle" id="host_female_total">0</td>
                                <td class="text-center align-middle"><strong id="host_grand_total">0</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Grand Total -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h5 class="alert-heading"><i class="bi bi-calculator"></i> Total Beneficiaries</h5>
                        <p class="mb-0">
                            <strong id="overall_grand_total">0</strong> beneficiaries 
                            (<span id="overall_male_total">0</span> male, <span id="overall_female_total">0</span> female)
                        </p>
                    </div>
                </div>
            </div>

            <!-- Nationality Breakdown -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-flag"></i> Nationality Breakdown (Refugee Only)</h6>
                </div>

                <div class="col-md-3 mb-3">
                    <label for="sudanese" class="form-label">Sudanese</label>
                    <input type="number" class="form-control nationality-input" id="sudanese" min="0" value="0">
                </div>

                <div class="col-md-3 mb-3">
                    <label for="congolese" class="form-label">Congolese</label>
                    <input type="number" class="form-control nationality-input" id="congolese" min="0" value="0">
                </div>

                <div class="col-md-3 mb-3">
                    <label for="southSudanese" class="form-label">South Sudanese</label>
                    <input type="number" class="form-control nationality-input" id="southSudanese" min="0" value="0">
                </div>

                <div class="col-md-3 mb-3">
                    <label for="others" class="form-label">Others</label>
                    <input type="number" class="form-control nationality-input" id="others" min="0" value="0">
                </div>

                <div class="col-12">
                    <div id="nationality-warning" class="alert alert-warning d-none">
                        <i class="bi bi-exclamation-triangle"></i> 
                        <strong>Warning:</strong> Nationality total (<span id="nationality-total">0</span>) 
                        does not match refugee total (<span id="refugee-total-check">0</span>).
                    </div>
                </div>
            </div>

            <!-- Budget Information -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-cash-stack"></i> Budget Information</h6>
                </div>

                <div class="col-md-6 mb-3">
                    <label for="budget" class="form-label">Budget Allocated (USD)</label>
                    <input type="number" class="form-control" id="budget" min="0" step="0.01" value="0">
                </div>

                <div class="col-md-6 mb-3">
                    <label for="expenditure" class="form-label">Actual Expenditure (USD)</label>
                    <input type="number" class="form-control" id="expenditure" min="0" step="0.01" value="0">
                </div>
            </div>

            <!-- Narrative -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-file-text"></i> Narrative & Notes</h6>
                </div>

                <div class="col-12 mb-3">
                    <label for="description" class="form-label">Activity Description</label>
                    <textarea class="form-control" id="description" rows="3" 
                              placeholder="Brief description of what was done"></textarea>
                </div>

                <div class="col-12 mb-3">
                    <label for="notes" class="form-label">Additional Notes</label>
                    <textarea class="form-control" id="notes" rows="2" 
                              placeholder="Any additional information, challenges, or observations"></textarea>
                </div>
            </div>

            <!-- File Upload Placeholder -->
            <div class="row mb-4">
                <div class="col-12">
                    <h6 class="border-bottom pb-2 mb-3"><i class="bi bi-paperclip"></i> Attachments</h6>
                </div>

                <div class="col-12">
                    <div class="alert alert-secondary">
                        <i class="bi bi-info-circle"></i> 
                        File upload functionality will be implemented in Phase 3.
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="row">
                <div class="col-12">
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-secondary" onclick="window.resetForm()">
                            <i class="bi bi-x-circle"></i> Reset
                        </button>
                        <button type="button" class="btn btn-outline-primary" onclick="window.saveDraft()">
                            <i class="bi bi-save"></i> Save Draft
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle"></i> Submit for Review
                        </button>
                    </div>
                </div>
            </div>
        </form>
    `;
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
    // Auto-calculate refugee totals
    document.querySelectorAll('.refugee-input').forEach(input => {
        input.addEventListener('input', calculateRefugeeTotals);
    });

    // Auto-calculate host totals
    document.querySelectorAll('.host-input').forEach(input => {
        input.addEventListener('input', calculateHostTotals);
    });

    // Validate nationality totals
    document.querySelectorAll('.nationality-input').forEach(input => {
        input.addEventListener('input', validateNationality);
    });

    // Auto-populate thematic area from indicator selection
    const indicatorDropdown = document.getElementById('indicatorId');
    if (indicatorDropdown) {
        indicatorDropdown.addEventListener('change', function() {
            // Store the selected indicator's thematic area ID
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.value) {
                // Find the indicator in the indicators list to get its thematic_area_id
                const indicatorId = selectedOption.value;
                // We'll add a data attribute to store this
                const thematicAreaId = selectedOption.getAttribute('data-thematic-area');
                // Store it for form submission
                document.getElementById('activityForm').setAttribute('data-thematic-area-id', thematicAreaId);
            }
        });
    }

    // Form submission
    document.getElementById('activityForm').addEventListener('submit', handleFormSubmit);
}

/**
 * Calculate refugee totals
 */
function calculateRefugeeTotals() {
    const ageGroups = ['0_4', '5_17', '18_49', '50plus'];
    let maleTotalconst = 0;
    let femaleTotalconst = 0;

    ageGroups.forEach(group => {
        const male = parseInt(document.getElementById(`refugee_male_${group}`).value) || 0;
        const female = parseInt(document.getElementById(`refugee_female_${group}`).value) || 0;
        const subtotal = male + female;

        document.getElementById(`refugee_subtotal_${group}`).textContent = subtotal;
        maleTotalconst += male;
        femaleTotalconst += female;
    });

    document.getElementById('refugee_male_total').textContent = maleTotalconst;
    document.getElementById('refugee_female_total').textContent = femaleTotalconst;
    document.getElementById('refugee_grand_total').textContent = maleTotalconst + femaleTotalconst;

    calculateGrandTotal();
    validateNationality();
}

/**
 * Calculate host community totals
 */
function calculateHostTotals() {
    const ageGroups = ['0_4', '5_17', '18_49', '50plus'];
    let maleTotalhost = 0;
    let femaleTotalhost = 0;

    ageGroups.forEach(group => {
        const male = parseInt(document.getElementById(`host_male_${group}`).value) || 0;
        const female = parseInt(document.getElementById(`host_female_${group}`).value) || 0;
        const subtotal = male + female;

        document.getElementById(`host_subtotal_${group}`).textContent = subtotal;
        maleTotalhost += male;
        femaleTotalhost += female;
    });

    document.getElementById('host_male_total').textContent = maleTotalhost;
    document.getElementById('host_female_total').textContent = femaleTotalhost;
    document.getElementById('host_grand_total').textContent = maleTotalhost + femaleTotalhost;

    calculateGrandTotal();
}

/**
 * Calculate overall grand total
 */
function calculateGrandTotal() {
    const refugeeTotal = parseInt(document.getElementById('refugee_grand_total').textContent) || 0;
    const hostTotal = parseInt(document.getElementById('host_grand_total').textContent) || 0;
    
    const refugeeMale = parseInt(document.getElementById('refugee_male_total').textContent) || 0;
    const hostMale = parseInt(document.getElementById('host_male_total').textContent) || 0;
    
    const refugeeFemale = parseInt(document.getElementById('refugee_female_total').textContent) || 0;
    const hostFemale = parseInt(document.getElementById('host_female_total').textContent) || 0;

    document.getElementById('overall_grand_total').textContent = refugeeTotal + hostTotal;
    document.getElementById('overall_male_total').textContent = refugeeMale + hostMale;
    document.getElementById('overall_female_total').textContent = refugeeFemale + hostFemale;
}

/**
 * Validate nationality against refugee total
 */
function validateNationality() {
    const sudanese = parseInt(document.getElementById('sudanese').value) || 0;
    const congolese = parseInt(document.getElementById('congolese').value) || 0;
    const southSudanese = parseInt(document.getElementById('southSudanese').value) || 0;
    const others = parseInt(document.getElementById('others').value) || 0;
    
    const nationalityTotal = sudanese + congolese + southSudanese + others;
    const refugeeTotal = parseInt(document.getElementById('refugee_grand_total').textContent) || 0;

    document.getElementById('nationality-total').textContent = nationalityTotal;
    document.getElementById('refugee-total-check').textContent = refugeeTotal;

    const warningDiv = document.getElementById('nationality-warning');
    if (nationalityTotal !== refugeeTotal && refugeeTotal > 0) {
        warningDiv.classList.remove('d-none');
    } else {
        warningDiv.classList.add('d-none');
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        // Get thematic_area_id from the selected indicator
        const thematicAreaId = document.getElementById('activityForm').getAttribute('data-thematic-area-id');
        
        if (!thematicAreaId) {
            alert('Please select an indicator first');
            return;
        }

        // Collect form data - Calculate beneficiaries from disaggregation
        // Sum up refugee disaggregation
        const refugeeMale = (parseInt(document.getElementById('refugee_male_0_4').value) || 0) +
                           (parseInt(document.getElementById('refugee_male_5_17').value) || 0) +
                           (parseInt(document.getElementById('refugee_male_18_49').value) || 0) +
                           (parseInt(document.getElementById('refugee_male_50plus').value) || 0);
        
        const refugeeFemale = (parseInt(document.getElementById('refugee_female_0_4').value) || 0) +
                             (parseInt(document.getElementById('refugee_female_5_17').value) || 0) +
                             (parseInt(document.getElementById('refugee_female_18_49').value) || 0) +
                             (parseInt(document.getElementById('refugee_female_50plus').value) || 0);
        
        // Sum up host disaggregation
        const hostMale = (parseInt(document.getElementById('host_male_0_4').value) || 0) +
                        (parseInt(document.getElementById('host_male_5_17').value) || 0) +
                        (parseInt(document.getElementById('host_male_18_49').value) || 0) +
                        (parseInt(document.getElementById('host_male_50plus').value) || 0);
        
        const hostFemale = (parseInt(document.getElementById('host_female_0_4').value) || 0) +
                          (parseInt(document.getElementById('host_female_5_17').value) || 0) +
                          (parseInt(document.getElementById('host_female_18_49').value) || 0) +
                          (parseInt(document.getElementById('host_female_50plus').value) || 0);
        
        const formData = {
            activity_name: document.getElementById('activityTitle').value,
            project_id: document.getElementById('projectId').value,
            indicator_id: document.getElementById('indicatorId').value,
            thematic_area_id: thematicAreaId,
            planned_date: document.getElementById('activityDate').value,
            district_id: document.getElementById('districtId').value || null,
            settlement_id: document.getElementById('settlementId').value || null,
            status: document.getElementById('status').value,
            description: document.getElementById('description').value || '',
            notes: document.getElementById('notes').value || '',
            budget: parseFloat(document.getElementById('budget').value) || 0,
            actual_cost: parseFloat(document.getElementById('expenditure').value) || 0,
            // Backend expects direct/indirect male/female/other (not detailed disaggregation)
            direct_male: refugeeMale,
            direct_female: refugeeFemale,
            direct_other: 0,
            indirect_male: hostMale,
            indirect_female: hostFemale,
            indirect_other: 0
        };

        // Submit to API
        const response = await apiService.post('/activities', formData);

        // Show success message
        const contentArea = document.getElementById('content-area');
        const successHTML = createSuccessAlert('Activity submitted successfully!');
        contentArea.insertAdjacentHTML('afterbegin', successHTML);

        // Redirect to activities page
        setTimeout(() => {
            window.location.hash = 'activities';
        }, 2000);

    } catch (error) {
        console.error('Form submission error:', error);
        const errorHTML = createErrorAlert(error.message || 'Failed to submit activity');
        document.getElementById('content-area').insertAdjacentHTML('afterbegin', errorHTML);
    }
}

/**
 * Window-level functions for button handlers
 */
window.resetForm = function() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.getElementById('activityForm').reset();
        calculateRefugeeTotals();
        calculateHostTotals();
        validateNationality();
    }
};

window.saveDraft = function() {
    alert('Save Draft functionality will be implemented in Phase 3');
};
