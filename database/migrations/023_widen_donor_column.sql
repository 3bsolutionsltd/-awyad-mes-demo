-- Migration 023: Widen projects.donor from VARCHAR(100) to TEXT
-- The donor field is a denormalized display string (comma-joined donor names)
-- and can exceed 100 chars when multiple donors are selected.

ALTER TABLE projects
    ALTER COLUMN donor TYPE TEXT;
