-- Migration 022: Add donor CRUD permissions and assign to roles

-- Insert donor permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('donors.create', 'donors', 'create', 'Create new donors'),
    ('donors.read',   'donors', 'read',   'View donors'),
    ('donors.update', 'donors', 'update', 'Update donors'),
    ('donors.delete', 'donors', 'delete', 'Delete donors')
ON CONFLICT (name) DO NOTHING;

-- Assign all donor permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.resource = 'donors'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read permission to manager, user, and viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('manager', 'user', 'viewer')
  AND p.name = 'donors.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign create/update to manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN ('donors.create', 'donors.update')
ON CONFLICT (role_id, permission_id) DO NOTHING;
