# System Architecture Overview

## Complete Multi-User System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ login.html   │    │ index.html   │    │ profile.html │          │
│  │              │    │ (Dashboard)  │    │ (Coming Soon)│          │
│  │ - Login Form │───>│ - Protected  │    │              │          │
│  │ - Register   │    │ - User Info  │    │              │          │
│  │ - Validation │    │ - Navigation │    │              │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                    │                                       │
│         └────────────────────┴───────────────────┐                  │
│                                                   │                  │
│                        ┌──────────────────────────▼─────────┐       │
│                        │      auth.js (AuthManager)         │       │
│                        │  ┌──────────────────────────────┐  │       │
│                        │  │ - login()                    │  │       │
│                        │  │ - logout()                   │  │       │
│                        │  │ - register()                 │  │       │
│                        │  │ - isAuthenticated()          │  │       │
│                        │  │ - authenticatedFetch()       │  │       │
│                        │  │ - refreshToken()             │  │       │
│                        │  │ - hasPermission()            │  │       │
│                        │  │ - hasRole()                  │  │       │
│                        │  └──────────────────────────────┘  │       │
│                        │                                     │       │
│                        │  Token Storage (localStorage):     │       │
│                        │  - accessToken                     │       │
│                        │  - user (email, username, roles)   │       │
│                        └────────────────────────────────────┘       │
│                                       │                              │
└───────────────────────────────────────┼──────────────────────────────┘
                                        │
                                        │ HTTP/HTTPS
                                        │ JWT Bearer Token
                                        │
