/**
 * Fix Database Permissions
 * Adds audit_logs.read and audit_logs.export permissions
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'awyad_mes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function fixPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing permissions...\n');
    
    // Step 1: Add audit_logs permissions
    console.log('Adding audit_logs permissions...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) 
      VALUES 
        ('audit_logs.read', 'audit_logs', 'read', 'View audit logs'),
        ('audit_logs.export', 'audit_logs', 'export', 'Export audit logs')
      ON CONFLICT (name) DO NOTHING
    `);
    
    // Step 2: Get admin role ID
    const adminRole = await client.query(`SELECT id FROM roles WHERE name = 'admin'`);
    if (adminRole.rows.length === 0) {
      throw new Error('Admin role not found!');
    }
    const adminRoleId = adminRole.rows[0].id;
    console.log(`✓ Admin role ID: ${adminRoleId}`);
    
    // Step 3: Get audit_logs permissions IDs
    const auditPerms = await client.query(`
      SELECT id, name FROM permissions WHERE name LIKE 'audit_logs.%'
    `);
    console.log(`✓ Found ${auditPerms.rows.length} audit_logs permissions`);
    
    // Step 4: Assign permissions to admin role
    for (const perm of auditPerms.rows) {
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [adminRoleId, perm.id]);
      console.log(`  ✓ Assigned ${perm.name} to admin role`);
    }
    
    // Step 5: Verify admin permissions
    const adminPermissions = await client.query(`
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1 AND p.name LIKE 'audit_logs.%'
    `, [adminRoleId]);
    
    console.log('\n✅ Admin role audit_logs permissions:');
    adminPermissions.rows.forEach(row => {
      console.log(`   • ${row.name}`);
    });
    
    console.log('\n✅ Permissions fixed successfully!');
    console.log('   Server restart required for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPermissions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
