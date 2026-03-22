/**
 * Activities Routes — Integration Tests
 *
 * Covers: GET / (list, filters, pagination), POST / (create, validation),
 *         GET /:id, PUT /:id (lock guard), DELETE /:id (lock guard, transfer guard),
 *         PATCH /:id/lock (lock / unlock)
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockActivity,
    pgResult,
    TEST_ACTIVITY_ID,
    TEST_INDICATOR_ID,
    TEST_PROJECT_ID,
} from '../helpers/mockFactory.js';

// ── Mocks (must precede any dynamic imports) ──────────────────────────────────

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

// Activities route imports extra services — mock them to avoid side effects
jest.unstable_mockModule('../../src/server/services/currencyService.js', () => ({
    default: { getRate: jest.fn(), convert: jest.fn(), addRate: jest.fn() },
}));

jest.unstable_mockModule('../../src/server/services/budgetTransferService.js', () => ({
    default: { createTransfer: jest.fn(), getTransfers: jest.fn() },
}));

jest.unstable_mockModule('../../src/server/services/activityService.js', () => ({
    default: { createActivity: jest.fn(), updateActivity: jest.fn() },
}));

// ── App setup ─────────────────────────────────────────────────────────────────

let request;

beforeAll(async () => {
    const { default: express } = await import('express');
    const { default: activitiesRouter } = await import('../../src/server/routes/activities.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/activities', activitiesRouter);
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

describe('GET /api/v1/activities', () => {
    it('returns paginated activity list', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '2' });
        mockDb.query.mockResolvedValueOnce(pgResult([mockActivity(), mockActivity()]));

        const res = await request
            .get('/api/v1/activities')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.total).toBe(2);
    });

    it('filters by project_id', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
        mockDb.query.mockResolvedValueOnce(pgResult([mockActivity()]));

        const res = await request
            .get(`/api/v1/activities?project_id=${TEST_PROJECT_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/activities');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/activities', () => {
    const validBody = {
        project_id: TEST_PROJECT_ID,
        indicator_id: TEST_INDICATOR_ID,
        activity_name: 'Community Training Workshop',
        planned_date: '2025-06-01',
        location: 'Kampala',
    };

    it('creates an activity with valid data', async () => {
        // queryOne: indicator check, project check, insert RETURNING
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_INDICATOR_ID })
            .mockResolvedValueOnce({ id: TEST_PROJECT_ID })
            .mockResolvedValueOnce(mockActivity());

        const res = await request
            .post('/api/v1/activities')
            .set('Authorization', 'Bearer valid-token')
            .send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeTruthy();
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request
            .post('/api/v1/activities')
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_name: 'Test' }); // missing project_id, indicator_id, etc.

        expect(res.status).toBe(400);
    });

    it('returns 404 when indicator does not exist', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null); // indicator not found

        const res = await request
            .post('/api/v1/activities')
            .set('Authorization', 'Bearer valid-token')
            .send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/indicator/i);
    });

    it('returns 404 when project does not exist', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_INDICATOR_ID })
            .mockResolvedValueOnce(null); // project not found

        const res = await request
            .post('/api/v1/activities')
            .set('Authorization', 'Bearer valid-token')
            .send(validBody);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/project/i);
    });

    it('returns 401 without token', async () => {
        const res = await request.post('/api/v1/activities').send(validBody);
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/activities/:id', () => {
    it('returns an activity by id', async () => {
        mockDb.queryOne.mockResolvedValueOnce(mockActivity());
        mockDb.query.mockResolvedValueOnce(pgResult([])); // budget_transfers

        const res = await request
            .get(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 for unknown activity id', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .get('/api/v1/activities/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/v1/activities/:id', () => {
    it('updates an unlocked activity', async () => {
        // existing (not locked), indicator check skipped (no indicator_id in body),
        // project check skipped, update RETURNING
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false })
            .mockResolvedValueOnce(mockActivity({ activity_name: 'Updated Name' }));

        const res = await request
            .put(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_name: 'Updated Name' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when activity not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .put(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_name: 'Updated' });

        expect(res.status).toBe(404);
    });

    it('returns 403 when activity is locked', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: true });

        const res = await request
            .put(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_name: 'Changed' });

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/locked/i);
    });
});

describe('DELETE /api/v1/activities/:id', () => {
    it('deletes an unlocked activity with no transfers', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false })
            .mockResolvedValueOnce({ count: '0' }); // no transfers
        mockDb.query.mockResolvedValueOnce(pgResult([])); // DELETE

        const res = await request
            .delete(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when activity not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .delete(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });

    it('returns 403 when activity is locked', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: true });

        const res = await request
            .delete(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(403);
    });

    it('returns 400 when activity has budget transfers', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false })
            .mockResolvedValueOnce({ count: '3' }); // has transfers

        const res = await request
            .delete(`/api/v1/activities/${TEST_ACTIVITY_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/transfer/i);
    });
});

describe('PATCH /api/v1/activities/:id/lock', () => {
    it('locks an activity', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID })
            .mockResolvedValueOnce({
                id: TEST_ACTIVITY_ID,
                activity_name: 'Test Activity',
                is_locked: true,
                locked_by: 'user-1',
                locked_at: new Date().toISOString(),
            });

        const res = await request
            .patch(`/api/v1/activities/${TEST_ACTIVITY_ID}/lock`)
            .set('Authorization', 'Bearer valid-token')
            .send({ locked: true });

        expect(res.status).toBe(200);
        expect(res.body.data.is_locked).toBe(true);
    });

    it('unlocks an activity', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID })
            .mockResolvedValueOnce({
                id: TEST_ACTIVITY_ID,
                activity_name: 'Test Activity',
                is_locked: false,
                locked_by: null,
                locked_at: null,
            });

        const res = await request
            .patch(`/api/v1/activities/${TEST_ACTIVITY_ID}/lock`)
            .set('Authorization', 'Bearer valid-token')
            .send({ locked: false });

        expect(res.status).toBe(200);
        expect(res.body.data.is_locked).toBe(false);
    });

    it('returns 400 when locked is not a boolean', async () => {
        const res = await request
            .patch(`/api/v1/activities/${TEST_ACTIVITY_ID}/lock`)
            .set('Authorization', 'Bearer valid-token')
            .send({ locked: 'yes' });

        expect(res.status).toBe(400);
    });

    it('returns 404 when activity not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .patch(`/api/v1/activities/${TEST_ACTIVITY_ID}/lock`)
            .set('Authorization', 'Bearer valid-token')
            .send({ locked: true });

        expect(res.status).toBe(404);
    });
});
