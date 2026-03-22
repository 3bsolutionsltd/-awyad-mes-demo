/**
 * Component Card
 * Displays a core program component with interventions, approaches, and linked projects
 * 
 * @module components/componentCard
 * @author AWYAD MES Team - Stream 6
 */

/**
 * Create a detailed component card
 * @param {Object} component - Component data
 * @returns {string} HTML string
 */
export function createComponentCard(component) {
    return `
        <div class="card component-detail-card mb-3" data-component-id="${component.id}">
            <div class="card-header bg-primary text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${escapeHtml(component.code)}</strong>
                        <span class="ms-2">${escapeHtml(component.name)}</span>
                    </div>
                    <button class="btn btn-sm btn-light" onclick="closeComponentCard()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                ${component.description ? `
                    <div class="mb-3">
                        <h6>Description</h6>
                        <p class="text-muted">${escapeHtml(component.description)}</p>
                    </div>
                ` : ''}
                
                ${renderInterventions(component.interventions)}
                ${renderImplementationApproaches(component.implementation_approaches)}
                ${renderLinkedProjects(component.projects)}
            </div>
        </div>
    `;
}

/**
 * Render interventions section
 * @private
 */
function renderInterventions(interventions) {
    if (!interventions || interventions.length === 0) {
        return '';
    }
    
    return `
        <div class="mb-3">
            <h6 class="d-flex justify-content-between align-items-center">
                <span><i class="bi bi-list-check text-primary"></i> Interventions</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleSection('interventions')">
                    <i class="bi bi-chevron-down" id="interventions-icon"></i>
                </button>
            </h6>
            <div class="collapse show" id="interventions-section">
                <ul class="list-group list-group-flush">
                    ${interventions.map((intervention, index) => `
                        <li class="list-group-item">
                            <div class="d-flex align-items-start">
                                <span class="badge bg-secondary me-2">${index + 1}</span>
                                <div>
                                    <strong>${escapeHtml(intervention.name)}</strong>
                                    ${intervention.description ? `
                                        <p class="text-muted small mb-0 mt-1">${escapeHtml(intervention.description)}</p>
                                    ` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Render implementation approaches section
 * @private
 */
function renderImplementationApproaches(approaches) {
    if (!approaches || approaches.length === 0) {
        return '';
    }
    
    return `
        <div class="mb-3">
            <h6 class="d-flex justify-content-between align-items-center">
                <span><i class="bi bi-gear text-success"></i> Implementation Approaches</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleSection('approaches')">
                    <i class="bi bi-chevron-down" id="approaches-icon"></i>
                </button>
            </h6>
            <div class="collapse show" id="approaches-section">
                <ul class="list-group list-group-flush">
                    ${approaches.map((approach, index) => `
                        <li class="list-group-item">
                            <div class="d-flex align-items-start">
                                <span class="badge bg-success me-2">${index + 1}</span>
                                <div>
                                    <strong>${escapeHtml(approach.name)}</strong>
                                    ${approach.description ? `
                                        <p class="text-muted small mb-0 mt-1">${escapeHtml(approach.description)}</p>
                                    ` : ''}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Render linked projects section
 * @private
 */
function renderLinkedProjects(projects) {
    if (!projects || projects.length === 0) {
        return `
            <div class="alert alert-info mb-0">
                <i class="bi bi-info-circle"></i> No projects linked to this component yet.
            </div>
        `;
    }
    
    return `
        <div class="mb-0">
            <h6><i class="bi bi-folder text-info"></i> Linked Projects (${projects.length})</h6>
            <div class="list-group">
                ${projects.map(project => `
                    <a href="#project-dashboard?id=${project.id}" 
                       class="list-group-item list-group-item-action"
                       onclick="navigateToProject('${project.id}')">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${escapeHtml(project.name)}</h6>
                                <small class="text-muted">
                                    ${project.donor ? `<span class="me-2"><i class="bi bi-building"></i> ${escapeHtml(project.donor)}</span>` : ''}
                                    ${project.status ? `<span class="badge bg-${getStatusColor(project.status)}">${project.status}</span>` : ''}
                                </small>
                            </div>
                            <div class="text-end">
                                ${project.budget ? `
                                    <div class="small text-muted">Budget</div>
                                    <div class="fw-bold">${formatCurrency(project.budget)}</div>
                                ` : ''}
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Toggle collapsible section
 */
window.toggleSection = function(sectionId) {
    const section = document.getElementById(`${sectionId}-section`);
    const icon = document.getElementById(`${sectionId}-icon`);
    
    if (section && icon) {
        const bsCollapse = new bootstrap.Collapse(section, { toggle: true });
        
        setTimeout(() => {
            if (section.classList.contains('show')) {
                icon.className = 'bi bi-chevron-down';
            } else {
                icon.className = 'bi bi-chevron-right';
            }
        }, 50);
    }
};

/**
 * Close component card
 */
window.closeComponentCard = function() {
    // Remove the component detail card from DOM
    const card = document.querySelector('.component-detail-card');
    if (card) {
        card.remove();
    }
};

/**
 * Navigate to project dashboard
 */
window.navigateToProject = function(projectId) {
    // Will integrate with main navigation
    window.location.hash = `project-dashboard?id=${projectId}`;
};

/**
 * Get status badge color
 * @private
 */
function getStatusColor(status) {
    const statusMap = {
        'Active': 'success',
        'Completed': 'secondary',
        'On Hold': 'warning',
        'Cancelled': 'danger',
        'Planning': 'info'
    };
    return statusMap[status] || 'secondary';
}

/**
 * Format currency
 * @private
 */
function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Escape HTML
 * @private
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
