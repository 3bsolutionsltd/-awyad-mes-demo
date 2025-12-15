// Excel/CSV Export Functions

export function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    downloadFile(csv, filename, 'text/csv');
}

export function exportToExcel(data, filename) {
    // For basic Excel export, we'll use CSV format with .xlsx extension
    // A full Excel export would require a library like SheetJS
    const csv = convertToCSV(data);
    downloadFile(csv, filename, 'application/vnd.ms-excel');
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            
            // Handle nested objects
            if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value);
            }
            
            // Escape quotes and wrap in quotes if contains comma
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export activity tracking data
export function exportActivityTracking(activities, indicators) {
    const exportData = activities.map(activity => {
        const indicator = indicators.find(i => i.id === activity.indicatorId);
        const refugeeTotal = (activity.beneficiaries?.maleRefugee || 0) + (activity.beneficiaries?.femaleRefugee || 0);
        const hostTotal = (activity.beneficiaries?.maleHost || 0) + (activity.beneficiaries?.femaleHost || 0);
        
        return {
            'Activity Code': activity.activityCode || activity.id,
            'Activity Name': activity.name,
            'Indicator': indicator ? indicator.name : 'N/A',
            'Location': activity.location,
            'Date': activity.date,
            'Status': activity.status,
            'Approval Status': activity.approvalStatus,
            'Target': activity.target || 0,
            'Achieved': activity.achieved || 0,
            'Budget': activity.budget || 0,
            'Expenditure': activity.expenditure || 0,
            'Male Refugee': activity.beneficiaries?.maleRefugee || 0,
            'Female Refugee': activity.beneficiaries?.femaleRefugee || 0,
            'Male Host': activity.beneficiaries?.maleHost || 0,
            'Female Host': activity.beneficiaries?.femaleHost || 0,
            'Total Refugee': refugeeTotal,
            'Total Host': hostTotal,
            'Total Beneficiaries': refugeeTotal + hostTotal,
            'Sudanese': activity.nationality?.sudanese || 0,
            'Congolese': activity.nationality?.congolese || 0,
            'South Sudanese': activity.nationality?.southSudanese || 0,
            'Others': activity.nationality?.others || 0
        };
    });
    
    const filename = `Activity_Tracking_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
}

// Export indicator tracking data
export function exportIndicatorTracking(indicators, thematicAreas) {
    const exportData = indicators.map(indicator => {
        const ta = thematicAreas.find(t => t.id === indicator.thematicAreaId);
        const variance = (indicator.achieved || 0) - (indicator.annualTarget || 0);
        const percentage = indicator.annualTarget > 0 
            ? ((indicator.achieved / indicator.annualTarget) * 100).toFixed(1) 
            : 0;
        
        return {
            'Indicator Code': indicator.code,
            'Indicator Name': indicator.name,
            'Thematic Area': ta ? `${ta.code}: ${ta.name}` : 'N/A',
            'Type': indicator.type,
            'Baseline': indicator.baseline || 0,
            'Baseline Date': indicator.baselineDate,
            'LOP Target': indicator.lopTarget || 0,
            'Annual Target': indicator.annualTarget || 0,
            'Achieved': indicator.achieved || 0,
            'Variance': variance,
            'Percentage Achieved': percentage + '%',
            'Q1 Target': indicator.q1Target || 0,
            'Q2 Target': indicator.q2Target || 0,
            'Q3 Target': indicator.q3Target || 0,
            'Q4 Target': indicator.q4Target || 0,
            'Unit': indicator.unit
        };
    });
    
    const filename = `Indicator_Tracking_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
}

// Export dashboard summary
export function exportDashboardSummary(data) {
    // Create summary data
    const summaryData = [];
    
    // Overall statistics
    summaryData.push({
        'Category': 'Overall Statistics',
        'Metric': 'Active Projects',
        'Value': data.projects.filter(p => p.status === 'Active').length
    });
    
    summaryData.push({
        'Category': 'Overall Statistics',
        'Metric': 'Total Indicators',
        'Value': data.indicators.length
    });
    
    summaryData.push({
        'Category': 'Overall Statistics',
        'Metric': 'Total Activities',
        'Value': data.activities.length
    });
    
    const totalBudget = data.projects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenditure = data.projects.reduce((sum, p) => sum + p.expenditure, 0);
    const overallBurnRate = (totalExpenditure / totalBudget * 100).toFixed(1);
    
    summaryData.push({
        'Category': 'Financial Overview',
        'Metric': 'Total Budget',
        'Value': `$${totalBudget.toLocaleString()}`
    });
    
    summaryData.push({
        'Category': 'Financial Overview',
        'Metric': 'Total Expenditure',
        'Value': `$${totalExpenditure.toLocaleString()}`
    });
    
    summaryData.push({
        'Category': 'Financial Overview',
        'Metric': 'Overall Burn Rate',
        'Value': overallBurnRate + '%'
    });
    
    // Thematic area breakdown
    data.thematicAreas.forEach(ta => {
        const taIndicators = data.indicators.filter(i => i.thematicAreaId === ta.id);
        const taProjects = data.projects.filter(p => p.thematicAreaId === ta.id);
        
        summaryData.push({
            'Category': `Thematic Area: ${ta.code}`,
            'Metric': ta.name,
            'Value': `${taIndicators.length} indicators, ${taProjects.length} projects`
        });
    });
    
    const filename = `Dashboard_Summary_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(summaryData, filename);
}

// Export monthly breakdown
export function exportMonthlyBreakdown(activities) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const exportData = [];
    
    months.forEach(month => {
        const monthIndex = months.indexOf(month);
        const monthActivities = activities.filter(activity => {
            const activityMonth = new Date(activity.date).getMonth();
            return activityMonth === monthIndex;
        });
        
        const totalBeneficiaries = monthActivities.reduce((sum, a) => {
            if (a.beneficiaries) {
                return sum + a.beneficiaries.maleRefugee + a.beneficiaries.femaleRefugee + 
                       a.beneficiaries.maleHost + a.beneficiaries.femaleHost;
            }
            return sum;
        }, 0);
        
        const totalExpenditure = monthActivities.reduce((sum, a) => sum + (a.expenditure || 0), 0);
        
        exportData.push({
            'Month': month + ' 2025',
            'Activities': monthActivities.length,
            'Total Beneficiaries': totalBeneficiaries,
            'Refugee Beneficiaries': monthActivities.reduce((sum, a) => 
                sum + (a.beneficiaries?.maleRefugee || 0) + (a.beneficiaries?.femaleRefugee || 0), 0),
            'Host Beneficiaries': monthActivities.reduce((sum, a) => 
                sum + (a.beneficiaries?.maleHost || 0) + (a.beneficiaries?.femaleHost || 0), 0),
            'Total Expenditure': `$${totalExpenditure.toLocaleString()}`
        });
    });
    
    const filename = `Monthly_Breakdown_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
}

// Export case management
export function exportCaseManagement(cases) {
    const exportData = cases.map(caseItem => ({
        'Case Number': caseItem.caseNumber,
        'Type': caseItem.type,
        'Date Reported': caseItem.dateReported,
        'Status': caseItem.status,
        'Follow-up Date': caseItem.followUpDate || 'N/A',
        'Closed Date': caseItem.closedDate || 'N/A',
        'Services': caseItem.services.join('; ')
    }));
    
    const filename = `Case_Management_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(exportData, filename);
}
