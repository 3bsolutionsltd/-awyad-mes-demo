/**
 * RBM Dashboard — front-end controller
 * Vanilla JS, no framework. Loads from <script src="/js/rbm-dashboard.js">
 */
(function () {
  'use strict';

  const API = '/api/v1/rbm';

  /* ── Auth helpers ─────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem('awyad_access_token') || sessionStorage.getItem('awyad_access_token');
  }

  function authHeaders() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
  }

  async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
    if (res.status === 401) { window.location.href = '/login.html'; return null; }
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  /* ── Utilities ───────────────────────────────────────────── */
  function statusClass(achievement) {
    if (achievement === null || achievement === undefined) return 'status-not-started';
    if (achievement >= 80) return 'status-on-track';
    if (achievement >= 50) return 'status-at-risk';
    return 'status-off-track';
  }

  function resultLevelBadge(level) {
    const cls = {
      impact: 'badge-impact',
      outcome: 'badge-outcome',
      output: 'badge-output',
    };
    return `<span class="badge result-level-badge ${cls[level] || 'bg-secondary'}">${level || '—'}</span>`;
  }

  function formatValue(value, dataType, unit) {
    if (value == null) return '—';
    const n = Number(value).toLocaleString();
    if (dataType === 'percentage') return `${n}%`;
    if (unit) return `${n} ${unit}`;
    return n;
  }

  function progressHtml(achievement) {
    if (achievement === null || achievement === undefined) {
      return '<span class="text-muted small">N/A</span>';
    }
    const pct = Math.min(achievement, 100);
    const barCls = achievement >= 80 ? 'bg-on-track' : achievement >= 50 ? 'bg-at-risk' : 'bg-off-track';
    return `
      <div class="achievement-bar d-flex align-items-center gap-2">
        <div class="progress flex-grow-1">
          <div class="progress-bar ${barCls}" style="width:${pct}%" role="progressbar"
               aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <span class="achievement-label ${statusClass(achievement)} fw-semibold" style="min-width:3rem;text-align:right">
          ${achievement.toFixed(1)}%
        </span>
      </div>`;
  }

  /* ── State ───────────────────────────────────────────────── */
  const state = {
    indicators: [],
    filtered: [],
    page: 1,
    pageSize: 15,
    levelFilter: '',
    searchQuery: '',
    activePillarId: null,
  };

  /* ── Render KPIs ─────────────────────────────────────────── */
  function renderKPIs(summary) {
    document.getElementById('kpiTotal').textContent = summary.totalIndicators ?? '—';
    document.getElementById('kpiOnTrack').textContent = summary.onTrack ?? '—';
    document.getElementById('kpiAtRisk').textContent = summary.atRisk ?? '—';
    document.getElementById('kpiOffTrack').textContent = summary.offTrack ?? '—';

    const badge = document.getElementById('pendingBadge');
    if (summary.pendingValidations > 0) {
      badge.textContent = summary.pendingValidations;
      badge.style.display = '';
    }
  }

  /* ── Render Pillar Tabs ──────────────────────────────────── */
  function renderPillarTabs(pillars) {
    const container = document.getElementById('pillarTabs');
    container.innerHTML = '';

    // "All" tab
    const allBtn = document.createElement('button');
    allBtn.className = 'list-group-item list-group-item-action active small py-2';
    allBtn.textContent = 'All Pillars';
    allBtn.dataset.pillarId = '';
    allBtn.addEventListener('click', () => selectPillar(null, allBtn));
    container.appendChild(allBtn);

    pillars.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'list-group-item list-group-item-action small py-2';
      btn.textContent = p.name || p.title || `Pillar ${p.id}`;
      btn.dataset.pillarId = p.id;
      btn.addEventListener('click', () => selectPillar(p.id, btn));
      container.appendChild(btn);
    });
  }

  function selectPillar(pillarId, clickedBtn) {
    state.activePillarId = pillarId;
    state.page = 1;
    document.querySelectorAll('#pillarTabs .list-group-item').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');
    loadIndicators();
  }

  /* ── Render Indicator Table ──────────────────────────────── */
  function applyFilters() {
    const q = state.searchQuery.toLowerCase();
    state.filtered = state.indicators.filter(ind => {
      const levelOk = !state.levelFilter || ind.result_level === state.levelFilter;
      const searchOk = !q || (ind.name || '').toLowerCase().includes(q) ||
                       (ind.code || '').toLowerCase().includes(q);
      return levelOk && searchOk;
    });
  }

  function renderTable() {
    applyFilters();
    const tbody = document.getElementById('indicatorTableBody');
    const start = (state.page - 1) * state.pageSize;
    const slice = state.filtered.slice(start, start + state.pageSize);

    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <i class="bi bi-bar-chart"></i>
        <p>No indicators match your filters.</p>
      </div></td></tr>`;
      document.getElementById('tableFooterInfo').textContent = '0 indicators';
      document.getElementById('tablePagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = slice.map(ind => {
      const achievement = ind.achievementRate ?? null;
      const actual   = formatValue(ind.actualValue,    ind.data_type, ind.unit_of_measure);
      const target   = formatValue(ind.target_value,   ind.data_type, ind.unit_of_measure);
      const baseline = formatValue(ind.baseline_value, ind.data_type, ind.unit_of_measure);
      return `
        <tr class="result-level-${ind.result_level || ''}">
          <td>
            <div class="fw-semibold small">${escHtml(ind.name || '—')}</div>
            ${ind.code ? `<div class="text-muted" style="font-size:.7rem">${escHtml(ind.code)}</div>` : ''}
          </td>
          <td>${resultLevelBadge(ind.result_level)}</td>
          <td class="text-end small">${baseline}</td>
          <td class="text-end small">${target}</td>
          <td class="text-end small fw-semibold">${actual}</td>
          <td>${progressHtml(achievement)}</td>
          <td class="no-print">
            <button class="btn btn-outline-secondary btn-sm" onclick="RBMDashboard.showDetail('${ind.id}')">
              <i class="bi bi-eye"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    const total = state.filtered.length;
    document.getElementById('tableFooterInfo').textContent =
      `Showing ${start + 1}–${Math.min(start + state.pageSize, total)} of ${total} indicator${total !== 1 ? 's' : ''}`;

    renderPagination(total);
  }

  function renderPagination(total) {
    const pages = Math.ceil(total / state.pageSize);
    const container = document.getElementById('tablePagination');
    if (pages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    const cur = state.page;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - cur) <= 1) {
        html += `<button class="btn btn-sm ${i === cur ? 'btn-primary' : 'btn-outline-secondary'}"
                   onclick="RBMDashboard.goPage(${i})">${i}</button>`;
      } else if (Math.abs(i - cur) === 2) {
        html += `<span class="btn btn-sm disabled">…</span>`;
      }
    }
    container.innerHTML = html;
  }

  /* ── Pending Validations mini-list ───────────────────────── */
  function renderPendingValidations(items) {
    const list = document.getElementById('pendingValidationsList');
    if (!items || items.length === 0) {
      list.innerHTML = '<li class="list-group-item text-center text-muted small py-3">No pending validations</li>';
      return;
    }
    list.innerHTML = items.slice(0, 5).map(v => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-2">
        <div>
          <div class="small fw-semibold">${escHtml(v.indicator_name || v.indicatorName || '—')}</div>
          <div class="text-muted" style="font-size:.72rem">${escHtml(v.project_name || v.projectName || '')}</div>
        </div>
        <span class="badge badge-pending">pending</span>
      </li>`).join('');
  }

  /* ── Load functions ──────────────────────────────────────── */
  async function loadDashboardSummary() {
    try {
      const data = await apiFetch('/dashboard/summary');
      if (data) renderKPIs(data);
    } catch (e) {
      console.error('Failed to load dashboard summary', e);
    }
  }

  async function loadIndicators() {
    const tbody = document.getElementById('indicatorTableBody');
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…
    </td></tr>`;

    try {
      let data;
      if (state.activePillarId) {
        data = await apiFetch(`/aggregation/pillar/${state.activePillarId}`);
        state.indicators = (data && data.indicators) ? data.indicators : [];
      } else {
        data = await apiFetch('/organizational-indicators');
        state.indicators = Array.isArray(data) ? data : (data && data.indicators ? data.indicators : []);
      }
      renderTable();
    } catch (e) {
      console.error('Failed to load indicators', e);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger small py-3">
        <i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}
      </td></tr>`;
    }
  }

  async function loadPillars() {
    try {
      const data = await apiFetch('/aggregation/pillar/all').catch(() => null);
      // Fallback: try the general pillars API
      const pillarsData = data || await fetch('/api/v1/pillars', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : null).catch(() => null);

      const pillars = Array.isArray(pillarsData) ? pillarsData
        : (pillarsData && Array.isArray(pillarsData.pillars)) ? pillarsData.pillars
        : (pillarsData && Array.isArray(pillarsData.data)) ? pillarsData.data
        : [];
      renderPillarTabs(pillars);
    } catch (e) {
      console.error('Failed to load pillars', e);
      document.getElementById('pillarTabs').innerHTML =
        '<div class="p-3 text-muted small">Could not load pillars</div>';
    }
  }

  async function loadPendingValidations() {
    try {
      const data = await apiFetch('/indicator-values?status=pending&limit=5').catch(() => null);
      const items = Array.isArray(data) ? data : (data && data.items ? data.items : []);
      renderPendingValidations(items);
    } catch (e) {
      console.error('Failed to load pending validations', e);
    }
  }

  /* ── Thematic Dashboard ──────────────────────────────────── */
  let _thematicLoaded = false;

  async function loadThematicDashboard(forceReload) {
    if (_thematicLoaded && !forceReload) return;
    const container = document.getElementById('thematicCardsRow');
    if (!container) return;
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading thematic performance data…</div>';
    try {
      // Fetch thematic areas and all org indicators in parallel
      const [taRes, indRes] = await Promise.all([
        fetch('/api/v1/thematic-areas', { headers: authHeaders() }),
        fetch('/api/v1/rbm/organizational-indicators', { headers: authHeaders() }),
      ]);
      if (!taRes.ok) throw new Error(`Thematic areas: HTTP ${taRes.status}`);
      const taRaw  = await taRes.json();
      const indRaw = indRes.ok ? await indRes.json() : { data: [] };

      const areas   = Array.isArray(taRaw)  ? taRaw  : (taRaw?.data  || taRaw?.thematicAreas || []);
      const allInds = Array.isArray(indRaw) ? indRaw : (indRaw?.data || []);

      if (!areas.length) {
        container.innerHTML = '<div class="col-12 text-muted text-center py-4"><i class="bi bi-layers display-4 d-block mb-2 opacity-25"></i>No thematic areas configured.</div>';
        _thematicLoaded = true;
        return;
      }

      // Group indicators by thematic_area_id
      const indByArea = {};
      allInds.forEach(ind => {
        const taId = ind.thematic_area_id;
        if (!taId) return;
        if (!indByArea[taId]) indByArea[taId] = [];
        indByArea[taId].push(ind);
      });

      // Pull pre-computed achievement rates from state.indicators (loaded by AWYAD tab)
      const achievementById = {};
      state.indicators.forEach(ind => {
        if (ind.achievementRate != null) achievementById[ind.id] = ind.achievementRate;
      });

      function levelBadgeThematic(level) {
        const map = { impact: 'bg-danger', outcome: 'bg-warning text-dark', output: 'bg-info text-dark' };
        return `<span class="badge ${map[level] || 'bg-secondary'}">${level || '?'}</span>`;
      }

      container.innerHTML = areas.map((area, aIdx) => {
        const inds  = indByArea[area.id] || [];
        const total = inds.length;

        // Achievement status breakdown
        let onTrack = 0, atRisk = 0, offTrack = 0, noData = 0;
        inds.forEach(ind => {
          const r = achievementById[ind.id];
          if (r == null) noData++;
          else if (r >= 80) onTrack++;
          else if (r >= 50) atRisk++;
          else offTrack++;
        });

        // Level distribution
        const lvl = { impact: 0, outcome: 0, output: 0 };
        inds.forEach(ind => { if (ind.result_level in lvl) lvl[ind.result_level]++; });

        // Overall achievement (average of known rates)
        const knownRates = inds.map(ind => achievementById[ind.id]).filter(r => r != null);
        const avgAchievement = knownRates.length
          ? knownRates.reduce((s, r) => s + r, 0) / knownRates.length
          : null;

        const statusBadges = [
          onTrack  ? `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>${onTrack} On Track</span>` : '',
          atRisk   ? `<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-circle me-1"></i>${atRisk} At Risk</span>` : '',
          offTrack ? `<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>${offTrack} Off Track</span>` : '',
          noData   ? `<span class="badge bg-secondary">${noData} No Data</span>` : '',
        ].filter(Boolean).join(' ');

        const avgHtml = avgAchievement != null
          ? (() => {
              const pct = Math.min(avgAchievement, 100);
              const cls = avgAchievement >= 80 ? 'bg-on-track' : avgAchievement >= 50 ? 'bg-at-risk' : 'bg-off-track';
              return `<div class="d-flex align-items-center gap-2 mt-2">
                <small class="text-muted" style="white-space:nowrap">Avg achievement</small>
                <div class="progress flex-grow-1" style="height:8px">
                  <div class="progress-bar ${cls}" style="width:${pct}%"></div>
                </div>
                <small class="fw-semibold" style="white-space:nowrap">${avgAchievement.toFixed(1)}%</small>
              </div>`;
            })()
          : '';

        const indRows = total > 0
          ? inds.map(ind => {
              const rate = achievementById[ind.id];
              const pct  = rate != null ? Math.min(rate, 100) : null;
              const barCls = pct == null ? '' : pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger';
              return `<tr>
                <td class="small">${escHtml(ind.name || '—')}</td>
                <td>${levelBadgeThematic(ind.result_level)}</td>
                <td class="text-end small">${formatValue(ind.baseline_value, ind.data_type, ind.unit_of_measure)}</td>
                <td class="text-end small">${formatValue(ind.target_value, ind.data_type, ind.unit_of_measure)}</td>
                <td style="min-width:110px">
                  ${pct != null
                    ? `<div class="progress mb-1" style="height:5px"><div class="progress-bar ${barCls}" style="width:${pct}%"></div></div>
                       <small class="text-muted">${rate.toFixed(1)}%</small>`
                    : '<small class="text-muted">No data yet</small>'}
                </td>
              </tr>`;
            }).join('')
          : `<tr><td colspan="5" class="text-center text-muted small py-2">No indicators linked to this area.</td></tr>`;

        return `<div class="col-12">
          <div class="card mb-3 shadow-sm">
            <div class="card-header d-flex align-items-center justify-content-between py-2 gap-2 flex-wrap"
                 role="button" data-bs-toggle="collapse" data-bs-target="#thematicCollapse${aIdx}"
                 aria-expanded="true" style="cursor:pointer">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h6 class="mb-0 fw-bold text-primary"><i class="bi bi-layers me-1"></i>${escHtml(area.name)}</h6>
                ${area.code ? `<span class="badge bg-light text-dark border">${escHtml(area.code)}</span>` : ''}
                <span class="badge bg-primary">${total} indicator${total !== 1 ? 's' : ''}</span>
              </div>
              <div class="d-flex gap-1 flex-wrap align-items-center">
                ${statusBadges}
                <i class="bi bi-chevron-down text-muted ms-2"></i>
              </div>
            </div>
            <div class="collapse show" id="thematicCollapse${aIdx}">
              ${area.description ? `<div class="px-3 py-2 border-bottom text-muted small">${escHtml(area.description)}</div>` : ''}
              ${total > 0 ? `
              <div class="px-3 py-2 bg-light border-bottom d-flex gap-3 flex-wrap small align-items-center">
                ${lvl.impact  ? `<span>${levelBadgeThematic('impact')} ${lvl.impact} Impact</span>` : ''}
                ${lvl.outcome ? `<span>${levelBadgeThematic('outcome')} ${lvl.outcome} Outcome</span>` : ''}
                ${lvl.output  ? `<span>${levelBadgeThematic('output')} ${lvl.output} Output</span>` : ''}
                ${avgHtml ? `<div class="flex-grow-1">${avgHtml}</div>` : ''}
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0">
                  <thead class="table-light"><tr>
                    <th>Indicator</th><th>Level</th>
                    <th class="text-end">Baseline</th><th class="text-end">Target</th>
                    <th style="min-width:120px">Achievement</th>
                  </tr></thead>
                  <tbody>${indRows}</tbody>
                </table>
              </div>` : '<div class="card-body text-muted small py-3 text-center">No indicators configured for this area.</div>'}
            </div>
          </div>
        </div>`;
      }).join('');

      _thematicLoaded = true;
    } catch (e) {
      container.innerHTML = `<div class="col-12"><div class="alert alert-warning small"><i class="bi bi-exclamation-triangle me-1"></i>${escHtml(e.message)}</div></div>`;
    }
  }

  /* ── Project Dashboard ────────────────────────────────────── */
  let _projectOptionsLoaded = false;
  async function loadProjectOptions() {
    if (_projectOptionsLoaded) return;
    const sel = document.getElementById('projectTabSelect');
    if (!sel) return;
    try {
      const res = await fetch('/api/v1/projects?limit=200', { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const rows = Array.isArray(raw) ? raw : (raw?.projects || raw?.data || []);
      sel.innerHTML = '<option value="">— Select a project —</option>';
      rows.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => {
        if (sel.value) {
          loadProjectIndicators(sel.value);
          loadMonthlyPerformance(sel.value);
        } else {
          const tb = document.getElementById('projectIndicatorTableBody');
          if (tb) tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Select a project to view its indicators.</td></tr>';
          const card = document.getElementById('monthlyPerfCard');
          if (card) card.style.display = 'none';
        }
      });
      _projectOptionsLoaded = true;
    } catch (e) {
      console.warn('Could not load projects for project tab:', e.message);
    }
  }

  async function loadProjectIndicators(projectId) {
    const tbody = document.getElementById('projectIndicatorTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>`;
    try {
      const data = await apiFetch(`/project-indicators?projectId=${encodeURIComponent(projectId)}`);
      const rows = Array.isArray(data) ? data : (data?.data || []);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No indicators linked to this project.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(ind => {
        const achievement = ind.achievementRate ?? null;
        const actual   = formatValue(ind.actualValue,    ind.data_type, ind.unit_of_measure);
        const target   = formatValue(ind.target_value,   ind.data_type, ind.unit_of_measure);
        const baseline = formatValue(ind.baseline_value, ind.data_type, ind.unit_of_measure);
        const resultArea = ind.result_area_name
          ? `<span class="badge bg-secondary fw-normal">${escHtml(ind.result_area_name)}</span>`
          : '<span class="text-muted small">—</span>';
        return `<tr>
          <td><div class="fw-semibold small">${escHtml(ind.name || '—')}</div></td>
          <td class="small">${resultArea}</td>
          <td>${resultLevelBadge(ind.result_level)}</td>
          <td class="text-end small">${baseline}</td>
          <td class="text-end small">${target}</td>
          <td class="text-end small fw-semibold">${actual}</td>
          <td>${progressHtml(achievement)}</td>
        </tr>`;
      }).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3"><i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</td></tr>`;
    }
  }

  async function loadMonthlyPerformance(projectId) {
    const card  = document.getElementById('monthlyPerfCard');
    const tbody = document.getElementById('monthlyPerfTableBody');
    const badge = document.getElementById('monthlyPerfCount');
    if (!card || !tbody) return;
    card.style.display = '';
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3"><div class="spinner-border spinner-border-sm text-success me-2"></div>Loading…</td></tr>`;
    try {
      const data = await apiFetch(`/monthly-tracking/snapshots/project/${encodeURIComponent(projectId)}`);
      const rows = Array.isArray(data) ? data : (data?.data || data?.snapshots || []);
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No monthly snapshots yet.</td></tr>';
        if (badge) badge.textContent = '0 records';
        return;
      }
      if (badge) badge.textContent = `${rows.length} record${rows.length !== 1 ? 's' : ''}`;
      tbody.innerHTML = rows.map(s => {
        const month = s.snapshot_date || s.snapshot_month
          ? new Date(s.snapshot_date || s.snapshot_month).toLocaleDateString('en-GB', {month:'short', year:'numeric'})
          : '—';
        const activities = `${s.completed_activities ?? 0} / ${s.planned_activities ?? 0}`;
        const benes      = `${Number(s.actual_beneficiaries ?? 0).toLocaleString()} / ${Number(s.target_beneficiaries ?? 0).toLocaleString()}`;
        const budget     = s.total_expenditure != null ? `UGX ${Number(s.total_expenditure).toLocaleString()}` : '—';
        const perfRate   = s.programmatic_performance_rate ?? s.performance_rate;
        const burnRate   = s.financial_burn_rate ?? s.burn_rate;
        const perfBadge  = perfRate != null
          ? `<span class="badge ${perfRate >= 75 ? 'bg-success' : perfRate >= 50 ? 'bg-warning text-dark' : 'bg-danger'}">${Number(perfRate).toFixed(1)}%</span>`
          : '<span class="text-muted">—</span>';
        const burnBadge  = burnRate != null
          ? `<span class="badge ${burnRate > 100 ? 'bg-danger' : burnRate >= 80 ? 'bg-warning text-dark' : 'bg-info text-dark'}">${Number(burnRate).toFixed(1)}%</span>`
          : '<span class="text-muted">—</span>';
        return `<tr>
          <td class="small fw-semibold">${month}</td>
          <td class="text-center small">${activities}</td>
          <td class="text-center small">${benes}</td>
          <td class="text-end small">${budget}</td>
          <td class="text-center">${perfBadge}</td>
          <td class="text-center">${burnBadge}</td>
        </tr>`;
      }).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3"><i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</td></tr>`;
    }
  }

  /* ── Indicator Detail Modal ──────────────────────────────── */
  async function showDetail(indicatorId) {
    const modal = new bootstrap.Modal(document.getElementById('indicatorDetailModal'));
    document.getElementById('modalIndicatorName').textContent = 'Loading…';
    document.getElementById('modalIndicatorBody').innerHTML =
      '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
    modal.show();

    try {
      const data = await apiFetch(`/indicators/organizational/${indicatorId}/calculate`);
      const ind = data || {};
      document.getElementById('modalIndicatorName').textContent = ind.name || ind.indicatorName || 'Indicator Details';

      document.getElementById('modalIndicatorBody').innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <div class="detail-field">
              <div class="field-label">Result Level</div>
              <div>${resultLevelBadge(ind.result_level || ind.resultLevel)}</div>
            </div>
            <div class="detail-field">
              <div class="field-label">Calculation Type</div>
              <div><code>${escHtml(ind.calculation_type || ind.calculationType || '—')}</code></div>
            </div>
            <div class="detail-field">
              <div class="field-label">Unit of Measurement</div>
              <div>${escHtml(ind.unit_of_measurement || ind.unitOfMeasurement || '—')}</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-field">
              <div class="field-label">Baseline</div>
              <div class="fs-5 fw-semibold">${ind.baseline_value != null ? Number(ind.baseline_value).toLocaleString() : '—'}</div>
            </div>
            <div class="detail-field">
              <div class="field-label">Target</div>
              <div class="fs-5 fw-semibold">${ind.target_value != null ? Number(ind.target_value).toLocaleString() : '—'}</div>
            </div>
            <div class="detail-field">
              <div class="field-label">Actual (calculated)</div>
              <div class="fs-5 fw-semibold ${statusClass(ind.achievementRate)}">
                ${ind.actualValue != null ? Number(ind.actualValue).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </div>
        <hr />
        <div class="mb-3">
          <div class="detail-field">
            <div class="field-label">Achievement Rate</div>
          </div>
          ${progressHtml(ind.achievementRate ?? null)}
        </div>
        ${ind.description ? `<div class="detail-field"><div class="field-label">Description</div><p class="small">${escHtml(ind.description)}</p></div>` : ''}
        ${ind.dataSource ? `<div class="detail-field"><div class="field-label">Data Source</div><p class="small">${escHtml(ind.dataSource)}</p></div>` : ''}
      `;
    } catch (e) {
      document.getElementById('modalIndicatorBody').innerHTML =
        `<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</div>`;
    }
  }

  /* ── Helper: escape HTML ─────────────────────────────────── */
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── Filter / search event wiring ───────────────────────── */
  function wireFilters() {
    document.getElementById('resultLevelFilter').addEventListener('change', e => {
      state.levelFilter = e.target.value;
      state.page = 1;
      renderTable();
    });

    let searchTimer;
    document.getElementById('indicatorSearch').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        state.page = 1;
        renderTable();
      }, 250);
    });

    document.getElementById('periodFilter').addEventListener('change', () => {
      state.page = 1;
      loadIndicators();
    });
  }

  /* ── Time-Series Chart ───────────────────────────────────── */
  let _chartInstance = null;
  let _chartJsLoaded = false;

  /* ── Performance Charts ──────────────────────────────────── */
  let _perfLoaded = false;
  let _perfRateChart = null;
  let _reachChart = null;

  async function loadPerformanceSummary(forceReload = false) {
    if (_perfLoaded && !forceReload) return;
    _perfLoaded = true;

    await ensureChartJs();

    async function dashFetch(path) {
      const res = await fetch(`/api/v1/dashboard${path}`, { headers: authHeaders() });
      if (res.status === 401) { window.location.href = '/login.html'; return null; }
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    }

    const [perfRes, reachRes] = await Promise.allSettled([
      dashFetch('/performance-summary'),
      dashFetch('/reach-vs-target'),
    ]);

    const perfData  = perfRes.status  === 'fulfilled' ? perfRes.value  : null;
    const reachData = reachRes.status === 'fulfilled' ? reachRes.value : null;

    // ── KPI cards ──────────────────────────────────────────
    if (perfData?.summary) {
      const s = perfData.summary;
      setText('perfKpiRate',    s.overall_performance_rate + '%');
      setText('perfKpiOnTrack', `${s.on_track_projects} / ${s.projects_count}`);
    }
    if (reachData?.summary) {
      const s = reachData.summary;
      setText('perfKpiReach',  s.overall_reach_rate + '%');
      setText('perfKpiBenef',  Number(s.total_actual_beneficiaries).toLocaleString());
    }

    // ── Performance Rate bar chart ─────────────────────────
    const perfRows = perfData?.data ?? [];
    if (perfRows.length) {
      document.getElementById('perfChartPlaceholder').style.display = 'none';
      const canvas = document.getElementById('perfRateChart');
      canvas.style.display = 'block';

      const labels = perfRows.map(r => shortenLabel(r.project_name));
      const values = perfRows.map(r => Number(r.performance_rate));
      const colors = values.map(v =>
        v >= 80 ? 'rgba(40,167,69,0.75)' :
        v >= 50 ? 'rgba(255,193,7,0.75)' :
                  'rgba(220,53,69,0.75)'
      );

      if (_perfRateChart) _perfRateChart.destroy();
      _perfRateChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Performance Rate (%)',
            data: values,
            backgroundColor: colors,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.parsed.y.toFixed(1)}%  — ${perfRows[ctx.dataIndex].project_name}`,
              }
            }
          },
          scales: {
            y: {
              min: 0, max: 100,
              ticks: { callback: v => v + '%' },
            }
          }
        }
      });
    } else {
      document.getElementById('perfChartPlaceholder').innerHTML =
        '<i class="bi bi-info-circle d-block mb-1"></i><span class="small">No indicator data yet.</span>';
    }

    // ── Reach vs Target horizontal bar chart ───────────────
    const reachRows = (reachData?.data ?? [])
      .filter(r => Number(r.total_target_beneficiaries) > 0 || Number(r.total_actual_beneficiaries) > 0);

    if (reachRows.length) {
      document.getElementById('reachChartPlaceholder').style.display = 'none';
      const canvas = document.getElementById('reachChart');
      canvas.style.display = 'block';

      const labels  = reachRows.map(r => shortenLabel(r.project_name));
      const targets = reachRows.map(r => Number(r.total_target_beneficiaries));
      const actuals = reachRows.map(r => Number(r.total_actual_beneficiaries));

      if (_reachChart) _reachChart.destroy();
      _reachChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Target',
              data: targets,
              backgroundColor: 'rgba(13,110,253,0.25)',
              borderColor: 'rgba(13,110,253,0.7)',
              borderWidth: 1,
              borderRadius: 3,
            },
            {
              label: 'Reached',
              data: actuals,
              backgroundColor: 'rgba(32,201,151,0.7)',
              borderRadius: 3,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            x: { ticks: { callback: v => Number(v).toLocaleString() } }
          }
        }
      });
    } else {
      document.getElementById('reachChartPlaceholder').innerHTML =
        '<i class="bi bi-info-circle d-block mb-1"></i><span class="small">No beneficiary snapshot data yet.</span>';
    }

    // ── Performance table ──────────────────────────────────
    const tbody = document.getElementById('perfTableBody');
    if (!tbody) return;

    const reachMap = Object.fromEntries((reachData?.data ?? []).map(r => [r.project_id, r]));

    if (!perfRows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No data available.</td></tr>';
      return;
    }

    tbody.innerHTML = perfRows.map(row => {
      const pr   = Number(row.performance_rate);
      const rc   = reachMap[row.project_id];
      const rr   = rc ? Number(rc.reach_rate) : null;
      const rBadgeClass = rr === null ? 'bg-secondary' : rr >= 80 ? 'bg-success' : rr >= 50 ? 'bg-warning text-dark' : 'bg-danger';
      const pBadgeClass = pr >= 80 ? 'bg-success' : pr >= 50 ? 'bg-warning text-dark' : 'bg-danger';
      return `
        <tr>
          <td class="fw-semibold">${row.project_name}</td>
          <td class="text-end">${row.indicator_count}</td>
          <td class="text-end">${Number(row.total_target).toLocaleString()}</td>
          <td class="text-end">${Number(row.total_achieved).toLocaleString()}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height:8px">
                <div class="progress-bar ${pr >= 80 ? 'bg-success' : pr >= 50 ? 'bg-warning' : 'bg-danger'}"
                     style="width:${Math.min(pr,100)}%"></div>
              </div>
              <span class="badge ${pBadgeClass}" style="min-width:46px">${pr.toFixed(1)}%</span>
            </div>
          </td>
          <td class="text-end">${rc ? Number(rc.total_actual_beneficiaries).toLocaleString() : '—'}</td>
          <td class="text-end">${rc ? Number(rc.total_target_beneficiaries).toLocaleString() : '—'}</td>
          <td>
            ${rr !== null ? `
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height:8px">
                <div class="progress-bar ${rr >= 80 ? 'bg-info' : rr >= 50 ? 'bg-warning' : 'bg-danger'}"
                     style="width:${Math.min(rr,100)}%"></div>
              </div>
              <span class="badge ${rBadgeClass}" style="min-width:46px">${rr.toFixed(1)}%</span>
            </div>` : '<span class="text-muted">—</span>'}
          </td>
        </tr>`;
    }).join('');
  }

  function shortenLabel(name, maxLen = 22) {
    return name && name.length > maxLen ? name.slice(0, maxLen - 1) + '\u2026' : (name || '');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  async function ensureChartJs() {
    if (_chartJsLoaded) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      script.onload  = () => { _chartJsLoaded = true; resolve(); };
      script.onerror = () => reject(new Error('Failed to load Chart.js'));
      document.head.appendChild(script);
    });
  }

  async function populateTrendSelector(indicators) {
    const sel = document.getElementById('trendIndicatorSelect');
    if (!sel || indicators.length === 0) return;
    sel.innerHTML = '<option value="">— Select an indicator to chart —</option>';
    indicators.forEach(ind => {
      const opt = document.createElement('option');
      opt.value = ind.id;
      opt.textContent = `[${(ind.result_level || '').toUpperCase()}] ${ind.name}`;
      sel.appendChild(opt);
    });
  }

  async function loadTimeSeries(indicatorId, granularity) {
    const placeholder = document.getElementById('trendPlaceholder');
    const chartWrap   = document.getElementById('trendChartWrap');
    const trendError  = document.getElementById('trendError');

    trendError.classList.add('d-none');
    placeholder.style.display = 'none';
    chartWrap.style.display   = 'block';

    // Show loading state in canvas area
    const canvas = document.getElementById('trendChart');
    canvas.style.opacity = '0.3';

    try {
      await ensureChartJs();

      const data = await apiFetch(
        `/aggregation/time-series/${indicatorId}?granularity=${granularity}`
      );
      const series = data && data.series ? data.series : (Array.isArray(data) ? data : []);

      if (series.length === 0) {
        placeholder.innerHTML = '<i class="bi bi-bar-chart-line display-4 d-block mb-2 opacity-25"></i><span class="small">No data available for this indicator and period.</span>';
        placeholder.style.display = '';
        chartWrap.style.display   = 'none';
        return;
      }

      const labels = series.map(p => p.period || p.label || p.date || '');
      const values = series.map(p => p.value != null ? Number(p.value) : null);
      const targets = series.map(p => p.target != null ? Number(p.target) : null);

      if (_chartInstance) {
        _chartInstance.destroy();
        _chartInstance = null;
      }

      const ctx = canvas.getContext('2d');
      canvas.style.opacity = '1';

      _chartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Actual',
              data: values,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13,110,253,0.1)',
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Target',
              data: targets,
              borderColor: '#6c757d',
              borderDash: [6, 3],
              backgroundColor: 'transparent',
              fill: false,
              tension: 0,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 14, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toLocaleString() : 'N/A'}`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { beginAtZero: false, ticks: { font: { size: 11 } } },
          },
        },
      });
    } catch (err) {
      canvas.style.opacity = '1';
      chartWrap.style.display = 'none';
      placeholder.style.display = '';
      trendError.textContent = `Could not load trend data: ${escHtml(err.message)}`;
      trendError.classList.remove('d-none');
    }
  }

  function wireTrendControls() {
    const sel  = document.getElementById('trendIndicatorSelect');
    const gran = document.getElementById('trendGranularity');
    if (!sel || !gran) return;

    function onTrendChange() {
      if (!sel.value) {
        document.getElementById('trendPlaceholder').style.display = '';
        document.getElementById('trendChartWrap').style.display   = 'none';
        return;
      }
      loadTimeSeries(sel.value, gran.value);
    }

    sel.addEventListener('change',  onTrendChange);
    gran.addEventListener('change', () => { if (sel.value) onTrendChange(); });
  }

  /* ── Public API (for inline onclick attributes) ──────────── */
  window.RBMDashboard = {
    showDetail,
    goPage(n) {
      state.page = n;
      renderTable();
    },
  };

  /* ── Init ────────────────────────────────────────────────── */
  async function init() {
    if (!getToken()) { window.location.href = '/login.html'; return; }

    wireFilters();
    wireTrendControls();

    // Wire level-tab show events
    document.querySelectorAll('#dashboardLevelTabs [data-bs-toggle="tab"]').forEach(btn => {
      btn.addEventListener('shown.bs.tab', e => {
        const target = e.target.dataset.bsTarget;
        if (target === '#tab-thematic')   loadThematicDashboard();
        if (target === '#tab-project')    loadProjectOptions();
        if (target === '#tab-performance') loadPerformanceSummary();
      });
    });

    // Thematic refresh button
    const thematicRefreshBtn = document.getElementById('thematicRefreshBtn');
    if (thematicRefreshBtn) {
      thematicRefreshBtn.addEventListener('click', () => {
        _thematicLoaded = false;
        loadThematicDashboard(true);
      });
    }

    // Performance refresh button
    const perfRefreshBtn = document.getElementById('perfRefreshBtn');
    if (perfRefreshBtn) {
      perfRefreshBtn.addEventListener('click', () => {
        _perfLoaded = false;
        loadPerformanceSummary(true);
      });
    }

    // Populate user name
    const raw = localStorage.getItem('awyad_user') || sessionStorage.getItem('awyad_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        document.getElementById('userName').textContent = u.name || u.username || u.email || '';
      } catch {}
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('awyad_access_token'); localStorage.removeItem('awyad_user');
      sessionStorage.removeItem('awyad_access_token'); sessionStorage.removeItem('awyad_user');
      window.location.href = '/login.html';
    });

    await Promise.allSettled([
      loadDashboardSummary(),
      loadPillars(),
      loadIndicators(),
      loadPendingValidations(),
    ]);

    // Populate trend selector after indicators load
    populateTrendSelector(state.indicators);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
