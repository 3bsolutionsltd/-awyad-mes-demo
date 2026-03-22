-- Add target and achieved tracking to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS achieved_value INTEGER DEFAULT 0;

-- Add target and achieved tracking to indicators table for aggregated values
-- (These already exist as target and baseline, but let's add achieved)
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS achieved INTEGER DEFAULT 0;

-- Update the indicators to calculate achieved from their activities
UPDATE indicators i
SET achieved = (
    SELECT COALESCE(SUM(direct_male + direct_female + direct_other), 0)
    FROM activities a
    WHERE a.indicator_id = i.id
)
WHERE i.achieved = 0;
