import { HTTP_STATUS, MESSAGES } from '../../shared/constants.js';

/**
 * Standard API response format
 */
export class ApiResponse {
  constructor(success, data = null, message = '', errors = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    if (errors) {
      this.errors = errors;
    }
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) {
    return {
      response: new ApiResponse(true, data, message),
      statusCode,
    };
  }

  static created(data, message = MESSAGES.CREATED) {
    return {
      response: new ApiResponse(true, data, message),
      statusCode: HTTP_STATUS.CREATED,
    };
  }

  static error(message = MESSAGES.SERVER_ERROR, errors = null, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return {
      response: new ApiResponse(false, null, message, errors),
      statusCode,
    };
  }

  static notFound(message = MESSAGES.NOT_FOUND) {
    return {
      response: new ApiResponse(false, null, message),
      statusCode: HTTP_STATUS.NOT_FOUND,
    };
  }

  static badRequest(message = MESSAGES.VALIDATION_ERROR, errors = null) {
    return {
      response: new ApiResponse(false, null, message, errors),
      statusCode: HTTP_STATUS.BAD_REQUEST,
    };
  }

  static validationError(errors) {
    return {
      response: new ApiResponse(false, null, MESSAGES.VALIDATION_ERROR, errors),
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    };
  }
}

/**
 * Pagination helper
 */
export class PaginationHelper {
  static paginate(data, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);
    const total = data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

/**
 * Sorting helper
 */
export class SortHelper {
  static sort(data, sortBy, sortOrder = 'asc') {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, sortBy);
      const bValue = this.getNestedValue(b, sortBy);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date) {
        comparison = aValue - bValue;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

/**
 * Filter helper
 */
export class FilterHelper {
  static filter(data, filters) {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value == null || value === '') return true;
        
        const itemValue = this.getNestedValue(item, key);
        
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

/**
 * Date helper
 */
export class DateHelper {
  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  static formatDate(date, format = 'yyyy-MM-dd') {
    if (!this.isValidDate(date)) return null;
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  static isBetween(date, startDate, endDate) {
    const d = new Date(date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }
}

/**
 * ID Generator
 */
export class IDGenerator {
  static generate(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${prefix}${prefix ? '-' : ''}${timestamp}${randomStr}`.toUpperCase();
  }
}

export default {
  ApiResponse,
  PaginationHelper,
  SortHelper,
  FilterHelper,
  DateHelper,
  IDGenerator,
};
