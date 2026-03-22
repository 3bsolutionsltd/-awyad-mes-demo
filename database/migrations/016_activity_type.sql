-- Migration 016: Add activity_type to activities table
-- Supports: program | non_program classification

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_type VARCHAR(20) NOT NULL DEFAULT 'program'
    CHECK (activity_type IN ('program', 'non_program'));

CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities (activity_type);

COMMENT ON COLUMN activities.activity_type IS
  'Classifies the activity as a program activity (linked to a project/indicator) or a non-program activity (operational/administrative).';
