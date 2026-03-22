/**
 * Audit Service
 * 
 * Handles audit logging for all system activities.
 * Tracks user actions, data changes, and system events for security and compliance.
 */

import databaseService from './databaseService.js';
import logger from '../utils/logger.js';

/**
 * Action types for audit logging
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET: 'password_reset',
  
  // User management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // Role management
  ROLE_ASSIGNED: 'role_assigned',
  ROLE_REMOVED: 'role_removed',
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_DELETED: 'role_deleted',
  
  // Data operations
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  INDICATOR_CREATED: 'indicator_created',
  INDICATOR_UPDATED: 'indicator_updated',
  INDICATOR_DELETED: 'indicator_deleted',
  ACTIVITY_CREATED: 'activity_created',
  ACTIVITY_UPDATED: 'activity_updated',
  ACTIVITY_DELETED: 'activity_deleted',
  CASE_CREATED: 'case_created',
  CASE_UPDATED: 'case_updated',
  CASE_DELETED: 'case_deleted',
  
  // System
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  SETTINGS_CHANGED: 'settings_changed',
};

/**
 * Resource types for audit logging
 */
export const AUDIT_RESOURCES = {
  AUTH: 'authentication',
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  PROJECT: 'project',
  INDICATOR: 'indicator',
  ACTIVITY: 'activity',
  CASE: 'case',
  REPORT: 'report',
  SYSTEM: 'system',
};

/**
 * Log an audit event
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.action - Action performed (from AUDIT_ACTIONS)
 * @param {string} params.resource - Resource type (from AUDIT_RESOURCES)
 * @param {string} [params.resourceId] - ID of the resource affected
 * @param {Object} [params.oldValues] - Previous values (for updates)
 * @param {Object} [params.newValues] - New values (for creates/updates)
 * @param {string} [params.ipAddress] - IP address of the user
 * @param {string} [params.userAgent] - User agent string
 * @returns {Promise<Object>} Created audit log entry
 */
async function logAudit({
  userId,
  action,
  resource,
  resourceId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const auditLog = await databaseService.queryOne(
      `INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        userId,
        action,
        resource,
        resourceId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ]
    );

    logger.info(`Audit log created: ${action} on ${resource} by user ${userId}`);
    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
}

/**
 * Get audit logs with filtering and pagination
 * 
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=50] - Items per page
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.action] - Filter by action
 * @param {string} [options.resource] - Filter by resource type
 * @param {string} [options.startDate] - Filter logs after this date
 * @param {string} [options.endDate] - Filter logs before this date
 * @param {string} [options.sortBy='created_at'] - Sort field
 * @param {string} [options.sortOrder='desc'] - Sort order
 * @returns {Promise<Object>} Paginated audit logs with user details
 */
async function getAuditLogs({
  page = 1,
  limit = 50,
  userId = null,
  action = null,
  resource = null,
  startDate = null,
  endDate = null,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) {
  try {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (userId) {
      conditions.push(`al.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (resource) {
      conditions.push(`al.resource = $${paramIndex}`);
      params.push(resource);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`al.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`al.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort fields
    const allowedSortFields = ['created_at', 'action', 'resource'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await databaseService.queryOne(
      `SELECT COUNT(*) as count FROM audit_logs al ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.count);

    // Get paginated logs with user details
    const logs = await databaseService.queryMany(
      `SELECT 
        al.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.username as user_username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    logger.error('Failed to get audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 * 
 * @param {Object} options - Filter options
 * @param {string} [options.startDate] - Start date for statistics
 * @param {string} [options.endDate] - End date for statistics
 * @returns {Promise<Object>} Audit log statistics
 */
async function getAuditStats({ startDate = null, endDate = null }) {
  try {
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get action distribution
    const actionStats = await databaseService.queryMany(
      `SELECT action, COUNT(*) as count
       FROM audit_logs
       ${whereClause}
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Get resource distribution
    const resourceStats = await databaseService.queryMany(
      `SELECT resource, COUNT(*) as count
       FROM audit_logs
       ${whereClause}
       GROUP BY resource
       ORDER BY count DESC`,
      params
    );

    // Get top users by activity
    const userStats = await databaseService.queryMany(
      `SELECT 
        al.user_id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(*) as action_count
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       GROUP BY al.user_id, u.email, u.first_name, u.last_name
       ORDER BY action_count DESC
       LIMIT 10`,
      params
    );

    // Get total count
    const totalResult = await databaseService.queryOne(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      params
    );

    return {
      total: parseInt(totalResult.total),
      byAction: actionStats,
      byResource: resourceStats,
      topUsers: userStats,
    };
  } catch (error) {
    logger.error('Failed to get audit stats:', error);
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 * 
 * @param {string} userId - User ID
 * @param {number} [limit=100] - Maximum number of logs to return
 * @returns {Promise<Array>} User's audit logs
 */
async function getUserAuditLogs(userId, limit = 100) {
  try {
    const logs = await databaseService.queryMany(
      `SELECT * FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return logs;
  } catch (error) {
    logger.error(`Failed to get audit logs for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get audit logs for a specific resource
 * 
 * @param {string} resource - Resource type
 * @param {string} resourceId - Resource ID
 * @param {number} [limit=50] - Maximum number of logs to return
 * @returns {Promise<Array>} Resource audit logs
 */
async function getResourceAuditLogs(resource, resourceId, limit = 50) {
  try {
    const logs = await databaseService.queryMany(
      `SELECT 
        al.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.resource = $1 AND al.resource_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3`,
      [resource, resourceId, limit]
    );

    return logs;
  } catch (error) {
    logger.error(`Failed to get audit logs for ${resource} ${resourceId}:`, error);
    throw error;
  }
}

/**
 * Delete old audit logs (for retention policy)
 * 
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} Number of deleted logs
 */
async function deleteOldAuditLogs(daysToKeep = 90) {
  try {
    const result = await databaseService.queryOne(
      `DELETE FROM audit_logs
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING COUNT(*) as deleted_count`
    );

    const deletedCount = parseInt(result.deleted_count || 0);
    logger.info(`Deleted ${deletedCount} audit logs older than ${daysToKeep} days`);
    return deletedCount;
  } catch (error) {
    logger.error('Failed to delete old audit logs:', error);
    throw error;
  }
}

export default {
  logAudit,
  getAuditLogs,
  getAuditStats,
  getUserAuditLogs,
  getResourceAuditLogs,
  deleteOldAuditLogs,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
};
