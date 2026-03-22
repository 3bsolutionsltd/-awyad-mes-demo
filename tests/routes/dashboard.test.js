/**
 * Dashboard Routes — Integration Tests
 *
 * Covers: GET /stats, GET /strategic-hierarchy,
 *         GET /awyad-indicators, GET /overview, GET /thematic-areas,
 *         auth guard 401
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { pgResult } from '../helpers/mockFactory.js';

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
    const { default: dashboardRouter } = await import('../../src/server/routes/dashboard.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/dashboard', dashboardRouter);
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

describe('GET /api/v1/dashboard/stats', () => {
    it('returns overall system statistics', async () => {
        mockDb.queryOne.mockResolvedValueOnce({
            total_strategies: 2,
            total_pillars: 5,
            total_components: 12,
            active_projects: 8,
            total_projects: 10,
            total_awyad_indicators: 15,
            project_indicators: 30,
            total_activities: 120,
            completed_activities: 80,
            total_cases: 45,
            open_cases: 10,
            total_budget: 963000,
            total_expenditure: 450000,
            total_beneficiaries: 5200,
        });

        const res = await request
            .get('/api/v1/dashboard/stats')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.total_strategies).toBe(2);
        expect(res.body.data.overall_burn_rate).toBeTruthy();
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/dashboard/stats');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/dashboard/strategic-hierarchy', () => {
    it('returns empty hierarchy when no strategies exist', async () => {
        // strategies query returns empty
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/dashboard/strategic-hierarchy')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
    });

    it('returns full hierarchy with nested pillars and components', async () => {
        const strategy = { id: 'strat-1', name: 'Strategy A', is_active: true };
        const pillar = { id: 'pillar-1', name: 'Pillar 1', strategy_id: 'strat-1' };
        const component = { id: 'comp-1', name: 'Component 1', pillar_id: 'pillar-1' };
        const project = { id: 'proj-1', name: 'Project X', budget: 100000, expenditure: 50000 };

        mockDb.query
            .mockResolvedValueOnce(pgResult([strategy]))    // strategies
            .mockResolvedValueOnce(pgResult([pillar]))       // pillars for strat-1
            .mockResolvedValueOnce(pgResult([component]))    // components for pillar-1
            .mockResolvedValueOnce(pgResult([project]));     // projects for comp-1

        const res = await request
            .get('/api/v1/dashboard/strategic-hierarchy')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Strategy A');
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/dashboard/strategic-hierarchy');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/dashboard/awyad-indicators', () => {
    it('returns empty list when no AWYAD indicators exist', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([])); // indicators

        const res = await request
            .get('/api/v1/dashboard/awyad-indicators')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
        expect(res.body.count).toBe(0);
    });

    it('returns AWYAD indicators with linked project indicator counts', async () => {
        const indicator = {
            id: 'ind-1',
            name: 'Beneficiaries Reached',
            indicator_scope: 'awyad',
            annual_target: 1000,
            achieved: 450,
            q1_target: 250, q1_achieved: 200,
            q2_target: 250, q2_achieved: 250,
            q3_target: 250, q3_achieved: 0,
            q4_target: 250, q4_achieved: 0,
        };

        mockDb.query
            .mockResolvedValueOnce(pgResult([indicator]))  // AWYAD indicators
            .mockResolvedValueOnce(pgResult([]));           // linked project indicators for ind-1

        const res = await request
            .get('/api/v1/dashboard/awyad-indicators')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].quarterly_data).toBeTruthy();
    });
});

describe('GET /api/v1/dashboard/overview', () => {
    it('returns complete dashboard overview', async () => {
        // Promise.all fires 5 queries, all concurrently:
        // 1 queryOne (stats) + 4 query calls
        mockDb.queryOne.mockResolvedValueOnce({
            active_strategies: 2,
            active_projects: 8,
            awyad_indicators: 15,
            project_indicators: 30,
            total_activities: 120,
            open_cases: 10,
            total_budget: 963000,
            total_expenditure: 450000,
        });
        mockDb.query
            .mockResolvedValueOnce(pgResult([]))  // strategies
            .mockResolvedValueOnce(pgResult([]))  // awyad indicators
            .mockResolvedValueOnce(pgResult([]))  // recent activities
            .mockResolvedValueOnce(pgResult([])); // active cases

        const res = await request
            .get('/api/v1/dashboard/overview')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.stats).toBeTruthy();
        expect(res.body.data.strategies).toEqual([]);
        expect(res.body.data.recent_activities).toEqual([]);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/dashboard/overview');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/dashboard/thematic-areas', () => {
    it('returns all thematic areas', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([
            { id: 'ta-1', name: 'Health', indicator_count: '5' },
            { id: 'ta-2', name: 'Education', indicator_count: '3' },
        ]));

        const res = await request
            .get('/api/v1/dashboard/thematic-areas')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
    });
});
