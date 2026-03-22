/**
 * Integrations Routes — Integration Tests
 *
 * Covers: POST /kobo/webhook (no auth required),
 *         GET /kobo/submissions, POST /kobo/:id/map (lock guard),
 *         GET /powerbi/activities, GET /powerbi/indicators, GET /powerbi/projects
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockActivity,
    mockKoboSubmission,
    pgResult,
    TEST_ACTIVITY_ID,
    TEST_SUBMISSION_ID,
} from '../helpers/mockFactory.js';

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
    const { default: integrationsRouter } = await import('../../src/server/routes/integrations.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/integrations', integrationsRouter);
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

describe('POST /api/v1/integrations/kobo/webhook', () => {
    const koboPayload = {
        _uuid: 'kobo-uuid-001',
        _xform_id_string: 'form_abc',
        question1: 'Answer 1',
        question2: 42,
    };

    it('accepts a Kobo webhook push without authentication', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([])); // INSERT ON CONFLICT DO NOTHING

        const res = await request
            .post('/api/v1/integrations/kobo/webhook')
            .send(koboPayload);
        // No Authorization header — endpoint is public

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/received/i);
    });

    it('returns 400 for an invalid (non-object) payload', async () => {
        const res = await request
            .post('/api/v1/integrations/kobo/webhook')
            .set('Content-Type', 'application/json')
            .send('"just a string"');

        expect(res.status).toBe(400);
    });
});

describe('GET /api/v1/integrations/kobo/submissions', () => {
    it('returns a list of Kobo submissions', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([mockKoboSubmission(), mockKoboSubmission()]));
        mockDb.queryOne.mockResolvedValueOnce({ total: '2' });

        const res = await request
            .get('/api/v1/integrations/kobo/submissions')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('filters by status', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([mockKoboSubmission({ status: 'pending' })]));
        mockDb.queryOne.mockResolvedValueOnce({ total: '1' });

        const res = await request
            .get('/api/v1/integrations/kobo/submissions?status=pending')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/integrations/kobo/submissions');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/integrations/kobo/:id/map', () => {
    it('maps a submission to an unlocked activity', async () => {
        const updatedSub = mockKoboSubmission({ status: 'mapped', mapped_to: TEST_ACTIVITY_ID });
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_SUBMISSION_ID })           // submission exists
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: false }) // activity unlocked
            .mockResolvedValueOnce(updatedSub);                          // UPDATE RETURNING

        const res = await request
            .post(`/api/v1/integrations/kobo/${TEST_SUBMISSION_ID}/map`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_id: TEST_ACTIVITY_ID });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 400 when activity_id is missing', async () => {
        const res = await request
            .post(`/api/v1/integrations/kobo/${TEST_SUBMISSION_ID}/map`)
            .set('Authorization', 'Bearer valid-token')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/activity_id/i);
    });

    it('returns 404 when submission not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .post(`/api/v1/integrations/kobo/${TEST_SUBMISSION_ID}/map`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_id: TEST_ACTIVITY_ID });

        expect(res.status).toBe(404);
    });

    it('returns 403 when activity is locked', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_SUBMISSION_ID })
            .mockResolvedValueOnce({ id: TEST_ACTIVITY_ID, is_locked: true });

        const res = await request
            .post(`/api/v1/integrations/kobo/${TEST_SUBMISSION_ID}/map`)
            .set('Authorization', 'Bearer valid-token')
            .send({ activity_id: TEST_ACTIVITY_ID });

        expect(res.status).toBe(403);
    });
});

describe('GET /api/v1/integrations/powerbi/activities', () => {
    it('returns flat activity data for Power BI', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([
            { id: 'a1', activity_name: 'Training', status: 'Completed', total_beneficiaries: 50 },
        ]));

        const res = await request
            .get('/api/v1/integrations/powerbi/activities')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/integrations/powerbi/activities');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/integrations/powerbi/indicators', () => {
    it('returns flat indicator data for Power BI', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([
            { id: 'i1', name: 'Output 1', achieved: 100, annual_target: 200 },
        ]));

        const res = await request
            .get('/api/v1/integrations/powerbi/indicators')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('GET /api/v1/integrations/powerbi/projects', () => {
    it('returns flat project data for Power BI', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([
            { id: 'p1', name: 'Health Project', budget: 100000, expenditure: 45000 },
        ]));

        const res = await request
            .get('/api/v1/integrations/powerbi/projects')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
