-- Migration: 019 - Seed initial roles, permissions, and admin user
-- Idempotent: all inserts use ON CONFLICT DO NOTHING

-- ============================================
-- ROLES
-- ============================================

INSERT INTO roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrator', 'Full system access with all permissions', true),
    ('manager', 'Manager', 'Can manage projects, activities, and view reports', true),
    ('user', 'User', 'Can create and edit own activities and view data', true),
    ('viewer', 'Viewer', 'Read-only access to view data and reports', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PERMISSIONS
-- ============================================

INSERT INTO permissions (name, resource, action, description) VALUES
    ('users.create', 'users', 'create', 'Create new users'),
    ('users.read', 'users', 'read', 'View user information'),
    ('users.update', 'users', 'update', 'Update user information'),
    ('users.delete', 'users', 'delete', 'Delete users'),
    ('users.manage_roles', 'users', 'manage_roles', 'Assign roles to users'),
    ('roles.create', 'roles', 'create', 'Create new roles'),
    ('roles.read', 'roles', 'read', 'View roles and permissions'),
    ('roles.update', 'roles', 'update', 'Update role permissions'),
    ('roles.delete', 'roles', 'delete', 'Delete roles'),
    ('projects.create', 'projects', 'create', 'Create new projects'),
    ('projects.read', 'projects', 'read', 'View projects'),
    ('projects.update', 'projects', 'update', 'Update projects'),
    ('projects.delete', 'projects', 'delete', 'Delete projects'),
    ('projects.manage_members', 'projects', 'manage_members', 'Manage project team members'),
    ('activities.create', 'activities', 'create', 'Create new activities'),
    ('activities.read', 'activities', 'read', 'View activities'),
    ('activities.update', 'activities', 'update', 'Update activities'),
    ('activities.delete', 'activities', 'delete', 'Delete activities'),
    ('activities.read_all', 'activities', 'read_all', 'View all activities'),
    ('indicators.create', 'indicators', 'create', 'Create new indicators'),
    ('indicators.read', 'indicators', 'read', 'View indicators'),
    ('indicators.update', 'indicators', 'update', 'Update indicators'),
    ('indicators.delete', 'indicators', 'delete', 'Delete indicators'),
    ('cases.create', 'cases', 'create', 'Create new cases'),
    ('cases.read', 'cases', 'read', 'View cases'),
    ('cases.update', 'cases', 'update', 'Update cases'),
    ('cases.delete', 'cases', 'delete', 'Delete cases'),
    ('reports.view', 'reports', 'view', 'View reports and analytics'),
    ('reports.export', 'reports', 'export', 'Export data and reports'),
    ('dashboard.view', 'dashboard', 'view', 'View dashboard'),
    ('dashboard.view_all', 'dashboard', 'view_all', 'View all data on dashboard'),
    ('audit_logs.read', 'audit_logs', 'read', 'View audit logs'),
    ('audit_logs.export', 'audit_logs', 'export', 'Export audit logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROLE PERMISSIONS
-- ============================================

-- role_permissions table may not exist yet if schema didn't create it
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'manager'
AND p.name IN (
    'projects.create','projects.read','projects.update','projects.manage_members',
    'activities.create','activities.read','activities.update','activities.read_all',
    'indicators.read','indicators.create','indicators.update',
    'cases.create','cases.read','cases.update',
    'reports.view','reports.export',
    'dashboard.view','dashboard.view_all',
    'users.read'
)
ON CONFLICT DO NOTHING;

-- User
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'user'
AND p.name IN (
    'projects.read',
    'activities.create','activities.read','activities.update',
    'indicators.read',
    'cases.create','cases.read','cases.update',
    'reports.view','reports.export',
    'dashboard.view'
)
ON CONFLICT DO NOTHING;

-- Viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.name IN (
    'projects.read','activities.read','indicators.read',
    'cases.read','reports.view','dashboard.view'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- ADMIN USER
-- password: Admin123!
-- hash generated with bcrypt rounds=10
-- ============================================

INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified)
VALUES (
    'admin@awyad.org',
    'admin',
    '$2a$10$mPFBYGjdCog597PfaGAVCe75t6mkZXwvPl2lL3nr6.PzTXxr5i/eS',
    'System',
    'Admin',
    true,
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = '$2a$10$mPFBYGjdCog597PfaGAVCe75t6mkZXwvPl2lL3nr6.PzTXxr5i/eS',
    is_active = true,
    is_verified = true;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'admin'
ON CONFLICT DO NOTHING;
