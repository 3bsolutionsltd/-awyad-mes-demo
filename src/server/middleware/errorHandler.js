import { ApiResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../../shared/constants.js';
import { ValidationError } from '../../shared/validators.js';
import logger from '../utils/logger.js';

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  // Validation errors
  if (err instanceof ValidationError) {
    const { response, statusCode } = ApiResponse.validationError(err.errors);
    return res.status(statusCode).json(response);
  }

  // Not found errors
  if (err.statusCode === HTTP_STATUS.NOT_FOUND) {
    const { response, statusCode } = ApiResponse.notFound(err.message);
    return res.status(statusCode).json(response);
  }

  // Rate limit / Too many requests errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      data: null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Unauthorized errors
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      data: null,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Bad request errors
  if (err.statusCode === HTTP_STATUS.BAD_REQUEST) {
    const { response, statusCode } = ApiResponse.badRequest(err.message);
    return res.status(statusCode).json(response);
  }

  // Default to 500 server error
  const { response, statusCode } = ApiResponse.error(
    process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  );
  
  return res.status(statusCode).json(response);
};

/**
 * 404 Not found handler
 */
export const notFoundHandler = (req, res) => {
  const { response, statusCode } = ApiResponse.notFound(
    `Route ${req.originalUrl} not found`
  );
  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
