/**
 * Dashboard Service - API Integration Layer
 * Handles all data fetching for Strategic and Project Dashboards
 * 
 * @module services/dashboardService
 * @author AWYAD MES Team - Stream 6
 * @since 2.0.0
 */

import { authManager } from '../../auth.js';

const API_BASE = '/api/v1';

class DashboardService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Fetch with caching support
     * @private
     */
    async _fetchWithCache(url, cacheKey, skipCache = false) {
        // Check cache first
        if (!skipCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // Fetch fresh data
        const response = await authManager.authenticatedFetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Cache the result
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    /**
     * Clear cache for specific key or all
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // ==================== STRATEGIC DASHBOARD ====================

    /**
     * Get complete strategic hierarchy
     * Strategies → Pillars → Components with interventions/approaches
     */
    async getStrategicHierarchy(skipCache = false) {
        return await this._fetchWithCache(
            `${API_BASE}/dashboard/strategic-hierarchy`,
            'strategic-hierarchy',
            skipCache
        );
    }

    /**
     * Get AWYAD-level indicators (aggregated across projects)
     */
    async getAWYADIndicators(skipCache = false) {
        return await this._fetchWithCache(
            `${API_BASE}/dashboard/awyad-indicators`,
            'awyad-indicators',
            skipCache
        );
    }

    /**
     * Get overall organizational summary statistics
     */
    async getOverallSummary(skipCache = false) {
        return await this._fetchWithCache(
            `${API_BASE}/dashboard/stats`,
            'overall-stats',
            skipCache
        );
    }

    /**
     * Get projects grouped by component
     */
    async getProjectsByComponent(componentId) {
        return await this._fetchWithCache(
            `${API_BASE}/components/${componentId}/projects`,
            `component-${componentId}-projects`
        );
    }

    // ==================== PROJECT DASHBOARD ====================

    /**
     * Get all projects for selector dropdown
     */
    async getAllProjects(skipCache = false) {
        const response = await this._fetchWithCache(
            `${API_BASE}/projects?limit=1000`,
            'all-projects',
            skipCache
        );
        
        // Unwrap pagination wrapper: response.data.projects or response.data (for backwards compatibility)
        if (response && response.data) {
            return {
                success: response.success,
                data: response.data.projects || response.data
            };
        }
        
        return response;
    }

    /**
     * Get complete project details
     */
    async getProjectDetails(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}`,
            `project-${projectId}-details`
        );
    }

    /**
     * Get project financial performance
     * Includes: budget, transfers, expenditure, burn rate
     */
    async getProjectFinancials(projectId, skipCache = false) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/financials`,
            `project-${projectId}-financials`,
            skipCache
        );
    }

    /**
     * Get project-specific indicators (not AWYAD)
     * Includes: targets, achieved, quarterly breakdown
     */
    async getProjectIndicators(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/indicators`,
            `project-${projectId}-indicators`
        );
    }

    /**
     * Get project activities with filters
     * @param {Object} filters - { status, thematicArea, location, startDate, endDate }
     */
    async getProjectActivities(projectId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_BASE}/projects/${projectId}/activities${queryParams ? '?' + queryParams : ''}`;
        
        // Don't cache filtered results
        if (Object.keys(filters).length > 0) {
            const response = await authManager.authenticatedFetch(url);
            return await response.json();
        }
        
        return await this._fetchWithCache(
            url,
            `project-${projectId}-activities`
        );
    }

    /**
     * Get cases linked to project (last 10 + statistics)
     * NO NAMES included for privacy
     */
    async getProjectCases(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/cases`,
            `project-${projectId}-cases`
        );
    }

    /**
     * Get project team members
     */
    async getProjectTeam(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/team`,
            `project-${projectId}-team`
        );
    }

    /**
     * Get monthly performance metrics
     * Includes: programmatic, activity, reach, burn rates
     * With 6-month trend data
     */
    async getProjectPerformance(projectId, months = 6) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/performance?months=${months}`,
            `project-${projectId}-performance-${months}m`
        );
    }

    /**
     * Get activity timeline data (Gantt chart)
     */
    async getActivityTimeline(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/activity-timeline`,
            `project-${projectId}-timeline`
        );
    }

    /**
     * Get beneficiary summary with disaggregation
     */
    async getBeneficiarySummary(projectId) {
        return await this._fetchWithCache(
            `${API_BASE}/projects/${projectId}/beneficiaries`,
            `project-${projectId}-beneficiaries`
        );
    }

    // ==================== SEARCH & FILTER ====================

    /**
     * Search projects by name/code
     */
    async searchProjects(query) {
        const response = await authManager.authenticatedFetch(
            `${API_BASE}/projects/search?q=${encodeURIComponent(query)}`
        );
        return await response.json();
    }

    /**
     * Get projects filtered by criteria
     */
    async filterProjects(filters) {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await authManager.authenticatedFetch(
            `${API_BASE}/projects?${queryParams}`
        );
        return await response.json();
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Preload data for faster dashboard loading
     */
    async preloadDashboardData() {
        try {
            await Promise.all([
                this.getStrategicHierarchy(),
                this.getAllProjects(),
                this.getOverallSummary()
            ]);
            console.log('Dashboard data preloaded successfully');
        } catch (error) {
            console.error('Error preloading dashboard data:', error);
        }
    }

    /**
     * Refresh all data (clear cache and reload)
     */
    async refreshAll() {
        this.clearCache();
        return await this.preloadDashboardData();
    }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Export class for testing
export { DashboardService };
