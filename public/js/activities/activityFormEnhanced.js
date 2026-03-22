/**
 * Enhanced Activity Form - Multi-currency, PWD tracking, and gender options
 * 
 * Features:
 * - Costed/Non-costed checkbox
 * - Multi-currency support (UGX, USD, EUR, GBP)
 * - PWD disaggregation with validation
 * - Enhanced gender options (Male, Female, Other, Prefer not to say)
 * - Real-time validation
 * - Currency conversion display
 */

import { formatCurrency, createCurrencyOptions, validatePWDSum, validatePWDBeneficiaries, getCurrencySymbol } from '../utils/currencyUtils.js';
import apiService from '../apiService.js';

/**
 * Render enhanced activity form fields
 * @param {Object} activity - Existing activity data (for edit mode)
 * @returns {string} HTML for enhanced form fields
 */
export function renderEnhancedActivityFields(activity = {}) {
    const isCosted = activity.is_costed !== false;
    const currency = activity.currency || 'UGX';

    return `
        <!-- Costed Activity Toggle -->
        <div class="mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="is_costed" 
                       ${isCosted ? 'checked' : ''}>
                <label class="form-check-label" for="is_costed">
                    <strong>Is this a costed activity?</strong>
                    <small class="text-muted d-block">
                        Uncheck if this activity does not have budget/financial tracking
                    </small>
                </label>
            </div>
        </div>

        <!-- Budget Fields (conditionally shown) -->
        <div id="budget-fields-container" style="display: ${isCosted ? 'block' : 'none'}">
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0">Financial Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="currency" class="form-label">Currency <span class="text-danger">*</span></label>
                            <select class="form-select" id="currency" required>
                                ${createCurrencyOptions(currency)}
                            </select>
                            <small class="text-muted">Default currency is UGX</small>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="budget" class="form-label">
                                Budget <span class="text-danger">*</span>
                                <span id="currency-symbol-budget" class="badge bg-info">${getCurrencySymbol(currency)}</span>
                            </label>
                            <input type="number" class="form-control" id="budget" 
                                   min="0" step="0.01" 
                                   value="${activity.budget || 0}" required>
                            <div id="budget-ugx-display" class="text-muted small mt-1"></div>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="actual_cost" class="form-label">
                                Actual Cost
                                <span id="currency-symbol-cost" class="badge bg-info">${getCurrencySymbol(currency)}</span>
                            </label>
                            <input type="number" class="form-control" id="actual_cost" 
                                   min="0" step="0.01" 
                                   value="${activity.actual_cost || 0}">
                            <div id="cost-ugx-display" class="text-muted small mt-1"></div>
                        </div>

                        <div class="col-md-6 mb-3">
                            <label for="exchange_rate" class="form-label">Exchange Rate to UGX</label>
                            <input type="number" class="form-control" id="exchange_rate" 
                                   min="0" step="0.0001" 
                                   value="${activity.exchange_rate || 1}" readonly>
                            <small class="text-muted">Auto-fetched from system rates</small>
                        </div>
                    </div>

                    <div id="budget-warning" class="alert alert-warning mt-2" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i> Actual cost exceeds budget!
                    </div>
                </div>
            </div>
        </div>

        <!-- PWD (People with Disabilities) Disaggregation -->
        <div class="card mb-3">
            <div class="card-header bg-light">
                <h6 class="mb-0">People with Disabilities (PWD) Tracking</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <label for="pwds_male" class="form-label">PWDs Male</label>
                        <input type="number" class="form-control pwd-input" id="pwds_male" 
                               min="0" value="${activity.pwds_male || 0}">
                    </div>

                    <div class="col-md-3 mb-3">
                        <label for="pwds_female" class="form-label">PWDs Female</label>
                        <input type="number" class="form-control pwd-input" id="pwds_female" 
                               min="0" value="${activity.pwds_female || 0}">
                    </div>

                    <div class="col-md-3 mb-3">
                        <label for="pwds_other" class="form-label">PWDs Other</label>
                        <input type="number" class="form-control pwd-input" id="pwds_other" 
                               min="0" value="${activity.pwds_other || 0}">
                    </div>

                    <div class="col-md-3 mb-3">
                        <label class="form-label">Total PWDs</label>
                        <input type="text" class="form-control" id="pwds_total" readonly>
                        <small class="text-muted">Auto-calculated</small>
                    </div>
                </div>

                <div id="pwd-validation-message" class="mt-2"></div>

                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <strong>Note:</strong> Total PWDs must be less than or equal to total beneficiaries.
                    Male + Female + Other must equal Total PWDs.
                </div>
            </div>
        </div>

        <!-- Gender Options -->
        <div class="card mb-3">
            <div class="card-header bg-light">
                <h6 class="mb-0">Gender Options</h6>
            </div>
            <div class="card-body">
                <p class="text-muted small mb-3">
                    Enhanced gender options for inclusive data collection
                </p>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="gender_preference" 
                           id="gender_male" value="Male" checked>
                    <label class="form-check-label" for="gender_male">Male</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="gender_preference" 
                           id="gender_female" value="Female">
                    <label class="form-check-label" for="gender_female">Female</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="gender_preference" 
                           id="gender_other" value="Other">
                    <label class="form-check-label" for="gender_other">Other</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="gender_preference" 
                           id="gender_prefer_not" value="Prefer not to say">
                    <label class="form-check-label" for="gender_prefer_not">Prefer not to say</label>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize enhanced activity form event handlers
 */
export function initializeEnhancedActivityForm() {
    // Costed checkbox toggle
    const isCostedCheckbox = document.getElementById('is_costed');
    if (isCostedCheckbox) {
        isCostedCheckbox.addEventListener('change', function() {
            const budgetContainer = document.getElementById('budget-fields-container');
            if (budgetContainer) {
                budgetContainer.style.display = this.checked ? 'block' : 'none';
                
                // Clear budget fields if unchecked
                if (!this.checked) {
                    document.getElementById('budget').value = 0;
                    document.getElementById('actual_cost').value = 0;
                    document.getElementById('exchange_rate').value = 1;
                }
            }
        });
    }

    // Currency change handler
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', async function() {
            const currency = this.value;
            
            // Update currency symbols
            const symbolBudget = document.getElementById('currency-symbol-budget');
            const symbolCost = document.getElementById('currency-symbol-cost');
            
            if (symbolBudget) symbolBudget.textContent = getCurrencySymbol(currency);
            if (symbolCost) symbolCost.textContent = getCurrencySymbol(currency);

            // Fetch exchange rate if not UGX
            if (currency !== 'UGX') {
                await fetchAndUpdateExchangeRate(currency);
            } else {
                document.getElementById('exchange_rate').value = 1;
                updateCurrencyDisplay();
            }
        });
    }

    // Budget and cost change handlers
    const budgetInput = document.getElementById('budget');
    const actualCostInput = document.getElementById('actual_cost');

    if (budgetInput) {
        budgetInput.addEventListener('input', function() {
            validateBudgetVsCost();
            updateCurrencyDisplay();
        });
    }

    if (actualCostInput) {
        actualCostInput.addEventListener('input', function() {
            validateBudgetVsCost();
            updateCurrencyDisplay();
        });
    }

    // PWD inputs change handler
    const pwdInputs = document.querySelectorAll('.pwd-input');
    pwdInputs.forEach(input => {
        input.addEventListener('input', validatePWDFields);
    });

    // Initialize validations
    validatePWDFields();
    validateBudgetVsCost();
}

/**
 * Fetch and update exchange rate from API
 * @param {string} fromCurrency - Source currency
 */
async function fetchAndUpdateExchangeRate(fromCurrency) {
    try {
        const response = await apiService.get(`/activities/currency-rates/${fromCurrency}/UGX`);
        
        if (response.success && response.data.rate) {
            document.getElementById('exchange_rate').value = response.data.rate.toFixed(4);
            updateCurrencyDisplay();
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Show error message
        const exchangeRateInput = document.getElementById('exchange_rate');
        if (exchangeRateInput) {
            exchangeRateInput.value = 1;
        }
    }
}

/**
 * Update currency conversion display
 */
function updateCurrencyDisplay() {
    const currency = document.getElementById('currency')?.value || 'UGX';
    const budget = parseFloat(document.getElementById('budget')?.value || 0);
    const actualCost = parseFloat(document.getElementById('actual_cost')?.value || 0);
    const exchangeRate = parseFloat(document.getElementById('exchange_rate')?.value || 1);

    // Only show conversion if not UGX
    if (currency !== 'UGX' && exchangeRate !== 1) {
        const budgetUGX = budget * exchangeRate;
        const costUGX = actualCost * exchangeRate;

        const budgetDisplay = document.getElementById('budget-ugx-display');
        const costDisplay = document.getElementById('cost-ugx-display');

        if (budgetDisplay) {
            budgetDisplay.textContent = `≈ ${formatCurrency(budgetUGX, 'UGX')}`;
        }

        if (costDisplay) {
            costDisplay.textContent = `≈ ${formatCurrency(costUGX, 'UGX')}`;
        }
    } else {
        // Clear displays
        const budgetDisplay = document.getElementById('budget-ugx-display');
        const costDisplay = document.getElementById('cost-ugx-display');
        if (budgetDisplay) budgetDisplay.textContent = '';
        if (costDisplay) costDisplay.textContent = '';
    }
}

/**
 * Validate budget vs cost
 */
function validateBudgetVsCost() {
    const budget = parseFloat(document.getElementById('budget')?.value || 0);
    const actualCost = parseFloat(document.getElementById('actual_cost')?.value || 0);
    const warningDiv = document.getElementById('budget-warning');

    if (warningDiv) {
        if (actualCost > budget && budget > 0) {
            warningDiv.style.display = 'block';
        } else {
            warningDiv.style.display = 'none';
        }
    }
}

/**
 * Validate PWD fields
 */
function validatePWDFields() {
    const pwdsMale = parseInt(document.getElementById('pwds_male')?.value || 0);
    const pwdsFemale = parseInt(document.getElementById('pwds_female')?.value || 0);
    const pwdsOther = parseInt(document.getElementById('pwds_other')?.value || 0);
    
    const total = pwdsMale + pwdsFemale + pwdsOther;
    
    // Update total display
    const totalInput = document.getElementById('pwds_total');
    if (totalInput) {
        totalInput.value = total;
    }

    // Validate sum
    const validation = validatePWDSum(pwdsMale, pwdsFemale, pwdsOther, total);
    
    const messageDiv = document.getElementById('pwd-validation-message');
    if (messageDiv) {
        if (validation.valid || total === 0) {
            messageDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> PWD disaggregation is valid</div>';
        } else {
            messageDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-times-circle"></i> ${validation.message}</div>`;
        }
    }

    // Validate against total beneficiaries (if available)
    const totalBeneficiaries = calculateTotalBeneficiaries();
    if (totalBeneficiaries > 0) {
        const beneficiaryValidation = validatePWDBeneficiaries(total, totalBeneficiaries);
        
        if (!beneficiaryValidation.valid) {
            if (messageDiv) {
                messageDiv.innerHTML += `<div class="alert alert-warning mt-2"><i class="fas fa-exclamation-triangle"></i> ${beneficiaryValidation.message}</div>`;
            }
        }
    }
}

