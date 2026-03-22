/**
 * User Profile View
 * Renders the profile page inside the main SPA shell.
 */

import { apiService } from './apiService.js';
import { stateManager } from './stateManager.js';
import { showChangePasswordModal } from './passwordManagement.js';

/**
 * Render the User Profile view.
 * @param {HTMLElement} container - The #main-content element.
 */
export async function renderProfile(container) {
    container.innerHTML = `
        <div class="container-fluid py-4">
            <div class="row mb-3">
                <div class="col-12">
                    <h2><i class="bi bi-person-circle text-primary"></i> User Profile</h2>
                    <p class="text-muted">Manage your account information and security settings.</p>
                </div>
            </div>

            <div class="row">
                <!-- Profile Information -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-person-circle"></i> Profile Information</h5>
                        </div>
                        <div class="card-body">
                            <div id="profileInfo">
                                <div class="text-center py-4">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Change Password -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-key"></i> Change Password</h5>
                        </div>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <p class="text-muted">Keep your account secure by regularly updating your password.</p>
                                <button type="button" class="btn btn-success w-100" id="changePasswordBtn">
                                    <i class="bi bi-key me-2"></i> Change Password
                                </button>
                            </div>
                            <small class="text-muted mt-3">
                                <i class="bi bi-info-circle me-1"></i>
                                Password must be at least 8 characters and contain uppercase, lowercase, and numbers.
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Active Sessions -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-warning text-dark">
                            <h5 class="mb-0"><i class="bi bi-device-hdd"></i> Active Sessions</h5>
                        </div>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <p class="text-muted">View and manage your active login sessions across different devices.</p>
                                <button type="button" class="btn btn-warning w-100" id="manageSessionsBtn">
                                    <i class="bi bi-device-hdd me-2"></i> Manage Sessions
                                </button>
                            </div>
                            <small class="text-muted mt-3">
                                <i class="bi bi-info-circle me-1"></i>
                                You can revoke access from any device where you're logged in.
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Roles & Permissions -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-shield-check"></i> Roles &amp; Permissions</h5>
                        </div>
                        <div class="card-body">
                            <div id="rolesPermissions">
                                <div class="text-center py-4">
                                    <div class="spinner-border text-info" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Wire up buttons
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        showChangePasswordModal();
    });

    document.getElementById('manageSessionsBtn').addEventListener('click', () => {
        window.location.hash = 'sessions';
    });

    // Load profile data
    await loadProfileInfo();
}

async function loadProfileInfo() {
    try {
        const result = await apiService.get('/auth/me');

        if (result.success && result.data && result.data.user) {
            const user = result.data.user;
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
            const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

            document.getElementById('profileInfo').innerHTML = `
                <div class="mb-3">
                    <label class="text-muted small fw-semibold">Full Name</label>
                    <div class="fs-5 fw-bold">${fullName}</div>
                </div>
                <div class="mb-3">
                    <label class="text-muted small fw-semibold">Email</label>
                    <div>${user.email || 'N/A'}</div>
                </div>
                <div class="mb-3">
                    <label class="text-muted small fw-semibold">Username</label>
                    <div>${user.username || 'N/A'}</div>
                </div>
                <div class="mb-3">
                    <label class="text-muted small fw-semibold">Status</label>
                    <div>
                        <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
                            ${user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                <div class="mb-0">
                    <label class="text-muted small fw-semibold">Member Since</label>
                    <div>${joinDate}</div>
                </div>
            `;

            const rolesHtml = (user.roles && user.roles.length > 0)
                ? user.roles.map(r => `<span class="badge bg-primary me-2 mb-2">${r.display_name || r.name}</span>`).join('')
                : '<span class="text-muted">No roles assigned</span>';

            const permissionsHtml = (user.permissions && user.permissions.length > 0)
                ? user.permissions.map(p => `<span class="badge bg-secondary me-2 mb-2">${p.name}</span>`).join('')
                : '<span class="text-muted">No permissions assigned</span>';

            document.getElementById('rolesPermissions').innerHTML = `
                <div class="mb-4">
                    <h6 class="fw-bold">Roles</h6>
                    <div>${rolesHtml}</div>
                </div>
                <div>
                    <h6 class="fw-bold">Permissions</h6>
                    <div>${permissionsHtml}</div>
                </div>
            `;
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profileInfo').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load profile information. Please refresh.
            </div>
        `;
        document.getElementById('rolesPermissions').innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> Unable to load roles and permissions.
            </div>
        `;
    }
}
