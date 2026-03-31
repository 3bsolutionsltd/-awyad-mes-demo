export function renderProjects(data) {
    return `
        <div class="container-fluid">
            <h1 class="mb-4">Projects</h1>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Core Program Components</th>
                                    <th>Donor</th>
                                    <th>Status</th>
                                    <th style="width: 20%;">Budget Burn Rate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.projects.map(project => {
                                    const statusBadgeClass = project.status === 'Active' ? 'bg-success' : 'bg-secondary';
                                    const burnRateClamped = Math.min(project.burnRate, 100);
                                    const burnRateClass = project.burnRate >= 90 ? 'danger' : project.burnRate >= 75 ? 'warning' : 'success';
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <strong>${project.name}</strong><br>
                                                <small class="text-muted">${project.id}</small>
                                            </td>
                                            <td>${(project.components && project.components.length > 0) ? project.components.map(c => `<span class="badge bg-primary me-1">${c.name}</span>`).join(' ') : 'N/A'}</td>
                                            <td>${(project.donors && project.donors.length > 0) ? project.donors.map(d => `<span class="badge bg-info text-dark me-1">${d.name}</span>`).join('') : (project.donor || 'N/A')}</td>
                                            <td>
                                                <span class="badge ${statusBadgeClass}">${project.status}</span>
                                            </td>
                                            <td>
                                                <div class="progress">
                                                    <div class="progress-bar bg-${burnRateClass}" 
                                                         role="progressbar" 
                                                         style="width: ${burnRateClamped}%"
                                                         aria-valuenow="${burnRateClamped}" 
                                                         aria-valuemin="0" 
                                                         aria-valuemax="100">
                                                        ${project.burnRate.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" onclick="viewProjectDashboard('${project.id}')">
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
        </div>
    `;
}
