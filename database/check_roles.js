import { Client } from 'pg';
const c = new Client({host:'localhost',port:5432,user:'postgres',password:'password123',database:'awyad_mes'});
await c.connect();
const r = await c.query(
  `SELECT r.name as role, p.name as perm 
   FROM role_permissions rp 
   JOIN roles r ON r.id=rp.role_id 
   JOIN permissions p ON p.id=rp.permission_id 
   WHERE r.name IN ('Admin','M&E Officer','Finance Officer','Project Coordinator')
   ORDER BY r.name, p.name`
);
r.rows.forEach(x=>console.log(x.role,'|',x.perm));
console.log('\nTotal role_permissions:',r.rowCount);
await c.end();
