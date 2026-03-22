export function renderIndicatorTracking(data) {
    // Group indicators by thematic area
    const indicatorsByThematic = {};
    data.thematicAreas.forEach(ta => {
        indicatorsByThematic[ta.id] = data.indicators.filter(ind => ind.thematicAreaId === ta.id);
    });

    return `
        <div class="container-fluid">
            <!-- Header with Actions -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Indicator Tracking Table (ITT)</h1>
                <div class="btn-group">
                    <button class="btn btn-primary" id="add-indicator-btn">
                        <i class="bi bi-plus-circle"></i> Add Indicator
                    </button>
                    <button class="btn btn-success" id="export-indicators-btn">
                        <i class="bi bi-file-earmark-excel"></i> Export to CSV
                    </button>
                </div>
            </div>

            <!-- Indicator Form Container (hidden by default) -->
            <div id="indicator-form-container" style="display: none;" class="mb-4"></div>

            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">Filter by Scope</label>
                            <select class="form-select" id="filter-scope">
                                <option value="">All Indicators</option>
                                <option value="awyad">AWYAD Indicators Only</option>
                                <option value="project">Project Indicators Only</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Filter by Level</label>
                            <select class="form-select" id="filter-level">
                                <option value="">All Levels</option>
                                <option value="output">Output</option>
                                <option value="outcome">Outcome</option>
                                <option value="impact">Impact</option>
                            </select>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-outline-secondary" id="reset-filters-btn">
                                <i class="bi bi-x-circle"></i> Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Indicators Table -->
            <div id="indicators-table-container">
            ${data.thematicAreas.map(thematicArea => {
                const indicators = indicatorsByThematic[thematicArea.id] || [];
                if (indicators.length === 0) return '';
                
                return `
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h3 class="mb-0">${thematicArea.code}: ${thematicArea.name}</h3>
                            <p class="mb-0 small">${thematicArea.description}</p>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th rowspan="2">Scope</th>
                                            <th rowspan="2">Level</th>
                                            <th rowspan="2">Code</th>
                                            <th rowspan="2">Indicator</th>
                                            <th rowspan="2">Type</th>
                                            <th colspan="2">Baseline</th>
                                            <th rowspan="2">LOP Target</th>
                                            <th rowspan="2">Annual Target</th>
                                            <th colspan="4">Quarterly Targets</th>
                                            <th rowspan="2">Achieved</th>
                                            <th rowspan="2">Variance</th>
                                            <th rowspan="2">% Achieved</th>
                                        </tr>
                                        <tr>
                                            <th>Value</th>
                                            <th>Date</th>
                                            <th>Q1</th>
                                            <th>Q2</th>
                                            <th>Q3</th>
                                            <th>Q4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${indicators.map(indicator => {
                                            const variance = indicator.annualTarget - indicator.achieved;
                                            const percentAchieved = (indicator.achieved / indicator.annualTarget) * 100;
                                            const progressClass = percentAchieved >= 80 ? 'success' : percentAchieved >= 60 ? 'warning' : 'danger';
                                            const project = data.projects.find(p => p.id === indicator.projectId);
                                            
                                            // Smart value formatting
                                            const formatValue = (value) => {
                                                if (value === null || value === undefined) return '0';
                                                const num = parseFloat(value);
                                                if (indicator.data_type === 'percentage') {
                                                    return num.toFixed(1) + '%';
                                                }
                                                return num.toLocaleString();
                                            };
                                            
                                            // Scope badge
                                            const scopeBadge = indicator.indicator_scope === 'awyad' 
                                                ? '<span class="badge bg-primary">AWYAD</span>' 
                                                : '<span class="badge bg-info">Project</span>';
                                            
                                            // Level badge
                                            const levelBadgeColor = {
                                                'output': 'success',
                                                'outcome': 'warning',
                                                'impact': 'danger'
                                            };
                                            const levelBadge = `<span class="badge bg-${levelBadgeColor[indicator.indicator_level] || 'secondary'}">${(indicator.indicator_level || 'N/A').toUpperCase()}</span>`;
                                            
                                            return `
                                                <tr data-scope="${indicator.indicator_scope}" data-level="${indicator.indicator_level}">
                                                    <td>${scopeBadge}</td>
                                                    <td>${levelBadge}</td>
                                                    <td><span class="badge bg-secondary">${indicator.code}</span></td>
                                                    <td>
                                                        <strong>${indicator.name}</strong><br>
                                                        ${indicator.indicator_scope === 'project' && project ? `<small class="text-muted">Project: ${project.name}</small><br>` : ''}
                                                        ${indicator.indicator_scope === 'awyad' && thematicArea ? `<small class="text-muted">Thematic Area: ${thematicArea.name}</small><br>` : ''}
                                                        <small class="text-muted">Unit: ${indicator.unit || 'N/A'}</small>
                                                    </td>
                                                    <td><span class="badge bg-light text-dark">${indicator.data_type || 'number'}</span></td>
                                                    <td>${formatValue(indicator.baseline)}</td>
                                                    <td><small>${indicator.baseline_date || 'N/A'}</small></td>
                                                    <td><strong>${formatValue(indicator.lop_target)}</strong></td>
                                                    <td><strong>${formatValue(indicator.annual_target)}</strong></td>
                                                    <td>${formatValue(indicator.q1_target)}</td>
                                                    <td>${formatValue(indicator.q2_target)}</td>
                                                    <td>${formatValue(indicator.q3_target)}</td>
                                                    <td>${formatValue(indicator.q4_target)}</td>
                                                    <td><span class="badge bg-${progressClass}">${formatValue(indicator.achieved)}</span></td>
                                                    <td>${formatValue(variance)}</td>
                                                    <td>
                                                        <div class="progress" style="height: 25px;">
                                                            <div class="progress-bar bg-${progressClass}" 
                                                                 role="progressbar" 
                                                                 style="width: ${Math.min(percentAchieved, 100)}%"
                                                                 aria-valuenow="${percentAchieved}" 
                                                                 aria-valuemin="0" 
                                                                 aria-valuemax="100">
                                                                ${percentAchieved.toFixed(1)}%
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
                    </div>
                `;
            }).join('')}
            </div>
            
            <!-- Quarterly Breakdown -->
            <div class="card">
                <div class="card-header">
                    <h3>Quarterly Breakdown</h3>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th rowspan="2">Scope</th>
                                    <th rowspan="2">Level</th>
                                    <th rowspan="2">Indicator Code</th>
                                    <th rowspan="2">Indicator Name</th>
                                    <th colspan="4">Quarterly Targets</th>
                                    <th colspan="4">Quarterly Achieved</th>
                                    <th rowspan="2">Annual Total</th>
                                </tr>
                                <tr>
                                    <th>Q1</th>
                                    <th>Q2</th>
                                    <th>Q3</th>
                                    <th>Q4</th>
                                    <th>Q1</th>
                                    <th>Q2</th>
                                    <th>Q3</th>
                                    <th>Q4</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.indicators.map(indicator => {
                                    // Smart value formatting
                                    const formatValue = (value) => {
                                        if (value === null || value === undefined) return '0';
                                        const num = parseFloat(value);
                                        if (indicator.data_type === 'percentage') {
                                            return num.toFixed(1) + '%';
                                        }
                                        return num.toLocaleString();
                                    };
                                    
                                    const scopeBadge = indicator.indicator_scope === 'awyad' 
                                        ? '<span class="badge bg-primary">AWYAD</span>' 
                                        : '<span class="badge bg-info">Project</span>';
                                    
                                    const levelBadgeColor = {
                                        'output': 'success',
                                        'outcome': 'warning',
                                        'impact': 'danger'
                                    };
                                    const levelBadge = `<span class="badge bg-${levelBadgeColor[indicator.indicator_level] || 'secondary'}">${(indicator.indicator_level || 'N/A').toUpperCase()}</span>`;
                                    
                                    return `
                                        <tr data-scope="${indicator.indicator_scope}" data-level="${indicator.indicator_level}">
                                            <td>${scopeBadge}</td>
                                            <td>${levelBadge}</td>
                                            <td><span class="badge bg-secondary">${indicator.code}</span></td>
                                            <td>${indicator.name}</td>
                                            <td>${formatValue(indicator.q1_target)}</td>
                                            <td>${formatValue(indicator.q2_target)}</td>
                                            <td>${formatValue(indicator.q3_target)}</td>
                                            <td>${formatValue(indicator.q4_target)}</td>
                                            <td>${formatValue(indicator.q1_achieved)}</td>
                                            <td>${formatValue(indicator.q2_achieved)}</td>
                                            <td>${formatValue(indicator.q3_achieved)}</td>
                                            <td>${formatValue(indicator.q4_achieved)}</td>
                                            <td><strong>${formatValue(indicator.annual_target)}</strong></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            // Filter functionality
            (function() {
                const filterScope = document.getElementById('filter-scope');
                const filterLevel = document.getElementById('filter-level');
                const resetBtn = document.getElementById('reset-filters-btn');
                
                function applyFilters() {
                    const scopeValue = filterScope.value;
                    const levelValue = filterLevel.value;
                    
                    document.querySelectorAll('tr[data-scope]').forEach(row => {
                        const rowScope = row.getAttribute('data-scope');
                        const rowLevel = row.getAttribute('data-level');
                        
                        const scopeMatch = !scopeValue || rowScope === scopeValue;
                        const levelMatch = !levelValue || rowLevel === levelValue;
                        
                        if (scopeMatch && levelMatch) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                    
                    // Update visible count
                    updateVisibleCount();
                }
                
                function updateVisibleCount() {
                    const allRows = document.querySelectorAll('tr[data-scope]');
                    const visibleRows = Array.from(allRows).filter(row => row.style.display !== 'none');
                    
                    // You could add a count display here if needed
                    console.log(`Showing ${visibleRows.length} of ${allRows.length} indicators`);
                }
                
                if (filterScope) {
                    filterScope.addEventListener('change', applyFilters);
                }
                
                if (filterLevel) {
                    filterLevel.addEventListener('change', applyFilters);
                }
                
                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        filterScope.value = '';
                        filterLevel.value = '';
                        applyFilters();
                    });
                }
            })();
        </script>
    `;
}
