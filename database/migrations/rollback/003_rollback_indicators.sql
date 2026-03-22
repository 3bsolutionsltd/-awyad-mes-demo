-- Rollback Migration: 003 - Enhance Indicators Schema
-- Description: Reverts indicator enhancements back to original state
-- Date: 2026-03-12
-- Author: Database Schema & Migrations Agent

-- ============================================
-- DROP TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS validate_indicator_scope_trigger ON indicators;
DROP FUNCTION IF EXISTS validate_indicator_scope();

-- ============================================
-- DROP INDICATOR MAPPINGS TABLE
-- ============================================

DROP INDEX IF EXISTS idx_indicator_mappings_project;
DROP INDEX IF EXISTS idx_indicator_mappings_awyad;
DROP TABLE IF EXISTS indicator_mappings;

-- ============================================
-- REVERT INDICATORS TABLE CHANGES
-- ============================================

-- Drop new indexes
DROP INDEX IF EXISTS idx_indicators_result_area;
DROP INDEX IF EXISTS idx_indicators_project_id;
DROP INDEX IF EXISTS idx_indicators_data_type;
DROP INDEX IF EXISTS idx_indicators_level;
DROP INDEX IF EXISTS idx_indicators_scope;

-- Remove new columns (in reverse order of addition)
ALTER TABLE indicators DROP COLUMN IF EXISTS project_id;
ALTER TABLE indicators DROP COLUMN IF EXISTS baseline_date;
ALTER TABLE indicators DROP COLUMN IF EXISTS achieved;
ALTER TABLE indicators DROP COLUMN IF EXISTS annual_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS lop_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS q4_achieved;
ALTER TABLE indicators DROP COLUMN IF EXISTS q3_achieved;
ALTER TABLE indicators DROP COLUMN IF EXISTS q2_achieved;
ALTER TABLE indicators DROP COLUMN IF EXISTS q1_achieved;
ALTER TABLE indicators DROP COLUMN IF EXISTS q4_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS q3_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS q2_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS q1_target;
ALTER TABLE indicators DROP COLUMN IF EXISTS data_type;
ALTER TABLE indicators DROP COLUMN IF EXISTS indicator_level;
ALTER TABLE indicators DROP COLUMN IF EXISTS result_area;
ALTER TABLE indicators DROP COLUMN IF EXISTS indicator_scope;

-- Restore thematic_area_id as NOT NULL (if it was originally)
-- Note: This might fail if NULL values exist, handle with care in production
-- ALTER TABLE indicators ALTER COLUMN thematic_area_id SET NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE indicators IS 'Indicators table - reverted to original state';

-- Rollback complete
-- Previous migration: 002_update_projects.sql
