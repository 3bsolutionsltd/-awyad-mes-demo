# Authentication System Guide

## Overview
The AWYAD MES system now has a complete multi-user authentication and authorization system with:
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Secure password hashing
- Token refresh mechanism
- Beautiful login/register UI

## Quick Start

### Default Admin Credentials
```
Email: admin@awyad.org
Password: Admin@123
```

### Access the System
1. Navigate to http://localhost:3001/
2. You'll be redirected to the login page automatically
3. Enter your credentials
4. Upon successful login, you'll be redirected to the dashboard

## System Components

### Frontend Components

#### 1. Login Page (`public/login.html`)
- Beautiful gradient UI with Bootstrap 5
- Tabbed interface for Login/Register
- Form validation
- Loading states and error messages
- Auto-redirect after successful authentication

#### 2. Authentication Manager (`public/auth.js`)
A singleton class that handles all authentication operations:

**Key Methods:**
- `authManager.login(email, password)` - Authenticate user
- `authManager.register(userData)` - Register new user
- `authManager.logout()` - Logout current user
- `authManager.isAuthenticated()` - Check if user is logged in
- `authManager.getCurrentUser()` - Get current user info
- `authManager.hasPermission(name)` - Check user permission
- `authManager.hasRole(name)` - Check user role
- `authManager.authenticatedFetch(url, options)` - Make authenticated API calls

**Token Management:**
- Stores access token in localStorage
- Handles token refresh automatically on expiry
- Manages HTTP-only refresh token cookies

#### 3. Protected Dashboard (`public/index.html`)
- Authentication check on page load
- User information display
- Logout button
- Redirects to login if not authenticated

### Backend Components

#### 1. Database Schema (`database/schema.sql`)
15 tables including:
- **users**: User accounts with email, username, password hash
- **roles**: Admin, Manager, User, Viewer
- **permissions**: 30+ granular permissions
- **user_roles**: Many-to-many user-role relationships
- **role_permissions**: Many-to-many role-permission relationships
- **refresh_tokens**: Secure token storage
- **projects, indicators, activities, cases**: Application data tables

#### 2. Authentication Service (`src/server/services/authService.js`)
Core authentication logic:
- User registration with password hashing
- Login with email/username
- JWT token generation (access + refresh)
- Token refresh
- Password change
- User profile management

#### 3. Authorization Utilities (`src/server/utils/authorization.js`)
Permission checking utilities:
- `hasPermission(userId, permissionName)`
- `hasRole(userId, roleName)`
- `requirePermission(permission)` - Middleware factory
- `requireRole(role)` - Middleware factory

#### 4. Auth Middleware (`src/server/middleware/auth.js`)
Request authentication:
- `authenticate()` - Verify JWT and attach user to request
- `checkPermission(name)` - Verify specific permission
- `checkRole(name)` - Verify specific role
- Rate limiting on auth endpoints

#### 5. API Routes

**Authentication Routes** (`src/server/routes/auth.js`):
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/me` - Get current user profile

**User Management Routes** (`src/server/routes/users.js`):
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user (admin only)
- `PUT /api/v1/users/:id` - Update user (admin only)
- `DELETE /api/v1/users/:id` - Delete user (admin only)
- `POST /api/v1/users/:id/roles` - Assign roles (admin only)
- `GET /api/v1/users/roles/list` - List available roles
- `GET /api/v1/users/permissions/list` - List available permissions

## User Roles & Permissions

### Roles

#### Admin (System Administrator)
Full system access including user management
- All permissions granted
- Can create/edit/delete users
- Can assign roles
- Can access all features

#### Manager (Program Manager)
Full access to program data, no user management
- projects.* (create, read, update, delete)
- indicators.* (create, read, update, delete)
- activities.* (create, read, update, delete)
- cases.* (create, read, update, delete)
- reports.* (create, read)
- dashboard.read

#### User (Regular User)
Can create and edit own data
- projects.read
- indicators.* (create, read, update)
- activities.* (create, read, update)
- cases.* (create, read, update)
- reports.read
- dashboard.read

#### Viewer (Read-Only User)
Can only view data
- projects.read
- indicators.read
- activities.read
- cases.read
- reports.read
- dashboard.read

### Permission Categories
- **users.*** - User management
- **roles.*** - Role management
- **projects.*** - Project operations
- **indicators.*** - Indicator tracking
- **activities.*** - Activity tracking
- **cases.*** - Case management
- **reports.*** - Report generation
- **dashboard.*** - Dashboard access
- **audit.*** - Audit log access

## Authentication Flow

### Login Flow
```
1. User visits http://localhost:3001/
2. index.html checks authManager.isAuthenticated()
3. If not authenticated → redirect to login.html
4. User enters credentials
5. authManager.login() sends POST to /api/v1/auth/login
6. Server validates credentials and returns access token + refresh token
7. Frontend stores token and user info in localStorage
8. Redirect back to index.html
9. Dashboard loads with user info displayed
```

### Token Refresh Flow
```
1. User makes API request
2. If access token expired (401 response)
3. authManager.authenticatedFetch() automatically calls refreshToken()
4. Sends refresh token to /api/v1/auth/refresh-token
5. Receives new access token
6. Retries original request with new token
7. All automatic - user doesn't notice
```

### Logout Flow
```
1. User clicks "Logout" button
2. authManager.logout() calls /api/v1/auth/logout
3. Server invalidates refresh token in database
4. Frontend clears localStorage
5. Redirect to login.html
```

## Security Features

### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters required
- Must include uppercase, lowercase, number, special character

### Token Security
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Refresh tokens stored in database (can be revoked)
- HTTP-only cookies for refresh tokens (XSS protection)
- JWT signed with secure secret key

### API Security
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Rate limiting on registration (3 attempts per hour)
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection protection (parameterized queries)

### Session Security
- Automatic cleanup of expired tokens
- Token revocation on logout
- User session tracking
- Audit logging of auth events

## Making Authenticated API Calls

### In Frontend JavaScript

```javascript
// Use authManager.authenticatedFetch() instead of fetch()
try {
    const response = await authManager.authenticatedFetch('/api/v1/projects', {
        method: 'GET'
    });
    
    if (response.ok) {
        const projects = await response.json();
        console.log('Projects:', projects);
    }
} catch (error) {
    console.error('Error fetching projects:', error);
}
```

### Example: Create New Project
```javascript
const newProject = {
    name: 'New Project',
    description: 'Project description',
    thematic_area_id: '123e4567-e89b-12d3-a456-426614174000'
};

