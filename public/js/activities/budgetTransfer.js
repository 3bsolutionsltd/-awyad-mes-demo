/**
 * Budget Transfer Interface
 * 
 * Features:
 * - Transfer budget between projects and activities
 * - Multi-currency support
 * - Real-time validation
 * - Transfer preview
 * - Transfer history
 * - Reversal capability
 */

import { formatCurrency, createCurrencyOptions, getCurrencySymbol } from '../utils/currencyUtils.js';
import apiService from '../apiService.js';

/**
 * Render budget transfer modal
 * @returns {Promise<void>}
 */
export async function renderBudgetTransferModal() {
    // Fetch projects for dropdowns
    const projects = await fetchProjects();

    const modalHTML = `
        <div class="modal fade" id="budgetTransferModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Budget Transfer</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Source Selection -->
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Source Project</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="sourceProjectId" class="form-label">Select Source Project <span class="text-danger">*</span></label>
                                    <select class="form-select" id="sourceProjectId" required>
                                        <option value="">-- Select Project --</option>
                                        ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div id="sourceProjectInfo" style="display: none;" class="alert alert-info">
                                    <strong>Budget Summary:</strong>
                                    <div class="mt-2">
                                        <div>Total Budget: <span id="source-total-budget">-</span></div>
                                        <div>Expenditure: <span id="source-expenditure">-</span></div>
                                        <div>Transfers Out: <span id="source-transfers-out">-</span></div>
                                        <div class="mt-2 fw-bold text-success">
                                            Available: <span id="source-available">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Destination Selection -->
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Destination</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="destinationProjectId" class="form-label">Select Destination Project <span class="text-danger">*</span></label>
                                    <select class="form-select" id="destinationProjectId" required>
                                        <option value="">-- Select Project --</option>
                                        ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label for="destinationActivityId" class="form-label">Select Activity <span class="text-danger">*</span></label>
                                    <select class="form-select" id="destinationActivityId" required disabled>
                                        <option value="">-- Select Destination Project First --</option>
                                    </select>
                                </div>

                                <div id="destinationActivityInfo" style="display: none;" class="alert alert-info">
                                    <strong>Activity Budget:</strong>
                                    <div class="mt-2">
                                        <div>Current Budget: <span id="dest-current-budget">-</span></div>
                                        <div>Expenditure: <span id="dest-expenditure">-</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Transfer Details -->
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">Transfer Details</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="transferCurrency" class="form-label">Currency <span class="text-danger">*</span></label>
                                        <select class="form-select" id="transferCurrency" required>
                                            ${createCurrencyOptions('UGX')}
                                        </select>
                                    </div>

                                    <div class="col-md-6 mb-3">
                                        <label for="transferAmount" class="form-label">
                                            Amount <span class="text-danger">*</span>
                                            <span id="transfer-currency-symbol" class="badge bg-info">UGX</span>
                                        </label>
                                        <input type="number" class="form-control" id="transferAmount" 
                                               min="0" step="0.01" required>
                                        <div id="amount-ugx-display" class="text-muted small mt-1"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="transferReason" class="form-label">Reason/Justification <span class="text-danger">*</span></label>
                                    <textarea class="form-control" id="transferReason" rows="3" 
                                              placeholder="Provide detailed reason for this budget transfer (minimum 20 characters)" 
                                              required minlength="20"></textarea>
                                    <small class="text-muted">
                                        <span id="reason-char-count">0</span>/20 characters minimum
                                    </small>
                                </div>
                            </div>
                        </div>

                        <!-- Preview Section -->
                        <div id="transferPreview" class="card mb-3" style="display: none;">
                            <div class="card-header bg-warning">
                                <h6 class="mb-0">Transfer Preview</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-danger">Source Project Impact</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <td>Current Available:</td>
                                                <td class="text-end"><span id="preview-source-current">-</span></td>
                                            </tr>
                                            <tr>
                                                <td>Transfer Amount:</td>
                                                <td class="text-end text-danger">-<span id="preview-transfer-amount">-</span></td>
                                            </tr>
                                            <tr class="fw-bold">
                                                <td>After Transfer:</td>
                                                <td class="text-end"><span id="preview-source-after">-</span></td>
                                            </tr>
                                        </table>
                                    </div>

                                    <div class="col-md-6">
                                        <h6 class="text-success">Destination Activity Impact</h6>
                                        <table class="table table-sm">
                                            <tr>
                                                <td>Current Budget:</td>
                                                <td class="text-end"><span id="preview-dest-current">-</span></td>
                                            </tr>
                                            <tr>
                                                <td>Transfer Amount:</td>
                                                <td class="text-end text-success">+<span id="preview-transfer-amount-dest">-</span></td>
                                            </tr>
                                            <tr class="fw-bold">
                                                <td>After Transfer:</td>
                                                <td class="text-end"><span id="preview-dest-after">-</span></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="transferValidation" class="alert" style="display: none;"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="executeTransferBtn" disabled>
                            Execute Transfer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    const existingModal = document.getElementById('budgetTransferModal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize modal event handlers
    initializeBudgetTransferModal();
}

/**
 * Initialize budget transfer modal event handlers
 */
function initializeBudgetTransferModal() {
    // Source project selection
    document.getElementById('sourceProjectId').addEventListener('change', async function() {
        const projectId = this.value;
        if (projectId) {
            await loadSourceProjectInfo(projectId);
            updateTransferPreview();
        } else {
            document.getElementById('sourceProjectInfo').style.display = 'none';
        }
    });

    // Destination project selection
    document.getElementById('destinationProjectId').addEventListener('change', async function() {
        const projectId = this.value;
        const activitySelect = document.getElementById('destinationActivityId');
        
        if (projectId) {
            // Load activities for this project
            activitySelect.disabled = false;
            await loadProjectActivities(projectId);
        } else {
            activitySelect.disabled = true;
            activitySelect.innerHTML = '<option value="">-- Select Destination Project First --</option>';
            document.getElementById('destinationActivityInfo').style.display = 'none';
        }
    });

    // Destination activity selection
    document.getElementById('destinationActivityId').addEventListener('change', async function() {
        const activityId = this.value;
        if (activityId) {
            await loadActivityInfo(activityId);
            updateTransferPreview();
        } else {
            document.getElementById('destinationActivityInfo').style.display = 'none';
        }
    });

    // Currency change
    document.getElementById('transferCurrency').addEventListener('change', async function() {
        const currency = this.value;
        document.getElementById('transfer-currency-symbol').textContent = getCurrencySymbol(currency);
        await updateCurrencyConversion();
        updateTransferPreview();
    });

    // Amount change
    document.getElementById('transferAmount').addEventListener('input', async function() {
        await updateCurrencyConversion();
        updateTransferPreview();
        validateTransfer();
    });

    // Reason character count
    document.getElementById('transferReason').addEventListener('input', function() {
        const count = this.value.length;
        document.getElementById('reason-char-count').textContent = count;
        
        if (count >= 20) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
        
        validateTransfer();
    });

    // Execute transfer button
    document.getElementById('executeTransferBtn').addEventListener('click', executeTransfer);
}

/**
 * Load source project info
 */
async function loadSourceProjectInfo(projectId) {
    try {
        const response = await apiService.get(`/activities/financial-summary/${projectId}`);
        
        if (response.success) {
            const summary = response.data;
            
            document.getElementById('source-total-budget').textContent = formatCurrency(summary.budget.original);
            document.getElementById('source-expenditure').textContent = formatCurrency(summary.expenditure.total);
            document.getElementById('source-transfers-out').textContent = formatCurrency(summary.budget.transfersOut);
            document.getElementById('source-available').textContent = formatCurrency(summary.budget.available);
            
            document.getElementById('sourceProjectInfo').style.display = 'block';
            
            // Store for preview
            window.sourceProjectData = summary;
        }
    } catch (error) {
        console.error('Error loading source project:', error);
        alert('Error loading source project information');
    }
}

/**
 * Load project activities
 */
async function loadProjectActivities(projectId) {
    try {
        const response = await apiService.get(`/activities?project_id=${projectId}&limit=1000`);
        
        if (response.success) {
            const activities = response.data.activities || [];
            const activitySelect = document.getElementById('destinationActivityId');
            
            activitySelect.innerHTML = '<option value="">-- Select Activity --</option>';
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.id;
                option.textContent = `${activity.activity_name} (${activity.location})`;
                option.dataset.budget = activity.budget || 0;
                option.dataset.actualCost = activity.actual_cost || 0;
                activitySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

/**
 * Load activity info
 */
async function loadActivityInfo(activityId) {
    try {
        const response = await apiService.get(`/activities/${activityId}/budget`);
        
        if (response.success) {
            const budget = response.data;
            
            document.getElementById('dest-current-budget').textContent = formatCurrency(budget.totalBudget);
            document.getElementById('dest-expenditure').textContent = formatCurrency(budget.expenditure);
            
            document.getElementById('destinationActivityInfo').style.display = 'block';
            
            // Store for preview
            window.destinationActivityData = budget;
        }
    } catch (error) {
        console.error('Error loading activity info:', error);
    }
}

/**
 * Update currency conversion display
 */
async function updateCurrencyConversion() {
    const currency = document.getElementById('transferCurrency').value;
    const amount = parseFloat(document.getElementById('transferAmount').value || 0);
    
    if (currency !== 'UGX' && amount > 0) {
        try {
            const response = await apiService.get(`/activities/currency-rates/${currency}/UGX`);
            
            if (response.success) {
                const rate = response.data.rate;
                const amountUGX = amount * rate;
                
                document.getElementById('amount-ugx-display').textContent = 
                    `≈ ${formatCurrency(amountUGX, 'UGX')} (Rate: ${rate.toFixed(4)})`;
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
        }
    } else {
        document.getElementById('amount-ugx-display').textContent = '';
    }
}

/**
 * Update transfer preview
 */
function updateTransferPreview() {
    if (!window.sourceProjectData || !window.destinationActivityData) {
        document.getElementById('transferPreview').style.display = 'none';
        return;
    }

    const amount = parseFloat(document.getElementById('transferAmount').value || 0);
    const currency = document.getElementById('transferCurrency').value;
    
    if (amount <= 0) {
        document.getElementById('transferPreview').style.display = 'none';
        return;
    }

    // For simplicity, assume amount in UGX for preview
    // In real implementation, convert based on currency
    const sourceAvailable = window.sourceProjectData.budget.available;
    const destCurrent = window.destinationActivityData.totalBudget;

    document.getElementById('preview-source-current').textContent = formatCurrency(sourceAvailable);
    document.getElementById('preview-transfer-amount').textContent = formatCurrency(amount, currency);
    document.getElementById('preview-source-after').textContent = formatCurrency(sourceAvailable - amount);

    document.getElementById('preview-dest-current').textContent = formatCurrency(destCurrent);
    document.getElementById('preview-transfer-amount-dest').textContent = formatCurrency(amount, currency);
    document.getElementById('preview-dest-after').textContent = formatCurrency(destCurrent + amount);

    document.getElementById('transferPreview').style.display = 'block';
}

/**
 * Validate transfer
 */
async function validateTransfer() {
    const sourceProjectId = document.getElementById('sourceProjectId').value;
    const destinationProjectId = document.getElementById('destinationProjectId').value;
    const destinationActivityId = document.getElementById('destinationActivityId').value;
    const amount = parseFloat(document.getElementById('transferAmount').value || 0);
    const currency = document.getElementById('transferCurrency').value;
    const reason = document.getElementById('transferReason').value;

    const executeBtn = document.getElementById('executeTransferBtn');
    const validationDiv = document.getElementById('transferValidation');

    // Basic validation
    if (!sourceProjectId || !destinationProjectId || !destinationActivityId || 
        amount <= 0 || reason.length < 20) {
        executeBtn.disabled = true;
        validationDiv.style.display = 'none';
        return;
    }

    // Validate source has sufficient budget
    try {
        const response = await apiService.post('/activities/validate-transfer', {
            sourceProjectId,
            amount,
            currency
        });

        if (response.success && response.data.valid) {
            validationDiv.className = 'alert alert-success';
            validationDiv.innerHTML = '<i class="fas fa-check-circle"></i> Transfer is valid. Ready to execute.';
            validationDiv.style.display = 'block';
            executeBtn.disabled = false;
        } else {
            validationDiv.className = 'alert alert-danger';
            validationDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${response.data.message}`;
            validationDiv.style.display = 'block';
            executeBtn.disabled = true;
        }
    } catch (error) {
        validationDiv.className = 'alert alert-danger';
        validationDiv.innerHTML = '<i class="fas fa-times-circle"></i> Error validating transfer';
        validationDiv.style.display = 'block';
        executeBtn.disabled = true;
    }
}

