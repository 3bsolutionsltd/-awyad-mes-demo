/**
 * Database Service
 * 
 * Handles PostgreSQL database connections, query execution, and transaction management.
 * Uses connection pooling for optimal performance.
 */

import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      const poolConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: parseInt(process.env.DB_POOL_SIZE) || 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'awyad_mes',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            max: parseInt(process.env.DB_POOL_SIZE) || 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      logger.info('Database connection pool initialized successfully');
      client.release();

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected database pool error:', err);
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize database pool:', error.message);
      throw error;
    }
  }

  /**
   * Execute a single query
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, error: error.message });
      throw error;
    }
  }

  /**
   * Get a client from the pool for transaction management
   * @returns {Promise<Object>} Database client
   */
  async getClient() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (error) {
      logger.error('Failed to get database client:', error);
      throw error;
    }
  }

  /**
   * Execute queries within a transaction
   * @param {Function} callback - Async function that receives client and executes queries
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query that returns a single row
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  async queryOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query that returns multiple rows
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of rows
   */
  async queryMany(text, params = []) {
    const result = await this.query(text, params);
    return result.rows;
  }

  /**
   * Execute a query that returns paginated results
   * @param {string} baseQuery - Base SQL query without LIMIT/OFFSET
   * @param {Array} params - Query parameters
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated result with data and metadata
   */
  async queryPaginated(baseQuery, params = [], page = 1, limit = 10) {
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
    const countResult = await this.queryOne(countQuery, params);
    const total = parseInt(countResult.total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const data = await this.queryMany(paginatedQuery, [...params, limit, offset]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Build a WHERE clause from filter object
   * @param {Object} filters - Filter conditions
   * @param {number} startIndex - Starting parameter index
   * @returns {Object} Object with whereClause and params array
   */
  buildWhereClause(filters, startIndex = 1) {
    const conditions = [];
    const params = [];
    let paramIndex = startIndex;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle array values (IN clause)
          const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
          paramIndex += value.length;
        } else if (typeof value === 'object' && value.operator) {
          // Handle complex operators
          const { operator, val } = value;
          conditions.push(`${key} ${operator} $${paramIndex}`);
          params.push(val);
          paramIndex++;
        } else {
          // Handle simple equality
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params, nextIndex: paramIndex };
  }

  /**
   * Build ORDER BY clause from sort object
   * @param {Object} sort - Sort configuration {field: 'name', order: 'asc'}
   * @param {Array} allowedFields - Allowed sort fields (for security)
   * @returns {string} ORDER BY clause
   */
  buildOrderByClause(sort, allowedFields = []) {
    if (!sort || !sort.field) return '';

    const { field, order = 'asc' } = sort;
    
    // Validate field to prevent SQL injection
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      logger.warn('Attempted to sort by non-allowed field:', field);
      return '';
    }

    // Validate order direction
    const direction = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    return `ORDER BY ${field} ${direction}`;
  }

  /**
   * Check if connection is healthy
   * @returns {Promise<boolean>} Connection status
   */
  async healthCheck() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    if (!this.pool) return null;
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Close all database connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
