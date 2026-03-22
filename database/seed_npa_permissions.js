import { Client } from 'pg';
const client = new Client({ host:'localhost', port:5432, user:'postgres', password:'password123', database:'awyad_mes' });
await client.connect();

await client.query(`
  INSERT INTO permissions (name, resource, action, description) VALUES
    ('non_program_activities.read',   'non_program_activities', 'read',   'View non-program activities'),
    ('non_program_activities.create', 'non_program_activities', 'create', 'Create non-program activities'),
    ('non_program_activities.update', 'non_program_activities', 'update', 'Update non-program activities'),
    ('non_program_activities.delete', 'non_program_activities', 'delete', 'Delete non-program activities')
  ON CONFLICT (name) DO NOTHING
`);

await client.query(`
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permissions p
  WHERE p.name LIKE 'non_program_activities.%'
  ON CONFLICT DO NOTHING
`);

const rows = await client.query(`
  SELECT p.name, COUNT(rp.role_id) AS granted_to_roles
  FROM permissions p
  LEFT JOIN role_permissions rp ON rp.permission_id = p.id
  WHERE p.name LIKE 'non_program_activities.%'
  GROUP BY p.name ORDER BY p.name
`);
console.log('Permissions seeded:');
rows.rows.forEach(r => console.log(` ${r.name} -> ${r.granted_to_roles} roles`));
await client.end();
