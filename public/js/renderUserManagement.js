/**
 * User Management Module
 * 
 * Provides comprehensive user administration interface including:
 * - User list with search, filtering, and pagination
 * - Create, edit, and delete users
 * - Role assignment and permission management
 * - User status management (active/inactive/locked)
 * - Session management and audit logs
 * 
 * @module renderUserManagement
 * @requires apiService
 * @requires components
 * @requires stateManager
 * @requires security
 * 
 * @author AWYAD MES Team
 * @since 2.5.0
 */

import { apiService } from './apiService.js';
import { createCard, createButton, createBadge, createModal } from './components.js';
import { stateManager } from './stateManager.js';
import { escapeHtml, sanitizeInput } from './security.js';
import { showAdminPasswordResetModal } from './passwordManagement.js';

/**
 * Main render function for user management page
 * 
 * @returns {Promise<void>}
 */
export async function renderUserManagement() {
    const contentArea = document.getElementById('content-area');
    
    try {
        // Show loading state
        contentArea.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        // Fetch users, roles, and permissions
        const [usersResponse, rolesResponse] = await Promise.all([
            apiService.get('/users', { page: 1, limit: 50 }),
            apiService.get('/users/roles/list')
        ]);

        const users = usersResponse.data.users;
        const pagination = usersResponse.data.pagination;
        const roles = rolesResponse.data.roles;

        // Store in state for later use
        stateManager.setState({ users, roles });

        // Render page
        contentArea.innerHTML = `
            <div class="container-fluid">
                <!-- Page Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h2><i class="bi bi-people"></i> User Management</h2>
                                <p class="text-muted mb-0">Manage system users, roles, and permissions</p>
                            </div>
                            <div>
                                ${createButton({
                                    text: '<i class="bi bi-person-plus"></i> Add User',
                                    className: 'btn-primary',
                                    id: 'btn-add-user'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Total Users',
                            body: `<h3 class="text-primary mb-0">${pagination.total}</h3>`,
                            className: 'border-start border-primary border-4'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Active Users',
                            body: `<h3 class="text-success mb-0">${users.filter(u => u.is_active).length}</h3>`,
                            className: 'border-start border-success border-4'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Inactive Users',
                            body: `<h3 class="text-warning mb-0">${users.filter(u => !u.is_active).length}</h3>`,
                            className: 'border-start border-warning border-4'
                        })}
                    </div>
                    <div class="col-md-3">
                        ${createCard({
                            title: 'Available Roles',
                            body: `<h3 class="text-info mb-0">${roles.length}</h3>`,
                            className: 'border-start border-info border-4'
                        })}
                    </div>
                </div>

                <!-- Search and Filter Bar -->
                <div class="row mb-3">
                    <div class="col-12">
                        ${createCard({
                            body: `
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <div class="input-group">
                                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                                            <input type="text" class="form-control" id="user-search" placeholder="Search by name, email, or username...">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-select" id="filter-role">
                                            <option value="">All Roles</option>
                                            ${roles.map(role => `<option value="${role.name}">${role.display_name}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <select class="form-select" id="filter-status">
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <button class="btn btn-outline-secondary w-100" id="btn-clear-filters">
                                            <i class="bi bi-x-circle"></i> Clear Filters
                                        </button>
                                    </div>
                                </div>
                            `
                        })}
                    </div>
                </div>

                <!-- Users Table -->
                <div class="row">
                    <div class="col-12">
                        ${createCard({
                            title: 'System Users',
                            body: `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead class="table-light">
                                            <tr>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Username</th>
                                                <th>Roles</th>
                                                <th>Status</th>
                                                <th>Last Login</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="users-table-body">
                                            ${renderUsersTableRows(users)}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <!-- Pagination -->
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <div class="text-muted">
                                        Showing ${users.length} of ${pagination.total} users
                                    </div>
                                    <nav aria-label="User pagination">
                                        <ul class="pagination mb-0">
                                            <li class="page-item ${!pagination.hasPrev ? 'disabled' : ''}">
                                                <a class="page-link" href="#" data-page="${pagination.page - 1}">Previous</a>
                                            </li>
                                            ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                                .map(p => `
                                                    <li class="page-item ${p === pagination.page ? 'active' : ''}">
                                                        <a class="page-link" href="#" data-page="${p}">${p}</a>
                                                    </li>
                                                `).join('')}
                                            <li class="page-item ${!pagination.hasNext ? 'disabled' : ''}">
                                                <a class="page-link" href="#" data-page="${pagination.page + 1}">Next</a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            `
                        })}
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error rendering user management:', error);
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-exclamation-triangle"></i> Error Loading Users</h4>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Render table rows for users list
 * 
 * @param {Array} users - Array of user objects
 * @returns {string} HTML string for table rows
 */
function renderUsersTableRows(users) {
    if (!users || users.length === 0) {
        return `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                    No users found
                </td>
            </tr>
        `;
    }

    return users.map(user => {
        const fullName = `${user.first_name} ${user.last_name}`;
        const rolesBadges = user.roles 
            ? user.roles.map(role => createBadge({ text: role.display_name, className: 'bg-info' })).join(' ')
            : '<span class="text-muted">No roles</span>';
        
        const statusBadge = user.is_active
            ? createBadge({ text: 'Active', className: 'bg-success' })
            : createBadge({ text: 'Inactive', className: 'bg-secondary' });
        
        const lastLogin = user.last_login_at 
            ? new Date(user.last_login_at).toLocaleString()
            : '<span class="text-muted">Never</span>';

        return `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2">
                            ${fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <strong>${escapeHtml(fullName)}</strong>
                    </div>
                </td>
                <td>${escapeHtml(user.email)}</td>
                <td>
                    <code>${escapeHtml(user.username)}</code>
                </td>
                <td>${rolesBadges}</td>
                <td>${statusBadge}</td>
                <td><small>${lastLogin}</small></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary btn-edit-user" data-user-id="${user.id}" title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info btn-manage-roles" data-user-id="${user.id}" title="Manage Roles">
                            <i class="bi bi-shield-check"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-reset-password" 
                                data-user-id="${user.id}" 
                                data-user-name="${escapeHtml(fullName)}"
                                title="Reset Password">
                            <i class="bi bi-key"></i>
                        </button>
                        <button class="btn btn-outline-${user.is_active ? 'warning' : 'success'} btn-toggle-status" 
                                data-user-id="${user.id}" 
                                data-current-status="${user.is_active}"
                                title="${user.is_active ? 'Deactivate' : 'Activate'} User">
                            <i class="bi bi-${user.is_active ? 'pause' : 'play'}-circle"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-delete-user" data-user-id="${user.id}" title="Delete User">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Setup event listeners for user management actions
 */
function setupEventListeners() {
    // Add User button
    document.getElementById('btn-add-user')?.addEventListener('click', showAddUserModal);

    // Search input
    const searchInput = document.getElementById('user-search');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterUsers();
        }, 300);
    });

    // Filter dropdowns
    document.getElementById('filter-role')?.addEventListener('change', filterUsers);
    document.getElementById('filter-status')?.addEventListener('change', filterUsers);

    // Clear filters button
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        document.getElementById('user-search').value = '';
        document.getElementById('filter-role').value = '';
        document.getElementById('filter-status').value = '';
        filterUsers();
    });

    // Edit user buttons
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            showEditUserModal(userId);
        });
    });

    // Manage roles buttons
    document.querySelectorAll('.btn-manage-roles').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            showManageRolesModal(userId);
        });
    });

    // Reset password buttons
    document.querySelectorAll('.btn-reset-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            const userName = e.currentTarget.dataset.userName;
            showAdminPasswordResetModal(userId, userName);
        });
    });

    // Toggle status buttons
    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            const currentStatus = e.currentTarget.dataset.currentStatus === 'true';
            toggleUserStatus(userId, currentStatus);
        });
    });

    // Delete user buttons
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            deleteUser(userId);
        });
    });

    // Pagination links
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = parseInt(e.currentTarget.dataset.page);
            if (page) {
                await loadUsers(page);
            }
        });
    });
}

/**
 * Filter users based on search and filter criteria
 */
async function filterUsers() {
    const search = document.getElementById('user-search').value;
    const role = document.getElementById('filter-role').value;
    const isActive = document.getElementById('filter-status').value;

    const params = { page: 1, limit: 50 };
    if (search) params.search = search;
    if (role) params.role = role;
    if (isActive) params.isActive = isActive;

    try {
        const response = await apiService.get('/users', params);
        const users = response.data.users;
        
        // Update table
        document.getElementById('users-table-body').innerHTML = renderUsersTableRows(users);
        
        // Re-attach event listeners for table buttons
        setupEventListeners();
    } catch (error) {
        console.error('Error filtering users:', error);
    }
}

/**
 * Load users with pagination
 * 
 * @param {number} page - Page number to load
 */
async function loadUsers(page = 1) {
    try {
        const response = await apiService.get('/users', { page, limit: 50 });
        const users = response.data.users;
        
        document.getElementById('users-table-body').innerHTML = renderUsersTableRows(users);
        setupEventListeners();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

/**
 * Show modal for adding new user
 */
function showAddUserModal() {
    const roles = stateManager.getState().roles || [];
    
    const modalHtml = `
        <div class="modal fade" id="addUserModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-person-plus"></i> Add New User</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-user-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="firstName" class="form-label">First Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="firstName" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="lastName" class="form-label">Last Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="lastName" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                                    <input type="email" class="form-control" id="email" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="username" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
                                <input type="password" class="form-control" id="password" required>
                                <div class="form-text">Minimum 8 characters</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Assign Roles</label>
                                <div class="row">
                                    ${roles.map(role => `
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" value="${role.id}" id="role-${role.id}">
                                                <label class="form-check-label" for="role-${role.id}">
                                                    <strong>${role.display_name}</strong>
                                                    <br><small class="text-muted">${role.description || ''}</small>
                                                </label>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-save-user">
                            <i class="bi bi-check-circle"></i> Create User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    document.getElementById('addUserModal')?.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();

    // Save button handler
    document.getElementById('btn-save-user').addEventListener('click', async () => {
        await saveNewUser(modal);
    });
}

/**
 * Save new user
 * 
 * @param {Object} modal - Bootstrap modal instance
 */
async function saveNewUser(modal) {
    const form = document.getElementById('add-user-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const firstName = sanitizeInput(document.getElementById('firstName').value);
    const lastName = sanitizeInput(document.getElementById('lastName').value);
    const email = sanitizeInput(document.getElementById('email').value);
    const username = sanitizeInput(document.getElementById('username').value);
    const password = document.getElementById('password').value;

    // Get selected roles
    const roleIds = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .map(cb => cb.value);

    try {
        const saveBtn = document.getElementById('btn-save-user');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

        await apiService.post('/users', {
            firstName,
            lastName,
            email,
            username,
            password,
            roleIds
        });

        // Close modal
        modal.hide();

        // Show success message
        showSuccessToast('User created successfully');

        // Reload users
        await loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user: ' + error.message);
        
        const saveBtn = document.getElementById('btn-save-user');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Create User';
    }
}

/**
 * Show modal for editing user
 * 
 * @param {string} userId - User ID to edit
 */
async function showEditUserModal(userId) {
    try {
        const response = await apiService.get(`/users/${userId}`);
        const user = response.data;

        const modalHtml = `
            <div class="modal fade" id="editUserModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-pencil"></i> Edit User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-user-form">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editFirstName" class="form-label">First Name</label>
                                        <input type="text" class="form-control" id="editFirstName" value="${escapeHtml(user.first_name)}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editLastName" class="form-label">Last Name</label>
                                        <input type="text" class="form-control" id="editLastName" value="${escapeHtml(user.last_name)}">
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="editEmail" value="${escapeHtml(user.email)}">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editUsername" class="form-label">Username</label>
                                        <input type="text" class="form-control" id="editUsername" value="${escapeHtml(user.username)}">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''}>
                                        <label class="form-check-label" for="editIsActive">
                                            Active User
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="btn-update-user">
                                <i class="bi bi-check-circle"></i> Update User
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('editUserModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();

        document.getElementById('btn-update-user').addEventListener('click', async () => {
            await updateUser(userId, modal);
        });
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Error loading user: ' + error.message);
    }
}

/**
 * Update user
 * 
 * @param {string} userId - User ID to update
 * @param {Object} modal - Bootstrap modal instance
 */
async function updateUser(userId, modal) {
    const firstName = sanitizeInput(document.getElementById('editFirstName').value);
    const lastName = sanitizeInput(document.getElementById('editLastName').value);
    const email = sanitizeInput(document.getElementById('editEmail').value);
    const username = sanitizeInput(document.getElementById('editUsername').value);
    const isActive = document.getElementById('editIsActive').checked;

    try {
        const updateBtn = document.getElementById('btn-update-user');
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

        await apiService.put(`/users/${userId}`, {
            firstName,
            lastName,
            email,
            username,
            isActive
        });

        modal.hide();
        showSuccessToast('User updated successfully');
        await loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user: ' + error.message);
        
        const updateBtn = document.getElementById('btn-update-user');
        updateBtn.disabled = false;
        updateBtn.innerHTML = '<i class="bi bi-check-circle"></i> Update User';
    }
}

/**
 * Show manage roles modal
 * 
 * @param {string} userId - User ID to manage roles for
 */
async function showManageRolesModal(userId) {
    try {
        const [userResponse, rolesResponse] = await Promise.all([
            apiService.get(`/users/${userId}`),
            apiService.get('/users/roles/list')
        ]);

        const user = userResponse.data;
        const allRoles = rolesResponse.data.roles;
        const userRoleIds = (user.roles || []).map(r => r.id);

        const modalHtml = `
            <div class="modal fade" id="manageRolesModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-shield-check"></i> Manage Roles: ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted">Select roles to assign to this user</p>
                            <div class="row">
                                ${allRoles.map(role => `
                                    <div class="col-md-6 mb-3">
                                        <div class="card ${userRoleIds.includes(role.id) ? 'border-primary' : ''}">
                                            <div class="card-body">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" value="${role.id}" 
                                                           id="role-check-${role.id}" ${userRoleIds.includes(role.id) ? 'checked' : ''}>
                                                    <label class="form-check-label" for="role-check-${role.id}">
                                                        <h6 class="mb-1">${role.display_name}</h6>
                                                        <small class="text-muted">${role.description || ''}</small>
                                                        <div class="mt-2">
                                                            <small class="text-info">
                                                                <i class="bi bi-people"></i> ${role.user_count} users
                                                            </small>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="btn-save-roles">
                                <i class="bi bi-check-circle"></i> Save Roles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('manageRolesModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal(document.getElementById('manageRolesModal'));
        modal.show();

        document.getElementById('btn-save-roles').addEventListener('click', async () => {
            await saveUserRoles(userId, modal);
        });
    } catch (error) {
        console.error('Error loading roles:', error);
        alert('Error loading roles: ' + error.message);
    }
}

/**
 * Save user roles
 * 
 * @param {string} userId - User ID
 * @param {Object} modal - Bootstrap modal instance
 */
async function saveUserRoles(userId, modal) {
    const selectedRoleIds = Array.from(document.querySelectorAll('[id^="role-check-"]:checked'))
        .map(cb => cb.value);

    if (selectedRoleIds.length === 0) {
        alert('Please select at least one role');
        return;
    }

    try {
        const saveBtn = document.getElementById('btn-save-roles');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        await apiService.post(`/users/${userId}/roles`, { roleIds: selectedRoleIds });

        modal.hide();
        showSuccessToast('Roles updated successfully');
        await loadUsers();
    } catch (error) {
        console.error('Error updating roles:', error);
        alert('Error updating roles: ' + error.message);
        
        const saveBtn = document.getElementById('btn-save-roles');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Save Roles';
    }
}

/**
 * Toggle user active status
 * 
 * @param {string} userId - User ID
 * @param {boolean} currentStatus - Current active status
 */
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} this user?`);
    
    if (!confirmed) return;

    try {
        await apiService.put(`/users/${userId}`, { isActive: !currentStatus });
        showSuccessToast(`User ${action}d successfully`);
        await loadUsers();
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Error updating user status: ' + error.message);
    }
}

/**
 * Delete user
 * 
 * @param {string} userId - User ID to delete
 */
async function deleteUser(userId) {
    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
    
    if (!confirmed) return;

    try {
        await apiService.delete(`/users/${userId}`);
        showSuccessToast('User deleted successfully');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
}

/**
 * Show success toast notification
 * 
 * @param {string} message - Success message
 */
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-check-circle me-2"></i>${escapeHtml(message)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    setTimeout(() => toast.remove(), 5000);
}
