/**
 * Users Routes — Integration Tests
 *
 * Covers: GET / (list + pagination), GET /:id, POST / (create),
 *         PUT /:id (update), DELETE /:id (soft delete, self-delete guard),
 *         POST /:id/roles (role assignment), GET /roles/list
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { mockUser, pgResult } from '../helpers/mockFactory.js';

const TEST_USER_ID = 'user-1111-1111-1111-111111111111';
const OTHER_USER_ID = 'user-2222-2222-2222-222222222222';
const ROLE_ID = '11111111-1111-1111-1111-111111111111';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockClient = { query: jest.fn() };

const mockDb = {
    query: jest.fn(),
    queryOne: jest.fn(),
    queryMany: jest.fn(),
    buildWhereClause: jest.fn().mockReturnValue({ whereClause: '', params: [], nextIndex: 1 }),
    buildOrderByClause: jest.fn().mockReturnValue('ORDER BY created_at DESC'),
    transaction: jest.fn().mockImplementation(async (cb) => cb(mockClient)),
};

const mockAuthSvc = {
    verifyAccessToken: jest.fn().mockReturnValue({
        userId: TEST_USER_ID,
        email: 'admin@awyad.org',
        roles: [],
    }),
    register: jest.fn(),
    getUserRoles: jest.fn().mockResolvedValue([]),
    getUserPermissions: jest.fn().mockResolvedValue([]),
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
    const { default: usersRouter } = await import('../../src/server/routes/users.js');

    const app = express();
    app.use(express.json());
    app.use('/api/v1/users', usersRouter);
    app.use((err, _req, res, _next) => {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    const supertest = (await import('supertest')).default;
    request = supertest(app);
});

beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockDb.buildWhereClause.mockReturnValue({ whereClause: '', params: [], nextIndex: 1 });
    mockDb.buildOrderByClause.mockReturnValue('ORDER BY created_at DESC');
    mockDb.transaction.mockImplementation(async (cb) => cb(mockClient));
    mockAuthSvc.verifyAccessToken.mockReturnValue({
        userId: TEST_USER_ID,
        email: 'admin@awyad.org',
        roles: [],
    });
    mockAuthSvc.getUserRoles.mockResolvedValue([]);
    mockAuthSvc.getUserPermissions.mockResolvedValue([]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/users', () => {
    it('returns paginated user list', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ total: '5' });
        mockDb.queryMany.mockResolvedValueOnce([mockUser(), mockUser()]);

        const res = await request
            .get('/api/v1/users')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.pagination.total).toBe(5);
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/users');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/users/:id', () => {
    it('returns a user by id', async () => {
        mockDb.queryOne.mockResolvedValueOnce(mockUser({ id: OTHER_USER_ID }));
        mockAuthSvc.getUserRoles.mockResolvedValueOnce([{ id: ROLE_ID, name: 'viewer' }]);
        mockAuthSvc.getUserPermissions.mockResolvedValueOnce([{ name: 'activities.read' }]);

        const res = await request
            .get(`/api/v1/users/${OTHER_USER_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeTruthy();
    });

    it('returns 404 for unknown user id', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('POST /api/v1/users', () => {
    const validBody = {
        email: 'newuser@awyad.org',
        username: 'newuser123',
        password: 'Secure@123',
        firstName: 'New',
        lastName: 'User',
    };

    it('creates a new user', async () => {
        const createdUser = mockUser({ id: OTHER_USER_ID, email: 'newuser@awyad.org' });
        mockAuthSvc.register.mockResolvedValueOnce(createdUser);
        mockAuthSvc.getUserRoles.mockResolvedValueOnce([]);

        const res = await request
            .post('/api/v1/users')
            .set('Authorization', 'Bearer valid-token')
            .send(validBody);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('returns 422 for invalid email', async () => {
        const res = await request
            .post('/api/v1/users')
            .set('Authorization', 'Bearer valid-token')
            .send({ ...validBody, email: 'not-an-email' });

        expect(res.status).toBe(422);
    });

    it('returns 422 when required fields are missing', async () => {
        const res = await request
            .post('/api/v1/users')
            .set('Authorization', 'Bearer valid-token')
            .send({ email: 'only@email.com' });

        expect(res.status).toBe(422);
    });

    it('returns 401 without token', async () => {
        const res = await request.post('/api/v1/users').send(validBody);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/v1/users/:id', () => {
    it('updates a user', async () => {
        mockDb.queryOne
            .mockResolvedValueOnce({ id: OTHER_USER_ID })  // exists check
            .mockResolvedValueOnce(mockUser({ id: OTHER_USER_ID, first_name: 'Updated' })); // RETURNING

        const res = await request
            .put(`/api/v1/users/${OTHER_USER_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ firstName: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when user not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .put(`/api/v1/users/${OTHER_USER_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({ firstName: 'Changed' });

        expect(res.status).toBe(404);
    });

    it('returns 400 when body is empty', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: OTHER_USER_ID }); // user exists check passes
        const res = await request
            .put(`/api/v1/users/${OTHER_USER_ID}`)
            .set('Authorization', 'Bearer valid-token')
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/v1/users/:id', () => {
    it('soft-deletes (deactivates) a user', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: OTHER_USER_ID, email: 'other@awyad.org' });
        mockDb.query
            .mockResolvedValueOnce(pgResult([])) // UPDATE is_active=false
            .mockResolvedValueOnce(pgResult([])); // revoke tokens

        const res = await request
            .delete(`/api/v1/users/${OTHER_USER_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 400 when trying to delete own account', async () => {
        // The authenticated user has userId = TEST_USER_ID
        const res = await request
            .delete(`/api/v1/users/${TEST_USER_ID}`)
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/own account/i);
    });

    it('returns 404 when user not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
    });
});

describe('POST /api/v1/users/:id/roles', () => {
    it('assigns roles to a user', async () => {
        mockDb.queryOne.mockResolvedValueOnce({ id: OTHER_USER_ID }); // user exists
        mockClient.query.mockResolvedValue(pgResult([])); // DELETE + INSERT inside transaction
        mockAuthSvc.getUserRoles.mockResolvedValueOnce([{ id: ROLE_ID, name: 'admin' }]);

        const res = await request
            .post(`/api/v1/users/${OTHER_USER_ID}/roles`)
            .set('Authorization', 'Bearer valid-token')
            .send({ roleIds: [ROLE_ID] });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.roles).toBeTruthy();
    });

    it('returns 422 when roleIds is empty', async () => {
        const res = await request
            .post(`/api/v1/users/${OTHER_USER_ID}/roles`)
            .set('Authorization', 'Bearer valid-token')
            .send({ roleIds: [] });

        expect(res.status).toBe(422);
    });

    it('returns 404 when user not found', async () => {
        mockDb.queryOne.mockResolvedValueOnce(null);

        const res = await request
            .post(`/api/v1/users/${OTHER_USER_ID}/roles`)
            .set('Authorization', 'Bearer valid-token')
            .send({ roleIds: [ROLE_ID] });

        expect(res.status).toBe(404);
    });
});

describe('GET /api/v1/users/roles/list', () => {
    // NOTE: /roles/list is a separate route defined at line ~442 in users.js.
    // Although /:id is defined first (line 171), Express does NOT match /roles/list
    // against /:id because /:id only matches single-segment paths and /roles/list
    // has two segments. So GET /roles/list correctly routes to the specific handler.
    it('returns list of roles', async () => {
        mockDb.queryMany.mockResolvedValueOnce([{ id: '11111111-1111-1111-1111-111111111111', name: 'admin' }]);

        const res = await request
            .get('/api/v1/users/roles/list')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.roles).toBeTruthy();
    });

    it('returns 401 without token', async () => {
        const res = await request.get('/api/v1/users/roles/list');
        expect(res.status).toBe(401);
    });
});
