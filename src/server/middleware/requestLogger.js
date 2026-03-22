import logger from '../utils/logger.js';

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.originalUrl} - Request received`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

export default requestLogger;
