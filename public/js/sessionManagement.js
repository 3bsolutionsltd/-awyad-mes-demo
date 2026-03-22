/**
 * Session Management UI
 * Allows users to view and manage their active sessions
 */

import { apiService } from './apiService.js';
import { showNotification } from './components.js';
import { stateManager } from './stateManager.js';

/**
 * Format a date string to a readable format
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function renderSessionManagement() {
  const contentArea = document.getElementById('content-area');
  
  // Get user data from state
  const userData = stateManager.getState().user;
  const isAdmin = userData?.permissions?.includes('users.read');

  contentArea.innerHTML = `
    <div class="session-management">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i class="bi bi-device-hdd"></i> Session Management</h2>
          <p class="text-muted mb-0">Manage active sessions and security settings</p>
        </div>
        <button id="refresh-sessions" class="btn btn-outline-primary">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      ${isAdmin ? `
        <!-- Admin Statistics -->
        <div id="session-stats" class="row mb-4">
          <div class="col-md-3 mb-3">
            <div class="card text-white bg-primary">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-circle-fill"></i> Active Sessions</h6>
                <h3 class="mb-0" id="stat-active">-</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card text-white bg-secondary">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-clock-history"></i> Expired</h6>
                <h3 class="mb-0" id="stat-expired">-</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card text-white bg-warning">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-x-circle-fill"></i> Revoked</h6>
                <h3 class="mb-0" id="stat-revoked">-</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="card text-white bg-info">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-people-fill"></i> Unique Users</h6>
                <h3 class="mb-0" id="stat-users">-</h3>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin View Toggle -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="admin-view-toggle">
              <label class="form-check-label" for="admin-view-toggle">
                <strong>Admin View:</strong> View all users' sessions
              </label>
            </div>
            <div id="admin-filters" class="mt-3" style="display: none;">
              <div class="row g-3">
                <div class="col-md-4">
                  <label for="filter-status" class="form-label">Status</label>
                  <select id="filter-status" class="form-select">
                    <option value="">All Statuses</option>
                    <option value="active" selected>Active</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="filter-user" class="form-label">User Email</label>
                  <input type="text" id="filter-user" class="form-control" placeholder="Filter by email...">
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button id="apply-filters" class="btn btn-primary w-100">
                    <i class="bi bi-funnel"></i> Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- My Sessions -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-device-hdd-fill"></i> 
            ${isAdmin ? '<span id="sessions-title">My Active Sessions</span>' : 'My Active Sessions'}
          </h5>
        </div>
        <div class="card-body">
          <div id="sessions-list">
            <div class="text-center text-muted py-5">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading sessions...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Session Info -->
      <div class="alert alert-info mt-4">
        <i class="bi bi-info-circle-fill"></i>
        <strong>Security Tips:</strong>
        <ul class="mb-0 mt-2">
          <li>Sessions marked with <span class="badge bg-success">Current</span> are from this browser</li>
          <li>If you see unfamiliar sessions, revoke them immediately</li>
          <li>Sessions automatically expire after 7 days of inactivity</li>
          <li>Revoking a session will log out that device</li>
        </ul>
      </div>
    </div>
  `;

  // Initialize
  let adminView = false;
  
  // Event Listeners
  document.getElementById('refresh-sessions').addEventListener('click', () => {
    loadSessions(adminView);
  });

  if (isAdmin) {
    const adminToggle = document.getElementById('admin-view-toggle');
    const adminFilters = document.getElementById('admin-filters');

    adminToggle.addEventListener('change', () => {
      adminView = adminToggle.checked;
      adminFilters.style.display = adminView ? 'block' : 'none';
      document.getElementById('sessions-title').textContent = 
        adminView ? 'All Users\' Sessions' : 'My Active Sessions';
      loadSessions(adminView);
    });

    document.getElementById('apply-filters').addEventListener('click', () => {
      loadSessions(adminView);
    });

    // Load stats
    loadStats();
  }

  // Initial load
  loadSessions(adminView);

  // Functions
  async function loadStats() {
    try {
      const response = await apiService.get('/sessions/stats');
      
      if (response.success) {
        document.getElementById('stat-active').textContent = response.data.active;
        document.getElementById('stat-expired').textContent = response.data.expired;
        document.getElementById('stat-revoked').textContent = response.data.revoked;
        document.getElementById('stat-users').textContent = response.data.uniqueUsers;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadSessions(isAdminView) {
    const listContainer = document.getElementById('sessions-list');
    listContainer.innerHTML = `
      <div class="text-center text-muted py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading sessions...</p>
      </div>
    `;

    try {
      let response;
      if (isAdminView) {
        const status = document.getElementById('filter-status').value;
        const userFilter = document.getElementById('filter-user').value;
        
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (userFilter) params.append('userId', userFilter);
        
        response = await apiService.get(`/sessions/all?${params.toString()}`);
      } else {
        response = await apiService.get('/sessions');
      }

      if (response.success) {
        displaySessions(response.data.sessions, isAdminView);
      }
    } catch (error) {
      listContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i>
          Failed to load sessions: ${error.message}
        </div>
      `;
    }
  }

  function displaySessions(sessions, isAdminView) {
    const listContainer = document.getElementById('sessions-list');

    if (!sessions || sessions.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="bi bi-device-hdd" style="font-size: 3rem;"></i>
          <p class="mt-2">No sessions found</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              ${isAdminView ? '<th>User</th>' : ''}
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map(session => createSessionRow(session, isAdminView)).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach revoke handlers
    sessions.forEach(session => {
      const revokeBtn = document.getElementById(`revoke-${session.id}`);
      if (revokeBtn) {
        revokeBtn.addEventListener('click', () => revokeSession(session, isAdminView));
      }
    });
  }

  function createSessionRow(session, isAdminView) {
    const statusBadge = getStatusBadge(session.status);
    const currentBadge = session.isCurrentSession 
      ? '<span class="badge bg-success ms-2">Current</span>' 
      : '';

    return `
      <tr class="${session.status !== 'active' ? 'table-secondary' : ''}">
        ${isAdminView ? `
          <td>
            <div>
              <strong>${session.username || 'N/A'}</strong><br>
              <small class="text-muted">${session.email}</small>
            </div>
          </td>
        ` : ''}
        <td>
          ${statusBadge}
          ${currentBadge}
        </td>
        <td>${formatDate(session.createdAt)}</td>
        <td>${formatDate(session.expiresAt)}</td>
        <td>
          ${session.status === 'active' ? `
            <button id="revoke-${session.id}" class="btn btn-sm btn-outline-danger">
              <i class="bi bi-x-circle"></i> Revoke
            </button>
          ` : `
            <span class="text-muted">-</span>
          `}
        </td>
      </tr>
    `;
  }

  function getStatusBadge(status) {
    const badges = {
      active: '<span class="badge bg-success">Active</span>',
      expired: '<span class="badge bg-secondary">Expired</span>',
      revoked: '<span class="badge bg-warning">Revoked</span>',
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
  }

  async function revokeSession(session, isAdminView) {
    const isCurrentSession = session.isCurrentSession;
    const confirmMessage = isCurrentSession
      ? 'Are you sure you want to revoke this session? You will be logged out immediately.'
      : 'Are you sure you want to revoke this session?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await apiService.delete(`/sessions/${session.id}`);

      if (response.success) {
        showNotification('Session revoked successfully', 'success');
        
        if (isCurrentSession) {
          // Current session revoked - redirect to login
          setTimeout(() => {
            window.location.href = '/login.html';
          }, 1000);
        } else {
          // Reload sessions
          loadSessions(isAdminView);
          if (isAdmin) {
            loadStats();
          }
        }
      }
    } catch (error) {
      showNotification(`Failed to revoke session: ${error.message}`, 'danger');
    }
  }
}
