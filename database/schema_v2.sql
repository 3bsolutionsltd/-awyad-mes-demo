-- ============================================
-- AWYAD MES - COMPREHENSIVE DATABASE SCHEMA
-- ============================================
-- Version: 2.0
-- Date: March 12, 2026 
-- Description: Complete schema including all Phase 1 feedback migrations (001-009)
-- 
-- This schema represents the state of the database after running all migrations.
-- For incremental updates, use the migration scripts in database/migrations/
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    require_password_change BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Role junction table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- Role-Permission junction table (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    replaced_by UUID
);

-- ============================================
-- STRATEGIC FRAMEWORK (From Migration 001)
-- ============================================

-- Strategies table (Top level)
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Pillars table (Second level)
CREATE TABLE IF NOT EXISTS pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Core Program Components table (Third level)
CREATE TABLE IF NOT EXISTS core_program_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    interventions JSONB DEFAULT '[]'::jsonb,
    implementation_approaches JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- CORE APPLICATION DATA
-- ============================================

-- Thematic Areas table
CREATE TABLE IF NOT EXISTS thematic_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Projects table (Enhanced in Migration 002)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    donor VARCHAR(100) NOT NULL,
    thematic_area_id UUID REFERENCES thematic_areas(id),
    core_program_component_id UUID REFERENCES core_program_components(id),
    result_area VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15, 2) DEFAULT 0,
    expenditure DECIMAL(15, 2) DEFAULT 0,
    burn_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN budget > 0 THEN (expenditure / budget * 100) ELSE 0 END
    ) STORED,
    locations TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Project team members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Indicators table (Enhanced in Migration 003)
CREATE TABLE IF NOT EXISTS indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    
    -- Two-tier indicator system
    indicator_scope VARCHAR(20) DEFAULT 'project' CHECK (indicator_scope IN ('awyad', 'project')),
    thematic_area_id UUID REFERENCES thematic_areas(id),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    result_area VARCHAR(200),
    indicator_level VARCHAR(50) CHECK (indicator_level IN ('output', 'outcome', 'impact')),
    data_type VARCHAR(20) DEFAULT 'number' CHECK (data_type IN ('number', 'percentage')),
    
    -- Targets and actuals
    target INTEGER DEFAULT 0,
    baseline INTEGER DEFAULT 0,
    baseline_date DATE,
    annual_target INTEGER DEFAULT 0,
    achieved INTEGER DEFAULT 0,
    lop_target INTEGER DEFAULT 0,
    
    -- Quarterly breakdown
    q1_target INTEGER DEFAULT 0,
    q2_target INTEGER DEFAULT 0,
    q3_target INTEGER DEFAULT 0,
    q4_target INTEGER DEFAULT 0,
    q1_achieved INTEGER DEFAULT 0,
    q2_achieved INTEGER DEFAULT 0,
    q3_achieved INTEGER DEFAULT 0,
    q4_achieved INTEGER DEFAULT 0,
    
    unit VARCHAR(50),
    reporting_frequency VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indicator Mappings table (From Migration 003)
CREATE TABLE IF NOT EXISTS indicator_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awyad_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    project_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    contribution_weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    UNIQUE(awyad_indicator_id, project_indicator_id),
    CHECK (awyad_indicator_id != project_indicator_id)
);

