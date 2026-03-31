/**
 * User Management Routes
 * 
 * Handles user CRUD operations, role assignments, and user administration.
 */

import express from 'express';
import Joi from 'joi';
import databaseService from '../services/databaseService.js';
import authService from '../services/authService.js';
import { authenticate, checkPermission, checkAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// Validation Schemas
// ============================================

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  roleIds: Joi.array().items(Joi.string().uuid()).optional(),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
});

const assignRolesSchema = Joi.object({
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

// ============================================
// User Routes
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private - requires users.read permission
 */
router.get('/', authenticate, checkPermission('users.read'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isActive = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    // Build filters
    const filters = {};
    if (isActive !== '') {
      filters.is_active = isActive === 'true';
    }

    // Build WHERE clause
    const { whereClause, params, nextIndex } = databaseService.buildWhereClause(filters, 1);

    // Build search condition
    let searchCondition = '';
    if (search) {
      searchCondition = whereClause
        ? `AND (u.email ILIKE $${nextIndex} OR u.username ILIKE $${nextIndex} OR u.first_name ILIKE $${nextIndex} OR u.last_name ILIKE $${nextIndex})`
        : `WHERE (u.email ILIKE $${nextIndex} OR u.username ILIKE $${nextIndex} OR u.first_name ILIKE $${nextIndex} OR u.last_name ILIKE $${nextIndex})`;
      params.push(`%${search}%`);
    }

    // Build role filter
    let roleCondition = '';
    if (role) {
      const roleIndex = params.length + 1;
      roleCondition = `AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = u.id AND r.name = $${roleIndex}
      )`;
      params.push(role);
    }

    // Build ORDER BY clause
    const allowedSortFields = ['created_at', 'email', 'username', 'first_name', 'last_name'];
    const orderByClause = databaseService.buildOrderByClause(
      { field: sortBy, order: sortOrder },
      allowedSortFields
    );

    // Count query - without JSON aggregation to avoid PostgreSQL error
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
      ${searchCondition}
      ${roleCondition}
    `;

    const countResult = await databaseService.queryOne(countQuery, params);
    const total = parseInt(countResult.total);

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Data query - with JSON aggregation
    const dataQuery = `
      SELECT
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.is_active,
        u.is_verified,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        (
          SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'display_name', r.display_name))
          FROM roles r
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = u.id
        ) as roles
      FROM users u
      ${whereClause}
      ${searchCondition}
      ${roleCondition}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const users = await databaseService.queryMany(dataQuery, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private - requires users.read permission
 */
router.get('/:id', authenticate, checkPermission('users.read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await databaseService.queryOne(
      `SELECT 
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.is_active,
        u.is_verified,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = $1`,
      [id]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user roles
    const roles = await authService.getUserRoles(id);
    user.roles = roles;

    // Get user permissions
    const permissions = await authService.getUserPermissions(id);
    user.permissions = permissions;

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private - requires users.create permission
 */
router.post(
  '/',
  authenticate,
  checkPermission('users.create'),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const { email, username, password, firstName, lastName, roleIds } = req.body;

      // Register user
      const user = await authService.register({
        email,
        username,
        password,
        firstName,
        lastName,
      });

      // Assign roles if provided
      if (roleIds && roleIds.length > 0) {
        await databaseService.transaction(async (client) => {
          for (const roleId of roleIds) {
            await client.query(
              'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [user.id, roleId]
            );
          }
        });
      }

      // Get updated user with roles
      const roles = await authService.getUserRoles(user.id);
      user.roles = roles;

      logger.info('User created by admin:', { userId: user.id, createdBy: req.user.userId });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private - requires users.update permission
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('users.update'),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if user exists
      const existingUser = await databaseService.queryOne(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Build update query
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase to snake_case
        const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      if (fields.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, username, first_name, last_name, is_active, is_verified, updated_at
      `;

      const user = await databaseService.queryOne(query, values);

      logger.info('User updated:', { userId: id, updatedBy: req.user.userId });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete - deactivate)
 * @access  Private - requires users.delete permission
 */
router.delete('/:id', authenticate, checkPermission('users.delete'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.userId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // Check if user exists
    const user = await databaseService.queryOne(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete - deactivate user
    await databaseService.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );

    // Revoke all refresh tokens
    await databaseService.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1',
      [id]
    );

    logger.info('User deactivated:', { userId: id, deactivatedBy: req.user.userId });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/:id/roles
 * @desc    Assign roles to user
 * @access  Private - requires users.manage_roles permission
 */
router.post(
  '/:id/roles',
  authenticate,
  checkPermission('users.manage_roles'),
  validate(assignRolesSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;

      // Check if user exists
      const user = await databaseService.queryOne(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      await databaseService.transaction(async (client) => {
        // Remove existing roles
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

        // Add new roles
        for (const roleId of roleIds) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [id, roleId]
          );
        }
      });

      // Get updated roles
      const roles = await authService.getUserRoles(id);

      logger.info('User roles updated:', { userId: id, updatedBy: req.user.userId });

      res.json({
        success: true,
        message: 'Roles assigned successfully',
        data: { roles },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// Role Routes
// ============================================

/**
 * @route   GET /api/users/roles/list
 * @desc    Get all roles
 * @access  Private - requires users.read permission
 */
router.get('/roles/list', authenticate, checkPermission('users.read'), async (req, res, next) => {
  try {
    const roles = await databaseService.queryMany(
      `SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_system,
        (
          SELECT COUNT(*)
          FROM user_roles ur
          WHERE ur.role_id = r.id
        ) as user_count,
        (
          SELECT json_agg(json_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action))
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = r.id
        ) as permissions
      FROM roles r
      ORDER BY r.name`
    );

    res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/permissions/list
 * @desc    Get all permissions
 * @access  Private - requires users.read permission
 */
router.get(
  '/permissions/list',
  authenticate,
  checkPermission('users.read'),
  async (req, res, next) => {
    try {
      const permissions = await databaseService.queryMany(
        `SELECT id, name, resource, action, description
         FROM permissions
         ORDER BY resource, action`
      );

      res.json({
        success: true,
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Admin reset user password
 * @access  Private - requires users.update permission
 */
router.post(
  '/:id/reset-password',
  authenticate,
  checkPermission('users.update'),
  validate(Joi.object({
    newPassword: Joi.string().min(8).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'
      }),
    notifyUser: Joi.boolean().optional(),
    requirePasswordChange: Joi.boolean().optional(),
  })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newPassword, notifyUser = false, requirePasswordChange = true } = req.body;

      // Check if user exists
      const user = await databaseService.queryOne('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [id]);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Hash the new password
      const hashedPassword = await authService.hashPassword(newPassword);

      // Update password and set require_password_change flag
      await databaseService.queryOne(
        `UPDATE users 
         SET password_hash = $1, 
             require_password_change = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING id`,
        [hashedPassword, requirePasswordChange, id]
      );

      // TODO: Send email notification if notifyUser is true
      if (notifyUser) {
        logger.info(`Password reset notification should be sent to: ${user.email}`);
        // Implement email service integration here
      }

      // Log the admin action
      logger.info(`Admin ${req.user.userId} reset password for user ${id}`);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
