-- Migration: 031 - Fix null display_name on roles
-- Description: Backfill display_name for roles inserted without it (e.g. via migration 009)
-- Idempotent: only updates rows where display_name IS NULL

UPDATE roles
SET display_name = INITCAP(name)
WHERE display_name IS NULL;

-- Also restore NOT NULL constraint now that all rows have a value
ALTER TABLE roles ALTER COLUMN display_name SET NOT NULL;
