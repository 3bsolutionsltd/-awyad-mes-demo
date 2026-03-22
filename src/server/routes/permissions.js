/**
 * Permissions Management Routes
 * Handles permission and role management APIs
 */

import express from 'express';
import Joi from 'joi';
import databaseService from '../services/databaseService.js';
import auditService from '../services/auditService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const grantPermissionSchema = Joi.object({
  roleId: Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
});

const revokePermissionSchema = Joi.object({
  roleId: Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
});

// ============================================
// PERMISSIONS ROUTES
// ============================================

/**
 * @route   GET /api/v1/permissions
 * @desc    Get all permissions
 * @access  Private - requires permissions.read permission
 */
router.get('/', authenticate, checkPermission('permissions.read'), async (req, res, next) => {
  try {
    const permissions = await databaseService.queryMany(
      `SELECT 
        id,
        name,
        resource,
        action,
        description,
        created_at
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
});

/**
 * @route   GET /api/v1/permissions/matrix
 * @desc    Get permission matrix (roles vs permissions)
 * @access  Private - requires permissions.read permission
 */
router.get('/matrix', authenticate, checkPermission('permissions.read'), async (req, res, next) => {
  try {
    // Get all roles
    const roles = await databaseService.queryMany(
      `SELECT id, name, display_name, description
      FROM roles
      ORDER BY name`
    );

    // Get all permissions
    const permissions = await databaseService.queryMany(
      `SELECT id, name, resource, action, description
      FROM permissions
      ORDER BY resource, action`
    );

    // Get all role-permission mappings
    const mappings = await databaseService.queryMany(
      `SELECT role_id, permission_id, granted_at
      FROM role_permissions`
    );

    // Build matrix
    const matrix = roles.map(role => ({
      ...role,
      permissions: permissions.map(permission => {
        const mapping = mappings.find(
          m => m.role_id === role.id && m.permission_id === permission.id
        );
        return {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          granted: !!mapping,
          grantedAt: mapping?.granted_at || null,
        };
      }),
    }));

    res.json({
      success: true,
      data: {
        roles,
        permissions,
        matrix,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ROLE PERMISSIONS MANAGEMENT
// ============================================

/**
 * @route   POST /api/v1/permissions/grant
 * @desc    Grant a permission to a role
 * @access  Private - requires permissions.manage permission
 */
router.post(
  '/grant',
  authenticate,
  checkPermission('permissions.manage'),
  validate(grantPermissionSchema),
  async (req, res, next) => {
    try {
      const { roleId, permissionId } = req.body;

      // Verify role exists
      const role = await databaseService.queryOne(
        'SELECT id, name, display_name FROM roles WHERE id = $1',
        [roleId]
      );

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      // Verify permission exists
      const permission = await databaseService.queryOne(
        'SELECT id, name FROM permissions WHERE id = $1',
        [permissionId]
      );

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      // Check if already granted
      const existing = await databaseService.queryOne(
        'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );

      if (existing) {
        throw new AppError('Permission already granted to this role', 400);
      }

      // Grant permission
      await databaseService.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [roleId, permissionId]
      );

      // Log the action
      await auditService.log({
        action: 'grant_permission',
        resource: 'role_permissions',
        resourceId: `${roleId}:${permissionId}`,
        userId: req.user.userId,
        details: {
          roleName: role.name,
          roleDisplayName: role.display_name,
          permissionName: permission.name,
        },
      });

      logger.info('Permission granted to role:', {
        roleId,
        permissionId,
        grantedBy: req.user.userId,
      });

      res.json({
        success: true,
        message: `Permission "${permission.name}" granted to role "${role.display_name}"`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/permissions/revoke
 * @desc    Revoke a permission from a role
 * @access  Private - requires permissions.manage permission
 */
router.post(
  '/revoke',
  authenticate,
  checkPermission('permissions.manage'),
  validate(revokePermissionSchema),
  async (req, res, next) => {
    try {
      const { roleId, permissionId } = req.body;

      // Verify role exists
      const role = await databaseService.queryOne(
        'SELECT id, name, display_name FROM roles WHERE id = $1',
        [roleId]
      );

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      // Verify permission exists
      const permission = await databaseService.queryOne(
        'SELECT id, name FROM permissions WHERE id = $1',
        [permissionId]
      );

      if (!permission) {
        throw new AppError('Permission not found', 404);
      }

      // Check if granted
      const existing = await databaseService.queryOne(
        'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );

      if (!existing) {
        throw new AppError('Permission not granted to this role', 400);
      }

      // Revoke permission
      await databaseService.query(
        'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );

      // Log the action
      await auditService.log({
        action: 'revoke_permission',
        resource: 'role_permissions',
        resourceId: `${roleId}:${permissionId}`,
        userId: req.user.userId,
        details: {
          roleName: role.name,
          roleDisplayName: role.display_name,
          permissionName: permission.name,
        },
      });

      logger.info('Permission revoked from role:', {
        roleId,
        permissionId,
        revokedBy: req.user.userId,
      });

      res.json({
        success: true,
        message: `Permission "${permission.name}" revoked from role "${role.display_name}"`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ROLES ROUTES
// ============================================

/**
 * @route   GET /api/v1/permissions/roles
 * @desc    Get all roles
 * @access  Private - requires permissions.read permission
 */
router.get('/roles', authenticate, checkPermission('permissions.read'), async (req, res, next) => {
  try {
    const roles = await databaseService.queryMany(
      `SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_system,
        r.created_at,
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

export default router;
