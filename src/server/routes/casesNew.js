/**
 * Cases API Routes
 * 
 * CRITICAL: NO NAME FIELDS for confidentiality
 * Features: Case types/categories, referral tracking, statistics
 */

import express from 'express';
import caseService from '../services/caseService.js';
import caseTypeService from '../services/caseTypeService.js';
import caseStatisticsService from '../services/caseStatisticsService.js';
import { authenticate, checkPermission, checkRole } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';
import databaseService from '../services/databaseService.js';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS (NO NAME FIELDS)
// ============================================================================

const createCaseSchema = Joi.object({
  case_number: Joi.string().max(100).optional(), // Auto-generated if not provided
  project_id: Joi.string().uuid().allow(null),
  case_type_id: Joi.string().uuid().required(),
  case_category_id: Joi.string().uuid().allow(null),
  date_reported: Joi.date().required(),
  status: Joi.string().valid('Open', 'In Progress', 'Pending', 'Closed').default('Open'),
  location: Joi.string().max(200).allow(null, ''),
  district_id: Joi.string().uuid().allow(null),
  settlement_id: Joi.string().uuid().allow(null),
  age_group: Joi.string().max(50).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').required(),
  nationality: Joi.string().max(100).allow(null, ''),
  disability_status: Joi.string().max(200).allow(null, ''),
  has_disability: Joi.boolean().default(false),
  case_source: Joi.string().max(200).allow(null, ''),
  referred_from: Joi.string().max(200).allow(null, ''),
  referred_to: Joi.string().max(200).allow(null, ''),
  referral_date: Joi.date().allow(null),
  support_offered: Joi.string().min(50).required(), // REQUIRED, min 50 chars
  tracking_tags: Joi.array().items(Joi.string()).default([]),
  case_worker: Joi.string().max(200).allow(null, ''),
  follow_up_date: Joi.date().allow(null),
  notes: Joi.string().max(5000).allow(null, ''),
  
  // BLOCK name fields
  beneficiary_name: Joi.forbidden(),
  client_name: Joi.forbidden(),
  name: Joi.forbidden()
});

const updateCaseSchema = Joi.object({
  project_id: Joi.string().uuid().allow(null),
  case_type_id: Joi.string().uuid(),
  case_category_id: Joi.string().uuid().allow(null),
  status: Joi.string().valid('Open', 'In Progress', 'Pending', 'Closed'),
  location: Joi.string().max(200).allow(null, ''),
  district_id: Joi.string().uuid().allow(null),
  settlement_id: Joi.string().uuid().allow(null),
  age_group: Joi.string().max(50),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say'),
  nationality: Joi.string().max(100).allow(null, ''),
  disability_status: Joi.string().max(200).allow(null, ''),
  has_disability: Joi.boolean(),
  case_source: Joi.string().max(200).allow(null, ''),
  referred_from: Joi.string().max(200).allow(null, ''),
  referred_to: Joi.string().max(200).allow(null, ''),
  referral_date: Joi.date().allow(null),
  support_offered: Joi.string().min(50),
  tracking_tags: Joi.array().items(Joi.string()),
  case_worker: Joi.string().max(200).allow(null, ''),
  follow_up_date: Joi.date().allow(null),
  closure_date: Joi.date().allow(null),
  notes: Joi.string().max(5000).allow(null, ''),
  
  // BLOCK name fields
  beneficiary_name: Joi.forbidden(),
  client_name: Joi.forbidden(),
  name: Joi.forbidden()
}).min(1);

// ============================================================================
// CASE MANAGEMENT ROUTES (NO NAMES)
// ============================================================================

/**
 * POST /api/v1/cases
 * Create new case (NO NAME)
 */
