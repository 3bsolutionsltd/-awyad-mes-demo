export function renderActivityTracking(data) {
    return `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1>Activity Tracking Table (ATT)</h1>
                <button class="btn btn-success" id="export-activities-btn">
                    <i class="bi bi-file-earmark-excel"></i> Export to CSV
                </button>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Activities</h6>
                            <h2>${data.activities.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Completed</h6>
                            <h2>${data.activities.filter(a => a.status === 'Completed').length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">Pending Review</h6>
                            <h2>${data.activities.filter(a => a.approvalStatus === 'Pending Review').length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Budget</h6>
                            <h2>$${data.activities.reduce((sum, a) => sum + a.budget, 0).toLocaleString()}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Table -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Activity Code</th>
                                    <th>Activity Name</th>
                                    <th>Indicator</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Approval</th>
                                    <th>Budget</th>
                                    <th>Expenditure</th>
                                    <th>Burn Rate</th>
                                    <th>Beneficiaries</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.activities.map(activity => {
                                    const indicator = data.indicators.find(i => i.id === activity.indicatorId);
                                    const project = data.projects.find(p => p.id === activity.projectId);
                                    const burnRate = (activity.expenditure / activity.budget) * 100;
                                    const totalBeneficiaries = activity.beneficiaries.maleRefugee + 
                                                             activity.beneficiaries.femaleRefugee + 
                                                             activity.beneficiaries.maleHost + 
                                                             activity.beneficiaries.femaleHost;
                                    
                                    const statusClass = activity.status === 'Completed' ? 'success' : 'warning';
                                    const approvalClass = activity.approvalStatus === 'Approved' ? 'success' : 'warning';
                                    const burnClass = burnRate >= 90 ? 'danger' : burnRate >= 75 ? 'warning' : 'success';
                                    
                                    return `
                                        <tr>
                                            <td><span class="badge bg-secondary">${activity.activityCode || activity.id}</span></td>
                                            <td>
                                                <strong>${activity.name}</strong><br>
                                                <small class="text-muted">By: ${activity.reportedBy}</small>
                                            </td>
                                            <td>
                                                <small>${indicator ? indicator.code : 'N/A'}</small><br>
                                                <small class="text-muted">${indicator ? indicator.name.substring(0, 40) + '...' : 'N/A'}</small>
                                            </td>
                                            <td>${activity.location}</td>
                                            <td><small>${activity.date}</small></td>
                                            <td><span class="badge bg-${statusClass}">${activity.status}</span></td>
                                            <td><span class="badge bg-${approvalClass}">${activity.approvalStatus}</span></td>
                                            <td>$${activity.budget.toLocaleString()}</td>
                                            <td>$${activity.expenditure.toLocaleString()}</td>
                                            <td>
                                                <div class="progress" style="width: 60px;">
                                                    <div class="progress-bar bg-${burnClass}" 
                                                         role="progressbar" 
                                                         style="width: ${Math.min(burnRate, 100)}%"
                                                         title="${burnRate.toFixed(1)}%">
                                                    </div>
                                                </div>
                                                <small>${burnRate.toFixed(1)}%</small>
                                            </td>
                                            <td>
                                                <span class="badge bg-primary">${totalBeneficiaries}</span><br>
                                                <small class="text-muted">
                                                    M: ${activity.beneficiaries.maleRefugee + activity.beneficiaries.maleHost} | 
                                                    F: ${activity.beneficiaries.femaleRefugee + activity.beneficiaries.femaleHost}
                                                </small>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="viewActivityDetails('${activity.id}')">
                                                    <i class="bi bi-eye"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Disaggregation Summary -->
            <div class="card mt-4">
                <div class="card-header">
                    <h3>Beneficiary Disaggregation Summary</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${data.activities.map(activity => `
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <strong>${activity.name}</strong>
                                    </div>
                                    <div class="card-body">
                                        <h6>Refugee Beneficiaries</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Age Group</th>
                                                        <th>Male</th>
                                                        <th>Female</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${Object.keys(activity.disaggregation.refugee.male).map(ageGroup => {
                                                        const male = activity.disaggregation.refugee.male[ageGroup];
                                                        const female = activity.disaggregation.refugee.female[ageGroup];
                                                        return `
                                                            <tr>
                                                                <td>${ageGroup}</td>
                                                                <td>${male}</td>
                                                                <td>${female}</td>
                                                                <td><strong>${male + female}</strong></td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <h6 class="mt-3">Host Community Beneficiaries</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Age Group</th>
                                                        <th>Male</th>
                                                        <th>Female</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${Object.keys(activity.disaggregation.host.male).map(ageGroup => {
                                                        const male = activity.disaggregation.host.male[ageGroup];
                                                        const female = activity.disaggregation.host.female[ageGroup];
                                                        return `
                                                            <tr>
                                                                <td>${ageGroup}</td>
                                                                <td>${male}</td>
                                                                <td>${female}</td>
                                                                <td><strong>${male + female}</strong></td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        ${activity.nationality ? `
                                            <h6 class="mt-3">Refugee Nationality Breakdown</h6>
                                            <div class="table-responsive">
                                                <table class="table table-sm">
                                                    <tbody>
                                                        <tr>
                                                            <td>Sudanese</td>
                                                            <td><strong>${activity.nationality.sudanese}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Congolese</td>
                                                            <td><strong>${activity.nationality.congolese}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td>South Sudanese</td>
                                                            <td><strong>${activity.nationality.southSudanese}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Others</td>
                                                            <td><strong>${activity.nationality.others}</strong></td>
                                                        </tr>
                                                        <tr class="table-info">
                                                            <td><strong>Total Nationality Count</strong></td>
                                                            <td><strong>${activity.nationality.sudanese + activity.nationality.congolese + activity.nationality.southSudanese + activity.nationality.others}</strong></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}
