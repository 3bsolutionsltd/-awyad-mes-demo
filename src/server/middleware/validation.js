import { validateData } from '../../shared/validators.js';
import logger from '../utils/logger.js';

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      logger.debug(`Validating ${source}:`, JSON.stringify(data));
      const validated = validateData(data, schema);
      req[source] = validated;
      next();
    } catch (error) {
      logger.error(`Validation error for ${source}:`, error);
      if (error.errors) {
        logger.error('Validation details:', JSON.stringify(error.errors));
      }
      next(error);
    }
  };
};

export default validate;
