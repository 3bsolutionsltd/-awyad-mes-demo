/**
 * Dashboard Switcher Component
 * Toggle between AWYAD Strategic and Project Dashboards
 * 
 * @module components/dashboardSwitcher
 * @author AWYAD MES Team - Stream 6
 */

import { dashboardService } from '../services/dashboardService.js';

const STORAGE_KEY = 'awyad-dashboard-selection';

/**
 * Create dashboard switcher UI
 * @returns {string} HTML string
 */
export function createDashboardSwitcher() {
    const savedSelection = getSavedSelection();
    
    return `
        <div class="dashboard-switcher card mb-4 shadow-sm">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6 mb-2 mb-md-0">
                        <div class="btn-group w-100" role="group" aria-label="Dashboard Type">
                            <button 
                                class="btn ${savedSelection.type === 'strategic' ? 'btn-light' : 'btn-outline-light'}" 
                                data-dashboard="strategic"
                                onclick="switchDashboard('strategic')">
                                <i class="bi bi-diagram-3"></i> AWYAD Strategic View
                            </button>
                            <button 
                                class="btn ${savedSelection.type === 'project' ? 'btn-light' : 'btn-outline-light'}" 
                                data-dashboard="project"
                                onclick="switchDashboard('project')">
                                <i class="bi bi-grid-3x3"></i> Project Dashboards
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div id="project-selector-container" style="display: ${savedSelection.type === 'project' ? 'block' : 'none'};">
                            <select class="form-select" id="project-selector" onchange="selectProjectDashboard(this.value)">
                                <option value="">Select a project...</option>
                            </select>
                        </div>
                        <div id="strategic-info" style="display: ${savedSelection.type === 'strategic' ? 'block' : 'none'};">
                            <div class="text-muted small text-center">
                                <i class="bi bi-info-circle"></i> Viewing organizational strategic framework
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize dashboard switcher after DOM is ready
 */
export async function initializeDashboardSwitcher() {
    try {
        // Load projects for selector
        await loadProjectSelector();
        
        // Restore last selection
        const saved = getSavedSelection();
        if (saved.type === 'project' && saved.projectId) {
            document.getElementById('project-selector').value = saved.projectId;
        }
        
    } catch (error) {
        console.error('Error initializing dashboard switcher:', error);
    }
}

/**
 * Load projects into selector dropdown
 */
async function loadProjectSelector() {
    const selector = document.getElementById('project-selector');
    if (!selector) return;
    
    try {
        const response = await dashboardService.getAllProjects();
        
        if (response.success && response.data) {
            const projects = response.data;
            
            // Clear existing options (except first one)
            selector.innerHTML = '<option value="">Select a project...</option>';
            
            // Add project options
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = `${project.name} (${project.donor || 'N/A'})`;
                selector.appendChild(option);
            });
            
            // Enable search functionality (if using a library like Select2 or Choices.js)
            // For now, use native datalist for autocomplete
            enableAutocomplete(selector, projects);
        }
        
    } catch (error) {
        console.error('Error loading projects:', error);
        selector.innerHTML = '<option value="">Error loading projects</option>';
    }
}

/**
 * Enable autocomplete for project selector
 * @private
 */
function enableAutocomplete(selector, projects) {
    // Create datalist for autocomplete
    const datalistId = 'project-datalist';
    let datalist = document.getElementById(datalistId);
    
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        selector.parentElement.appendChild(datalist);
    }
    
    // Add options to datalist
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.name;
        option.setAttribute('data-id', project.id);
        datalist.appendChild(option);
    });
}

/**
 * Switch between dashboard types
 */
window.switchDashboard = function(type) {
    // Update button states
    document.querySelectorAll('[data-dashboard]').forEach(btn => {
        if (btn.getAttribute('data-dashboard') === type) {
            btn.className = 'btn btn-light';
        } else {
            btn.className = 'btn btn-outline-light';
        }
    });
    
    // Show/hide project selector
    const projectContainer = document.getElementById('project-selector-container');
    const strategicInfo = document.getElementById('strategic-info');
    
    if (type === 'project') {
        projectContainer.style.display = 'block';
        strategicInfo.style.display = 'none';
    } else {
        projectContainer.style.display = 'none';
        strategicInfo.style.display = 'block';
    }
    
    // Save selection
    saveSelection(type, null);
    
    // Navigate to appropriate dashboard
    if (type === 'strategic') {
        window.location.hash = 'strategic-dashboard';
    } else {
        // Wait for project selection
        const selector = document.getElementById('project-selector');
        if (selector && selector.value) {
            window.location.hash = `project-dashboard?id=${selector.value}`;
        }
    }
};

/**
 * Select specific project dashboard
 */
window.selectProjectDashboard = function(projectId) {
    if (!projectId) return;
    
    // Save selection
    saveSelection('project', projectId);
    
    // Navigate to project dashboard
    window.location.hash = `project-dashboard?id=${projectId}`;
};

/**
 * Save dashboard selection to localStorage
 * @private
 */
function saveSelection(type, projectId) {
    const selection = {
        type,
        projectId,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (error) {
        console.error('Error saving selection:', error);
    }
}

/**
 * Get saved dashboard selection
 * @private
 */
function getSavedSelection() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const selection = JSON.parse(saved);
            
            // Check if not too old (7 days)
            if (Date.now() - selection.timestamp < 7 * 24 * 60 * 60 * 1000) {
                return selection;
            }
        }
    } catch (error) {
        console.error('Error reading saved selection:', error);
    }
    
    // Default to strategic view
    return { type: 'strategic', projectId: null };
}

/**
 * Clear saved selection
 */
export function clearSavedSelection() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing selection:', error);
    }
}
