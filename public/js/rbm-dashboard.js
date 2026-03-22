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
  async function loadThematicDashboard() {
    if (_thematicLoaded) return;
    const container = document.getElementById('thematicCardsRow');
    if (!container) return;
    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</div>';
    try {
      const res = await fetch('/api/v1/thematic-areas', { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const areas = Array.isArray(raw) ? raw : (raw?.data || raw?.thematicAreas || []);
      if (!areas.length) {
        container.innerHTML = '<div class="col-12 text-muted text-center py-4">No thematic areas found.</div>';
        _thematicLoaded = true;
        return;
      }
      container.innerHTML = areas.map(area => `
        <div class="col-sm-6 col-lg-4 col-xl-3">
          <div class="card h-100 border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-title fw-semibold">${escHtml(area.name)}</h6>
              ${area.code ? `<div class="text-muted" style="font-size:.7rem">Code: ${escHtml(area.code)}</div>` : ''}
              <p class="card-text text-muted small mt-1 mb-0">${escHtml(area.description || '')}</p>
            </div>
          </div>
        </div>`).join('');
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
        if (target === '#tab-thematic') loadThematicDashboard();
        if (target === '#tab-project')  loadProjectOptions();
      });
    });

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
