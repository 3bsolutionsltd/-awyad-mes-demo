/**
 * Project Report Generator
 * Produces a printable M&E project performance report covering:
 *  - Project overview & key metrics
 *  - Indicator performance (target / achieved / variance / % achievement / quarterly)
 *  - Activity tracker (status, dates, location, beneficiaries)
 *  - Beneficiary disaggregation (gender, age, population type, nationality)
 *  - Budget utilization
 *  - Case management summary
 */

import { apiService } from './apiService.js';
import { createModal, showNotification } from './components.js';
import { showViewIndicatorModal } from './indicatorForms.js';
import { showViewActivityModal } from './activityForms.js';

const REPORT_HISTORY_KEY_PREFIX = 'awyad_project_report_history:';

window.openProjectReportIndicator = (indicatorId) => showViewIndicatorModal(indicatorId);
window.openProjectReportActivity = (activityId) => showViewActivityModal(activityId);
window.printProjectReport = async (projectId) => {
    await _printProjectReport(projectId);
};

// ─── helpers ────────────────────────────────────────────────────────────────

function _esc(v) {
    if (v == null) return '';
    const d = document.createElement('div');
    d.textContent = String(v);
    return d.innerHTML;
}

function _num(v, decimals = 0) {
    const n = parseFloat(v);
    if (isNaN(n)) return '0';
    return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function _pct(achieved, target) {
    if (!target || target === 0) return 'N/A';
    return ((achieved / target) * 100).toFixed(1) + '%';
}

function _variance(achieved, target) {
    const v = (parseFloat(achieved) || 0) - (parseFloat(target) || 0);
    return v >= 0 ? `+${_num(v)}` : _num(v);
}

function _varianceClass(achieved, target) {
    if (!target) return '';
    return achieved >= target ? 'text-success' : 'text-danger';
}

function _pctClass(achieved, target) {
    if (!target) return '';
    const p = (achieved / target) * 100;
    if (p >= 100) return 'text-success fw-bold';
    if (p >= 75)  return 'text-primary';
    if (p >= 50)  return 'text-warning';
    return 'text-danger';
}

function _statusBadge(status) {
    const map = {
        'Planned':     'secondary',
        'In Progress': 'primary',
        'Completed':   'success',
        'Cancelled':   'danger',
        'Overdue':     'warning',
    };
    return `<span class="badge bg-${map[status] || 'secondary'}">${_esc(status)}</span>`;
}

function _fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function _fmtCurrency(v, currency = 'UGX') {
    const n = parseFloat(v) || 0;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function _historyKey(projectId) {
    return `${REPORT_HISTORY_KEY_PREFIX}${projectId}`;
}

function _loadReportHistory(projectId) {
    try {
        const raw = localStorage.getItem(_historyKey(projectId));
        const history = raw ? JSON.parse(raw) : [];
        return Array.isArray(history) ? history : [];
    } catch {
        return [];
    }
}

function _saveReportHistory(projectId, history) {
    localStorage.setItem(_historyKey(projectId), JSON.stringify(history.slice(0, 10)));
}

function _recordReportEvent(projectId, type, label = '') {
    if (!projectId) return;
    const history = _loadReportHistory(projectId);
    history.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        label,
        timestamp: new Date().toISOString()
    });
    _saveReportHistory(projectId, history);
}

export function getProjectReportSummary(projectId) {
    const history = _loadReportHistory(projectId);
    const lastViewed = history.find(item => item.type === 'viewed');
    const lastPrinted = history.find(item => item.type === 'printed');
    return {
        totalEvents: history.length,
        lastViewed,
        lastPrinted,
        recentHistory: history.slice(0, 3)
    };
}

