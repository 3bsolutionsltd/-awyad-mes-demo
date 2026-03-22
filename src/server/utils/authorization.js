/**
 * Authorization Utilities
 * 
 * Helper functions for permission checking, role validation, and RBAC operations.
 */

import databaseService from '../services/databaseService.js';
import logger from './logger.js';
import AppError from './AppError.js';

/**
 * Check if user has a specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name (e.g., 'projects.create')
 * @returns {Promise<boolean>} Whether user has permission
 */
export async function hasPermission(userId, permissionName) {
  try {
    const result = await databaseService.queryOne(
      `SELECT EXISTS(
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1 AND p.name = $2
      ) as has_permission`,
      [userId, permissionName]
    );

    return result.has_permission;
  } catch (error) {
    logger.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 * @param {string} userId - User ID
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Promise<boolean>} Whether user has any permission
 */
export async function hasAnyPermission(userId, permissionNames) {
  try {
    const result = await databaseService.queryOne(
      `SELECT EXISTS(
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1 AND p.name = ANY($2)
      ) as has_permission`,
      [userId, permissionNames]
    );

    return result.has_permission;
  } catch (error) {
    logger.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 * @param {string} userId - User ID
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Promise<boolean>} Whether user has all permissions
 */
export async function hasAllPermissions(userId, permissionNames) {
  try {
    const result = await databaseService.queryOne(
      `SELECT COUNT(DISTINCT p.name) as count
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1 AND p.name = ANY($2)`,
      [userId, permissionNames]
    );

    return result.count === permissionNames.length;
  } catch (error) {
    logger.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Check if user has a specific role
 * @param {string} userId - User ID
 * @param {string} roleName - Role name (e.g., 'admin')
 * @returns {Promise<boolean>} Whether user has role
 */
export async function hasRole(userId, roleName) {
  try {
    const result = await databaseService.queryOne(
      `SELECT EXISTS(
        SELECT 1
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND r.name = $2
      ) as has_role`,
      [userId, roleName]
    );

    return result.has_role;
  } catch (error) {
    logger.error('Role check failed:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified roles
 * @param {string} userId - User ID
 * @param {Array<string>} roleNames - Array of role names
 * @returns {Promise<boolean>} Whether user has any role
 */
export async function hasAnyRole(userId, roleNames) {
  try {
    const result = await databaseService.queryOne(
      `SELECT EXISTS(
        SELECT 1
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND r.name = ANY($2)
      ) as has_role`,
      [userId, roleNames]
    );

    return result.has_role;
  } catch (error) {
    logger.error('Role check failed:', error);
    return false;
  }
}

/**
 * Check if user owns a resource
 * @param {string} userId - User ID
 * @param {string} resourceTable - Database table name
 * @param {string} resourceId - Resource ID
 * @param {string} ownerField - Field name that stores owner ID (default: 'created_by')
 * @returns {Promise<boolean>} Whether user owns resource
 */
export async function isResourceOwner(userId, resourceTable, resourceId, ownerField = 'created_by') {
  try {
    // Validate table name to prevent SQL injection
    const allowedTables = ['activities', 'projects', 'indicators', 'cases'];
    if (!allowedTables.includes(resourceTable)) {
      logger.warn('Attempted resource ownership check on invalid table:', resourceTable);
      return false;
    }

    const query = `SELECT EXISTS(
      SELECT 1 FROM ${resourceTable}
      WHERE id = $1 AND ${ownerField} = $2
    ) as is_owner`;

    const result = await databaseService.queryOne(query, [resourceId, userId]);
    return result.is_owner;
  } catch (error) {
    logger.error('Resource ownership check failed:', error);
    return false;
  }
}

/**
 * Require permission - throws error if user doesn't have permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Permission name
 * @throws {AppError} If user doesn't have permission
 */
export async function requirePermission(userId, permissionName) {
  const allowed = await hasPermission(userId, permissionName);
  if (!allowed) {
    throw new AppError(`Permission denied: ${permissionName}`, 403);
  }
}

/**
 * Require role - throws error if user doesn't have role
 * @param {string} userId - User ID
 * @param {string} roleName - Role name
 * @throws {AppError} If user doesn't have role
 */
export async function requireRole(userId, roleName) {
  const allowed = await hasRole(userId, roleName);
  if (!allowed) {
    throw new AppError(`Role required: ${roleName}`, 403);
  }
}

/**
 * Require resource ownership or permission
 * @param {string} userId - User ID
 * @param {string} resourceTable - Database table name
 * @param {string} resourceId - Resource ID
 * @param {string} permissionName - Permission name to check as alternative
 * @throws {AppError} If user neither owns resource nor has permission
 */
export async function requireOwnershipOrPermission(userId, resourceTable, resourceId, permissionName) {
  const isOwner = await isResourceOwner(userId, resourceTable, resourceId);
  if (isOwner) return;

  const hasOverridePermission = await hasPermission(userId, permissionName);
  if (hasOverridePermission) return;

  throw new AppError('Access denied: you must be the owner or have appropriate permissions', 403);
}

/**
 * Get all permissions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of permission names
 */
export async function getUserPermissions(userId) {
  try {
    const permissions = await databaseService.queryMany(
      `SELECT DISTINCT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return permissions.map(p => p.name);
  } catch (error) {
    logger.error('Failed to get user permissions:', error);
    return [];
  }
}

/**
 * Get all roles for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of role names
 */
export async function getUserRoles(userId) {
  try {
    const roles = await databaseService.queryMany(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return roles.map(r => r.name);
  } catch (error) {
    logger.error('Failed to get user roles:', error);
    return [];
  }
}

/**
 * Check if user can perform action on resource
 * Combines permission checking with ownership validation
 * @param {Object} options - Check options
 * @param {string} options.userId - User ID
 * @param {string} options.action - Action to perform (e.g., 'update')
 * @param {string} options.resource - Resource type (e.g., 'activities')
 * @param {string} options.resourceId - Resource ID (optional, for ownership check)
 * @returns {Promise<boolean>} Whether user can perform action
 */
export async function canPerformAction({ userId, action, resource, resourceId = null }) {
  try {
    // Build permission name (e.g., 'activities.update')
    const permissionName = `${resource}.${action}`;

    // Check if user has direct permission
    const hasDirectPermission = await hasPermission(userId, permissionName);
    if (hasDirectPermission) return true;

    // If checking ownership-based access and resource ID provided
    if (resourceId && action !== 'create') {
      // Check if user owns the resource
      const isOwner = await isResourceOwner(userId, resource, resourceId);
      if (isOwner) {
        // For owned resources, allow read and update
        if (action === 'read' || action === 'update') return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('Action permission check failed:', error);
    return false;
  }
}

/**
 * Middleware factory for requiring permissions
 * @param {string|Array<string>} permissions - Permission(s) required
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export function requirePermissions(permissions, options = {}) {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const { requireAll = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      const checkFunction = requireAll ? hasAllPermissions : hasAnyPermission;
      const allowed = await checkFunction(req.user.userId, permissionArray);

      if (!allowed) {
        throw new AppError(`Insufficient permissions. Required: ${permissionArray.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory for requiring roles
 * @param {string|Array<string>} roles - Role(s) required
 * @returns {Function} Express middleware
 */
export function requireRoles(roles) {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      const allowed = await hasAnyRole(req.user.userId, roleArray);

      if (!allowed) {
        throw new AppError(`Insufficient roles. Required: ${roleArray.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isResourceOwner,
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
  getUserPermissions,
  getUserRoles,
  canPerformAction,
  requirePermissions,
  requireRoles,
};
