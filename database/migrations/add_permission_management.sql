-- Add permissions for permission management
-- This allows admins to view and manage the permission matrix

-- Insert permission management permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('permissions.read', 'permissions', 'read', 'View permissions and permission matrix'),
    ('permissions.manage', 'permissions', 'manage', 'Grant and revoke permissions to roles')
ON CONFLICT (name) DO NOTHING;

-- Assign to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('permissions.read', 'permissions.manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verification query (comment out after running)
-- SELECT 
--     r.name as role_name,
--     p.name as permission_name,
--     p.description
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- WHERE p.resource = 'permissions'
-- ORDER BY r.name, p.name;
