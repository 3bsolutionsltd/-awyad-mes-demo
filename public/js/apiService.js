/**
 * API Service Module
 * 
 * Centralized HTTP communication layer for the AWYAD MES application.
 * Handles all API requests with authentication, error handling, and state management integration.
 * Provides CRUD operations for all major entities (projects, indicators, activities, cases).
 * 
 * @module apiService
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { stateManager } from './stateManager.js';
import { getCsrfToken, apiRateLimiter } from './security.js';

/**
 * APIService class - Singleton HTTP client with authentication
 * 
 * All requests automatically include authentication headers via authManager.
 * Failed requests update stateManager with error state for UI display.
 * Includes CSRF protection and rate limiting for security.
 */
class APIService {
    /**
     * Initialize API service with base URL and auth manager
     * 
     * @constructor
     */
    constructor() {
        this.baseURL = '/api/v1';
        this.authManager = window.authManager;
    }

    /**
     * Make an authenticated HTTP request to the API
     * Automatically includes auth headers, CSRF token, and handles errors
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/projects' or '/indicators/1')
     * @param {Object} [options={}] - Fetch API options (method, headers, body, etc.)
     * @returns {Promise<Object>} Parsed JSON response
     * @throws {Error} If request fails or returns non-OK status
     * 
     * @private
     * @example
     * const data = await apiService.request('/projects', { method: 'GET' });
     */
    async request(endpoint, options = {}) {
        // Apply rate limiting
        if (!apiRateLimiter.tryConsume()) {
            const waitTime = apiRateLimiter.getWaitTime();
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime)} seconds.`);
        }
        
        try {
            // Check cache for GET requests
            const cacheKey = `api_${endpoint}_${options.method || 'GET'}`;
            if (!options.method || options.method === 'GET') {
                const cached = stateManager.cacheData(cacheKey);
                if (cached) {
                    console.log(`Using cached data for ${endpoint}`);
                    return cached;
                }
            }
            
            const url = `${this.baseURL}${endpoint}`;
            
            // Add CSRF token for non-GET requests
            if (options.method && options.method !== 'GET') {
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    options.headers = {
                        ...options.headers,
                        'X-CSRF-Token': csrfToken
                    };
                }
            }
            
            const response = await this.authManager.authenticatedFetch(url, options);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            const data = await response.json();
            
            // Cache successful GET responses
            if (!options.method || options.method === 'GET') {
                stateManager.cacheData(cacheKey, data);
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            stateManager.setError(error.message);
            throw error;
        }
    }

    /**
     * Make a GET request
     * 
     * @param {string} endpoint - API endpoint path
     * @returns {Promise<Object>} Response data
     * 
     * @example
     * const data = await apiService.get('/projects');
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * Make a POST request with JSON body
     * 
     * @param {string} endpoint - API endpoint path
     * @param {Object} data - Data to send in request body
     * @returns {Promise<Object>} Response data
     * 
     * @example
     * const project = await apiService.post('/projects', { name: 'New Project', budget: 50000 });
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a PUT request with JSON body
     * 
     * @param {string} endpoint - API endpoint path
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Response data
     * 
     * @example
     * const updated = await apiService.put('/projects/1', { budget: 75000 });
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a DELETE request
     * 
     * @param {string} endpoint - API endpoint path
     * @returns {Promise<Object>} Response data
     * 
     * @example
     * await apiService.delete('/projects/1');
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ============= DASHBOARD API =============
    /**
     * Fetch dashboard summary data
     * Includes counts, totals, and key metrics
     * 
     * @returns {Promise<Object>} Dashboard data with summary statistics
     * 
     * @example
     * const dashboard = await apiService.getDashboard();
     * console.log(dashboard.totalProjects, dashboard.totalBeneficiaries);
     */
    async getDashboard() {
        stateManager.setLoading(true);
        try {
            const response = await this.get('/dashboard');
            return response.data;
        } finally {
            stateManager.setLoading(false);
        }
    }

    // ============= PROJECTS API =============
    /**
     * Fetch all projects and update state
     * Automatically stores projects in stateManager
     * 
     * @returns {Promise<Array<Object>>} Array of project objects
     * 
     * @example
     * const projects = await apiService.getProjects();
     * // stateManager.state.projects is now populated
     */
    async getProjects() {
        stateManager.setLoading(true);
        try {
            const response = await this.get('/projects');
            const projects = response.data?.projects || response.data || [];
            stateManager.setProjects(projects);
            return projects;
        } finally {
            stateManager.setLoading(false);
        }
    }

    /**
     * Fetch a single project by ID
     * 
     * @param {number} id - Project ID
     * @returns {Promise<Object>} Project object
     * 
     * @example
     * const project = await apiService.getProject(1);
     */
    async getProject(id) {
        const response = await this.get(`/projects/${id}`);
        return response.data;
    }

    /**
     * Create a new project
     * 
     * @param {Object} data - Project data (name, budget, startDate, etc.)
     * @returns {Promise<Object>} Created project with ID
     * 
     * @example
     * const project = await apiService.createProject({
     *   name: 'Community Support',
     *   budget: 100000,
     *   startDate: '2026-01-01'
     * });
     */
    async createProject(data) {
        const response = await this.post('/projects', data);
        return response.data;
    }

    /**
     * Update an existing project
     * 
     * @param {number} id - Project ID
     * @param {Object} data - Updated project fields
     * @returns {Promise<Object>} Updated project object
     * 
     * @example
     * const updated = await apiService.updateProject(1, { budget: 150000 });
     */
    async updateProject(id, data) {
        const response = await this.put(`/projects/${id}`, data);
        return response.data;
    }

    /**
     * Delete a project
     * 
     * @param {number} id - Project ID
     * @returns {Promise<Object>} Deletion confirmation
     * 
     * @example
     * await apiService.deleteProject(1);
     */
    async deleteProject(id) {
        const response = await this.delete(`/projects/${id}`);
        return response.data;
    }

    // ============= INDICATORS API =============
    /**
     * Fetch all indicators and update state
     * 
     * @returns {Promise<Array<Object>>} Array of indicator objects
     * 
     * @example
     * const indicators = await apiService.getIndicators();
     */
    async getIndicators() {
        stateManager.setLoading(true);
        try {
            const response = await this.get('/indicators');
            const indicators = response.data?.indicators || response.data || [];
            stateManager.setIndicators(indicators);
            return indicators;
        } finally {
            stateManager.setLoading(false);
        }
    }

    /**
     * Fetch a single indicator by ID
     * 
     * @param {number} id - Indicator ID
     * @returns {Promise<Object>} Indicator object
     */
    async getIndicator(id) {
        const response = await this.get(`/indicators/${id}`);
        return response.data;
    }

    /**
     * Create a new indicator
     * 
     * @param {Object} data - Indicator data (code, name, target, etc.)
     * @returns {Promise<Object>} Created indicator with ID
     * 
     * @example
     * const indicator = await apiService.createIndicator({
     *   code: 'IND-001',
     *   name: 'GBV survivors receiving services',
     *   target: 500
     * });
     */
    async createIndicator(data) {
        const response = await this.post('/indicators', data);
        return response.data;
    }

    /**
     * Update an existing indicator
     * 
     * @param {number} id - Indicator ID
     * @param {Object} data - Updated indicator fields
     * @returns {Promise<Object>} Updated indicator object
     */
    async updateIndicator(id, data) {
        const response = await this.put(`/indicators/${id}`, data);
        return response.data;
    }

    // ============= ACTIVITIES API =============
    /**
     * Fetch all activities and update state
     * 
     * @returns {Promise<Array<Object>>} Array of activity objects
     * 
     * @example
     * const activities = await apiService.getActivities();
     */
    async getActivities() {
        stateManager.setLoading(true);
        try {
            const response = await this.get('/activities');
            const activities = response.data?.activities || response.data || [];
            stateManager.setActivities(activities);
            return activities;
        } finally {
            stateManager.setLoading(false);
        }
    }

    /**
     * Fetch a single activity by ID
     * 
     * @param {number} id - Activity ID
     * @returns {Promise<Object>} Activity object with disaggregation data
     */
    async getActivity(id) {
        const response = await this.get(`/activities/${id}`);
        return response.data;
    }

    /**
     * Create a new activity
     * 
     * @param {Object} data - Activity data (name, date, beneficiaries, etc.)
     * @returns {Promise<Object>} Created activity with ID
     * 
     * @example
     * const activity = await apiService.createActivity({
     *   name: 'Training session',
     *   activityDate: '2026-01-15',
     *   refugee_male_0_4: 10,
     *   refugee_female_0_4: 12
     * });
     */
    async createActivity(data) {
        const response = await this.post('/activities', data);
        return response.data;
    }

    /**
     * Update an existing activity
     * 
     * @param {number} id - Activity ID
     * @param {Object} data - Updated activity fields
     * @returns {Promise<Object>} Updated activity object
     */
    async updateActivity(id, data) {
        const response = await this.put(`/activities/${id}`, data);
        return response.data;
    }

    /**
     * Delete an activity
     * 
     * @param {number} id - Activity ID
     * @returns {Promise<Object>} Deletion confirmation
     */
    async deleteActivity(id) {
        const response = await this.delete(`/activities/${id}`);
        return response.data;
    }

    // ============= CASES API =============
    /**
     * Fetch all cases and update state
     * 
     * @returns {Promise<Array<Object>>} Array of case objects
     * 
     * @example
     * const cases = await apiService.getCases();
     */
    async getCases() {
        stateManager.setLoading(true);
        try {
            const response = await this.get('/cases');
            const cases = response.data?.cases || response.data || [];
            stateManager.setCases(cases);
            return cases;
        } finally {
            stateManager.setLoading(false);
        }
    }

    /**
     * Fetch a single case by ID
     * 
     * @param {number} id - Case ID
     * @returns {Promise<Object>} Case object with follow-up history
     */
    async getCase(id) {
        const response = await this.get(`/cases/${id}`);
        return response.data;
    }

    /**
     * Create a new case
     * 
     * @param {Object} data - Case data (caseNumber, description, status, etc.)
     * @returns {Promise<Object>} Created case with ID
     * 
     * @example
     * const caseItem = await apiService.createCase({
     *   caseNumber: 'CASE-001',
     *   description: 'Follow-up needed',
     *   status: 'active'
     * });
     */
    async createCase(data) {
        const response = await this.post('/cases', data);
        return response.data;
    }

    /**
     * Update an existing case
     * 
     * @param {number} id - Case ID
     * @param {Object} data - Updated case fields
     * @returns {Promise<Object>} Updated case object
     */
    async updateCase(id, data) {
        const response = await this.put(`/cases/${id}`, data);
        return response.data;
    }

    // ============= USERS API =============
    /**
     * Fetch all users
     * 
     * @returns {Promise<Array<Object>>} Array of user objects
     * 
     * @example
     * const users = await apiService.getUsers();
     */
    async getUsers() {
        const response = await this.get('/users');
        return response.data?.users || response.data || [];
    }

    /**
     * Fetch a single user by ID
     * 
     * @param {number} id - User ID
     * @returns {Promise<Object>} User object
     */
    async getUser(id) {
        const response = await this.get(`/users/${id}`);
        return response.data;
    }
}

// Create singleton instance
export const apiService = new APIService();