-- Activities table (Enhanced in Migration 004)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thematic_area_id UUID REFERENCES thematic_areas(id),
    indicator_id UUID REFERENCES indicators(id),
    project_id UUID REFERENCES projects(id),
    activity_name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    location VARCHAR(100) NOT NULL,
    
    -- Basic gender disaggregation (kept for backward compatibility)
    direct_male INTEGER DEFAULT 0,
    direct_female INTEGER DEFAULT 0,
    direct_other INTEGER DEFAULT 0,
    indirect_male INTEGER DEFAULT 0,
    indirect_female INTEGER DEFAULT 0,
    indirect_other INTEGER DEFAULT 0,
    
    -- PWD disaggregation
    pwds_male INTEGER DEFAULT 0,
    pwds_female INTEGER DEFAULT 0,
    pwds_other INTEGER DEFAULT 0,
    
    -- Enhanced age/gender disaggregation
    age_0_4_male INTEGER DEFAULT 0,
    age_0_4_female INTEGER DEFAULT 0,
    age_0_4_other INTEGER DEFAULT 0,
    age_5_17_male INTEGER DEFAULT 0,
    age_5_17_female INTEGER DEFAULT 0,
    age_5_17_other INTEGER DEFAULT 0,
    age_18_49_male INTEGER DEFAULT 0,
    age_18_49_female INTEGER DEFAULT 0,
    age_18_49_other INTEGER DEFAULT 0,
    age_50_plus_male INTEGER DEFAULT 0,
    age_50_plus_female INTEGER DEFAULT 0,
    age_50_plus_other INTEGER DEFAULT 0,
    
    -- Nationality tracking
    refugee_sudanese INTEGER DEFAULT 0,
    refugee_congolese INTEGER DEFAULT 0,
    refugee_south_sudanese INTEGER DEFAULT 0,
    refugee_other INTEGER DEFAULT 0,
    host_community INTEGER DEFAULT 0,
    
    -- Total beneficiaries (computed)
    total_beneficiaries INTEGER GENERATED ALWAYS AS (
        age_0_4_male + age_0_4_female + age_0_4_other +
        age_5_17_male + age_5_17_female + age_5_17_other +
        age_18_49_male + age_18_49_female + age_18_49_other +
        age_50_plus_male + age_50_plus_female + age_50_plus_other
    ) STORED,
    
    -- Financial fields
    is_costed BOOLEAN DEFAULT TRUE,
    currency VARCHAR(10) DEFAULT 'UGX',
    budget DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Activity Budget Transfers table (From Migration 004)
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

-- Currency Rates table (From Migration 004)
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
    UNIQUE(from_currency, to_currency, effective_date)
);

-- ============================================
-- CASE MANAGEMENT (From Migrations 005)
-- ============================================

-- Case Types table
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

-- Case Categories table
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

-- Cases table (Overhauled in Migration 005)
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    case_type_id UUID REFERENCES case_types(id),
    case_category_id UUID REFERENCES case_categories(id),
    
    date_reported DATE NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open',
    location VARCHAR(100) NOT NULL,
    
    -- Demographics (no name for privacy)
    age_group VARCHAR(50),
    gender VARCHAR(20),
    nationality VARCHAR(100),
    disability_status VARCHAR(50),
    has_disability BOOLEAN DEFAULT FALSE,
    
    -- Referral tracking
    referred_from VARCHAR(200),
    referred_to VARCHAR(200),
    referral_date DATE,
    
    -- Service information
    support_offered TEXT,
    follow_up_date DATE,
    closure_date DATE,
    
    -- Dynamic tracking
    tracking_tags JSONB DEFAULT '[]'::jsonb,
    case_worker VARCHAR(200),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- MONTHLY TRACKING (From Migration 006)
-- ============================================

-- Monthly Snapshots table
CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_month DATE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    
    planned_activities INTEGER DEFAULT 0,
    completed_activities INTEGER DEFAULT 0,
    target_beneficiaries INTEGER DEFAULT 0,
    actual_beneficiaries INTEGER DEFAULT 0,
    target_value INTEGER DEFAULT 0,
    achieved_value INTEGER DEFAULT 0,
    planned_budget DECIMAL(15, 2) DEFAULT 0,
    actual_expenditure DECIMAL(15, 2) DEFAULT 0,
    
    -- Computed performance rates
    performance_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_value > 0 
        THEN (achieved_value::DECIMAL / target_value * 100) 
        ELSE 0 END
    ) STORED,
    
    activity_completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_activities > 0 
        THEN (completed_activities::DECIMAL / planned_activities * 100) 
        ELSE 0 END
    ) STORED,
    
    beneficiary_reach_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN target_beneficiaries > 0 
        THEN (actual_beneficiaries::DECIMAL / target_beneficiaries * 100) 
        ELSE 0 END
    ) STORED,
    
    burn_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN planned_budget > 0 
        THEN (actual_expenditure / planned_budget * 100) 
        ELSE 0 END
    ) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    UNIQUE(snapshot_month, project_id, indicator_id)
);

-- ============================================
-- NON-PROGRAM ACTIVITIES (From Migration 007)
-- ============================================

-- Non-Program Categories table
CREATE TABLE IF NOT EXISTS non_program_categories (
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

-- Non-Program Activities table
CREATE TABLE IF NOT EXISTS non_program_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES non_program_categories(id) ON DELETE CASCADE,
    activity_name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Cancelled')),
    target INTEGER DEFAULT 0,
    achieved INTEGER DEFAULT 0,
    unit VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- SYSTEM CONFIGURATION (From Migration 008)
-- ============================================

-- System Configurations table
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(100) NOT NULL,
    config_code VARCHAR(100) NOT NULL,
    config_value VARCHAR(500) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES system_configurations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(config_type, config_code)
);

