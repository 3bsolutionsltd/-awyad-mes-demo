-- Rollback: 001 - Create Strategic Hierarchy Tables
-- Description: Drops strategies, pillars, and core_program_components tables
-- Date: 2026-01-22

-- Drop triggers first
DROP TRIGGER IF EXISTS update_components_updated_at ON core_program_components;
DROP TRIGGER IF EXISTS update_pillars_updated_at ON pillars;
DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;

-- Drop tables in reverse order (child to parent)
DROP TABLE IF EXISTS core_program_components CASCADE;
DROP TABLE IF EXISTS pillars CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;

-- Drop the trigger function if no other tables use it
-- (Be careful with this - only drop if not used elsewhere)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Rollback complete
