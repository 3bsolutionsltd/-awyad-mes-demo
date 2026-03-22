import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { IDGenerator } from '../utils/helpers.js';
import db from './databaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data Service - Handles all data operations with in-memory storage
 * In a production environment, this would be replaced with a database
 */
class DataService {
  constructor() {
    this.data = {
      thematicAreas: [],
      projects: [],
      indicators: [],
      activities: [],
      cases: [],
    };
    this.initialized = false;
  }

  /**
   * Initialize data from JSON or CSV files
   */
  async initialize() {
    if (this.initialized) {
      logger.info('Data service already initialized');
      return;
    }

    try {
      logger.info('Initializing data service...');
      
      // Try to load from JSON first (faster)
      await this.loadFromJSON();
      
      // If no JSON data, try CSV files
      if (this.isEmpty()) {
        await this.loadFromCSV();
      }
      
      this.initialized = true;
      logger.info('Data service initialized successfully');
      logger.info(`Loaded: ${Object.entries(this.data).map(([key, val]) => `${key}=${val.length}`).join(', ')}`);
    } catch (error) {
      logger.error('Failed to initialize data service:', error);
      throw error;
    }
  }

  /**
   * Load data from JSON file
   */
  async loadFromJSON() {
    try {
      const jsonPath = path.join(process.cwd(), 'data', 'data.json');
      
      if (!fs.existsSync(jsonPath)) {
        // Try loading from root mockData.js as fallback
        const mockDataPath = path.join(process.cwd(), 'mockData.js');
        if (fs.existsSync(mockDataPath)) {
          logger.info('Loading data from mockData.js...');
          const { mockData } = await import(mockDataPath);
          this.data = { ...mockData };
          return;
        }
        logger.warn('No JSON data file found');
        return;
      }

      const jsonData = fs.readFileSync(jsonPath, 'utf-8');
      this.data = JSON.parse(jsonData);
      logger.info('Data loaded from JSON file');
    } catch (error) {
      logger.error('Error loading JSON data:', error);
    }
  }

  /**
   * Load data from CSV files
   */
  async loadFromCSV() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load CSV files if they exist
      const csvFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
      
      for (const file of csvFiles) {
        const filePath = path.join(dataDir, file);
        await this.parseCSVFile(filePath);
      }
      
