-- Migration: 005 - Overhaul Case Management
-- Description: Removes name fields, adds referral tracking, case types/categories
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- CASE TYPES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS case_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Seed initial case types
INSERT INTO case_types (code, name, description, display_order) VALUES
('GBV', 'Gender-Based Violence', 'Cases related to gender-based violence', 1),
('CP', 'Child Protection', 'Child protection cases', 2),
('LEGAL', 'Legal Assistance', 'Legal aid and protection cases', 3),
('PSYCHOSOCIAL', 'Psychosocial Support', 'Mental health and psychosocial support cases', 4),
('OTHER', 'Other Protection', 'Other protection-related cases', 5)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- CASE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS case_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_type_id UUID REFERENCES case_types(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Seed initial categories (examples)
INSERT INTO case_categories (case_type_id, code, name, display_order) 
SELECT id, 'GBV_IPV', 'Intimate Partner Violence', 1 FROM case_types WHERE code = 'GBV'
UNION ALL
SELECT id, 'GBV_SA', 'Sexual Assault', 2 FROM case_types WHERE code = 'GBV'
UNION ALL
SELECT id, 'CP_ABUSE', 'Child Abuse', 1 FROM case_types WHERE code = 'CP'
UNION ALL
SELECT id, 'CP_NEGLECT', 'Child Neglect', 2 FROM case_types WHERE code = 'CP'
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- UPDATE CASES TABLE
-- ============================================

-- Remove any name-related columns if they exist
ALTER TABLE cases DROP COLUMN IF EXISTS beneficiary_name;
ALTER TABLE cases DROP COLUMN IF EXISTS name;
ALTER TABLE cases DROP COLUMN IF EXISTS full_name;

-- Add case type and category foreign keys
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type_id UUID REFERENCES case_types(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_category_id UUID REFERENCES case_categories(id);

-- Add referral tracking
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referred_from VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referred_to VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referral_date DATE;

-- Rename or add support_offered column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'service_provided') THEN
        ALTER TABLE cases RENAME COLUMN service_provided TO support_offered;
    ELSE
        ALTER TABLE cases ADD COLUMN support_offered TEXT;
    END IF;
END $$;

-- Add additional case fields
ALTER TABLE cases ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS disability_status VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT FALSE;

-- Add dynamic tracking tags (JSONB for flexibility)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tracking_tags JSONB DEFAULT '[]'::jsonb;

-- Add case worker if not exists
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_worker VARCHAR(200);

-- Update existing case_type field to be compatible
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'case_type' AND data_type = 'character varying') THEN
        -- Migrate old case_type text to new case_type_id
        -- This is a placeholder - actual migration would need data mapping
        ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type_old VARCHAR(100);
        EXECUTE 'UPDATE cases SET case_type_old = case_type WHERE case_type_id IS NULL';
        ALTER TABLE cases DROP COLUMN IF EXISTS case_type;
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_case_types_active ON case_types(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_case_types_code ON case_types(code);

CREATE INDEX IF NOT EXISTS idx_case_categories_type ON case_categories(case_type_id);
CREATE INDEX IF NOT EXISTS idx_case_categories_active ON case_categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_case_categories_code ON case_categories(code);

CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type_id);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(case_category_id);
CREATE INDEX IF NOT EXISTS idx_cases_referred_from ON cases(referred_from);
CREATE INDEX IF NOT EXISTS idx_cases_referred_to ON cases(referred_to);
CREATE INDEX IF NOT EXISTS idx_cases_has_disability ON cases(has_disability);
CREATE INDEX IF NOT EXISTS idx_cases_nationality ON cases(nationality);
CREATE INDEX IF NOT EXISTS idx_cases_case_worker ON cases(case_worker);

-- GIN index for tags
CREATE INDEX IF NOT EXISTS idx_cases_tracking_tags ON cases USING gin(tracking_tags);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_case_types_updated_at BEFORE UPDATE ON case_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_categories_updated_at BEFORE UPDATE ON case_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE case_types IS 'Configurable case types (GBV, Child Protection, etc.)';
COMMENT ON TABLE case_categories IS 'Categories within each case type';

COMMENT ON COLUMN cases.case_type_id IS 'Reference to case type (replaces old text field)';
COMMENT ON COLUMN cases.case_category_id IS 'Reference to case category';
COMMENT ON COLUMN cases.referred_from IS 'Partner/organization that referred the case to us';
COMMENT ON COLUMN cases.referred_to IS 'Partner/organization we referred the case to';
COMMENT ON COLUMN cases.support_offered IS 'Confidential notes on support/services offered (replaces case_description)';
COMMENT ON COLUMN cases.tracking_tags IS 'Dynamic tags for flexible case tracking (JSONB array)';

-- Migration complete
-- Next step: Run 006_monthly_snapshots.sql
