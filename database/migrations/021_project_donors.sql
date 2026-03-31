-- Migration 021: Many-to-many junction table for projects <-> donors
-- Replaces the single donor_id FK on projects with a junction table.

-- 1. Junction table
CREATE TABLE IF NOT EXISTS project_donors (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    donor_id   UUID NOT NULL REFERENCES donors(id)   ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_project_donors_project ON project_donors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_donors_donor   ON project_donors(donor_id);

-- 2. Back-fill from existing single donor_id on projects
INSERT INTO project_donors (project_id, donor_id)
SELECT id, donor_id
FROM projects
WHERE donor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Remove the now-redundant single donor_id FK from projects
--    (keep the legacy `donor` text column for display fallback)
ALTER TABLE projects DROP COLUMN IF EXISTS donor_id;
