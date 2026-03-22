-- Rollback: 009 - Enhanced User Roles
-- Description: Removes enhanced roles and role hierarchy
-- Date: 2026-01-22

-- Drop indexes
DROP INDEX IF EXISTS idx_role_hierarchy_child;
DROP INDEX IF EXISTS idx_role_hierarchy_parent;

-- Drop role hierarchy table
DROP TABLE IF EXISTS role_hierarchy CASCADE;

-- Remove newly added roles
DELETE FROM roles WHERE name IN (
    'Project Coordinator',
    'M&E Officer',
    'M&E Assistant',
    'Finance Officer',
    'Finance Assistant',
    'Executive',
    'Admin'
);

-- Rollback complete
