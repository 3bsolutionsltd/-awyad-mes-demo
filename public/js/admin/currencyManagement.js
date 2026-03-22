/**
 * Currency Management Admin Interface
 * 
 * Features:
 * - View all exchange rates
 * - Add/Update exchange rates
 * - View rate history
 * - Rate trend charts
 * - Manual rate entry
 */

import { formatCurrency, formatExchangeRate, SUPPORTED_CURRENCIES } from '../utils/currencyUtils.js';
import apiService from '../apiService.js';

/**
 * Render currency management page
 */
export async function renderCurrencyManagement() {
    const container = document.getElementById('currency-management-container');
    
    if (!container) {
        console.error('Currency management container not found');
        return;
    }

    const html = `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <h2><i class="fas fa-money-bill-wave"></i> Currency Management</h2>
                        <button class="btn btn-primary" onclick="openAddRateModal()">
                            <i class="fas fa-plus"></i> Add Exchange Rate
                        </button>
                    </div>
                </div>
            </div>

            <!-- Supported Currencies Info -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h6><i class="fas fa-info-circle"></i> Supported Currencies</h6>
                        <p class="mb-0">
                            <strong>Base Currency:</strong> UGX (Ugandan Shilling)<br>
                            <strong>Supported:</strong> ${SUPPORTED_CURRENCIES.join(', ')}<br>
                            <small class="text-muted">All financial reports can be displayed in any supported currency</small>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Current Exchange Rates -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Current Exchange Rates</h5>
                        </div>
                        <div class="card-body">
                            <div id="rates-table-container">
                                <div class="text-center">
                                    <div class="spinner-border text-primary"></div>
                                    <p class="text-muted mt-2">Loading exchange rates...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Rate History -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Exchange Rate History</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="history-from-currency" class="form-label">From Currency</label>
                                    <select class="form-select" id="history-from-currency">
                                        ${SUPPORTED_CURRENCIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="history-to-currency" class="form-label">To Currency</label>
                                    <select class="form-select" id="history-to-currency">
                                        ${SUPPORTED_CURRENCIES.map(c => `<option value="${c}" ${c === 'UGX' ? 'selected' : ''}>${c}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">&nbsp;</label>
                                    <button class="btn btn-primary w-100" onclick="loadRateHistory()">
                                        <i class="fas fa-search"></i> Load History
                                    </button>
                                </div>
                            </div>
                            <div id="rate-history-container">
                                <p class="text-muted text-center">Select currency pair and click "Load History"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Update Rate Modal -->
        <div class="modal fade" id="addRateModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add/Update Exchange Rate</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-rate-form">
                            <div class="mb-3">
                                <label for="from-currency" class="form-label">From Currency <span class="text-danger">*</span></label>
                                <select class="form-select" id="from-currency" required>
                                    ${SUPPORTED_CURRENCIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="to-currency" class="form-label">To Currency <span class="text-danger">*</span></label>
                                <select class="form-select" id="to-currency" required>
                                    ${SUPPORTED_CURRENCIES.map(c => `<option value="${c}" ${c === 'UGX' ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="exchange-rate" class="form-label">Exchange Rate <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="exchange-rate" 
                                       step="0.0001" min="0" required 
                                       placeholder="e.g., 3700.5000">
                                <small class="text-muted">Enter the rate: 1 FROM currency = X TO currency</small>
                            </div>

                            <div class="mb-3">
                                <label for="effective-date" class="form-label">Effective Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="effective-date" required>
                            </div>

                            <div class="mb-3">
                                <label for="rate-source" class="form-label">Source</label>
                                <select class="form-select" id="rate-source">
                                    <option value="manual">Manual Entry</option>
                                    <option value="official">Official Rate</option>
                                    <option value="api">API Source</option>
                                </select>
                            </div>

                            <div id="rate-preview" class="alert alert-secondary" style="display: none;">
                                <strong>Preview:</strong> <span id="rate-preview-text"></span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitExchangeRate()">
                            <i class="fas fa-save"></i> Save Rate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Load initial data
    await loadCurrentRates();
    initializeRateFormPreview();
}

/**
 * Load current exchange rates
 */
async function loadCurrentRates() {
    try {
        const response = await apiService.get('/activities/currency-rates');
        
        if (!response.success) {
            throw new Error('Failed to load rates');
        }

        const rates = response.data.rates || [];
        
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Rate</th>
                            <th>Effective Date</th>
                            <th>Source</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (rates.length === 0) {
            tableHTML += '<tr><td colspan="6" class="text-center text-muted">No exchange rates defined</td></tr>';
        } else {
            rates.forEach(rate => {
                tableHTML += `
                    <tr>
                        <td><span class="badge bg-primary">${rate.from_currency}</span></td>
                        <td><span class="badge bg-info">${rate.to_currency}</span></td>
                        <td><strong>${parseFloat(rate.rate).toFixed(4)}</strong></td>
                        <td>${new Date(rate.effective_date).toLocaleDateString()}</td>
                        <td><span class="badge bg-secondary">${rate.source}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="viewRateHistory('${rate.from_currency}', '${rate.to_currency}')">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" 
                                    onclick="updateRate('${rate.from_currency}', '${rate.to_currency}', ${rate.rate})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('rates-table-container').innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading rates:', error);
        document.getElementById('rates-table-container').innerHTML = 
            '<div class="alert alert-danger">Error loading exchange rates</div>';
    }
}

/**
 * Initialize rate form preview
 */
function initializeRateFormPreview() {
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const rateInput = document.getElementById('exchange-rate');

    if (!fromCurrency || !toCurrency || !rateInput) return;

    const updatePreview = () => {
        const from = fromCurrency.value;
        const to = toCurrency.value;
        const rate = parseFloat(rateInput.value);

        if (from && to && rate > 0) {
            const preview = formatExchangeRate(rate, from, to);
            document.getElementById('rate-preview-text').textContent = preview;
            document.getElementById('rate-preview').style.display = 'block';
        } else {
            document.getElementById('rate-preview').style.display = 'none';
        }
    };

    fromCurrency.addEventListener('change', updatePreview);
    toCurrency.addEventListener('change', updatePreview);
    rateInput.addEventListener('input', updatePreview);
}

/**
 * Open add rate modal
 */
window.openAddRateModal = function() {
    // Reset form
    document.getElementById('add-rate-form').reset();
    
    // Set today as default effective date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('effective-date').value = today;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addRateModal'));
    modal.show();
};

/**
 * Update existing rate
 */
window.updateRate = function(fromCurrency, toCurrency, currentRate) {
    // Populate form
    document.getElementById('from-currency').value = fromCurrency;
    document.getElementById('to-currency').value = toCurrency;
    document.getElementById('exchange-rate').value = currentRate;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('effective-date').value = today;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addRateModal'));
    modal.show();
};

/**
 * Submit exchange rate
 */
window.submitExchangeRate = async function() {
    const form = document.getElementById('add-rate-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        fromCurrency: document.getElementById('from-currency').value,
        toCurrency: document.getElementById('to-currency').value,
        rate: parseFloat(document.getElementById('exchange-rate').value),
        effectiveDate: document.getElementById('effective-date').value,
        source: document.getElementById('rate-source').value
    };

    if (data.fromCurrency === data.toCurrency) {
        alert('From and To currencies must be different');
        return;
    }

    try {
        const response = await apiService.post('/activities/currency-rates', data);

        if (response.success) {
            alert('Exchange rate saved successfully');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addRateModal'));
            modal.hide();
            
            // Reload rates table
            await loadCurrentRates();
        }
    } catch (error) {
        console.error('Error saving rate:', error);
        alert('Error saving exchange rate: ' + (error.message || 'Unknown error'));
    }
};

/**
 * Load rate history for currency pair
 */
window.loadRateHistory = async function() {
    const fromCurrency = document.getElementById('history-from-currency').value;
    const toCurrency = document.getElementById('history-to-currency').value;
    const container = document.getElementById('rate-history-container');

    if (fromCurrency === toCurrency) {
        container.innerHTML = '<div class="alert alert-warning">Please select different currencies</div>';
        return;
    }

    container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';

    try {
        // Get history for last 12 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);

        const response = await apiService.get(
            `/activities/currency-rates/${fromCurrency}/${toCurrency}/history?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (!response.success) {
            throw new Error('Failed to load history');
        }

        const history = response.data.history || [];

        if (history.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No history available for this currency pair</div>';
            return;
        }

        let historyHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>Effective Date</th>
                            <th>Rate</th>
                            <th>Source</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        history.forEach(rate => {
            historyHTML += `
                <tr>
                    <td>${new Date(rate.effective_date).toLocaleDateString()}</td>
                    <td><strong>${parseFloat(rate.rate).toFixed(4)}</strong></td>
                    <td><span class="badge bg-secondary">${rate.source}</span></td>
                    <td><small class="text-muted">${new Date(rate.created_at).toLocaleString()}</small></td>
                </tr>
            `;
        });

        historyHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Add simple chart
        historyHTML += renderRateChart(history, fromCurrency, toCurrency);

        container.innerHTML = historyHTML;
    } catch (error) {
        console.error('Error loading rate history:', error);
        container.innerHTML = '<div class="alert alert-danger">Error loading rate history</div>';
    }
};

/**
 * Render simple rate trend chart
 */
function renderRateChart(history, fromCurrency, toCurrency) {
    // Reverse for chronological order
    const data = [...history].reverse();
    
    const dates = data.map(r => new Date(r.effective_date).toLocaleDateString());
    const rates = data.map(r => parseFloat(r.rate));

    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const range = maxRate - minRate;

    // Create simple ASCII-style chart
    let chartHTML = `
        <div class="mt-4">
            <h6>Rate Trend: ${fromCurrency} → ${toCurrency}</h6>
            <div class="p-3 bg-light border rounded">
                <div style="position: relative; height: 200px;">
    `;

    // Plot points
    data.forEach((rate, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = ((parseFloat(rate.rate) - minRate) / range) * 100;
        
        chartHTML += `
            <div style="position: absolute; 
                        left: ${x}%; 
                        bottom: ${y}%; 
                        width: 8px; 
                        height: 8px; 
                        background: #0d6efd; 
                        border-radius: 50%;"
                 title="${new Date(rate.effective_date).toLocaleDateString()}: ${parseFloat(rate.rate).toFixed(4)}">
            </div>
        `;
    });

    chartHTML += `
                </div>
                <div class="d-flex justify-content-between text-muted small mt-2">
                    <span>${dates[0]}</span>
                    <span>${dates[dates.length - 1]}</span>
                </div>
                <div class="text-center mt-2">
                    <small class="text-muted">Min: ${minRate.toFixed(4)} | Max: ${maxRate.toFixed(4)}</small>
                </div>
            </div>
        </div>
    `;

    return chartHTML;
}

/**
 * View rate history (from table)
 */
window.viewRateHistory = function(fromCurrency, toCurrency) {
    document.getElementById('history-from-currency').value = fromCurrency;
    document.getElementById('history-to-currency').value = toCurrency;
    
    loadRateHistory();
    
    // Scroll to history section
    document.getElementById('rate-history-container').scrollIntoView({ behavior: 'smooth' });
};

export default {
    renderCurrencyManagement
};
