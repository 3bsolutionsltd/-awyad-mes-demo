/**
 * Audit Logs Module
 * 
 * Provides admin interface for viewing and filtering system audit logs.
 * Shows user actions, data changes, and security events.
 * 
 * @module renderAuditLogs
 */

import { apiService } from './apiService.js';
import { createCard, createPagination } from './components.js';
import { stateManager } from './stateManager.js';
import { escapeHtml } from './security.js';

/**
 * Main render function for audit logs page
 */
export async function renderAuditLogs() {
    const contentArea = document.getElementById('content-area');
    
    try {
        // Show loading state
        contentArea.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // Fetch audit logs, stats, actions, and resources
        const [logsResponse, statsResponse, actionsResponse, resourcesResponse] = await Promise.all([
            apiService.get('/audit-logs', { page: 1, limit: 50 }),
            apiService.get('/audit-logs/stats'),
            apiService.get('/audit-logs/actions'),
            apiService.get('/audit-logs/resources')
        ]);

        const logs = logsResponse.data.logs;
        const pagination = logsResponse.data.pagination;
        const stats = statsResponse.data;
        const actions = actionsResponse.data.actions;
        const resources = resourcesResponse.data.resources;

        // Store in state
        stateManager.setState({ auditLogs: logs, auditActions: actions, auditResources: resources });

        // Render page
        contentArea.innerHTML = `
            <div class="container-fluid">
                <!-- Page Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2><i class="bi bi-clock-history"></i> Audit Logs</h2>
                                <p class="text-muted mb-0">Review system activity and user actions</p>
                            </div>
                            <div>
                                <button class="btn btn-outline-primary" id="btn-export-logs">
                                    <i class="bi bi-download"></i> Export Logs
                                </button>
                                <button class="btn btn-outline-secondary" id="btn-refresh-logs">
                                    <i class="bi bi-arrow-clockwise"></i> Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Total Events',
                            value: stats.total.toLocaleString(),
                            icon: 'list-check',
                            color: 'primary'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Top Action',
                            value: stats.byAction[0]?.action || 'N/A',
                            icon: 'activity',
                            color: 'info'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Active Users',
                            value: stats.topUsers.length.toLocaleString(),
                            icon: 'people',
                            color: 'success'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Resources Tracked',
                            value: stats.byResource.length.toLocaleString(),
                            icon: 'database',
                            color: 'warning'
                        })}
                    </div>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label">Action Type</label>
                                <select class="form-select" id="filter-action">
                                    <option value="">All Actions</option>
                                    ${actions.map(action => `
                                        <option value="${action}">${formatAction(action)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Resource Type</label>
                                <select class="form-select" id="filter-resource">
                                    <option value="">All Resources</option>
                                    ${resources.map(resource => `
                                        <option value="${resource}">${formatResource(resource)}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="filter-start-date">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" id="filter-end-date">
                            </div>
                            <div class="col-md-2">
                                <div class="d-flex align-items-end h-100">
                                    <button class="btn btn-primary w-100" id="btn-apply-filters">
                                        <i class="bi bi-funnel"></i> Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Audit Logs Table -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Activity Log</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th width="15%">Timestamp</th>
                                        <th width="15%">User</th>
                                        <th width="15%">Action</th>
                                        <th width="12%">Resource</th>
                                        <th width="15%">IP Address</th>
                                        <th width="28%">Details</th>
                                    </tr>
                                </thead>
                                <tbody id="audit-logs-table-body">
                                    ${renderAuditLogsTableRows(logs)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${createPagination(pagination)}
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error rendering audit logs:', error);
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-exclamation-triangle"></i> Error Loading Audit Logs</h4>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Render table rows for audit logs
 */
function renderAuditLogsTableRows(logs) {
    if (!logs || logs.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                    No audit logs found
                </td>
            </tr>
        `;
    }

    return logs.map(log => {
        const userName = log.user_email 
            ? `${log.user_first_name} ${log.user_last_name} (${log.user_email})`
            : 'System';
        
        const timestamp = new Date(log.created_at).toLocaleString();
        const actionBadge = getActionBadge(log.action);
        const resourceBadge = getResourceBadge(log.resource);
        const details = formatLogDetails(log);

        return `
            <tr data-log-id="${log.id}" class="audit-log-row" style="cursor: pointer;">
                <td><small>${timestamp}</small></td>
                <td>
                    <small class="text-muted">${escapeHtml(userName)}</small>
                </td>
                <td>${actionBadge}</td>
                <td>${resourceBadge}</td>
                <td><small><code>${log.ip_address || 'N/A'}</code></small></td>
                <td><small class="text-muted">${details}</small></td>
            </tr>
        `;
    }).join('');
}

/**
 * Get badge HTML for action type
 */
function getActionBadge(action) {
    const actionMap = {
        login: { class: 'bg-success', icon: 'box-arrow-in-right' },
        logout: { class: 'bg-secondary', icon: 'box-arrow-right' },
        login_failed: { class: 'bg-danger', icon: 'x-circle' },
        user_created: { class: 'bg-primary', icon: 'person-plus' },
        user_updated: { class: 'bg-info', icon: 'person-check' },
        user_deleted: { class: 'bg-danger', icon: 'person-dash' },
        password_changed: { class: 'bg-warning', icon: 'key' },
        password_reset: { class: 'bg-warning', icon: 'shield-exclamation' },
        role_assigned: { class: 'bg-info', icon: 'shield-check' },
        role_removed: { class: 'bg-warning', icon: 'shield-x' },
    };

    const config = actionMap[action] || { class: 'bg-secondary', icon: 'circle' };
    return `<span class="badge ${config.class}"><i class="bi bi-${config.icon} me-1"></i>${formatAction(action)}</span>`;
}

/**
 * Get badge HTML for resource type
 */
function getResourceBadge(resource) {
    const resourceMap = {
        authentication: { class: 'bg-primary', icon: 'shield-lock' },
        user: { class: 'bg-info', icon: 'person' },
        role: { class: 'bg-success', icon: 'shield-check' },
        project: { class: 'bg-warning', icon: 'folder' },
        activity: { class: 'bg-secondary', icon: 'list-task' },
        case: { class: 'bg-danger', icon: 'briefcase' },
    };

    const config = resourceMap[resource] || { class: 'bg-secondary', icon: 'circle' };
    return `<span class="badge ${config.class}"><i class="bi bi-${config.icon} me-1"></i>${formatResource(resource)}</span>`;
}

/**
 * Format action name for display
 */
function formatAction(action) {
    return action.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Format resource name for display
 */
function formatResource(resource) {
    return resource.charAt(0).toUpperCase() + resource.slice(1);
}

/**
 * Format log details for display
 */
function formatLogDetails(log) {
    const parts = [];
    
    if (log.resource_id) {
        parts.push(`ID: ${log.resource_id.substring(0, 8)}...`);
    }
    
    if (log.new_values) {
        try {
            const values = typeof log.new_values === 'string' 
                ? JSON.parse(log.new_values) 
                : log.new_values;
            const keys = Object.keys(values).slice(0, 2);
            if (keys.length > 0) {
                parts.push(`Changed: ${keys.join(', ')}`);
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'No additional details';
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Apply filters button
    document.getElementById('btn-apply-filters')?.addEventListener('click', applyFilters);
    
    // Refresh button
    document.getElementById('btn-refresh-logs')?.addEventListener('click', () => {
        renderAuditLogs();
    });
    
    // Export button
    document.getElementById('btn-export-logs')?.addEventListener('click', exportLogs);
    
    // Row click for details modal
    document.querySelectorAll('.audit-log-row').forEach(row => {
        row.addEventListener('click', (e) => {
            const logId = e.currentTarget.dataset.logId;
            showLogDetailsModal(logId);
        });
    });
    
    // Pagination links
    document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            loadAuditLogs(page);
        });
    });
}

/**
 * Apply filters to audit logs
 */
async function applyFilters() {
    const action = document.getElementById('filter-action').value;
    const resource = document.getElementById('filter-resource').value;
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    
    const params = { page: 1, limit: 50 };
    if (action) params.action = action;
    if (resource) params.resource = resource;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    try {
        const response = await apiService.get('/audit-logs', params);
        const logs = response.data.logs;
        const pagination = response.data.pagination;
        
        // Update table
        document.getElementById('audit-logs-table-body').innerHTML = renderAuditLogsTableRows(logs);
        
        // Update pagination
        document.querySelector('.card-footer').innerHTML = createPagination(pagination);
        
        // Re-attach event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        alert('Failed to apply filters: ' + error.message);
    }
}

/**
 * Load audit logs for a specific page
 */
async function loadAuditLogs(page) {
    try {
        const response = await apiService.get('/audit-logs', { page, limit: 50 });
        const logs = response.data.logs;
        const pagination = response.data.pagination;
        
        // Update table
        document.getElementById('audit-logs-table-body').innerHTML = renderAuditLogsTableRows(logs);
        
        // Update pagination
        document.querySelector('.card-footer').innerHTML = createPagination(pagination);
        
        // Re-attach event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        alert('Failed to load logs: ' + error.message);
    }
}

/**
 * Show log details in modal
 */
function showLogDetailsModal(logId) {
    const logs = stateManager.getState().auditLogs || [];
    const log = logs.find(l => l.id === logId);
    
    if (!log) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'logDetailsModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-info-circle me-2"></i>Audit Log Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <dl class="row">
                        <dt class="col-sm-3">Timestamp</dt>
                        <dd class="col-sm-9">${new Date(log.created_at).toLocaleString()}</dd>
                        
                        <dt class="col-sm-3">User</dt>
                        <dd class="col-sm-9">${log.user_email || 'System'}</dd>
                        
                        <dt class="col-sm-3">Action</dt>
                        <dd class="col-sm-9">${getActionBadge(log.action)}</dd>
                        
                        <dt class="col-sm-3">Resource</dt>
                        <dd class="col-sm-9">${getResourceBadge(log.resource)}</dd>
                        
                        <dt class="col-sm-3">Resource ID</dt>
                        <dd class="col-sm-9"><code>${log.resource_id || 'N/A'}</code></dd>
                        
                        <dt class="col-sm-3">IP Address</dt>
                        <dd class="col-sm-9"><code>${log.ip_address || 'N/A'}</code></dd>
                        
                        <dt class="col-sm-3">User Agent</dt>
                        <dd class="col-sm-9"><small>${log.user_agent || 'N/A'}</small></dd>
                        
                        ${log.old_values ? `
                            <dt class="col-sm-3">Old Values</dt>
                            <dd class="col-sm-9">
                                <pre class="bg-light p-2 rounded"><code>${JSON.stringify(JSON.parse(log.old_values), null, 2)}</code></pre>
                            </dd>
                        ` : ''}
                        
                        ${log.new_values ? `
                            <dt class="col-sm-3">New Values</dt>
                            <dd class="col-sm-9">
                                <pre class="bg-light p-2 rounded"><code>${JSON.stringify(JSON.parse(log.new_values), null, 2)}</code></pre>
                            </dd>
                        ` : ''}
                    </dl>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Cleanup on modal hide
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

/**
 * Export audit logs to CSV
 */
async function exportLogs() {
    try {
        const logs = stateManager.getState().auditLogs || [];
        
        if (logs.length === 0) {
            alert('No logs to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address'];
        const rows = logs.map(log => [
            new Date(log.created_at).toISOString(),
            log.user_email || 'System',
            log.action,
            log.resource,
            log.resource_id || '',
            log.ip_address || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting logs:', error);
        alert('Failed to export logs: ' + error.message);
    }
}
