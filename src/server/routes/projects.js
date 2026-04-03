import express from 'express';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createProjectSchema = Joi.object({
    name: Joi.string().required().max(255),
    donor_ids: Joi.array().items(Joi.string().uuid()).min(1).optional(),
    donor: Joi.string().max(255).optional(),
    description: Joi.string().allow('', null),
    thematic_area_id: Joi.string().uuid().optional().allow(null, ''),
    component_ids: Joi.array().items(Joi.string().uuid()).min(1).optional(),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required(),
    budget: Joi.number().min(0).default(0),
    budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('USD'),
    status: Joi.string().valid('Planning', 'Active', 'Completed', 'On Hold', 'Cancelled').default('Planning')
});

const updateProjectSchema = Joi.object({
    name: Joi.string().max(255),
    donor_ids: Joi.array().items(Joi.string().uuid()).min(1),
    description: Joi.string().allow('', null),
    thematic_area_id: Joi.string().uuid().optional().allow(null, ''),
    component_ids: Joi.array().items(Joi.string().uuid()).min(1),
    start_date: Joi.date(),
    end_date: Joi.date(),
    budget: Joi.number().min(0),
    budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP'),
    status: Joi.string().valid('Planning', 'Active', 'Completed', 'On Hold', 'Cancelled')
}).min(1);

/**
 * GET /api/v1/projects
 * List all projects with pagination and filtering
 */
