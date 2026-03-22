-- Migration: 015 - Add case_source to cases
-- Description: Adds case_source field as requested in feedback item #8
--              Also ensures referral_to column exists (from migration 005)
-- Date: 2026-01-23

-- Add case_source: where/how the case was referred in
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_source VARCHAR(200);

-- Add an index for filtering/reporting on case_source
CREATE INDEX IF NOT EXISTS idx_cases_case_source ON cases (case_source);
