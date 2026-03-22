/**
 * Authentication Middleware
 * 
 * JWT verification, user authentication, and permission checking middleware.
 */

import authService from '../services/authService.js';
import { hasPermission, hasRole } from '../utils/authorization.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Extract JWT token from request
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
function extractToken(req) {
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [],
    };

    logger.debug('User authenticated:', { userId: decoded.userId, email: decoded.email });
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Invalid authentication token', 401));
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = authService.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    }

    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
}

/**
 * Middleware factory to check if user has specific permission
 * @param {string} permissionName - Permission name to check
 * @returns {Function} Express middleware
 */
export function checkPermission(permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      const allowed = await hasPermission(req.user.userId, permissionName);

      if (!allowed) {
        throw new AppError(`Permission denied: ${permissionName}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to check if user has any of the specified permissions
 * @param {Array<string>} permissionNames - Array of permission names
 * @returns {Function} Express middleware
 */
export function checkAnyPermission(permissionNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      for (const permissionName of permissionNames) {
        const allowed = await hasPermission(req.user.userId, permissionName);
        if (allowed) {
          return next();
        }
      }

      throw new AppError(`Permission denied: requires one of ${permissionNames.join(', ')}`, 403);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to check if user has specific role
 * @param {string} roleName - Role name to check
 * @returns {Function} Express middleware
 */
export function checkRole(roleName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      const allowed = await hasRole(req.user.userId, roleName);

      if (!allowed) {
        throw new AppError(`Role required: ${roleName}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to check if user has any of the specified roles
 * @param {Array<string>} roleNames - Array of role names
 * @returns {Function} Express middleware
 */
export function checkAnyRole(roleNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError('Authentication required', 401);
      }

      for (const roleName of roleNames) {
        const allowed = await hasRole(req.user.userId, roleName);
        if (allowed) {
          return next();
        }
      }

      throw new AppError(`Role required: one of ${roleNames.join(', ')}`, 403);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export async function checkAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      throw new AppError('Authentication required', 401);
    }

    const isAdmin = await hasRole(req.user.userId, 'admin');

    if (!isAdmin) {
      throw new AppError('Administrator access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to log authentication attempts
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function logAuthAttempt(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  logger.info('Authentication attempt', {
    ip,
    userAgent,
    email: req.body.email || req.body.username,
    path: req.path,
  });

  next();
}

/**
 * Middleware to attach user permissions to request
 * Must be used after authenticate middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export async function attachPermissions(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return next();
    }

    // Get user permissions
    const permissions = await authService.getUserPermissions(req.user.userId);
    req.user.permissions = permissions.map(p => p.name);

    next();
  } catch (error) {
    logger.error('Failed to attach permissions:', error);
    next();
  }
}

/**
 * Middleware to rate limit authentication attempts per user per IP
 * Tracks failed login attempts per email/username + IP combination
 */
const authAttempts = new Map();

export function rateLimit(options = {}) {
  const { maxAttempts = 100, windowMs = 15 * 60 * 1000 } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const identifier = req.body.emailOrUsername || req.body.email || 'unknown';
    const key = `${identifier}:${ip}`; // Combine user and IP
    const now = Date.now();

    if (!authAttempts.has(key)) {
      authAttempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const attempt = authAttempts.get(key);

    if (now > attempt.resetAt) {
      // Reset window
      authAttempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (attempt.count >= maxAttempts) {
      const remainingTime = Math.ceil((attempt.resetAt - now) / 1000 / 60);
      throw new AppError(`Too many authentication attempts for this account. Try again in ${remainingTime} minutes`, 429);
    }

    attempt.count++;
    next();
  };
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, attempt] of authAttempts.entries()) {
    if (now > attempt.resetAt) {
      authAttempts.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export default {
  authenticate,
  optionalAuth,
  checkPermission,
  checkAnyPermission,
  checkRole,
  checkAnyRole,
  checkAdmin,
  logAuthAttempt,
  attachPermissions,
  rateLimit,
};
