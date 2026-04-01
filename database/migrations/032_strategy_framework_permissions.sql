-- Migration: 032 - Add permissions for strategies, pillars, and components
-- Idempotent: uses ON CONFLICT DO NOTHING

INSERT INTO permissions (name, resource, action, description) VALUES
    ('strategies.create',    'strategies',  'create',  'Create new strategies'),
    ('strategies.read',      'strategies',  'read',    'View strategies'),
    ('strategies.update',    'strategies',  'update',  'Update strategies'),
    ('strategies.delete',    'strategies',  'delete',  'Delete strategies'),
    ('pillars.create',       'pillars',     'create',  'Create new pillars'),
    ('pillars.read',         'pillars',     'read',    'View pillars'),
    ('pillars.update',       'pillars',     'update',  'Update pillars'),
    ('pillars.delete',       'pillars',     'delete',  'Delete pillars'),
    ('components.create',    'components',  'create',  'Create new programme components'),
    ('components.read',      'components',  'read',    'View programme components'),
    ('components.update',    'components',  'update',  'Update programme components'),
    ('components.delete',    'components',  'delete',  'Delete programme components')
ON CONFLICT (name) DO NOTHING;

-- Grant all new permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'strategies.create', 'strategies.read', 'strategies.update', 'strategies.delete',
    'pillars.create',    'pillars.read',    'pillars.update',    'pillars.delete',
    'components.create', 'components.read', 'components.update', 'components.delete'
  )
ON CONFLICT DO NOTHING;

-- Grant read permissions to manager and user roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('manager', 'user')
  AND p.name IN (
    'strategies.read', 'pillars.read', 'components.read'
  )
ON CONFLICT DO NOTHING;

-- Grant read permissions to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'strategies.read', 'pillars.read', 'components.read'
  )
ON CONFLICT DO NOTHING;
