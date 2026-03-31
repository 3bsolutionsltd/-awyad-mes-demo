-- Migration 024: Add budget_currency column to projects table
-- Allows each project to store its own currency code

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
