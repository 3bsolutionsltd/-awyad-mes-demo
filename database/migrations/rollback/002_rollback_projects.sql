-- Rollback: 002 - Update Projects Table
-- Description: Removes core_program_component_id and result_area from projects
-- Date: 2026-01-22

-- Drop indexes first
DROP INDEX IF EXISTS idx_projects_result_area;
DROP INDEX IF EXISTS idx_projects_component_id;

-- Drop columns
ALTER TABLE projects DROP COLUMN IF EXISTS result_area;
ALTER TABLE projects DROP COLUMN IF EXISTS core_program_component_id;

-- Rollback complete
