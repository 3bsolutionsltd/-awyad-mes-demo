export function renderIndicatorTracking(data) {
    // Group indicators by thematic area
    const indicatorsByThematic = {};
    data.thematicAreas.forEach(ta => {
        indicatorsByThematic[ta.id] = data.indicators.filter(ind => ind.thematicAreaId === ta.id);
    });

    return `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Indicator Tracking Table (ITT)</h1>
                <button class="btn btn-success" id="export-indicators-btn">
                    <i class="bi bi-file-earmark-excel"></i> Export to CSV
                </button>
            </div>
            
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
                                            <th rowspan="2">Code</th>
                                            <th rowspan="2">Indicator</th>
                                            <th rowspan="2">Type</th>
                                            <th colspan="2">Baseline</th>
                                            <th rowspan="2">LOP Target</th>
                                            <th rowspan="2">Annual Target</th>
                                            <th rowspan="2">Achieved</th>
                                            <th rowspan="2">Variance</th>
                                            <th rowspan="2">% Achieved</th>
                                        </tr>
                                        <tr>
                                            <th>Value</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${indicators.map(indicator => {
                                            const variance = indicator.annualTarget - indicator.achieved;
                                            const percentAchieved = (indicator.achieved / indicator.annualTarget) * 100;
                                            const progressClass = percentAchieved >= 80 ? 'success' : percentAchieved >= 60 ? 'warning' : 'danger';
                                            const project = data.projects.find(p => p.id === indicator.projectId);
                                            
                                            return `
                                                <tr>
                                                    <td><span class="badge bg-secondary">${indicator.code}</span></td>
                                                    <td>
                                                        <strong>${indicator.name}</strong><br>
                                                        <small class="text-muted">Project: ${project ? project.name : 'N/A'}</small><br>
                                                        <small class="text-muted">Unit: ${indicator.unit}</small>
                                                    </td>
                                                    <td><span class="badge bg-info">${indicator.type}</span></td>
                                                    <td>${indicator.baseline}</td>
                                                    <td><small>${indicator.baselineDate}</small></td>
                                                    <td><strong>${indicator.lopTarget}</strong></td>
                                                    <td><strong>${indicator.annualTarget}</strong></td>
                                                    <td><span class="badge bg-${progressClass}">${indicator.achieved}</span></td>
                                                    <td>${variance}</td>
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
                                    <th>Indicator Code</th>
                                    <th>Indicator Name</th>
                                    <th>Q1 Target</th>
                                    <th>Q2 Target</th>
                                    <th>Q3 Target</th>
                                    <th>Q4 Target</th>
                                    <th>Annual Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.indicators.map(indicator => `
                                    <tr>
                                        <td><span class="badge bg-secondary">${indicator.code}</span></td>
                                        <td>${indicator.name}</td>
                                        <td>${indicator.q1Target}</td>
                                        <td>${indicator.q2Target}</td>
                                        <td>${indicator.q3Target}</td>
                                        <td>${indicator.q4Target}</td>
                                        <td><strong>${indicator.annualTarget}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}
