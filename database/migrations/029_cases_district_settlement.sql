-- Migration: 029 - Add district_id and settlement_id to cases table
-- Description: Replaces free-text location field with structured district/settlement references
-- Date: 2026-03-31

ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS district_id   UUID REFERENCES system_configurations(id),
    ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES system_configurations(id);

-- Make location optional (will be computed from district/settlement when provided)
ALTER TABLE cases ALTER COLUMN location DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN location SET DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_cases_district    ON cases(district_id);
CREATE INDEX IF NOT EXISTS idx_cases_settlement  ON cases(settlement_id);