router.post('/', authenticate, checkPermission('cases.create'), async (req, res, next) => {
  try {
    const { error, value } = createCaseSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Resolve district/settlement → location string
    if (value.district_id) {
      try {
        const distRow = await databaseService.queryOne(
          'SELECT config_value FROM system_configurations WHERE id = $1',
          [value.district_id]
        );
        let locationStr = distRow?.config_value || '';
        if (value.settlement_id) {
          const settRow = await databaseService.queryOne(
            'SELECT config_value FROM system_configurations WHERE id = $1',
            [value.settlement_id]
          );
          if (settRow?.config_value) locationStr += ' / ' + settRow.config_value;
        }
        value.location = locationStr;
      } catch { /* location stays as provided */ }
    }

    const caseData = await caseService.createCase(value, req.user.id);
    res.status(201).json({
      success: true,
      data: caseData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases
 * List cases with advanced filtering (NO NAMES)
 */
router.get('/', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const result = await caseService.getCases(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CASE TYPES ROUTES
// ============================================================================

/**
 * GET /api/v1/case-types
 * Get all case types
 */
router.get('/types/all', authenticate, async (req, res, next) => {
  try {
    const types = await caseTypeService.getAllTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/case-types/active
 * Get active case types only
 */
router.get('/types/active', authenticate, async (req, res, next) => {
  try {
    const types = await caseTypeService.getActiveTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/case-types/:id
 * Get single case type
 */
router.get('/types/:id', authenticate, async (req, res, next) => {
  try {
    const type = await caseTypeService.getTypeById(req.params.id);
    res.json({
      success: true,
      data: type
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/case-types
 * Create case type
 */
router.post('/types', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      code: Joi.string().max(50).required(),
      name: Joi.string().max(200).required(),
      description: Joi.string().allow(null, ''),
      display_order: Joi.number().integer().min(0).default(999)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const type = await caseTypeService.createType(value, req.user.id);
    res.status(201).json({
      success: true,
      data: type
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/case-types/:id
 * Update case type
 */
router.put('/types/:id', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      code: Joi.string().max(50),
      name: Joi.string().max(200),
      description: Joi.string().allow(null, ''),
      is_active: Joi.boolean(),
      display_order: Joi.number().integer().min(0)
    }).min(1);

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const type = await caseTypeService.updateType(req.params.id, value, req.user.id);
    res.json({
      success: true,
      data: type
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/case-types/:id
 * Soft delete case type
 */
router.delete('/types/:id', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    await caseTypeService.deleteType(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Case type deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/case-types/reorder
 * Reorder case types
 */
router.post('/types/reorder', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      order: Joi.array().items(
        Joi.object({
          id: Joi.string().uuid().required(),
          order: Joi.number().integer().min(0).required()
        })
      ).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const result = await caseTypeService.reorderTypes(value.order, req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CASE CATEGORIES ROUTES
// ============================================================================

/**
 * GET /api/v1/case-categories
 * Get all categories
 */
router.get('/categories/all', authenticate, async (req, res, next) => {
  try {
    const categories = await caseTypeService.getAllCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/case-categories/type/:typeId
 * Get categories for specific type
 */
router.get('/categories/type/:typeId', authenticate, async (req, res, next) => {
  try {
    const categories = await caseTypeService.getCategoriesByType(req.params.typeId);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/case-categories
 * Create category
 */
router.post('/categories', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      case_type_id: Joi.string().uuid().required(),
      code: Joi.string().max(50).required(),
      name: Joi.string().max(200).required(),
      description: Joi.string().allow(null, ''),
      display_order: Joi.number().integer().min(0).default(999)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const category = await caseTypeService.createCategory(value, req.user.id);
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/case-categories/:id
 * Update category
 */
router.put('/categories/:id', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      case_type_id: Joi.string().uuid(),
      code: Joi.string().max(50),
      name: Joi.string().max(200),
      description: Joi.string().allow(null, ''),
      is_active: Joi.boolean(),
      display_order: Joi.number().integer().min(0)
    }).min(1);

    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const category = await caseTypeService.updateCategory(req.params.id, value, req.user.id);
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/case-categories/:id
 * Soft delete category
 */
router.delete('/categories/:id', authenticate, checkRole('admin'), async (req, res, next) => {
  try {
    await caseTypeService.deleteCategory(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TAGGING ROUTES
// ============================================================================

/**
 * POST /api/v1/cases/:id/tags
 * Add tag to case
 */
router.post('/:id/tags', authenticate, checkPermission('cases.update'), async (req, res, next) => {
  try {
    const { tag } = req.body;
    if (!tag) {
      throw new AppError('Tag is required', 400);
    }

    const caseData = await caseService.addTag(req.params.id, tag, req.user.id);
    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/cases/:id/tags/:tag
 * Remove tag from case
 */
router.delete('/:id/tags/:tag', authenticate, checkPermission('cases.update'), async (req, res, next) => {
  try {
    const caseData = await caseService.removeTag(req.params.id, req.params.tag, req.user.id);
    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/tags/suggestions
 * Get suggested tags
 */
router.get('/tags/suggestions', authenticate, async (req, res, next) => {
  try {
    const { case_type_id, case_category_id } = req.query;
    if (!case_type_id) {
      throw new AppError('case_type_id is required', 400);
    }

    const tags = await caseService.getSuggestedTags(case_type_id, case_category_id);
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATISTICS ROUTES
// ============================================================================

/**
 * GET /api/v1/cases/statistics/dashboard
 * Get comprehensive dashboard statistics
 */
router.get('/statistics/dashboard', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getDashboardStatistics(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/by-type
 * Get cases by type
 */
router.get('/statistics/by-type', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getCasesByType(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/by-category
 * Get cases by category
 */
router.get('/statistics/by-category', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getCasesByCategory(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/by-project
 * Get cases by project
 */
router.get('/statistics/by-project', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const { project_id } = req.query;
    const stats = await caseStatisticsService.getCasesByProject(project_id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/by-location
 * Get cases by location
 */
router.get('/statistics/by-location', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getCasesByLocation(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/referrals
 * Get referral analysis
 */
router.get('/statistics/referrals', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const analysis = await caseStatisticsService.getReferralAnalysis(req.query);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/disability
 * Get disability breakdown
 */
router.get('/statistics/disability', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getDisabilityBreakdown(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/demographics
 * Get age/gender breakdown
 */
router.get('/statistics/demographics', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const stats = await caseStatisticsService.getAgeGenderBreakdown(req.query);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/cases/statistics/trends
 * Get trend analysis
 */
router.get('/statistics/trends', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const { start_date, end_date, interval = 'month' } = req.query;
    if (!start_date || !end_date) {
      throw new AppError('start_date and end_date are required', 400);
    }

    const trends = await caseStatisticsService.getTrendAnalysis(start_date, end_date, interval);
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GENERIC CRUD ROUTES (Must be LAST to not catch specific routes)
// ============================================================================

/**
 * GET /api/v1/cases/:id
 * Get single case (NO NAME)
 */
router.get('/:id', authenticate, checkPermission('cases.read'), async (req, res, next) => {
  try {
    const caseData = await caseService.getCaseById(req.params.id);
    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/cases/:id
 * Update case (NO NAME)
 */
router.put('/:id', authenticate, checkPermission('cases.update'), async (req, res, next) => {
  try {
    const { error, value } = updateCaseSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Resolve district/settlement → location string
    if (value.district_id) {
      try {
        const distRow = await databaseService.queryOne(
          'SELECT config_value FROM system_configurations WHERE id = $1',
          [value.district_id]
        );
        let locationStr = distRow?.config_value || '';
        if (value.settlement_id) {
          const settRow = await databaseService.queryOne(
            'SELECT config_value FROM system_configurations WHERE id = $1',
            [value.settlement_id]
          );
          if (settRow?.config_value) locationStr += ' / ' + settRow.config_value;
        }
        value.location = locationStr;
      } catch { /* location stays as provided */ }
    }

    const caseData = await caseService.updateCase(req.params.id, value, req.user.id);
    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/cases/:id
 * Delete case
 */
router.delete('/:id', authenticate, checkPermission('cases.delete'), async (req, res, next) => {
  try {
    await caseService.deleteCase(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