      logger.info('CSV data loaded');
    } catch (error) {
      logger.error('Error loading CSV data:', error);
    }
  }

  /**
   * Parse a CSV file
   */
  async parseCSVFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      
      logger.info(`Parsed ${records.length} records from ${path.basename(filePath)}`);
      // Additional parsing logic would go here based on file type
    } catch (error) {
      logger.error(`Error parsing CSV file ${filePath}:`, error);
    }
  }

  /**
   * Check if data is empty
   */
  isEmpty() {
    return Object.values(this.data).every(arr => arr.length === 0);
  }

  /**
   * Save current data to JSON file
   */
  async saveToJSON() {
    try {
      const jsonPath = path.join(process.cwd(), 'data', 'data.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.data, null, 2), 'utf-8');
      logger.info('Data saved to JSON file');
    } catch (error) {
      logger.error('Error saving data to JSON:', error);
      throw error;
    }
  }

  // ============ Thematic Areas ============

  async getAllThematicAreas() {
    try {
      const result = await db.query(
        'SELECT id, code, name, description, is_active, created_at, updated_at FROM thematic_areas WHERE is_active = true ORDER BY name'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching thematic areas from database:', error);
      // Fallback to in-memory data if database fails
      return this.data.thematicAreas;
    }
  }

  async getThematicAreaById(id) {
    try {
      const result = await db.query(
        'SELECT id, code, name, description, is_active, created_at, updated_at FROM thematic_areas WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching thematic area by id:', error);
      return this.data.thematicAreas.find(area => area.id === id);
    }
  }

  async createThematicArea(data) {
    try {
      const { code, name, description, is_active = true, created_by, updated_by } = data;
      const result = await db.query(
        `INSERT INTO thematic_areas (code, name, description, is_active, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, code, name, description, is_active, created_at, updated_at`,
        [code, name, description, is_active, created_by, updated_by]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating thematic area:', error);
      throw error;
    }
  }

  async updateThematicArea(id, data) {
    try {
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (data.code !== undefined) {
        updates.push(`code = $${paramCount++}`);
        values.push(data.code);
      }
      if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
      }
      if (data.updated_by !== undefined) {
        updates.push(`updated_by = $${paramCount++}`);
        values.push(data.updated_by);
      }

      values.push(id);

      const result = await db.query(
        `UPDATE thematic_areas 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, code, name, description, is_active, created_at, updated_at`,
        values
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating thematic area:', error);
      throw error;
    }
  }

  async deleteThematicArea(id) {
    try {
      const result = await db.query(
        'UPDATE thematic_areas SET is_active = false WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deleting thematic area:', error);
      throw error;
    }
  }

  // ============ Projects ============

  getAllProjects(filters = {}) {
    let projects = [...this.data.projects];

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }

    if (filters.thematicAreaId) {
      projects = projects.filter(p => p.thematicAreaId === filters.thematicAreaId);
    }

    return projects;
  }

  getProjectById(id) {
    return this.data.projects.find(project => project.id === id);
  }

  createProject(data) {
    const newProject = {
      id: IDGenerator.generate('PRJ'),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.data.projects.push(newProject);
    this.saveToJSON();
    return newProject;
  }

  updateProject(id, data) {
    const index = this.data.projects.findIndex(project => project.id === id);
    if (index === -1) return null;

    this.data.projects[index] = {
      ...this.data.projects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.saveToJSON();
    return this.data.projects[index];
  }

  deleteProject(id) {
    const index = this.data.projects.findIndex(project => project.id === id);
    if (index === -1) return false;

    this.data.projects.splice(index, 1);
    this.saveToJSON();
    return true;
  }

  // ============ Indicators ============

  getAllIndicators(filters = {}) {
    let indicators = [...this.data.indicators];

    if (filters.thematicAreaId) {
      indicators = indicators.filter(ind => ind.thematicAreaId === filters.thematicAreaId);
    }

    if (filters.type) {
      indicators = indicators.filter(ind => ind.type === filters.type);
    }

    return indicators;
  }

  getIndicatorById(id) {
    return this.data.indicators.find(indicator => indicator.id === id);
  }

  createIndicator(data) {
    const newIndicator = {
      id: IDGenerator.generate('IND'),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.data.indicators.push(newIndicator);
    this.saveToJSON();
    return newIndicator;
  }

  updateIndicator(id, data) {
    const index = this.data.indicators.findIndex(indicator => indicator.id === id);
    if (index === -1) return null;

    this.data.indicators[index] = {
      ...this.data.indicators[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.saveToJSON();
    return this.data.indicators[index];
  }

  deleteIndicator(id) {
    const index = this.data.indicators.findIndex(indicator => indicator.id === id);
    if (index === -1) return false;

    this.data.indicators.splice(index, 1);
    this.saveToJSON();
    return true;
  }

  // ============ Activities ============

  getAllActivities(filters = {}) {
    let activities = [...this.data.activities];

    if (filters.status) {
      activities = activities.filter(a => a.status === filters.status);
    }

    if (filters.projectId) {
      activities = activities.filter(a => a.projectId === filters.projectId);
    }

    if (filters.indicatorId) {
      activities = activities.filter(a => a.indicatorId === filters.indicatorId);
    }

    if (filters.location) {
      activities = activities.filter(a => a.location === filters.location);
    }

    return activities;
  }

  getActivityById(id) {
    return this.data.activities.find(activity => activity.id === id);
  }

  createActivity(data) {
    const newActivity = {
      id: IDGenerator.generate('ACT'),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.data.activities.push(newActivity);
    this.saveToJSON();
    return newActivity;
  }

  updateActivity(id, data) {
    const index = this.data.activities.findIndex(activity => activity.id === id);
    if (index === -1) return null;

    this.data.activities[index] = {
      ...this.data.activities[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.saveToJSON();
    return this.data.activities[index];
  }

  deleteActivity(id) {
    const index = this.data.activities.findIndex(activity => activity.id === id);
    if (index === -1) return false;

    this.data.activities.splice(index, 1);
    this.saveToJSON();
    return true;
  }

  // ============ Cases ============

  getAllCases(filters = {}) {
    let cases = [...this.data.cases];

    if (filters.status) {
      cases = cases.filter(c => c.status === filters.status);
    }

    if (filters.projectId) {
      cases = cases.filter(c => c.projectId === filters.projectId);
    }

    if (filters.severity) {
      cases = cases.filter(c => c.severity === filters.severity);
    }

    return cases;
  }

  getCaseById(id) {
    return this.data.cases.find(c => c.id === id);
  }

  createCase(data) {
    const newCase = {
      id: IDGenerator.generate('CASE'),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.data.cases.push(newCase);
    this.saveToJSON();
    return newCase;
  }

  updateCase(id, data) {
    const index = this.data.cases.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.data.cases[index] = {
      ...this.data.cases[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.saveToJSON();
    return this.data.cases[index];
  }

  deleteCase(id) {
    const index = this.data.cases.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.data.cases.splice(index, 1);
    this.saveToJSON();
    return true;
  }

  // ============ Dashboard Statistics ============

  getDashboardStats() {
    const stats = {
      totalProjects: this.data.projects.length,
      activeProjects: this.data.projects.filter(p => p.status === 'Active').length,
      totalActivities: this.data.activities.length,
      completedActivities: this.data.activities.filter(a => a.status === 'Completed').length,
      totalCases: this.data.cases.length,
      openCases: this.data.cases.filter(c => c.status === 'Open').length,
      totalBeneficiaries: this.calculateTotalBeneficiaries(),
      budgetUtilization: this.calculateBudgetUtilization(),
    };

    return stats;
  }

  calculateTotalBeneficiaries() {
    return this.data.activities.reduce((total, activity) => {
      const direct = activity.beneficiaries?.direct || {};
      const indirect = activity.beneficiaries?.indirect || {};
      
      const directTotal = (direct.male || 0) + (direct.female || 0) + (direct.other || 0);
      const indirectTotal = (indirect.male || 0) + (indirect.female || 0) + (indirect.other || 0);
      
      return total + directTotal + indirectTotal;
    }, 0);
  }

  calculateBudgetUtilization() {
    const totalBudget = this.data.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalExpenditure = this.data.projects.reduce((sum, p) => sum + (p.expenditure || 0), 0);
    
    return totalBudget > 0 ? (totalExpenditure / totalBudget) * 100 : 0;
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
