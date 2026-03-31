/**
 * Projects Module
 * 
 * Displays project list with burn rate tracking, budget monitoring, and thematic area information.
 * Provides filtering, summary metrics, and detailed project views.
 * 
 * @module projects
 * @author AWYAD MES Team
 * @since 1.0.0
 */

import { apiService } from './apiService.js';
import { transformProjects } from './dataTransformer.js';
import {
    createPageHeader,
    createSummaryCard,
    createCard,
    createLoadingSpinner,
    createErrorAlert,
    createEmptyState,
    createBurnRateIndicator,
    createStatusBadge
} from './components.js';
import { formatCurrency } from './utils.js';
import { formatCurrency as formatBudgetCurrency } from './utils/currencyUtils.js';
import { exportProjectsWithNotification } from './exportUtils.js';
import { createProjectBudgetChart, createBurnRateGauge } from './charts.js';
import { showCreateProjectModal, showEditProjectModal, showViewProjectModal } from './projectForms.js';

/**
 * Render projects page with summary cards and projects table
 * Shows active/completed project counts, budget tracking, and burn rate analysis
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {Promise<void>}
 * 
 * @example
 * await renderProjects(document.getElementById('content-area'));
 */
export async function renderProjects(contentArea) {
    try {
        // Show loading state
        contentArea.innerHTML = createLoadingSpinner('Loading projects...');

        // Fetch data
        const projectsRes = await apiService.get('/projects');

        // Transform data
        const projects = transformProjects(projectsRes.data?.projects || projectsRes.data || []);
        
        // Store projects for export
        window.currentProjectsData = projects;
        
        // Extract thematic areas from projects (if available)
        const thematicAreasMap = new Map();
        projects.forEach(p => {
            if (p.thematicAreaId && p.thematicArea) {
                if (!thematicAreasMap.has(p.thematicAreaId)) {
                    thematicAreasMap.set(p.thematicAreaId, {
                        id: p.thematicAreaId,
                        name: p.thematicArea
                    });
                }
            }
        });
        const thematicAreas = Array.from(thematicAreasMap.values());

        // Calculate summary metrics
        const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed' || p.status === 'completed').length;
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalExpenditure = projects.reduce((sum, p) => sum + (p.expenditure || 0), 0);
        const avgBurnRate = totalBudget > 0 ? ((totalExpenditure / totalBudget) * 100).toFixed(1) : 0;

        // Create header
        const header = createPageHeader({
            title: 'Projects Management',
            subtitle: 'Track project performance, budgets, and implementation status',
            icon: 'folder',
            actions: [
                {
                    label: 'New Project',
                    icon: 'plus-circle',
                    variant: 'primary',
                    onClick: 'window.createProject()'
                },
                {
                    label: 'Export',
                    icon: 'download',
                    variant: 'outline-secondary',
                    onClick: 'window.exportProjects()'
                }
            ]
        });

        // Create summary cards
        const summaryCards = `
            <div class="row mb-4">
                ${createSummaryCard({
                    title: 'Total Projects',
                    value: projects.length,
                    subtitle: 'Across all programs',
                    bgColor: 'primary',
                    icon: 'folder'
                })}
                ${createSummaryCard({
                    title: 'Active Projects',
                    value: activeProjects,
                    subtitle: `${completedProjects} completed`,
                    bgColor: 'success',
                    icon: 'play-circle'
                })}
                ${createSummaryCard({
                    title: 'Total Budget',
                    value: formatCurrency(totalBudget),
                    subtitle: `${formatCurrency(totalExpenditure)} spent`,
                    bgColor: 'info',
                    icon: 'cash-stack'
                })}
                ${createSummaryCard({
                    title: 'Avg Burn Rate',
                    value: `${avgBurnRate}%`,
                    subtitle: totalBudget > 0 ? 'Financial health' : 'No data',
                    bgColor: avgBurnRate > 80 ? 'danger' : avgBurnRate > 60 ? 'warning' : 'success',
                    icon: 'speedometer2'
                })}
            </div>
        `;

        // Create projects table
        const projectsTable = createProjectsTable(projects, thematicAreas);

        // Render complete page
        contentArea.innerHTML = `
            ${header}
            ${summaryCards}
            
            <!-- Data Visualizations -->
            <div class="row mb-4">
                <div class="col-md-8">
                    ${createCard({
                        title: 'Budget vs Expenditure',
                        subtitle: 'Top 10 Projects',
                        body: '<canvas id="projects-budget-chart" style="height: 400px;"></canvas>'
                    })}
                </div>
                <div class="col-md-4">
                    ${createCard({
                        title: 'Overall Budget Utilization',
                        subtitle: 'Burn Rate Gauge',
                        body: '<canvas id="projects-burn-gauge" style="height: 400px;"></canvas>'
                    })}
                </div>
            </div>
            
            ${createCard({
                title: 'All Projects',
                subtitle: `Showing ${projects.length} project(s)`,
                body: projectsTable
            })}
        `;
        
        // Initialize charts after DOM is ready
        setTimeout(async () => {
            try {
                await createProjectBudgetChart('projects-budget-chart', projects);
                await createBurnRateGauge('projects-burn-gauge', totalBudget, totalExpenditure);
            } catch (chartError) {
                console.error('Chart initialization error:', chartError);
            }
        }, 100);

        // Attach event listeners to action buttons
        contentArea.querySelectorAll('.view-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const projectId = btn.dataset.projectId;
                window.viewProject(projectId);
            });
        });

        contentArea.querySelectorAll('.edit-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const projectId = btn.dataset.projectId;
                window.editProject(projectId);
            });
        });

    } catch (error) {
        console.error('Projects error:', error);
        contentArea.innerHTML = createErrorAlert(
            error.message || 'Failed to load projects',
            () => renderProjects(contentArea)
        );
    }
}

