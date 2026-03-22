/**
 * Evidence Routes — Integration Tests
 *
 * Covers: GET /:activityId (list files),
 *         DELETE /:activityId/:evidenceId (lock guard, not found),
 *         POST /:activityId (auth guard, lock guard, no files 400)
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockActivity,
    pgResult,
    TEST_ACTIVITY_ID,
} from '../helpers/mockFactory.js';

const TEST_EVIDENCE_ID = 'ev000000-0000-0000-0000-000000000001';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDb = {
    query: jest.fn(),
    queryOne: jest.fn(),
};

const mockAuthSvc = {
    verifyAccessToken: jest.fn().mockReturnValue({
        userId: 'user-1',
        email: 'admin@awyad.org',
        roles: [],
    }),
};

jest.unstable_mockModule('../../src/server/services/databaseService.js', () => ({
    default: mockDb,
}));

jest.unstable_mockModule('../../src/server/services/authService.js', () => ({
    default: mockAuthSvc,
}));

jest.unstable_mockModule('../../src/server/utils/authorization.js', () => ({
    hasPermission: jest.fn().mockResolvedValue(true),
    hasAnyPermission: jest.fn().mockResolvedValue(true),
    hasRole: jest.fn().mockResolvedValue(true),
}));

// ── App setup ─────────────────────────────────────────────────────────────────

let request;

beforeAll(async () => {
    const { default: express } = await import('express');
    const { default: evidenceRouter } = await import('../../src/server/routes/evidence.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/evidence', evidenceRouter);
    app.use((err, _req, res, _next) => {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    const supertest = (await import('supertest')).default;
    request = supertest(app);
});

beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSvc.verifyAccessToken.mockReturnValue({
        userId: 'user-1',
        email: 'admin@awyad.org',
        roles: [],
    });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/evidence/:activityId', () => {
    it('returns evidence list for an activity', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID }); // activity exists
        mockDb.query.mockResolvedValueOnce(pgResult([
            { id: TEST_EVIDENCE_ID, file_name: 'report.pdf', mime_type: 'application/pdf', file_size: 1024 },
        ]));

        const res = await request
            .get(`/api/v1/evidence/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when activity does not exist', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .get(`/api/v1/evidence/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
        const res = await request.get(`/api/v1/evidence/${TEST_ACTIVITY_ID}`);
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/evidence/:activityId', () => {
    it('returns 401 without token', async () => {
        const res = await request.post(`/api/v1/evidence/${TEST_ACTIVITY_ID}`);
        expect(res.status).toBe(401);
    });

    it('returns 404 when activity not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .post(`/api/v1/evidence/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .attach('files', Buffer.from('test content'), {
                filename: 'test.pdf',
                contentType: 'application/pdf',
            });

        expect(res.status).toBe(404);
    });

    it('returns 403 when activity is locked', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: true });

        const res = await request
            .post(`/api/v1/evidence/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .attach('files', Buffer.from('content'), {
                filename: 'doc.pdf',
                contentType: 'application/pdf',
            });

        expect(res.status).toBe(403);
    });

    it('returns 400 when no files are attached', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false });

        const res = await request
            .post(`/api/v1/evidence/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');
        // No files attached — multer will parse empty multipart or plain json

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/evidence/:activityId/:evidenceId', () => {
    it('deletes an evidence file', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false }) // activity
            .mockResolvedValueOnce({ id: TEST_EVIDENCE_ID, file_path: '/uploads/evidence/test.pdf' }); // evidence
        mockDb.query.mockResolvedValueOnce(pgResult([])); // DELETE

        const res = await request
            .delete(`/api/v1/evidence/${TEST_ACTIVITY_ID}/${TEST_EVIDENCE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when activity not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .delete(`/api/v1/evidence/${TEST_ACTIVITY_ID}/${TEST_EVIDENCE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });

    it('returns 403 when activity is locked', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: true });

        const res = await request
            .delete(`/api/v1/evidence/${TEST_ACTIVITY_ID}/${TEST_EVIDENCE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(403);
    });

    it('returns 404 when evidence file not found', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false })
            .mockResolvedValueOnce(null); // evidence not found

        const res = await request
            .delete(`/api/v1/evidence/${TEST_ACTIVITY_ID}/${TEST_EVIDENCE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });

    it('returns 401 without token', async () => {
        const res = await request.delete(`/api/v1/evidence/${TEST_ACTIVITY_ID}/${TEST_EVIDENCE_ID}`);
        expect(res.status).toBe(401);
    });
});
