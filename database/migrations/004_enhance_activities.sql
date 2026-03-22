-- Migration: 004 - Enhance Activities Schema
-- Description: Adds currency support, disability tracking, disaggregation, and budget transfers
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- UPDATE ACTIVITIES TABLE
-- ============================================

-- Add costing flag
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_costed BOOLEAN DEFAULT TRUE;

-- Add currency support (default UGX, not USD)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'UGX';

-- Add disability tracking fields
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_other INTEGER DEFAULT 0;

-- Add enhanced age/gender disaggregation
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_0_4_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_0_4_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_0_4_other INTEGER DEFAULT 0;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_5_17_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_5_17_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_5_17_other INTEGER DEFAULT 0;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_18_49_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_18_49_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_18_49_other INTEGER DEFAULT 0;

ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_50_plus_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_50_plus_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS age_50_plus_other INTEGER DEFAULT 0;

-- Add nationality tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_congolese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_south_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_community INTEGER DEFAULT 0;

-- Update total beneficiaries calculation to include new disaggregation
-- First, drop dependent views if they exist
DROP VIEW IF EXISTS activity_summary_view CASCADE;

-- Drop the old generated column if it exists
ALTER TABLE activities DROP COLUMN IF EXISTS total_beneficiaries CASCADE;

-- Recreate with comprehensive calculation
ALTER TABLE activities ADD COLUMN total_beneficiaries INTEGER GENERATED ALWAYS AS (
    age_0_4_male + age_0_4_female + age_0_4_other +
    age_5_17_male + age_5_17_female + age_5_17_other +
    age_18_49_male + age_18_49_female + age_18_49_other +
    age_50_plus_male + age_50_plus_female + age_50_plus_other
) STORED;

-- Recreate the activity summary view if it existed
CREATE OR REPLACE VIEW activity_summary_view AS
SELECT 
    a.id,
    a.activity_name,
    a.planned_date,
    a.status,
    a.total_beneficiaries,
    a.budget as activity_budget,
    a.currency as activity_currency,
    a.is_costed,
    p.name as project_name,
    p.id as project_id,
    p.budget as project_budget,
    p.expenditure as project_expenditure,
    i.name as indicator_name,
    i.id as indicator_id,
    -- Calculate project burn rate
    CASE 
        WHEN p.budget > 0 THEN (p.expenditure / p.budget * 100)::NUMERIC(12,2)
        ELSE 0 
    END as project_burn_rate_percentage
FROM activities a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN indicators i ON a.indicator_id = i.id;

-- ============================================
-- BUDGET TRANSFERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_budget_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    source_project_id UUID NOT NULL REFERENCES projects(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    transfer_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- CURRENCY RATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Only one active rate per currency pair per date
    UNIQUE(from_currency, to_currency, effective_date)
);

-- Seed initial currency rates (UGX as base)
INSERT INTO currency_rates (from_currency, to_currency, rate, effective_date) VALUES
('UGX', 'UGX', 1.000000, CURRENT_DATE),
('USD', 'UGX', 3700.000000, CURRENT_DATE),
('EUR', 'UGX', 4050.000000, CURRENT_DATE),
('GBP', 'UGX', 4700.000000, CURRENT_DATE),
('UGX', 'USD', 0.00027, CURRENT_DATE),
('UGX', 'EUR', 0.00025, CURRENT_DATE),
('UGX', 'GBP', 0.00021, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activities_currency ON activities(currency);
CREATE INDEX IF NOT EXISTS idx_activities_is_costed ON activities(is_costed);

CREATE INDEX IF NOT EXISTS idx_budget_transfers_activity ON activity_budget_transfers(activity_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_source_project ON activity_budget_transfers(source_project_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_status ON activity_budget_transfers(status);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_date ON activity_budget_transfers(transfer_date);

CREATE INDEX IF NOT EXISTS idx_currency_rates_from ON currency_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_to ON currency_rates(to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON currency_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_currency_rates_active ON currency_rates(is_active);

-- ============================================
-- TRIGGER FOR BUDGET TRANSFERS
-- ============================================

CREATE TRIGGER update_budget_transfers_updated_at BEFORE UPDATE ON activity_budget_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currency_rates_updated_at BEFORE UPDATE ON currency_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN activities.is_costed IS 'Whether this activity has a budget/cost associated with it';
COMMENT ON COLUMN activities.currency IS 'Currency used for this activity (UGX, USD, EUR, GBP)';
COMMENT ON COLUMN activities.pwds_male IS 'Number of male persons with disabilities';
COMMENT ON COLUMN activities.pwds_female IS 'Number of female persons with disabilities';
COMMENT ON COLUMN activities.pwds_other IS 'Number of other gender persons with disabilities';

COMMENT ON TABLE activity_budget_transfers IS 'Tracks budget transfers between projects';
COMMENT ON COLUMN activity_budget_transfers.status IS 'Transfer status: pending, approved, or rejected';

COMMENT ON TABLE currency_rates IS 'Exchange rates for multi-currency support';
COMMENT ON COLUMN currency_rates.rate IS 'Exchange rate from source to target currency';

-- Migration complete
-- Next step: Run 005_overhaul_cases.sql
