-- Migration: 036 - Add Reporting Month to Activities
-- Description: Adds reporting_month field to track which month an activity is being reported for
-- This supports monthly reporting requirements (GitHub Issues #12 and #13)

-- Add reporting_month column to activities table
-- Format: YYYY-MM (e.g., '2024-01', '2024-12')
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS reporting_month VARCHAR(7);

-- Add index for filtering by reporting month
CREATE INDEX IF NOT EXISTS idx_activities_reporting_month 
ON activities(reporting_month);

-- Add comment to document the field
COMMENT ON COLUMN activities.reporting_month IS 'Month for which this activity is being reported (format: YYYY-MM)';

-- Migration completed