/**
 * Calculate total beneficiaries from age disaggregation fields
 * @returns {number} Total beneficiaries
 */
function calculateTotalBeneficiaries() {
    const ageFields = [
        'age_0_4_male', 'age_0_4_female', 'age_0_4_other',
        'age_5_17_male', 'age_5_17_female', 'age_5_17_other',
        'age_18_49_male', 'age_18_49_female', 'age_18_49_other',
        'age_50_plus_male', 'age_50_plus_female', 'age_50_plus_other'
    ];

    let total = 0;
    ageFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            total += parseInt(element.value || 0);
        }
    });

    // If no age disaggregation, try direct beneficiaries
    if (total === 0) {
        const directMale = parseInt(document.getElementById('direct_male')?.value || 0);
        const directFemale = parseInt(document.getElementById('direct_female')?.value || 0);
        const directOther = parseInt(document.getElementById('direct_other')?.value || 0);
        total = directMale + directFemale + directOther;
    }

    return total;
}

/**
 * Get form data with enhanced fields
 * @returns {Object} Form data including enhanced fields
 */
export function getEnhancedActivityFormData() {
    const isCosted = document.getElementById('is_costed')?.checked !== false;
    
    const data = {
        is_costed: isCosted
    };

    if (isCosted) {
        data.currency = document.getElementById('currency')?.value || 'UGX';
        data.budget = parseFloat(document.getElementById('budget')?.value || 0);
        data.actual_cost = parseFloat(document.getElementById('actual_cost')?.value || 0);
        data.exchange_rate = parseFloat(document.getElementById('exchange_rate')?.value || 1);
    }

    // PWD data
    data.pwds_male = parseInt(document.getElementById('pwds_male')?.value || 0);
    data.pwds_female = parseInt(document.getElementById('pwds_female')?.value || 0);
    data.pwds_other = parseInt(document.getElementById('pwds_other')?.value || 0);

    // Gender preference (if needed for specific use case)
    const selectedGender = document.querySelector('input[name="gender_preference"]:checked');
    if (selectedGender) {
        data.gender_preference = selectedGender.value;
    }

    return data;
}

export default {
    renderEnhancedActivityFields,
    initializeEnhancedActivityForm,
    getEnhancedActivityFormData
};
