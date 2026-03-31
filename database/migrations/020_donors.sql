-- Migration 020: Donors master table + FK on projects
-- Non-destructive: keeps projects.donor text column as backward-compat fallback

-- 1. Donors master table
CREATE TABLE IF NOT EXISTS donors (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL UNIQUE,
    short_name    VARCHAR(50),
    description   TEXT,
    website       VARCHAR(255),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    display_order INT          NOT NULL DEFAULT 0,
    created_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donors_active ON donors(is_active);

-- 2. Seed canonical donor names from existing project data
INSERT INTO donors (name)
SELECT DISTINCT TRIM(donor)
FROM   projects
WHERE  donor IS NOT NULL AND TRIM(donor) <> ''
ON CONFLICT (name) DO NOTHING;

-- 3. Add donor_id FK to projects (nullable for safe migration)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS donor_id UUID REFERENCES donors(id) ON DELETE SET NULL;

-- 4. Back-fill donor_id by matching the existing text values
UPDATE projects p
SET    donor_id = d.id
FROM   donors d
WHERE  TRIM(p.donor) = d.name
  AND  p.donor_id IS NULL;

-- 5. Index on projects.donor_id
CREATE INDEX IF NOT EXISTS idx_projects_donor_id ON projects(donor_id);
