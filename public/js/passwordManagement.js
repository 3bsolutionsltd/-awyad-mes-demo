/**
 * Password Management Module
 * 
 * Handles password change, password reset, and password strength validation.
 * Provides UI components for users to manage their passwords and admins to reset user passwords.
 * 
 * @module passwordManagement
 */

import { showNotification } from './components.js';

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false
};

/**
 * Show change password modal for current user
 */
export async function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'changePasswordModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-key me-2"></i>Change Password
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <small>Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters (!@#$%^&*).</small>
                    </div>
                    
                    <form id="changePasswordForm">
                        <div class="mb-3">
                            <label for="currentPassword" class="form-label">
                                Current Password <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="currentPassword" required>
                                <button class="btn btn-outline-secondary" type="button" id="toggleCurrentPassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="newPassword" class="form-label">
                                New Password <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="newPassword" required>
                                <button class="btn btn-outline-secondary" type="button" id="toggleNewPassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                            <div id="passwordStrength" class="mt-2" style="display: none;">
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <small id="strengthText" class="text-muted"></small>
                            </div>
                            <div id="passwordRequirements" class="mt-2">
                                <small class="d-block" id="req-length">
                                    <i class="bi bi-circle text-muted"></i> At least 8 characters
                                </small>
                                <small class="d-block" id="req-uppercase">
                                    <i class="bi bi-circle text-muted"></i> One uppercase letter
                                </small>
                                <small class="d-block" id="req-lowercase">
                                    <i class="bi bi-circle text-muted"></i> One lowercase letter
                                </small>
                                <small class="d-block" id="req-number">
                                    <i class="bi bi-circle text-muted"></i> One number
                                </small>
                                <small class="d-block" id="req-special">
                                    <i class="bi bi-circle text-muted"></i> One special character (!@#$%^&*)
                                </small>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">
                                Confirm New Password <span class="text-danger">*</span>
                            </label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                            <div id="passwordMatch" class="mt-1" style="display: none;">
                                <small class="text-danger">
                                    <i class="bi bi-x-circle"></i> Passwords do not match
                                </small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-primary" id="savePasswordButton">
                        <i class="bi bi-check-lg me-1"></i>Change Password
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Setup event listeners
    setupPasswordToggle('toggleCurrentPassword', 'currentPassword');
    setupPasswordToggle('toggleNewPassword', 'newPassword');
    
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    newPasswordInput.addEventListener('input', () => {
        validatePasswordStrength(newPasswordInput.value);
        checkPasswordMatch(newPasswordInput.value, confirmPasswordInput.value);
    });
    
    confirmPasswordInput.addEventListener('input', () => {
        checkPasswordMatch(newPasswordInput.value, confirmPasswordInput.value);
    });
    
    document.getElementById('savePasswordButton').addEventListener('click', async () => {
        await changePassword(modal);
    });
    
    // Cleanup on modal hide
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

/**
 * Show admin password reset modal for a specific user
 * @param {number} userId - User ID
 * @param {string} userName - User's full name
 */
export async function showAdminPasswordResetModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'adminPasswordResetModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning">
                    <h5 class="modal-title">
                        <i class="bi bi-shield-exclamation me-2"></i>Reset User Password
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Administrator Action</strong><br>
                        <small>You are about to reset the password for <strong>${userName}</strong>. The user will need to use the new password to login.</small>
                    </div>
                    
                    <form id="adminResetPasswordForm">
                        <div class="mb-3">
                            <label class="form-label">User</label>
                            <input type="text" class="form-control" value="${userName}" disabled>
                        </div>
                        
                        <div class="mb-3">
                            <label for="adminNewPassword" class="form-label">
                                New Password <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="adminNewPassword" required>
                                <button class="btn btn-outline-secondary" type="button" id="toggleAdminPassword">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-primary" type="button" id="generatePassword" title="Generate Strong Password">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                            <div id="adminPasswordStrength" class="mt-2" style="display: none;">
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <small id="adminStrengthText" class="text-muted"></small>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="notifyUser" checked>
                                <label class="form-check-label" for="notifyUser">
                                    Send password reset notification to user
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="requirePasswordChange" checked>
                                <label class="form-check-label" for="requirePasswordChange">
                                    Require user to change password on next login
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        Cancel
                    </button>
                    <button type="button" class="btn btn-warning" id="adminResetPasswordButton">
                        <i class="bi bi-shield-check me-1"></i>Reset Password
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Setup event listeners
    setupPasswordToggle('toggleAdminPassword', 'adminNewPassword');
    
    const passwordInput = document.getElementById('adminNewPassword');
    passwordInput.addEventListener('input', () => {
        validatePasswordStrength(passwordInput.value, 'admin');
    });
    
    document.getElementById('generatePassword').addEventListener('click', () => {
        const newPassword = generateStrongPassword();
        passwordInput.value = newPassword;
        passwordInput.type = 'text'; // Show generated password
        validatePasswordStrength(newPassword, 'admin');
        
        // Copy to clipboard
        navigator.clipboard.writeText(newPassword).then(() => {
            showNotification('Password generated and copied to clipboard', 'success');
        });
    });
    
    document.getElementById('adminResetPasswordButton').addEventListener('click', async () => {
        await adminResetPassword(userId, modal);
    });
    
    // Cleanup on modal hide
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

/**
 * Setup password visibility toggle
 * @param {string} buttonId - Toggle button ID
 * @param {string} inputId - Password input ID
 */
function setupPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    
    if (!button || !input) return;
    
    button.addEventListener('click', () => {
        const icon = button.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    });
}

/**
 * Validate password strength and update UI
 * @param {string} password - Password to validate
 * @param {string} prefix - Prefix for element IDs ('admin' or default)
 */
function validatePasswordStrength(password, prefix = '') {
    const strengthDiv = document.getElementById(prefix ? `${prefix}PasswordStrength` : 'passwordStrength');
    const progressBar = strengthDiv.querySelector('.progress-bar');
    const strengthText = document.getElementById(prefix ? `${prefix}StrengthText` : 'strengthText');
    
    strengthDiv.style.display = password ? 'block' : 'none';
    
    if (!password) return;
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score += 25;
    else feedback.push('too short');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push('needs uppercase');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push('needs lowercase');
    
    // Number check
    if (/\d/.test(password)) score += 20;
    else feedback.push('needs number');
    
    // Special character check (REQUIRED)
    if (/[!@#$%^&*]/.test(password)) score += 20;
    else feedback.push('needs special char (!@#$%^&*)');
    
    // Bonus for length
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    
    score = Math.min(score, 100);
    
    // Update progress bar
    progressBar.style.width = `${score}%`;
    
    let className, label;
    if (score < 40) {
        className = 'bg-danger';
        label = 'Weak';
    } else if (score < 70) {
        className = 'bg-warning';
        label = 'Fair';
    } else if (score < 90) {
        className = 'bg-info';
        label = 'Good';
    } else {
        className = 'bg-success';
        label = 'Strong';
    }
    
    progressBar.className = `progress-bar ${className}`;
    strengthText.textContent = `${label}${feedback.length ? ' (' + feedback.join(', ') + ')' : ''}`;
    strengthText.className = `text-${className.replace('bg-', '')}`;
    
    // Update requirements checklist (only for non-admin)
    if (!prefix) {
        updateRequirement('req-length', password.length >= 8);
        updateRequirement('req-uppercase', /[A-Z]/.test(password));
        updateRequirement('req-lowercase', /[a-z]/.test(password));
        updateRequirement('req-number', /\d/.test(password));
        updateRequirement('req-special', /[!@#$%^&*]/.test(password));
    }
}

/**
 * Update password requirement indicator
 * @param {string} elementId - Requirement element ID
 * @param {boolean} met - Whether requirement is met
 */
function updateRequirement(elementId, met) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = element.querySelector('i');
    if (met) {
        icon.className = 'bi bi-check-circle-fill text-success';
        element.classList.add('text-success');
    } else {
        icon.className = 'bi bi-circle text-muted';
        element.classList.remove('text-success');
    }
}

/**
 * Check if passwords match and update UI
 * @param {string} password - New password
 * @param {string} confirm - Confirm password
 */
function checkPasswordMatch(password, confirm) {
    const matchDiv = document.getElementById('passwordMatch');
    if (!matchDiv) return;
    
    if (!confirm) {
        matchDiv.style.display = 'none';
        return;
    }
    
    if (password === confirm) {
        matchDiv.style.display = 'none';
    } else {
        matchDiv.style.display = 'block';
    }
}

/**
 * Generate a strong random password
 * @returns {string} Generated password
 */
function generateStrongPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const all = uppercase + lowercase + numbers + special;
    
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest (12 characters total)
    for (let i = 4; i < 16; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Change password for current user
 * @param {HTMLElement} modal - Modal element
 */
async function changePassword(modal) {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const button = document.getElementById('savePasswordButton');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('All fields are required', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'danger');
        return;
    }
    
    if (newPassword === currentPassword) {
        showNotification('New password must be different from current password', 'danger');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters', 'danger');
        return;
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword)) {
        showNotification('Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)', 'danger');
        return;
    }
    
    try {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Changing...';
        
        const token = localStorage.getItem('awyad_access_token');
        const response = await fetch('/api/v1/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password');
        }
        
        showNotification(data.message || 'Password changed successfully', 'success');
        bootstrap.Modal.getInstance(modal).hide();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        
    } catch (error) {
        showNotification(error.message, 'danger');
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-check-lg me-1"></i>Change Password';
    }
}

/**
 * Admin reset user password
 * @param {number} userId - User ID
 * @param {HTMLElement} modal - Modal element
 */
async function adminResetPassword(userId, modal) {
    const newPassword = document.getElementById('adminNewPassword').value.trim();
    const notifyUser = document.getElementById('notifyUser').checked;
    const requireChange = document.getElementById('requirePasswordChange').checked;
    const button = document.getElementById('adminResetPasswordButton');
    
    // Validation
    if (!newPassword) {
        showNotification('Password is required', 'danger');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters', 'danger');
        return;
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword)) {
        showNotification('Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)', 'danger');
        return;
    }
    
    try {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Resetting...';
        
        const token = localStorage.getItem('awyad_access_token');
        const response = await fetch(`/api/v1/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                newPassword: newPassword,
                notifyUser: notifyUser,
                requirePasswordChange: requireChange
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to reset password');
        }
        
        showNotification(data.message || 'Password reset successfully', 'success');
        bootstrap.Modal.getInstance(modal).hide();
        
    } catch (error) {
        showNotification(error.message, 'danger');
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-shield-check me-1"></i>Reset Password';
    }
}

/**
 * Validate password against requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export function validatePassword(password) {
    const errors = [];
    
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }
    
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
