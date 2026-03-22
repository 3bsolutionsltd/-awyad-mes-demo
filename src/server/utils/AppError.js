/**
 * Custom Application Error Class
 * 
 * Extends the built-in Error class to include HTTP status codes
 * and additional error metadata for API responses.
 */

class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} metadata - Additional error metadata
   */
  constructor(message, statusCode = 500, metadata = {}) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   * @returns {Object} Error object
   */
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        metadata: this.metadata,
      }),
    };
  }
}

export default AppError;
