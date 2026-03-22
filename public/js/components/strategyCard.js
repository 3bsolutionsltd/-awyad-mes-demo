/**
 * Strategy Card Component
 * Displays a strategy with expandable pillars
 * 
 * @module components/strategyCard
 * @author AWYAD MES Team - Stream 6
 */

/**
 * Create a strategy card with expandable content
 * @param {Object} strategy - Strategy data with pillars
 * @param {boolean} expanded - Initial expansion state
 * @returns {string} HTML string
 */
export function createStrategyCard(strategy, expanded = false) {
    const collapseClass = expanded ? 'show' : '';
    const iconClass = expanded ? 'bi-caret-down-fill' : 'bi-caret-right-fill';
    
    return `
        <div class="card strategy-card mb-3" data-strategy-id="${strategy.id}">
            <div class="card-header strategy-header text-white" onclick="toggleStrategy('${strategy.id}')" style="cursor: pointer;">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi ${iconClass} expand-icon me-2" id="icon-${strategy.id}"></i>
                        <strong class="strategy-code">${escapeHtml(strategy.code)}</strong>
                        <span class="strategy-name ms-2">${escapeHtml(strategy.name)}</span>
                    </div>
                    <div class="strategy-badges">
                        <span class="badge bg-primary me-1" title="Number of Pillars">
                            <i class="bi bi-diagram-3"></i> ${strategy.pillar_count || strategy.pillars?.length || 0} Pillars
                        </span>
                        <span class="badge bg-info text-dark me-1" title="Number of Components">
                            <i class="bi bi-boxes"></i> ${strategy.component_count || 0} Components
                        </span>
                        <span class="badge bg-success" title="Number of Projects">
                            <i class="bi bi-folder"></i> ${strategy.project_count || 0} Projects
                        </span>
                    </div>
                </div>
            </div>
            <div class="collapse ${collapseClass}" id="strategy-collapse-${strategy.id}">
                <div class="card-body strategy-body">
                    ${strategy.description ? `
                        <p class="mb-3" style="color: #a8c8e8;">${escapeHtml(strategy.description)}</p>
                    ` : ''}
                    <div class="pillars-container">
                        ${renderPillars(strategy.pillars || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render pillars under a strategy
 * @private
 */
function renderPillars(pillars) {
    if (!pillars || pillars.length === 0) {
        return '<div class="alert alert-info">No pillars defined for this strategy.</div>';
    }
    
    return pillars.map(pillar => `
        <div class="pillar-item ms-4 mb-3 p-3 border-start border-3 border-primary" data-pillar-id="${pillar.id}">
            <div class="pillar-header" onclick="togglePillar('${pillar.id}')" style="cursor: pointer;">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-caret-right-fill pillar-icon me-2" id="pillar-icon-${pillar.id}"></i>
                        <strong class="pillar-code">${escapeHtml(pillar.code)}</strong>
                        <span class="pillar-name ms-2">${escapeHtml(pillar.name)}</span>
                    </div>
                    <div>
                        <span class="badge bg-secondary" title="Components under this pillar">
                            ${pillar.component_count || pillar.components?.length || 0} Components
                        </span>
                    </div>
                </div>
            </div>
            <div class="pillar-components collapse mt-2" id="pillar-collapse-${pillar.id}">
                ${renderComponents(pillar.components || [])}
            </div>
        </div>
    `).join('');
}

/**
 * Render components under a pillar
 * @private
 */
function renderComponents(components) {
    if (!components || components.length === 0) {
        return '<div class="alert alert-sm alert-info ms-4">No components defined.</div>';
    }
    
    return components.map(component => `
        <div class="component-item ms-4 mb-2 p-2 rounded" data-component-id="${component.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <strong class="component-code">${escapeHtml(component.code)}</strong>
                    <span class="component-name ms-2">${escapeHtml(component.name)}</span>
                    ${component.project_count ? `
                        <span class="badge bg-success ms-2" title="Projects">
                            ${component.project_count} Projects
                        </span>
                    ` : ''}
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="showComponentDetails('${component.id}')" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
            ${component.interventions && component.interventions.length > 0 ? `
                <div class="mt-2">
                    <small style="color: #90b8d0;">
                        <i class="bi bi-list-check"></i> Interventions: 
                        ${component.interventions.slice(0, 2).map(i => i.name).join(', ')}
                        ${component.interventions.length > 2 ? ` +${component.interventions.length - 2} more` : ''}
                    </small>
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * Toggle strategy expansion
 * Called from onclick in HTML
 */
window.toggleStrategy = function(strategyId) {
    const collapse = document.getElementById(`strategy-collapse-${strategyId}`);
    const icon = document.getElementById(`icon-${strategyId}`);
    
    if (collapse) {
        const bsCollapse = new bootstrap.Collapse(collapse, { toggle: true });
        
        // Update icon
        setTimeout(() => {
            if (collapse.classList.contains('show')) {
                icon.className = 'bi bi-caret-down-fill expand-icon me-2';
            } else {
                icon.className = 'bi bi-caret-right-fill expand-icon me-2';
            }
        }, 50);
    }
};

/**
 * Toggle pillar expansion
 */
window.togglePillar = function(pillarId) {
    const collapse = document.getElementById(`pillar-collapse-${pillarId}`);
    const icon = document.getElementById(`pillar-icon-${pillarId}`);
    
    if (collapse) {
        const bsCollapse = new bootstrap.Collapse(collapse, { toggle: true });
        
        setTimeout(() => {
            if (collapse.classList.contains('show')) {
                icon.className = 'bi bi-caret-down-fill pillar-icon me-2';
            } else {
                icon.className = 'bi bi-caret-right-fill pillar-icon me-2';
            }
        }, 50);
    }
};

/**
 * Show component details in modal
 */
window.showComponentDetails = function(componentId) {
    // Will be implemented with modal
    console.log('Show component details:', componentId);
    // TODO: Trigger component detail modal
};

/**
 * Escape HTML to prevent XSS
 * @private
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
