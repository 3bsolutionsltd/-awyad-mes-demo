/**
 * Thematic Areas Management Page
 * CRUD interface for managing thematic areas
 */

import { apiService } from './apiService.js';
import { showCreateThematicAreaModal, showEditThematicAreaModal, showViewThematicAreaModal, showDeleteThematicAreaModal } from './thematicAreaForms.js';
import { formatDate } from './utils.js';

export async function renderThematicAreas(container) {
    try {
        // Fetch all thematic areas (including inactive)
        const response = await apiService.get('/thematic-areas');
        const thematicAreas = response.data || [];

        const html = `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1><i class="bi bi-bookmark-star"></i> Thematic Areas</h1>
                        <p class="text-muted">Manage thematic areas for projects and indicators</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.createThematicArea()">
                        <i class="bi bi-plus-circle"></i> New Thematic Area
                    </button>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6 class="card-title">Total Areas</h6>
                                <h2>${thematicAreas.length}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h6 class="card-title">Active</h6>
                                <h2>${thematicAreas.filter(ta => ta.is_active).length}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <h6 class="card-title">Inactive</h6>
                                <h2>${thematicAreas.filter(ta => !ta.is_active).length}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Thematic Areas Table -->
                <div class="card">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">All Thematic Areas</h5>
                    </div>
                    <div class="card-body">
                        ${thematicAreas.length === 0 ? `
                            <div class="text-center py-5">
                                <i class="bi bi-bookmark-star" style="font-size: 4rem; color: #ccc;"></i>
                                <p class="text-muted mt-3">No thematic areas found</p>
                                <button class="btn btn-primary" onclick="window.createThematicArea()">
                                    <i class="bi bi-plus-circle"></i> Create Your First Thematic Area
                                </button>
                            </div>
                        ` : `
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Code</th>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${thematicAreas.map(ta => `
                                            <tr class="${!ta.is_active ? 'table-secondary' : ''}">
                                                <td>
                                                    <span class="badge bg-secondary">${ta.code}</span>
                                                </td>
                                                <td>
                                                    <strong>${ta.name}</strong>
                                                </td>
                                                <td>
                                                    <small class="text-muted">
                                                        ${ta.description ? (ta.description.length > 100 ? ta.description.substring(0, 100) + '...' : ta.description) : 'No description'}
                                                    </small>
                                                </td>
                                                <td>
                                                    ${ta.is_active 
                                                        ? '<span class="badge bg-success">Active</span>' 
                                                        : '<span class="badge bg-danger">Inactive</span>'}
                                                </td>
                                                <td>
                                                    <small>${formatDate(ta.created_at)}</small>
                                                </td>
                                                <td>
                                                    <div class="btn-group btn-group-sm" role="group">
                                                        <button class="btn btn-outline-info" onclick="window.viewThematicArea('${ta.id}')" title="View Details">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-primary" onclick="window.editThematicArea('${ta.id}')" title="Edit">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger" onclick="window.deleteThematicArea('${ta.id}', '${ta.name}')" title="Delete">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Usage Information -->
                <div class="card mt-4">
                    <div class="card-header bg-info text-white">
                        <i class="bi bi-info-circle"></i> About Thematic Areas
                    </div>
                    <div class="card-body">
                        <p><strong>Thematic areas</strong> are used to categorize and organize your projects and indicators. They help you:</p>
                        <ul>
                            <li>Group related projects and indicators together</li>
                            <li>Track progress across different program areas</li>
                            <li>Generate reports by thematic focus</li>
                            <li>Align with donor requirements and frameworks</li>
                        </ul>
                        <p class="mb-0"><strong>Note:</strong> Thematic areas cannot be deleted if they are being used by any projects or indicators. You must first reassign or delete those items.</p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Set up global functions for actions
        window.createThematicArea = function() {
            showCreateThematicAreaModal(() => {
                renderThematicAreas(container);
            });
        };

        window.viewThematicArea = function(id) {
            showViewThematicAreaModal(id);
        };

        window.editThematicArea = function(id) {
            showEditThematicAreaModal(id, () => {
                renderThematicAreas(container);
            });
        };

        window.deleteThematicArea = function(id, name) {
            showDeleteThematicAreaModal(id, name, () => {
                renderThematicAreas(container);
            });
        };

    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error Loading Thematic Areas</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}