/**
 * Execute transfer
 */
async function executeTransfer() {
    const transferData = {
        sourceProjectId: document.getElementById('sourceProjectId').value,
        destinationProjectId: document.getElementById('destinationProjectId').value,
        destinationActivityId: document.getElementById('destinationActivityId').value,
        amount: parseFloat(document.getElementById('transferAmount').value),
        currency: document.getElementById('transferCurrency').value,
        reason: document.getElementById('transferReason').value
    };

    const executeBtn = document.getElementById('executeTransferBtn');
    executeBtn.disabled = true;
    executeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        const response = await apiService.post('/activities/budget-transfers/new', transferData);

        if (response.success) {
            alert('Budget transfer completed successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('budgetTransferModal'));
            modal.hide();

            // Refresh the page or update relevant displays
            if (typeof window.refreshFinancialData === 'function') {
                window.refreshFinancialData();
            }
        }
    } catch (error) {
        console.error('Error executing transfer:', error);
        alert('Error executing transfer: ' + (error.message || 'Unknown error'));
        executeBtn.disabled = false;
        executeBtn.textContent = 'Execute Transfer';
    }
}

/**
 * Fetch projects list
 */
async function fetchProjects() {
    try {
        const response = await apiService.get('/projects?limit=1000');
        if (response.success) {
            return response.data.projects || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

/**
 * Render budget transfer history table
 */
export async function renderTransferHistory(projectId = null, activityId = null) {
    let transfers = [];
    
    try {
        if (activityId) {
            const response = await apiService.get(`/activities/budget-transfers/activity/${activityId}`);
            if (response.success) {
                transfers = response.data.transfers || [];
            }
        } else if (projectId) {
            const response = await apiService.get(`/activities/budget-transfers/project/${projectId}`);
            if (response.success) {
                transfers = response.data.transfers || [];
            }
        }

        return `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Date</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Amount</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transfers.length === 0 ? 
                            '<tr><td colspan="7" class="text-center text-muted">No transfer history</td></tr>' :
                            transfers.map(t => `
                                <tr>
                                    <td>${new Date(t.transfer_date).toLocaleDateString()}</td>
                                    <td>${t.source_project_name}</td>
                                    <td>${t.destination_project_name}<br><small class="text-muted">${t.activity_name}</small></td>
                                    <td>${formatCurrency(t.amount, t.currency)}<br><small class="text-muted">${formatCurrency(t.amount_ugx, 'UGX')}</small></td>
                                    <td><small>${t.reason}</small></td>
                                    <td>
                                        <span class="badge ${t.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                                            ${t.status}
                                        </span>
                                    </td>
                                    <td>
                                        ${t.status === 'completed' ? 
                                            `<button class="btn btn-sm btn-outline-danger" onclick="reverseTransfer('${t.id}')">
                                                <i class="fas fa-undo"></i> Reverse
                                            </button>` : 
                                            '-'
                                        }
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching transfer history:', error);
        return '<div class="alert alert-danger">Error loading transfer history</div>';
    }
}

/**
 * Reverse a transfer
 */
window.reverseTransfer = async function(transferId) {
    const reason = prompt('Please provide a reason for reversing this transfer (minimum 20 characters):');
    
    if (!reason || reason.length < 20) {
        alert('Reversal reason must be at least 20 characters long');
        return;
    }

    if (!confirm('Are you sure you want to reverse this transfer? This action will update both project and activity budgets.')) {
        return;
    }

    try {
        const response = await apiService.post(`/activities/budget-transfers/${transferId}/reverse`, { reason });

        if (response.success) {
            alert('Transfer reversed successfully');
            location.reload();
        }
    } catch (error) {
        console.error('Error reversing transfer:', error);
        alert('Error reversing transfer: ' + (error.message || 'Unknown error'));
    }
};

export default {
    renderBudgetTransferModal,
    renderTransferHistory
};
