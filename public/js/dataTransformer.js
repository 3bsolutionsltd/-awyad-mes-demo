/**
 * Data Transformer Module
 * 
 * Maps database schema (snake_case) to frontend format (camelCase).
 * Handles data type conversions, calculated fields, and disaggregation extraction.
 * All transformers return null-safe objects with defaults for missing values.
 * 
 * @module dataTransformer
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { safeJSONParse, extractDisaggregation, calculateDisaggregationTotals } from './utils.js';

/**
 * Transform activity data from database format to frontend format
 * Extracts beneficiary disaggregation, calculates totals, and formats dates
 * 
 * @param {Object|null} activity - Raw activity object from database
 * @returns {Object|null} Transformed activity object or null if input is null
 * 
 * @example
 * const activity = transformActivity(dbActivity);
 * console.log(activity.totalBeneficiaries, activity.burnRate);
 */
export function transformActivity(activity) {
    if (!activity) return null;

    // Extract disaggregation with fallback to database columns
    const disagg = extractDisaggregation(activity);
    const totals = calculateDisaggregationTotals(disagg);

    return {
        id: activity.id,
        projectId: activity.project_id,
        indicatorId: activity.indicator_id,
        thematicAreaId: activity.thematic_area_id,
        thematicArea: activity.thematic_area_name,
        activityCode: activity.activity_code || 'N/A',
        title: activity.title || activity.activity_name,
        description: activity.description,
        location: activity.location,
        date: activity.date || activity.planned_date,
        status: activity.status,
        approvalStatus: activity.approval_status,
        budget: Number(activity.budget) || 0,
        expenditure: Number(activity.actual_cost || activity.expenditure) || 0,
        burnRate: activity.budget > 0 ? ((activity.actual_cost || activity.expenditure || 0) / activity.budget) * 100 : 0,
        
        // Disaggregation
        disaggregation: disagg,
        
        // Calculated totals
        refugeeMaleTotal: totals.refugeeMale,
        refugeeFemaleTotal: totals.refugeeFemale,
        refugeeTotal: totals.refugeeTotal,
        hostMaleTotal: totals.hostMale,
        hostFemaleTotal: totals.hostFemale,
        hostTotal: totals.hostTotal,
        totalBeneficiaries: totals.grandTotal,
        
        // Nationality
        nationalitySudanese: disagg.nationality.sudanese,
        nationalityCongolese: disagg.nationality.congolese,
        nationalitySouthSudanese: disagg.nationality.southSudanese,
        nationalityOthers: disagg.nationality.others,
        
        // Metadata
        createdAt: activity.created_at,
        updatedAt: activity.updated_at,
        createdBy: activity.created_by
    };
}

/**
 * Transform project data from database format to frontend format
 * Calculates burn rate and normalizes field names
 * 
 * @param {Object|null} project - Raw project object from database
 * @returns {Object|null} Transformed project object with camelCase fields or null
 * 
 * @example
 * const project = transformProject(dbProject);
 * console.log(project.name, project.burnRate);
 */
export function transformProject(project) {
    if (!project) return null;

    return {
        id: project.id,
        name: project.name || project.project_name,
        code: project.code || project.project_code,
        donor: project.donor,
        thematicAreaId: project.thematic_area_id,
        thematicArea: project.thematic_area_name,
        startDate: project.start_date,
        endDate: project.end_date,
        budget: Number(project.budget) || 0,
        expenditure: Number(project.expenditure) || 0,
        burnRate: project.budget > 0 ? (project.expenditure / project.budget) * 100 : 0,
        status: project.status,
        location: project.location,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at
    };
}

/**
 * Transform indicator data from database format to frontend format
 * Calculates percent achieved and variance from targets
 * 
 * @param {Object|null} indicator - Raw indicator object from database
 * @returns {Object|null} Transformed indicator with calculated achievement metrics or null
 * 
 * @example
 * const indicator = transformIndicator(dbIndicator);
 * console.log(indicator.percentAchieved, indicator.variance);
 */
export function transformIndicator(indicator) {
    if (!indicator) return null;

    const achieved = Number(indicator.achieved) || 0;
    const target = Number(indicator.target) || 0;
    const annualTarget = Number(indicator.annual_target) || target;  // Use target if annual_target doesn't exist
    const lopTarget = Number(indicator.lop_target) || target;  // Use target if lop_target doesn't exist
    const percentAchieved = annualTarget > 0 ? (achieved / annualTarget) * 100 : 0;
    const variance = achieved - annualTarget;  // Positive variance means over-achievement

    return {
        id: indicator.id,
        projectId: indicator.project_id,
        projectName: indicator.project_name,
        indicatorScope: indicator.indicator_scope,
        thematicAreaId: indicator.thematic_area_id,
        thematicArea: indicator.thematic_area_name,
        code: indicator.indicator_code || indicator.code,
        name: indicator.indicator_name || indicator.name,
        type: indicator.indicator_type || indicator.type,
        baseline: Number(indicator.baseline) || 0,
        baselineDate: indicator.baseline_date,
        lopTarget: lopTarget,
        targetLOP: lopTarget,  // Add alias for table display
        annualTarget: annualTarget,
        targetAnnual: annualTarget,  // Add alias for table display
        q1Target: Number(indicator.q1_target) || 0,
        targetQ1: Number(indicator.q1_target) || 0,
        q2Target: Number(indicator.q2_target) || 0,
        targetQ2: Number(indicator.q2_target) || 0,
        q3Target: Number(indicator.q3_target) || 0,
        targetQ3: Number(indicator.q3_target) || 0,
        q4Target: Number(indicator.q4_target) || 0,
        targetQ4: Number(indicator.q4_target) || 0,
        achieved: achieved,
        percentAchieved: percentAchieved,
        variance: variance,
        unit: indicator.unit_of_measurement || indicator.unit,
        createdAt: indicator.created_at,
        updatedAt: indicator.updated_at
    };
}

