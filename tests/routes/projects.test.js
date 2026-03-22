/**
 * Projects Routes — Integration Tests
 *
 * Covers: GET / (list + pagination + filters), POST / (create),
 *         GET /:id, PUT /:id, DELETE /:id
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import {
    mockProject,
    pgResult,
    TEST_PROJECT_ID,
    TEST_THEMATIC_AREA_ID,
} from '../helpers/mockFactory.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDb = {
    query: jest.fn(),
    queryOne: jest.fn(),
    queryMany: jest.fn(),
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
    const { default: projectsRouter } = await import('../../src/server/routes/projects.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/projects', projectsRouter);
    app.use((err, _req, res, _next) => {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    const supertest = (await import('supertest')).default;
    request = supertest(app);
});

beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSvc.verifyAccessToken.mockReturnValue({
        userId: 'user-1', email: 'admin@awyad.org', roles: [],
    });
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/projects', () => {
    it('should return paginated list of projects', async () => {
        const projects = [mockProject(), mockProject({ id: 'proj-2', name: 'Second Project' })];
        mockDb.queryOne.mockResolvedValueOnce({ total: '2' });
        mockDb.queryMany.mockResolvedValueOnce(projects);

        const res = await request
            .get('/api/v1/projects')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.projects).toHaveLength(2);
        expect(res.body.data.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
        mockDb.queryMany.mockResolvedValueOnce([mockProject({ status: 'Active' })]);

        const res = await request
            .get('/api/v1/projects?status=Active')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(mockDb.queryMany).toHaveBeenCalledWith(
            expect.stringContaining('status'),
            expect.arrayContaining(['Active'])
        );
    });

    it('should filter by search term', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
        mockDb.queryMany.mockResolvedValueOnce([mockProject({ name: 'Health Project' })]);

        const res = await request
            .get('/api/v1/projects?search=Health')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(mockDb.queryMany).toHaveBeenCalledWith(
            expect.stringContaining('ILIKE'),
            expect.arrayContaining(['%Health%'])
        );
    });

    it('should return 401 when no token provided', async () => {
        const res = await request.get('/api/v1/projects');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/projects', () => {
    const validPayload = {
        name: 'New Project',
        donor: 'UNICEF',
        thematic_area_id: TEST_THEMATIC_AREA_ID,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        budget: 50000,
        status: 'Planning',
    };

    it('should create a project and return 201', async () => {
        const created = mockProject({ name: 'New Project', donor: 'UNICEF' });
        mockDb.queryOne.mockResolvedValue(created);

        const res = await request
            .post('/api/v1/projects')
            .set('Authorization', 'Bearer valid-token')
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('New Project');
    });

    it('should return 400 when required fields are missing', async () => {
        const res = await request
            .post('/api/v1/projects')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Incomplete' });

        expect(res.status).toBe(400);
    });

    it('should return 400 when end_date is before start_date', async () => {
        const res = await request
            .post('/api/v1/projects')
            .set('Authorization', 'Bearer valid-token')
            .send({ ...validPayload, end_date: '2024-01-01' });  // before start

        expect(res.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
        const res = await request.post('/api/v1/projects').send(validPayload);
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/projects/:id', () => {
    it('should return project details', async () => {
        mockDb.queryOne.mockResolvedValue(mockProject());

        const res = await request
            .get(`/api/v1/projects/${TEST_PROJECT_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(TEST_PROJECT_ID);
    });

    it('should return 404 when project does not exist', async () => {
        mockDb.queryOne.mockResolvedValue(null);

        const res = await request
            .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('PUT /api/v1/projects/:id', () => {
    it('should update project successfully', async () => {
        const updated = mockProject({ name: 'Updated Name' });
        mockDb.queryOne
            .mockResolvedValueOnce(mockProject())   // fetch existing
            .mockResolvedValueOnce(updated);         // return updated

        const res = await request
            .put(`/api/v1/projects/${TEST_PROJECT_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'Updated Name' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Updated Name');
    });

    it('should return 404 when project does not exist', async () => {
        mockDb.queryOne.mockResolvedValue(null);

        const res = await request
            .put('/api/v1/projects/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token')
            .send({ name: 'No Project' });

        expect(res.status).toBe(404);
    });

    it('should return 400 when update body is empty', async () => {
        const res = await request
            .put(`/api/v1/projects/${TEST_PROJECT_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/projects/:id', () => {
    it('should delete project and return 200', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce(mockProject())              // exists check
            .mockResolvedValueOnce({ activity_count: '0' })   // activity count
            .mockResolvedValueOnce({ case_count: '0' });       // case count
        mockDb.query.mockResolvedValueOnce(pgResult([]));

        const res = await request
            .delete(`/api/v1/projects/${TEST_PROJECT_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 when project does not exist', async () => {
        mockDb.queryOne.mockResolvedValue(null);

        const res = await request
            .delete('/api/v1/projects/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});
