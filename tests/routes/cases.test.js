/**
 * Cases Routes — Integration Tests
 *
 * Covers: GET / (list), GET /:id, POST / (create + validation),
 *         PUT /:id, DELETE /:id
 *
 * Note: The cases route delegates all business logic to caseService.
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockCase,
    TEST_CASE_ID,
    TEST_PROJECT_ID,
} from '../helpers/mockFactory.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCaseService = {
    createCase: jest.fn(),
    getCases: jest.fn(),
    getCaseById: jest.fn(),
    updateCase: jest.fn(),
    deleteCase: jest.fn(),
};

const mockCaseTypeService = {
    getAllTypes: jest.fn(),
    getActiveTypes: jest.fn(),
    getTypeById: jest.fn(),
    createType: jest.fn(),
    updateType: jest.fn(),
    deleteType: jest.fn(),
    reorderTypes: jest.fn(),
};

const mockCaseStatisticsService = {
    getDashboardStats: jest.fn(),
    getStatsByType: jest.fn(),
    getStatsByCategory: jest.fn(),
    getStatsByProject: jest.fn(),
};

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

jest.unstable_mockModule('../../src/server/services/caseService.js', () => ({
    default: mockCaseService,
}));

jest.unstable_mockModule('../../src/server/services/caseTypeService.js', () => ({
    default: mockCaseTypeService,
}));

jest.unstable_mockModule('../../src/server/services/caseStatisticsService.js', () => ({
    default: mockCaseStatisticsService,
}));

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
    const { default: casesRouter } = await import('../../src/server/routes/casesNew.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/cases', casesRouter);
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

describe('GET /api/v1/cases', () => {
    it('returns case list', async () => {
        mockCaseService.getCases.mockResolvedValueOnce({
            cases: [mockCase(), mockCase()],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        });

        const res = await request
            .get('/api/v1/cases')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/cases');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/cases/:id', () => {
    it('returns a case by id', async () => {
        mockCaseService.getCaseById.mockResolvedValueOnce(mockCase());

        const res = await request
            .get(`/api/v1/cases/${TEST_CASE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('propagates 404 from caseService', async () => {
        const err = new Error('Case not found');
        err.statusCode = 404;
        mockCaseService.getCaseById.mockRejectedValueOnce(err);

        const res = await request
            .get('/api/v1/cases/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('POST /api/v1/cases', () => {
    const validBody = {
        case_type_id: '11111111-1111-1111-1111-111111111111',
        date_reported: '2025-01-15',
        age_group: '18-49',
        gender: 'Female',
        support_offered: 'A'.repeat(55), // min 50 chars
    };

    it('creates a case with valid data', async () => {
        mockCaseService.createCase.mockResolvedValueOnce(mockCase());

        const res = await request
            .post('/api/v1/cases')
            .set('Authorization', 'Bearer valid-token')
            .send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request
            .post('/api/v1/cases')
            .set('Authorization', 'Bearer valid-token')
            .send({ status: 'Open' }); // missing case_type_id, date_reported, etc.

        expect(res.status).toBe(400);
    });

    it('returns 400 when name fields are provided (confidentiality)', async () => {
        const res = await request
            .post('/api/v1/cases')
            .set('Authorization', 'Bearer valid-token')
            .send({ ...validBody, beneficiary_name: 'John Doe' });

        expect(res.status).toBe(400);
    });

    it('returns 400 when support_offered is too short', async () => {
        const res = await request
            .post('/api/v1/cases')
            .set('Authorization', 'Bearer valid-token')
            .send({ ...validBody, support_offered: 'Short' }); // less than 50 chars

        expect(res.status).toBe(400);
    });

    it('returns 401 without token', async () => {
        const res = await request.post('/api/v1/cases').send(validBody);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/v1/cases/:id', () => {
    it('updates a case', async () => {
        mockCaseService.updateCase.mockResolvedValueOnce(mockCase({ status: 'Closed' }));

        const res = await request
            .put(`/api/v1/cases/${TEST_CASE_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ status: 'Closed' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('propagates errors from caseService', async () => {
        const err = new Error('Case not found');
        err.statusCode = 404;
        mockCaseService.updateCase.mockRejectedValueOnce(err);

        const res = await request
            .put(`/api/v1/cases/${TEST_CASE_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ status: 'Closed' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/v1/cases/:id', () => {
    it('deletes a case', async () => {
        mockCaseService.deleteCase.mockResolvedValueOnce(undefined);

        const res = await request
            .delete(`/api/v1/cases/${TEST_CASE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('propagates errors from caseService', async () => {
        const err = new Error('Case not found');
        err.statusCode = 404;
        mockCaseService.deleteCase.mockRejectedValueOnce(err);

        const res = await request
            .delete(`/api/v1/cases/${TEST_CASE_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});
