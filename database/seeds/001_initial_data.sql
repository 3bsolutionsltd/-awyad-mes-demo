-- Seed data for roles and permissions
-- Run this after schema.sql

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================

INSERT INTO roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrator', 'Full system access with all permissions', true),
    ('manager', 'Manager', 'Can manage projects, activities, and view reports', true),
    ('user', 'User', 'Can create and edit own activities and view data', true),
    ('viewer', 'Viewer', 'Read-only access to view data and reports', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================

-- User management permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('users.create', 'users', 'create', 'Create new users'),
    ('users.read', 'users', 'read', 'View user information'),
    ('users.update', 'users', 'update', 'Update user information'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('users.manage_roles', 'users', 'manage_roles', 'Assign roles to users')
ON CONFLICT (name) DO NOTHING;

-- Role management permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('roles.create', 'roles', 'create', 'Create new roles'),
    ('roles.read', 'roles', 'read', 'View roles'),
    ('roles.update', 'roles', 'update', 'Update roles'),
    ('roles.delete', 'roles', 'delete', 'Delete roles'),
    ('roles.manage_permissions', 'roles', 'manage_permissions', 'Assign permissions to roles')
ON CONFLICT (name) DO NOTHING;

-- Project permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('projects.create', 'projects', 'create', 'Create new projects'),
    ('projects.read', 'projects', 'read', 'View projects'),
    ('projects.update', 'projects', 'update', 'Update projects'),
    ('projects.delete', 'projects', 'delete', 'Delete projects'),
    ('projects.manage_members', 'projects', 'manage_members', 'Manage project team members')
ON CONFLICT (name) DO NOTHING;

-- Activity permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('activities.create', 'activities', 'create', 'Create new activities'),
    ('activities.read', 'activities', 'read', 'View activities'),
    ('activities.update', 'activities', 'update', 'Update activities'),
    ('activities.delete', 'activities', 'delete', 'Delete activities'),
    ('activities.read_all', 'activities', 'read_all', 'View all activities (not just own)')
ON CONFLICT (name) DO NOTHING;

-- Indicator permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('indicators.create', 'indicators', 'create', 'Create new indicators'),
    ('indicators.read', 'indicators', 'read', 'View indicators'),
    ('indicators.update', 'indicators', 'update', 'Update indicators'),
    ('indicators.delete', 'indicators', 'delete', 'Delete indicators')
ON CONFLICT (name) DO NOTHING;

-- Case permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('cases.create', 'cases', 'create', 'Create new cases'),
    ('cases.read', 'cases', 'read', 'View cases'),
    ('cases.update', 'cases', 'update', 'Update cases'),
    ('cases.delete', 'cases', 'delete', 'Delete cases')
ON CONFLICT (name) DO NOTHING;

-- Report permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('reports.view', 'reports', 'view', 'View reports and analytics'),
    ('reports.export', 'reports', 'export', 'Export data and reports')
ON CONFLICT (name) DO NOTHING;

-- Dashboard permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('dashboard.view', 'dashboard', 'view', 'View dashboard'),
    ('dashboard.view_all', 'dashboard', 'view_all', 'View all organization data on dashboard')
ON CONFLICT (name) DO NOTHING;

-- Audit log permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('audit_logs.read', 'audit_logs', 'read', 'View audit logs'),
    ('audit_logs.export', 'audit_logs', 'export', 'Export audit logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: Project and activity management, view all data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
AND p.name IN (
    'projects.create', 'projects.read', 'projects.update', 'projects.manage_members',
    'activities.create', 'activities.read', 'activities.update', 'activities.read_all',
    'indicators.read', 'indicators.create', 'indicators.update',
    'cases.create', 'cases.read', 'cases.update',
    'reports.view', 'reports.export',
    'dashboard.view', 'dashboard.view_all',
    'users.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User: Create and edit own activities, view data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
AND p.name IN (
    'projects.read',
    'activities.create', 'activities.read', 'activities.update',
    'indicators.read',
    'cases.create', 'cases.read', 'cases.update',
    'reports.view', 'reports.export',
    'dashboard.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.name IN (
    'projects.read',
    'activities.read',
    'indicators.read',
    'cases.read',
    'reports.view',
    'dashboard.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- CREATE DEFAULT ADMIN USER
-- Password: Admin@123 (CHANGE THIS IMMEDIATELY!)
-- ============================================

-- Note: This uses a pre-hashed password with bcrypt (cost=10)
-- Hash for "Admin@123"
INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified)
VALUES (
    'admin@awyad.org',
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Admin@123
    'System',
    'Administrator',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role to default admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@awyad.org'
AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify roles created
SELECT 'Roles created:' as info, count(*) as count FROM roles;

-- Verify permissions created
SELECT 'Permissions created:' as info, count(*) as count FROM permissions;

-- Verify role-permission assignments
SELECT 'Role-permission assignments:' as info, count(*) as count FROM role_permissions;

-- Verify admin user created
SELECT 'Admin user created:' as info, count(*) as count FROM users WHERE email = 'admin@awyad.org';

-- Show role-permission summary
SELECT 
    r.name as role,
    r.display_name,
    count(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY permission_count DESC;
