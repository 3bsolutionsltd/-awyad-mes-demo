/**
 * rbm-non-prog.js
 * Controller for Non-Program Activities page.
 */
(function () {
  'use strict';

  const API = '/api/v1/non-program-activities';

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

  function progressBar(achieved, target) {
    const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
    const cls = pct >= 90 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger';
    return `<div class="d-flex align-items-center gap-1">
      <div class="progress flex-grow-1" style="height:8px">
        <div class="progress-bar ${cls}" style="width:${pct}%"></div>
      </div>
      <span class="small text-muted">${pct}%</span>
    </div>`;
  }

  function statusBadge(status) {
    const map = {
      'Planned':     'bg-secondary-subtle text-secondary',
      'In Progress': 'bg-warning-subtle text-warning',
      'Completed':   'bg-success-subtle text-success',
      'Cancelled':   'bg-danger-subtle text-danger',
    };
    const cls = map[status] || 'bg-secondary-subtle text-secondary';
    return `<span class="badge ${cls}">${escHtml(status || '—')}</span>`;
  }

  /* ── State ────────────────────────────────────────────────── */
  let allActivities = [];
  let categories    = [];
  let activeCatId   = '';   // '' = all

  /* ── User name ────────────────────────────────────────────── */
  function showUserName() {
    const nameEl = document.getElementById('userName');
    if (!nameEl) return;
    try {
      const token = getToken();
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      nameEl.textContent = payload.full_name || payload.username || '';
    } catch (_) {}
  }

  /* ── Categories ───────────────────────────────────────────── */
  async function loadCategories() {
    try {
      const data = await apiFetch(`${API}/categories`);
      categories = Array.isArray(data) ? data : (data?.data || []);
      renderCategoryList();
      populateCategoryDropdown();
      populateCategoryManageList();
    } catch (e) {
      console.warn('Could not load categories:', e.message);
    }
  }

  function renderCategoryList() {
    const el = document.getElementById('categoryList');
    if (!el) return;
    const allLink = `<a href="#" class="list-group-item list-group-item-action ${activeCatId === '' ? 'active' : ''}"
        data-cat-id="">
      <i class="bi bi-grid me-1"></i>All Categories
      <span class="badge bg-secondary float-end">${allActivities.length}</span>
    </a>`;
    const catLinks = categories.map(c => {
      const count = allActivities.filter(a => a.category_id === c.id).length;
      const color  = c.color ? `style="border-left:4px solid ${escHtml(c.color)}"` : '';
      return `<a href="#" class="list-group-item list-group-item-action ${activeCatId === c.id ? 'active' : ''}"
          data-cat-id="${escHtml(c.id)}" ${color}>
        <i class="bi bi-${escHtml(c.icon || 'tag')} me-1"></i>${escHtml(c.name)}
        <span class="badge bg-secondary float-end">${count}</span>
      </a>`;
    }).join('');
    el.innerHTML = allLink + catLinks;
    el.querySelectorAll('a[data-cat-id]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        activeCatId = a.dataset.catId;
        renderCategoryList();
        renderTable();
      });
    });
  }

  function populateCategoryDropdown() {
    const sel = document.getElementById('fldCategory');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select category —</option>';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  }

  function populateCategoryManageList() {
    const el = document.getElementById('categoriesManageList');
    if (!el) return;
    if (!categories.length) {
      el.innerHTML = '<li class="list-group-item text-muted text-center small">No categories yet.</li>';
      return;
    }
    el.innerHTML = categories.map(c => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-2">
        <span><i class="bi bi-${escHtml(c.icon || 'tag')} me-1 text-secondary"></i>${escHtml(c.name)}</span>
        <button class="btn btn-sm btn-outline-danger py-0 px-2" data-del-cat="${escHtml(c.id)}">
          <i class="bi bi-trash"></i>
        </button>
      </li>
    `).join('');
    el.querySelectorAll('[data-del-cat]').forEach(btn => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.delCat));
    });
  }

  async function addCategory() {
    const name  = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value.trim();
    const errEl = document.getElementById('categoryError');
    errEl.classList.add('d-none');
    if (!name) { errEl.textContent = 'Category name is required.'; errEl.classList.remove('d-none'); return; }
    try {
      await apiFetch(`${API}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name, color: color || null }),
      });
      document.getElementById('newCategoryName').value = '';
      document.getElementById('newCategoryColor').value = '';
      await loadCategories();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('d-none');
    }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category? Activities in it will be uncategorised.')) return;
    try {
      await apiFetch(`${API}/categories/${id}`, { method: 'DELETE' });
      await loadCategories();
      await loadActivities();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── Activities ───────────────────────────────────────────── */
  async function loadActivities() {
    const tbody = document.getElementById('activitiesTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>`;
    try {
      const data = await apiFetch(`${API}`);
      allActivities = Array.isArray(data) ? data : (data?.data || data?.activities || []);
      populateFilterPeriod();
      renderCategoryList();
      renderTable();
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3"><i class="bi bi-exclamation-circle me-1"></i>${escHtml(e.message)}</td></tr>`;
    }
  }

  function populateFilterPeriod() {
    const sel = document.getElementById('filterPeriod');
    if (!sel) return;
    const periods = [...new Set(allActivities.map(a => a.reporting_period).filter(Boolean))];
    sel.innerHTML = '<option value="">All Periods</option>';
    periods.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });
  }

  function renderTable() {
    const tbody  = document.getElementById('activitiesTableBody');
    const search = (document.getElementById('filterSearch')?.value || '').toLowerCase();
    const period = document.getElementById('filterPeriod')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const count  = document.getElementById('countLabel');

    let rows = allActivities;
    if (activeCatId) rows = rows.filter(a => a.category_id === activeCatId);
    if (search)  rows = rows.filter(a => (a.activity_name || '').toLowerCase().includes(search) || (a.description || '').toLowerCase().includes(search));
    if (period)  rows = rows.filter(a => a.reporting_period === period);
    if (status)  rows = rows.filter(a => a.status === status);

    if (count) count.textContent = `${rows.length} activit${rows.length !== 1 ? 'ies' : 'y'}`;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No activities found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(a => {
      const catName   = categories.find(c => c.id === a.category_id)?.name || '—';
      const target    = Number(a.target || 0);
      const achieved  = Number(a.achieved || 0);
      const unit      = a.unit_of_measure || a.unit || '';
      const period    = escHtml(a.reporting_period || '—');
      return `<tr>
        <td>
          <div class="fw-semibold small">${escHtml(a.activity_name)}</div>
          ${a.description ? `<div class="text-muted" style="font-size:.78rem">${escHtml(a.description.substring(0,80))}${a.description.length>80?'…':''}</div>` : ''}
        </td>
        <td><span class="badge bg-secondary-subtle text-secondary">${escHtml(catName)}</span></td>
        <td class="small text-muted">${period}</td>
        <td class="text-end small">${target.toLocaleString()}${unit ? ` <span class="text-muted">${escHtml(unit)}</span>` : ''}</td>
        <td class="text-end small fw-semibold">${achieved.toLocaleString()}</td>
        <td>${progressBar(achieved, target)}</td>
        <td class="text-center">${statusBadge(a.status)}</td>
        <td class="text-center no-print">
          <button class="btn btn-sm btn-outline-primary py-0 px-2 me-1" data-edit="${escHtml(a.id)}" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger py-0 px-2" data-del="${escHtml(a.id)}" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
    tbody.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => deleteActivity(btn.dataset.del)));
  }

  /* ── Create / Edit Modal ──────────────────────────────────── */
  function openCreateModal() {
    document.getElementById('activityModalTitle').textContent = 'New Non-Program Activity';
    document.getElementById('editActivityId').value = '';
    document.getElementById('activityForm').reset();
    document.getElementById('activityFormError').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('activityModal')).show();
  }

  function openEditModal(id) {
    const act = allActivities.find(a => a.id === id);
    if (!act) return;
    document.getElementById('activityModalTitle').textContent = 'Edit Activity';
    document.getElementById('editActivityId').value = act.id;
    document.getElementById('fldActivityName').value    = act.activity_name || '';
    document.getElementById('fldCategory').value        = act.category_id || '';
    document.getElementById('fldReportingPeriod').value = act.reporting_period || '';
    document.getElementById('fldDescription').value     = act.description || '';
    document.getElementById('fldTarget').value          = act.target ?? '';
    document.getElementById('fldAchieved').value        = act.achieved ?? 0;
    document.getElementById('fldUnit').value            = act.unit_of_measure || act.unit || '';
    document.getElementById('fldStartDate').value       = act.start_date ? act.start_date.split('T')[0] : '';
    document.getElementById('fldEndDate').value         = act.end_date ? act.end_date.split('T')[0] : '';
    document.getElementById('fldStatus').value          = act.status || 'Planned';
    document.getElementById('fldNotes').value           = act.notes || '';
    document.getElementById('activityFormError').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('activityModal')).show();
  }

  async function saveActivity(e) {
    e.preventDefault();
    const errEl  = document.getElementById('activityFormError');
    errEl.classList.add('d-none');
    const id     = document.getElementById('editActivityId').value;
    const body   = {
      activity_name:    document.getElementById('fldActivityName').value.trim(),
      category_id:      document.getElementById('fldCategory').value || null,
      reporting_period: document.getElementById('fldReportingPeriod').value.trim() || null,
      description:      document.getElementById('fldDescription').value.trim() || null,
      target:           parseFloat(document.getElementById('fldTarget').value) || 0,
      achieved:         parseFloat(document.getElementById('fldAchieved').value) || 0,
      unit_of_measure:  document.getElementById('fldUnit').value.trim() || null,
      start_date:       document.getElementById('fldStartDate').value || null,
      end_date:         document.getElementById('fldEndDate').value || null,
      status:           document.getElementById('fldStatus').value,
      notes:            document.getElementById('fldNotes').value.trim() || null,
    };
    if (!body.activity_name) { errEl.textContent = 'Activity name is required.'; errEl.classList.remove('d-none'); return; }
    if (!body.category_id)   { errEl.textContent = 'Please select a category.';  errEl.classList.remove('d-none'); return; }
    const saveBtn = document.getElementById('saveActivityBtn');
    saveBtn.disabled = true;
    try {
      if (id) {
        await apiFetch(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch(`${API}`,       { method: 'POST', body: JSON.stringify(body) });
      }
      bootstrap.Modal.getInstance(document.getElementById('activityModal')).hide();
      await loadActivities();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('d-none');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function deleteActivity(id) {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    try {
      await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      await loadActivities();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ── Init ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (!token) { window.location.href = '/login.html'; return; }

    showUserName();

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login.html';
    });

    // Filters
    ['filterSearch', 'filterPeriod', 'filterStatus'].forEach(id => {
      document.getElementById(id)?.addEventListener('input',  renderTable);
      document.getElementById(id)?.addEventListener('change', renderTable);
    });

    // New activity
    document.getElementById('newActivityBtn')?.addEventListener('click', openCreateModal);

    // Save activity form
    document.getElementById('activityForm')?.addEventListener('submit', saveActivity);

    // Category management
    document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => {
      populateCategoryManageList();
      new bootstrap.Modal(document.getElementById('categoryModal')).show();
    });
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
      populateCategoryManageList();
      new bootstrap.Modal(document.getElementById('categoryModal')).show();
    });
    document.getElementById('addCategoryConfirmBtn')?.addEventListener('click', addCategory);

    // Load data
    loadCategories().then(() => loadActivities());
  });

})();
