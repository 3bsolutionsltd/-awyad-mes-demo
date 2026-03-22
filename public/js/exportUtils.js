/**
 * Export Utilities Module
 * 
 * Provides Excel export functionality for all data tables.
 * Uses SheetJS (xlsx) library for generating Excel files.
 * Supports multiple sheets, custom formatting, and calculated columns.
 * 
 * @module exportUtils
 * @author AWYAD MES Team
 * @since 2.0.0
 */

import { formatDate, formatCurrency, formatNumber } from './utils.js';

/**
 * Load XLSX library dynamically
 * @private
 * @returns {Promise<Object>} XLSX library object
 */
async function loadXLSX() {
    if (window.XLSX) {
        return window.XLSX;
    }
    
    // Load from CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('Failed to load XLSX library'));
        document.head.appendChild(script);
    });
}

/**
 * Export dashboard data to Excel
 * Includes summary metrics and indicators breakdown
 * 
 * @param {Array<Object>} projects - Projects array
 * @param {Array<Object>} indicators - Indicators array
 * @param {Array<Object>} activities - Activities array
 * @param {Array<Object>} cases - Cases array
 * @returns {Promise<void>}
 * 
 * @example
 * await exportDashboard(projects, indicators, activities, cases);
 */
export async function exportDashboard(projects, indicators, activities, cases) {
    const XLSX = await loadXLSX();
    
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
        ['AWYAD MES - Dashboard Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Summary Metrics'],
        ['Active Projects', projects.length],
        ['Total Indicators', indicators.length],
        ['Indicators On-Track', indicators.filter(i => i.percentAchieved >= 70).length],
        ['Total Activities', activities.length],
        ['Total Cases', cases.length],
        [''],
        ['Budget Summary'],
        ['Total Budget', projects.reduce((s, p) => s + (p.budget || 0), 0)],
        ['Total Expenditure', projects.reduce((s, p) => s + (p.expenditure || 0), 0)]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Indicators Sheet
    const indicatorsData = [
        ['Code', 'Name', 'Type', 'Annual Target', 'Achieved', '% Achieved', 'Variance', 'Status']
    ];
    indicators.forEach(ind => {
        indicatorsData.push([
            ind.code || '',
            ind.name || '',
            ind.type || '',
            ind.annualTarget || 0,
            ind.achieved || 0,
            Math.round(ind.percentAchieved || 0) + '%',
            ind.variance || 0,
            ind.percentAchieved >= 70 ? 'On Track' : ind.percentAchieved >= 40 ? 'At Risk' : 'Off Track'
        ]);
    });
    const indicatorsWS = XLSX.utils.aoa_to_sheet(indicatorsData);
    XLSX.utils.book_append_sheet(wb, indicatorsWS, 'Indicators');
    
    // Download
    XLSX.writeFile(wb, `AWYAD_Dashboard_${formatDate(new Date())}.xlsx`);
}

/**
 * Export projects to Excel
 * Includes budget, expenditure, and burn rate analysis
 * 
 * @param {Array<Object>} projects - Projects array
 * @returns {Promise<void>}
 * 
 * @example
 * await exportProjects(projects);
 */
