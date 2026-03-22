/**
 * Cases Module
 * 
 * Displays case management with active/closed tabs, follow-up tracking, and beneficiary details.
 * Tracks case duration, services provided, and follow-up schedules.
 * Supports filtering by status and highlighting urgent follow-ups.
 * 
 * @module cases
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import { transformCases } from './dataTransformer.js';
import {
    createPageHeader,
    createSummaryCard,
    createCard,
    createLoadingSpinner,
    createErrorAlert,
    createEmptyState,
    createStatusBadge
} from './components.js';
import { formatDate, formatNumber } from './utils.js';
import { exportCasesWithNotification } from './exportUtils.js';

/**
 * Render cases page with active/closed tabs and follow-up tracking
 * Separates active cases from closed cases for better workflow management
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {Promise<void>}
 * \n * @example
 * await renderCases(document.getElementById('content-area'));
 */
export async function renderCases(contentArea) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading cases...');

        // Fetch cases data - with high limit to show all cases
        const casesRes = await apiService.get('/cases?limit=1000');

        // Transform data
        const cases = transformCases(casesRes.data?.cases || casesRes.data || []);
        
        // Store cases for export
        window.currentCasesData = cases;

        // Separate active and closed cases
        const activeCases = cases.filter(c => c.status === 'Active' || c.status === 'Open');
        const closedCases = cases.filter(c => c.status === 'Closed');

        // Calculate summary metrics
        const totalCases = cases.length;
        const activeLoad = activeCases.length;
        const closedCount = closedCases.length;
        const closureRate = totalCases > 0 ? ((closedCount / totalCases) * 100).toFixed(1) : 0;

        // Calculate follow-up alerts
        const needsFollowUp = activeCases.filter(c => c.needsFollowUp).length;

        // Create header
        const header = createPageHeader({
            title: 'Case Management',
            subtitle: 'Track and manage individual cases with follow-up monitoring',
            icon: 'briefcase',
            actions: [
                {
                    label: 'New Case',
                    icon: 'plus-circle',
                    variant: 'primary',
                    onClick: 'window.createCase()'
                },
                {
                    label: 'Export',
                    icon: 'download',
                    variant: 'outline-secondary',
                    onClick: 'window.exportCases()'
                }
            ]
        });

        // Create summary cards
        const summaryCards = `
            <div class="row mb-4">
                ${createSummaryCard({
                    title: 'Active Load',
                    value: activeLoad,
                    subtitle: needsFollowUp > 0 ? `${needsFollowUp} need follow-up` : 'No follow-ups needed',
                    bgColor: needsFollowUp > 0 ? 'warning' : 'success',
                    icon: 'folder-open'
                })}
                ${createSummaryCard({
                    title: 'Closed Cases',
                    value: closedCount,
                    subtitle: `${closureRate}% closure rate`,
                    bgColor: 'info',
                    icon: 'folder-check'
                })}
                ${createSummaryCard({
                    title: 'Total Cases',
                    value: totalCases,
                    subtitle: 'All time',
                    bgColor: 'primary',
                    icon: 'briefcase'
                })}
                ${createSummaryCard({
                    title: 'Needs Follow-Up',
                    value: needsFollowUp,
                    subtitle: activeLoad > 0 ? `${(needsFollowUp/activeLoad*100).toFixed(0)}% of active` : 'N/A',
                    bgColor: needsFollowUp > 0 ? 'danger' : 'success',
                    icon: 'alarm'
                })}
            </div>
        `;

        // Create active cases table
        const activeCasesTable = createActiveCasesTable(activeCases);

        // Create closed cases table
        const closedCasesTable = createClosedCasesTable(closedCases);

        // Create case statistics
        const caseStatistics = createCaseStatistics(cases);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${summaryCards}
            ${createCard({
                title: 'Active Cases',
                subtitle: `${activeLoad} case(s) currently active${needsFollowUp > 0 ? ' | ' + needsFollowUp + ' need follow-up' : ''}`,
                body: activeCasesTable
            })}
            ${createCard({
                title: 'Closed Cases',
                subtitle: `${closedCount} case(s) closed`,
                body: closedCasesTable
            })}
            ${createCard({
                title: 'Case Statistics',
                subtitle: 'Breakdown by case type and services',
                body: caseStatistics
            })}
        `;

        // Attach event listeners to action buttons
        contentArea.querySelectorAll('.view-case-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const caseId = btn.dataset.caseId;
                window.viewCase(caseId);
            });
        });

        contentArea.querySelectorAll('.edit-case-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const caseId = btn.dataset.caseId;
                window.editCase(caseId);
            });
        });

        contentArea.querySelectorAll('.close-case-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const caseId = btn.dataset.caseId;
                window.closeCase(caseId);
            });
        });

    } catch (error) {
        console.error('Cases error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load cases',
            () => renderCases(contentArea)
        );
    }
}

/**
 * Create active cases table
 * @param {Array} activeCases - Array of active cases
 * @returns {string} HTML string
 */
function createActiveCasesTable(activeCases) {
    if (!activeCases || activeCases.length === 0) {
        return createEmptyState('No active cases', 'folder-open');
    }

    const rows = activeCases.map(caseItem => {
        const statusBadge = createStatusBadge(caseItem.status || 'Unknown');
        const followUpAlert = caseItem.needsFollowUp 
            ? '<span class="badge bg-danger"><i class="bi bi-alarm"></i> Follow-up needed</span>'
            : '<span class="badge bg-success"><i class="bi bi-check"></i> On track</span>';
        
        const servicesList = Array.isArray(caseItem.services) 
            ? caseItem.services.join(', ') 
            : (caseItem.services || 'N/A');

        return `
            <tr ${caseItem.needsFollowUp ? 'class="table-warning"' : ''}>
                <td><small class="text-muted">${caseItem.caseNumber || caseItem.case_number || caseItem.id || 'N/A'}</small></td>
                <td><strong>${caseItem.location || 'N/A'}</strong></td>
                <td>${caseItem.caseType || caseItem.case_type || 'N/A'}</td>
                <td><small>${caseItem.servicesProvided || caseItem.service_provided || 'N/A'}</small></td>
                <td>${statusBadge}</td>
                <td><small>${formatDate(caseItem.dateReported || caseItem.date_reported)}</small></td>
                <td><small>${formatDate(caseItem.followUpDate || caseItem.follow_up_date)}</small></td>
                <td class="text-center">${formatNumber(caseItem.duration || caseItem.durationDays || 0)} days</td>
                <td class="text-center">${followUpAlert}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-case-btn" data-case-id="${caseItem.id}" title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary edit-case-btn" data-case-id="${caseItem.id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-success close-case-btn" data-case-id="${caseItem.id}" title="Close">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Case ID</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Services</th>
                        <th>Status</th>
                        <th>Reported</th>
                        <th>Follow-Up</th>
                        <th class="text-center">Duration</th>
                        <th class="text-center">Alert</th>
                        <th style="width: 120px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Create closed cases table
 * @param {Array} closedCases - Array of closed cases
 * @returns {string} HTML string
 */
