/**
 * Indicators Routes — Integration Tests
 *
 * Covers: GET / (list + filters), GET /:id (scope-based linked data),
 *         POST / (awyad + project scope validation),
 *         PUT /:id, DELETE /:id (dependency check)
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockIndicator,
    pgResult,
    TEST_INDICATOR_ID,
    TEST_PROJECT_ID,
    TEST_THEMATIC_AREA_ID,
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

jest.unstable_mockModule('../../src/server/services/indicatorService.js', () => ({
    default: { getIndicators: jest.fn(), updateAchieved: jest.fn() },
}));

jest.unstable_mockModule('../../src/server/services/indicatorMappingService.js', () => ({
    default: { createMapping: jest.fn(), deleteMapping: jest.fn() },
}));

// ── App setup ─────────────────────────────────────────────────────────────────

let request;

beforeAll(async () => {
    const { default: express } = await import('express');
    const { default: indicatorsRouter } = await import('../../src/server/routes/indicators.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/indicators', indicatorsRouter);
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

describe('GET /api/v1/indicators', () => {
    it('returns paginated indicator list', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '3' });
        mockDb.query.mockResolvedValueOnce(pgResult([mockIndicator(), mockIndicator()]));

        const res = await request
            .get('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.total).toBe(3);
    });

    it('filters by indicator_scope', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
        mockDb.query.mockResolvedValueOnce(pgResult([mockIndicator({ indicator_scope: 'awyad' })]));

        const res = await request
            .get('/api/v1/indicators?indicator_scope=awyad')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/indicators');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/indicators/:id', () => {
    it('returns a project-scoped indicator with awyad link', async () => {
        const indicator = mockIndicator({ indicator_scope: 'project' });
        mockDb.queryOne
            .mockResolvedValueOnce(indicator) // main query
            .mockResolvedValueOnce(null);     // no awyad link

        const res = await request
            .get(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.quarterly_data).toBeTruthy();
    });

    it('returns an awyad-scoped indicator with linked project indicators', async () => {
        const indicator = mockIndicator({ indicator_scope: 'awyad' });
        mockDb.queryOne.mockResolvedValueOnce(indicator);
        mockDb.query.mockResolvedValueOnce(pgResult([])); // no linked indicators

        const res = await request
            .get(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
    });

    it('returns 404 for unknown id', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .get('/api/v1/indicators/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('POST /api/v1/indicators', () => {
    it('creates an AWYAD-scoped indicator', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_THEMATIC_AREA_ID })  // thematic area check
            .mockResolvedValueOnce(mockIndicator({ indicator_scope: 'awyad' })); // insert

        const res = await request
            .post('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token')
            .send({
                indicator_scope: 'awyad',
                name: 'Beneficiaries Reached',
                indicator_level: 'Output',
                thematic_area_id: TEST_THEMATIC_AREA_ID,
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('creates a project-scoped indicator', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_PROJECT_ID })  // project check
            .mockResolvedValueOnce(mockIndicator({ indicator_scope: 'project' })); // insert

        const res = await request
            .post('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token')
            .send({
                indicator_scope: 'project',
                name: 'Project Output',
                indicator_level: 'Output',
                project_id: TEST_PROJECT_ID,
                result_area: 'Health Services',
            });

        expect(res.status).toBe(201);
    });

    it('returns 400 when AWYAD indicator lacks thematic_area_id', async () => {
        const res = await request
            .post('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token')
            .send({
                indicator_scope: 'awyad',
                name: 'Missing Area',
                indicator_level: 'Output',
                // no thematic_area_id
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/thematic_area_id/i);
    });

    it('returns 400 when project indicator lacks project_id', async () => {
        const res = await request
            .post('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token')
            .send({
                indicator_scope: 'project',
                name: 'Missing Project',
                indicator_level: 'Output',
                result_area: 'Health',
                // no project_id
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/project_id/i);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request
            .post('/api/v1/indicators')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'incomplete' });

        expect(res.status).toBe(400);
    });
});

describe('PUT /api/v1/indicators/:id', () => {
    it('updates an indicator', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_INDICATOR_ID, indicator_scope: 'project' })
            .mockResolvedValueOnce(mockIndicator({ name: 'Updated Indicator' }));

        const res = await request
            .put(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Updated Indicator' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when indicator not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .put(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Updated' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/v1/indicators/:id', () => {
    it('deletes an indicator with no activities', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_INDICATOR_ID })
            .mockResolvedValueOnce({ count: '0' }); // no activities
        mockDb.query.mockResolvedValueOnce(pgResult([])); // DELETE

        const res = await request
            .delete(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 400 when indicator has associated activities', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: TEST_INDICATOR_ID })
            .mockResolvedValueOnce({ count: '5' }); // has activities

        const res = await request
            .delete(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/activities/i);
    });

    it('returns 404 when indicator not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .delete(`/api/v1/indicators/${TEST_INDICATOR_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});
