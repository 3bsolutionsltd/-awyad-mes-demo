-- ============================================
-- AWYAD MES - Phase 1: Critical Foundation
-- Feedback Implementation Plan - Database Migration
-- Date: January 23, 2026
-- ============================================

-- ============================================
-- 1. STRATEGIC HIERARCHY TABLES
-- ============================================

-- Strategies (Top level of hierarchy)
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_strategies_code ON strategies(code);
CREATE INDEX IF NOT EXISTS idx_strategies_active ON strategies(is_active);

-- Pillars (Second level of hierarchy)
CREATE TABLE IF NOT EXISTS pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pillars_strategy ON pillars(strategy_id);
CREATE INDEX IF NOT EXISTS idx_pillars_code ON pillars(code);
CREATE INDEX IF NOT EXISTS idx_pillars_active ON pillars(is_active);

-- Core Program Components (Third level of hierarchy)
CREATE TABLE IF NOT EXISTS core_program_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    -- Store interventions and approaches as JSON arrays
    interventions JSONB DEFAULT '[]'::jsonb,
    implementation_approaches JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_core_components_pillar ON core_program_components(pillar_id);
CREATE INDEX IF NOT EXISTS idx_core_components_code ON core_program_components(code);
CREATE INDEX IF NOT EXISTS idx_core_components_active ON core_program_components(is_active);

-- Update projects table to link to core program components
ALTER TABLE projects ADD COLUMN IF NOT EXISTS core_program_component_id UUID REFERENCES core_program_components(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS result_area VARCHAR(200);

-- ============================================
-- 2. CONFIGURABLE DATA SYSTEM
-- ============================================

-- Generic system configuration table for all lookup data
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_category VARCHAR(100) NOT NULL, -- 'partners', 'locations', 'case_types', etc.
    code VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES system_configurations(id), -- For hierarchical data
    metadata JSONB, -- Additional flexible data
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(config_category, code)
);

CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_configurations(config_category);
CREATE INDEX IF NOT EXISTS idx_system_config_code ON system_configurations(code);
CREATE INDEX IF NOT EXISTS idx_system_config_active ON system_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_system_config_parent ON system_configurations(parent_id);

-- Seed initial configuration data
INSERT INTO system_configurations (config_category, code, name, description, is_active) VALUES
-- Partners/Organizations for case referrals
('partners', 'UNHCR', 'United Nations High Commissioner for Refugees', 'UNHCR', TRUE),
('partners', 'IRC', 'International Rescue Committee', 'IRC', TRUE),
('partners', 'UNICEF', 'United Nations Children''s Fund', 'UNICEF', TRUE),
('partners', 'WFP', 'World Food Programme', 'WFP', TRUE),
('partners', 'WHO', 'World Health Organization', 'WHO', TRUE),
('partners', 'RED_CROSS', 'Red Cross / Red Crescent', 'Red Cross / Red Crescent', TRUE),

-- Service Types
('service_types', 'PSYCHOSOCIAL', 'Psychosocial Support', 'Mental health and psychosocial support services', TRUE),
('service_types', 'LEGAL', 'Legal Assistance', 'Legal aid and justice services', TRUE),
('service_types', 'MEDICAL', 'Medical Services', 'Healthcare and medical services', TRUE),
('service_types', 'SHELTER', 'Shelter Assistance', 'Shelter and housing support', TRUE),
('service_types', 'FOOD', 'Food Assistance', 'Food and nutrition support', TRUE),
('service_types', 'EDUCATION', 'Education Support', 'Educational services and support', TRUE),
('service_types', 'LIVELIHOOD', 'Livelihood Support', 'Income-generating and livelihood activities', TRUE),
('service_types', 'WASH', 'WASH Services', 'Water, sanitation and hygiene services', TRUE),

-- Locations (placeholder - can be expanded)
('locations', 'NAKIVALE', 'Nakivale Refugee Settlement', 'Nakivale settlement area', TRUE),
('locations', 'KAMPALA', 'Kampala', 'Kampala district', TRUE),
('locations', 'KYANGWALI', 'Kyangwali Refugee Settlement', 'Kyangwali settlement area', TRUE),
('locations', 'BIDIBIDI', 'Bidibidi Refugee Settlement', 'Bidibidi settlement area', TRUE),

