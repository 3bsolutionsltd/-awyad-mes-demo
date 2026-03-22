/**
 * Auth Routes — Integration Tests
 *
 * Covers: POST /register, POST /login, POST /refresh,
 *         GET /me, POST /change-password, POST /logout
 */
import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

// ── Mocks must be declared before any dynamic imports ────────────────────────

const mockDb = {
    query: jest.fn(),
    queryOne: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
};

const mockAuthSvc = {
    register: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    changePassword: jest.fn(),
    logout: jest.fn(),
    getUserProfile: jest.fn(),
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

// ── Test app setup ────────────────────────────────────────────────────────────

let request;

beforeAll(async () => {
    const { default: express } = await import('express');
    const { default: cookieParser } = await import('cookie-parser');
    const { default: authRouter } = await import('../../src/server/routes/auth.js');

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/v1/auth', authRouter);

    // Simple error handler for tests
    app.use((err, _req, res, _next) => {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    const supertest = (await import('supertest')).default;
    request = supertest(app);
});

beforeEach(() => {
    jest.clearAllMocks();
    // Default: verifyAccessToken returns valid user
    mockAuthSvc.verifyAccessToken.mockReturnValue({
        userId: 'user-1',
        email: 'admin@awyad.org',
        roles: ['admin'],
    });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
        const newUser = { id: 'user-1', email: 'new@awyad.org', username: 'newuser' };
        mockAuthSvc.register.mockResolvedValue(newUser);

        const res = await request.post('/api/v1/auth/register').send({
            email: 'new@awyad.org',
            username: 'newuser',
            password: 'SecurePass1',
            firstName: 'New',
            lastName: 'User',
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toMatchObject({ email: 'new@awyad.org' });
        expect(mockAuthSvc.register).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when required fields are missing', async () => {
        const res = await request.post('/api/v1/auth/register').send({
            email: 'bad@awyad.org',
            // missing username, password, firstName, lastName
        });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
    });

    it('should return 422 when password does not meet complexity', async () => {
        const res = await request.post('/api/v1/auth/register').send({
            email: 'test@awyad.org',
            username: 'testuser',
            password: 'weakpass',      // no uppercase or number
            firstName: 'Test',
            lastName: 'User',
        });

        expect(res.status).toBe(422);
    });

    it('should return 422 for invalid email format', async () => {
        const res = await request.post('/api/v1/auth/register').send({
            email: 'not-an-email',
            username: 'testuser',
            password: 'SecurePass1',
            firstName: 'Test',
            lastName: 'User',
        });

        expect(res.status).toBe(422);
    });
});

describe('POST /api/v1/auth/login', () => {
    it('should login and return access token', async () => {
        mockAuthSvc.login.mockResolvedValue({
            user: { id: 'user-1', email: 'admin@awyad.org' },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        });

        const res = await request.post('/api/v1/auth/login').send({
            emailOrUsername: 'admin@awyad.org',
            password: 'Admin123!',
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.accessToken).toBe('mock-access-token');
        expect(mockAuthSvc.login).toHaveBeenCalledWith('admin@awyad.org', 'Admin123!');
    });

    it('should return 422 when credentials are missing', async () => {
        const res = await request.post('/api/v1/auth/login').send({});
        expect(res.status).toBe(422);
    });

    it('should propagate auth service errors (invalid credentials)', async () => {
        const { default: AppError } = await import('../../src/server/utils/AppError.js');
        mockAuthSvc.login.mockRejectedValue(new AppError('Invalid credentials', 401));

        const res = await request.post('/api/v1/auth/login').send({
            emailOrUsername: 'wrong@awyad.org',
            password: 'WrongPass1',
        });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

describe('GET /api/v1/auth/me', () => {
    it('should return user profile when authenticated', async () => {
        const profile = {
            id: 'user-1',
            email: 'admin@awyad.org',
            username: 'admin',
            roles: [],
            permissions: [],
        };
        mockAuthSvc.getUserProfile.mockResolvedValue(profile);

        const res = await request
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toMatchObject({ email: 'admin@awyad.org' });
    });

    it('should return 401 when no token provided', async () => {
        // verifyAccessToken throws when called without token
        const res = await request.get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/auth/refresh-token', () => {
    it('should return new access token given a valid refresh token', async () => {
        mockAuthSvc.refreshAccessToken.mockResolvedValue({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        });

        const res = await request.post('/api/v1/auth/refresh-token').send({
            refreshToken: 'old-refresh-token',
        });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBe('new-access-token');
    });
});

describe('POST /api/v1/auth/change-password', () => {
    it('should change password when authenticated', async () => {
        mockAuthSvc.changePassword.mockResolvedValue(true);

        const res = await request
            .post('/api/v1/auth/change-password')
            .set('Authorization', 'Bearer valid-token')
            .send({
                oldPassword: 'OldPass1!',
                newPassword: 'NewPass1!',
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 422 when newPassword fails complexity', async () => {
        const res = await request
            .post('/api/v1/auth/change-password')
            .set('Authorization', 'Bearer valid-token')
            .send({
                oldPassword: 'OldPass1!',
                newPassword: 'weak',
            });

        expect(res.status).toBe(422);
    });

    it('should return 401 when not authenticated', async () => {
        const res = await request.post('/api/v1/auth/change-password').send({
            oldPassword: 'OldPass1!',
            newPassword: 'NewPass1!',
        });
        expect(res.status).toBe(401);
    });
});

describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
        mockAuthSvc.logout.mockResolvedValue(true);

        const res = await request
            .post('/api/v1/auth/logout')
            .set('Authorization', 'Bearer valid-token')
            .send({ refreshToken: 'some-token' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
