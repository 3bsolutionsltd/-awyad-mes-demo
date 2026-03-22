/**
 * RBM Validation Queue — front-end controller
 * Vanilla JS, loaded via <script src="/js/rbm-validation.js">
 */
(function () {
  'use strict';

  const API = '/api/v1/rbm';

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
      const text = await res.text().catch(() => res.statusText);
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  /* ── HTML escape ─────────────────────────────────────────── */
  function escHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── State ───────────────────────────────────────────────── */
  const state = {
    queue: [],
    filteredQueue: [],
    activeItemId: null,
    statusFilter: 'pending',
    searchQuery: '',
  };

  /* ── Status badge ────────────────────────────────────────── */
  function statusBadgeHtml(status) {
    const cls = {
      pending: 'badge-pending',
      verified: 'badge-verified',
      rejected: 'badge-rejected',
      flagged: 'badge-flagged',
    };
    return `<span class="badge ${cls[status] || 'bg-secondary'}">${status || '—'}</span>`;
  }

  /* ── Quality Score display ───────────────────────────────── */
  function qualityBadge(score) {
    if (score === null || score === undefined) return '—';
    const cls = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';
    const level = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low';
    return `<span class="${cls} fw-semibold">${score} <small>(${level})</small></span>`;
  }

  /* ── Auto-check chips ─────────────────────────────────────── */
  function renderAutoChecks(checks) {
    if (!checks || !checks.length) return;
    const container = document.getElementById('autoChecksList');
    const section = document.getElementById('autoChecksSection');
    section.style.display = '';
    container.innerHTML = checks.map(c => {
      let cls = 'badge bg-secondary';
      if (c.status === 'pass') cls = 'badge bg-success';
      else if (c.status === 'warning') cls = 'badge bg-warning text-dark';
      else if (c.status === 'error') cls = 'badge bg-danger';
      return `<span class="${cls}" title="${escHtml(c.message || '')}">${escHtml(c.name || c.check)}</span>`;
    }).join('');
  }

  /* ── Render Queue ─────────────────────────────────────────── */
  function applyQueueFilters() {
    const q = state.searchQuery.toLowerCase();
    state.filteredQueue = state.queue.filter(item => {
      if (!q) return true;
      return (item.indicator_name || item.indicatorName || '').toLowerCase().includes(q) ||
             (item.project_name || item.projectName || '').toLowerCase().includes(q);
    });
  }

  function renderQueue() {
    applyQueueFilters();
    const list = document.getElementById('queueList');
    document.getElementById('queueCount').textContent = state.filteredQueue.length;

    if (state.filteredQueue.length === 0) {
      list.innerHTML = `<div class="empty-state py-4">
        <i class="bi bi-inbox" style="font-size:2rem;opacity:.3"></i>
        <p class="small">No items in queue</p>
      </div>`;
      return;
    }

    list.innerHTML = state.filteredQueue.map(item => {
      const active = item.id === state.activeItemId ? ' active' : '';
      const name = escHtml(item.indicator_name || item.indicatorName || '—');
      const project = escHtml(item.project_name || item.projectName || '—');
      const period = escHtml(item.reporting_period_start
        ? new Date(item.reporting_period_start).toLocaleDateString()
        : '—');
      return `
        <div class="list-group-item validation-queue-item p-3${active}"
             onclick="RBMValidation.selectItem('${item.id}')">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <span class="fw-semibold small text-truncate me-2" style="max-width:170px">${name}</span>
            ${statusBadgeHtml(item.validation_status || item.validationStatus)}
          </div>
          <div class="item-meta text-truncate">${project}</div>
          <div class="item-meta">${period}</div>
        </div>`;
    }).join('');
  }

  /* ── Load queue from API ─────────────────────────────────── */
  async function loadQueue() {
    const list = document.getElementById('queueList');
    list.innerHTML = '<div class="p-3 text-center text-muted small"><div class="spinner-border spinner-border-sm me-2"></div>Loading…</div>';

    try {
      const status = state.statusFilter ? `?status=${encodeURIComponent(state.statusFilter)}` : '';
      const data = await apiFetch(`/indicator-values${status}`);
      state.queue = Array.isArray(data) ? data : (data && data.items ? data.items : []);
      renderQueue();
    } catch (e) {
      list.innerHTML = `<div class="p-3 text-danger small"><i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</div>`;
    }
  }

  /* ── Select queue item / load detail ────────────────────── */
  async function selectItem(id) {
    state.activeItemId = id;
    renderQueue(); // refresh active highlight

    document.getElementById('detailPlaceholder').style.display = 'none';
    const panel = document.getElementById('detailPanel');
    panel.style.display = 'block';

    // Reset action feedback
    const fb = document.getElementById('actionFeedback');
    fb.style.display = 'none';
    fb.innerHTML = '';
    document.getElementById('verifyNotes').value = '';
    document.getElementById('rejectReason').value = '';
    document.getElementById('autoChecksSection').style.display = 'none';
    document.getElementById('notesSection').style.display = 'none';

    // Skeleton fill
    document.getElementById('detailIndicatorName').textContent = 'Loading…';
    document.getElementById('detailStatusBadge').textContent = '…';
    document.getElementById('auditTimeline').innerHTML =
      '<div class="skeleton" style="height:3rem">&nbsp;</div>';

    try {
      const data = await apiFetch(`/indicator-values/${id}`);
      if (!data) return;

      const v = data.value || data;
      const statusStr = v.validation_status || v.validationStatus || 'pending';

      document.getElementById('detailIndicatorName').textContent =
        v.indicator_name || v.indicatorName || '—';
      document.getElementById('detailStatusBadge').outerHTML =
        `<span class="badge ${statusBadgeHtml(statusStr).match(/class="([^"]+)"/)[1]}" id="detailStatusBadge">${statusStr}</span>`;

      document.getElementById('detailProject').textContent =
        v.project_name || v.projectName || '—';
      document.getElementById('detailPeriod').textContent =
        v.reporting_period_start
          ? `${new Date(v.reporting_period_start).toLocaleDateString()} — ${new Date(v.reporting_period_end || v.reporting_period_start).toLocaleDateString()}`
          : '—';
      document.getElementById('detailSubmittedBy').textContent =
        v.submitted_by_name || v.submittedByName || v.submitted_by || '—';
      document.getElementById('detailValue').textContent =
        v.value != null ? Number(v.value).toLocaleString() : '—';
      document.getElementById('detailUnit').textContent =
        v.unit_of_measurement || v.unitOfMeasurement || '—';
      document.getElementById('detailQuality').innerHTML = qualityBadge(v.quality_score ?? v.qualityScore);

      if (v.auto_checks || data.checks) {
        renderAutoChecks(v.auto_checks || data.checks);
      }

      if (v.validation_notes || v.notes) {
        const ns = document.getElementById('notesSection');
        ns.style.display = '';
        document.getElementById('detailNotes').textContent = v.validation_notes || v.notes;
      }

      // Hide action card for terminal statuses
      const actionCard = document.getElementById('actionCard');
      actionCard.style.display = (statusStr === 'pending' || statusStr === 'flagged') ? '' : 'none';

      // Load audit trail
      loadAuditTrail(id);

    } catch (e) {
      document.getElementById('detailIndicatorName').textContent = 'Error';
      showFeedback('danger', e.message);
    }
  }

  /* ── Audit Trail ─────────────────────────────────────────── */
  async function loadAuditTrail(id) {
    const timeline = document.getElementById('auditTimeline');
    try {
      const data = await apiFetch(`/validation/${id}/audit`);
      const entries = Array.isArray(data) ? data : (data && data.entries ? data.entries : []);
      if (!entries.length) {
        timeline.innerHTML = '<p class="text-muted small">No audit entries yet.</p>';
        return;
      }
      timeline.innerHTML = entries.map(e => `
        <div class="audit-entry">
          <div class="d-flex align-items-start justify-content-between">
            <span class="small fw-semibold">${escHtml(e.action || e.new_status || '—')}</span>
            <span class="audit-time">${e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</span>
          </div>
          <div class="small text-muted">${escHtml(e.performed_by_name || e.performedBy || '')}</div>
          ${e.notes || e.reason ? `<div class="small mt-1 fst-italic">${escHtml(e.notes || e.reason)}</div>` : ''}
        </div>`).join('');
    } catch {
      timeline.innerHTML = '<p class="text-muted small">Could not load audit trail.</p>';
    }
  }

  /* ── Verify action ───────────────────────────────────────── */
  async function verify() {
    if (!state.activeItemId) return;
    const notes = document.getElementById('verifyNotes').value.trim();
    setActionBtnsDisabled(true);
    try {
      await apiFetch(`/validation/${state.activeItemId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
      showFeedback('success', 'Value verified successfully.');
      removeFromQueue(state.activeItemId);
      document.getElementById('actionCard').style.display = 'none';
      loadAuditTrail(state.activeItemId);
    } catch (e) {
      showFeedback('danger', `Verification failed: ${e.message}`);
    } finally {
      setActionBtnsDisabled(false);
    }
  }

  /* ── Reject action ───────────────────────────────────────── */
  async function reject() {
    if (!state.activeItemId) return;
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) {
      showFeedback('warning', 'A rejection reason is required.');
      document.getElementById('rejectReason').focus();
      return;
    }
    setActionBtnsDisabled(true);
    try {
      await apiFetch(`/validation/${state.activeItemId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      showFeedback('success', 'Value rejected.');
      removeFromQueue(state.activeItemId);
      document.getElementById('actionCard').style.display = 'none';
      loadAuditTrail(state.activeItemId);
    } catch (e) {
      showFeedback('danger', `Rejection failed: ${e.message}`);
    } finally {
      setActionBtnsDisabled(false);
    }
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function showFeedback(type, msg) {
    const fb = document.getElementById('actionFeedback');
    fb.style.display = '';
    fb.innerHTML = `<div class="alert alert-${type} py-2 mb-0 small">
      <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'x-circle'} me-1"></i>
      ${escHtml(msg)}
    </div>`;
  }

  function setActionBtnsDisabled(disabled) {
    document.getElementById('verifyBtn').disabled = disabled;
    document.getElementById('rejectBtn').disabled = disabled;
  }

  function removeFromQueue(id) {
    state.queue = state.queue.filter(i => i.id !== id);
    renderQueue();
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.RBMValidation = {
    selectItem,
    verify,
    reject,
    refreshQueue: loadQueue,
  };

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    if (!getToken()) { window.location.href = '/login.html'; return; }

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

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', e => {
      state.statusFilter = e.target.value;
      state.activeItemId = null;
      document.getElementById('detailPlaceholder').style.display = '';
      document.getElementById('detailPanel').style.display = 'none';
      loadQueue();
    });

    // Queue search
    let searchTimer;
    document.getElementById('queueSearch').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderQueue();
      }, 200);
    });

    // Handle ?id= querystring (e.g. deep-link from dashboard)
    const params = new URLSearchParams(window.location.search);
    const preSelectId = params.get('id');

    loadQueue().then(() => {
      if (preSelectId) selectItem(preSelectId);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