/**
 * Transform case data from database format to frontend format
 * Parses services JSON, calculates days open and follow-up status
 * 
 * @param {Object|null} caseData - Raw case object from database
 * @returns {Object|null} Transformed case with calculated duration fields or null
 * 
 * @example
 * const caseItem = transformCase(dbCase);
 * console.log(caseItem.daysOpen, caseItem.followUpSoon);
 */
export function transformCase(caseData) {
    if (!caseData) return null;

    const services = safeJSONParse(caseData.services, []);
    if (!Array.isArray(services)) {
        services = [];
    }

    return {
        id: caseData.id,
        caseNumber: caseData.case_number || caseData.case_id,
        caseType: caseData.case_type || 'N/A',
        projectId: caseData.project_id,
        dateReported: caseData.date_reported,
        dateClosed: caseData.closure_date || caseData.date_closed,
        followUpDate: caseData.follow_up_date,
        status: caseData.status,
        location: caseData.location,
        severity: caseData.severity || 'Medium',
        
        // Beneficiary info
        beneficiaryName: caseData.beneficiary_name,
        beneficiaryAge: caseData.beneficiary_age || caseData.age_group,
        beneficiaryGender: caseData.beneficiary_gender || caseData.gender,
        beneficiaryNationality: caseData.beneficiary_nationality,
        
        // Services
        services: services.length > 0 ? services : [caseData.service_provided].filter(Boolean),
        servicesProvided: caseData.service_provided || services.join(', ') || 'N/A',
        
        // Case worker
        caseWorker: caseData.case_worker || caseData.assigned_to,
        
        // Calculated fields
        daysOpen: caseData.date_reported ? 
            Math.floor((new Date() - new Date(caseData.date_reported)) / (1000 * 60 * 60 * 24)) : 0,
        duration: caseData.date_closed && caseData.date_reported ?
            Math.floor((new Date(caseData.date_closed) - new Date(caseData.date_reported)) / (1000 * 60 * 60 * 24)) : 0,
        followUpSoon: caseData.follow_up_date ?
            (new Date(caseData.follow_up_date) - new Date() < 7 * 24 * 60 * 60 * 1000) : false,
        
        // Metadata
        createdAt: caseData.created_at,
        updatedAt: caseData.updated_at
    };
}

/**
 * Transform thematic area data from database format to frontend format
 * Simple mapping with no calculations
 * 
 * @param {Object|null} area - Raw thematic area object from database
 * @returns {Object|null} Transformed thematic area or null
 * 
 * @example
 * const area = transformThematicArea(dbArea);
 */
export function transformThematicArea(area) {
    if (!area) return null;

    return {
        id: area.id,
        code: area.code,
        name: area.name,
        description: area.description,
        createdAt: area.created_at,
        updatedAt: area.updated_at
    };
}

/**
 * Batch transform array of activities
 * Filters out null results from failed transformations
 * 
 * @param {Array<Object>} activities - Array of raw activity objects
 * @returns {Array<Object>} Array of transformed activities (nulls removed)
 * 
 * @example
 * const activities = transformActivities(dbActivities);
 */
export function transformActivities(activities) {
    if (!Array.isArray(activities)) return [];
    return activities.map(transformActivity).filter(Boolean);
}

/**
 * Batch transform array of projects
 * 
 * @param {Array<Object>} projects - Array of raw project objects
 * @returns {Array<Object>} Array of transformed projects (nulls removed)
 * 
 * @example
 * const projects = transformProjects(dbProjects);
 */
export function transformProjects(projects) {
    if (!Array.isArray(projects)) return [];
    return projects.map(transformProject).filter(Boolean);
}

/**
 * Batch transform array of indicators
 * 
 * @param {Array<Object>} indicators - Array of raw indicator objects
 * @returns {Array<Object>} Array of transformed indicators (nulls removed)
 * 
 * @example
 * const indicators = transformIndicators(dbIndicators);
 */
export function transformIndicators(indicators) {
    if (!Array.isArray(indicators)) return [];
    return indicators.map(transformIndicator).filter(Boolean);
}

/**
 * Batch transform array of cases
 * 
 * @param {Array<Object>} cases - Array of raw case objects
 * @returns {Array<Object>} Array of transformed cases (nulls removed)
 * 
 * @example
 * const cases = transformCases(dbCases);
 */
export function transformCases(cases) {
    if (!Array.isArray(cases)) return [];
    return cases.map(transformCase).filter(Boolean);
}
