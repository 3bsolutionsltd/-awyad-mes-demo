/**
 * Case Statistics Service
 * 
 * Provides comprehensive statistics and analytics for case management
 * NO NAMES in any reports or exports
 */

import databaseService from './databaseService.js';

class CaseStatisticsService {
  /**
   * Get cases by type
   */
  async getCasesByType(filters = {}) {
    const { project_id, date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`c.project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (date_from) {
      conditions.push(`c.date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`c.date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ct.name as case_type,
        ct.code as code,
        COUNT(c.id) as count,
        COUNT(CASE WHEN c.status = 'Open' THEN 1 END) as open_count,
        COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed_count
      FROM case_types ct
      LEFT JOIN cases c ON ct.id = c.case_type_id ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
      GROUP BY ct.id, ct.name, ct.code
      ORDER BY count DESC
    `;

    return await databaseService.query(query, params);
  }

  /**
   * Get cases by category
   */
  async getCasesByCategory(filters = {}) {
    const { case_type_id, project_id, date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (case_type_id) {
      conditions.push(`c.case_type_id = $${paramIndex++}`);
      params.push(case_type_id);
    }

    if (project_id) {
      conditions.push(`c.project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (date_from) {
      conditions.push(`c.date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`c.date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        cc.name as category,
        cc.code as code,
        ct.name as case_type,
        COUNT(c.id) as count
      FROM case_categories cc
      JOIN case_types ct ON cc.case_type_id = ct.id
      LEFT JOIN cases c ON cc.id = c.case_category_id ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
      GROUP BY cc.id, cc.name, cc.code, ct.name
      ORDER BY count DESC
    `;

    return await databaseService.query(query, params);
  }

  /**
   * Get cases by project
   */
  async getCasesByProject(projectId = null) {
    const query = projectId
      ? `
        SELECT 
          p.name as project,
          p.id as project_id,
          COUNT(c.id) as total_cases,
          COUNT(CASE WHEN c.status = 'Open' THEN 1 END) as open_cases,
          COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END) as in_progress_cases,
          COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed_cases
        FROM projects p
        LEFT JOIN cases c ON p.id = c.project_id
        WHERE p.id = $1
        GROUP BY p.id, p.name
      `
      : `
        SELECT 
          p.name as project,
          p.id as project_id,
          COUNT(c.id) as total_cases,
          COUNT(CASE WHEN c.status = 'Open' THEN 1 END) as open_cases,
          COUNT(CASE WHEN c.status = 'In Progress' THEN 1 END) as in_progress_cases,
          COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed_cases
        FROM projects p
        LEFT JOIN cases c ON p.id = c.project_id
        GROUP BY p.id, p.name
        ORDER BY total_cases DESC
      `;

    return projectId
      ? await databaseService.queryOne(query, [projectId])
      : await databaseService.query(query);
  }

  /**
   * Get cases by location
   */
  async getCasesByLocation(filters = {}) {
    const { project_id, date_from, date_to } = filters;
    
    const conditions = ['c.location IS NOT NULL'];
    const params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`c.project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (date_from) {
      conditions.push(`c.date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`c.date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        c.location,
        COUNT(c.id) as count,
        COUNT(CASE WHEN c.status = 'Open' THEN 1 END) as open_count,
        COUNT(CASE WHEN c.status = 'Closed' THEN 1 END) as closed_count
      FROM cases c
      ${whereClause}
      GROUP BY c.location
      ORDER BY count DESC
    `;

    return await databaseService.query(query, params);
  }

  /**
   * Get referral analysis - most common referral partners
   */
  async getReferralAnalysis(filters = {}) {
    const { date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Referrals IN (from partners to AWYAD)
    const referralsInQuery = `
      SELECT 
        referred_from as partner,
        COUNT(*) as count,
        MAX(date_reported) as most_recent
      FROM cases
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} referred_from IS NOT NULL
      GROUP BY referred_from
      ORDER BY count DESC
      LIMIT 20
    `;

    // Referrals OUT (from AWYAD to partners)
    const referralsOutQuery = `
      SELECT 
        referred_to as partner,
        COUNT(*) as count,
        MAX(date_reported) as most_recent
      FROM cases
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} referred_to IS NOT NULL
      GROUP BY referred_to
      ORDER BY count DESC
      LIMIT 20
    `;

    const [referralsIn, referralsOut] = await Promise.all([
      databaseService.query(referralsInQuery, params),
      databaseService.query(referralsOutQuery, params)
    ]);

    return {
      referrals_in: referralsIn,
      referrals_out: referralsOut,
      total_referrals_in: referralsIn.reduce((sum, r) => sum + parseInt(r.count), 0),
      total_referrals_out: referralsOut.reduce((sum, r) => sum + parseInt(r.count), 0)
    };
  }

  /**
   * Get disability breakdown
   */
  async getDisabilityBreakdown(filters = {}) {
    const { project_id, date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (date_from) {
      conditions.push(`date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN has_disability = TRUE THEN 1 END) as with_disability,
        COUNT(CASE WHEN has_disability = FALSE THEN 1 END) as without_disability,
        ROUND(
          100.0 * COUNT(CASE WHEN has_disability = TRUE THEN 1 END) / NULLIF(COUNT(*), 0), 
          2
        ) as disability_percentage
      FROM cases
      ${whereClause}
    `;

    return await databaseService.queryOne(query, params);
  }

  /**
   * Get age/gender breakdown
   */
  async getAgeGenderBreakdown(filters = {}) {
    const { project_id, case_type_id, date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (case_type_id) {
      conditions.push(`case_type_id = $${paramIndex++}`);
      params.push(case_type_id);
    }

    if (date_from) {
      conditions.push(`date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        age_group,
        gender,
        COUNT(*) as count
      FROM cases
      ${whereClause}
      GROUP BY age_group, gender
      ORDER BY age_group, gender
    `;

    return await databaseService.query(query, params);
  }

  /**
   * Get trend analysis over time
   */
  async getTrendAnalysis(startDate, endDate, interval = 'month') {
    const query = `
      SELECT 
        DATE_TRUNC($1, date_reported) as period,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_cases,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_cases
      FROM cases
      WHERE date_reported BETWEEN $2 AND $3
      GROUP BY period
      ORDER BY period
    `;

    return await databaseService.query(query, [interval, startDate, endDate]);
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStatistics(filters = {}) {
    const { project_id, date_from, date_to } = filters;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (project_id) {
      conditions.push(`project_id = $${paramIndex++}`);
      params.push(project_id);
    }

    if (date_from) {
      conditions.push(`date_reported >= $${paramIndex++}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`date_reported <= $${paramIndex++}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_cases,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_cases,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_cases,
        COUNT(CASE WHEN referred_from IS NOT NULL THEN 1 END) as referrals_in,
        COUNT(CASE WHEN referred_to IS NOT NULL THEN 1 END) as referrals_out,
        COUNT(CASE WHEN has_disability = TRUE THEN 1 END) as cases_with_disability,
        COUNT(DISTINCT project_id) as projects_with_cases,
        COUNT(DISTINCT case_type_id) as unique_case_types
      FROM cases
      ${whereClause}
    `;

    return await databaseService.queryOne(query, params);
  }

  /**
   * Export cases for reporting (NO NAMES)
   */
  async exportCases(filters = {}) {
    const { cases } = await databaseService.query(`
      SELECT 
        c.case_number,
        ct.name as case_type,
        cc.name as case_category,
        c.date_reported,
        c.status,
        p.name as project,
        c.location,
        c.age_group,
        c.gender,
        c.nationality,
        c.has_disability,
        c.referred_from,
        c.referred_to,
        c.case_worker
      FROM cases c
      LEFT JOIN case_types ct ON c.case_type_id = ct.id
      LEFT JOIN case_categories cc ON c.case_category_id = cc.id
      LEFT JOIN projects p ON c.project_id = p.id
      ORDER BY c.date_reported DESC
    `);

    return cases;
  }
}

export default new CaseStatisticsService();
