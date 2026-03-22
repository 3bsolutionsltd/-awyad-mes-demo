/**
 * Permission Matrix UI
 * Visual interface for managing role-permission assignments
 */

import { apiService } from './apiService.js';
import { showNotification, createCard } from './components.js';

/**
 * Render permission matrix page
 */
export async function renderPermissionMatrix() {
  const app = document.getElementById('content-area');

  // Show loading state
  app.innerHTML = `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  `;

  try {
    // Fetch permission matrix data
    const response = await apiService.get('/permissions/matrix');
    const { roles, permissions, matrix } = response.data;

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {});

    app.innerHTML = `
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h2><i class="bi bi-shield-lock me-2"></i>Permission Matrix</h2>
                <p class="text-muted mb-0">Manage role permissions across the system</p>
              </div>
              <div>
                <button class="btn btn-outline-secondary me-2" id="refreshMatrixBtn">
                  <i class="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
                <button class="btn btn-primary" id="viewRolesBtn">
                  <i class="bi bi-people me-1"></i>
                  View Roles
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card text-white bg-primary mb-3">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-people-fill"></i> Total Roles</h6>
                <h3 class="mb-0">${roles.length}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-white bg-success mb-3">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-shield-lock-fill"></i> Total Permissions</h6>
                <h3 class="mb-0">${permissions.length}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-white bg-info mb-3">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-box-fill"></i> Unique Resources</h6>
                <h3 class="mb-0">${Object.keys(groupedPermissions).length}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card text-white bg-warning mb-3">
              <div class="card-body">
                <h6 class="card-title"><i class="bi bi-check-circle-fill"></i> Total Assignments</h6>
                <h3 class="mb-0">${matrix.reduce((sum, role) => sum + role.permissions.filter(p => p.granted).length, 0)}</h3>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchPermission" 
                     placeholder="Search permissions...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterResource">
              <option value="">All Resources</option>
              ${Object.keys(groupedPermissions).sort().map(resource => 
                `<option value="${resource}">${resource.charAt(0).toUpperCase() + resource.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterRole">
              <option value="">All Roles</option>
              ${roles.map(role => 
                `<option value="${role.id}">${role.display_name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Permission Matrix Table -->
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
              <table class="table table-bordered table-hover mb-0" id="permissionMatrix">
                <thead class="table-light" style="position: sticky; top: 0; z-index: 10;">
                  <tr>
                    <th style="min-width: 200px; position: sticky; left: 0; background: #f8f9fa; z-index: 11;">
                      Permission
                    </th>
                    <th style="min-width: 150px;">Resource</th>
                    ${roles.map(role => `
                      <th class="text-center" style="min-width: 120px;" title="${role.description || ''}">
                        ${role.display_name}
                        ${role.is_system ? '<br><small class="badge bg-secondary">System</small>' : ''}
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${permissions.map(permission => `
                    <tr data-permission-id="${permission.id}" data-resource="${permission.resource}">
                      <td style="position: sticky; left: 0; background: white;">
                        <strong>${permission.name}</strong>
                        ${permission.description ? `<br><small class="text-muted">${permission.description}</small>` : ''}
                      </td>
                      <td>
                        <span class="badge bg-info">${permission.resource}</span>
                      </td>
                      ${roles.map(role => {
                        const roleData = matrix.find(r => r.id === role.id);
                        const permissionData = roleData?.permissions.find(p => p.id === permission.id);
                        const isGranted = permissionData?.granted || false;
                        
                        return `
                          <td class="text-center">
                            <div class="form-check form-switch d-inline-block">
                              <input 
                                class="form-check-input permission-toggle" 
                                type="checkbox" 
                                role="switch"
                                ${isGranted ? 'checked' : ''}
                                ${role.is_system ? 'disabled' : ''}
                                data-role-id="${role.id}"
                                data-role-name="${role.display_name}"
                                data-permission-id="${permission.id}"
                                data-permission-name="${permission.name}"
                                title="${isGranted ? 'Click to revoke' : 'Click to grant'}"
                              >
                            </div>
                          </td>
                        `;
                      }).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-muted">
            <small>
              <i class="bi bi-info-circle me-1"></i>
              Toggle switches to grant or revoke permissions. System roles cannot be modified.
            </small>
          </div>
        </div>

        <!-- Role Details Modal -->
        <div class="modal fade" id="roleDetailsModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Role Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="roleDetailsContent">
                <!-- Content will be loaded dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    attachPermissionMatrixListeners();

  } catch (error) {
    console.error('Error loading permission matrix:', error);
    showNotification(error.message || 'Failed to load permission matrix', 'danger');
    app.innerHTML = `
      <div class="container py-5">
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle me-2"></i>Error Loading Permission Matrix</h4>
          <p>${error.message}</p>
          <button class="btn btn-outline-danger" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-1"></i>Retry
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Attach event listeners for permission matrix
 */
function attachPermissionMatrixListeners() {
  // Refresh button
  document.getElementById('refreshMatrixBtn')?.addEventListener('click', () => {
    renderPermissionMatrix();
  });

  // View roles button
  document.getElementById('viewRolesBtn')?.addEventListener('click', () => {
    showRolesList();
  });

  // Search filter
  document.getElementById('searchPermission')?.addEventListener('input', (e) => {
    filterPermissionMatrix(e.target.value);
  });

  // Resource filter
  document.getElementById('filterResource')?.addEventListener('change', (e) => {
    filterByResource(e.target.value);
  });

  // Role filter
  document.getElementById('filterRole')?.addEventListener('change', (e) => {
    filterByRole(e.target.value);
  });

  // Permission toggles
  document.querySelectorAll('.permission-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const roleId = e.target.dataset.roleId;
      const roleName = e.target.dataset.roleName;
      const permissionId = e.target.dataset.permissionId;
      const permissionName = e.target.dataset.permissionName;
      const isGranted = e.target.checked;

      try {
        if (isGranted) {
          // Grant permission
          const confirmed = confirm(`Grant permission "${permissionName}" to role "${roleName}"?`);

          if (confirmed) {
            await apiService.post('/permissions/grant', {
              roleId,
              permissionId,
            });

            showNotification(`Permission granted to ${roleName}`, 'success');
          } else {
            // Revert toggle
            e.target.checked = false;
          }
        } else {
          // Revoke permission
          const confirmed = confirm(`Revoke permission "${permissionName}" from role "${roleName}"?`);

          if (confirmed) {
            await apiService.post('/permissions/revoke', {
              roleId,
              permissionId,
            });

            showNotification(`Permission revoked from ${roleName}`, 'warning');
          } else {
            // Revert toggle
            e.target.checked = true;
          }
        }
      } catch (error) {
        console.error('Error toggling permission:', error);
        showNotification(error.message || 'Failed to update permission', 'danger');
        // Revert toggle on error
        e.target.checked = !isGranted;
      }
    });
  });
}

/**
 * Filter permission matrix by search term
 */
function filterPermissionMatrix(searchTerm) {
  const rows = document.querySelectorAll('#permissionMatrix tbody tr');
  const term = searchTerm.toLowerCase();

  rows.forEach(row => {
    const permissionName = row.querySelector('td:first-child strong')?.textContent.toLowerCase() || '';
    const resource = row.dataset.resource?.toLowerCase() || '';
    
    if (permissionName.includes(term) || resource.includes(term)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

/**
 * Filter permission matrix by resource
 */
function filterByResource(resource) {
  const rows = document.querySelectorAll('#permissionMatrix tbody tr');

  rows.forEach(row => {
    if (!resource || row.dataset.resource === resource) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

/**
 * Filter permission matrix by role
 */
function filterByRole(roleId) {
  // If no role selected, show all columns
  if (!roleId) {
    document.querySelectorAll('#permissionMatrix th, #permissionMatrix td').forEach(cell => {
      cell.style.display = '';
    });
    return;
  }

  // Get role column index
  const headers = Array.from(document.querySelectorAll('#permissionMatrix thead th'));
  const roleIndex = headers.findIndex(th => {
    const checkbox = th.nextElementSibling?.querySelector(`[data-role-id="${roleId}"]`);
    return !!checkbox;
  });

  // Hide all role columns except selected one
  document.querySelectorAll('#permissionMatrix tbody tr').forEach(row => {
    Array.from(row.querySelectorAll('td')).forEach((cell, index) => {
      // Keep first 2 columns (permission name and resource)
      if (index < 2) return;
      
      // Show only selected role column
      const checkbox = cell.querySelector('.permission-toggle');
      if (checkbox && checkbox.dataset.roleId === roleId) {
        cell.style.display = '';
      } else if (checkbox) {
        cell.style.display = 'none';
      }
    });
  });

  // Hide header columns
  Array.from(headers).forEach((header, index) => {
    if (index < 2) return; // Keep first 2 columns
    
    const nextRow = header.closest('thead').nextElementSibling?.firstElementChild;
    const cell = nextRow?.querySelectorAll('td')[index];
    const checkbox = cell?.querySelector('.permission-toggle');
    
    if (checkbox && checkbox.dataset.roleId === roleId) {
      header.style.display = '';
    } else if (index >= 2) {
      header.style.display = 'none';
    }
  });
}

/**
 * Show roles list modal
 */
async function showRolesList() {
  try {
    const response = await apiService.get('/permissions/roles');
    const { roles } = response.data;

    const modal = new bootstrap.Modal(document.getElementById('roleDetailsModal'));
    const content = document.getElementById('roleDetailsContent');

    content.innerHTML = `
      <div class="list-group">
        ${roles.map(role => `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h6 class="mb-1">
                  ${role.display_name}
                  ${role.is_system ? '<span class="badge bg-secondary ms-2">System</span>' : ''}
                </h6>
                <p class="mb-1 text-muted small">${role.description || 'No description'}</p>
                <div class="mt-2">
                  <strong>Permissions (${role.permissions?.length || 0}):</strong>
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    ${(role.permissions || []).map(p => 
                      `<span class="badge bg-info">${p.name}</span>`
                    ).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    modal.show();
  } catch (error) {
    console.error('Error loading roles:', error);
    showNotification(error.message || 'Failed to load roles', 'danger');
  }
}