const response = await authManager.authenticatedFetch('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(newProject)
});

if (response.ok) {
    const created = await response.json();
    console.log('Project created:', created);
}
```

## User Management

### Creating New Users (Admin Only)

1. Login as admin
2. Navigate to user management (will be added in next phase)
3. Or use API directly:

```javascript
const newUser = {
    email: 'user@example.com',
    username: 'newuser',
    password: 'SecurePass123!',
    first_name: 'John',
    last_name: 'Doe'
};

const response = await authManager.authenticatedFetch('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(newUser)
});
```

### Assigning Roles (Admin Only)

```javascript
const userId = 'user-uuid-here';
const roleIds = ['role-uuid-1', 'role-uuid-2'];

const response = await authManager.authenticatedFetch(`/api/v1/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleIds })
});
```

## Testing the System

### Test Login
```bash
# Test with PowerShell
$body = @{
    email = "admin@awyad.org"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

Write-Output $response
```

### Test Protected Endpoint
```bash
# First get the token from login response
$token = $response.data.accessToken

# Then make authenticated request
$headers = @{
    Authorization = "Bearer $token"
}

$profile = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/me" `
    -Method GET `
    -Headers $headers

Write-Output $profile
```

## Database Management

### Setup Database
```bash
npm run db:setup
```

### Reset Database (Caution: Deletes all data)
```bash
npm run db:reset
```

### Verify Database
```bash
npm run db:verify
```

### Verify Admin Password
```bash
node verify-admin.js
```

## Troubleshooting

### Cannot Login
1. Verify server is running on port 3001
2. Check PostgreSQL is running
3. Verify admin password: `node verify-admin.js`
4. Check browser console for errors
5. Check server logs in terminal

### Token Expired Error
- This is normal behavior
- Token refresh should happen automatically
- If it persists, logout and login again

### CORS Errors
- Verify CORS_ORIGIN in .env matches your URL
- Should be: `CORS_ORIGIN=http://localhost:3001`

### Database Connection Issues
1. Check PostgreSQL is running
2. Verify credentials in .env
3. Test connection: `npm run db:verify`

### "Invalid Credentials" Error
1. Verify you're using correct email: admin@awyad.org
2. Verify password: Admin@123
3. Run `node verify-admin.js` to fix password hash

## Next Steps

### Planned Enhancements
1. ✅ Complete authentication UI
2. ⏳ User management interface (admin panel)
3. ⏳ Profile page (view/edit profile)
4. ⏳ Permission-based UI (hide/show based on roles)
5. ⏳ Migrate data operations from JSON to PostgreSQL
6. ⏳ Email verification for new accounts
7. ⏳ Password reset via email
8. ⏳ Activity audit log viewer
9. ⏳ Session management (view/revoke sessions)
10. ⏳ Two-factor authentication (2FA)

### Recommended Production Changes
1. Change default admin password
2. Set strong JWT_SECRET (already done)
3. Enable HTTPS
4. Configure email service for notifications
5. Set up backup strategy for PostgreSQL
6. Configure production logging
7. Set up monitoring and alerts
8. Review and adjust rate limits
9. Enable CSRF protection
10. Configure session timeouts

## API Documentation

For complete API documentation, see:
- Backend routes: `src/server/routes/`
- API examples: Tests in PowerShell above
- Postman collection: (to be created)

## Support

For issues or questions:
1. Check server logs in terminal
2. Check browser console
3. Review this guide
4. Check MULTIUSER_SETUP.md for setup details
5. Check MULTIUSER_IMPLEMENTATION.md for technical details

---

**Status**: ✅ Authentication system fully functional and tested
**Last Updated**: 2024
**Version**: 1.0
