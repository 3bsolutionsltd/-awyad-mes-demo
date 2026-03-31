import express from 'express';
import Joi from 'joi';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

const createDonorSchema = Joi.object({
    name:          Joi.string().required().max(150),
    short_name:    Joi.string().max(50).allow('', null),
    description:   Joi.string().allow('', null),
    website:       Joi.string().uri().max(255).allow('', null),
    is_active:     Joi.boolean().default(true),
    display_order: Joi.number().integer().min(0).default(0),
});

const updateDonorSchema = Joi.object({
    name:          Joi.string().max(150),
    short_name:    Joi.string().max(50).allow('', null),
    description:   Joi.string().allow('', null),
    website:       Joi.string().uri().max(255).allow('', null),
    is_active:     Joi.boolean(),
    display_order: Joi.number().integer().min(0),
}).min(1);

/**
 * GET /api/v1/donors
 * List donors (active only by default)
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { include_inactive = 'false' } = req.query;

        const whereClause = include_inactive === 'true' ? '' : 'WHERE is_active = true';

        const donors = await databaseService.queryMany(
            `SELECT id, name, short_name, description, website, is_active, display_order
             FROM donors
             ${whereClause}
             ORDER BY display_order ASC, name ASC`
        );

        res.json({ success: true, data: donors, count: donors.length });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/donors/:id
 * Get a single donor with linked project count
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        const donor = await databaseService.queryOne(
            `SELECT d.*,
                    (SELECT COUNT(*) FROM project_donors WHERE donor_id = d.id) AS project_count
             FROM donors d
             WHERE d.id = $1`,
            [id]
        );

        if (!donor) throw new AppError('Donor not found', 404);

        res.json({ success: true, data: donor });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/donors
 * Create a new donor
 */
router.post('/', authenticate, checkPermission('donors.create'), async (req, res, next) => {
    try {
        const { error, value } = createDonorSchema.validate(req.body);
        if (error) throw new AppError(error.details[0].message, 400);

        const { name, short_name, description, website, is_active, display_order } = value;

        const donor = await databaseService.queryOne(
            `INSERT INTO donors (name, short_name, description, website, is_active, display_order, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, short_name || null, description || null, website || null, is_active, display_order, req.user.id]
        );

        res.status(201).json({ success: true, message: 'Donor created successfully', data: donor });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/v1/donors/:id
 * Update a donor
 */
router.put('/:id', authenticate, checkPermission('donors.update'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateDonorSchema.validate(req.body);
        if (error) throw new AppError(error.details[0].message, 400);

        const existing = await databaseService.queryOne('SELECT id FROM donors WHERE id = $1', [id]);
        if (!existing) throw new AppError('Donor not found', 404);

        const updates = [];
        const params = [];
        let paramIndex = 1;

        Object.entries(value).forEach(([key, val]) => {
            updates.push(`${key} = $${paramIndex++}`);
            params.push(val);
        });
        updates.push(`updated_at = NOW()`);
        params.push(id);

        const donor = await databaseService.queryOne(
            `UPDATE donors SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        // If name was updated, keep projects.donor text in sync via junction
        if (value.name) {
            await databaseService.query(
                `UPDATE projects SET donor = $1
                 WHERE id IN (SELECT project_id FROM project_donors WHERE donor_id = $2)`,
                [value.name, id]
            );
        }

        res.json({ success: true, message: 'Donor updated successfully', data: donor });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/donors/:id
 * Soft-delete a donor (sets is_active = false)
 * Returns 409 if the donor has active projects
 */
router.delete('/:id', authenticate, checkPermission('donors.delete'), async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await databaseService.queryOne('SELECT id FROM donors WHERE id = $1', [id]);
        if (!existing) throw new AppError('Donor not found', 404);

        const { count } = await databaseService.queryOne(
            `SELECT COUNT(*) as count FROM projects p
             JOIN project_donors pd ON pd.project_id = p.id
             WHERE pd.donor_id = $1 AND p.status NOT IN ('Completed', 'Cancelled')`,
            [id]
        );

        if (parseInt(count) > 0) {
            throw new AppError(
                `Cannot deactivate donor: ${count} active project(s) are linked to it. Reassign or complete them first.`,
                409
            );
        }

        await databaseService.query(
            `UPDATE donors SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [id]
        );

        res.json({ success: true, message: 'Donor deactivated successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