-- ============================================
-- AUDIT & LOGGING
-- ============================================

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Strategic framework indexes
CREATE INDEX IF NOT EXISTS idx_strategies_active_order ON strategies(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_strategies_code ON strategies(code);
CREATE INDEX IF NOT EXISTS idx_pillars_strategy_id ON pillars(strategy_id);
CREATE INDEX IF NOT EXISTS idx_pillars_active_order ON pillars(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_pillars_code ON pillars(code);
CREATE INDEX IF NOT EXISTS idx_components_pillar_id ON core_program_components(pillar_id);
CREATE INDEX IF NOT EXISTS idx_components_active_order ON core_program_components(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_components_code ON core_program_components(code);
CREATE INDEX IF NOT EXISTS idx_components_interventions ON core_program_components USING gin(interventions);
CREATE INDEX IF NOT EXISTS idx_components_approaches ON core_program_components USING gin(implementation_approaches);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_thematic_area_id ON projects(thematic_area_id);
CREATE INDEX IF NOT EXISTS idx_projects_component_id ON projects(core_program_component_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Indicators indexes
CREATE INDEX IF NOT EXISTS idx_indicators_scope ON indicators(indicator_scope);
CREATE INDEX IF NOT EXISTS idx_indicators_level ON indicators(indicator_level);
CREATE INDEX IF NOT EXISTS idx_indicators_data_type ON indicators(data_type);
CREATE INDEX IF NOT EXISTS idx_indicators_project_id ON indicators(project_id);
CREATE INDEX IF NOT EXISTS idx_indicators_result_area ON indicators(result_area);
CREATE INDEX IF NOT EXISTS idx_indicator_mappings_awyad ON indicator_mappings(awyad_indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_mappings_project ON indicator_mappings(project_indicator_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_indicator_id ON activities(indicator_id);
CREATE INDEX IF NOT EXISTS idx_activities_planned_date ON activities(planned_date);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_currency ON activities(currency);
CREATE INDEX IF NOT EXISTS idx_activities_is_costed ON activities(is_costed);

-- Budget transfers indexes
CREATE INDEX IF NOT EXISTS idx_budget_transfers_activity ON activity_budget_transfers(activity_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_source_project ON activity_budget_transfers(source_project_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_status ON activity_budget_transfers(status);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_date ON activity_budget_transfers(transfer_date);

-- Currency rates indexes
CREATE INDEX IF NOT EXISTS idx_currency_rates_from ON currency_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_to ON currency_rates(to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON currency_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_currency_rates_active ON currency_rates(is_active);

-- Cases indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_project_id ON cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
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
CREATE INDEX IF NOT EXISTS idx_cases_tracking_tags ON cases USING gin(tracking_tags);

-- Monthly snapshots indexes
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month ON monthly_snapshots(snapshot_month);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_project ON monthly_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_indicator ON monthly_snapshots(indicator_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_month_project ON monthly_snapshots(snapshot_month, project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_performance ON monthly_snapshots(performance_rate) WHERE performance_rate IS NOT NULL;

-- Non-program activities indexes
CREATE INDEX IF NOT EXISTS idx_non_program_categories_active ON non_program_categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_non_program_categories_code ON non_program_categories(code);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_category ON non_program_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_status ON non_program_activities(status);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_planned_date ON non_program_activities(planned_date);
CREATE INDEX IF NOT EXISTS idx_non_program_activities_completion_date ON non_program_activities(completion_date);

-- System configurations indexes
CREATE INDEX IF NOT EXISTS idx_system_configurations_type ON system_configurations(config_type);
CREATE INDEX IF NOT EXISTS idx_system_configurations_code ON system_configurations(config_code);
CREATE INDEX IF NOT EXISTS idx_system_configurations_type_code ON system_configurations(config_type, config_code);
CREATE INDEX IF NOT EXISTS idx_system_configurations_active ON system_configurations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_system_configurations_parent ON system_configurations(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_configurations_metadata ON system_configurations USING gin(metadata) WHERE metadata IS NOT NULL;

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- User with roles view
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
    u.id as user_id,
    u.email,
    u.username,
    u.first_name,
    u.last_name,
    array_agg(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.username, u.first_name, u.last_name;

-- Role with permissions view
CREATE OR REPLACE VIEW role_permissions_view AS
SELECT 
    r.id as role_id,
    r.name as role_name,
    array_agg(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name;

-- Activity summary view (updated)
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
    CASE 
        WHEN p.budget > 0 THEN (p.expenditure / p.budget * 100)::NUMERIC(12,2)
        ELSE 0 
    END as project_burn_rate_percentage
FROM activities a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN indicators i ON a.indicator_id = i.id;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Users and authentication
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Strategic framework
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pillars_updated_at BEFORE UPDATE ON pillars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON core_program_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Core application data
CREATE TRIGGER update_thematic_areas_updated_at BEFORE UPDATE ON thematic_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicators_updated_at BEFORE UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_transfers_updated_at BEFORE UPDATE ON activity_budget_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currency_rates_updated_at BEFORE UPDATE ON currency_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Case management
CREATE TRIGGER update_case_types_updated_at BEFORE UPDATE ON case_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_categories_updated_at BEFORE UPDATE ON case_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Monthly tracking
CREATE TRIGGER update_monthly_snapshots_updated_at BEFORE UPDATE ON monthly_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Non-program activities
CREATE TRIGGER update_non_program_categories_updated_at BEFORE UPDATE ON non_program_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_program_activities_updated_at BEFORE UPDATE ON non_program_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- System configurations
CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VALIDATION FUNCTIONS
-- ============================================

-- Validate indicator scope requirements
CREATE OR REPLACE FUNCTION validate_indicator_scope()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.indicator_scope = 'awyad' AND NEW.thematic_area_id IS NULL THEN
        RAISE EXCEPTION 'AWYAD indicators must have a thematic_area_id';
    END IF;
    
    IF NEW.indicator_scope = 'project' AND NEW.project_id IS NULL THEN
        RAISE EXCEPTION 'Project indicators must have a project_id';
    END IF;
    
    IF NEW.indicator_scope = 'project' AND (NEW.result_area IS NULL OR NEW.result_area = '') THEN
        RAISE EXCEPTION 'Project indicators must have a result_area';
    END IF;
    
    IF NEW.data_type = 'percentage' AND NEW.achieved > 100 THEN
        RAISE WARNING 'Percentage value exceeds 100 percent: %', NEW.achieved;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_indicator_scope_trigger 
    BEFORE INSERT OR UPDATE ON indicators
    FOR EACH ROW EXECUTE FUNCTION validate_indicator_scope();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

-- Strategic Framework
COMMENT ON TABLE strategies IS 'Top-level strategic framework for AWYAD';
COMMENT ON TABLE pillars IS 'Strategic pillars linked to strategies';
COMMENT ON TABLE core_program_components IS 'Core program components with interventions and approaches stored as JSONB';

-- Indicators
COMMENT ON COLUMN indicators.indicator_scope IS 'Type of indicator: awyad (strategic/overall) or project (project-specific)';
COMMENT ON COLUMN indicators.result_area IS 'Result area for project indicators';
COMMENT ON COLUMN indicators.indicator_level IS 'Level of indicator: output, outcome, or impact';
COMMENT ON COLUMN indicators.data_type IS 'How to display the indicator: number or percentage';
COMMENT ON COLUMN indicators.lop_target IS 'Life of Project target value';

-- Activities
COMMENT ON COLUMN activities.is_costed IS 'Whether this activity has a budget/cost associated with it';
COMMENT ON COLUMN activities.currency IS 'Currency used for this activity (UGX, USD, EUR, GBP)';
COMMENT ON COLUMN activities.pwds_male IS 'Number of male persons with disabilities';
COMMENT ON COLUMN activities.pwds_female IS 'Number of female persons with disabilities';
COMMENT ON COLUMN activities.pwds_other IS 'Number of other gender persons with disabilities';

-- Cases
COMMENT ON TABLE case_types IS 'Configurable case types (GBV, Child Protection, etc.)';
COMMENT ON TABLE case_categories IS 'Categories within each case type';
COMMENT ON COLUMN cases.support_offered IS 'Confidential notes on support/services offered';
COMMENT ON COLUMN cases.tracking_tags IS 'Dynamic tags for flexible case tracking (JSONB array)';

-- Monthly Snapshots
COMMENT ON TABLE monthly_snapshots IS 'Monthly performance snapshots for tracking trends and rates';
COMMENT ON COLUMN monthly_snapshots.performance_rate IS 'Programmatic performance: (achieved/target) * 100';

-- System Configurations
COMMENT ON TABLE system_configurations IS 'Generic configuration table for all lookup data';

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Schema version: 2.0
-- Last updated: March 12, 2026
-- For incremental changes, use migration scripts in database/migrations/