function createClosedCasesTable(closedCases) {
    if (!closedCases || closedCases.length === 0) {
        return createEmptyState('No closed cases', 'folder-check');
    }

    const rows = closedCases.map(caseItem => {
        const statusBadge = createStatusBadge(caseItem.status || 'Unknown');

        return `
            <tr>
                <td><small class="text-muted">${caseItem.caseNumber || caseItem.case_number || caseItem.id || 'N/A'}</small></td>
                <td><strong>${caseItem.location || 'N/A'}</strong></td>
                <td>${caseItem.caseType || caseItem.case_type || 'N/A'}</td>
                <td><small>${caseItem.servicesProvided || caseItem.service_provided || 'N/A'}</small></td>
                <td>${statusBadge}</td>
                <td><small>${formatDate(caseItem.dateReported || caseItem.date_reported)}</small></td>
                <td><small>${formatDate(caseItem.dateClosed || caseItem.date_closed || caseItem.closure_date)}</small></td>
                <td class="text-center">${formatNumber(caseItem.duration || caseItem.durationDays || 0)} days</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary view-case-btn" data-case-id="${caseItem.id}" title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Case ID</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Services</th>
                        <th>Status</th>
                        <th>Reported</th>
                        <th>Closed</th>
                        <th class="text-center">Duration</th>
                        <th style="width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Create case statistics section
 * @param {Array} cases - All cases
 * @returns {string} HTML string
 */
function createCaseStatistics(cases) {
    // Group by case type
    const typeStats = {};
    cases.forEach(c => {
        const type = c.caseType || 'Unknown';
        if (!typeStats[type]) {
            typeStats[type] = { count: 0, active: 0, closed: 0 };
        }
        typeStats[type].count++;
        if (c.status === 'Active' || c.status === 'Open') {
            typeStats[type].active++;
        } else {
            typeStats[type].closed++;
        }
    });

    const typeRows = Object.keys(typeStats).map(type => {
        const stats = typeStats[type];
        const closureRate = stats.count > 0 ? ((stats.closed / stats.count) * 100).toFixed(0) : 0;
        return `
            <tr>
                <td><strong>${type}</strong></td>
                <td class="text-center">${stats.count}</td>
                <td class="text-center">${stats.active}</td>
                <td class="text-center">${stats.closed}</td>
                <td class="text-center">${closureRate}%</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Case Type</th>
                        <th class="text-center">Total</th>
                        <th class="text-center">Active</th>
                        <th class="text-center">Closed</th>
                        <th class="text-center">Closure Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${typeRows}
                </tbody>
            </table>
        </div>
    `;
}

import { showCreateCaseModal, showEditCaseModal, showViewCaseModal } from './caseForms.js';

/**
 * Window-level functions for button handlers
 */
window.createCase = function() {
    showCreateCaseModal(() => {
        const contentArea = document.getElementById('content-area');
        if (contentArea) renderCases(contentArea);
    });
};

window.exportCases = async function() {
    try {
        if (!window.currentCasesData || window.currentCasesData.length === 0) {
            alert('No cases data to export');
            return;
        }
        await exportCasesWithNotification(window.currentCasesData);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export cases: ' + error.message);
    }
};

window.viewCase = function(caseId) {
    showViewCaseModal(caseId);
};

window.editCase = function(caseId) {
    showEditCaseModal(caseId, () => {
        const contentArea = document.getElementById('content-area');
        if (contentArea) renderCaseManagement(contentArea);
    });
};

window.closeCase = function(caseId) {
    if (confirm(`Are you sure you want to close case ${caseId}?`)) {
        alert(`Close Case ${caseId} - Will be implemented in Phase 3`);
    }
};