/**
 * Create projects table HTML
 * @param {Array} projects - Array of project objects
 * @param {Array} thematicAreas - Array of thematic areas
 * @returns {string} HTML string
 */
function createProjectsTable(projects, thematicAreas) {
    if (!projects || projects.length === 0) {
        return createEmptyState('No projects found', 'folder');
    }

    // Create thematic area lookup map
    const areaMap = {};
    thematicAreas.forEach(area => {
        areaMap[area.id || area.thematic_area_id] = area.name || area.thematic_area_name;
    });

    const rows = projects.map(project => {
        const thematicAreaName = project.thematicArea || areaMap[project.thematicAreaId] || 'N/A';
        const statusBadge = createStatusBadge(project.status || 'Unknown');
        const burnRateIndicator = createBurnRateIndicator(project.budget || 0, project.expenditure || 0);

        return `
            <tr>
                <td>
                    <strong>${project.name || 'Unnamed Project'}</strong>
                    ${project.code ? '<br><small class="text-muted">' + project.code + '</small>' : ''}
                </td>
                <td>${(project.donors && project.donors.length > 0) ? project.donors.map(d => `<span class="badge bg-info text-dark me-1">${d.name}</span>`).join('') : (project.donor || 'N/A')}</td>
                <td>
                    <span class="badge bg-secondary">${thematicAreaName}</span>
                </td>
                <td>${statusBadge}</td>
                <td class="text-end">${formatBudgetCurrency(project.budget || 0, project.budget_currency || 'USD')}</td>
                <td class="text-end">${formatCurrency(project.expenditure || 0)}</td>
                <td>
                    ${burnRateIndicator}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary view-project-btn" data-project-id="${project.id}" title="Open Project Dashboard">
                            <i class="bi bi-kanban"></i> Open
                        </button>
                        <button class="btn btn-outline-secondary edit-project-btn" data-project-id="${project.id}" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="table-responsive">
            <table class="table table-hover table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Project Name</th>
                        <th>Donor</th>
                        <th>Thematic Area</th>
                        <th>Status</th>
                        <th class="text-end">Budget</th>
                        <th class="text-end">Expenditure</th>
                        <th style="width: 150px;">Burn Rate</th>
                        <th style="width: 100px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Window-level functions for button handlers
 */
window.createProject = function() {
    showCreateProjectModal(() => {
        // Reload projects page after creation
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            renderProjects(contentArea);
        }
    });
};

window.exportProjects = async function() {
    try {
        if (!window.currentProjectsData || window.currentProjectsData.length === 0) {
            alert('No projects data to export');
            return;
        }
        await exportProjectsWithNotification(window.currentProjectsData);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export projects: ' + error.message);
    }
};

window.viewProject = function(projectId) {
    window.location.hash = `project-dashboard?id=${projectId}`;
};

window.editProject = function(projectId) {
    showEditProjectModal(projectId, () => {
        // Reload projects page after update
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            renderProjects(contentArea);
        }
    });
};
