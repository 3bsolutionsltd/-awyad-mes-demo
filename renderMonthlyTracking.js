export function renderMonthlyTracking(data) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Group activities by month (simulated based on date)
    const activitiesByMonth = {};
    months.forEach(month => {
        activitiesByMonth[month] = data.activities.filter(activity => {
            const activityMonth = new Date(activity.date).getMonth();
            return activityMonth === months.indexOf(month);
        });
    });
    
    return `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="bi bi-calendar3"></i> Monthly Activity Breakdown - 2025</h2>
                    <p class="text-muted">Track activities and beneficiaries by month</p>
                </div>
                <div>
                    <button class="btn btn-success" id="export-monthly-btn">
                        <i class="bi bi-file-earmark-excel"></i> Export Monthly Report
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-white bg-primary">
                        <div class="card-body">
                            <h6 class="card-title">Current Month</h6>
                            <h3 class="mb-0">${months[currentMonth]}</h3>
                            <small>${activitiesByMonth[months[currentMonth]].length} Activities</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-success">
                        <div class="card-body">
                            <h6 class="card-title">YTD Activities</h6>
                            <h3 class="mb-0">${data.activities.length}</h3>
                            <small>Total completed</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-info">
                        <div class="card-body">
                            <h6 class="card-title">YTD Beneficiaries</h6>
                            <h3 class="mb-0">${data.activities.reduce((sum, a) => sum + (a.achieved || 0), 0).toLocaleString()}</h3>
                            <small>Individuals reached</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-white bg-warning">
                        <div class="card-body">
                            <h6 class="card-title">YTD Budget Execution</h6>
                            <h3 class="mb-0">$${data.activities.reduce((sum, a) => sum + (a.expenditure || 0), 0).toLocaleString()}</h3>
                            <small>Total expenditure</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Monthly Calendar View -->
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0"><i class="bi bi-calendar-month"></i> 2025 Activity Calendar</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Quarter</th>
                                    ${months.map(m => `<th class="${months[currentMonth] === m ? 'table-primary' : ''}">${m}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td rowspan="4"><strong>Activity Count</strong></td>
                                    ${months.map(month => {
                                        const count = activitiesByMonth[month].length;
                                        const bgClass = count > 2 ? 'table-success' : count > 0 ? 'table-warning' : '';
                                        return `<td class="${bgClass} text-center"><strong>${count}</strong></td>`;
                                    }).join('')}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Quarterly Summary -->
            <div class="row mt-4 mb-4">
                ${[1, 2, 3, 4].map(quarter => {
                    const quarterMonths = months.slice((quarter - 1) * 3, quarter * 3);
                    const quarterActivities = quarterMonths.flatMap(m => activitiesByMonth[m]);
                    const quarterBeneficiaries = quarterActivities.reduce((sum, a) => {
                        if (a.beneficiaries) {
                            return sum + a.beneficiaries.maleRefugee + a.beneficiaries.femaleRefugee + 
                                   a.beneficiaries.maleHost + a.beneficiaries.femaleHost;
                        }
                        return sum;
                    }, 0);
                    const quarterBudget = quarterActivities.reduce((sum, a) => sum + (a.expenditure || 0), 0);
                    
                    return `
                        <div class="col-md-3">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0">Quarter ${quarter}</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-1"><small>Months:</small> <strong>${quarterMonths.join(', ')}</strong></p>
                                    <p class="mb-1"><small>Activities:</small> <strong>${quarterActivities.length}</strong></p>
                                    <p class="mb-1"><small>Beneficiaries:</small> <strong>${quarterBeneficiaries.toLocaleString()}</strong></p>
                                    <p class="mb-0"><small>Budget:</small> <strong>$${quarterBudget.toLocaleString()}</strong></p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Monthly Breakdown Accordion -->
            <div class="card">
                <div class="card-header bg-light">
                    <h5 class="mb-0"><i class="bi bi-list-task"></i> Detailed Monthly Breakdown</h5>
                </div>
                <div class="card-body">
                    <div class="accordion" id="monthlyAccordion">
                        ${months.map((month, idx) => {
                            const monthActivities = activitiesByMonth[month];
                            const monthlyBeneficiaries = monthActivities.reduce((sum, a) => {
                                if (a.beneficiaries) {
                                    return sum + a.beneficiaries.maleRefugee + a.beneficiaries.femaleRefugee + 
                                           a.beneficiaries.maleHost + a.beneficiaries.femaleHost;
                                }
                                return sum;
                            }, 0);
                            const monthlyBudget = monthActivities.reduce((sum, a) => sum + (a.expenditure || 0), 0);
                            const isCurrentMonth = idx === currentMonth;
                            
                            return `
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button ${isCurrentMonth ? '' : 'collapsed'}" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#month${idx}">
                                            <strong>${month} 2025</strong>
                                            <span class="ms-3 badge bg-primary">${monthActivities.length} Activities</span>
                                            <span class="ms-2 badge bg-success">${monthlyBeneficiaries} Beneficiaries</span>
                                            <span class="ms-2 badge bg-info">$${monthlyBudget.toLocaleString()}</span>
                                        </button>
                                    </h2>
                                    <div id="month${idx}" class="accordion-collapse collapse ${isCurrentMonth ? 'show' : ''}" 
                                         data-bs-parent="#monthlyAccordion">
                                        <div class="accordion-body">
                                            ${monthActivities.length > 0 ? `
                                                <div class="table-responsive">
                                                    <table class="table table-sm table-hover">
                                                        <thead class="table-light">
                                                            <tr>
                                                                <th>Activity Code</th>
                                                                <th>Activity Name</th>
                                                                <th>Location</th>
                                                                <th>Refugee</th>
                                                                <th>Host</th>
                                                                <th>Total</th>
                                                                <th>Budget</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${monthActivities.map(activity => {
                                                                const refugeeTotal = (activity.beneficiaries?.maleRefugee || 0) + 
                                                                                    (activity.beneficiaries?.femaleRefugee || 0);
                                                                const hostTotal = (activity.beneficiaries?.maleHost || 0) + 
                                                                                 (activity.beneficiaries?.femaleHost || 0);
                                                                const total = refugeeTotal + hostTotal;
                                                                const statusClass = activity.status === 'Completed' ? 'success' : 'warning';
                                                                
                                                                return `
                                                                    <tr>
                                                                        <td><span class="badge bg-secondary">${activity.activityCode || activity.id}</span></td>
                                                                        <td><small>${activity.name}</small></td>
                                                                        <td><small>${activity.location}</small></td>
                                                                        <td><strong>${refugeeTotal}</strong></td>
                                                                        <td><strong>${hostTotal}</strong></td>
                                                                        <td><strong>${total}</strong></td>
                                                                        <td><small>$${(activity.expenditure || 0).toLocaleString()}</small></td>
                                                                        <td><span class="badge bg-${statusClass}">${activity.status}</span></td>
                                                                    </tr>
                                                                `;
                                                            }).join('')}
                                                            <tr class="table-info">
                                                                <td colspan="3"><strong>Monthly Total</strong></td>
                                                                <td><strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.maleRefugee || 0) + (a.beneficiaries?.femaleRefugee || 0), 0)}</strong></td>
                                                                <td><strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.maleHost || 0) + (a.beneficiaries?.femaleHost || 0), 0)}</strong></td>
                                                                <td><strong>${monthlyBeneficiaries}</strong></td>
                                                                <td><strong>$${monthlyBudget.toLocaleString()}</strong></td>
                                                                <td></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <!-- Disaggregation Summary -->
                                                <div class="mt-3">
                                                    <h6>Monthly Disaggregation Summary</h6>
                                                    <div class="row">
                                                        <div class="col-md-6">
                                                            <div class="card">
                                                                <div class="card-body">
                                                                    <h6 class="card-title">Refugee Beneficiaries</h6>
                                                                    <div class="row">
                                                                        <div class="col-6">
                                                                            <p class="mb-1"><small>Male:</small> <strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.maleRefugee || 0), 0)}</strong></p>
                                                                        </div>
                                                                        <div class="col-6">
                                                                            <p class="mb-1"><small>Female:</small> <strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.femaleRefugee || 0), 0)}</strong></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="card">
                                                                <div class="card-body">
                                                                    <h6 class="card-title">Host Community</h6>
                                                                    <div class="row">
                                                                        <div class="col-6">
                                                                            <p class="mb-1"><small>Male:</small> <strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.maleHost || 0), 0)}</strong></p>
                                                                        </div>
                                                                        <div class="col-6">
                                                                            <p class="mb-1"><small>Female:</small> <strong>${monthActivities.reduce((sum, a) => sum + (a.beneficiaries?.femaleHost || 0), 0)}</strong></p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ` : `
                                                <div class="alert alert-info">
                                                    <i class="bi bi-info-circle"></i> No activities recorded for ${month} 2025
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}
