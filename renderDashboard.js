export function renderDashboard(data) {
    // Calculate summary statistics
    const activeProjects = data.projects.filter(p => p.status === 'Active').length;
    
    const indicatorsOnTrack = data.indicators.filter(ind => {
        const progress = (ind.achieved / ind.annualTarget) * 100;
        return progress >= 70; // Consider on-track if 70% or more achieved
    }).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activitiesThisMonth = data.activities.filter(act => {
        const actDate = new Date(act.date);
        return actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
    }).length;
    
    const totalBudget = data.projects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenditure = data.projects.reduce((sum, p) => sum + p.expenditure, 0);
    const avgBurnRate = (totalExpenditure / totalBudget) * 100;
    
    // Generate HTML
    return `
        <div class="container-fluid">
            <h1 class="mb-4">AWYAD M&E Dashboard</h1>
            
            <!-- Summary Cards Row -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-white bg-primary mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Active Projects</h5>
                            <p class="card-text display-4">${activeProjects}</p>
                            <small>of ${data.projects.length} total</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-success mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Indicators On-Track</h5>
                            <p class="card-text display-4">${indicatorsOnTrack}</p>
                            <small>of ${data.indicators.length} total</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-info mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Activities This Month</h5>
                            <p class="card-text display-4">${activitiesThisMonth}</p>
                            <small>Total: ${data.activities.length}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-warning mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Budget Burn Rate</h5>
                            <p class="card-text display-4">${avgBurnRate.toFixed(1)}%</p>
                            <small>$${totalExpenditure.toLocaleString()} / $${totalBudget.toLocaleString()}</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Thematic Areas Overview -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3>Thematic Areas Overview</h3>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${data.thematicAreas.map(ta => {
                                    const taIndicators = data.indicators.filter(i => i.thematicAreaId === ta.id);
                                    const taProjects = data.projects.filter(p => p.thematicAreaId === ta.id);
                                    const totalAchieved = taIndicators.reduce((sum, i) => sum + i.achieved, 0);
                                    const totalTarget = taIndicators.reduce((sum, i) => sum + i.annualTarget, 0);
                                    const progress = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
                                    const progressClass = progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'danger';
                                    
                                    return `
                                        <div class="col-md-4 mb-3">
                                            <div class="card h-100">
                                                <div class="card-body">
                                                    <h5 class="card-title">${ta.code}</h5>
                                                    <h6 class="card-subtitle mb-2 text-muted">${ta.name}</h6>
                                                    <p class="card-text small">${ta.description}</p>
                                                    <hr>
                                                    <p class="mb-1"><strong>Projects:</strong> ${taProjects.length}</p>
                                                    <p class="mb-1"><strong>Indicators:</strong> ${taIndicators.length}</p>
                                                    <p class="mb-2"><strong>Overall Progress:</strong></p>
                                                    <div class="progress" style="height: 25px;">
                                                        <div class="progress-bar bg-${progressClass}" 
                                                             role="progressbar" 
                                                             style="width: ${Math.min(progress, 100)}%">
                                                            ${progress.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Results Framework Summary -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3>Results Framework Summary</h3>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Indicator</th>
                                            <th>Target</th>
                                            <th>Achieved</th>
                                            <th style="width: 30%;">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.indicators.map(indicator => {
                                            const progress = (indicator.achieved / indicator.annualTarget) * 100;
                                            const progressClamped = Math.min(progress, 100);
                                            const progressClass = progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'danger';
                                            const thematicArea = data.thematicAreas.find(ta => ta.id === indicator.thematicAreaId);
                                            
                                            return `
                                                <tr>
                                                    <td>
                                                        <span class="badge bg-secondary">${indicator.code}</span><br>
                                                        <strong>${indicator.name}</strong><br>
                                                        <small class="text-muted">${thematicArea ? thematicArea.code + ': ' + thematicArea.name : 'N/A'}</small>
                                                    </td>
                                                    <td><strong>${indicator.annualTarget}</strong> ${indicator.unit}</td>
                                                    <td><strong>${indicator.achieved}</strong> ${indicator.unit}</td>
                                                    <td>
                                                        <div class="progress">
                                                            <div class="progress-bar bg-${progressClass}" 
                                                                 role="progressbar" 
                                                                 style="width: ${progressClamped}%"
                                                                 aria-valuenow="${progressClamped}" 
                                                                 aria-valuemin="0" 
                                                                 aria-valuemax="100">
                                                                ${progress.toFixed(1)}%
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
                </div>
            </div>
        </div>
    `;
}
