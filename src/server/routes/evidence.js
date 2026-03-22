/**
 * Evidence / File Upload Routes
 * POST   /api/v1/evidence/:activityId        — upload file(s)
 * GET    /api/v1/evidence/:activityId        — list evidence for activity
 * DELETE /api/v1/evidence/:activityId/:evidenceId — delete a file
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import databaseService from '../services/databaseService.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import AppError from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'evidence');

// Ensure directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'video/mp4', 'video/quicktime'
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `evidence-${unique}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
        }
    }
});

const router = express.Router({ mergeParams: true });

/**
 * POST /api/v1/evidence/:activityId
 * Upload one or more evidence files for an activity
 */
router.post('/:activityId', authenticate, checkPermission('activities.update'), upload.array('files', 10), async (req, res, next) => {
    try {
        const { activityId } = req.params;

        const activity = await databaseService.queryOne(
            'SELECT id, is_locked FROM activities WHERE id = $1',
            [activityId]
        );
        if (!activity) throw new AppError('Activity not found', 404);
        if (activity.is_locked) throw new AppError('Activity is locked and cannot be modified', 403);

        if (!req.files || req.files.length === 0) {
            throw new AppError('No files uploaded', 400);
        }

        const userId = req.user.userId || req.user.id || null;
        const { description } = req.body;

        const inserted = [];
        for (const file of req.files) {
            const row = await databaseService.queryOne(
                `INSERT INTO activity_evidence
                    (activity_id, file_name, original_name, file_path, file_size, mime_type, description, uploaded_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                 RETURNING *`,
                [
                    activityId,
                    file.filename,
                    file.originalname,
                    `/uploads/evidence/${file.filename}`,
                    file.size,
                    file.mimetype,
                    description || null,
                    userId
                ]
            );
            inserted.push(row);
        }

        res.status(201).json({
            success: true,
            message: `${inserted.length} file(s) uploaded successfully`,
            data: inserted
        });
    } catch (error) {
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(f => {
                try { fs.unlinkSync(f.path); } catch (_) { /* ignore */ }
            });
        }
        next(error);
    }
});

/**
 * GET /api/v1/evidence/:activityId
 * List all evidence files for an activity
 */
router.get('/:activityId', authenticate, checkPermission('activities.read'), async (req, res, next) => {
    try {
        const { activityId } = req.params;

        const activity = await databaseService.queryOne(
            'SELECT id FROM activities WHERE id = $1',
            [activityId]
        );
        if (!activity) throw new AppError('Activity not found', 404);

        const evidence = await databaseService.query(
            `SELECT ae.*, u.username as uploaded_by_username
             FROM activity_evidence ae
             LEFT JOIN users u ON ae.uploaded_by = u.id
             WHERE ae.activity_id = $1
             ORDER BY ae.uploaded_at DESC`,
            [activityId]
        );

        res.json({ success: true, data: evidence });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/v1/evidence/:activityId/:evidenceId
 * Delete a single evidence file
 */
router.delete('/:activityId/:evidenceId', authenticate, checkPermission('activities.update'), async (req, res, next) => {
    try {
        const { activityId, evidenceId } = req.params;

        const activity = await databaseService.queryOne(
            'SELECT id, is_locked FROM activities WHERE id = $1',
            [activityId]
        );
        if (!activity) throw new AppError('Activity not found', 404);
        if (activity.is_locked) throw new AppError('Activity is locked and cannot be modified', 403);

        const evidence = await databaseService.queryOne(
            'SELECT * FROM activity_evidence WHERE id = $1 AND activity_id = $2',
            [evidenceId, activityId]
        );
        if (!evidence) throw new AppError('Evidence file not found', 404);

        // Remove physical file
        const filePath = path.join(process.cwd(), 'public', evidence.file_path);
        try { fs.unlinkSync(filePath); } catch (_) { /* file may already be gone */ }

        await databaseService.query(
            'DELETE FROM activity_evidence WHERE id = $1',
            [evidenceId]
        );

        res.json({ success: true, message: 'Evidence file deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