function _historySection(projectId) {
    const history = _loadReportHistory(projectId);
    if (history.length === 0) {
        return `<div class="alert alert-info mb-0">No report history yet. Open or print this report to start tracking activity.</div>`;
    }

    const rows = history.map(item => `
        <tr>
            <td><span class="badge bg-${item.type === 'printed' ? 'secondary' : 'info'} text-uppercase">${_esc(item.type)}</span></td>
            <td>${_esc(item.label || 'Project report')}</td>
            <td>${new Date(item.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');

    return `
        <div class="table-responsive">
            <table class="table table-sm table-bordered mb-0 report-table">
                <thead class="table-light">
                    <tr>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

// ─── section renderers ──────────────────────────────────────────────────────

function _coverPage(project, generatedAt) {
    const daysLeft = project.end_date
        ? Math.max(0, Math.round((new Date(project.end_date) - new Date()) / 86400000))
        : null;

    return `
    <div class="report-cover mb-4 p-4 border rounded bg-white">
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <div class="text-muted small mb-1 text-uppercase fw-bold">Project Performance Report</div>
                <h2 class="mb-1">${_esc(project.name)}</h2>
                ${project.donor ? `<div class="text-muted">Donor: <strong>${_esc(project.donor)}</strong></div>` : ''}
            </div>
            <div class="text-end small text-muted">
                <div>Generated: ${_fmtDate(generatedAt)}</div>
                <div>By: ${_esc(project._reportedBy || 'M&E Officer')}</div>
            </div>
        </div>
        <hr>
        <div class="row g-3 mt-1">
            <div class="col-6 col-md-3">
                <div class="p-3 border rounded text-center">
                    <div class="small text-muted">Start Date</div>
                    <div class="fw-bold">${_fmtDate(project.start_date)}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border rounded text-center">
                    <div class="small text-muted">End Date</div>
                    <div class="fw-bold">${_fmtDate(project.end_date)}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border rounded text-center">
                    <div class="small text-muted">Status</div>
                    <div class="fw-bold">${_esc(project.status || '—')}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="p-3 border rounded text-center">
                    <div class="small text-muted">Days Remaining</div>
                    <div class="fw-bold ${daysLeft !== null && daysLeft < 30 ? 'text-danger' : ''}">${daysLeft !== null ? daysLeft : '—'}</div>
                </div>
            </div>
        </div>
        ${project.description ? `<div class="mt-3 small text-muted"><strong>Description:</strong> ${_esc(project.description)}</div>` : ''}
        ${project.location ? `<div class="mt-1 small text-muted"><strong>Location:</strong> ${_esc(project.location)}</div>` : ''}
    </div>`;
}

function _indicatorSection(indicators) {
    if (!indicators || indicators.length === 0) {
        return `<div class="alert alert-info">No indicators recorded for this project.</div>`;
    }

    const rows = indicators.map(ind => {
        const target   = parseFloat(ind.lop_target || ind.annual_target || ind.target || 0);
        const achieved = parseFloat(ind.achieved || 0);
        const q1t = parseFloat(ind.q1_target || 0);
        const q2t = parseFloat(ind.q2_target || 0);
        const q3t = parseFloat(ind.q3_target || 0);
        const q4t = parseFloat(ind.q4_target || 0);
        const q1a = parseFloat(ind.q1_achieved || 0);
        const q2a = parseFloat(ind.q2_achieved || 0);
        const q3a = parseFloat(ind.q3_achieved || 0);
        const q4a = parseFloat(ind.q4_achieved || 0);

        return `
        <tr>
            <td class="small">
                <button class="btn btn-link p-0 text-start text-decoration-none no-print" onclick="openProjectReportIndicator('${ind.id}')">
                    ${_esc(ind.name)}
                </button>
                <span class="d-none d-print-inline">${_esc(ind.name)}</span>
            </td>
            <td class="text-center small">${_esc(ind.indicator_level || '—')}</td>
            <td class="text-center">${_num(parseFloat(ind.baseline || 0))}</td>
            <td class="text-center">${_num(target)}</td>
            <td class="text-center">${_num(achieved)}</td>
            <td class="text-center ${_varianceClass(achieved, target)}">${_variance(achieved, target)}</td>
            <td class="text-center ${_pctClass(achieved, target)}">${_pct(achieved, target)}</td>
            <td class="text-center small">
                ${q1t || q1a ? `Q1: ${_num(q1a)}/${_num(q1t)}` : '—'}
            </td>
            <td class="text-center small">
                ${q2t || q2a ? `Q2: ${_num(q2a)}/${_num(q2t)}` : '—'}
            </td>
            <td class="text-center small">
                ${q3t || q3a ? `Q3: ${_num(q3a)}/${_num(q3t)}` : '—'}
            </td>
            <td class="text-center small">
                ${q4t || q4a ? `Q4: ${_num(q4a)}/${_num(q4t)}` : '—'}
            </td>
        </tr>`;
    }).join('');

    // Summary bar
    const totalTargets  = indicators.reduce((s, i) => s + parseFloat(i.lop_target || i.annual_target || i.target || 0), 0);
    const totalAchieved = indicators.reduce((s, i) => s + parseFloat(i.achieved || 0), 0);
    const onTrack  = indicators.filter(i => parseFloat(i.achieved || 0) >= parseFloat(i.lop_target || i.annual_target || i.target || 0) * 0.75).length;
    const atRisk   = indicators.filter(i => { const p = parseFloat(i.lop_target || i.annual_target || i.target || 0); return p > 0 && parseFloat(i.achieved || 0) / p < 0.75; }).length;

    return `
    <div class="row g-3 mb-3">
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold">${indicators.length}</div><div class="small text-muted">Total Indicators</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold text-success">${onTrack}</div><div class="small text-muted">On Track (≥75%)</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold text-danger">${atRisk}</div><div class="small text-muted">At Risk (&lt;75%)</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold ${_pctClass(totalAchieved, totalTargets)}">${_pct(totalAchieved, totalTargets)}</div>
            <div class="small text-muted">Overall Achievement</div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-sm report-table">
            <thead class="table-dark">
                <tr>
                    <th>Indicator</th>
                    <th class="text-center">Level</th>
                    <th class="text-center">Baseline</th>
                    <th class="text-center">Target</th>
                    <th class="text-center">Achieved</th>
                    <th class="text-center">Variance</th>
                    <th class="text-center">% Achievement</th>
                    <th class="text-center">Q1</th>
                    <th class="text-center">Q2</th>
                    <th class="text-center">Q3</th>
                    <th class="text-center">Q4</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function _activitySection(activities) {
    if (!activities || activities.length === 0) {
        return `<div class="alert alert-info">No activities recorded for this project.</div>`;
    }

    const byStatus = {};
    activities.forEach(a => {
        const s = a.status || 'Unknown';
        byStatus[s] = (byStatus[s] || 0) + 1;
    });

    const statusSummary = Object.entries(byStatus)
        .map(([s, c]) => `<span class="me-3">${_statusBadge(s)} ${c}</span>`)
        .join('');

    const completed  = activities.filter(a => a.status === 'Completed').length;
    const inProgress = activities.filter(a => a.status === 'In Progress').length;
    const planned    = activities.filter(a => a.status === 'Planned').length;
    const compRate   = activities.length ? ((completed / activities.length) * 100).toFixed(1) : 0;

    const rows = activities.map(a => {
        const benef = parseInt(a.total_beneficiaries) || 0;
        return `
        <tr>
            <td class="small">
                <button class="btn btn-link p-0 text-start text-decoration-none no-print" onclick="openProjectReportActivity('${a.id}')">
                    ${_esc(a.activity_name || a.name || '—')}
                </button>
                <span class="d-none d-print-inline">${_esc(a.activity_name || a.name || '—')}</span>
            </td>
            <td class="text-center">${_statusBadge(a.status)}</td>
            <td class="text-center small">${_fmtDate(a.planned_date)}</td>
            <td class="text-center small">${a.completion_date ? _fmtDate(a.completion_date) : '—'}</td>
            <td class="small">${_esc(a.location || '—')}</td>
            <td class="text-center">${_num(benef)}</td>
            <td class="text-center small">${_esc(a.indicator_name || '—')}</td>
        </tr>`;
    }).join('');

    return `
    <div class="row g-3 mb-3">
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold">${activities.length}</div><div class="small text-muted">Total Activities</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold text-success">${completed}</div><div class="small text-muted">Completed</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold text-primary">${inProgress}</div><div class="small text-muted">In Progress</div>
        </div>
        <div class="col-3 text-center p-2 border rounded">
            <div class="fs-4 fw-bold text-secondary">${planned}</div><div class="small text-muted">Planned</div>
        </div>
    </div>
    <div class="mb-2 small">${statusSummary} &nbsp; <strong>Completion Rate: ${compRate}%</strong></div>
    <div class="table-responsive">
        <table class="table table-bordered table-sm report-table">
            <thead class="table-dark">
                <tr>
                    <th>Activity Name</th>
                    <th class="text-center">Status</th>
                    <th class="text-center">Planned Date</th>
                    <th class="text-center">Completion Date</th>
                    <th>Location</th>
                    <th class="text-center">Beneficiaries</th>
                    <th>Linked Indicator</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function _beneficiarySection(activities) {
    if (!activities || activities.length === 0) {
        return `<div class="alert alert-info">No beneficiary data available.</div>`;
    }

    const sum = (field) => activities.reduce((s, a) => s + (parseInt(a[field]) || 0), 0);

    const directM  = sum('direct_male');
    const directF  = sum('direct_female');
    const directO  = sum('direct_other');
    const indirectM = sum('indirect_male');
    const indirectF = sum('indirect_female');
    const indirectO = sum('indirect_other');

    const totalDirect   = directM + directF + directO;
    const totalIndirect = indirectM + indirectF + indirectO;
    const totalBenef    = activities.reduce((s, a) => s + (parseInt(a.total_beneficiaries) || 0), 0);

    // Age disaggregation
    const age0_4M   = sum('age_0_4_male');   const age0_4F   = sum('age_0_4_female');
    const age5_17M  = sum('age_5_17_male');  const age5_17F  = sum('age_5_17_female');
    const age18_49M = sum('age_18_49_male'); const age18_49F = sum('age_18_49_female');
    const age50pM   = sum('age_50_plus_male');const age50pF   = sum('age_50_plus_female');

    const totAge0_4   = age0_4M   + age0_4F;
    const totAge5_17  = age5_17M  + age5_17F;
    const totAge18_49 = age18_49M + age18_49F;
    const totAge50p   = age50pM   + age50pF;

    // Population type
    const refugees  = sum('refugees');
    const nationals = sum('nationals');
    const idps      = sum('idps');
    const returnees = sum('returnees');
    const pwdsM = sum('pwds_male'); const pwdsF = sum('pwds_female');
    const totalPwds = pwdsM + pwdsF;

    return `
    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <h6 class="fw-bold">Direct vs. Indirect Reach</h6>
            <table class="table table-bordered table-sm">
                <thead class="table-light"><tr><th>Category</th><th class="text-center">Male</th><th class="text-center">Female</th><th class="text-center">Other</th><th class="text-center">Total</th></tr></thead>
                <tbody>
                    <tr><td>Direct</td><td class="text-center">${_num(directM)}</td><td class="text-center">${_num(directF)}</td><td class="text-center">${_num(directO)}</td><td class="text-center fw-bold">${_num(totalDirect)}</td></tr>
                    <tr><td>Indirect</td><td class="text-center">${_num(indirectM)}</td><td class="text-center">${_num(indirectF)}</td><td class="text-center">${_num(indirectO)}</td><td class="text-center fw-bold">${_num(totalIndirect)}</td></tr>
                    <tr class="table-secondary fw-bold"><td>Total</td><td class="text-center">${_num(directM+indirectM)}</td><td class="text-center">${_num(directF+indirectF)}</td><td class="text-center">${_num(directO+indirectO)}</td><td class="text-center">${_num(totalBenef)}</td></tr>
                </tbody>
            </table>
        </div>
        <div class="col-md-6">
            <h6 class="fw-bold">Population Type</h6>
            <table class="table table-bordered table-sm">
                <thead class="table-light"><tr><th>Type</th><th class="text-center">Count</th><th class="text-center">%</th></tr></thead>
                <tbody>
                    ${[['Refugees', refugees], ['Nationals/Host Community', nationals], ['IDPs', idps], ['Returnees', returnees]].map(([label, count]) =>
                        `<tr><td>${label}</td><td class="text-center">${_num(count)}</td><td class="text-center">${totalBenef ? ((count/totalBenef)*100).toFixed(1)+'%' : '—'}</td></tr>`
                    ).join('')}
                </tbody>
            </table>
        </div>
    </div>
    <div class="row g-3">
        <div class="col-md-6">
            <h6 class="fw-bold">Age Disaggregation</h6>
            <table class="table table-bordered table-sm">
                <thead class="table-light"><tr><th>Age Group</th><th class="text-center">Male</th><th class="text-center">Female</th><th class="text-center">Total</th></tr></thead>
                <tbody>
                    <tr><td>0–4 years</td><td class="text-center">${_num(age0_4M)}</td><td class="text-center">${_num(age0_4F)}</td><td class="text-center">${_num(totAge0_4)}</td></tr>
                    <tr><td>5–17 years</td><td class="text-center">${_num(age5_17M)}</td><td class="text-center">${_num(age5_17F)}</td><td class="text-center">${_num(totAge5_17)}</td></tr>
                    <tr><td>18–49 years</td><td class="text-center">${_num(age18_49M)}</td><td class="text-center">${_num(age18_49F)}</td><td class="text-center">${_num(totAge18_49)}</td></tr>
                    <tr><td>50+ years</td><td class="text-center">${_num(age50pM)}</td><td class="text-center">${_num(age50pF)}</td><td class="text-center">${_num(totAge50p)}</td></tr>
                    <tr class="table-secondary fw-bold"><td>Total</td><td class="text-center">${_num(age0_4M+age5_17M+age18_49M+age50pM)}</td><td class="text-center">${_num(age0_4F+age5_17F+age18_49F+age50pF)}</td><td class="text-center">${_num(totAge0_4+totAge5_17+totAge18_49+totAge50p)}</td></tr>
                </tbody>
            </table>
        </div>
        <div class="col-md-6">
            <h6 class="fw-bold">Persons with Disabilities (PWDs)</h6>
            <table class="table table-bordered table-sm">
                <thead class="table-light"><tr><th>Category</th><th class="text-center">Male</th><th class="text-center">Female</th><th class="text-center">Total</th></tr></thead>
                <tbody>
                    <tr><td>PWDs</td><td class="text-center">${_num(pwdsM)}</td><td class="text-center">${_num(pwdsF)}</td><td class="text-center fw-bold">${_num(totalPwds)}</td></tr>
                    <tr><td>% of total beneficiaries</td><td colspan="3" class="text-center">${totalBenef ? ((totalPwds/totalBenef)*100).toFixed(1)+'%' : '—'}</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

function _budgetSection(financials, project) {
    if (!financials) return `<div class="alert alert-info">No financial data available.</div>`;

    const budget    = parseFloat(financials.total_available || project.budget || 0);
    const spent     = parseFloat(financials.expenditure || project.expenditure || 0);
    const balance   = budget - spent;
    const burnRate  = budget > 0 ? ((spent / budget) * 100).toFixed(1) : '0';
    const burnColor = parseFloat(burnRate) > 100 ? 'danger' : parseFloat(burnRate) > 90 ? 'warning' : 'success';
    const currency  = project.currency || 'UGX';

    return `
    <div class="row g-3 mb-3">
        <div class="col-md-3 text-center p-3 border rounded">
            <div class="small text-muted">Original Budget</div>
            <div class="fw-bold">${_fmtCurrency(project.budget, currency)}</div>
        </div>
        <div class="col-md-3 text-center p-3 border rounded">
            <div class="small text-muted">Total Available (after transfers)</div>
            <div class="fw-bold">${_fmtCurrency(budget, currency)}</div>
        </div>
        <div class="col-md-3 text-center p-3 border rounded">
            <div class="small text-muted">Expenditure to Date</div>
            <div class="fw-bold text-danger">${_fmtCurrency(spent, currency)}</div>
        </div>
        <div class="col-md-3 text-center p-3 border rounded">
            <div class="small text-muted">Available Balance</div>
            <div class="fw-bold text-${balance >= 0 ? 'success' : 'danger'}">${_fmtCurrency(balance, currency)}</div>
        </div>
    </div>
    <div class="mb-2">
        <span class="small fw-bold me-2">Burn Rate: ${burnRate}%</span>
        <div class="progress" style="height:20px;">
            <div class="progress-bar bg-${burnColor}" style="width:${Math.min(parseFloat(burnRate),100)}%">${burnRate}%</div>
        </div>
    </div>
    ${financials.transfers_in || financials.transfers_out ? `
    <div class="row g-3 mt-1">
        <div class="col-md-6 p-2 border rounded">
            <span class="small text-muted">Transfers In:</span>
            <span class="fw-bold text-success ms-2">${_fmtCurrency(financials.transfers_in || 0, currency)}</span>
        </div>
        <div class="col-md-6 p-2 border rounded">
            <span class="small text-muted">Transfers Out:</span>
            <span class="fw-bold text-danger ms-2">${_fmtCurrency(financials.transfers_out || 0, currency)}</span>
        </div>
    </div>` : ''}`;
}

function _caseSection(cases) {
    const stats = cases?.stats || {};
    if (!stats.total_cases) return `<div class="alert alert-info">No case management data linked to this project.</div>`;

    return `
    <div class="row g-3">
        <div class="col-3 text-center p-3 border rounded">
            <div class="fs-4 fw-bold">${_num(stats.total_cases || 0)}</div><div class="small text-muted">Total Cases</div>
        </div>
        <div class="col-3 text-center p-3 border rounded">
            <div class="fs-4 fw-bold text-success">${_num(stats.active || 0)}</div><div class="small text-muted">Active</div>
        </div>
        <div class="col-3 text-center p-3 border rounded">
            <div class="fs-4 fw-bold text-primary">${_num(stats.closed || 0)}</div><div class="small text-muted">Closed</div>
        </div>
        <div class="col-3 text-center p-3 border rounded">
            <div class="fs-4 fw-bold text-warning">${_num(stats.pending || 0)}</div><div class="small text-muted">Pending</div>
        </div>
    </div>`;
}

function _section(title, icon, content) {
    return `
    <div class="report-section mb-4">
        <div class="report-section-header d-flex align-items-center mb-3 pb-1 border-bottom border-2 border-primary">
            <i class="bi ${icon} fs-5 text-primary me-2"></i>
            <h5 class="mb-0">${title}</h5>
        </div>
        ${content}
    </div>`;
}

async function _loadProjectReportData(projectId) {
    const [projRes, finRes, indRes, actRes, caseRes] = await Promise.all([
        apiService.get(`/projects/${projectId}`),
        apiService.get(`/projects/${projectId}/financials`).catch(() => ({ success: false })),
        apiService.get(`/projects/${projectId}/indicators`).catch(() => ({ success: false })),
        apiService.get(`/projects/${projectId}/activities`).catch(() => ({ success: false })),
        apiService.get(`/projects/${projectId}/cases`).catch(() => ({ success: false })),
    ]);

    return {
        project: projRes.data || projRes,
        financials: finRes.success ? finRes.data : null,
        indicators: indRes.success ? (Array.isArray(indRes.data) ? indRes.data : []) : [],
        activities: actRes.success ? (Array.isArray(actRes.data) ? actRes.data : []) : [],
        cases: caseRes.success ? caseRes.data : {},
    };
}

function _buildProjectReportHtml({ project, financials, indicators, activities, cases, generatedAt }) {
    return `
        <style>
            .report-table { font-size: 0.8rem; }
            .report-section-header { border-bottom-width: 2px !important; }
            .table-responsive {
                overflow: visible !important;
                display: block !important;
                width: 100% !important;
            }
            @media print {
                .no-print { display: none !important; }
                .report-page { padding: 0 !important; }
                .report-section { page-break-inside: avoid; }
            }
        </style>
        ${_coverPage(project, generatedAt)}
        ${_section('1. Indicator Performance', 'bi-graph-up-arrow', _indicatorSection(indicators))}
        ${_section('2. Activity Tracker', 'bi-calendar-check', _activitySection(activities))}
        ${_section('3. Beneficiary Disaggregation', 'bi-people', _beneficiarySection(activities))}
        ${_section('4. Budget Utilization', 'bi-cash-stack', _budgetSection(financials, project))}
        ${_section('5. Case Management Summary', 'bi-briefcase', _caseSection(cases))}
        <div class="text-muted small text-end mt-4 pt-2 border-top">
            Report generated on ${generatedAt.toLocaleString()} &mdash; AWYAD MES
        </div>`;
}

async function _renderProjectReportContent(projectId) {
    const data = await _loadProjectReportData(projectId);
    return _buildProjectReportHtml({ ...data, generatedAt: new Date() });
}

async function _printProjectReport(projectId) {
    _recordReportEvent(projectId, 'printed', 'Saved/printed report');

    const data = await _loadProjectReportData(projectId);
    const content = _buildProjectReportHtml({ ...data, generatedAt: new Date() });

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
        throw new Error('Unable to open print window');
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body {
            font-size: 12px;
            color: #212529;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        .report-page {
            padding: 0;
            background: #fff;
        }
        .container-fluid {
            max-width: 100% !important;
            width: 100% !important;
        }
        .no-print {
            display: none !important;
        }
        .report-cover,
        .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .report-table {
            font-size: 0.75rem;
        }
        .table {
            width: 100% !important;
        }
        .table-responsive {
            overflow: visible !important;
            display: block !important;
            width: 100% !important;
        }
        .badge, .progress-bar {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .btn, .nav, .alert button {
            display: none !important;
        }
        .btn-link {
            display: inline !important;
            padding: 0 !important;
            border: 0 !important;
            background: transparent !important;
            color: inherit !important;
            text-decoration: none !important;
        }
        a {
            color: inherit;
            text-decoration: none;
            pointer-events: none;
        }
        .container-fluid {
            max-width: 100% !important;
        }
        .border {
            border-color: #dee2e6 !important;
        }
        .bg-white {
            background: #fff !important;
        }
    </style>
</head>
<body>
    <div class="container-fluid py-3">
        ${content}
    </div>
    <script>
        window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 300);
        };
    <\/script>
</body>
</html>`);
    printWindow.document.close();
}

export async function renderProjectReportPage(projectId) {
    if (!projectId) {
        return `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle fs-1"></i>
                <h4 class="mt-3">Select a Project</h4>
                <p>Please select a project from the dashboard dropdown to view its report.</p>
            </div>
        `;
    }

    try {
        _recordReportEvent(projectId, 'viewed', 'Opened report page');
        const content = await _renderProjectReportContent(projectId);
        const historySummary = getProjectReportSummary(projectId);
        return `
            <div class="report-page container-fluid py-3">
                <div class="d-flex justify-content-between align-items-center mb-3 no-print">
                    <div>
                        <h3 class="mb-0"><i class="bi bi-file-earmark-bar-graph me-2"></i>Project Report</h3>
                        <div class="text-muted small">Detailed performance view with indicators, activities, beneficiaries, and finance</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary" onclick="window.location.hash='project-dashboard?id=${projectId}'">
                            <i class="bi bi-arrow-left me-1"></i>Back to Dashboard
                        </button>
                        <button class="btn btn-outline-primary" onclick="window.printProjectReport('${projectId}')">
                            <i class="bi bi-printer me-1"></i>Print / Save as PDF
                        </button>
                    </div>
                </div>
                <div class="bg-white border rounded p-3">
                    ${content}
                </div>
                <div class="mt-4 no-print">
                    ${_section('6. Report History', 'bi-clock-history', _historySection(projectId))}
                </div>
            </div>
        `;
    } catch (err) {
        return `
            <div class="alert alert-danger">
                <h4><i class="bi bi-exclamation-triangle"></i> Failed to generate report</h4>
                <p>${_esc(err.message)}</p>
                <button class="btn btn-outline-danger" onclick="window.location.hash='project-dashboard?id=${projectId}'">
                    <i class="bi bi-arrow-left me-1"></i>Back to Dashboard
                </button>
            </div>
        `;
    }
}

// ─── main export ────────────────────────────────────────────────────────────

export async function showProjectReport(projectId) {
    const id = 'projectReportModal';
    document.getElementById(id)?.remove();

    // Skeleton loader
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="${id}" tabindex="-1">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-file-earmark-bar-graph me-2"></i>Project Report</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="reportBody">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <div class="mt-2 text-muted">Generating report…</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-outline-primary" id="reportPrintBtn">
                            <i class="bi bi-printer me-1"></i>Print / Save as PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>`);

    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();

    document.getElementById('reportPrintBtn').addEventListener('click', () => _printProjectReport(projectId));
    document.getElementById(id).addEventListener('hidden.bs.modal', function () { this.remove(); });

    try {
        _recordReportEvent(projectId, 'viewed', 'Opened report modal');
        document.getElementById('reportBody').innerHTML = await _renderProjectReportContent(projectId);

    } catch (err) {
        document.getElementById('reportBody').innerHTML =
            `<div class="alert alert-danger">Failed to generate report: ${_esc(err.message)}</div>`;
        showNotification(`Report generation failed: ${err.message}`, 'danger');
    }
}

