/**
 * Audit Logs Routes
 * 
 * API endpoints for viewing and managing audit logs.
 */

import express from 'express';
import Joi from 'joi';
import auditService from '../services/auditService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ============================================
// Validation Schemas
// ============================================

const getAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().optional(),
  resource: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('created_at', 'action', 'resource').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const getAuditStatsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

// ============================================
// Routes
// ============================================

/**
 * @route   GET /api/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/',
  authenticate,
  checkPermission('audit_logs.read'),
  validate(getAuditLogsSchema, 'query'),
  async (req, res, next) => {
    try {
      const {
        page,
        limit,
        userId,
        action,
        resource,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await auditService.getAuditLogs({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        userId,
        action,
        resource,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/stats',
  authenticate,
  checkPermission('audit_logs.read'),
  validate(getAuditStatsSchema, 'query'),
  async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await auditService.getAuditStats({
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/user/:userId',
  authenticate,
  checkPermission('audit_logs.read'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit = 100 } = req.query;

      const logs = await auditService.getUserAuditLogs(userId, parseInt(limit));

      res.json({
        success: true,
        data: { logs },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/audit-logs/resource/:resource/:resourceId
 * @desc    Get audit logs for a specific resource
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/resource/:resource/:resourceId',
  authenticate,
  checkPermission('audit_logs.read'),
  async (req, res, next) => {
    try {
      const { resource, resourceId } = req.params;
      const { limit = 50 } = req.query;

      const logs = await auditService.getResourceAuditLogs(
        resource,
        resourceId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: { logs },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/audit-logs/actions
 * @desc    Get list of available audit actions
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/actions',
  authenticate,
  checkPermission('audit_logs.read'),
  async (req, res, next) => {
    try {
      const actions = Object.values(auditService.AUDIT_ACTIONS);

      res.json({
        success: true,
        data: { actions },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/audit-logs/resources
 * @desc    Get list of available audit resources
 * @access  Private - requires audit_logs.read permission
 */
router.get(
  '/resources',
  authenticate,
  checkPermission('audit_logs.read'),
  async (req, res, next) => {
    try {
      const resources = Object.values(auditService.AUDIT_RESOURCES);

      res.json({
        success: true,
        data: { resources },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
