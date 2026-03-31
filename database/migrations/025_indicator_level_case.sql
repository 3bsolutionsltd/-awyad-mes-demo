-- Migration 025: Fix indicator_level CHECK constraint to use title-case values
-- to match the Joi schema validation (Output, Outcome, Impact).
-- Also migrates any existing lowercase data.

BEGIN;

-- Drop old lowercase constraint
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_indicator_level_check;

-- Migrate any existing lowercase values
UPDATE indicators
SET indicator_level = initcap(indicator_level)
WHERE indicator_level IN ('output', 'outcome', 'impact');

-- Add new title-case constraint
ALTER TABLE indicators
    ADD CONSTRAINT indicators_indicator_level_check
    CHECK (indicator_level IN ('Output', 'Outcome', 'Impact'));

COMMIT;
