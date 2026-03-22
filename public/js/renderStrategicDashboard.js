import { authManager } from '../auth.js';

const API_BASE = '/api/v1';

/**
 * Render Strategic Dashboard with full organizational hierarchy
 * Strategies → Pillars → Core Program Components (with interventions/approaches) → AWYAD Indicators
 */
export async function renderStrategicDashboard() {
    const container = document.createElement('div');
    container.className = 'container-fluid strategic-dashboard';
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading strategic framework...</span>
            </div>
        </div>
    `;

    try {
        // Fetch strategic hierarchy and indicators in parallel
        const [hierarchyResponse, indicatorsResponse, statsResponse] = await Promise.all([
            authManager.authenticatedFetch(`${API_BASE}/dashboard/strategic-hierarchy`),
            authManager.authenticatedFetch(`${API_BASE}/dashboard/awyad-indicators`),
            authManager.authenticatedFetch(`${API_BASE}/dashboard/stats`)
        ]);

        const hierarchy = await hierarchyResponse.json();
        const indicators = await indicatorsResponse.json();
        const stats = await statsResponse.json();

        if (!hierarchy.success || !indicators.success || !stats.success) {
            throw new Error('Failed to load strategic data');
        }

        // Render the complete dashboard
        container.innerHTML = renderDashboardContent(
            hierarchy.data || [],
            indicators.data || [],
            stats.data || {}
        );

        // Return HTML and schedule event listener attachment
        const html = container.outerHTML;
        setTimeout(() => attachEventListeners(), 0);
        return html;

    } catch (error) {
        console.error('Error loading strategic dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error Loading Strategic Dashboard</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
        return container.outerHTML;
    }
}

function renderDashboardContent(strategies, indicators, stats) {
    return `
        <div class="dashboard-header mb-4">
            <h1 class="mb-3">
                <i class="bi bi-diagram-3"></i> Strategic Dashboard
            </h1>
            <p class="lead text-muted">
                AWYAD Organizational Strategic Framework & Results-Based Monitoring
            </p>
        </div>

        ${renderSummaryCards(stats)}
        
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4 class="mb-0">
                                <i class="bi bi-bar-chart-steps"></i> Strategic Hierarchy
                            </h4>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-light btn-sm" onclick="expandAllStrategies()">
                                    <i class="bi bi-arrows-expand"></i> Expand All
                                </button>
                                <button class="btn btn-light btn-sm" onclick="collapseAllStrategies()">
                                    <i class="bi bi-arrows-collapse"></i> Collapse All
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        ${renderStrategicHierarchy(strategies, indicators)}
                    </div>
                </div>
            </div>
        </div>

        ${renderAWYADIndicatorsTable(indicators)}
    `;
}

function renderSummaryCards(stats) {
    return `
        <div class="row mb-4 summary-cards">
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-primary h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-bullseye display-4 text-primary"></i>
                        <h2 class="mt-2 mb-0">${stats.total_strategies || 0}</h2>
                        <p class="text-muted mb-0">Strategic Objectives</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-success h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-columns-gap display-4 text-success"></i>
                        <h2 class="mt-2 mb-0">${stats.total_pillars || 0}</h2>
                        <p class="text-muted mb-0">Strategic Pillars</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-info h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-boxes display-4 text-info"></i>
                        <h2 class="mt-2 mb-0">${stats.total_components || 0}</h2>
                        <p class="text-muted mb-0">Core Program Components</p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-3">
                <div class="card border-warning h-100">
                    <div class="card-body text-center">
                        <i class="bi bi-graph-up-arrow display-4 text-warning"></i>
                        <h2 class="mt-2 mb-0">${stats.total_awyad_indicators || 0}</h2>
                        <p class="text-muted mb-0">AWYAD Indicators</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStrategicHierarchy(strategies, indicators) {
    if (!strategies || strategies.length === 0) {
        return `
            <div class="alert alert-info m-3">
                <i class="bi bi-info-circle"></i> No strategic objectives defined yet.
                <a href="#" class="alert-link">Create your first strategy</a>
            </div>
        `;
    }

    return `
        <div class="strategic-hierarchy">
            ${strategies.map((strategy, sIndex) => renderStrategy(strategy, sIndex, indicators)).join('')}
        </div>
    `;
}

function renderStrategy(strategy, index, allIndicators) {
    const strategyId = `strategy-${strategy.id}`;
    const hasContent = strategy.pillars && strategy.pillars.length > 0;

    return `
        <div class="hierarchy-level strategy-level border-bottom">
            <div class="hierarchy-item p-3 bg-light" 
                 onclick="toggleCollapse('${strategyId}')" 
                 style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-chevron-right collapse-icon me-2" id="${strategyId}-icon"></i>
                    <div class="flex-grow-1">
                        <h5 class="mb-1">
                            <span class="badge bg-primary me-2">S${index + 1}</span>
                            ${escapeHtml(strategy.name)}
                        </h5>
                        ${strategy.description ? `<p class="text-muted mb-0 small">${escapeHtml(strategy.description)}</p>` : ''}
                    </div>
                    ${hasContent ? `<span class="badge bg-secondary">${strategy.pillars.length} Pillar${strategy.pillars.length !== 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
            <div class="collapse hierarchy-content" id="${strategyId}">
                ${hasContent ? renderPillars(strategy.pillars, allIndicators) : '<div class="p-3 text-muted"><i>No pillars defined</i></div>'}
            </div>
        </div>
    `;
}

function renderPillars(pillars, allIndicators) {
    return `
        <div class="pillars-container ps-4">
            ${pillars.map((pillar, pIndex) => renderPillar(pillar, pIndex, allIndicators)).join('')}
        </div>
    `;
}

function renderPillar(pillar, index, allIndicators) {
    const pillarId = `pillar-${pillar.id}`;
    const hasContent = pillar.components && pillar.components.length > 0;

    return `
        <div class="hierarchy-level pillar-level border-start border-3 border-success">
            <div class="hierarchy-item p-3" 
                 onclick="toggleCollapse('${pillarId}')" 
                 style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-chevron-right collapse-icon me-2" id="${pillarId}-icon"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <span class="badge bg-success me-2">P${index + 1}</span>
                            ${escapeHtml(pillar.name)}
                        </h6>
                        ${pillar.description ? `<p class="text-muted mb-0 small">${escapeHtml(pillar.description)}</p>` : ''}
                    </div>
                    ${hasContent ? `<span class="badge bg-info">${pillar.components.length} Component${pillar.components.length !== 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
            <div class="collapse hierarchy-content" id="${pillarId}">
                ${hasContent ? renderComponents(pillar.components, allIndicators) : '<div class="p-3 text-muted"><i>No components defined</i></div>'}
            </div>
        </div>
    `;
}

function renderComponents(components, allIndicators) {
    return `
        <div class="components-container ps-4">
            ${components.map((component, cIndex) => renderComponent(component, cIndex, allIndicators)).join('')}
        </div>
    `;
}

function renderComponent(component, index, allIndicators) {
    const componentId = `component-${component.id}`;
    const hasInterventions = component.interventions && component.interventions.length > 0;
    const hasApproaches = component.approaches && component.approaches.length > 0;
    const componentIndicators = allIndicators.filter(ind => 
        ind.component_id === component.id || 
        ind.core_program_component_id === component.id
    );

    return `
        <div class="hierarchy-level component-level border-start border-3 border-info">
            <div class="hierarchy-item p-3 bg-white" 
                 onclick="toggleCollapse('${componentId}')" 
                 style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-chevron-right collapse-icon me-2" id="${componentId}-icon"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <span class="badge bg-info me-2">C${index + 1}</span>
                            ${escapeHtml(component.name)}
                        </h6>
                        ${component.description ? `<p class="text-muted mb-0 small">${escapeHtml(component.description)}</p>` : ''}
                    </div>
                    <div>
                        ${hasInterventions ? `<span class="badge bg-secondary me-1">${component.interventions.length} Interventions</span>` : ''}
                        ${hasApproaches ? `<span class="badge bg-secondary me-1">${component.approaches.length} Approaches</span>` : ''}
                        ${componentIndicators.length > 0 ? `<span class="badge bg-warning">${componentIndicators.length} Indicators</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="collapse hierarchy-content" id="${componentId}">
                <div class="p-3 bg-light">
                    ${hasInterventions ? renderInterventions(component.interventions) : ''}
                    ${hasApproaches ? renderApproaches(component.approaches) : ''}
                    ${componentIndicators.length > 0 ? renderComponentIndicators(componentIndicators) : ''}
                </div>
            </div>
        </div>
    `;
}

function renderInterventions(interventions) {
    return `
        <div class="mb-3">
            <h6 class="text-primary mb-2">
                <i class="bi bi-gear"></i> Interventions
            </h6>
            <ul class="list-unstyled ms-3">
                ${interventions.map(intervention => `
                    <li class="mb-1">
                        <i class="bi bi-arrow-right-short text-primary"></i>
                        ${escapeHtml(intervention)}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function renderApproaches(approaches) {
    return `
        <div class="mb-3">
            <h6 class="text-success mb-2">
                <i class="bi bi-compass"></i> Approaches
            </h6>
            <ul class="list-unstyled ms-3">
                ${approaches.map(approach => `
                    <li class="mb-1">
                        <i class="bi bi-arrow-right-short text-success"></i>
                        ${escapeHtml(approach)}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function renderComponentIndicators(indicators) {
    return `
        <div class="mb-2">
            <h6 class="text-warning mb-2">
                <i class="bi bi-graph-up"></i> Associated AWYAD Indicators
            </h6>
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Indicator</th>
                            <th>Level</th>
                            <th>LOP Target</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.map(ind => {
                            const lopProgress = ind.lop_target > 0 ? (ind.lop_achieved / ind.lop_target * 100) : 0;
                            const progressClass = lopProgress >= 80 ? 'success' : lopProgress >= 60 ? 'warning' : 'danger';
                            
                            return `
                                <tr>
                                    <td>
                                        <strong>${escapeHtml(ind.name)}</strong>
                                        ${ind.code ? `<br><small class="text-muted">${escapeHtml(ind.code)}</small>` : ''}
                                    </td>
                                    <td>
                                        <span class="badge bg-secondary">${escapeHtml(ind.indicator_level || 'N/A')}</span>
                                    </td>
                                    <td>
                                        ${formatValue(ind.lop_target, ind.data_type, ind.unit)}
                                    </td>
                                    <td>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar bg-${progressClass}" 
                                                 role="progressbar" 
                                                 style="width: ${Math.min(lopProgress, 100)}%">
                                                ${lopProgress.toFixed(1)}%
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAWYADIndicatorsTable(indicators) {
    if (!indicators || indicators.length === 0) {
        return '';
    }

    return `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h4 class="mb-0">
                            <i class="bi bi-graph-up-arrow"></i> AWYAD Strategic Indicators (All)
                        </h4>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Indicator</th>
                                        <th>Level</th>
                                        <th>Data Type</th>
                                        <th>LOP Target</th>
                                        <th>Q1</th>
                                        <th>Q2</th>
                                        <th>Q3</th>
                                        <th>Q4</th>
                                        <th>Overall Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${indicators.map(ind => renderIndicatorRow(ind)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderIndicatorRow(ind) {
    const lopProgress = ind.lop_target > 0 ? (ind.lop_achieved / ind.lop_target * 100) : 0;
    const progressClass = lopProgress >= 80 ? 'success' : lopProgress >= 60 ? 'warning' : 'danger';
    
    const q1Progress = calculateQuarterProgress(ind.q1_target, ind.q1_achieved);
    const q2Progress = calculateQuarterProgress(ind.q2_target, ind.q2_achieved);
    const q3Progress = calculateQuarterProgress(ind.q3_target, ind.q3_achieved);
    const q4Progress = calculateQuarterProgress(ind.q4_target, ind.q4_achieved);

    return `
        <tr>
            <td>
                <strong>${escapeHtml(ind.name)}</strong>
                ${ind.code ? `<br><small class="text-muted">${escapeHtml(ind.code)}</small>` : ''}
                ${ind.thematic_area_name ? `<br><span class="badge bg-secondary">${escapeHtml(ind.thematic_area_name)}</span>` : ''}
            </td>
            <td>
                <span class="badge bg-info">${escapeHtml(ind.indicator_level || 'N/A')}</span>
            </td>
            <td>
                <span class="badge bg-secondary">${escapeHtml(ind.data_type || 'Number')}</span>
            </td>
            <td>
                <strong>${formatValue(ind.lop_target, ind.data_type, ind.unit)}</strong>
            </td>
            <td>${renderQuarterCell(ind.q1_achieved, ind.q1_target, ind.data_type, ind.unit, q1Progress)}</td>
            <td>${renderQuarterCell(ind.q2_achieved, ind.q2_target, ind.data_type, ind.unit, q2Progress)}</td>
            <td>${renderQuarterCell(ind.q3_achieved, ind.q3_target, ind.data_type, ind.unit, q3Progress)}</td>
            <td>${renderQuarterCell(ind.q4_achieved, ind.q4_target, ind.data_type, ind.unit, q4Progress)}</td>
            <td>
                <div class="progress" style="height: 25px;">
                    <div class="progress-bar bg-${progressClass}" 
                         role="progressbar" 
                         style="width: ${Math.min(lopProgress, 100)}%">
                        ${lopProgress.toFixed(1)}%
                    </div>
                </div>
                <small class="text-muted">
                    ${formatValue(ind.lop_achieved, ind.data_type, ind.unit)} / 
                    ${formatValue(ind.lop_target, ind.data_type, ind.unit)}
                </small>
            </td>
        </tr>
    `;
}

function renderQuarterCell(achieved, target, dataType, unit, progress) {
    const progressClass = progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'danger';
    
    return `
        <div>
            <small>
                ${formatValue(achieved, dataType, unit)} / ${formatValue(target, dataType, unit)}
            </small>
            <div class="progress mt-1" style="height: 5px;">
                <div class="progress-bar bg-${progressClass}" 
                     style="width: ${Math.min(progress, 100)}%">
                </div>
            </div>
        </div>
    `;
}

function calculateQuarterProgress(target, achieved) {
    if (!target || target === 0) return 0;
    return (achieved / target * 100) || 0;
}

function formatValue(value, dataType, unit) {
    if (value === null || value === undefined) return 'N/A';
    
    if (dataType === 'Percentage') {
        return `${value}%`;
    }
    
    return unit ? `${value} ${unit}` : value;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function attachEventListeners() {
    // Global functions for expand/collapse all
    window.expandAllStrategies = function() {
        document.querySelectorAll('.strategic-hierarchy .collapse').forEach(el => {
            const bsCollapse = new bootstrap.Collapse(el, { toggle: false });
            bsCollapse.show();
        });
        document.querySelectorAll('.collapse-icon').forEach(icon => {
            icon.classList.remove('bi-chevron-right');
            icon.classList.add('bi-chevron-down');
        });
    };

    window.collapseAllStrategies = function() {
        document.querySelectorAll('.strategic-hierarchy .collapse').forEach(el => {
            const bsCollapse = new bootstrap.Collapse(el, { toggle: false });
            bsCollapse.hide();
        });
        document.querySelectorAll('.collapse-icon').forEach(icon => {
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-right');
        });
    };

    window.toggleCollapse = function(targetId) {
        const target = document.getElementById(targetId);
        const icon = document.getElementById(`${targetId}-icon`);
        
        if (target) {
            const bsCollapse = new bootstrap.Collapse(target, { toggle: true });
            
            // Toggle icon
            if (icon) {
                if (target.classList.contains('show')) {
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-right');
                } else {
                    icon.classList.remove('bi-chevron-right');
                    icon.classList.add('bi-chevron-down');
                }
            }
        }
    };
}
