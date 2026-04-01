/**
 * Authentication Module
 * Handles login, logout, token storage, and API authentication
 */

const AUTH_CONFIG = {
  API_BASE_URL: '/api/v1',
  TOKEN_KEY: 'awyad_access_token',
  REFRESH_TOKEN_KEY: 'awyad_refresh_token',
  USER_KEY: 'awyad_user',
};

class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.accessToken = this.getAccessToken();
  }

  /**
   * Login user
   */
  async login(emailOrUsername, password) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Store tokens and user data
      this.setAccessToken(result.data.accessToken);
      this.setUser(result.data.user);

      // Flag if user must change password before accessing the app
      if (result.data.user.require_password_change) {
        sessionStorage.setItem('force_password_change', '1');
      } else {
        sessionStorage.removeItem('force_password_change');
      }

      // Refresh token is in HTTP-only cookie, handled by browser

      return result.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      return result.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      // Clear local storage regardless of server response
      this.clearAuth();
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear auth even if logout fails
      this.clearAuth();
      return true;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        this.setAccessToken(result.data.accessToken);
        return result.data.accessToken;
      } else {
        // Refresh failed, logout user
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return null;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        this.setUser(result.data.user);
        return result.data.user;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Password change failed');
      }

      // After password change, user needs to login again
      this.clearAuth();
      
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If unauthorized or token expired, clear auth and redirect to login
    if (response.status === 401 || response.status === 500) {
      // Check if it's a token expiration error
      try {
        const errorData = await response.clone().json();
        if (errorData.message && errorData.message.toLowerCase().includes('expired')) {
          console.warn('Token expired, redirecting to login...');
          this.logout();
          window.location.href = '/login.html';
          throw new Error('Session expired. Please login again.');
        }
      } catch (e) {
        // If can't parse error, treat as expired
        if (response.status === 401) {
          console.warn('Authentication failed, redirecting to login...');
          this.logout();
          window.location.href = '/login.html';
          throw new Error('Session expired. Please login again.');
        }
      }
    }

    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.currentUser;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    if (!this.currentUser || !this.currentUser.permissions) {
      return false;
    }
    return this.currentUser.permissions.some(p => p.name === permission);
  }

  /**
   * Check if user has role
   */
  hasRole(roleName) {
    if (!this.currentUser || !this.currentUser.roles) {
      return false;
    }
    return this.currentUser.roles.some(r => r.name === roleName);
  }

  /**
   * Get user display name
   */
  getUserDisplayName() {
    if (!this.currentUser) return 'Guest';
    return `${this.currentUser.first_name} ${this.currentUser.last_name}`.trim() || 
           this.currentUser.username || 
           this.currentUser.email;
  }

  // Storage methods
  setAccessToken(token) {
    this.accessToken = token;
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
  }

  getAccessToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  }

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
  }

  loadUser() {
    const userJson = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  clearAuth() {
    this.accessToken = null;
    this.currentUser = null;
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  }
}

// Export singleton instance
const authManager = new AuthManager();
window.authManager = authManager; // Make available globally

export { authManager };
