# Multi-User Setup Guide

This guide will help you set up the multi-user authentication and database system.

## Prerequisites

1. **PostgreSQL Installation**
   - Download and install PostgreSQL from https://www.postgresql.org/download/
   - During installation, remember the password you set for the `postgres` user
   - Default port is 5432

2. **Verify PostgreSQL Installation**
   ```bash
   psql --version
   ```

## Setup Steps

### Option 1: With PostgreSQL Database (Multi-User Support)

1. **Update Environment Variables**
   
   Edit your `.env` file and set:
   ```env
   USE_DATABASE=true
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=awyad_mes
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your-secure-random-string-here
   ```

   **Important**: Generate a secure JWT secret:
   ```bash
   # On Windows PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   
   # Or use any random string generator
   ```

2. **Set up the Database**
   
   Run the database setup script:
   ```bash
   npm run db:setup
   ```

   This will:
   - Create the `awyad_mes` database
   - Create all tables (users, roles, permissions, etc.)
   - Seed initial roles and permissions
   - Create a default admin user

3. **Default Admin Credentials**
   
   After setup, you can login with:
   - **Email**: `admin@awyad.org`
   - **Password**: `Admin@123`
   
   **⚠️ IMPORTANT**: Change this password immediately after first login!

4. **Start the Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   
   Test the API:
   ```bash
   # Health check
   curl http://localhost:3001/api/v1/health
   
   # Login
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"emailOrUsername\":\"admin@awyad.org\",\"password\":\"Admin@123\"}"
   ```

### Option 2: Without Database (JSON Files - Single User)

If you don't want to set up PostgreSQL yet:

1. **Update Environment Variables**
   
   Edit your `.env` file:
   ```env
   USE_DATABASE=false
   ```

2. **Start the Server**
   ```bash
   npm run dev
   ```

   The system will use JSON file-based storage (single-user mode).

## User Roles and Permissions

The system comes with 4 pre-configured roles:

### 1. Administrator (admin)
- Full system access
- Can manage users, roles, and permissions
- Can create, read, update, delete all resources

### 2. Manager (manager)
- Can manage projects and activities
- Can view all data and reports
- Can manage team members
- Cannot manage system users or roles

### 3. User (user)
- Can create and edit their own activities
- Can view projects and indicators
- Can create and update cases
- Can view reports and dashboard

### 4. Viewer (viewer)
- Read-only access
- Can view all data and reports
- Cannot create or modify anything

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user (public)
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/auth/me` - Get current user profile

### User Management
- `GET /api/v1/users` - List all users (requires: users.read)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user (requires: users.create)
- `PUT /api/v1/users/:id` - Update user (requires: users.update)
- `DELETE /api/v1/users/:id` - Deactivate user (requires: users.delete)
- `POST /api/v1/users/:id/roles` - Assign roles (requires: users.manage_roles)
- `GET /api/v1/users/roles/list` - List all roles
- `GET /api/v1/users/permissions/list` - List all permissions

### Using the API

All authenticated endpoints require an access token in the Authorization header:

```bash
curl -X GET http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Management

### Reset Database (⚠️ Deletes all data)
```bash
npm run db:reset
```

### Verify Database Setup
```bash
npm run db:verify
```

### Manual Database Access
```bash
psql -U postgres -d awyad_mes
```

Common SQL queries:
```sql
-- View all users
SELECT * FROM users;

-- View user roles
SELECT u.email, r.name as role 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- View role permissions
SELECT r.name as role, p.name as permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.name, p.name;
```

## Troubleshooting

### Can't connect to PostgreSQL
1. Check if PostgreSQL service is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # If not running, start it:
   Start-Service postgresql-x64-XX  # Replace XX with your version
   ```

2. Verify connection settings in `.env` file
3. Try connecting with psql:
   ```bash
   psql -U postgres -h localhost
   ```

### Database setup fails
1. Check PostgreSQL logs for errors
2. Ensure user has permissions to create databases
3. Try manual database creation:
   ```sql
   CREATE DATABASE awyad_mes;
   ```

### Authentication not working
1. Verify `USE_DATABASE=true` in `.env`
2. Check that database was set up correctly: `npm run db:verify`
3. Ensure JWT_SECRET is set in `.env`
4. Check server logs for errors

### "Token expired" errors
- Access tokens expire in 1 hour by default
- Use the refresh token to get a new access token:
  ```bash
  curl -X POST http://localhost:3001/api/v1/auth/refresh-token \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
  ```

## Security Best Practices

1. **Change default credentials immediately**
2. **Use strong JWT_SECRET** (at least 32 random characters)
3. **Use HTTPS in production** (set `NODE_ENV=production`)
4. **Regularly update dependencies**: `npm audit fix`
5. **Enable rate limiting** (already configured)
6. **Monitor logs** for suspicious activity
7. **Backup database regularly**

## Next Steps

1. Change the default admin password
2. Create user accounts for your team members
3. Assign appropriate roles to each user
4. Test the authentication flow
5. Integrate frontend with the authentication APIs
6. Configure email service for password resets (TODO)
7. Set up database backups

## Support

For issues or questions:
1. Check the logs in `logs/app.log`
2. Review the API documentation
3. Contact the development team
