-- Migration: 018 - Add notes column to cases
-- Description: Adds optional notes field to cases table.
--              The notes textarea was already present in the UI (caseForms.js)
--              but the column was missing from the DB, causing API validation errors
--              when users entered notes.

ALTER TABLE cases ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN cases.notes IS 'Optional free-text notes about the case (additional context)';
