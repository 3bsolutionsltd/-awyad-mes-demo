import { authManager } from './public/auth.js';
import { renderDashboard } from './renderDashboard.js?v=6';
import { renderStrategicDashboard } from './renderStrategicDashboard.js';
import { renderProjectDashboard } from './renderProjectDashboard.js';
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

// Global year switcher function for monthly tracking - defined at top level
window.switchMonthlyYear = async function(year) {
    console.log('Switching to year:', year);
    window.currentMonthlyYear = year;
    // Re-render monthly tracking by navigating to it again
    const contentArea = document.getElementById('content-area');
    if (contentArea && window.location.hash === '#monthly-tracking') {
        // Trigger a re-load of the monthly tracking page
        loadContent('monthly-tracking');
    }
};

// API service for data fetching
const API_BASE = '/api/v1';

async function fetchAllData() {
    try {
        const [projects, indicators, activities, cases, thematicAreas] = await Promise.all([
            authManager.authenticatedFetch(`${API_BASE}/projects`).then(r => r.json()),
            authManager.authenticatedFetch(`${API_BASE}/indicators`).then(r => r.json()),
            authManager.authenticatedFetch(`${API_BASE}/activities`).then(r => r.json()),
            authManager.authenticatedFetch(`${API_BASE}/cases`).then(r => r.json()),
            // Thematic areas would come from a similar endpoint once created
            Promise.resolve({ data: [] }) // Placeholder
        ]);
        
        return {
            projects: projects.data || [],
            indicators: indicators.data || [],
            activities: activities.data || [],
            cases: cases.data || [],
            thematicAreas: thematicAreas.data || []
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Global functions for activity actions
window.viewActivityDetails = function(activityId) {
    alert(`View Activity ${activityId} - Detailed activity view will be implemented`);
};

window.editActivity = function(activityId) {
    alert(`Edit Activity ${activityId} - Activity editing will be implemented`);
};

// Global function to view project dashboard
window.viewProjectDashboard = async function(projectId) {
    window.currentProjectId = projectId;
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        const { renderProjectDashboard } = await import('./renderProjectDashboard.js');
        contentArea.innerHTML = await renderProjectDashboard(projectId);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    if (!authManager.isAuthenticated()) {
        window.location.href = '/public/login.html';
        return;
    }

    // Get references to DOM elements
    const contentArea = document.getElementById('main-content-area');
    const breadcrumbArea = document.getElementById('breadcrumb-area');
    const breadcrumbList = document.getElementById('breadcrumb-list');
    const dashboardSwitcher = document.getElementById('dashboard-switcher');
    const currentDashboardTitle = document.getElementById('current-dashboard-title');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProjects = document.getElementById('nav-projects');
    const navIndicators = document.getElementById('nav-indicators');
    const navActivities = document.getElementById('nav-activities');
    const navCaseManagement = document.getElementById('nav-case-management');
    const navMonthlyTracking = document.getElementById('nav-monthly-tracking');
    const navForm = document.getElementById('nav-new-activity-report');
    const navHelp = document.getElementById('nav-help');
    const navProfile = document.getElementById('nav-profile');
    
    // Store current data in memory
    let appData = {
        projects: [],
        indicators: [],
        activities: [],
        cases: [],
        thematicAreas: []
    };

    // Loading indicator
    function showLoading() {
        contentArea.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 400px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }

    function showError(message) {
        contentArea.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error Loading Data</h4>
                <p>${message}</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    // Breadcrumb management
    function updateBreadcrumbs(items) {
        if (!items || items.length === 0) {
            breadcrumbArea.style.display = 'none';
            return;
        }
        
        breadcrumbArea.style.display = 'block';
        breadcrumbList.innerHTML = items.map((item, index) => {
            if (index === items.length - 1) {
                return `<li class="breadcrumb-item active" aria-current="page">${item.label}</li>`;
            }
            return `<li class="breadcrumb-item"><a href="#" onclick="navigateTo('${item.page}'); return false;">${item.label}</a></li>`;
        }).join('');
    }

    // Dashboard switcher management
    function updateDashboardSwitcher(show, title) {
        if (show) {
            dashboardSwitcher.style.display = 'block';
            if (currentDashboardTitle) {
                currentDashboardTitle.textContent = title || 'Dashboard';
            }
        } else {
            dashboardSwitcher.style.display = 'none';
        }
    }

    // Load projects into dropdown menu
    async function loadProjectDropdown() {
        try {
            const response = await authManager.authenticatedFetch(`${API_BASE}/projects`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                const menu = document.getElementById('project-dashboard-menu');
                if (menu) {
                    // Keep the first two items (Select Project and divider)
                    const firstItem = menu.children[0];
                    const divider = menu.children[1];
                    menu.innerHTML = '';
                    menu.appendChild(firstItem);
                    menu.appendChild(divider);
                    
                    // Add project items
                    data.data.forEach(project => {
                        const li = document.createElement('li');
                        li.className = 'project-item';
                        const a = document.createElement('a');
                        a.className = 'dropdown-item';
                        a.href = '#';
                        a.innerHTML = `<i class="bi bi-folder"></i> ${project.name}`;
                        a.onclick = (e) => {
                            e.preventDefault();
                            viewProjectDashboard(project.id);
                        };
                        li.appendChild(a);
                        menu.appendChild(li);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading projects dropdown:', error);
        }
    }

    // Global function to show project selector
    window.showProjectSelector = async function() {
        await navigateTo('project-dashboard');
    };

    // Load fresh data from API
    async function loadData() {
        try {
            showLoading();
            appData = await fetchAllData();
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            showError(error.message || 'Failed to load data from server');
            return false;
        }
    }
    
    // Debug: Check if all elements exist
    if (!navCaseManagement) {
        console.error('navCaseManagement element not found!');
    }
    
    // Navigation function
    async function navigateTo(pageName, reload = false) {
        // Reload data if requested or if data is empty
        if (reload || appData.projects.length === 0) {
            const success = await loadData();
            if (!success) return;
        }

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Render the appropriate page
        switch (pageName) {
            case 'dashboard':
                contentArea.innerHTML = renderDashboard(appData);
                navDashboard.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Overview Dashboard' }]);
                updateDashboardSwitcher(true, 'Overview Dashboard');
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-dashboard-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportDashboardSummary(appData));
                    }
                }, 0);
                break;
            case 'strategic-dashboard':
                contentArea.innerHTML = await renderStrategicDashboard();
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Strategic Dashboard' }]);
                updateDashboardSwitcher(true, 'Strategic Dashboard');
                // Strategic dashboard handles its own navigation highlighting
                const navStrategic = document.getElementById('nav-strategic-dashboard');
                if (navStrategic) navStrategic.classList.add('active');
                break;
            case 'projects':
                contentArea.innerHTML = renderProjects(appData);
                navProjects.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Projects' }]);
                updateDashboardSwitcher(false);
                break;
            case 'project-dashboard':
                // Extract project ID from hash or use stored value
                const projectId = window.currentProjectId;
                if (projectId) {
                    contentArea.innerHTML = await renderProjectDashboard(projectId);
                    // Get project name for breadcrumb
                    const project = appData.projects.find(p => p.id === projectId);
                    const projectName = project ? project.name : 'Project Dashboard';
                    updateBreadcrumbs([
                        { label: 'Home', page: 'dashboard' },
                        { label: 'Projects', page: 'projects' },
                        { label: projectName }
                    ]);
                    updateDashboardSwitcher(true, projectName);
                } else {
                    contentArea.innerHTML = await renderProjectDashboard(null);
                    updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Select Project' }]);
                    updateDashboardSwitcher(false);
                    // Load project selector
                    setTimeout(() => {
                        const selector = document.getElementById('project-selector');
                        if (selector) {
                            appData.projects.forEach(project => {
                                const option = document.createElement('option');
                                option.value = project.id;
                                option.textContent = project.name;
                                selector.appendChild(option);
                            });
                        }
                    }, 0);
                }
                break;
            case 'indicators':
                contentArea.innerHTML = renderIndicatorTracking(appData);
                navIndicators.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Indicator Tracking' }]);
                updateDashboardSwitcher(false);
                // Add export listener and form toggle
                setTimeout(async () => {
                    const exportBtn = document.getElementById('export-indicators-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportIndicatorTracking(appData.indicators, appData.thematicAreas));
                    }
                    
                    // Add indicator button listener
                    const addBtn = document.getElementById('add-indicator-btn');
                    const formContainer = document.getElementById('indicator-form-container');
                    
                    if (addBtn && formContainer) {
                        addBtn.addEventListener('click', async () => {
                            if (formContainer.style.display === 'none') {
                                // Show form
                                formContainer.style.display = 'block';
                                addBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel';
                                
                                // Dynamically import and initialize the form
                                const { showIndicatorForm } = await import('./components/IndicatorForm.js');
                                await showIndicatorForm('indicator-form-container', {
                                    mode: 'create',
                                    onSuccess: () => {
                                        formContainer.style.display = 'none';
                                        addBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add Indicator';
                                        navigateTo('indicators', true); // Reload data
                                    },
                                    onCancel: () => {
                                        formContainer.style.display = 'none';
                                        addBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add Indicator';
                                    }
                                });
                            } else {
                                // Hide form
                                formContainer.style.display = 'none';
                                formContainer.innerHTML = '';
                                addBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add Indicator';
                            }
                        });
                    }
                }, 0);
                break;
            case 'activities':
                contentArea.innerHTML = renderActivityTracking(appData);
                navActivities.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Activity Tracking' }]);
                updateDashboardSwitcher(false);
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-activities-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportActivityTracking(appData.activities, appData.indicators));
                    }
                }, 0);
                break;
            case 'case-management':
                contentArea.innerHTML = renderCaseManagement(appData);
                navCaseManagement.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Case Management' }]);
                updateDashboardSwitcher(false);
                break;
            case 'monthly-tracking':
                contentArea.innerHTML = renderMonthlyTracking(appData);
                navMonthlyTracking.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Monthly Tracking' }]);
                updateDashboardSwitcher(false);
                
                // Add export listener
                setTimeout(() => {
                    const exportBtn = document.getElementById('export-monthly-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => exportMonthlyBreakdown(appData.activities));
                    }
                }, 0);
                break;
            case 'form':
                contentArea.innerHTML = renderEntryForm();
                navForm.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'New Activity Report' }]);
                updateDashboardSwitcher(false);
                // Populate form dropdowns after rendering
                populateFormDropdowns();
                // Add beneficiaries calculator
                addBeneficiariesCalculator();
                addNationalityCalculator();
                break;
            case 'help':
                contentArea.innerHTML = renderDemoGuide();
                if (navHelp) navHelp.classList.add('active');
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Help & Quick Reference' }]);
                updateDashboardSwitcher(false);
                break;
            default:
                contentArea.innerHTML = '<div class="alert alert-warning">Page not found</div>';
                updateBreadcrumbs([{ label: 'Home', page: 'dashboard' }, { label: 'Not Found' }]);
                updateDashboardSwitcher(false);
        }
    }
    
    // Function to populate form dropdowns with data
    function populateFormDropdowns() {
        const projectSelect = document.getElementById('form-project');
        const indicatorSelect = document.getElementById('form-indicator');
        
        if (projectSelect) {
            appData.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = `${project.name} (${project.donor || 'N/A'})`;
                projectSelect.appendChild(option);
            });
        }
        
        if (indicatorSelect) {
            appData.indicators.forEach(indicator => {
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
        navDashboard.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('dashboard');
        });
    }
    
    const navStrategicDashboard = document.getElementById('nav-strategic-dashboard');
    if (navStrategicDashboard) {
        navStrategicDashboard.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('strategic-dashboard');
        });
    }
    
    const navProjectDashboard = document.getElementById('nav-project-dashboard');
    if (navProjectDashboard) {
        navProjectDashboard.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('project-dashboard');
        });
    }
    
    if (navProjects) {
        navProjects.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('projects');
        });
    }
    
    if (navIndicators) {
        navIndicators.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('indicators');
        });
    }
    
    if (navActivities) {
        navActivities.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('activities');
        });
    }
    
    if (navCaseManagement) {
        navCaseManagement.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('case-management');
        });
    }
    
    if (navMonthlyTracking) {
        navMonthlyTracking.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('monthly-tracking');
        });
    }
    
    if (navForm) {
        navForm.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('form');
        });
    }
    
    if (navHelp) {
        navHelp.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('help');
        });
    }
    
    if (navProfile) {
        navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'public/profile.html';
        });
    }
    
    // Load dashboard by default
    navigateTo('dashboard');
    
    // Load projects into dropdown menu
    loadProjectDropdown();
});
