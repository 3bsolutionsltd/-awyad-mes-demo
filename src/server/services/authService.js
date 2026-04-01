/**
 * Authentication Service
 * 
 * Handles user authentication, password hashing, JWT token generation,
 * and token refresh logic.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import databaseService from './databaseService.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

const randomBytesAsync = promisify(randomBytes);

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    this.SALT_ROUNDS = 10;
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hash;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new AppError('Password hashing failed', 500);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Match result
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Generate refresh token
   * @returns {Promise<string>} Refresh token
   */
  async generateRefreshToken() {
    const buffer = await randomBytesAsync(40);
    return buffer.toString('hex');
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid token', 401);
      }
      throw new AppError('Token verification failed', 401);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user (without password)
   */
  async register(userData) {
    const { email, username, password, firstName, lastName } = userData;

    try {
      // Check if user already exists
      const existingUser = await databaseService.queryOne(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser) {
        throw new AppError('User with this email or username already exists', 409);
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = await databaseService.queryOne(
        `INSERT INTO users (email, username, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username, first_name, last_name, is_active, is_verified, created_at`,
        [email, username, passwordHash, firstName, lastName]
      );

      // Assign default 'user' role
      const userRole = await databaseService.queryOne(
        "SELECT id FROM roles WHERE name = 'user'"
      );

      if (userRole) {
        await databaseService.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [user.id, userRole.id]
        );
      }

      logger.info('User registered successfully:', { userId: user.id, email });
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('User registration failed:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  /**
   * Authenticate user and generate tokens
   * @param {string} emailOrUsername - User email or username
   * @param {string} password - User password
   * @returns {Promise<Object>} User data with tokens
   */
  async login(emailOrUsername, password) {
    try {
      // Find user
      const user = await databaseService.queryOne(
        `SELECT id, email, username, password_hash, first_name, last_name,
                is_active, is_verified, last_login_at, require_password_change
         FROM users
         WHERE (email = $1 OR username = $1)`,
        [emailOrUsername]
      );

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Get user roles and permissions
      const roles = await this.getUserRoles(user.id);
      const permissions = await this.getUserPermissions(user.id);

      // Generate tokens
      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: roles.map(r => r.name),
      });

      const refreshToken = await this.generateRefreshToken();

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await databaseService.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, refreshToken, expiresAt]
      );

      // Update last login
      await databaseService.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Remove password hash from response
      delete user.password_hash;

      logger.info('User logged in successfully:', { userId: user.id, email: user.email });

      return {
        user: {
          ...user,
          roles,
          permissions,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Login failed:', error);
      throw new AppError('Login failed', 500);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Find refresh token in database
      const tokenRecord = await databaseService.queryOne(
        `SELECT rt.*, u.email, u.is_active
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.token = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
        [refreshToken]
      );

      if (!tokenRecord) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      if (!tokenRecord.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Get user roles
      const roles = await this.getUserRoles(tokenRecord.user_id);

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: tokenRecord.user_id,
        email: tokenRecord.email,
        roles: roles.map(r => r.name),
      });

      // Update last used timestamp
      await databaseService.query(
        'UPDATE refresh_tokens SET last_used_at = NOW() WHERE id = $1',
        [tokenRecord.id]
      );

      logger.info('Access token refreshed:', { userId: tokenRecord.user_id });

      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Token refresh failed:', error);
      throw new AppError('Token refresh failed', 401);
    }
  }

  /**
   * Logout user by revoking refresh token
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    try {
      await databaseService.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
        [refreshToken]
      );
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw new AppError('Logout failed', 500);
    }
  }

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User roles
   */
  async getUserRoles(userId) {
    const roles = await databaseService.queryMany(
      `SELECT r.id, r.name, r.display_name, r.description
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return roles;
  }

  /**
   * Get user permissions (aggregated from all roles)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User permissions
   */
  async getUserPermissions(userId) {
    const permissions = await databaseService.queryMany(
      `SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return permissions;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get current password hash
      const user = await databaseService.queryOne(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify old password
      const isValid = await this.verifyPassword(oldPassword, user.password_hash);
      if (!isValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const newHash = await this.hashPassword(newPassword);

      // Update password and clear forced-change flag
      await databaseService.query(
        'UPDATE users SET password_hash = $1, require_password_change = FALSE, updated_at = NOW() WHERE id = $2',
        [newHash, userId]
      );

      // Revoke all refresh tokens for security
      await databaseService.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1',
        [userId]
      );

      logger.info('Password changed successfully:', { userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Password change failed:', error);
      throw new AppError('Password change failed', 500);
    }
  }

  /**
   * Create a secure one-time password reset token for self-service reset.
   * @param {string} email - User email address
   * @returns {Promise<{token: string, user: Object}>}
   */
  async createPasswordResetToken(email) {
    const user = await databaseService.queryOne(
      'SELECT id, email, first_name, is_active FROM users WHERE email = $1',
      [email]
    );
    // Return silently for unknown emails (security: don't reveal user existence)
    if (!user || !user.is_active) return null;

    // Invalidate any existing unused tokens
    await databaseService.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    const buffer = await randomBytesAsync(40);
    const token = buffer.toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await databaseService.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    return { token, user };
  }

  /**
   * Reset a password using a valid reset token.
   * @param {string} token - Reset token from email link
   * @param {string} newPassword - New plain-text password
   * @returns {Promise<Object>} Updated user
   */
  async resetPasswordWithToken(token, newPassword) {
    const record = await databaseService.queryOne(
      `SELECT prt.id, prt.user_id, u.email, u.first_name, u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()`,
      [token]
    );

    if (!record) {
      throw new AppError('Invalid or expired password reset link', 400);
    }

    if (!record.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    const newHash = await this.hashPassword(newPassword);

    await databaseService.query(
      `UPDATE users
         SET password_hash = $1,
             require_password_change = FALSE,
             updated_at = NOW()
       WHERE id = $2`,
      [newHash, record.user_id]
    );

    // Mark token as used
    await databaseService.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [record.id]
    );

    // Revoke all refresh tokens for security
    await databaseService.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1',
      [record.user_id]
    );

    logger.info('Password reset via token:', { userId: record.user_id });
    return { email: record.email, first_name: record.first_name };
  }

  /**
   * Clean up expired refresh tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  async cleanupExpiredTokens() {
    try {
      const result = await databaseService.query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL'
      );
      logger.info('Expired tokens cleaned up:', { count: result.rowCount });
      return result.rowCount;
    } catch (error) {
      logger.error('Token cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    try {
      const user = await databaseService.queryOne(
        `SELECT id, email, username, first_name, last_name, 
                is_active, is_verified, last_login_at, created_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get roles and permissions
      const roles = await this.getUserRoles(userId);
      const permissions = await this.getUserPermissions(userId);

      return {
        ...user,
        roles,
        permissions,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get user profile:', error);
      throw new AppError('Failed to get user profile', 500);
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
