-- Rollback: 007 - Create Non-Program Activities
-- Description: Drops non-program activities tables
-- Date: 2026-01-22

-- Drop triggers
DROP TRIGGER IF EXISTS update_non_program_activities_updated_at ON non_program_activities;
DROP TRIGGER IF EXISTS update_non_program_categories_updated_at ON non_program_categories;

-- Drop indexes
DROP INDEX IF EXISTS idx_non_program_activities_completion_date;
DROP INDEX IF EXISTS idx_non_program_activities_planned_date;
DROP INDEX IF EXISTS idx_non_program_activities_status;
DROP INDEX IF EXISTS idx_non_program_activities_category;
DROP INDEX IF EXISTS idx_non_program_categories_code;
DROP INDEX IF EXISTS idx_non_program_categories_active;

-- Drop tables
DROP TABLE IF EXISTS non_program_activities CASCADE;
DROP TABLE IF EXISTS non_program_categories CASCADE;

-- Rollback complete
