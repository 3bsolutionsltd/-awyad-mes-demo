/**
 * rbm-indicators.js
 * Manages create/read/update/deactivate of organizational indicators.
 */
(function () {
  'use strict';

  const API      = '/api/v1/rbm';
  const CORE_API = '/api/v1';

  /* ── Auth ─────────────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  function authHdr() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
  }
  async function apiFetch(url, opts = {}) {
    const res = await fetch(url, { headers: authHdr(), ...opts });
    if (res.status === 401) { window.location.href = '/login.html'; return null; }
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || body.message || `HTTP ${res.status}`);
    return body;
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function dataTypeBadge(dt) {
    const map = {
      number:     '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">number</span>',
      percentage: '<span class="badge bg-success-subtle text-success border border-success-subtle">%</span>',
      ratio:      '<span class="badge bg-warning-subtle text-warning border border-warning-subtle">ratio</span>',
    };
    return map[dt] || `<span class="badge bg-secondary">${escHtml(dt || '—')}</span>`;
  }

  function resultLevelBadge(lv) {
    const cls = { impact:'badge-impact', outcome:'badge-outcome', output:'badge-output' };
    return `<span class="badge result-level-badge ${cls[lv]||'bg-secondary'}">${escHtml(lv||'—')}</span>`;
  }

  function statusBadge(active) {
    return active
      ? '<span class="badge bg-success-subtle text-success">Active</span>'
      : '<span class="badge bg-secondary-subtle text-secondary">Inactive</span>';
  }

  /* ── State ────────────────────────────────────────────────── */
  const state = {
    all: [], filtered: [], page: 1, pageSize: 20,
    search: '', resultLevel: '', dataType: '', thematicAreaId: '', isActive: 'true',
  };

  /* ── Load Thematic Areas dropdown ────────────────────────── */
  async function loadThematicAreas() {
    try {
      const data = await apiFetch(`${CORE_API}/thematic-areas`);
      const list = Array.isArray(data) ? data : (data?.data || data?.thematicAreas || []);
      const sel1 = document.getElementById('filterThematic');
      const sel2 = document.getElementById('fThematicArea');
      list.forEach(ta => {
        [sel1, sel2].forEach(sel => {
          const opt = document.createElement('option');
          opt.value = ta.id;
          opt.textContent = ta.name;
          sel.appendChild(opt);
        });
      });
    } catch (e) {
      console.warn('Could not load thematic areas:', e.message);
    }
  }

  /* ── Load Indicators ─────────────────────────────────────── */
  async function loadIndicators() {
    const tbody = document.getElementById('indicatorTableBody');
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>`;
    try {
      const qs = new URLSearchParams();
      if (state.isActive !== '') qs.set('isActive', state.isActive);
      const data = await apiFetch(`${API}/organizational-indicators?${qs}`);
      state.all = Array.isArray(data) ? data : (data?.data || []);
      applyFilters();
      renderTable();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</td></tr>`;
    }
  }

  function applyFilters() {
    const q = state.search.toLowerCase();
    state.filtered = state.all.filter(ind => {
      const lvOk = !state.resultLevel  || ind.result_level === state.resultLevel;
      const dtOk = !state.dataType     || ind.data_type    === state.dataType;
      const taOk = !state.thematicAreaId || ind.thematic_area_id === state.thematicAreaId;
      const srOk = !q || (ind.name||'').toLowerCase().includes(q) ||
                   (ind.thematic_area_name||'').toLowerCase().includes(q);
      return lvOk && dtOk && taOk && srOk;
    });
    document.getElementById('countLabel').textContent = `${state.filtered.length} indicator${state.filtered.length !== 1 ? 's' : ''}`;
  }

  function renderTable() {
    const tbody   = document.getElementById('indicatorTableBody');
    const start   = (state.page - 1) * state.pageSize;
    const slice   = state.filtered.slice(start, start + state.pageSize);

    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">No indicators match the current filters.</td></tr>`;
      document.getElementById('tableInfo').textContent = '0 results';
      document.getElementById('tablePager').innerHTML = '';
      return;
    }

    tbody.innerHTML = slice.map(ind => {
      const baseline = ind.baseline_value != null ? Number(ind.baseline_value).toLocaleString() : '—';
      const target   = ind.target_value   != null ? Number(ind.target_value).toLocaleString()   : '—';
      const unit     = ind.unit_of_measure ? ` ${escHtml(ind.unit_of_measure)}` : '';
      return `
        <tr>
          <td>
            <div class="fw-semibold small">${escHtml(ind.name)}</div>
            ${ind.responsible_team ? `<div class="text-muted" style="font-size:.7rem"><i class="bi bi-people me-1"></i>${escHtml(ind.responsible_team)}</div>` : ''}
          </td>
          <td class="small">${escHtml(ind.thematic_area_name || '—')}</td>
          <td>${resultLevelBadge(ind.result_level)}</td>
          <td class="small text-muted">${escHtml(ind.indicator_level || '—')}</td>
          <td>${dataTypeBadge(ind.data_type)}</td>
          <td class="text-end small">${baseline}${unit}</td>
          <td class="text-end small">${target}${unit}</td>
          <td class="small text-muted">${escHtml(ind.reporting_frequency || '—')}</td>
          <td class="text-center">${statusBadge(ind.is_active)}</td>
          <td class="no-print">
            <div class="d-flex gap-1">
              <button class="btn btn-outline-primary btn-sm" title="Edit"
                      onclick="RBMIndicators.edit('${ind.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              ${ind.is_active ? `
              <button class="btn btn-outline-warning btn-sm" title="Deactivate"
                      onclick="RBMIndicators.confirmDelete('${ind.id}','${escHtml(ind.name.replace(/'/g,"\\'"))}')">
                <i class="bi bi-eye-slash"></i>
              </button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');

    const total = state.filtered.length;
    document.getElementById('tableInfo').textContent =
      `${start + 1}–${Math.min(start + state.pageSize, total)} of ${total}`;
    renderPager(total);
  }

  function renderPager(total) {
    const pages = Math.ceil(total / state.pageSize);
    const cont  = document.getElementById('tablePager');
    if (pages <= 1) { cont.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - state.page) <= 1) {
        html += `<button class="btn btn-sm ${i === state.page ? 'btn-primary' : 'btn-outline-secondary'}"
                         onclick="RBMIndicators.goPage(${i})">${i}</button>`;
      } else if (Math.abs(i - state.page) === 2) {
        html += `<span class="btn btn-sm disabled">…</span>`;
      }
    }
    cont.innerHTML = html;
  }

  /* ── Modal helpers ────────────────────────────────────────── */
  let _modal;
  let _deleteModal;
  let _pendingDeleteId;

  function clearForm() {
    document.getElementById('editId').value = '';
    document.getElementById('indicatorForm').reset();
    document.getElementById('fIsActive').checked = true;
    document.getElementById('fDataType').value = 'number';
    document.getElementById('fCalcType').value = 'SUM';
    document.getElementById('fFrequency').value = 'quarterly';
    document.getElementById('modalError').classList.add('d-none');
    document.querySelectorAll('#indicatorForm .is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }

  function populateForm(ind) {
    document.getElementById('editId').value         = ind.id;
    document.getElementById('fName').value          = ind.name || '';
    document.getElementById('fDescription').value   = ind.description || '';
    document.getElementById('fThematicArea').value  = ind.thematic_area_id || '';
    document.getElementById('fResultLevel').value   = ind.result_level || '';
    document.getElementById('fIndicatorLevel').value= ind.indicator_level || '';
    document.getElementById('fDataType').value      = ind.data_type || 'number';
    document.getElementById('fCalcType').value      = ind.calculation_type || 'SUM';
    document.getElementById('fUnit').value          = ind.unit_of_measure || '';
    document.getElementById('fBaseline').value      = ind.baseline_value ?? '';
    document.getElementById('fBaselineYear').value  = ind.baseline_year ?? '';
    document.getElementById('fTarget').value        = ind.target_value ?? '';
    document.getElementById('fFrequency').value     = ind.reporting_frequency || 'quarterly';
    document.getElementById('fTeam').value          = ind.responsible_team || '';
    document.getElementById('fDataSource').value    = ind.data_source || '';
    document.getElementById('fCollectionMethod').value = ind.collection_method || '';
    document.getElementById('fIsActive').checked   = !!ind.is_active;

    // Disaggregation checkboxes
    const dtypes = Array.isArray(ind.disaggregation_types) ? ind.disaggregation_types :
      (typeof ind.disaggregation_types === 'string' ? JSON.parse(ind.disaggregation_types || '[]') : []);
    document.querySelectorAll('input[type=checkbox][id^="disagg_"]').forEach(cb => {
      cb.checked = dtypes.includes(cb.value);
    });
  }

  function collectForm() {
    const disagg = [...document.querySelectorAll('input[type=checkbox][id^="disagg_"]:checked')]
      .map(cb => cb.value);
    return {
      name:               document.getElementById('fName').value.trim(),
      description:        document.getElementById('fDescription').value.trim() || null,
      thematic_area_id:   document.getElementById('fThematicArea').value,
      result_level:       document.getElementById('fResultLevel').value,
      indicator_level:    document.getElementById('fIndicatorLevel').value || null,
      data_type:          document.getElementById('fDataType').value,
      calculation_type:   document.getElementById('fCalcType').value,
      unit_of_measure:    document.getElementById('fUnit').value.trim() || null,
      baseline_value:     document.getElementById('fBaseline').value !== '' ? Number(document.getElementById('fBaseline').value) : null,
      baseline_year:      document.getElementById('fBaselineYear').value !== '' ? Number(document.getElementById('fBaselineYear').value) : null,
      target_value:       document.getElementById('fTarget').value !== '' ? Number(document.getElementById('fTarget').value) : null,
      reporting_frequency:document.getElementById('fFrequency').value,
      responsible_team:   document.getElementById('fTeam').value.trim() || null,
      data_source:        document.getElementById('fDataSource').value.trim() || null,
      collection_method:  document.getElementById('fCollectionMethod').value.trim() || null,
      disaggregation_types: disagg,
      is_active:          document.getElementById('fIsActive').checked,
    };
  }

  function validateForm(data) {
    let valid = true;
    const required = [
      { id: 'fName',         test: !!data.name },
      { id: 'fThematicArea', test: !!data.thematic_area_id },
      { id: 'fResultLevel',  test: !!data.result_level },
    ];
    required.forEach(({ id, test }) => {
      const el = document.getElementById(id);
      if (test) { el.classList.remove('is-invalid'); }
      else       { el.classList.add('is-invalid'); valid = false; }
    });
    return valid;
  }

  /* ── Save handler ─────────────────────────────────────────── */
  async function saveIndicator() {
    const data   = collectForm();
    if (!validateForm(data)) return;

    const editId = document.getElementById('editId').value;
    const spinner = document.getElementById('modalSpinner');
    const icon    = document.getElementById('modalSaveIcon');
    const saveBtn = document.getElementById('modalSaveBtn');
    const errEl   = document.getElementById('modalError');

    spinner.classList.remove('d-none');
    icon.classList.add('d-none');
    saveBtn.disabled = true;
    errEl.classList.add('d-none');

    try {
      if (editId) {
        await apiFetch(`${API}/organizational-indicators/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch(`${API}/organizational-indicators`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      _modal.hide();
      await loadIndicators();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('d-none');
    } finally {
      spinner.classList.add('d-none');
      icon.classList.remove('d-none');
      saveBtn.disabled = false;
    }
  }

  /* ── Delete / Deactivate ─────────────────────────────────── */
  async function doDelete() {
    if (!_pendingDeleteId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    try {
      await apiFetch(`${API}/organizational-indicators/${_pendingDeleteId}`, { method: 'DELETE' });
      _deleteModal.hide();
      await loadIndicators();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      btn.disabled = false;
    }
  }

  /* ── Filter wiring ────────────────────────────────────────── */
  function wireFilters() {
    document.getElementById('filterThematic').addEventListener('change', e => {
      state.thematicAreaId = e.target.value; state.page = 1; applyFilters(); renderTable();
    });
    document.getElementById('filterResultLevel').addEventListener('change', e => {
      state.resultLevel = e.target.value; state.page = 1; applyFilters(); renderTable();
    });
    document.getElementById('filterDataType').addEventListener('change', e => {
      state.dataType = e.target.value; state.page = 1; applyFilters(); renderTable();
    });
    document.getElementById('filterActive').addEventListener('change', e => {
      state.isActive = e.target.value; state.page = 1; loadIndicators();
    });

    let searchTimer;
    document.getElementById('filterSearch').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.search = e.target.value; state.page = 1; applyFilters(); renderTable();
      }, 250);
    });
  }

  /* ── Public API ───────────────────────────────────────────── */
  window.RBMIndicators = {
    openNew() {
      clearForm();
      document.getElementById('modalTitle').textContent = 'New Indicator';
      _modal.show();
    },
    async edit(id) {
      clearForm();
      document.getElementById('modalTitle').textContent = 'Edit Indicator';
      try {
        const data = await apiFetch(`${API}/organizational-indicators/${id}`);
        const ind = data?.data || data;
        populateForm(ind);
      } catch (e) {
        alert(`Could not load indicator: ${e.message}`);
        return;
      }
      _modal.show();
    },
    confirmDelete(id, name) {
      _pendingDeleteId = id;
      document.getElementById('deleteIndicatorName').textContent = name;
      _deleteModal.show();
    },
    goPage(n) { state.page = n; renderTable(); },
  };

  /* ── Init ─────────────────────────────────────────────────── */
  async function init() {
    if (!getToken()) { window.location.href = '/login.html'; return; }

    _modal       = new bootstrap.Modal(document.getElementById('indicatorModal'));
    _deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    document.getElementById('newIndicatorBtn').addEventListener('click', () => RBMIndicators.openNew());
    document.getElementById('modalSaveBtn').addEventListener('click', saveIndicator);
    document.getElementById('confirmDeleteBtn').addEventListener('click', doDelete);

    wireFilters();

    // User name + logout
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        document.getElementById('userName').textContent = u.name || u.username || u.email || '';
      } catch {}
    }
    document.getElementById('logoutBtn').addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('user');
      sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
      window.location.href = '/login.html';
    });

    await loadThematicAreas();
    await loadIndicators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
