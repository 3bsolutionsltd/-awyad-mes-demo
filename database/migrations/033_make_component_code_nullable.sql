-- Migration 033: Make component code field optional
-- The UI treats 'code' as an optional field, but the column was defined NOT NULL.
-- Dropping the NOT NULL constraint allows components to be created without a code.

ALTER TABLE core_program_components ALTER COLUMN code DROP NOT NULL;
