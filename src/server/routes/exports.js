/**
 * Export Routes — Activities, Cases, Projects as Excel / CSV
 * GET /api/v1/exports/activities   ?format=csv|excel&project_id=&status=
 * GET /api/v1/exports/cases        ?format=csv|excel&project_id=&status=
 * GET /api/v1/exports/projects     ?format=csv|excel
 */
import express from 'express';
import * as XLSX from 'xlsx';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// ── helpers ────────────────────────────────────────────────────────────────

function buildFilename(entity, format) {
    const ts = new Date().toISOString().slice(0, 10);
    return `awyad_${entity}_${ts}.${format === 'csv' ? 'csv' : 'xlsx'}`;
}

function sendExcel(res, rows, sheetName, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
}

function sendCsv(res, rows, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
}

function send(res, rows, sheetName, entity, format) {
    const filename = buildFilename(entity, format);
    if (format === 'csv') {
        sendCsv(res, rows, filename);
    } else {
        sendExcel(res, rows, sheetName, filename);
    }
}

// ── activities export ──────────────────────────────────────────────────────

router.get('/activities', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { format = 'excel', project_id, status, indicator_id } = req.query;
        if (!['csv', 'excel'].includes(format)) throw new AppError('Invalid format. Use csv or excel', 400);

        const filters = [];
        const params = [];
        let i = 1;

        if (project_id) { filters.push(`a.project_id = $${i++}`); params.push(project_id); }
        if (status)     { filters.push(`a.status = $${i++}`);      params.push(status); }
        if (indicator_id) { filters.push(`a.indicator_id = $${i++}`); params.push(indicator_id); }

        const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const rows = await databaseService.query(
            `SELECT
                a.id,
                a.activity_name,
                a.status,
                a.planned_date,
                a.completion_date,
                a.location,
                a.latitude,
                a.longitude,
                a.beneficiary_id,
                a.is_locked,
                a.budget,
                a.actual_cost,
                a.currency,
                a.total_beneficiaries,
                a.pwds_male + a.pwds_female + a.pwds_other AS total_pwd,
                a.notes,
                p.name  AS project_name,
                i.name  AS indicator_name,
                ta.name AS thematic_area,
                u.username AS created_by
             FROM activities a
             LEFT JOIN projects p      ON a.project_id      = p.id
             LEFT JOIN indicators i    ON a.indicator_id    = i.id
             LEFT JOIN thematic_areas ta ON a.thematic_area_id = ta.id
             LEFT JOIN users u          ON a.created_by      = u.id
             ${where}
             ORDER BY a.planned_date DESC`,
            params
        );

        send(res, rows.rows, 'Activities', 'activities', format);
    } catch (error) {
        next(error);
    }
});

// ── cases export ───────────────────────────────────────────────────────────

router.get('/cases', authenticate, checkPermission('cases.read'), async (req, res, next) => {
    try {
        const { format = 'excel', project_id, status } = req.query;
        if (!['csv', 'excel'].includes(format)) throw new AppError('Invalid format. Use csv or excel', 400);

        const filters = [];
        const params = [];
        let i = 1;

        if (project_id) { filters.push(`c.project_id = $${i++}`); params.push(project_id); }
        if (status)     { filters.push(`c.status = $${i++}`);      params.push(status); }

        const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const rows = await databaseService.query(
            `SELECT
                c.id,
                c.case_number,
                c.status,
                c.severity,
                c.date_reported,
                c.closure_date,
                c.location,
                c.gender,
                c.age_group,
                c.nationality,
                c.has_disability,
                c.disability_status,
                c.support_offered,
                c.referrals,
                c.follow_up_date,
                c.notes,
                p.name AS project_name,
                u.username AS created_by
             FROM cases c
             LEFT JOIN projects p ON c.project_id = p.id
             LEFT JOIN users    u ON c.created_by  = u.id
             ${where}
             ORDER BY c.date_reported DESC`,
            params
        );

        send(res, rows.rows, 'Cases', 'cases', format);
    } catch (error) {
        next(error);
    }
});

// ── projects export ────────────────────────────────────────────────────────

router.get('/projects', authenticate, checkPermission('projects.read'), async (req, res, next) => {
    try {
        const { format = 'excel' } = req.query;
        if (!['csv', 'excel'].includes(format)) throw new AppError('Invalid format. Use csv or excel', 400);

        const rows = await databaseService.query(
            `SELECT
                p.id,
                p.name,
                p.description,
                p.status,
                p.start_date,
                p.end_date,
                p.budget,
                p.expenditure,
                CASE WHEN p.budget > 0 THEN ROUND(p.expenditure / p.budget * 100, 2) ELSE 0 END AS burn_rate_pct,
                p.donor,
                p.location,
                p.created_at
             FROM projects p
             ORDER BY p.start_date DESC`,
            []
        );

        send(res, rows.rows, 'Projects', 'projects', format);
    } catch (error) {
        next(error);
    }
});

export default router;
