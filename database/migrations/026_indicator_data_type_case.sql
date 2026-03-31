-- Migration 026: Fix indicator data_type CHECK constraint to use title-case values
-- to match the Joi schema validation (Number, Percentage).
-- Also migrates any existing lowercase data.

BEGIN;

-- Drop old lowercase constraint
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_data_type_check;

-- Migrate any existing lowercase values
UPDATE indicators
SET data_type = initcap(data_type)
WHERE data_type IN ('number', 'percentage');

-- Add new title-case constraint
ALTER TABLE indicators
    ADD CONSTRAINT indicators_data_type_check
    CHECK (data_type IN ('Number', 'Percentage'));

COMMIT;
