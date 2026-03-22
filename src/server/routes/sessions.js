/**
 * Session Management Routes
 * Handles user session viewing and management
 */

import express from 'express';
import databaseService from '../services/databaseService.js';
import auditService from '../services/auditService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

/**
 * @route   GET /api/v1/sessions
 * @desc    Get current user's active sessions
 * @access  Private - authenticated users
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const sessions = await databaseService.queryMany(
      `SELECT 
        rt.id,
        rt.token,
        rt.created_at,
        rt.expires_at,
        rt.revoked_at,
        CASE 
          WHEN rt.revoked_at IS NOT NULL THEN 'revoked'
          WHEN rt.expires_at < NOW() THEN 'expired'
          ELSE 'active'
        END as status
      FROM refresh_tokens rt
      WHERE rt.user_id = $1
      ORDER BY rt.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          createdAt: s.created_at,
          expiresAt: s.expires_at,
          revokedAt: s.revoked_at,
          status: s.status,
          isCurrentSession: s.token === req.refreshToken,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/sessions/all
 * @desc    Get all users' sessions (admin only)
 * @access  Private - requires users.read permission
 */
router.get('/all', authenticate, checkPermission('users.read'), async (req, res, next) => {
  try {
    const { status, userId } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`rt.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (status === 'active') {
      whereConditions.push(`rt.revoked_at IS NULL AND rt.expires_at > NOW()`);
    } else if (status === 'expired') {
      whereConditions.push(`rt.expires_at < NOW()`);
    } else if (status === 'revoked') {
      whereConditions.push(`rt.revoked_at IS NOT NULL`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const sessions = await databaseService.queryMany(
      `SELECT 
        rt.id,
        rt.user_id,
        rt.created_at,
        rt.expires_at,
        rt.revoked_at,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        CASE 
          WHEN rt.revoked_at IS NOT NULL THEN 'revoked'
          WHEN rt.expires_at < NOW() THEN 'expired'
          ELSE 'active'
        END as status
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      ${whereClause}
      ORDER BY rt.created_at DESC
      LIMIT 100`,
      params
    );

    res.json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          id: s.id,
          userId: s.user_id,
          username: s.username,
          email: s.email,
          firstName: s.first_name,
          lastName: s.last_name,
          createdAt: s.created_at,
          expiresAt: s.expires_at,
          revokedAt: s.revoked_at,
          status: s.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/sessions/:id
 * @desc    Revoke a session (user can revoke own sessions, admin can revoke any)
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get the session
    const session = await databaseService.queryOne(
      'SELECT id, user_id, revoked_at FROM refresh_tokens WHERE id = $1',
      [id]
    );

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    // Check if already revoked
    if (session.revoked_at) {
      throw new AppError('Session already revoked', 400);
    }

    // Check permission: users can revoke their own sessions, admins can revoke any
    const isOwnSession = session.user_id === userId;
    const isAdmin = req.user.permissions.includes('users.read');

    if (!isOwnSession && !isAdmin) {
      throw new AppError('You can only revoke your own sessions', 403);
    }

    // Revoke the session
    await databaseService.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1',
      [id]
    );

    // Log the action
    await auditService.log({
      action: 'revoke_session',
      resource: 'sessions',
      resourceId: id,
      userId: req.user.userId,
      details: {
        targetUserId: session.user_id,
        isOwnSession,
      },
    });

    logger.info('Session revoked:', {
      sessionId: id,
      revokedBy: userId,
      targetUserId: session.user_id,
    });

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/sessions/user/:userId
 * @desc    Revoke all sessions for a user (admin only)
 * @access  Private - requires users.update permission
 */
router.delete('/user/:userId', authenticate, checkPermission('users.update'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await databaseService.queryOne(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Count active sessions
    const activeSessions = await databaseService.queryOne(
      `SELECT COUNT(*) as count 
       FROM refresh_tokens 
       WHERE user_id = $1 
       AND revoked_at IS NULL 
       AND expires_at > NOW()`,
      [userId]
    );

    // Revoke all sessions
    await databaseService.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );

    // Log the action
    await auditService.log({
      action: 'revoke_all_sessions',
      resource: 'sessions',
      resourceId: userId,
      userId: req.user.userId,
      details: {
        targetUserId: userId,
        targetEmail: user.email,
        sessionsRevoked: parseInt(activeSessions.count),
      },
    });

    logger.info('All sessions revoked for user:', {
      userId,
      revokedBy: req.user.userId,
      count: activeSessions.count,
    });

    res.json({
      success: true,
      message: `All sessions revoked for user ${user.email}`,
      data: {
        sessionsRevoked: parseInt(activeSessions.count),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/sessions/stats
 * @desc    Get session statistics (admin only)
 * @access  Private - requires users.read permission
 */
router.get('/stats', authenticate, checkPermission('users.read'), async (req, res, next) => {
  try {
    const stats = await databaseService.queryOne(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE revoked_at IS NULL AND expires_at > NOW()) as active,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
        COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) as revoked,
        COUNT(DISTINCT user_id) as unique_users
      FROM refresh_tokens`
    );

    res.json({
      success: true,
      data: {
        total: parseInt(stats.total),
        active: parseInt(stats.active),
        expired: parseInt(stats.expired),
        revoked: parseInt(stats.revoked),
        uniqueUsers: parseInt(stats.unique_users),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
