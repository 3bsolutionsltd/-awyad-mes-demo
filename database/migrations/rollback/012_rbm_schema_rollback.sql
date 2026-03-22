-- ============================================================
-- Rollback for Migration 012: RBM Schema
-- Reverses all changes made by 012_rbm_schema.sql
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS validation_audit_log    CASCADE;
DROP TABLE IF EXISTS activity_indicators     CASCADE;
DROP TABLE IF EXISTS indicator_values        CASCADE;
DROP TABLE IF EXISTS project_indicators      CASCADE;
DROP TABLE IF EXISTS organizational_indicators CASCADE;

ALTER TABLE thematic_areas
    DROP COLUMN IF EXISTS core_program_component_id;

COMMIT;
