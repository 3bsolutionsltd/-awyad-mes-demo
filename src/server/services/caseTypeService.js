/**
 * Case Type Service
 * 
 * Manages case types and categories - fully configurable system for case classification
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';

class CaseTypeService {
  /**
   * Get all case types
   */
  async getAllTypes() {
    const query = `
      SELECT 
        id, code, name, description, is_active, display_order,
        created_at, updated_at
      FROM case_types
      ORDER BY display_order, name
    `;
    return await databaseService.queryMany(query);
  }

  /**
   * Get only active case types
   */
  async getActiveTypes() {
    const query = `
      SELECT 
        id, code, name, description, is_active, display_order,
        created_at, updated_at
      FROM case_types
      WHERE is_active = TRUE
      ORDER BY display_order, name
    `;
    return await databaseService.queryMany(query);
  }

  /**
   * Get single case type by ID
   */
  async getTypeById(id) {
    const query = `
      SELECT 
        id, code, name, description, is_active, display_order,
        created_at, updated_at
      FROM case_types
      WHERE id = $1
    `;
    const type = await databaseService.queryOne(query, [id]);
    if (!type) {
      throw new AppError('Case type not found', 404);
    }
    return type;
  }

  /**
   * Create new case type
   */
  async createType(data, userId) {
    const { code, name, description, display_order } = data;

    // Check for duplicate code
    const existingType = await databaseService.queryOne(
      'SELECT id FROM case_types WHERE code = $1',
      [code]
    );
    if (existingType) {
      throw new AppError('Case type code already exists', 400);
    }

    const query = `
      INSERT INTO case_types (code, name, description, display_order, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    return await databaseService.queryOne(query, [
      code, name, description || null, display_order || 999, userId
    ]);
  }

  /**
   * Update case type
   */
  async updateType(id, data, userId) {
    const { code, name, description, is_active, display_order } = data;

    // Check if type exists
    await this.getTypeById(id);

    // If updating code, check for duplicates
    if (code) {
      const existingType = await databaseService.queryOne(
        'SELECT id FROM case_types WHERE code = $1 AND id != $2',
        [code, id]
      );
      if (existingType) {
        throw new AppError('Case type code already exists', 400);
      }
    }

    const query = `
      UPDATE case_types
      SET 
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active),
        display_order = COALESCE($5, display_order),
        updated_by = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    return await databaseService.queryOne(query, [
      code, name, description, is_active, display_order, userId, id
    ]);
  }

  /**
   * Soft delete case type (mark as inactive)
   */
  async deleteType(id, userId) {
    // Check if type exists
    await this.getTypeById(id);

    // Check if type has active cases
    const casesCount = await databaseService.queryOne(
      'SELECT COUNT(*) as count FROM cases WHERE case_type_id = $1',
      [id]
    );
    if (casesCount.count > 0) {
      throw new AppError(
        'Cannot delete case type with existing cases. Mark as inactive instead.',
        400
      );
    }

    const query = `
      UPDATE case_types
      SET 
        is_active = FALSE,
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    return await databaseService.queryOne(query, [userId, id]);
  }

  /**
   * Reorder case types
   */
  async reorderTypes(orderArray, userId) {
    const client = await databaseService.getClient();
    try {
      await client.query('BEGIN');

      for (const item of orderArray) {
        await client.query(
          'UPDATE case_types SET display_order = $1, updated_by = $2 WHERE id = $3',
          [item.order, userId, item.id]
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Case types reordered successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const query = `
      SELECT 
        cc.id, cc.case_type_id, cc.code, cc.name, cc.description,
        cc.is_active, cc.display_order, cc.created_at, cc.updated_at,
        ct.name as case_type_name, ct.code as case_type_code
      FROM case_categories cc
      JOIN case_types ct ON cc.case_type_id = ct.id
      ORDER BY ct.display_order, cc.display_order, cc.name
    `;
    return await databaseService.queryMany(query);
  }

  /**
   * Get categories by case type (cascading)
   */
  async getCategoriesByType(typeId) {
    const query = `
      SELECT 
        id, case_type_id, code, name, description,
        is_active, display_order, created_at, updated_at
      FROM case_categories
      WHERE case_type_id = $1 AND is_active = TRUE
      ORDER BY display_order, name
    `;
    return await databaseService.queryMany(query, [typeId]);
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(id) {
    const query = `
      SELECT 
        cc.id, cc.case_type_id, cc.code, cc.name, cc.description,
        cc.is_active, cc.display_order, cc.created_at, cc.updated_at,
        ct.name as case_type_name, ct.code as case_type_code
      FROM case_categories cc
      JOIN case_types ct ON cc.case_type_id = ct.id
      WHERE cc.id = $1
    `;
    const category = await databaseService.queryOne(query, [id]);
    if (!category) {
      throw new AppError('Case category not found', 404);
    }
    return category;
  }

  /**
   * Create new case category
   */
  async createCategory(data, userId) {
    const { case_type_id, code, name, description, display_order } = data;

    // Verify case type exists
    await this.getTypeById(case_type_id);

    // Check for duplicate code within type
    const existingCategory = await databaseService.queryOne(
      'SELECT id FROM case_categories WHERE case_type_id = $1 AND code = $2',
      [case_type_id, code]
    );
    if (existingCategory) {
      throw new AppError('Category code already exists for this case type', 400);
    }

    const query = `
      INSERT INTO case_categories (case_type_id, code, name, description, display_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    return await databaseService.queryOne(query, [
      case_type_id, code, name, description || null, display_order || 999, userId
    ]);
  }

  /**
   * Update case category
   */
  async updateCategory(id, data, userId) {
    const { code, name, description, is_active, display_order } = data;

    // Check if category exists
    const category = await this.getCategoryById(id);

    // If updating code, check for duplicates within type
    if (code) {
      const existingCategory = await databaseService.queryOne(
        'SELECT id FROM case_categories WHERE case_type_id = $1 AND code = $2 AND id != $3',
        [category.case_type_id, code, id]
      );
      if (existingCategory) {
        throw new AppError('Category code already exists for this case type', 400);
      }
    }

    const query = `
      UPDATE case_categories
      SET 
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active),
        display_order = COALESCE($5, display_order),
        updated_by = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    return await databaseService.queryOne(query, [
      code, name, description, is_active, display_order, userId, id
    ]);
  }

  /**
   * Soft delete category (mark as inactive)
   */
  async deleteCategory(id, userId) {
    // Check if category exists
    await this.getCategoryById(id);

    // Check if category has active cases
    const casesCount = await databaseService.queryOne(
      'SELECT COUNT(*) as count FROM cases WHERE case_category_id = $1',
      [id]
    );
    if (casesCount.count > 0) {
      throw new AppError(
        'Cannot delete category with existing cases. Mark as inactive instead.',
        400
      );
    }

    const query = `
      UPDATE case_categories
      SET 
        is_active = FALSE,
        updated_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    return await databaseService.queryOne(query, [userId, id]);
  }

  /**
   * Reorder categories within a case type
   */
  async reorderCategories(caseTypeId, orderArray, userId) {
    const client = await databaseService.getClient();
    try {
      await client.query('BEGIN');

      for (const item of orderArray) {
        await client.query(
          'UPDATE case_categories SET display_order = $1, updated_by = $2 WHERE id = $3 AND case_type_id = $4',
          [item.order, userId, item.id, caseTypeId]
        );
      }

      await client.query('COMMIT');
      return { success: true, message: 'Categories reordered successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new CaseTypeService();
