export function renderCaseManagement(data) {
    const activeCases = data.caseManagement.filter(c => c.status === 'Active');
    const closedCases = data.caseManagement.filter(c => c.status === 'Closed');
    
    return `
        <div class="container-fluid">
            <h1 class="mb-4">Case Management</h1>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">Active Case Load</h6>
                            <h2>${activeCases.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Closed Cases</h6>
                            <h2>${closedCases.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Cases</h6>
                            <h2>${data.caseManagement.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Case Closure Rate</h6>
                            <h2>${((closedCases.length / data.caseManagement.length) * 100).toFixed(1)}%</h2>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Cases -->
            <div class="card mb-4">
                <div class="card-header bg-warning text-white">
                    <h3 class="mb-0">Active Cases</h3>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Case ID</th>
                                    <th>Case Type</th>
                                    <th>Date Opened</th>
                                    <th>Location</th>
                                    <th>Beneficiary</th>
                                    <th>Services Provided</th>
                                    <th>Follow-Up Date</th>
                                    <th>Case Worker</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activeCases.map(caseItem => {
                                    const project = data.projects.find(p => p.id === caseItem.projectId);
                                    const daysOpen = Math.floor((new Date() - new Date(caseItem.dateReported)) / (1000 * 60 * 60 * 24));
                                    const followUpSoon = new Date(caseItem.followUpDate) - new Date() < 7 * 24 * 60 * 60 * 1000;
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <strong>${caseItem.caseNumber}</strong><br>
                                                <small class="text-muted">${project ? project.name : 'N/A'}</small>
                                            </td>
                                            <td><span class="badge bg-danger">${caseItem.type}</span></td>
                                            <td>
                                                ${caseItem.dateReported}<br>
                                                <small class="text-muted">${daysOpen} days ago</small>
                                            </td>
                                            <td>${caseItem.location}</td>
                                            <td>
                                                <strong>${caseItem.beneficiaryGender}, ${caseItem.beneficiaryAge} years</strong><br>
                                                <small class="text-muted">${caseItem.nationality}</small>
                                            </td>
                                            <td>
                                                ${(caseItem.services || []).map(service => 
                                                    `<span class="badge bg-info me-1">${service}</span>`
                                                ).join('')}
                                            </td>
                                            <td>
                                                <span class="${followUpSoon ? 'text-danger fw-bold' : ''}">${caseItem.followUpDate}</span>
                                                ${followUpSoon ? '<br><small class="text-danger">Due Soon!</small>' : ''}
                                            </td>
                                            <td>${caseItem.caseWorker}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary">Update</button>
                                                <button class="btn btn-sm btn-success">Close</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Closed Cases -->
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h3 class="mb-0">Closed Cases</h3>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Case ID</th>
                                    <th>Case Type</th>
                                    <th>Date Opened</th>
                                    <th>Date Closed</th>
                                    <th>Duration</th>
                                    <th>Location</th>
                                    <th>Beneficiary</th>
                                    <th>Services Provided</th>
                                    <th>Case Worker</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${closedCases.map(caseItem => {
                                    const project = data.projects.find(p => p.id === caseItem.projectId);
                                    const duration = Math.floor((new Date(caseItem.dateClosed) - new Date(caseItem.dateReported)) / (1000 * 60 * 60 * 24));
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <strong>${caseItem.caseNumber}</strong><br>
                                                <small class="text-muted">${project ? project.name : 'N/A'}</small>
                                            </td>
                                            <td><span class="badge bg-secondary">${caseItem.type}</span></td>
                                            <td>${caseItem.dateReported}</td>
                                            <td>${caseItem.dateClosed}</td>
                                            <td><strong>${duration} days</strong></td>
                                            <td>${caseItem.location}</td>
                                            <td>
                                                <strong>${caseItem.beneficiaryGender}, ${caseItem.beneficiaryAge} years</strong><br>
                                                <small class="text-muted">${caseItem.nationality}</small>
                                            </td>
                                            <td>
                                                ${(caseItem.services || []).map(service => 
                                                    `<span class="badge bg-info me-1">${service}</span>`
                                                ).join('')}
                                            </td>
                                            <td>${caseItem.caseWorker}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Statistics -->
            <div class="card mt-4">
                <div class="card-header">
                    <h3>Case Statistics by Type</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${(() => {
                            const caseTypes = {};
                            data.caseManagement.forEach(c => {
                                if (!caseTypes[c.caseType]) {
                                    caseTypes[c.caseType] = { total: 0, active: 0, closed: 0 };
                                }
                                caseTypes[c.caseType].total++;
                                if (c.status === 'Active') caseTypes[c.caseType].active++;
                                if (c.status === 'Closed') caseTypes[c.caseType].closed++;
                            });
                            
                            return Object.entries(caseTypes).map(([type, stats]) => `
                                <div class="col-md-4 mb-3">
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">${type}</h5>
                                            <p class="mb-1">Total: <strong>${stats.total}</strong></p>
                                            <p class="mb-1 text-warning">Active: <strong>${stats.active}</strong></p>
                                            <p class="mb-0 text-success">Closed: <strong>${stats.closed}</strong></p>
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                        })()}
                    </div>
                </div>
            </div>
        </div>
    `;
}