router.get('/', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            thematic_area_id,
            search 
        } = req.query;

        const filters = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            filters.push(`status = $${paramIndex++}`);
            params.push(status);
        }

        if (thematic_area_id) {
            filters.push(`thematic_area_id = $${paramIndex++}`);
            params.push(thematic_area_id);
        }

        if (search) {
            filters.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
        const { total } = await databaseService.queryOne(countQuery, params);

        // Get paginated results
        const offset = (page - 1) * limit;
        params.push(limit, offset);
        
        const query = `
            SELECT 
                p.*,
                ta.name as thematic_area_name,
                u.username as created_by_username,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', d.id, 'name', d.name) ORDER BY d.name)
                     FROM project_donors pd
                     JOIN donors d ON pd.donor_id = d.id
                     WHERE pd.project_id = p.id),
                    '[]'::json
                ) as donors,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name) ORDER BY c.name)
                     FROM project_components pc
                     JOIN core_program_components c ON pc.component_id = c.id
                     WHERE pc.project_id = p.id),
                    '[]'::json
                ) as components
            FROM projects p
            LEFT JOIN thematic_areas ta ON p.thematic_area_id = ta.id
            LEFT JOIN users u ON p.created_by = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const projects = await databaseService.queryMany(query, params);

        res.json({
            success: true,
            data: {
                projects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id
 * Get a single project by ID
 */
router.get('/:id', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p.*,
                ta.name as thematic_area_name,
                ta.description as thematic_area_description,
                u1.username as created_by_username,
                u2.username as updated_by_username,
                (SELECT COUNT(*) FROM activities WHERE project_id = p.id) as activity_count,
                (SELECT COUNT(*) FROM cases WHERE project_id = p.id) as case_count,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', d.id, 'name', d.name) ORDER BY d.name)
                     FROM project_donors pd
                     JOIN donors d ON pd.donor_id = d.id
                     WHERE pd.project_id = p.id),
                    '[]'::json
                ) as donors,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', c.id, 'name', c.name) ORDER BY c.name)
                     FROM project_components pc
                     JOIN core_program_components c ON pc.component_id = c.id
                     WHERE pc.project_id = p.id),
                    '[]'::json
                ) as components
            FROM projects p
            LEFT JOIN thematic_areas ta ON p.thematic_area_id = ta.id
            LEFT JOIN users u1 ON p.created_by = u1.id
            LEFT JOIN users u2 ON p.updated_by = u2.id
            WHERE p.id = $1
        `;

        const project = await databaseService.queryOne(query, [id]);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/projects
 * Create a new project
 */
router.post('/', authenticate, checkPermission('projects.create'), async (req, res, next) => {
    try {
        const { error, value } = createProjectSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const {
            name,
            donor_ids,
            description,
            thematic_area_id,
            component_ids,
            start_date,
            end_date,
            budget,
            budget_currency,
            status
        } = value;

        // Verify donors: accept either donor_ids (array of uuids) or legacy donor (string)
        const donorRecords = [];
        if (donor_ids && donor_ids.length > 0) {
            for (const did of donor_ids) {
                const d = await databaseService.queryOne(
                    'SELECT id, name FROM donors WHERE id = $1 AND is_active = true',
                    [did]
                );
                if (!d) throw new AppError(`Donor not found or inactive: ${did}`, 404);
                donorRecords.push(d);
            }
        } else if (value.donor) {
            donorRecords.push({ name: value.donor });
        }

        // Verify all provided component IDs exist (optional)
        if (component_ids && component_ids.length > 0) {
            for (const cid of component_ids) {
                const comp = await databaseService.queryOne(
                    'SELECT id FROM core_program_components WHERE id = $1',
                    [cid]
                );
                if (!comp) {
                    throw new AppError(`Core program component not found: ${cid}`, 404);
                }
            }
        }

        const insertQuery = `
            INSERT INTO projects (
                name, donor, description, thematic_area_id, start_date, end_date,
                budget, budget_currency, status, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
            RETURNING *
        `;

        const donorText = donorRecords.length > 0 ? donorRecords.map(d => d.name).join(', ') : null;

        const project = await databaseService.queryOne(insertQuery, [
            name,
            donorText,
            description,
            thematic_area_id || null,
            start_date,
            end_date,
            budget || 0,
            budget_currency || 'USD',
            status || 'Planning',
            req.user.id
        ]);

        // Link to donors (junction table) if donor_ids provided
        if (donor_ids && donor_ids.length > 0) {
            for (const did of donor_ids) {
                await databaseService.query(
                    'INSERT INTO project_donors (project_id, donor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [project.id, did]
                );
            }
        }

        // Link to core program components if provided
        if (component_ids && component_ids.length > 0) {
            for (const cid of component_ids) {
                await databaseService.query(
                    'INSERT INTO project_components (project_id, component_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [project.id, cid]
                );
            }
            project.components = component_ids.map(id => ({ id }));
        } else {
            project.components = [];
        }

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/projects/:id
 * Update a project
 */
router.put('/:id', authenticate, checkPermission('projects.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateProjectSchema.validate(req.body);
        
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        // Check if project exists
        const existingProject = await databaseService.queryOne(
            'SELECT id FROM projects WHERE id = $1',
            [id]
        );

        if (!existingProject) {
            throw new AppError('Project not found', 404);
        }

        // Extract component_ids and donor_ids before building the SQL update
        const { component_ids: newComponentIds, donor_ids: newDonorIds, ...projectFields } = value;

        // If donor_ids is being changed, validate and replace junction rows
        if (newDonorIds && newDonorIds.length > 0) {
            const donorRecords = [];
            for (const did of newDonorIds) {
                const d = await databaseService.queryOne(
                    'SELECT id, name FROM donors WHERE id = $1 AND is_active = true',
                    [did]
                );
                if (!d) throw new AppError(`Donor not found or inactive: ${did}`, 404);
                donorRecords.push(d);
            }
            // Replace junction rows atomically
            await databaseService.query('DELETE FROM project_donors WHERE project_id = $1', [id]);
            for (const did of newDonorIds) {
                await databaseService.query(
                    'INSERT INTO project_donors (project_id, donor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [id, did]
                );
            }
            // Sync legacy donor text column
            projectFields.donor = donorRecords.map(d => d.name).join(', ');
        }

        // Replace component associations if provided
        if (newComponentIds && newComponentIds.length > 0) {
            // Verify all component IDs exist
            for (const cid of newComponentIds) {
                const comp = await databaseService.queryOne(
                    'SELECT id FROM core_program_components WHERE id = $1',
                    [cid]
                );
                if (!comp) {
                    throw new AppError(`Core program component not found: ${cid}`, 404);
                }
            }
            // Replace all associations atomically
            await databaseService.query(
                'DELETE FROM project_components WHERE project_id = $1',
                [id]
            );
            for (const cid of newComponentIds) {
                await databaseService.query(
                    'INSERT INTO project_components (project_id, component_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [id, cid]
                );
            }
        }

        // Build dynamic update query for project fields (skip if no scalar fields remain)
        let project;
        if (Object.keys(projectFields).length > 0) {
            const updates = [];
            const params = [];
            let paramIndex = 1;

            Object.entries(projectFields).forEach(([key, val]) => {
                updates.push(`${key} = $${paramIndex++}`);
                params.push(val);
            });

            updates.push(`updated_by = $${paramIndex++}`);
            params.push(req.user.id);
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            params.push(id);

            const updateQuery = `
                UPDATE projects
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *
            `;
            project = await databaseService.queryOne(updateQuery, params);
        } else {
            project = await databaseService.queryOne('SELECT * FROM projects WHERE id = $1', [id]);
        }

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/financials
 * Get project financial performance (budget, expenditure, burn rate)
 */
router.get('/:id/financials', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const project = await databaseService.queryOne(
            'SELECT id, budget FROM projects WHERE id = $1',
            [id]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Get total expenditure from activities
        const expenditureQuery = `
            SELECT 
                COALESCE(SUM(actual_cost), 0) as total_expenditure,
                COALESCE(SUM(budget), 0) as total_activity_budget
            FROM activities 
            WHERE project_id = $1
        `;
        const { total_expenditure, total_activity_budget } = await databaseService.queryOne(expenditureQuery, [id]);

        // Get budget transfers
        const transfersQuery = `
            SELECT COUNT(*) as transfer_count, COALESCE(SUM(amount), 0) as transfer_total
            FROM activity_budget_transfers 
            WHERE activity_id IN (SELECT id FROM activities WHERE project_id = $1)
        `;
        const { transfer_count, transfer_total } = await databaseService.queryOne(transfersQuery, [id]);

        // Calculate burn rate
        const budget = parseFloat(project.budget) || 0;
        const expenditure = parseFloat(total_expenditure) || 0;
        const burnRate = budget > 0 ? (expenditure / budget * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                budget,
                expenditure,
                burnRate: parseFloat(burnRate),
                remaining: budget - expenditure,
                activityBudget: parseFloat(total_activity_budget),
                transfers: {
                    count: parseInt(transfer_count),
                    total: parseFloat(transfer_total)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/indicators
 * Get project-specific indicators with performance data
 */
router.get('/:id/indicators', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                i.*,
                (i.q1_achieved + i.q2_achieved + i.q3_achieved + i.q4_achieved) as total_achieved,
                (i.q1_target + i.q2_target + i.q3_target + i.q4_target) as annual_target
            FROM indicators i
            WHERE i.project_id = $1
            ORDER BY i.name
        `;

        const indicators = await databaseService.queryMany(query, [id]);

        res.json({
            success: true,
            data: indicators
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/activities
 * Get activities for a specific project
 */
router.get('/:id/activities', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                a.*,
                ta.name as thematic_area_name,
                i.name as indicator_name
            FROM activities a
            LEFT JOIN thematic_areas ta ON a.thematic_area_id = ta.id
            LEFT JOIN indicators i ON a.indicator_id = i.id
            WHERE a.project_id = $1
            ORDER BY a.planned_date DESC
        `;

        const activities = await databaseService.queryMany(query, [id]);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/cases
 * Get recent cases linked to project (privacy-first: NO names)
 */
router.get('/:id/cases', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get recent 10 cases
        const casesQuery = `
            SELECT 
                c.id,
                c.case_number,
                c.case_type_id,
                c.status,
                c.created_at,
                ct.name as case_type_name
            FROM cases c
            LEFT JOIN case_types ct ON c.case_type_id = ct.id
            WHERE c.project_id = $1
            ORDER BY c.created_at DESC
            LIMIT 10
        `;
        const recent = await databaseService.queryMany(casesQuery, [id]);

        // Get statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_cases,
                COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_cases,
                COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_cases
            FROM cases
            WHERE project_id = $1
        `;
        const stats = await databaseService.queryOne(statsQuery, [id]);

        res.json({
            success: true,
            data: {
                recent,
                stats
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/team
 * Get team members assigned to project
 */
router.get('/:id/team', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;

        // For now, return empty array - team management can be added later
        // This would typically join on a project_team table
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/projects/:id/performance
 * Get monthly performance metrics for project
 */
router.get('/:id/performance', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { months = 6 } = req.query;

        // Get monthly snapshots if they exist
        const snapshotsQuery = `
            SELECT 
                snapshot_month,
                performance_rate,
                activity_completion_rate,
                beneficiary_reach_rate,
                burn_rate,
                created_at
            FROM monthly_snapshots
            WHERE project_id = $1
            ORDER BY snapshot_month DESC
            LIMIT $2
        `;
        const snapshots = await databaseService.queryMany(snapshotsQuery, [id, parseInt(months)]);

        // If no snapshots, return null
        if (snapshots.length === 0) {
            res.json({
                success: true,
                data: null
            });
            return;
        }

        // Calculate averages
        const avgProgrammatic = snapshots.reduce((sum, s) => sum + parseFloat(s.performance_rate || 0), 0) / snapshots.length;
        const avgActivity = snapshots.reduce((sum, s) => sum + parseFloat(s.activity_completion_rate || 0), 0) / snapshots.length;
        const avgReach = snapshots.reduce((sum, s) => sum + parseFloat(s.beneficiary_reach_rate || 0), 0) / snapshots.length;
        const avgBurn = snapshots.reduce((sum, s) => sum + parseFloat(s.burn_rate || 0), 0) / snapshots.length;

        res.json({
            success: true,
            data: {
                snapshots,
                averages: {
                    programmatic: avgProgrammatic.toFixed(2),
                    activity: avgActivity.toFixed(2),
                    reach: avgReach.toFixed(2),
                    burn: avgBurn.toFixed(2)
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== GENERIC CRUD ROUTES (Must be LAST) ====================

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
router.delete('/:id', authenticate, checkPermission('projects.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if project exists
        const project = await databaseService.queryOne(
            'SELECT id FROM projects WHERE id = $1',
            [id]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Check if project has associated activities or cases
        const { activity_count } = await databaseService.queryOne(
            'SELECT COUNT(*) as activity_count FROM activities WHERE project_id = $1',
            [id]
        );

        const { case_count } = await databaseService.queryOne(
            'SELECT COUNT(*) as case_count FROM cases WHERE project_id = $1',
            [id]
        );

        if (parseInt(activity_count) > 0 || parseInt(case_count) > 0) {
            throw new AppError(
                'Cannot delete project with associated activities or cases. Please delete them first.',
                400
            );
        }

        // Delete the project
        await databaseService.query('DELETE FROM projects WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
