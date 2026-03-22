/**
 * UI Components Library Module
 * 
 * Reusable UI components for consistent design across the AWYAD MES application.
 * All components return HTML strings for easy DOM insertion.
 * Uses Bootstrap 5.3.2 classes and structure.
 * 
 * @module components
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { formatCurrency, formatNumber, formatDate, getProgressColorClass, getBurnRateColorClass } from './utils.js';

/**
 * Create a summary card component for dashboard KPIs
 * 
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title text
 * @param {string|number} options.value - Main value to display
 * @param {string} [options.subtitle] - Optional subtitle text
 * @param {string} [options.bgColor='primary'] - Bootstrap color class (primary, success, info, warning, danger)
 * @param {string} [options.icon='info-circle'] - Bootstrap icon name (without 'bi-' prefix)
 * @returns {string} Bootstrap card HTML
 * 
 * @example
 * createSummaryCard({ title: 'Total Projects', value: 15, bgColor: 'success', icon: 'folder' })
 */
export function createSummaryCard({ title, value, subtitle, bgColor = 'primary', icon = 'info-circle' }) {
    return `
        <div class="col-md-3">
            <div class="card text-white bg-${bgColor} mb-3">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="bi bi-${icon}"></i> ${title}
                    </h6>
                    <h3 class="mb-0">${value}</h3>
                    ${subtitle ? `<small>${subtitle}</small>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Create a progress bar component with color-coded status
 * Clamps percentage between 0-100 for safety
 * 
 * @param {number} percentage - Progress percentage (0-100)
 * @param {boolean} [showLabel=true] - Whether to show percentage label
 * @returns {string} Bootstrap progress bar HTML
 * 
 * @example
 * createProgressBar(75, true) // Green progress bar at 75%
 * createProgressBar(120) // Clamped to 100%
 */
export function createProgressBar(percentage, showLabel = true) {
    const colorClass = getProgressColorClass(percentage);
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    
    return `
        <div class="progress" style="height: 25px;">
            <div class="progress-bar bg-${colorClass}" role="progressbar" 
                 style="width: ${safePercentage}%" 
                 aria-valuenow="${safePercentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
                ${showLabel ? `${safePercentage.toFixed(1)}%` : ''}
            </div>
        </div>
    `;
}

/**
 * Create a burn rate indicator showing budget utilization
 * Color-coded: green (low), yellow (medium), red (high)
 * 
 * @param {number} budget - Total budget amount
 * @param {number} expenditure - Current expenditure amount
 * @returns {string} Progress bar with expenditure/budget label
 * 
 * @example
 * createBurnRateIndicator(100000, 75000) // Shows 75% burn rate
 */
export function createBurnRateIndicator(budget, expenditure) {
    const burnRate = budget > 0 ? (expenditure / budget) * 100 : 0;
    const colorClass = getBurnRateColorClass(burnRate);
    
    return `
        <div>
            <div class="progress" style="height: 20px;">
                <div class="progress-bar bg-${colorClass}" role="progressbar" 
                     style="width: ${Math.min(burnRate, 100)}%">
                    ${burnRate.toFixed(1)}%
                </div>
            </div>
            <small class="text-muted">${formatCurrency(expenditure)} / ${formatCurrency(budget)}</small>
        </div>
    `;
}

/**
 * Create a colored status badge
 * Maps status text to Bootstrap color classes
 * 
 * @param {string} status - Status text (e.g., 'Active', 'Completed', 'Pending')
 * @returns {string} Bootstrap badge HTML with color
 * 
 * @example
 * createStatusBadge('Approved') // Green badge
 * createStatusBadge('Rejected') // Red badge
 */
export function createStatusBadge(status) {
    const statusMap = {
        'Active': 'success',
        'Completed': 'primary',
        'In Progress': 'warning',
        'Pending': 'warning',
        'Pending Review': 'warning',
        'Approved': 'success',
        'Rejected': 'danger',
        'Open': 'info',
        'Closed': 'secondary',
        'Not Started': 'secondary'
    };
    
    const color = statusMap[status] || 'secondary';
    return `<span class="badge bg-${color}">${status}</span>`;
}

/**
 * Create a simple badge with custom text and color
 * 
 * @param {Object} options - Badge configuration
 * @param {string} options.text - Badge text
 * @param {string} [options.className='bg-primary'] - Badge CSS class (e.g., 'bg-success', 'bg-info')
 * @returns {string} Bootstrap badge HTML
 * 
 * @example
 * createBadge({ text: 'Active', className: 'bg-success' })
 * createBadge({ text: 'Admin', className: 'bg-info' })
 */
export function createBadge({ text, className = 'bg-primary' }) {
    return `<span class="badge ${className}">${text}</span>`;
}

/**
 * Create a button component
 * 
 * @param {Object} options - Button configuration
 * @param {string} options.text - Button text/HTML content
 * @param {string} [options.className='btn-primary'] - Button CSS classes
 * @param {string} [options.id] - Optional button ID
 * @param {boolean} [options.disabled=false] - Whether button is disabled
 * @returns {string} Bootstrap button HTML
 * 
 * @example
 * createButton({ text: 'Save', className: 'btn-success', id: 'btn-save' })
 */
export function createButton({ text, className = 'btn-primary', id, disabled = false }) {
    return `
        <button type="button" class="btn ${className}" 
                ${id ? `id="${id}"` : ''} 
                ${disabled ? 'disabled' : ''}>
            ${text}
        </button>
    `;
}

/**
 * Create a table header row from column names
 * 
 * @param {Array<string>} columns - Array of column header names
 * @returns {string} HTML <thead> with column headers
 * 
 * @example
 * createTableHeader(['Name', 'Date', 'Status'])
 */
export function createTableHeader(columns) {
    const headers = columns.map(col => `<th>${col}</th>`).join('');
    return `
        <thead class="table-light">
            <tr>${headers}</tr>
        </thead>
    `;
}

/**
 * Create an empty state message with icon
 * Used when tables or lists have no data
 * 
 * @param {string} message - Message to display
 * @param {string} [icon='inbox'] - Bootstrap icon name
 * @returns {string} Centered empty state HTML
 * 
 * @example
 * createEmptyState('No activities found', 'calendar-x')
 */
export function createEmptyState(message, icon = 'inbox') {
    return `
        <div class="text-center py-5">
            <i class="bi bi-${icon}" style="font-size: 3rem; color: #ccc;"></i>
            <p class="text-muted mt-3">${message}</p>
        </div>
    `;
}

/**
 * Create a centered loading spinner
 * 
 * @param {string} [message='Loading...'] - Loading message text
 * @returns {string} Bootstrap spinner HTML
 * 
 * @example
 * createLoadingSpinner('Fetching data...')
 */
export function createLoadingSpinner(message = 'Loading...') {
    return `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 200px;">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">${message}</span>
                </div>
                <p class="text-muted mt-2">${message}</p>
            </div>
        </div>
    `;
}

/**
 * Create a dismissible error alert
 * 
 * @param {string} message - Error message text
 * @param {string|null} [onRetry=null] - Optional retry button onclick handler
 * @returns {string} Bootstrap danger alert HTML
 * 
 * @example
 * createErrorAlert('Failed to load data', 'retryLoad()')
 */
export function createErrorAlert(message, onRetry = null) {
    return `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Error:</strong> ${message}
            ${onRetry ? `<button type="button" class="btn btn-sm btn-outline-danger ms-3" onclick="${onRetry}">Retry</button>` : ''}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Create a dismissible success alert
 * 
 * @param {string} message - Success message text
 * @returns {string} Bootstrap success alert HTML
 * 
 * @example
 * createSuccessAlert('Data saved successfully!')
 */
export function createSuccessAlert(message) {
    return `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

/**
 * Create a page header with title and action buttons
 * 
 * @param {Object} options - Header configuration
 * @param {string} options.title - Page title
 * @param {string} [options.subtitle] - Optional subtitle
 * @param {string} [options.icon] - Optional icon name
 * @param {Array<Object>} [options.actions=[]] - Array of action button configs
 * @returns {string} Page header HTML
 * 
 * @example
 * createPageHeader({
 *   title: 'Projects',
 *   icon: 'folder',
 *   actions: [{ label: 'Add Project', icon: 'plus', onClick: 'openModal()', variant: 'primary' }]
 * })
 */
export function createPageHeader({ title, subtitle, icon, actions = [] }) {
    const actionButtons = actions.map(action => `
        <button class="btn btn-${action.variant || 'primary'}" onclick="${action.onClick}">
            ${action.icon ? `<i class="bi bi-${action.icon}"></i>` : ''} ${action.label}
        </button>
    `).join('');
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2>
                    ${icon ? `<i class="bi bi-${icon}"></i>` : ''} ${title}
                </h2>
                ${subtitle ? `<p class="text-muted">${subtitle}</p>` : ''}
            </div>
            ${actions.length > 0 ? `<div class="d-flex gap-2">${actionButtons}</div>` : ''}
        </div>
    `;
}

/**
 * Create a Bootstrap card component
 * 
 * @param {Object} options - Card configuration
 * @param {string} [options.title] - Card header title
 * @param {string} [options.subtitle] - Card header subtitle
 * @param {string} options.body - Card body HTML content
 * @param {string} [options.footer] - Card footer HTML content
 * @param {string} [options.headerClass='bg-light'] - Header CSS class
 * @returns {string} Bootstrap card HTML
 * 
 * @example
 * createCard({ title: 'Summary', body: '<p>Content here</p>' })
 */
export function createCard({ title, subtitle, body, footer, headerClass = 'bg-light' }) {
    return `
        <div class="card mb-4">
            ${title ? `
                <div class="card-header ${headerClass}">
                    <h5 class="mb-0">${title}</h5>
                    ${subtitle ? `<small class="text-muted">${subtitle}</small>` : ''}
                </div>
            ` : ''}
            <div class="card-body">
                ${body}
            </div>
            ${footer ? `
                <div class="card-footer">
                    ${footer}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Create a Bootstrap modal dialog
 * 
 * @param {Object} options - Modal configuration
 * @param {string} options.id - Modal element ID
 * @param {string} options.title - Modal header title
 * @param {string} options.body - Modal body HTML content
 * @param {string} [options.footer] - Modal footer HTML content
 * @param {string} [options.size=''] - Modal size: '', 'sm', 'lg', 'xl'
 * @returns {string} Bootstrap modal HTML
 * 
 * @example
 * createModal({ id: 'editModal', title: 'Edit Project', body: formHTML, size: 'lg' })
 */
export function createModal({ id, title, body, footer, size = '' }) {
    return `
        <div class="modal fade" id="${id}" tabindex="-1">
            <div class="modal-dialog ${size ? `modal-${size}` : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${body}
                    </div>
                    ${footer ? `
                        <div class="modal-footer">
                            ${footer}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Create an action button
 * 
 * @param {Object} options - Button configuration
 * @param {string} options.label - Button text
 * @param {string} [options.icon] - Bootstrap icon name
 * @param {string} [options.variant='primary'] - Bootstrap color variant
 * @param {string} [options.size='sm'] - Button size: 'sm', 'md', 'lg'
 * @param {string} options.onClick - onclick handler code
 * @param {boolean} [options.disabled=false] - Whether button is disabled
 * @returns {string} Bootstrap button HTML
 * 
 * @example
 * createActionButton({ label: 'Delete', icon: 'trash', variant: 'danger', onClick: 'deleteItem(1)' })
 */
export function createActionButton({ label, icon, variant = 'primary', size = 'sm', onClick, disabled = false }) {
    return `
        <button class="btn btn-${variant} btn-${size}" 
                onclick="${onClick}" 
                ${disabled ? 'disabled' : ''}>
            ${icon ? `<i class="bi bi-${icon}"></i>` : ''} ${label}
        </button>
    `;
}

/**
 * Create a beneficiary disaggregation table with age/gender breakdown
 * Shows refugee and host community data side-by-side
 * 
 * @param {Object} disagg - Disaggregation object from extractDisaggregation()
 * @param {Object} totals - Totals object from calculateDisaggregationTotals()
 * @returns {string} HTML for two-column disaggregation table
 * 
 * @example
 * const html = createDisaggregationTable(activity.disaggregation, activity.totals);
 */
export function createDisaggregationTable(disagg, totals) {
    return `
        <div class="row">
            <div class="col-md-6">
                <h6>Refugee Beneficiaries</h6>
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Age Group</th>
                            <th>Male</th>
                            <th>Female</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>0-4 yrs</td>
                            <td>${formatNumber(disagg.refugee.male.age0to4)}</td>
                            <td>${formatNumber(disagg.refugee.female.age0to4)}</td>
                            <td><strong>${formatNumber(disagg.refugee.male.age0to4 + disagg.refugee.female.age0to4)}</strong></td>
                        </tr>
                        <tr>
                            <td>5-17 yrs</td>
                            <td>${formatNumber(disagg.refugee.male.age5to17)}</td>
                            <td>${formatNumber(disagg.refugee.female.age5to17)}</td>
                            <td><strong>${formatNumber(disagg.refugee.male.age5to17 + disagg.refugee.female.age5to17)}</strong></td>
                        </tr>
                        <tr>
                            <td>18-49 yrs</td>
                            <td>${formatNumber(disagg.refugee.male.age18to49)}</td>
                            <td>${formatNumber(disagg.refugee.female.age18to49)}</td>
                            <td><strong>${formatNumber(disagg.refugee.male.age18to49 + disagg.refugee.female.age18to49)}</strong></td>
                        </tr>
                        <tr>
                            <td>50+ yrs</td>
                            <td>${formatNumber(disagg.refugee.male.age50plus)}</td>
                            <td>${formatNumber(disagg.refugee.female.age50plus)}</td>
                            <td><strong>${formatNumber(disagg.refugee.male.age50plus + disagg.refugee.female.age50plus)}</strong></td>
                        </tr>
                        <tr class="table-primary">
                            <td><strong>Total</strong></td>
                            <td><strong>${formatNumber(totals.refugeeMale)}</strong></td>
                            <td><strong>${formatNumber(totals.refugeeFemale)}</strong></td>
                            <td><strong>${formatNumber(totals.refugeeTotal)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Host Community</h6>
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Age Group</th>
                            <th>Male</th>
                            <th>Female</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>0-4 yrs</td>
                            <td>${formatNumber(disagg.host.male.age0to4)}</td>
                            <td>${formatNumber(disagg.host.female.age0to4)}</td>
                            <td><strong>${formatNumber(disagg.host.male.age0to4 + disagg.host.female.age0to4)}</strong></td>
                        </tr>
                        <tr>
                            <td>5-17 yrs</td>
                            <td>${formatNumber(disagg.host.male.age5to17)}</td>
                            <td>${formatNumber(disagg.host.female.age5to17)}</td>
                            <td><strong>${formatNumber(disagg.host.male.age5to17 + disagg.host.female.age5to17)}</strong></td>
                        </tr>
                        <tr>
                            <td>18-49 yrs</td>
                            <td>${formatNumber(disagg.host.male.age18to49)}</td>
                            <td>${formatNumber(disagg.host.female.age18to49)}</td>
                            <td><strong>${formatNumber(disagg.host.male.age18to49 + disagg.host.female.age18to49)}</strong></td>
                        </tr>
                        <tr>
                            <td>50+ yrs</td>
                            <td>${formatNumber(disagg.host.male.age50plus)}</td>
                            <td>${formatNumber(disagg.host.female.age50plus)}</td>
                            <td><strong>${formatNumber(disagg.host.male.age50plus + disagg.host.female.age50plus)}</strong></td>
                        </tr>
                        <tr class="table-primary">
                            <td><strong>Total</strong></td>
                            <td><strong>${formatNumber(totals.hostMale)}</strong></td>
                            <td><strong>${formatNumber(totals.hostFemale)}</strong></td>
                            <td><strong>${formatNumber(totals.hostTotal)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Show a notification toast message
 * 
 * @param {string} message - Notification message
 * @param {string} [type='info'] - Notification type (success, danger, warning, info)
 * @param {number} [duration=5000] - Auto-hide duration in milliseconds
 * 
 * @example
 * showNotification('User created successfully', 'success')
 * showNotification('An error occurred', 'danger', 8000)
 */
export function showNotification(message, type = 'info', duration = 5000) {
    // Remove any existing notification
    const existing = document.getElementById('notification-toast');
    if (existing) {
        existing.remove();
    }

    // Map type to Bootstrap alert color
    const colorMap = {
        success: 'success',
        danger: 'danger',
        warning: 'warning',
        info: 'info'
    };
    const bgClass = `bg-${colorMap[type] || 'info'}`;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.className = 'toast align-items-center text-white border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex ${bgClass}">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    
    bsToast.show();
    
    // Remove from DOM after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

/**
 * Create pagination component
 * 
 * @param {Object} pagination - Pagination data
 * @param {number} pagination.page - Current page
 * @param {number} pagination.totalPages - Total pages
 * @param {number} pagination.totalCount - Total items
 * @returns {string} HTML string for pagination
 */
export function createPagination(pagination) {
    if (!pagination || pagination.totalPages <= 1) {
        return '';
    }

    const { page, totalPages } = pagination;
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let html = '<nav><ul class="pagination mb-0">';

    // Previous button
    html += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page - 1}" ${page === 1 ? 'tabindex="-1"' : ''}>
                Previous
            </a>
        </li>
    `;

    // First page
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    // Next button
    html += `
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page + 1}" ${page === totalPages ? 'tabindex="-1"' : ''}>
                Next
            </a>
        </li>
    `;

    html += '</ul></nav>';
    return html;
}
