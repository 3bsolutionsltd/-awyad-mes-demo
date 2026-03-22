/**
 * Thematic Areas Routes
 * API endpoints for managing thematic areas
 */

import express from 'express';
import Joi from 'joi';
import db from '../services/databaseService.js';
import { ApiResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createThematicAreaSchema = Joi.object({
  code: Joi.string().max(50).required(),
  name: Joi.string().max(500).required(),
  description: Joi.string().allow('', null).optional(),
  is_active: Joi.boolean().default(true)
});

const updateThematicAreaSchema = Joi.object({
  code: Joi.string().max(50).optional(),
  name: Joi.string().max(500).optional(),
  description: Joi.string().allow('', null).optional(),
  is_active: Joi.boolean().optional()
});

/**
 * GET /api/v1/thematic-areas
 * Get all thematic areas
 */
router.get(
  '/',
  authenticate,
  checkPermission('projects.read'),
  asyncHandler(async (req, res) => {
    const { active_only } = req.query;
    
    let query = 'SELECT id, code, name, description, is_active, created_at, updated_at FROM thematic_areas';
    const params = [];
    
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY name';
    
    const result = await db.query(query, params);
    
    const { response, statusCode } = ApiResponse.success(result.rows);
    res.status(statusCode).json(response);
  })
);

/**
 * GET /api/v1/thematic-areas/:id
 * Get a single thematic area by ID
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('projects.read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        ta.id, ta.code, ta.name, ta.description, ta.is_active,
        ta.created_at, ta.updated_at,
        COUNT(DISTINCT p.id) as project_count,
        COUNT(DISTINCT i.id) as indicator_count
       FROM thematic_areas ta
       LEFT JOIN projects p ON p.thematic_area_id = ta.id
       LEFT JOIN indicators i ON i.thematic_area_id = ta.id
       WHERE ta.id = $1
       GROUP BY ta.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const { response, statusCode } = ApiResponse.notFound('Thematic area not found');
      return res.status(statusCode).json(response);
    }
    
    const { response, statusCode } = ApiResponse.success(result.rows[0]);
    res.status(statusCode).json(response);
  })
);

/**
 * POST /api/v1/thematic-areas
 * Create a new thematic area
 */
router.post(
  '/',
  authenticate,
  checkPermission('projects.create'),
  asyncHandler(async (req, res) => {
    // Validate request body
    const { error, value } = createThematicAreaSchema.validate(req.body);
    if (error) {
      const { response, statusCode } = ApiResponse.validationError(error.details[0].message);
      return res.status(statusCode).json(response);
    }
    
    const { code, name, description, is_active } = value;
    const userId = req.user.id;
    
    // Check if code already exists
    const existingCode = await db.query(
      'SELECT id FROM thematic_areas WHERE code = $1',
      [code]
    );
    
    if (existingCode.rows.length > 0) {
      const { response, statusCode } = ApiResponse.error('A thematic area with this code already exists', 409);
      return res.status(statusCode).json(response);
    }
    
    // Insert thematic area
    const result = await db.query(
      `INSERT INTO thematic_areas (code, name, description, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, name, description, is_active, created_at, updated_at`,
      [code, name, description, is_active, userId, userId]
    );
    
    const { response, statusCode } = ApiResponse.created(result.rows[0]);
    res.status(statusCode).json(response);
  })
);

/**
 * PUT /api/v1/thematic-areas/:id
 * Update a thematic area
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('projects.update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Validate request body
    const { error, value } = updateThematicAreaSchema.validate(req.body);
    if (error) {
      const { response, statusCode } = ApiResponse.validationError(error.details[0].message);
      return res.status(statusCode).json(response);
    }
    
    // Check if thematic area exists
    const existing = await db.query(
      'SELECT id FROM thematic_areas WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      const { response, statusCode } = ApiResponse.notFound('Thematic area not found');
      return res.status(statusCode).json(response);
    }
    
    // If updating code, check it doesn't conflict
    if (value.code) {
      const codeCheck = await db.query(
        'SELECT id FROM thematic_areas WHERE code = $1 AND id != $2',
        [value.code, id]
      );
      
      if (codeCheck.rows.length > 0) {
        const { response, statusCode } = ApiResponse.error('A thematic area with this code already exists', 409);
        return res.status(statusCode).json(response);
      }
    }
    
    const userId = req.user.id;
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (value.code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(value.code);
    }
    if (value.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(value.name);
    }
    if (value.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(value.description);
    }
    if (value.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(value.is_active);
    }
    
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(id);
    
    const result = await db.query(
      `UPDATE thematic_areas 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, code, name, description, is_active, created_at, updated_at`,
      values
    );
    
    const { response, statusCode } = ApiResponse.success(result.rows[0]);
    res.status(statusCode).json(response);
  })
);

/**
 * DELETE /api/v1/thematic-areas/:id
 * Delete a thematic area (soft delete by setting is_active = false)
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('projects.delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if thematic area exists
    const existing = await db.query(
      'SELECT id FROM thematic_areas WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      const { response, statusCode } = ApiResponse.notFound('Thematic area not found');
      return res.status(statusCode).json(response);
    }
    
    // Check if thematic area is being used
    const usage = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM projects WHERE thematic_area_id = $1) as project_count,
        (SELECT COUNT(*) FROM indicators WHERE thematic_area_id = $1) as indicator_count`,
      [id]
    );
    
    const { project_count, indicator_count } = usage.rows[0];
    
    if (parseInt(project_count) > 0 || parseInt(indicator_count) > 0) {
      const { response, statusCode } = ApiResponse.error(
        `Cannot delete thematic area. It is currently used by ${project_count} project(s) and ${indicator_count} indicator(s). Please reassign or delete those items first.`,
        409
      );
      return res.status(statusCode).json(response);
    }
    
    // Soft delete by setting is_active to false
    await db.query(
      'UPDATE thematic_areas SET is_active = false, updated_by = $1 WHERE id = $2',
      [req.user.id, id]
    );
    
    const { response, statusCode } = ApiResponse.success({ message: 'Thematic area deleted successfully' });
    res.status(statusCode).json(response);
  })
);

export default router;
