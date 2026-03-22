/**
 * RBM Indicator Value Submission — front-end controller
 * Vanilla JS, no framework. Loads from <script src="/js/rbm-submit.js">
 */
(function () {
  'use strict';

  const API = '/api/v1';

  /* ── Auth helpers ─────────────────────────────────────────── */
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  function authHeaders() {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
  }

  async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
    if (res.status === 401) { window.location.href = '/login.html'; return null; }
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || `API error ${res.status}`);
    }
    return res.json();
  }

  /* ── DOM refs ─────────────────────────────────────────────── */
  const form           = document.getElementById('submitForm');
  const indicatorSel   = document.getElementById('indicatorSelect');
  const projectSel     = document.getElementById('projectSelect');
  const unitDisplay    = document.getElementById('unitDisplay');
  const indicatorHint  = document.getElementById('indicatorHint');
  const valueInput     = document.getElementById('valueInput');
  const dataSourceInput = document.getElementById('dataSourceInput');
  const disaggTypeSel  = document.getElementById('disaggTypeSelect');
  const disaggValueIn  = document.getElementById('disaggValueInput');
  const periodStart    = document.getElementById('periodStart');
  const periodEnd      = document.getElementById('periodEnd');
  const collectionIn   = document.getElementById('collectionMethodInput');
  const notesTA        = document.getElementById('notesTextarea');
  const notesCount     = document.getElementById('notesCount');
  const submitBtn      = document.getElementById('submitBtn');
  const submitSpinner  = document.getElementById('submitSpinner');
  const submitIcon     = document.getElementById('submitIcon');
  const successAlert   = document.getElementById('successAlert');
  const successMsg     = document.getElementById('successMsg');
  const errorAlert     = document.getElementById('errorAlert');
  const errorMsg       = document.getElementById('errorMsg');
  const formCard       = document.getElementById('formCard');

  /* ── Load indicators ──────────────────────────────────────── */
  async function loadIndicators() {
    try {
      const data = await apiFetch('/rbm/organizational-indicators');
      const rows = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);

      indicatorSel.innerHTML = '<option value="">— Select an indicator —</option>';
      rows.forEach(ind => {
        const opt = document.createElement('option');
        opt.value = ind.id;
        opt.textContent = `[${(ind.result_level || '').toUpperCase()}] ${ind.name}`;
        opt.dataset.unit = ind.unit_of_measurement || '';
        opt.dataset.hint = ind.description || '';
        opt.dataset.target = ind.target_value != null ? ind.target_value : '';
        opt.dataset.dataType = ind.data_type || 'number';
        indicatorSel.appendChild(opt);
      });
    } catch (e) {
      indicatorSel.innerHTML = `<option value="">Could not load indicators — ${escHtml(e.message)}</option>`;
    }
  }

  /* ── Load projects ────────────────────────────────────────── */
  async function loadProjects() {
    try {
      const data = await apiFetch('/projects?limit=200');
      const rows = Array.isArray(data) ? data
        : (data && Array.isArray(data.projects) ? data.projects
        : (data && Array.isArray(data.data) ? data.data : []));

      projectSel.innerHTML = '<option value="">— Not project-specific —</option>';
      rows.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        projectSel.appendChild(opt);
      });
    } catch {
      // Non-fatal: project field is optional
    }
  }

  /* ── Indicator select → show unit + hint ─────────────────── */
  function onIndicatorChange() {
    const selected = indicatorSel.options[indicatorSel.selectedIndex];
    if (!selected || !selected.value) {
      unitDisplay.value = '';
      indicatorHint.innerHTML = '';
      return;
    }
    unitDisplay.value = selected.dataset.unit || '';
    const dtMap = { number: 'primary', percentage: 'success', ratio: 'warning' };
    const dt = selected.dataset.dataType || 'number';
    const badge = `<span class="badge bg-${dtMap[dt] || 'secondary'}-subtle text-${dtMap[dt] || 'secondary'} border border-${dtMap[dt] || 'secondary'}-subtle me-2">data type: ${dt}</span>`;
    const hint = selected.dataset.hint ? escHtml(selected.dataset.hint) : '';
    indicatorHint.innerHTML = badge + hint;
  }

  /* ── Default reporting period (current calendar month) ────── */
  function setDefaultPeriod() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    periodStart.value = toDateInput(firstDay);
    periodEnd.value   = toDateInput(lastDay);
  }

  function toDateInput(d) {
    return d.toISOString().slice(0, 10);
  }

  /* ── Notes character counter ──────────────────────────────── */
  function onNotesInput() {
    notesCount.textContent = notesTA.value.length;
  }

  /* ── Show/hide loading state ──────────────────────────────── */
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitSpinner.classList.toggle('d-none', !loading);
    submitIcon.classList.toggle('d-none', loading);
  }

  /* ── Show alerts ──────────────────────────────────────────── */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorAlert.classList.remove('d-none');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlerts() {
    successAlert.classList.add('d-none');
    errorAlert.classList.add('d-none');
  }

  /* ── Form submit ──────────────────────────────────────────── */
  async function onSubmit(e) {
    e.preventDefault();
    hideAlerts();

    // HTML5 constraint validation
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Cross-field: end >= start
    if (periodEnd.value < periodStart.value) {
      periodEnd.setCustomValidity('End date must be on or after start date');
      form.classList.add('was-validated');
      return;
    }
    periodEnd.setCustomValidity('');

    const payload = {
      organizational_indicator_id: indicatorSel.value,
      project_id: projectSel.value || null,
      value: parseFloat(valueInput.value),
      reporting_period_start: periodStart.value,
      reporting_period_end:   periodEnd.value,
      data_source:       dataSourceInput.value.trim() || null,
      disaggregation_type:  disaggTypeSel.value || null,
      disaggregation_value: disaggValueIn.value.trim() || null,
      collection_method:    collectionIn.value.trim() || null,
      notes:                notesTA.value.trim() || null,
    };

    setLoading(true);
    try {
      const result = await apiFetch('/rbm/indicator-values', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const entry = result?.data || result;
      const status = entry?.validationStatus || entry?.validation_status || 'pending';

      successMsg.textContent = `Entry submitted (ID: ${entry?.id || '—'}). Status: ${status}. It is now queued for validation.`;
      successAlert.classList.remove('d-none');
      formCard.classList.add('d-none');
      successAlert.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
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

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    if (!getToken()) { window.location.href = '/login.html'; return; }

    // Populate user name
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        document.getElementById('userName').textContent = u.name || u.username || u.email || '';
      } catch {}
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token'); localStorage.removeItem('user');
      sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
      window.location.href = '/login.html';
    });

    indicatorSel.addEventListener('change', onIndicatorChange);
    notesTA.addEventListener('input', onNotesInput);
    form.addEventListener('submit', onSubmit);

    // Reset custom validity when user changes the date
    periodEnd.addEventListener('change', () => periodEnd.setCustomValidity(''));
    periodStart.addEventListener('change', () => periodEnd.setCustomValidity(''));

    setDefaultPeriod();
    loadIndicators();
    loadProjects();
  }

  document.addEventListener('DOMContentLoaded', init);
}());
