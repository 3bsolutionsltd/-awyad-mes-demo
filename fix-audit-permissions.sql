-- Grant audit_logs permissions to admin role

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.resource = 'audit_logs'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Verify
SELECT 
    r.name as role_name,
    p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'audit_logs'
ORDER BY r.name, p.name;
