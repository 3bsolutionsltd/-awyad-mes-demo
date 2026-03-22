/**
 * Indicator Mapping Service - Links project indicators to AWYAD indicators
 * 
 * Handles:
 * - Creating mappings between project and AWYAD indicators
 * - Managing contribution weights
 * - Calculating contributions
 * - Validating mapping relationships
 * 
 * @module indicatorMappingService
 */

import databaseService from './databaseService.js';
import AppError from '../utils/AppError.js';
import { updateAWYADIndicatorAggregation } from './indicatorService.js';

/**
 * Create a mapping between a project indicator and an AWYAD indicator
 * @param {Object} mappingData - Mapping data
 * @param {string} mappingData.awyad_indicator_id - AWYAD indicator ID
 * @param {string} mappingData.project_indicator_id - Project indicator ID
 * @param {number} mappingData.contribution_weight - Contribution weight (default 1.0)
 * @returns {Promise<Object>} Created mapping
 */
export async function createMapping(mappingData) {
    try {
        const { awyad_indicator_id, project_indicator_id, contribution_weight = 1.0 } = mappingData;
        
        // Validate AWYAD indicator exists and is of scope 'awyad'
        const awyadIndicator = await databaseService.queryOne(
            'SELECT id, indicator_scope FROM indicators WHERE id = $1',
            [awyad_indicator_id]
        );
        
        if (!awyadIndicator) {
            throw new AppError('AWYAD indicator not found', 404);
        }
        
        if (awyadIndicator.indicator_scope !== 'awyad') {
            throw new AppError('Target indicator must be of scope "awyad"', 400);
        }
        
        // Validate project indicator exists and is of scope 'project'
        const projectIndicator = await databaseService.queryOne(
            'SELECT id, indicator_scope FROM indicators WHERE id = $1',
            [project_indicator_id]
        );
        
        if (!projectIndicator) {
            throw new AppError('Project indicator not found', 404);
        }
        
        if (projectIndicator.indicator_scope !== 'project') {
            throw new AppError('Source indicator must be of scope "project"', 400);
        }
        
        // Check if mapping already exists
        const existingMapping = await databaseService.queryOne(
            'SELECT id FROM indicator_mappings WHERE awyad_indicator_id = $1 AND project_indicator_id = $2',
            [awyad_indicator_id, project_indicator_id]
        );
        
        if (existingMapping) {
            throw new AppError('Mapping already exists between these indicators', 409);
        }
        
        // Create the mapping
        const mapping = await databaseService.queryOne(`
            INSERT INTO indicator_mappings (awyad_indicator_id, project_indicator_id, contribution_weight)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [awyad_indicator_id, project_indicator_id, contribution_weight]);
        
        // Update AWYAD indicator aggregation
        await updateAWYADIndicatorAggregation(awyad_indicator_id);
        
        return mapping;
    } catch (error) {
        console.error('Error creating indicator mapping:', error);
        throw error;
    }
}

/**
 * Delete a mapping
 * @param {string} mappingId - Mapping ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteMapping(mappingId) {
    try {
        // Get the mapping first to know which AWYAD indicator to update
        const mapping = await databaseService.queryOne(
            'SELECT awyad_indicator_id FROM indicator_mappings WHERE id = $1',
            [mappingId]
        );
        
        if (!mapping) {
            throw new AppError('Mapping not found', 404);
        }
        
        // Delete the mapping
        await databaseService.query(
            'DELETE FROM indicator_mappings WHERE id = $1',
            [mappingId]
        );
        
        // Update AWYAD indicator aggregation
        await updateAWYADIndicatorAggregation(mapping.awyad_indicator_id);
        
        return {
            success: true,
            message: 'Mapping deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting indicator mapping:', error);
        throw error;
    }
}

/**
 * Get all mappings for an AWYAD indicator
 * @param {string} awyadIndicatorId - AWYAD indicator ID
 * @returns {Promise<Array>} List of mappings
 */
export async function getMappedIndicators(awyadIndicatorId) {
    try {
        const mappings = await databaseService.query(`
            SELECT 
                im.id as mapping_id,
                im.contribution_weight,
                im.created_at as mapped_at,
                i.id as indicator_id,
                i.name as indicator_name,
                i.achieved,
                i.annual_target,
                i.q1_achieved,
                i.q2_achieved,
                i.q3_achieved,
                i.q4_achieved,
                i.data_type,
                i.unit,
                p.id as project_id,
                p.name as project_name,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage
            FROM indicator_mappings im
            JOIN indicators i ON im.project_indicator_id = i.id
            JOIN projects p ON i.project_id = p.id
            WHERE im.awyad_indicator_id = $1
            ORDER BY p.name, i.name
        `, [awyadIndicatorId]);
        
        return mappings;
    } catch (error) {
        console.error('Error getting mapped indicators:', error);
        throw error;
    }
}

/**
 * Get AWYAD indicator(s) that a project indicator is mapped to
 * @param {string} projectIndicatorId - Project indicator ID
 * @returns {Promise<Array>} List of AWYAD indicators
 */
export async function getAWYADMappings(projectIndicatorId) {
    try {
        const mappings = await databaseService.query(`
            SELECT 
                im.id as mapping_id,
                im.contribution_weight,
                im.created_at as mapped_at,
                i.id as awyad_indicator_id,
                i.name as awyad_indicator_name,
                i.achieved as awyad_achieved,
                i.annual_target as awyad_annual_target,
                ta.name as thematic_area_name,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as awyad_achievement_percentage
            FROM indicator_mappings im
            JOIN indicators i ON im.awyad_indicator_id = i.id
            LEFT JOIN thematic_areas ta ON i.thematic_area_id = ta.id
            WHERE im.project_indicator_id = $1
            ORDER BY i.name
        `, [projectIndicatorId]);
        
        return mappings;
    } catch (error) {
        console.error('Error getting AWYAD mappings:', error);
        throw error;
    }
}

/**
 * Calculate contribution of a project indicator to AWYAD target
 * @param {Object} projectIndicator - Project indicator data
 * @param {number} weight - Contribution weight
 * @returns {Object} Contribution calculation
 */
export function calculateContribution(projectIndicator, weight = 1.0) {
    const achieved = parseFloat(projectIndicator.achieved) || 0;
    const target = parseFloat(projectIndicator.annual_target) || 0;
    const contributionWeight = parseFloat(weight) || 1.0;
    
    const weightedAchieved = achieved * contributionWeight;
    const weightedTarget = target * contributionWeight;
    
    let contributionPercentage = 0;
    if (weightedTarget > 0) {
        contributionPercentage = (weightedAchieved / weightedTarget) * 100;
    }
    
    return {
        original_achieved: achieved,
        original_target: target,
        weight: contributionWeight,
        weighted_achieved: Math.round(weightedAchieved),
        weighted_target: Math.round(weightedTarget),
        contribution_percentage: Math.round(contributionPercentage)
    };
}

/**
 * Update mapping weight
 * @param {string} mappingId - Mapping ID
 * @param {number} newWeight - New contribution weight
 * @returns {Promise<Object>} Updated mapping
 */
export async function updateMappingWeight(mappingId, newWeight) {
    try {
        if (newWeight <= 0) {
            throw new AppError('Weight must be greater than 0', 400);
        }
        
        const mapping = await databaseService.queryOne(`
            UPDATE indicator_mappings
            SET contribution_weight = $1
            WHERE id = $2
            RETURNING *
        `, [newWeight, mappingId]);
        
        if (!mapping) {
            throw new AppError('Mapping not found', 404);
        }
        
        // Update AWYAD indicator aggregation
        await updateAWYADIndicatorAggregation(mapping.awyad_indicator_id);
        
        return mapping;
    } catch (error) {
        console.error('Error updating mapping weight:', error);
        throw error;
    }
}

/**
 * Get all unmapped project indicators (candidates for mapping to an AWYAD indicator)
 * @param {string} awyadIndicatorId - AWYAD indicator ID
 * @param {string} projectId - Optional: filter by project
 * @returns {Promise<Array>} List of unmapped project indicators
 */
export async function getUnmappedProjectIndicators(awyadIndicatorId, projectId = null) {
    try {
        let query = `
            SELECT 
                i.id,
                i.name,
                i.achieved,
                i.annual_target,
                i.data_type,
                i.unit,
                p.id as project_id,
                p.name as project_name,
                CASE 
                    WHEN i.annual_target > 0 THEN (i.achieved / i.annual_target * 100)::NUMERIC(5,2)
                    ELSE 0 
                END as achievement_percentage
            FROM indicators i
            JOIN projects p ON i.project_id = p.id
            WHERE i.indicator_scope = 'project'
            AND i.id NOT IN (
                SELECT project_indicator_id 
                FROM indicator_mappings 
                WHERE awyad_indicator_id = $1
            )
        `;
        
        const params = [awyadIndicatorId];
        
        if (projectId) {
            query += ' AND i.project_id = $2';
            params.push(projectId);
        }
        
        query += ' ORDER BY p.name, i.name';
        
        const indicators = await databaseService.query(query, params);
        return indicators;
    } catch (error) {
        console.error('Error getting unmapped project indicators:', error);
        throw error;
    }
}

export default {
    createMapping,
    deleteMapping,
    getMappedIndicators,
    getAWYADMappings,
    calculateContribution,
    updateMappingWeight,
    getUnmappedProjectIndicators
};