┌───────────────────────────────────────▼──────────────────────────────┐
│                          BACKEND LAYER                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               Express.js Server (Port 3001)                 │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │              Middleware Stack                        │   │    │
│  │  │  1. Helmet (Security Headers)                        │   │    │
│  │  │  2. CORS (Cross-Origin)                              │   │    │
│  │  │  3. Cookie Parser                                    │   │    │
│  │  │  4. JSON Body Parser                                 │   │    │
│  │  │  5. Request Logger (Winston)                         │   │    │
│  │  │  6. Rate Limiter                                     │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│  ┌─────────────────────────────▼───────────────────────────────┐    │
│  │                      API Routes                             │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  /api/v1/auth/*                                      │   │    │
│  │  │  - POST /register   (Rate: 3/hour)                  │   │    │
│  │  │  - POST /login      (Rate: 5/15min)                 │   │    │
│  │  │  - POST /logout                                      │   │    │
│  │  │  - POST /refresh-token                              │   │    │
│  │  │  - POST /change-password                            │   │    │
│  │  │  - GET  /me                                         │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  /api/v1/users/*  [Requires: users.* permissions]   │   │    │
│  │  │  - GET    /users           (List, paginate)         │   │    │
│  │  │  - GET    /users/:id       (Get one)                │   │    │
│  │  │  - POST   /users           (Create)                 │   │    │
│  │  │  - PUT    /users/:id       (Update)                 │   │    │
│  │  │  - DELETE /users/:id       (Soft delete)            │   │    │
│  │  │  - POST   /users/:id/roles (Assign roles)           │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  /api/v1/projects/*  [Coming Soon]                  │   │    │
│  │  │  /api/v1/indicators/*                               │   │    │
│  │  │  /api/v1/activities/*                               │   │    │
│  │  │  /api/v1/cases/*                                    │   │    │
│  │  │  /api/v1/dashboard/*                                │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│  ┌─────────────────────────────▼───────────────────────────────┐    │
│  │                  Auth Middleware                            │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  authenticate()                                      │   │    │
│  │  │  - Verify JWT token                                 │   │    │
│  │  │  - Extract user from token                          │   │    │
│  │  │  - Attach req.user with { id, email, roles }       │   │    │
│  │  │  - Reject if token invalid/expired                 │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  checkPermission(name)                              │   │    │
│  │  │  - Query user's permissions from DB                 │   │    │
│  │  │  - Check if user has specific permission           │   │    │
│  │  │  - Return 403 if forbidden                         │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  checkRole(name)                                    │   │    │
│  │  │  - Query user's roles from DB                       │   │    │
│  │  │  - Check if user has specific role                 │   │    │
│  │  │  - Return 403 if forbidden                         │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
│  ┌─────────────────────────────▼───────────────────────────────┐    │
│  │                    Service Layer                            │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  authService.js                                      │   │    │
│  │  │  - register(userData)                                │   │    │
│  │  │  - login(email, password)                            │   │    │
│  │  │  - logout(refreshToken)                              │   │    │
│  │  │  - refreshAccessToken(token)                         │   │    │
│  │  │  - changePassword(userId, oldPass, newPass)         │   │    │
│  │  │  - getUserProfile(userId)                            │   │    │
│  │  │  - getUserRoles(userId)                              │   │    │
│  │  │  - getUserPermissions(userId)                        │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  databaseService.js                                  │   │    │
│  │  │  - query(sql, params)                                │   │    │
│  │  │  - queryOne(sql, params)                             │   │    │
│  │  │  - queryMany(sql, params)                            │   │    │
│  │  │  - transaction(callback)                             │   │    │
│  │  │  - queryPaginated(table, options)                    │   │    │
│  │  │  - healthCheck()                                     │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  authorization.js (Utilities)                       │   │    │
│  │  │  - hasPermission(userId, permission)                │   │    │
│  │  │  - hasRole(userId, role)                            │   │    │
│  │  │  - requirePermission(permission)                    │   │    │
│  │  │  - requireRole(role)                                │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 │ Connection Pool (max: 20)
                                 │ Parameterized Queries
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                        DATABASE LAYER                                 │
├───────────────────────────────────────────────────────────────────────┤
│                     PostgreSQL (Port 5432)                            │
│                     Database: awyad_mes                               │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                   Core Identity Tables                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │   users      │  │   roles      │  │ permissions  │        │   │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤        │   │
│  │  │ id (UUID PK) │  │ id (UUID PK) │  │ id (UUID PK) │        │   │
│  │  │ email (UQ)   │  │ name (UQ)    │  │ name (UQ)    │        │   │
│  │  │ username (UQ)│  │ display_name │  │ resource     │        │   │
│  │  │ password_hash│  │ description  │  │ action       │        │   │
│  │  │ first_name   │  │ is_system    │  │ description  │        │   │
│  │  │ last_name    │  │ created_at   │  │ created_at   │        │   │
│  │  │ is_active    │  │ updated_at   │  │ updated_at   │        │   │
│  │  │ is_verified  │  └──────────────┘  └──────────────┘        │   │
│  │  │ created_at   │                                             │   │
│  │  │ updated_at   │                                             │   │
│  │  └──────────────┘                                             │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              Relationship Tables (Many-to-Many)               │   │
│  │  ┌──────────────────┐         ┌────────────────────┐         │   │
│  │  │   user_roles     │         │ role_permissions   │         │   │
│  │  ├──────────────────┤         ├────────────────────┤         │   │
│  │  │ user_id (FK)     │         │ role_id (FK)       │         │   │
│  │  │ role_id (FK)     │         │ permission_id (FK) │         │   │
│  │  │ assigned_by (FK) │         │ granted_by (FK)    │         │   │
│  │  │ assigned_at      │         │ granted_at         │         │   │
│  │  │ PK(user,role)    │         │ PK(role,perm)      │         │   │
│  │  └──────────────────┘         └────────────────────┘         │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    Security Tables                            │   │
│  │  ┌──────────────────────────────────────────────────────┐     │   │
│  │  │              refresh_tokens                          │     │   │
│  │  ├──────────────────────────────────────────────────────┤     │   │
│  │  │ id (UUID PK)                                         │     │   │
│  │  │ user_id (FK)                                         │     │   │
│  │  │ token (TEXT, UQ)                                     │     │   │
│  │  │ expires_at (TIMESTAMP)                               │     │   │
│  │  │ revoked (BOOLEAN) - default false                    │     │   │
│  │  │ revoked_at (TIMESTAMP)                               │     │   │
│  │  │ replaced_by (UUID FK)                                │     │   │
│  │  │ created_at                                           │     │   │
│  │  └──────────────────────────────────────────────────────┘     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                 Application Data Tables                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │  thematic_  │  │  projects   │  │ indicators  │           │   │
│  │  │   areas     │  │             │  │             │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │ activities  │  │   cases     │  │ audit_logs  │           │   │
│  │  │             │  │             │  │             │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                      Database Views                           │   │
│  │  - user_roles_view: Denormalized user-role-permission data   │   │
│  │  - role_permissions_view: Role with all permissions          │   │
│  │  - activity_summary_view: Activity aggregations              │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    Database Indexes                           │   │
│  │  - idx_users_email (email)                                    │   │
│  │  - idx_users_username (username)                              │   │
│  │  - idx_refresh_tokens_user (user_id)                          │   │
│  │  - idx_refresh_tokens_expires (expires_at)                    │   │
│  │  - idx_user_roles_user (user_id)                              │   │
│  │  - idx_user_roles_role (role_id)                              │   │
│  │  - idx_role_permissions_role (role_id)                        │   │
│  │  - idx_role_permissions_permission (permission_id)            │   │
│  │  - idx_projects_thematic_area (thematic_area_id)              │   │
│  │  - idx_indicators_project (project_id)                        │   │
│  │  - idx_activities_indicator (indicator_id)                    │   │
│  │  - idx_audit_logs_user (user_id)                              │   │
│  │  - idx_audit_logs_created (created_at DESC)                   │   │
│  │  + Many more for performance optimization                     │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                   Initial Seed Data                           │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │ Roles: Admin, Manager, User, Viewer                    │   │   │
│  │  │ Permissions: 30+ (users.*, projects.*, etc.)          │   │   │
│  │  │ Admin User: admin@awyad.org / Admin@123               │   │   │
│  │  │ Role Assignments: Admin → All Permissions             │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘


══════════════════════════════════════════════════════════════════════
                        AUTHENTICATION FLOW
══════════════════════════════════════════════════════════════════════

1. USER LOGIN
   ┌──────────┐
   │  User    │  Enters credentials on login.html
   └────┬─────┘
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │  authManager.login(email, password)                    │
   │  - Sends POST /api/v1/auth/login                       │
   │  - Body: { email, password }                           │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Backend: authService.login()                          │
   │  1. Query user by email from database                  │
   │  2. Verify password with bcrypt.compare()              │
   │  3. Generate JWT access token (expires: 1h)            │
   │  4. Generate JWT refresh token (expires: 7d)           │
   │  5. Store refresh token in database                    │
   │  6. Return tokens + user info                          │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Frontend: Store tokens                                │
   │  - localStorage.setItem('accessToken', token)          │
   │  - localStorage.setItem('user', JSON.stringify(user))  │
   │  - Cookie: refreshToken (HTTP-only)                    │
   │  - Redirect to index.html                              │
   └────────────────────────────────────────────────────────┘


2. PROTECTED API REQUEST
   ┌──────────┐
   │  User    │  Clicks on "Projects" in dashboard
   └────┬─────┘
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │  authManager.authenticatedFetch('/api/v1/projects')    │
   │  1. Get accessToken from localStorage                  │
   │  2. Add Authorization: Bearer <token> header           │
   │  3. Send request                                       │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Backend: authenticate() middleware                    │
   │  1. Extract token from Authorization header            │
   │  2. Verify JWT signature                               │
   │  3. Check expiration                                   │
   │  4. Decode payload → { userId, email, roles }          │
   │  5. Attach to req.user                                 │
   │  6. Continue to route handler                          │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Route Handler: GET /api/v1/projects                   │
   │  1. Access req.user (authenticated user info)          │
   │  2. Check permissions with checkPermission middleware  │
   │  3. Query projects from database                       │
   │  4. Filter based on user permissions                   │
   │  5. Return JSON response                               │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Frontend: Process response                            │
   │  - If 200 OK: Display projects                         │
   │  - If 401 Unauthorized: Refresh token automatically    │
   │  - If 403 Forbidden: Show "Access Denied"              │
   └────────────────────────────────────────────────────────┘


3. TOKEN REFRESH (Automatic)
   ┌──────────┐
   │  User    │  Access token expires (after 1 hour)
   └────┬─────┘
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │  API Request returns 401 Unauthorized                  │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  authManager.authenticatedFetch() catches 401          │
   │  1. Automatically call refreshToken()                  │
   │  2. Send POST /api/v1/auth/refresh-token               │
   │  3. Include refresh token from cookie                  │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Backend: Verify refresh token                         │
   │  1. Check token exists in database                     │
   │  2. Verify not revoked                                 │
   │  3. Verify not expired                                 │
   │  4. Generate new access token                          │
   │  5. Return new access token                            │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Frontend: Update token and retry                      │
   │  1. Store new access token                             │
   │  2. Retry original API request                         │
   │  3. User doesn't notice interruption                   │
   └────────────────────────────────────────────────────────┘


4. PERMISSION CHECK
   ┌──────────┐
   │  Admin   │  Tries to access User Management
   └────┬─────┘
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │  Request: GET /api/v1/users                            │
   │  - Header: Authorization: Bearer <token>               │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Middleware Chain:                                     │
   │  1. authenticate() → Verify token, set req.user        │
   │  2. checkPermission('users.read')                      │
   │     - Query database for user permissions              │
   │     - JOIN users → user_roles → role_permissions       │
   │     - Check if 'users.read' exists                     │
   │     - If yes: continue                                 │
   │     - If no: return 403 Forbidden                      │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Route Handler executes                                │
   │  - Fetch users from database                           │
   │  - Apply pagination                                    │
   │  - Return user list                                    │
   └────────────────────────────────────────────────────────┘


5. LOGOUT
   ┌──────────┐
   │  User    │  Clicks "Logout" button
   └────┬─────┘
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │  authManager.logout()                                  │
   │  - Send POST /api/v1/auth/logout                       │
   │  - Include refresh token                               │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Backend: Revoke token                                 │
   │  - Mark refresh token as revoked in database           │
   │  - Set revoked_at timestamp                            │
   └────────┬───────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  Frontend: Clear session                               │
   │  - localStorage.removeItem('accessToken')              │
   │  - localStorage.removeItem('user')                     │
   │  - Clear cookie                                        │
   │  - Redirect to login.html                              │
   └────────────────────────────────────────────────────────┘


══════════════════════════════════════════════════════════════════════
                           SECURITY LAYERS
══════════════════════════════════════════════════════════════════════

Layer 1: Transport Security
  ├─ HTTPS (recommended for production)
  ├─ CORS restrictions
  └─ Security headers (Helmet)

Layer 2: Authentication
  ├─ JWT tokens (HS256 algorithm)
  ├─ Short-lived access tokens (1 hour)
  ├─ Refresh token rotation
  └─ Bcrypt password hashing (10 rounds)

Layer 3: Authorization
  ├─ Role-Based Access Control (RBAC)
  ├─ Granular permissions (resource.action)
  ├─ Permission inheritance through roles
  └─ Database-backed permission checks

Layer 4: Input Validation
  ├─ Joi schema validation
  ├─ SQL injection prevention (parameterized queries)
  ├─ XSS protection (sanitized inputs)
  └─ CSRF tokens (coming soon)

Layer 5: Rate Limiting
  ├─ Login: 5 attempts per 15 minutes
  ├─ Registration: 3 attempts per hour
  └─ API endpoints: 100 requests per 15 minutes

Layer 6: Audit & Monitoring
  ├─ Winston logging (all requests)
  ├─ Audit logs in database
  ├─ Failed login tracking
  └─ Permission check logging

Layer 7: Session Management
  ├─ Token expiration enforcement
  ├─ Refresh token revocation
  ├─ Automatic expired token cleanup
  └─ Single logout (token blacklist)


══════════════════════════════════════════════════════════════════════
                         DEPLOYMENT TOPOLOGY
══════════════════════════════════════════════════════════════════════

Development:
┌────────────────┐
│   localhost    │
│  Port 3001     │  ← Express Server + Static Files
│                │
│  Port 5432     │  ← PostgreSQL Database
└────────────────┘

Production (Recommended):
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
│                        (HTTPS/SSL)                              │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
   ┌─────────▼────────┐            ┌─────────▼────────┐
   │  App Server 1    │            │  App Server 2    │
   │  (Node.js)       │            │  (Node.js)       │
   │  Port 3001       │            │  Port 3001       │
   └─────────┬────────┘            └─────────┬────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                ┌─────────▼──────────┐
                │  PostgreSQL        │
                │  (Master-Replica)  │
                │  Port 5432         │
                └────────────────────┘

Static Assets:
  - Serve from CDN (CloudFront, Cloudflare)
  - Optimize with caching headers
  - Minify JS/CSS in production

