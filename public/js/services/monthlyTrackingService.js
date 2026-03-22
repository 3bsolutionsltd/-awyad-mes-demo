/**
 * Monthly Tracking API Service
 * Handles all API calls for monthly tracking, snapshots, performance rates, and reach vs target
 */

import apiService from './apiService.js';

const BASE_URL = '/api/v1/monthly-tracking';

/**
 * Generate monthly snapshot
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {string} projectId - Optional project ID
 * @returns {Promise<Object>} Generated snapshot data
 */
export async function generateSnapshot(month, year, projectId = null) {
    try {
        const body = { month, year };
        if (projectId) {
            body.project_id = projectId;
        }
        
        const response = await apiService.post(`${BASE_URL}/snapshots/generate`, body);
        return response.data;
    } catch (error) {
        console.error('Error generating snapshot:', error);
        throw error;
    }
}

/**
 * Get snapshot for specific month/year
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Object>} Snapshot data
 */
export async function getSnapshot(month, year, projectId = null) {
    try {
        let url = `${BASE_URL}/snapshots/${month}/${year}`;
        if (projectId) {
            url += `?project_id=${projectId}`;
        }
        
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting snapshot:', error);
        throw error;
    }
}

/**
 * Get snapshots for a project over date range
 * @param {string} projectId - Project ID
 * @param {string} startMonth - Start month (YYYY-MM-DD)
 * @param {string} endMonth - End month (YYYY-MM-DD)
 * @returns {Promise<Array>} Project snapshots
 */
export async function getProjectSnapshots(projectId, startMonth, endMonth) {
    try {
        const url = `${BASE_URL}/snapshots/project/${projectId}?start_month=${startMonth}&end_month=${endMonth}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting project snapshots:', error);
        throw error;
    }
}

/**
 * Get indicator snapshots over time
 * @param {string} indicatorId - Indicator ID
 * @param {string} startMonth - Start month
 * @param {string} endMonth - End month
 * @returns {Promise<Array>} Indicator snapshots
 */
export async function getIndicatorSnapshots(indicatorId, startMonth, endMonth) {
    try {
        const url = `${BASE_URL}/snapshots/indicator/${indicatorId}?start_month=${startMonth}&end_month=${endMonth}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting indicator snapshots:', error);
        throw error;
    }
}

/**
 * Compare two months
 * @param {string} month1 - First month (YYYY-MM-DD)
 * @param {string} month2 - Second month (YYYY-MM-DD)
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Object>} Comparison data
 */
export async function compareMonths(month1, month2, projectId = null) {
    try {
        let url = `${BASE_URL}/snapshots/compare?month1=${month1}&month2=${month2}`;
        if (projectId) {
            url += `&project_id=${projectId}`;
        }
        
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error comparing months:', error);
        throw error;
    }
}

/**
 * Get all performance rates for a project
 * @param {string} projectId - Project ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} All 4 performance rates
 */
export async function getPerformanceRates(projectId, month, year) {
    try {
        const url = `${BASE_URL}/performance-rates/${projectId}?month=${month}&year=${year}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting performance rates:', error);
        throw error;
    }
}

/**
 * Get rate history for a project
 * @param {string} projectId - Project ID
 * @param {string} startMonth - Start month
 * @param {string} endMonth - End month
 * @returns {Promise<Array>} Rate history
 */
export async function getRateHistory(projectId, startMonth, endMonth) {
    try {
        const url = `${BASE_URL}/performance-rates/${projectId}/history?start_month=${startMonth}&end_month=${endMonth}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting rate history:', error);
        throw error;
    }
}

/**
 * Get performance rates for all projects
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Array>} All project rates
 */
export async function getAllProjectRates(month, year) {
    try {
        const url = `${BASE_URL}/performance-rates/all/${month}/${year}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting all project rates:', error);
        throw error;
    }
}

/**
 * Get indicator gap analysis
 * @param {string} indicatorId - Indicator ID
 * @returns {Promise<Object>} Gap data
 */
export async function getIndicatorGap(indicatorId) {
    try {
        const url = `${BASE_URL}/reach-vs-target/indicator/${indicatorId}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting indicator gap:', error);
        throw error;
    }
}

/**
 * Get all indicator gaps for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} All indicator gaps
 */
export async function getProjectIndicatorGaps(projectId) {
    try {
        const url = `${BASE_URL}/reach-vs-target/project/${projectId}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting project indicator gaps:', error);
        throw error;
    }
}

/**
 * Get at-risk indicators
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Array>} At-risk indicators
 */
export async function getAtRiskIndicators(projectId = null) {
    try {
        let url = `${BASE_URL}/reach-vs-target/at-risk`;
        if (projectId) {
            url += `?project_id=${projectId}`;
        }
        
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting at-risk indicators:', error);
        throw error;
    }
}

/**
 * Get on-track indicators
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Array>} On-track indicators
 */
export async function getOnTrackIndicators(projectId = null) {
    try {
        let url = `${BASE_URL}/reach-vs-target/on-track`;
        if (projectId) {
            url += `?project_id=${projectId}`;
        }
        
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting on-track indicators:', error);
        throw error;
    }
}

/**
 * Get target projection for indicator
 * @param {string} indicatorId - Indicator ID
 * @param {string} targetMonth - Target month (YYYY-MM-DD)
 * @returns {Promise<Object>} Projection data
 */
export async function getTargetProjection(indicatorId, targetMonth) {
    try {
        const url = `${BASE_URL}/reach-vs-target/projection/${indicatorId}?target_month=${targetMonth}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting target projection:', error);
        throw error;
    }
}

/**
 * Get recommendations for indicator
 * @param {string} indicatorId - Indicator ID
 * @returns {Promise<Object>} Recommendations
 */
export async function getRecommendations(indicatorId) {
    try {
        const url = `${BASE_URL}/reach-vs-target/recommendations/${indicatorId}`;
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

/**
 * Get summary statistics for reach vs target
 * @param {string} projectId - Optional project filter
 * @returns {Promise<Object>} Summary statistics
 */
export async function getReachVsTargetSummary(projectId = null) {
    try {
        let url = `${BASE_URL}/reach-vs-target/summary`;
        if (projectId) {
            url += `?project_id=${projectId}`;
        }
        
        const response = await apiService.get(url);
        return response.data;
    } catch (error) {
        console.error('Error getting summary statistics:', error);
        throw error;
    }
}

/**
 * Get all projects for filter dropdown
 * @returns {Promise<Array>} Projects
 */
export async function getAllProjects() {
    try {
        const response = await apiService.get('/api/v1/projects');
        return response.data.projects || [];
    } catch (error) {
        console.error('Error getting projects:', error);
        throw error;
    }
}

/**
 * Get activities for a project
 * @param {string} projectId - Project ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Activities
 */
export async function getProjectActivities(projectId, filters = {}) {
    try {
        const params = new URLSearchParams({
            project_id: projectId,
            ...filters
        });
        
        const response = await apiService.get(`/api/v1/activities?${params}`);
        return response.data.activities || [];
    } catch (error) {
        console.error('Error getting project activities:', error);
        throw error;
    }
}

export default {
    generateSnapshot,
    getSnapshot,
    getProjectSnapshots,
    getIndicatorSnapshots,
    compareMonths,
    getPerformanceRates,
    getRateHistory,
    getAllProjectRates,
    getIndicatorGap,
    getProjectIndicatorGaps,
    getAtRiskIndicators,
    getOnTrackIndicators,
    getTargetProjection,
    getRecommendations,
    getReachVsTargetSummary,
    getAllProjects,
    getProjectActivities
};
