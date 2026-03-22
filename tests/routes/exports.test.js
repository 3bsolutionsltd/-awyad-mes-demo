/**
 * Exports Routes — Integration Tests
 *
 * Covers: GET /activities (csv + excel), GET /cases, GET /projects,
 *         invalid format 400, auth guard 401
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
    const { default: exportsRouter } = await import('../../src/server/routes/exports.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/exports', exportsRouter);
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

describe('GET /api/v1/exports/activities', () => {
    it('returns an Excel file by default', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/activities')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/spreadsheetml/);
        expect(res.headers['content-disposition']).toMatch(/\.xlsx/);
    });

    it('returns a CSV file when format=csv', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/activities?format=csv')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
        expect(res.headers['content-disposition']).toMatch(/\.csv/);
    });

    it('returns 400 for an invalid format', async () => {
        const res = await request
            .get('/api/v1/exports/activities?format=pdf')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/format/i);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/exports/activities');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/exports/cases', () => {
    it('returns an Excel file', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/cases')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-disposition']).toMatch(/cases/);
    });

    it('returns a CSV file when format=csv', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/cases?format=csv')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/exports/cases');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/exports/projects', () => {
    it('returns an Excel file', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/projects')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-disposition']).toMatch(/projects/);
    });

    it('returns a CSV when format=csv', async () => {
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .get('/api/v1/exports/projects?format=csv')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/csv/);
    });

    it('returns 400 for invalid format', async () => {
        const res = await request
            .get('/api/v1/exports/projects?format=json')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(400);
    });
});