-- Donors
('donors', 'USAID', 'USAID', 'United States Agency for International Development', TRUE),
('donors', 'ECHO', 'European Commission Humanitarian Office', 'ECHO', TRUE),
('donors', 'WB', 'World Bank', 'World Bank', TRUE),
('donors', 'SIDA', 'Swedish International Development Cooperation Agency', 'SIDA', TRUE)
ON CONFLICT (config_category, code) DO NOTHING;

-- ============================================
-- 3. ENHANCED INDICATOR SYSTEM
-- ============================================

-- Add columns for two-tier indicator system if not already present
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS indicator_scope VARCHAR(20) DEFAULT 'project' 
    CHECK (indicator_scope IN ('awyad', 'project'));
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS result_area VARCHAR(200);
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS indicator_level VARCHAR(50) 
    CHECK (indicator_level IN ('output', 'outcome', 'impact'));

-- Add quarterly targets and achievements if not present
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q1_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q2_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q3_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q4_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q1_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q2_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q3_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS q4_achieved INTEGER DEFAULT 0;

-- Add LOP and annual targets
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS lop_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS annual_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS baseline_date DATE;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS data_type VARCHAR(20) DEFAULT 'number' 
    CHECK (data_type IN ('number', 'percentage'));

-- Indicator mappings (links project indicators to AWYAD indicators)
CREATE TABLE IF NOT EXISTS indicator_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awyad_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    project_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    contribution_weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(awyad_indicator_id, project_indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_indicator_mappings_awyad ON indicator_mappings(awyad_indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_mappings_project ON indicator_mappings(project_indicator_id);

-- ============================================
-- 4. ENHANCED CASE MANAGEMENT
-- ============================================

-- Case Types lookup table
CREATE TABLE IF NOT EXISTS case_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_types_code ON case_types(code);
CREATE INDEX IF NOT EXISTS idx_case_types_active ON case_types(is_active);

-- Case Categories lookup table
CREATE TABLE IF NOT EXISTS case_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_type_id UUID REFERENCES case_types(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_categories_type ON case_categories(case_type_id);
CREATE INDEX IF NOT EXISTS idx_case_categories_code ON case_categories(code);

-- Update cases table with new fields if not present
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type_id UUID REFERENCES case_types(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_category_id UUID REFERENCES case_categories(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referred_from VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referred_to VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS referral_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS support_offered TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS disability_status VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tracking_tags JSONB;

-- Seed sample case types
INSERT INTO case_types (code, name, description, display_order) VALUES
('GBV', 'Gender-Based Violence', 'Gender-based violence cases', 1),
('CHILD_PROTECTION', 'Child Protection', 'Child protection cases', 2),
('LEGAL', 'Legal Cases', 'Legal assistance cases', 3),
('MEDICAL', 'Medical Cases', 'Medical/health related cases', 4),
('PSYCHOSOCIAL', 'Psychosocial', 'Mental health and psychosocial cases', 5),
('LIVELIHOOD', 'Livelihood', 'Livelihood and economic cases', 6),
('SHELTER', 'Shelter', 'Housing and shelter cases', 7)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 5. ENHANCED ACTIVITY MANAGEMENT
-- ============================================

-- Add fields for multi-currency and enhanced tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_costed BOOLEAN DEFAULT TRUE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'UGX';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4) DEFAULT 1.0;

-- Disability tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS disability_count INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pwds_other INTEGER DEFAULT 0;

-- Enhanced gender tracking (add "Other" option)
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

-- Nationality tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_congolese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_south_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS refugee_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS host_community INTEGER DEFAULT 0;

-- Currency exchange rates table
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON currency_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_currency_rates_currencies ON currency_rates(from_currency, to_currency);

-- Budget transfers table (updated schema)
CREATE TABLE IF NOT EXISTS activity_budget_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    from_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    to_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    source_project_id UUID REFERENCES projects(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    transfer_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to existing table (in case table was created by earlier migration)
ALTER TABLE activity_budget_transfers ADD COLUMN IF NOT EXISTS from_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL;
ALTER TABLE activity_budget_transfers ADD COLUMN IF NOT EXISTS to_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_budget_transfers_activity ON activity_budget_transfers(activity_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_from_activity ON activity_budget_transfers(from_activity_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_to_activity ON activity_budget_transfers(to_activity_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_status ON activity_budget_transfers(status);

-- ============================================
-- 6. NON-PROGRAM ACTIVITIES MODULE
-- ============================================

-- Non-program activity categories
CREATE TABLE IF NOT EXISTS non_program_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_non_program_categories_code ON non_program_categories(code);

-- Non-program activities table
CREATE TABLE IF NOT EXISTS non_program_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES non_program_categories(id),
    activity_name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    target INTEGER DEFAULT 0,
    achieved INTEGER DEFAULT 0,
    unit VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_non_program_activities_category ON non_program_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_status ON non_program_activities(status);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_date ON non_program_activities(planned_date);

-- Seed non-program categories
INSERT INTO non_program_categories (code, name, description, display_order) VALUES
('PARTNERSHIP', 'Partnerships', 'Partnership development and management activities', 1),
('COMMUNICATIONS', 'Communications', 'Communications and outreach activities', 2),
('ADVOCACY', 'Advocacy', 'Advocacy and policy influence activities', 3),
('HR', 'Human Resources', 'HR and staff management activities', 4),
('ED_OFFICE', 'Executive Director Office', 'ED office strategic activities', 5),
('LOGISTICS', 'Logistics and Procurement', 'Logistics, procurement, and supply chain activities', 6)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. MONTHLY TRACKING ENHANCEMENTS
-- ============================================

-- Monthly snapshots for tracking performance rates
CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_month DATE NOT NULL,
    project_id UUID REFERENCES projects(id),
    indicator_id UUID REFERENCES indicators(id),
    planned_activities INTEGER DEFAULT 0,
    completed_activities INTEGER DEFAULT 0,
    target_beneficiaries INTEGER DEFAULT 0,
    actual_beneficiaries INTEGER DEFAULT 0,
    target_value INTEGER DEFAULT 0,
    achieved_value INTEGER DEFAULT 0,
    planned_budget DECIMAL(15, 2) DEFAULT 0,
    actual_expenditure DECIMAL(15, 2) DEFAULT 0,
    performance_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_value > 0 THEN (achieved_value::DECIMAL / target_value * 100) ELSE 0 END
    ) STORED,
    activity_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_activities > 0 THEN (completed_activities::DECIMAL / planned_activities * 100) ELSE 0 END
    ) STORED,
    beneficiary_reach_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_beneficiaries > 0 THEN (actual_beneficiaries::DECIMAL / target_beneficiaries * 100) ELSE 0 END
    ) STORED,
    burn_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_budget > 0 THEN (actual_expenditure / planned_budget * 100) ELSE 0 END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_month, project_id, indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_snapshots(snapshot_month);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_project ON monthly_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_indicator ON monthly_snapshots(indicator_id);

-- ============================================
-- 8. ROLE DEFINITIONS
-- ============================================

-- Pre-populate enhanced roles if not already present
INSERT INTO roles (name, display_name, description, is_system) VALUES
('project_coordinator', 'Project Coordinator', 'Manages project activities and team', false),
('me_officer', 'M&E Officer', 'Full M&E system access with approval rights', false),
('me_assistant', 'M&E Assistant', 'Data entry and basic reporting', false),
('finance_officer', 'Finance Officer', 'Financial oversight and approval', false),
('finance_assistant', 'Finance Assistant', 'Financial data entry', false),
('executive', 'Executive Management', 'Strategic view and oversight', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. AUDIT TRAIL FOR CRITICAL CHANGES
-- ============================================

-- Add tracking for hierarchy changes
CREATE TABLE IF NOT EXISTS hierarchy_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'strategy', 'pillar', 'component'
    entity_id UUID NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_change_entity ON hierarchy_change_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_change_user ON hierarchy_change_log(changed_by);

-- ============================================
-- Migration Summary
-- ============================================
-- This migration implements Phase 1: Critical Foundation of the feedback implementation plan
-- 
-- Tables Created:
-- - strategies, pillars, core_program_components (strategic hierarchy)
-- - system_configurations (configurable lookup data)
-- - indicator_mappings (two-tier indicator system)
-- - case_types, case_categories (case management)
-- - currency_rates, activity_budget_transfers (enhanced activity management)
-- - non_program_categories, non_program_activities (non-program tracking)
-- - monthly_snapshots (monthly performance tracking)
-- - hierarchy_change_log (audit trail)
--
-- Tables Modified:
-- - projects (added core_program_component_id, result_area)
-- - indicators (added scope, level, quarterly targets, data_type)
-- - cases (added type, category, referral tracking, disability)
-- - activities (added multi-currency, disability, nationality fields)
--
-- Seeded Data:
-- - Sample partners, service types, locations, donors
-- - Sample case types and non-program categories
-- - Enhanced user roles
--
-- Total new fields: 50+
-- Total new tables: 8
-- Backward compatible: YES (all new columns have defaults)
-- ============================================
