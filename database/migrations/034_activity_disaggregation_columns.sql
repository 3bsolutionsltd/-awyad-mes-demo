-- Migration 034: Add missing disaggregation columns to activities table
-- These columns are referenced by the API but were not present in all DB instances

-- Refugee breakdown by age/gender
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_male_0_4 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_male_5_17 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_male_18_49 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_male_50_plus INTEGER DEFAULT 0;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_female_0_4 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_female_5_17 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_female_18_49 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_female_50_plus INTEGER DEFAULT 0;

-- Host community breakdown by age/gender
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_male_0_4 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_male_5_17 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_male_18_49 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_male_50_plus INTEGER DEFAULT 0;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_female_0_4 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_female_5_17 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_female_18_49 INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_female_50_plus INTEGER DEFAULT 0;

-- Nationality disaggregation
ALTER TABLE activities ADD COLUMN IF NOT EXISTS nationality_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS nationality_congolese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS nationality_south_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS nationality_others INTEGER DEFAULT 0;

-- Population type totals
ALTER TABLE activities ADD COLUMN IF NOT EXISTS nationals INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugees INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS idps INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS returnees INTEGER DEFAULT 0;

-- Target and achieved tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS achieved_value INTEGER DEFAULT 0;

-- Activity type
ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50) DEFAULT 'program';

-- Exchange rate
ALTER TABLE activities ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4) DEFAULT 1.0;

-- Beneficiary ID, lat/lng
ALTER TABLE activities ADD COLUMN IF NOT EXISTS beneficiary_id VARCHAR(100);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
