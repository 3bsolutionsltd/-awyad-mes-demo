export function renderEntryForm() {
    return `
        <div class="container-fluid">
            <h1 class="mb-4">New Activity Report</h1>
            
            <div class="card">
                <div class="card-body">
                    <form id="activity-form">
                        <!-- Project Selection -->
                        <div class="mb-3">
                            <label for="form-project" class="form-label">Project <span class="text-danger">*</span></label>
                            <select class="form-select" id="form-project" required>
                                <option value="">Select a project...</option>
                            </select>
                        </div>
                        
                        <!-- Indicator Selection -->
                        <div class="mb-3">
                            <label for="form-indicator" class="form-label">Indicator <span class="text-danger">*</span></label>
                            <select class="form-select" id="form-indicator" required>
                                <option value="">Select an indicator...</option>
                            </select>
                        </div>
                        
                        <!-- Activity Name -->
                        <div class="mb-3">
                            <label for="form-activity-name" class="form-label">Activity Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="form-activity-name" placeholder="Enter activity name" required>
                        </div>
                        
                        <!-- Activity Code -->
                        <div class="mb-3">
                            <label for="form-activity-code" class="form-label">Activity Code</label>
                            <input type="text" class="form-control" id="form-activity-code" placeholder="e.g., 3.2.3, 3.2.4">
                            <div class="form-text">M&E Framework activity code (e.g., 3.2.3 for CSO support)</div>
                        </div>
                        
                        <!-- Location and Date -->
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="form-location" class="form-label">Location <span class="text-danger">*</span></label>
                                <select class="form-select" id="form-location" required>
                                    <option value="">Select location...</option>
                                    <option value="Nakivale">Nakivale</option>
                                    <option value="Nyakabande">Nyakabande</option>
                                    <option value="Kampala">Kampala</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="form-activity-date" class="form-label">Activity Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="form-activity-date" required>
                            </div>
                        </div>
                        
                        <!-- Beneficiaries Disaggregation Section -->
                        <div class="mb-4">
                            <h4 class="mb-3">Beneficiary Disaggregation</h4>
                            <p class="text-muted">Enter the number of beneficiaries by community type, gender, and age group</p>
                            
                            <!-- Refugee Beneficiaries -->
                            <div class="card mb-3">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">Refugee Beneficiaries</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row mb-2">
                                        <div class="col-md-3"><strong>Age Group</strong></div>
                                        <div class="col-md-3"><strong>Male</strong></div>
                                        <div class="col-md-3"><strong>Female</strong></div>
                                        <div class="col-md-3"><strong>Subtotal</strong></div>
                                    </div>
                                    ${['0-4 yrs', '5-17 yrs', '18-49 yrs', '50+ yrs'].map(ageGroup => `
                                        <div class="row mb-2">
                                            <div class="col-md-3">
                                                <label class="form-label">${ageGroup}</label>
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control beneficiary-input refugee-male" 
                                                       data-age="${ageGroup}" min="0" value="0">
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control beneficiary-input refugee-female" 
                                                       data-age="${ageGroup}" min="0" value="0">
                                            </div>
                                            <div class="col-md-3">
                                                <input type="text" class="form-control subtotal-refugee-${ageGroup.replace(/\s+/g, '-')}" 
                                                       readonly value="0">
                                            </div>
                                        </div>
                                    `).join('')}
                                    <div class="row mt-3">
                                        <div class="col-md-9 text-end"><strong>Total Refugee:</strong></div>
                                        <div class="col-md-3">
                                            <input type="text" class="form-control fw-bold" id="total-refugee" readonly value="0">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Host Community Beneficiaries -->
                            <div class="card mb-3">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0">Host Community Beneficiaries</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row mb-2">
                                        <div class="col-md-3"><strong>Age Group</strong></div>
                                        <div class="col-md-3"><strong>Male</strong></div>
                                        <div class="col-md-3"><strong>Female</strong></div>
                                        <div class="col-md-3"><strong>Subtotal</strong></div>
                                    </div>
                                    ${['0-4 yrs', '5-17 yrs', '18-49 yrs', '50+ yrs'].map(ageGroup => `
                                        <div class="row mb-2">
                                            <div class="col-md-3">
                                                <label class="form-label">${ageGroup}</label>
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control beneficiary-input host-male" 
                                                       data-age="${ageGroup}" min="0" value="0">
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control beneficiary-input host-female" 
                                                       data-age="${ageGroup}" min="0" value="0">
                                            </div>
                                            <div class="col-md-3">
                                                <input type="text" class="form-control subtotal-host-${ageGroup.replace(/\s+/g, '-')}" 
                                                       readonly value="0">
                                            </div>
                                        </div>
                                    `).join('')}
                                    <div class="row mt-3">
                                        <div class="col-md-9 text-end"><strong>Total Host:</strong></div>
                                        <div class="col-md-3">
                                            <input type="text" class="form-control fw-bold" id="total-host" readonly value="0">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Grand Total -->
                            <div class="alert alert-info">
                                <div class="row">
                                    <div class="col-md-9 text-end"><h5><strong>Grand Total Beneficiaries:</strong></h5></div>
                                    <div class="col-md-3">
                                        <h5><strong><span id="total-beneficiaries">0</span></strong></h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Nationality Breakdown (Refugees Only) -->
                        <div class="mb-4">
                            <h4 class="mb-3">Refugee Nationality Breakdown</h4>
                            <p class="text-muted">Enter the number of refugee beneficiaries by nationality</p>
                            
                            <div class="card">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="form-sudanese" class="form-label">Sudanese</label>
                                            <input type="number" class="form-control nationality-input" id="form-sudanese" min="0" value="0">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="form-congolese" class="form-label">Congolese</label>
                                            <input type="number" class="form-control nationality-input" id="form-congolese" min="0" value="0">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="form-south-sudanese" class="form-label">South Sudanese</label>
                                            <input type="number" class="form-control nationality-input" id="form-south-sudanese" min="0" value="0">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="form-others" class="form-label">Others</label>
                                            <input type="number" class="form-control nationality-input" id="form-others" min="0" value="0">
                                        </div>
                                    </div>
                                    <div class="alert alert-warning mt-2">
                                        <small><i class="bi bi-info-circle"></i> <strong>Total Nationality:</strong> <span id="total-nationality">0</span> (should match Total Refugee count)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Budget Information -->
                        <div class="mb-4">
                            <h4 class="mb-3">Budget Information</h4>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="form-budget" class="form-label">Activity Budget (USD)</label>
                                    <input type="number" class="form-control" id="form-budget" min="0" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="form-expenditure" class="form-label">Actual Expenditure (USD)</label>
                                    <input type="number" class="form-control" id="form-expenditure" min="0" step="0.01" required>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Narrative / Qualitative Notes -->
                        <div class="mb-3">
                            <label for="form-narrative" class="form-label">Narrative / Qualitative Notes</label>
                            <textarea class="form-control" id="form-narrative" rows="5" placeholder="Enter qualitative information, observations, and contextual details..."></textarea>
                        </div>
                        
                        <!-- Upload Evidence -->
                        <div class="mb-4">
                            <label for="form-evidence" class="form-label">Upload Evidence</label>
                            <input type="file" class="form-control" id="form-evidence" multiple accept="image/*,.pdf,.doc,.docx">
                            <div class="form-text">Supported formats: Images, PDF, Word documents</div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button type="button" class="btn btn-secondary me-md-2">Save as Draft</button>
                            <button type="submit" class="btn btn-primary">Submit for Review</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}
