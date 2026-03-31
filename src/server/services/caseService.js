/**
 * Enhanced Case Service
 * 
 * Manages cases with NO NAMES for confidentiality
 * Features: case types/categories, referral tracking, dynamic tagging
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';

class CaseService {
  /**
   * Generate unique case number (CASE-2026-001)
   */
  async generateCaseNumber() {
    const year = new Date().getFullYear();
    const prefix = `CASE-${year}-`;

    // Get the highest case number for this year
    const query = `
      SELECT case_number 
      FROM cases 
      WHERE case_number LIKE $1
      ORDER BY case_number DESC
      LIMIT 1
    `;
    const result = await databaseService.queryOne(query, [`${prefix}%`]);

    if (!result) {
      return `${prefix}001`;
    }

    // Extract the number and increment
    const lastNumber = parseInt(result.case_number.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  }

  /**
   * Validate case data - ensure NO name fields and proper relationships
   */
  async validateCase(data) {
    const errors = [];

    // CRITICAL: Check for name fields (confidentiality)
    if (data.beneficiary_name || data.client_name || data.name) {
      errors.push('Name fields not allowed for confidentiality');
    }

    // Validate required fields
    if (!data.case_type_id) {
      errors.push('Case type is required');
    }

    // Validate type/category relationship
    if (data.case_type_id && data.case_category_id) {
      const category = await databaseService.queryOne(
        'SELECT id FROM case_categories WHERE id = $1 AND case_type_id = $2',
        [data.case_category_id, data.case_type_id]
      );
      if (!category) {
        errors.push('Category does not belong to selected case type');
      }
    }

    // Validate support_offered (required, min 50 chars)
    if (!data.support_offered || data.support_offered.length < 50) {
      errors.push('Support offered is required and must be at least 50 characters');
    }

    if (errors.length > 0) {
      throw new AppError(errors.join('; '), 400);
    }

    return true;
  }

  /**
   * Create new case (NO NAME)
   */
  async createCase(data, userId) {
    // Validate data
    await this.validateCase(data);

    // Generate case number if not provided
    if (!data.case_number) {
      data.case_number = await this.generateCaseNumber();
    }

    const query = `
      INSERT INTO cases (
        case_number, project_id, case_type_id, case_category_id,
        date_reported, status, location, district_id, settlement_id,
        age_group, gender,
        nationality, disability_status, has_disability,
        case_source, referred_from, referred_to, referral_date,
        support_offered, tracking_tags, case_worker,
        follow_up_date, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `;

    const result = await databaseService.queryOne(query, [
      data.case_number,
      data.project_id || null,
      data.case_type_id,
      data.case_category_id || null,
      data.date_reported || new Date(),
      data.status || 'Open',
      data.location || null,
      data.district_id || null,
      data.settlement_id || null,
      data.age_group || null,
      data.gender,
      data.nationality || null,
      data.disability_status || null,
      data.has_disability || false,
      data.case_source || null,
      data.referred_from || null,
      data.referred_to || null,
      data.referral_date || null,
      data.support_offered,
      JSON.stringify(data.tracking_tags || []),
      data.case_worker || null,
      data.follow_up_date || null,
      data.notes || null,
      userId
    ]);

    return result;
  }

  /**
   * Update existing case (NO NAME)
   */
  async updateCase(id, data, userId) {
    // Validate data if type/category changed
    if (data.case_type_id || data.case_category_id) {
      const currentCase = await this.getCaseById(id);
      const validateData = {
        ...currentCase,
        ...data
      };
      await this.validateCase(validateData);
    }

    const query = `
      UPDATE cases
      SET
        project_id = COALESCE($1, project_id),
        case_type_id = COALESCE($2, case_type_id),
        case_category_id = COALESCE($3, case_category_id),
        status = COALESCE($4, status),
        location = COALESCE($5, location),
        age_group = COALESCE($6, age_group),
        gender = COALESCE($7, gender),
        nationality = COALESCE($8, nationality),
        disability_status = COALESCE($9, disability_status),
        has_disability = COALESCE($10, has_disability),
        case_source = COALESCE($11, case_source),
        referred_from = COALESCE($12, referred_from),
        referred_to = COALESCE($13, referred_to),
        referral_date = COALESCE($14, referral_date),
        support_offered = COALESCE($15, support_offered),
        tracking_tags = COALESCE($16, tracking_tags),
        case_worker = COALESCE($17, case_worker),
        follow_up_date = COALESCE($18, follow_up_date),
        closure_date = COALESCE($19, closure_date),
        notes = COALESCE($20, notes),
        district_id = COALESCE($21, district_id),
        settlement_id = COALESCE($22, settlement_id),
        updated_by = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *
    `;

    return await databaseService.queryOne(query, [
      data.project_id,
      data.case_type_id,
      data.case_category_id,
      data.status,
      data.location,
      data.age_group,
      data.gender,
      data.nationality,
      data.disability_status,
      data.has_disability,
      data.case_source,
      data.referred_from,
      data.referred_to,
      data.referral_date,
      data.support_offered,
      data.tracking_tags ? JSON.stringify(data.tracking_tags) : null,
      data.case_worker,
      data.follow_up_date,
      data.closure_date,
      data.notes,
      data.district_id || null,
      data.settlement_id || null,
      userId,
      id
    ]);
  }

  /**
   * Get case by ID (NO NAME in response)
   */
  async getCaseById(id) {
    const query = `
      SELECT 
        c.*,
        ct.name as case_type_name,
        ct.code as case_type_code,
        cc.name as case_category_name,
        cc.code as case_category_code,
        p.name as project_name,
        u1.username as created_by_username,
        u2.username as updated_by_username
      FROM cases c
      LEFT JOIN case_types ct ON c.case_type_id = ct.id
      LEFT JOIN case_categories cc ON c.case_category_id = cc.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.updated_by = u2.id
      WHERE c.id = $1
    `;
    const caseData = await databaseService.queryOne(query, [id]);
    if (!caseData) {
      throw new AppError('Case not found', 404);
    }
    return caseData;
  }

  /**
   * Get cases with advanced filtering (NO NAMES)
   */
  async getCases(filters = {}) {
    const {
      page = 1,
      limit = 50,
      status,
      case_type_id,
      case_category_id,
      project_id,
      location,
      age_group,
      gender,
      has_disability,
      referred_from,
      referred_to,
      date_from,
      date_to,
      tags,
      search
    } = filters;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    if (case_type_id) {
      conditions.push(`c.case_type_id = $${paramIndex++}`);
      params.push(case_type_id);
    }

    if (case_category_id) {
      conditions.push(`c.case_category_id = $${paramIndex++}`);
      params.push(case_category_id);
    }

    if (project_id) {
      conditions.push(`c.project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (location) {
      conditions.push(`c.location ILIKE $${paramIndex++}`);
      params.push(`%${location}%`);
    }

    if (age_group) {
      conditions.push(`c.age_group = $${paramIndex++}`);
      params.push(age_group);
    }

    if (gender) {
      conditions.push(`c.gender = $${paramIndex++}`);
      params.push(gender);
    }

    if (has_disability !== undefined) {
      conditions.push(`c.has_disability = $${paramIndex++}`);
      params.push(has_disability);
    }

    if (referred_from) {
      conditions.push(`c.referred_from ILIKE $${paramIndex++}`);
      params.push(`%${referred_from}%`);
    }

    if (referred_to) {
      conditions.push(`c.referred_to ILIKE $${paramIndex++}`);
      params.push(`%${referred_to}%`);
    }

    if (date_from) {
      conditions.push(`c.date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`c.date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    if (tags && tags.length > 0) {
      conditions.push(`c.tracking_tags ?| $${paramIndex++}`);
      params.push(tags);
    }

    if (search) {
      conditions.push(`(c.case_number ILIKE $${paramIndex} OR c.support_offered ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM cases c ${whereClause}`;
    const { total } = await databaseService.queryOne(countQuery, params);

    // Get paginated results
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const query = `
      SELECT 
        c.id, c.case_number, c.status, c.date_reported, c.location,
        c.age_group, c.gender, c.has_disability, c.referred_from, c.referred_to,
        ct.name as case_type_name, ct.code as case_type_code,
        cc.name as case_category_name, cc.code as case_category_code,
        p.name as project_name, c.case_worker, c.follow_up_date,
        c.created_at, c.updated_at
      FROM cases c
      LEFT JOIN case_types ct ON c.case_type_id = ct.id
      LEFT JOIN case_categories cc ON c.case_category_id = cc.id
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
      ORDER BY c.date_reported DESC, c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const cases = await databaseService.query(query, params);

    return {
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Track referral
   */
  async trackReferral(caseId, referredFrom, referredTo, referralDate, userId) {
    const query = `
      UPDATE cases
      SET
        referred_from = $1,
        referred_to = $2,
        referral_date = $3,
        updated_by = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    return await databaseService.queryOne(query, [
      referredFrom, referredTo, referralDate || new Date(), userId, caseId
    ]);
  }

  /**
   * Add tag to case
   */
  async addTag(caseId, tag, userId) {
    const caseData = await this.getCaseById(caseId);
    const tags = caseData.tracking_tags || [];
    
    if (!tags.includes(tag)) {
      tags.push(tag);
      const query = `
        UPDATE cases
        SET tracking_tags = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      return await databaseService.queryOne(query, [JSON.stringify(tags), userId, caseId]);
    }
    
    return caseData;
  }

  /**
   * Remove tag from case
   */
  async removeTag(caseId, tag, userId) {
    const caseData = await this.getCaseById(caseId);
    const tags = caseData.tracking_tags || [];
    
    const newTags = tags.filter(t => t !== tag);
    const query = `
      UPDATE cases
      SET tracking_tags = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    return await databaseService.queryOne(query, [JSON.stringify(newTags), userId, caseId]);
  }

  /**
   * Get suggested tags based on case type and category
   */
  async getSuggestedTags(typeId, categoryId) {
    // Get tags from similar cases
    const query = `
      SELECT DISTINCT jsonb_array_elements_text(tracking_tags) as tag
      FROM cases
      WHERE case_type_id = $1 
        AND ($2::uuid IS NULL OR case_category_id = $2)
        AND tracking_tags IS NOT NULL
      GROUP BY tag
      ORDER BY COUNT(*) DESC
      LIMIT 20
    `;
    const results = await databaseService.query(query, [typeId, categoryId || null]);
    return results.map(r => r.tag);
  }

  /**
   * Delete case
   */
  async deleteCase(id, userId) {
    const query = `DELETE FROM cases WHERE id = $1 RETURNING *`;
    const result = await databaseService.queryOne(query, [id]);
    if (!result) {
      throw new AppError('Case not found', 404);
    }
    return result;
  }
}

export default new CaseService();
