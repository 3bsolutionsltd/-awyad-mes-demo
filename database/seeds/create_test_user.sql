-- Create test user with password: test123
-- This uses Node.js to generate a fresh bcrypt hash

-- First, let's check if admin user exists
SELECT id, username, email, is_active, created_at 
FROM users 
WHERE username = 'admin';

-- If no admin user, run this:
-- Generate hash using: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('test123', 10).then(hash => console.log(hash));"

-- Example INSERT (use generated hash from above):
/*
INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_verified)
VALUES (
    'test@awyad.org',
    'testuser',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- test123
    'Test',
    'User',
    true,
    true
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
*/
