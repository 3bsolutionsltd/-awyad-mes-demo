-- Migration: 008 - Create System Configurations
-- Description: Generic configuration table for all lookup data
-- Date: 2026-01-22
-- Author: Development Team

-- ============================================
-- SYSTEM CONFIGURATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(100) NOT NULL, -- Type: partner, location, service_type, donor, etc.
    config_code VARCHAR(100) NOT NULL, -- Unique code within type
    config_value VARCHAR(500) NOT NULL, -- The actual value
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Additional structured data
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES system_configurations(id) ON DELETE CASCADE, -- For hierarchical configs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Ensure unique code within each type
    UNIQUE(config_type, config_code)
);

-- ============================================
-- SEED INITIAL DATA
-- ============================================

-- Partners
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('partner', 'UNHCR', 'UNHCR', 'United Nations High Commissioner for Refugees', 1),
('partner', 'UNICEF', 'UNICEF', 'United Nations Children''s Fund', 2),
('partner', 'WFP', 'WFP', 'World Food Programme', 3),
('partner', 'IOM', 'IOM', 'International Organization for Migration', 4),
('partner', 'OTHER', 'Other Partner', 'Other partner organization', 99)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- Locations (Districts)
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('district', 'ADJUMANI', 'Adjumani', 'Adjumani District', 1),
('district', 'ARUA', 'Arua', 'Arua District', 2),
('district', 'KAMPALA', 'Kampala', 'Kampala District', 3),
('district', 'YUMBE', 'Yumbe', 'Yumbe District', 4)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- Service Types
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('service_type', 'COUNSELING', 'Counseling', 'Psychosocial counseling services', 1),
('service_type', 'LEGAL_AID', 'Legal Aid', 'Legal assistance and representation', 2),
('service_type', 'MEDICAL', 'Medical Services', 'Medical care and treatment', 3),
('service_type', 'SHELTER', 'Safe Shelter', 'Safe house accommodation', 4),
('service_type', 'ECONOMIC', 'Economic Support', 'Livelihood and economic empowerment', 5),
('service_type', 'EDUCATION', 'Education Support', 'Educational assistance', 6),
('service_type', 'REFERRAL', 'Referral', 'Referral to other services', 7)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- Donors
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('donor', 'UNHCR', 'UNHCR', 'United Nations High Commissioner for Refugees', 1),
('donor', 'USAID', 'USAID', 'United States Agency for International Development', 2),
('donor', 'EU', 'European Union', 'European Union Humanitarian Aid', 3),
('donor', 'SIDA', 'SIDA', 'Swedish International Development Cooperation Agency', 4),
('donor', 'DFID', 'DFID', 'UK Department for International Development', 5)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- Organizations (for referrals)
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('organization', 'POLICE', 'Uganda Police Force', 'Uganda Police Force', 1),
('organization', 'PROBATION', 'Probation Office', 'Probation and Social Welfare Office', 2),
('organization', 'HEALTH_CENTER', 'Health Center', 'Local Health Center', 3),
('organization', 'HOSPITAL', 'Regional Hospital', 'Regional Referral Hospital', 4),
('organization', 'OTHER_NGO', 'Other NGO', 'Other NGO organization', 99)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- Activity Types
INSERT INTO system_configurations (config_type, config_code, config_value, description, display_order) VALUES
('activity_type', 'TRAINING', 'Training Workshop', 'Training or capacity building workshop', 1),
('activity_type', 'AWARENESS', 'Awareness Session', 'Community awareness raising session', 2),
('activity_type', 'COUNSELING', 'Counseling Session', 'Individual or group counseling', 3),
('activity_type', 'DISTRIBUTION', 'Distribution', 'Material distribution activity', 4),
('activity_type', 'ASSESSMENT', 'Assessment', 'Needs assessment or evaluation', 5),
('activity_type', 'MEETING', 'Meeting', 'Stakeholder or coordination meeting', 6),
('activity_type', 'HOME_VISIT', 'Home Visit', 'Home visit or follow-up', 7)
ON CONFLICT (config_type, config_code) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_system_configurations_type ON system_configurations(config_type);
CREATE INDEX IF NOT EXISTS idx_system_configurations_code ON system_configurations(config_code);
CREATE INDEX IF NOT EXISTS idx_system_configurations_type_code ON system_configurations(config_type, config_code);
CREATE INDEX IF NOT EXISTS idx_system_configurations_active ON system_configurations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_system_configurations_parent ON system_configurations(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_configurations_metadata ON system_configurations USING gin(metadata) WHERE metadata IS NOT NULL;

-- ============================================
-- TRIGGER
-- ============================================

CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE system_configurations IS 'Generic configuration table for all lookup/dropdown data';
COMMENT ON COLUMN system_configurations.config_type IS 'Type of configuration (partner, location, service_type, etc.)';
COMMENT ON COLUMN system_configurations.config_code IS 'Unique code within the config_type';
COMMENT ON COLUMN system_configurations.config_value IS 'The display value';
COMMENT ON COLUMN system_configurations.metadata IS 'Additional structured data specific to config type';
COMMENT ON COLUMN system_configurations.parent_id IS 'For hierarchical configurations (e.g., sub-locations)';

-- Migration complete
-- Next step: Run 009_enhanced_roles.sql
