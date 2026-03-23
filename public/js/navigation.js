/**
 * Navigation Module
 * 
 * Handles client-side routing using URL hash navigation.
 * Manages route changes, browser back/forward, and active navigation state.
 * Maps routes to page render functions and handles 404 errors.
 * 
 * @module navigation
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { createDashboardSwitcher, initializeDashboardSwitcher } from './components/dashboardSwitcher.js';
import { renderDashboard } from './dashboard.js';
import { renderProjects } from './projects.js';
import { renderIndicators } from './indicators.js';
import { renderActivities } from './activities.js';
import { renderCases } from './cases.js';
import { renderMonthlyTracking } from './monthly.js';
import { renderEntryForm } from './entryForm.js';
import { renderUserManagement } from './renderUserManagement.js';
import { renderAuditLogs } from './renderAuditLogs.js';
import { renderPermissionMatrix } from './permissionMatrix.js';
import { renderSessionManagement } from './sessionManagement.js';
import { renderThematicAreas } from './thematicAreas.js';
import { renderSupportData } from './supportData.js';
import { renderHelp } from './help.js';
import { renderProfile } from './renderProfile.js';
import { renderStrategicDashboard } from './renderStrategicDashboard.js';
import { renderProjectDashboard } from './renderProjectDashboard.js';

// Stream 6: New Dashboard System
import { renderAWYADStrategicDashboard } from './dashboards/strategicDashboard.js';
import { renderProjectDashboardNew } from './dashboards/projectDashboard.js';

/**
 * Navigation routes mapping
 */
const routes = {
    '': renderDashboard,
    'dashboard': renderDashboard,
    
    // Stream 6: Enhanced Dashboard Routes
    'strategic-dashboard': async (container) => {
        const html = await renderAWYADStrategicDashboard();
        container.innerHTML = html;
        // Re-init switcher to restore correct project selector state
        setTimeout(() => initializeDashboardSwitcher(), 150);
    },
    'project-dashboard': async (container) => {
        // Extract project ID from hash (e.g., #project-dashboard?id=123)
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const projectId = urlParams.get('id');
        const html = await renderProjectDashboardNew(projectId);
        container.innerHTML = html;
        // Sync the project selector in the sticky switcher
        if (projectId) {
            setTimeout(() => {
                const sel = document.getElementById('project-selector');
                if (sel) sel.value = projectId;
                initializeDashboardSwitcher();
            }, 150);
        }
    },
    
    // Legacy routes (kept for backward compatibility)
    'strategic-dashboard-old': async (container) => {
        const html = await renderStrategicDashboard();
        container.innerHTML = html;
    },
    'project-dashboard-old': async (container) => {
        const html = await renderProjectDashboard();
        container.innerHTML = html;
    },
    
    'projects': renderProjects,
    'indicators': renderIndicators,
    'activities': renderActivities,
    'cases': renderCases,
    'monthly': renderMonthlyTracking,
    'entry-form': renderEntryForm,
    'users': renderUserManagement,
    'audit-logs': renderAuditLogs,
    'permissions': renderPermissionMatrix,
    'sessions': renderSessionManagement,
    'thematic-areas': renderThematicAreas,
    'support-data': renderSupportData,
    'help': renderHelp,
    'demo-guide': renderHelp,
    'profile': renderProfile
};

/**
 * Initialize the navigation system
 * Sets up event listeners for navigation links and hash changes
 * Handles initial route on page load
 * 
 * @returns {void}
 * 
 * @example
 * setupNavigation(); // Called on app initialization
 */
/** Show or hide the switcher area and inject the switcher HTML when needed */
function showSwitcher() {
    const switcherArea = document.getElementById('switcher-area');
    if (!switcherArea) return;
    if (!switcherArea.querySelector('.dashboard-switcher')) {
        switcherArea.innerHTML = createDashboardSwitcher();
    }
    switcherArea.style.display = 'block';
    setTimeout(() => initializeDashboardSwitcher(), 100);
}

function hideSwitcher() {
    const switcherArea = document.getElementById('switcher-area');
    if (switcherArea) switcherArea.style.display = 'none';
}

export function setupNavigation() {
    const contentArea = document.getElementById('content-area');
    
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }

    // Handle navigation link clicks
    document.querySelectorAll('[data-nav]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = link.getAttribute('data-nav');
            navigateTo(route);
        });
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        handleRouteChange();
    });

    // Handle initial route
    handleRouteChange();
}

/**
 * Navigate to a specific route programmatically
 * Updates URL hash which triggers route handler
 * 
 * @param {string} route - Route name (e.g., 'dashboard', 'projects')
 * @returns {void}
 * 
 * @example
 * navigateTo('projects'); // Navigate to projects page
 */
export function navigateTo(route) {
    window.location.hash = route;
}

/**
 * Handle route change from hash updates
 * Parses hash, calls appropriate render function, handles errors
 * 
 * @private
 * @returns {void}
 */
function handleRouteChange() {
    // Get route from URL hash
    let hash = window.location.hash.substring(1); // Remove '#'
    
    // Extract route name (before any query parameters)
    let route = hash.split('?')[0];
    
    // Default to dashboard if no route
    if (!route) {
        route = 'dashboard';
    }

    // Get content area — route functions receive the scrollable #main-content div
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) {
        console.error('main-content element not found');
        return;
    }

    // Show switcher only for dashboard routes
    const dashboardRoutes = ['strategic-dashboard', 'project-dashboard'];
    if (dashboardRoutes.includes(route)) {
        showSwitcher();
    } else {
        hideSwitcher();
    }

    // Update active navigation item
    updateActiveNavItem(route);

    // Get render function for route
    const renderFunction = routes[route];

    if (renderFunction) {
        // Render the route
        try {
            renderFunction(mainContent);
        } catch (error) {
            console.error(`Error rendering ${route}:`, error);
            mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
                    <p>Failed to load page: ${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.location.hash='dashboard'">
                        <i class="bi bi-house"></i> Go to Dashboard
                    </button>
                </div>
            `;
        }
    } else {
        // 404 - Route not found
        mainContent.innerHTML = `
            <div class="alert alert-warning">
                <h4><i class="bi bi-question-circle"></i> Page Not Found</h4>
                <p>The page you're looking for doesn't exist.</p>
                <button class="btn btn-sm btn-outline-primary" onclick="window.location.hash='dashboard'">
                    <i class="bi bi-house"></i> Go to Dashboard
                </button>
            </div>
        `;
    }
}

/**
 * Update active CSS class on navigation items
 * Removes active from all items, adds to current route
 * 
 * @private
 * @param {string} route - Current route name
 * @returns {void}
 */
function updateActiveNavItem(route) {
    // Remove active class from all nav items
    document.querySelectorAll('[data-nav]').forEach(link => {
        link.classList.remove('active');
        // Also check parent for sidebar items
        const parent = link.closest('.nav-item');
        if (parent) {
            parent.classList.remove('active');
        }
    });

    // Add active class to current route
    const activeLink = document.querySelector(`[data-nav="${route}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        // Also add to parent for sidebar items
        const parent = activeLink.closest('.nav-item');
        if (parent) {
            parent.classList.add('active');
        }
    }
}

/**
 * Get the current route from URL hash
 * 
 * @returns {string} Current route name (defaults to 'dashboard')
 * 
 * @example
 * const route = getCurrentRoute(); // Returns 'projects' if on #projects
 */
export function getCurrentRoute() {
    let route = window.location.hash.substring(1);
    return route || 'dashboard';
}