export async function exportProjects(projects) {
    const XLSX = await loadXLSX();
    
    const data = [
        ['Project Code', 'Project Name', 'Donor', 'Thematic Area', 'Start Date', 'End Date', 'Budget', 'Expenditure', 'Burn Rate %', 'Status', 'Location']
    ];
    
    projects.forEach(p => {
        data.push([
            p.code || 'N/A',
            p.name || '',
            p.donor || '',
            p.thematicArea || '',
            formatDate(p.startDate),
            formatDate(p.endDate),
            p.budget || 0,
            p.expenditure || 0,
            Math.round(p.burnRate || 0),
            p.status || '',
            p.location || ''
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    
    XLSX.writeFile(wb, `AWYAD_Projects_${formatDate(new Date())}.xlsx`);
}

/**
 * Export indicators to Excel with quarterly breakdown
 * 
 * @param {Array<Object>} indicators - Indicators array
 * @returns {Promise<void>}
 * 
 * @example
 * await exportIndicators(indicators);
 */
export async function exportIndicators(indicators) {
    const XLSX = await loadXLSX();
    
    const data = [
        ['Code', 'Name', 'Type', 'Thematic Area', 'Baseline', 'LOP Target', 'Annual Target', 'Q1 Target', 'Q2 Target', 'Q3 Target', 'Q4 Target', 'Achieved', '% Achieved', 'Variance', 'Unit']
    ];
    
    indicators.forEach(ind => {
        data.push([
            ind.code || '',
            ind.name || '',
            ind.type || '',
            ind.thematicArea || '',
            ind.baseline || 0,
            ind.lopTarget || 0,
            ind.annualTarget || 0,
            ind.q1Target || 0,
            ind.q2Target || 0,
            ind.q3Target || 0,
            ind.q4Target || 0,
            ind.achieved || 0,
            Math.round(ind.percentAchieved || 0) + '%',
            ind.variance || 0,
            ind.unit || ''
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Indicators');
    
    XLSX.writeFile(wb, `AWYAD_Indicators_${formatDate(new Date())}.xlsx`);
}

/**
 * Export activities with full disaggregation data to Excel
 * Creates multiple sheets for activity details and disaggregation breakdown
 * 
 * @param {Array<Object>} activities - Activities array
 * @returns {Promise<void>}
 * 
 * @example
 * await exportActivities(activities);
 */
export async function exportActivities(activities) {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    
    // Activities Summary Sheet
    const summaryData = [
        ['Activity Code', 'Title', 'Date', 'Location', 'Status', 'Approval Status', 'Total Beneficiaries', 'Refugee Total', 'Host Total', 'Budget', 'Expenditure', 'Burn Rate %']
    ];
    
    activities.forEach(act => {
        summaryData.push([
            act.activityCode || 'N/A',
            act.title || '',
            formatDate(act.date),
            act.location || '',
            act.status || '',
            act.approvalStatus || '',
            act.totalBeneficiaries || 0,
            act.refugeeTotal || 0,
            act.hostTotal || 0,
            act.budget || 0,
            act.expenditure || 0,
            Math.round(act.burnRate || 0)
        ]);
    });
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Activities Summary');
    
    // Disaggregation Sheet
    const disaggData = [
        ['Activity Code', 'Category', 'Gender', 'Age 0-4', 'Age 5-17', 'Age 18-49', 'Age 50+', 'Total']
    ];
    
    activities.forEach(act => {
        if (act.disaggregation) {
            const d = act.disaggregation;
            // Refugee Male
            disaggData.push([
                act.activityCode || 'N/A',
                'Refugee',
                'Male',
                d.refugee?.male?.age0to4 || 0,
                d.refugee?.male?.age5to17 || 0,
                d.refugee?.male?.age18to49 || 0,
                d.refugee?.male?.age50plus || 0,
                act.refugeeMaleTotal || 0
            ]);
            // Refugee Female
            disaggData.push([
                act.activityCode || 'N/A',
                'Refugee',
                'Female',
                d.refugee?.female?.age0to4 || 0,
                d.refugee?.female?.age5to17 || 0,
                d.refugee?.female?.age18to49 || 0,
                d.refugee?.female?.age50plus || 0,
                act.refugeeFemaleTotal || 0
            ]);
            // Host Male
            disaggData.push([
                act.activityCode || 'N/A',
                'Host',
                'Male',
                d.host?.male?.age0to4 || 0,
                d.host?.male?.age5to17 || 0,
                d.host?.male?.age18to49 || 0,
                d.host?.male?.age50plus || 0,
                act.hostMaleTotal || 0
            ]);
            // Host Female
            disaggData.push([
                act.activityCode || 'N/A',
                'Host',
                'Female',
                d.host?.female?.age0to4 || 0,
                d.host?.female?.age5to17 || 0,
                d.host?.female?.age18to49 || 0,
                d.host?.female?.age50plus || 0,
                act.hostFemaleTotal || 0
            ]);
        }
    });
    
    const disaggWS = XLSX.utils.aoa_to_sheet(disaggData);
    XLSX.utils.book_append_sheet(wb, disaggWS, 'Disaggregation');
    
    // Nationality Sheet
    const nationalityData = [
        ['Activity Code', 'Sudanese', 'Congolese', 'South Sudanese', 'Others', 'Total']
    ];
    
    activities.forEach(act => {
        nationalityData.push([
            act.activityCode || 'N/A',
            act.nationalitySudanese || 0,
            act.nationalityCongolese || 0,
            act.nationalitySouthSudanese || 0,
            act.nationalityOthers || 0,
            act.totalBeneficiaries || 0
        ]);
    });
    
    const nationalityWS = XLSX.utils.aoa_to_sheet(nationalityData);
    XLSX.utils.book_append_sheet(wb, nationalityWS, 'Nationality');
    
    XLSX.writeFile(wb, `AWYAD_Activities_${formatDate(new Date())}.xlsx`);
}

/**
 * Export cases to Excel with beneficiary and service details
 * 
 * @param {Array<Object>} cases - Cases array
 * @returns {Promise<void>}
 * 
 * @example
 * await exportCases(cases);
 */
export async function exportCases(cases) {
    const XLSX = await loadXLSX();
    
    const data = [
        ['Case Number', 'Case Type', 'Status', 'Date Reported', 'Date Closed', 'Follow-up Date', 'Days Open', 'Beneficiary Name', 'Age', 'Gender', 'Nationality', 'Location', 'Services Provided', 'Case Worker']
    ];
    
    cases.forEach(c => {
        data.push([
            c.caseNumber || '',
            c.caseType || '',
            c.status || '',
            formatDate(c.dateReported),
            formatDate(c.dateClosed),
            formatDate(c.followUpDate),
            c.daysOpen || 0,
            c.beneficiaryName || '',
            c.beneficiaryAge || '',
            c.beneficiaryGender || '',
            c.beneficiaryNationality || '',
            c.location || '',
            c.servicesProvided || '',
            c.caseWorker || ''
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cases');
    
    XLSX.writeFile(wb, `AWYAD_Cases_${formatDate(new Date())}.xlsx`);
}

/**
 * Export monthly tracking data with quarterly summaries
 * 
 * @param {Array<Object>} activities - Activities array (will be grouped by month)
 * @param {number} year - Year for the report
 * @returns {Promise<void>}
 * 
 * @example
 * await exportMonthlyTracking(activities, 2026);
 */
export async function exportMonthlyTracking(activities, year) {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    
    // Monthly Summary
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyData = [
        ['Month', 'Activities', 'Total Beneficiaries', 'Refugee', 'Host', 'Budget', 'Expenditure']
    ];
    
    for (let month = 0; month < 12; month++) {
        const monthActivities = activities.filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        
        monthlyData.push([
            monthNames[month],
            monthActivities.length,
            monthActivities.reduce((s, a) => s + (a.totalBeneficiaries || 0), 0),
            monthActivities.reduce((s, a) => s + (a.refugeeTotal || 0), 0),
            monthActivities.reduce((s, a) => s + (a.hostTotal || 0), 0),
            monthActivities.reduce((s, a) => s + (a.budget || 0), 0),
            monthActivities.reduce((s, a) => s + (a.expenditure || 0), 0)
        ]);
    }
    
    const monthlyWS = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlyWS, 'Monthly Summary');
    
    // Quarterly Summary
    const quarterlyData = [
        ['Quarter', 'Months', 'Activities', 'Total Beneficiaries', 'Budget', 'Expenditure']
    ];
    
    const quarters = [
        { name: 'Q1', months: [0, 1, 2], label: 'Jan-Mar' },
        { name: 'Q2', months: [3, 4, 5], label: 'Apr-Jun' },
        { name: 'Q3', months: [6, 7, 8], label: 'Jul-Sep' },
        { name: 'Q4', months: [9, 10, 11], label: 'Oct-Dec' }
    ];
    
    quarters.forEach(q => {
        const qActivities = activities.filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === year && q.months.includes(d.getMonth());
        });
        
        quarterlyData.push([
            q.name,
            q.label,
            qActivities.length,
            qActivities.reduce((s, a) => s + (a.totalBeneficiaries || 0), 0),
            qActivities.reduce((s, a) => s + (a.budget || 0), 0),
            qActivities.reduce((s, a) => s + (a.expenditure || 0), 0)
        ]);
    });
    
    const quarterlyWS = XLSX.utils.aoa_to_sheet(quarterlyData);
    XLSX.utils.book_append_sheet(wb, quarterlyWS, 'Quarterly Summary');
    
    XLSX.writeFile(wb, `AWYAD_Monthly_Tracking_${year}_${formatDate(new Date())}.xlsx`);
}

/**
 * Show export notification to user
 * @private
 * @param {string} message - Success message
 */
function showExportNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <i class="bi bi-check-circle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export wrapper functions with notifications
export async function exportDashboardWithNotification(...args) {
    await exportDashboard(...args);
    showExportNotification('Dashboard exported successfully!');
}

export async function exportProjectsWithNotification(...args) {
    await exportProjects(...args);
    showExportNotification('Projects exported successfully!');
}

export async function exportIndicatorsWithNotification(...args) {
    await exportIndicators(...args);
    showExportNotification('Indicators exported successfully!');
}

export async function exportActivitiesWithNotification(...args) {
    await exportActivities(...args);
    showExportNotification('Activities exported successfully!');
}

export async function exportCasesWithNotification(...args) {
    await exportCases(...args);
    showExportNotification('Cases exported successfully!');
}

export async function exportMonthlyTrackingWithNotification(...args) {
    await exportMonthlyTracking(...args);
    showExportNotification('Monthly tracking exported successfully!');
}
