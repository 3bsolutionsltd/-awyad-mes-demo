import { mockData } from './mockData.js';
import { renderDashboard } from './renderDashboard.js';
import { renderProjects } from './renderProjects.js';
import { renderEntryForm } from './renderEntryForm.js';
import { renderIndicatorTracking } from './renderIndicatorTracking.js';
import { renderActivityTracking } from './renderActivityTracking.js';
import { renderCaseManagement } from './renderCaseManagement.js';
import { renderMonthlyTracking } from './renderMonthlyTracking.js';
import { renderDemoGuide } from './renderDemoGuide.js';
import { 
    exportActivityTracking, 
    exportIndicatorTracking, 
    exportDashboardSummary, 
    exportMonthlyBreakdown 
} from './exportFunctions.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const contentArea = document.getElementById('content-area');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProjects = document.getElementById('nav-projects');
    const navIndicators = document.getElementById('nav-indicators');
    const navActivities = document.getElementById('nav-activities');
    const navCaseManagement = document.getElementById('nav-case-management');
    const navMonthlyTracking = document.getElementById('nav-monthly-tracking');
    const navForm = document.getElementById('nav-new-activity-report');
    const navDemoGuide = document.getElementById('nav-demo-guide');
    
    // Debug: Check if all elements exist
    if (!navCaseManagement) {
        console.error('navCaseManagement element not found!');
    }
    
    // Navigation function
    function navigateTo(pageName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Render the appropriate page
        switch (pageName) {
            case 'dashboard':
                contentArea.innerHTML = renderDashboard(mockData);
                navDashboard.classList.add('active');
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-dashboard-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportDashboardSummary(mockData));
                    }
                }, 0);
                break;
            case 'projects':
                contentArea.innerHTML = renderProjects(mockData);
                navProjects.classList.add('active');
                break;
            case 'indicators':
                contentArea.innerHTML = renderIndicatorTracking(mockData);
                navIndicators.classList.add('active');
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-indicators-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportIndicatorTracking(mockData.indicators, mockData.thematicAreas));
                    }
                }, 0);
                break;
            case 'activities':
                contentArea.innerHTML = renderActivityTracking(mockData);
                navActivities.classList.add('active');
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-activities-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportActivityTracking(mockData.activities, mockData.indicators));
                    }
                }, 0);
                break;
            case 'case-management':
                contentArea.innerHTML = renderCaseManagement(mockData);
                navCaseManagement.classList.add('active');
                break;
            case 'monthly-tracking':
                contentArea.innerHTML = renderMonthlyTracking(mockData);
                navMonthlyTracking.classList.add('active');
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-monthly-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportMonthlyBreakdown(mockData.activities));
                    }
                }, 0);
                break;
            case 'form':
                contentArea.innerHTML = renderEntryForm();
                navForm.classList.add('active');
                // Populate form dropdowns after rendering
                populateFormDropdowns();
                // Add beneficiaries calculator
                addBeneficiariesCalculator();
                addNationalityCalculator();
                break;
            case 'demo-guide':
                contentArea.innerHTML = renderDemoGuide();
                navDemoGuide.classList.add('active');
                break;
            default:
                contentArea.innerHTML = '<div class="alert alert-warning">Page not found</div>';
        }
    }
    
    // Function to populate form dropdowns with data
    function populateFormDropdowns() {
        const projectSelect = document.getElementById('form-project');
        const indicatorSelect = document.getElementById('form-indicator');
        
        if (projectSelect) {
            mockData.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = `${project.name} (${project.donor})`;
                projectSelect.appendChild(option);
            });
        }
        
        if (indicatorSelect) {
            mockData.indicators.forEach(indicator => {
                const option = document.createElement('option');
                option.value = indicator.id;
                option.textContent = indicator.name;
                indicatorSelect.appendChild(option);
            });
        }
    }
    
    // Function to calculate total beneficiaries with disaggregation
    function addBeneficiariesCalculator() {
        const beneficiaryInputs = document.querySelectorAll('.beneficiary-input');
        const totalRefugeeDisplay = document.getElementById('total-refugee');
        const totalHostDisplay = document.getElementById('total-host');
        const totalDisplay = document.getElementById('total-beneficiaries');
        
        function updateTotals() {
            let totalRefugee = 0;
            let totalHost = 0;
            
            // Calculate subtotals for each age group
            ['0-4 yrs', '5-17 yrs', '18-49 yrs', '50+ yrs'].forEach(ageGroup => {
                const refugeeMale = document.querySelector(`.refugee-male[data-age="${ageGroup}"]`);
                const refugeeFemale = document.querySelector(`.refugee-female[data-age="${ageGroup}"]`);
                const hostMale = document.querySelector(`.host-male[data-age="${ageGroup}"]`);
                const hostFemale = document.querySelector(`.host-female[data-age="${ageGroup}"]`);
                
                const refugeeSubtotal = (parseInt(refugeeMale?.value) || 0) + (parseInt(refugeeFemale?.value) || 0);
                const hostSubtotal = (parseInt(hostMale?.value) || 0) + (parseInt(hostFemale?.value) || 0);
                
                totalRefugee += refugeeSubtotal;
                totalHost += hostSubtotal;
                
                // Update subtotal displays
                const refugeeSubtotalInput = document.querySelector(`.subtotal-refugee-${ageGroup.replace(/\\s+/g, '-')}`);
                const hostSubtotalInput = document.querySelector(`.subtotal-host-${ageGroup.replace(/\\s+/g, '-')}`);
                
                if (refugeeSubtotalInput) refugeeSubtotalInput.value = refugeeSubtotal;
                if (hostSubtotalInput) hostSubtotalInput.value = hostSubtotal;
            });
            
            // Update totals
            if (totalRefugeeDisplay) totalRefugeeDisplay.value = totalRefugee;
            if (totalHostDisplay) totalHostDisplay.value = totalHost;
            if (totalDisplay) totalDisplay.textContent = totalRefugee + totalHost;
        }
        
        beneficiaryInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', updateTotals);
            }
        });
    }
    
    // Function to calculate nationality totals
    function addNationalityCalculator() {
        const nationalityInputs = document.querySelectorAll('.nationality-input');
        const totalNationalityDisplay = document.getElementById('total-nationality');
        const totalRefugeeDisplay = document.getElementById('total-refugee');
        
        function updateNationalityTotal() {
            let total = 0;
            nationalityInputs.forEach(input => {
                total += parseInt(input.value) || 0;
            });
            
            if (totalNationalityDisplay) {
                totalNationalityDisplay.textContent = total;
                
                // Check if it matches refugee total
                const refugeeTotal = parseInt(totalRefugeeDisplay?.value) || 0;
                const parent = totalNationalityDisplay.closest('.alert');
                if (total !== refugeeTotal && refugeeTotal > 0) {
                    parent?.classList.remove('alert-warning');
                    parent?.classList.add('alert-danger');
                } else {
                    parent?.classList.remove('alert-danger');
                    parent?.classList.add('alert-warning');
                }
            }
        }
        
        nationalityInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', updateNationalityTotal);
            }
        });
        
        // Also update when refugee total changes
        if (totalRefugeeDisplay) {
            const observer = new MutationObserver(updateNationalityTotal);
            observer.observe(totalRefugeeDisplay, { attributes: true, childList: true, characterData: true });
        }
    }
    
    // Add click event listeners to nav links
    if (navDashboard) {
        navDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('dashboard');
        });
    }
    
    if (navProjects) {
        navProjects.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('projects');
        });
    }
    
    if (navIndicators) {
        navIndicators.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('indicators');
        });
    }
    
    if (navActivities) {
        navActivities.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('activities');
        });
    }
    
    if (navCaseManagement) {
        navCaseManagement.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('case-management');
        });
    }
    
    if (navMonthlyTracking) {
        navMonthlyTracking.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('monthly-tracking');
        });
    }
    
    if (navForm) {
        navForm.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('form');
        });
    }
    
    if (navDemoGuide) {
        navDemoGuide.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('demo-guide');
        });
    }
    
    // Load demo guide by default
    navigateTo('demo-guide');
});
