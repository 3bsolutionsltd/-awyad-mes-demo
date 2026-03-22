# AWYAD Presentation Feedback - Comprehensive Implementation Plan
**Date:** January 22, 2026
**Version:** 1.0

---

## Executive Summary

This document provides a comprehensive implementation plan to address all feedback received from the AWYAD presentation. The plan is structured into 9 major categories with phased implementation approach to ensure robust, scalable solutions that meet AWYAD's evolving needs.

---

## Table of Contents

1. [Dashboard Restructuring](#1-dashboard-restructuring)
2. [Indicator System Enhancement](#2-indicator-system-enhancement)
3. [Activity Management Improvements](#3-activity-management-improvements)
4. [Case Management Overhaul](#4-case-management-overhaul)
5. [Monthly Tracking Enhancements](#5-monthly-tracking-enhancements)
6. [User Management & Roles](#6-user-management--roles)
7. [Non-Program Activities Module](#7-non-program-activities-module)
8. [Configurable Data Support](#8-configurable-data-support)
9. [Cross-Cutting Features](#9-cross-cutting-features)

---

## Implementation Phases

### Phase 1: Critical Foundation (Week 1-2)
- Database schema updates
- Configurable data support infrastructure
- User roles and permissions framework

### Phase 2: Core Features (Week 3-4)
- Dashboard restructuring
- Indicator system enhancements
- Case management overhaul

### Phase 3: Advanced Features (Week 5-6)
- Activity improvements
- Monthly tracking enhancements
- Non-program activities module

### Phase 4: Testing & Deployment (Week 7-8)
- Integration testing
- User acceptance testing
- Deployment and training

---

## 1. Dashboard Restructuring

### Current Issues
- Dashboard provides only broad overall perspective
- No project-specific dashboards
- Current hierarchy doesn't match organizational structure (Strategies → Pillars → Core Program Components)
- No distinction between AWYAD indicators and Project indicators

### Proposed Solution

#### 1.1 New Dashboard Hierarchy

**AWYAD Strategic Dashboard (Overall)**
```
Strategies
  ├── Pillars
  │    ├── Core Program Components
  │    │    ├── Core Program Interventions (Details)
  │    │    └── Implementation Approaches (Details)
  │    └── AWYAD Indicators (Overall/Strategic)
  └── Projects (Linked to Core Program Areas)
       └── Project Indicators (Project-Specific)
```

#### 1.2 Project-Specific Dashboards

Each project will have its own dedicated dashboard showing:
- Project metadata (name, donor, budget, timeline, locations)
- Project-specific indicators only
- Activities linked to the project
- Financial performance (budget, expenditure, burn rate)
- Project team members
- Cases related to the project
- Monthly progress tracking

#### 1.3 Database Schema Changes

**New Tables:**

```sql
-- Strategies table (Top level)
CREATE TABLE strategies (
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

-- Pillars table
CREATE TABLE pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
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

-- Core Program Components table
CREATE TABLE core_program_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID REFERENCES pillars(id) ON DELETE CASCADE,
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

-- Update core_program_components to include interventions and approaches as JSONB fields
-- This simplifies the structure and makes it easier to manage
-- Each component can have multiple interventions and approaches stored as arrays
ALTER TABLE core_program_components ADD COLUMN interventions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE core_program_components ADD COLUMN implementation_approaches JSONB DEFAULT '[]'::jsonb;

-- Example of interventions and approaches data structure:
-- interventions: [
--   {"name": "Intervention 1", "description": "Description...", "order": 1},
--   {"name": "Intervention 2", "description": "Description...", "order": 2}
-- ]
-- implementation_approaches: [
--   {"name": "Approach 1", "description": "Description...", "order": 1},
--   {"name": "Approach 2", "description": "Description...", "order": 2}
-- ]

-- Update projects table to link to core program components
ALTER TABLE projects ADD COLUMN core_program_component_id UUID REFERENCES core_program_components(id);
ALTER TABLE projects ADD COLUMN result_area VARCHAR(200); -- For project-specific result areas

-- Comment: Core Program Interventions and Implementation Approaches are now stored as 
-- flexible JSON arrays within the core_program_components table, making it easier to:
-- 1. Add/edit/remove them without additional table joins
-- 2. Maintain the hierarchical relationship
-- 3. Display them as details sections in the dashboard
```

#### 1.4 Implementation Tasks

**Backend:**
- [ ] Create migration script for new hierarchy tables
- [ ] Update projects API to include new relationships
- [ ] Create new dashboard API endpoints:
  - `/api/v1/dashboard/strategic` - AWYAD strategic dashboard
  - `/api/v1/dashboard/project/:projectId` - Project-specific dashboard
  - `/api/v1/strategies` - CRUD for strategies
  - `/api/v1/pillars` - CRUD for pillars
  - `/api/v1/core-program-components` - CRUD for components
- [ ] Update data service to fetch hierarchical data

**Frontend:**
- [ ] Create new `renderStrategicDashboard.js` for AWYAD overall view
- [ ] Create new `renderProjectDashboard.js` for project-specific view
- [ ] Add navigation for switching between dashboards
- [ ] Update `app.js` to support multiple dashboard views
- [ ] Create dashboard selector/switcher UI component

---

## 2. Indicator System Enhancement

### Current Issues
- Only project indicators exist; no AWYAD (overall) indicators
- Thematic Areas used for overall, but Result Areas needed for projects
- Missing indicator levels (output, outcome)
- No Q4 in quarterly breakdown
- LOP (Life of Project) terminology unclear
- Percentage vs Number representation issue

### Proposed Solution

#### 2.1 Two-Tier Indicator System

**AWYAD Indicators (Strategic/Overall)**
- Not specific to one project
- Linked to Thematic Areas
- Aggregate from multiple project indicators

**Project Indicators**
- Linked to specific projects
- Linked to Result Areas
- Can contribute to AWYAD indicators through mapping

#### 2.2 Database Schema Changes

```sql
-- Add indicator_scope to differentiate AWYAD vs Project indicators
ALTER TABLE indicators ADD COLUMN indicator_scope VARCHAR(20) DEFAULT 'project' 
    CHECK (indicator_scope IN ('awyad', 'project'));
ALTER TABLE indicators ADD COLUMN result_area VARCHAR(200); -- For projects
ALTER TABLE indicators ADD COLUMN indicator_level VARCHAR(50) 
    CHECK (indicator_level IN ('output', 'outcome', 'impact'));

-- Rename thematic_area_id to make it optional for project indicators
ALTER TABLE indicators ALTER COLUMN thematic_area_id DROP NOT NULL;

-- Update existing columns
ALTER TABLE indicators ADD COLUMN q1_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q2_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q3_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q4_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q1_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q2_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q3_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN q4_achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN lop_target INTEGER DEFAULT 0; -- Life of Project target
ALTER TABLE indicators ADD COLUMN annual_target INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN achieved INTEGER DEFAULT 0;
ALTER TABLE indicators ADD COLUMN baseline_date DATE;
ALTER TABLE indicators ADD COLUMN data_type VARCHAR(20) DEFAULT 'number' 
    CHECK (data_type IN ('number', 'percentage'));

-- Indicator mapping table (links project indicators to AWYAD indicators)
CREATE TABLE indicator_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    awyad_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    project_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    contribution_weight DECIMAL(5,2) DEFAULT 1.0, -- How much this project indicator contributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(awyad_indicator_id, project_indicator_id)
);
```

#### 2.3 Indicator Form Enhancement

**Unified Form Approach:**
We'll use **ONE form** that dynamically adjusts based on the Indicator Scope selection. This provides:
- Consistent user experience
- Easier to maintain
- Conditional field display based on scope

**Form Layout:**

**Step 1: Select Indicator Scope** (Always visible)
```
○ AWYAD Indicator (Overall/Strategic)
○ Project Indicator (Project-Specific)
```

**Step 2: Conditional Fields Based on Selection**

**If AWYAD Indicator selected:**
- Thematic Area (Dropdown) - Required
- Indicator Level (Output/Outcome/Impact) - Required
- Indicator Code - Required
- Indicator Name - Required
- Description - Optional
- Data Type (Number/Percentage) - Required
- Unit of Measurement - Required
- Baseline Value - Required
- Baseline Date - Required
- LOP Target (with tooltip: "Life of Project Target") - Required
- Annual Target - Required
- Q1, Q2, Q3, Q4 Targets - Required

**If Project Indicator selected:**
- Project (Dropdown) - Required
- Result Area (Dropdown) - Required
- Indicator Level (Output/Outcome/Impact) - Required
- Indicator Code - Required
- Indicator Name - Required
- Description - Optional
- Data Type (Number/Percentage) - Required
- Unit of Measurement - Required
- Baseline Value - Required
- Baseline Date - Required
- LOP Target (with tooltip: "Life of Project Target") - Required
- Annual Target - Required
- Q1, Q2, Q3, Q4 Targets - Required
- [Optional] Link to AWYAD Indicator (if this project indicator contributes to an AWYAD indicator)

**Key Differences:**
- AWYAD Indicators: Link to **Thematic Area**, no project selection
- Project Indicators: Link to **Result Area** and **Project**, can optionally map to AWYAD indicators

#### 2.4 Smart Percentage/Number Handling

```javascript
// In indicator display logic
function formatIndicatorValue(value, dataType, unit) {
    if (dataType === 'percentage') {
        return `${value}%`;
    } else {
        return `${value.toLocaleString()} ${unit}`;
    }
}

// Validation on data entry
function validateIndicatorEntry(indicator, value) {
    if (indicator.dataType === 'percentage' && value > 100) {
        return { valid: false, message: 'Percentage cannot exceed 100%' };
    }
    if (indicator.dataType === 'number' && value < 0) {
        return { valid: false, message: 'Number cannot be negative' };
    }
    return { valid: true };
}
```

#### 2.5 Implementation Tasks

**Backend:**
- [ ] Create migration for indicator schema updates
- [ ] Update indicators API with new fields
- [ ] Create indicator mappings API
- [ ] Add validation for data types
- [ ] Update calculation logic to handle percentages properly
- [ ] Add Q4 to all quarterly calculations

**Frontend:**
- [ ] Update indicator form with new fields
- [ ] Add Result Area vs Thematic Area conditional display
- [ ] Implement indicator level dropdown
- [ ] Add LOP tooltip/help text
- [ ] Update indicator tracking table to show Q4
- [ ] Implement smart value formatting (% vs numbers)
- [ ] Create indicator mapping interface

---

## 3. Activity Management Improvements

### Current Issues
- No support for activities done but not costed
- Currency fixed to USD only (need UGX as default + multiple currency support)
- No way to track when extra budget is transferred from one project to another project
- Gender limited to Male/Female (need "Other" option)
- No disability tracking

**Clarification on Budget Transfers:**
Sometimes an activity in Project A runs out of budget, but you need to complete it. So you take money from Project B to finish the activity in Project A. We need to:
1. Record this transfer (amount, source project, destination project/activity)
2. Show it in both projects' financial reports
3. Track total budget = Original Budget + Transfers In - Transfers Out
4. Maintain audit trail of all transfers

### Proposed Solution

#### 3.1 Database Schema Changes

```sql
-- Update activities table
ALTER TABLE activities ADD COLUMN is_costed BOOLEAN DEFAULT TRUE;
ALTER TABLE activities ADD COLUMN currency VARCHAR(10) DEFAULT 'UGX';
ALTER TABLE activities ADD COLUMN disability_count INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN pwds_male INTEGER DEFAULT 0; -- People with Disabilities
ALTER TABLE activities ADD COLUMN pwds_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN pwds_other INTEGER DEFAULT 0;

-- Create extra budget tracking table
CREATE TABLE activity_budget_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    source_project_id UUID NOT NULL REFERENCES projects(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UGX',
    transfer_date DATE NOT NULL,
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Currency exchange rates table (for multi-currency support)
CREATE TABLE currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, effective_date)
);

-- Add computed column for total budget including transfers
ALTER TABLE activities ADD COLUMN total_budget DECIMAL(15, 2) GENERATED ALWAYS AS (
    budget + COALESCE((SELECT SUM(amount) FROM activity_budget_transfers WHERE activity_id = activities.id), 0)
) STORED;
```

#### 3.2 Multi-Currency Support

**Current Situation:**
- System currently only supports USD
- Need to add support for multiple currencies with UGX as the default

**Supported Currencies:**
- **UGX (Ugandan Shilling)** - **Default** (This will be the new default)
- USD (US Dollar) - Currently the only option
- EUR (Euro) - New
- GBP (British Pound) - New
- Other currencies can be added as needed

**Currency Conversion:**
- Exchange rates updated weekly (or as configured)
- All reports can show values in user-selected currency
- Budget tracking shows both original currency and converted to base currency (UGX)
- Activities can be recorded in any supported currency
- System automatically converts to UGX for consolidated reporting

#### 3.3 Enhanced Gender and Disability Tracking

**Gender Options:**
- Male
- Female
- Other
- Prefer not to say

**Disability Tracking:**
- Separate count for People with Disabilities (PWDs)
- Disaggregated by gender: PWDs Male, PWDs Female, PWDs Other
- Included in total beneficiary count
- Separate reporting section for disability-specific metrics

#### 3.4 Implementation Tasks

**Backend:**
- [ ] Create migrations for activity schema updates
- [ ] Create budget transfer API endpoints
- [ ] Create currency rates API
- [ ] Update activity API to include disability fields
- [ ] Add validation for currency codes
- [ ] Implement currency conversion service
- [ ] Update total beneficiary calculation to include disability data

**Frontend:**
- [ ] Add "Is Costed" checkbox to activity form
- [ ] Add currency dropdown to activity form
- [ ] Create budget transfer interface
- [ ] Add "Other" option to gender selection
- [ ] Add disability tracking section to activity form
- [ ] Create PWD disaggregation display
- [ ] Update reports to show multi-currency data

---

## 4. Case Management Overhaul

### Current Issues
- Case name field should be removed (confidentiality)
- Need Case Type and Case Categories
- Missing case referral tracking (from and to)
- "Case Description" should be "Support Offered"
- Cases should be trackable by project/location dynamically

### Proposed Solution

#### 4.1 Database Schema Changes

```sql
-- Drop name-related columns and add new fields
ALTER TABLE cases DROP COLUMN IF EXISTS beneficiary_name;
ALTER TABLE cases ADD COLUMN case_category VARCHAR(100);
ALTER TABLE cases ADD COLUMN referred_from VARCHAR(200); -- Organization/Partner that referred the case
ALTER TABLE cases ADD COLUMN referred_to VARCHAR(200); -- Partner we referred the case to
ALTER TABLE cases ADD COLUMN referral_date DATE;
ALTER TABLE cases ADD COLUMN support_offered TEXT; -- Replace case_description
ALTER TABLE cases DROP COLUMN IF EXISTS case_description;
ALTER TABLE cases ADD COLUMN nationality VARCHAR(100);
ALTER TABLE cases ADD COLUMN disability_status VARCHAR(50);
ALTER TABLE cases ADD COLUMN has_disability BOOLEAN DEFAULT FALSE;

-- Case types lookup table (configurable)
CREATE TABLE case_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case categories lookup table (configurable)
CREATE TABLE case_categories (
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

-- Update cases to use foreign keys
ALTER TABLE cases ADD COLUMN case_type_id UUID REFERENCES case_types(id);
ALTER TABLE cases ADD COLUMN case_category_id UUID REFERENCES case_categories(id);

-- Case tracking metadata
ALTER TABLE cases ADD COLUMN tracking_tags JSONB; -- Dynamic tags for flexible tracking
```

#### 4.2 Detailed Case Form

**Required Fields:**
- Case Number (auto-generated)
- Case Type (dropdown from case_types)
- Case Category (dropdown based on selected type)
- Date Reported
- Project (dropdown)
- Location
- Age Group
- Gender
- Nationality
- Disability Status (Yes/No)
- Status (Open/In Progress/Closed)

**Referral Information:**
- Referred From (partner/organization)
- Referred To (partner/organization)
- Referral Date

**Service Information:**
- Support Offered (multi-line text)
- Services Provided (checkboxes)
- Follow-up Date
- Case Worker

**Tracking:**
- Tags (dynamic, user-configurable)
- Project-based tracking
- Location-based tracking

#### 4.3 Dynamic Case Tracking

```javascript
// Case filtering by multiple dimensions
const caseFilters = {
    project: [],      // Multiple projects
    location: [],     // Multiple locations
    caseType: [],     // Multiple types
    status: [],       // Open, In Progress, Closed
    dateRange: {      // Date range
        start: null,
        end: null
    },
    tags: []          // Custom tags
};

// Example queries:
// - All cases for Project A in Location X
// - All GBV cases across all projects
// - All cases referred to Partner Y
// - All cases with disability status
```

#### 4.4 Implementation Tasks

**Backend:**
- [ ] Create migration for case schema updates
- [ ] Create case_types and case_categories tables
- [ ] Create CRUD APIs for case types and categories
- [ ] Update cases API with new fields
- [ ] Remove name-related fields from API responses
- [ ] Add dynamic filtering to cases endpoint
- [ ] Create case statistics endpoints

**Frontend:**
- [ ] Remove name field from case form
- [ ] Add Case Type and Case Category dropdowns (cascading)
- [ ] Add referral information section
- [ ] Rename "Case Description" to "Support Offered"
- [ ] Implement dynamic tagging system
- [ ] Create advanced case filtering interface
- [ ] Add project/location tracking dashboard
- [ ] Update case list view with new fields

---

## 5. Monthly Tracking Enhancements

### Current Issues
- Cannot track by specific projects
- Cannot drill down into specific activities
- No Reach vs Target comparison
- Missing Performance Rates (only have financial burn rates)

### Proposed Solution

#### 5.1 Enhanced Monthly Tracking Features

**Project-Based Tracking:**
- Filter by single or multiple projects
- Compare performance across projects
- Project-specific monthly trends

**Activity-Level Tracking:**
- Drill down from project to activity level
- Activity completion timeline
- Activity-specific reach vs target

**Reach vs Target:**
- Visual comparison for each indicator
- Show gap analysis
- Trend lines for reaching targets

**Performance Rates:**
- **Programmatic Performance Rate:** (Achieved / Target) × 100
- **Activity Completion Rate:** (Completed Activities / Planned Activities) × 100
- **Beneficiary Reach Rate:** (Actual Beneficiaries / Target Beneficiaries) × 100
- **Financial Burn Rate:** (Expenditure / Budget) × 100 (existing)

#### 5.2 Database Schema Changes

```sql
-- Monthly snapshots table for tracking
CREATE TABLE monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_month DATE NOT NULL, -- First day of month
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

-- Indexes for performance
CREATE INDEX idx_monthly_snapshots_month ON monthly_snapshots(snapshot_month);
CREATE INDEX idx_monthly_snapshots_project ON monthly_snapshots(project_id);
CREATE INDEX idx_monthly_snapshots_indicator ON monthly_snapshots(indicator_id);
```

#### 5.3 New Visualizations

**Reach vs Target Chart:**
```
Indicator: Number of GBV Survivors Supported
┌────────────────────────────────────────┐
│ Target:  550                           │
│ Reached: 467                           │
│ Gap:     83 (15%)                      │
│                                        │
│ ████████████████████░░░░ 85%          │
└────────────────────────────────────────┘
```

**Performance Rates Dashboard:**
```
┌─────────────────────┬──────────┬──────────┐
│ Metric              │ Rate     │ Status   │
├─────────────────────┼──────────┼──────────┤
│ Programmatic        │ 85%      │ ✓ Good   │
│ Activity Completion │ 78%      │ ⚠ Fair   │
│ Beneficiary Reach   │ 92%      │ ✓ Good   │
│ Financial Burn      │ 62%      │ ✓ Good   │
└─────────────────────┴──────────┴──────────┘
```

#### 5.4 Implementation Tasks

**Backend:**
- [ ] Create monthly_snapshots table
- [ ] Create snapshot generation service (runs monthly)
- [ ] Create API endpoints for monthly tracking:
  - `/api/v1/monthly-tracking/projects/:projectId`
  - `/api/v1/monthly-tracking/activities/:activityId`
  - `/api/v1/monthly-tracking/reach-vs-target`
  - `/api/v1/monthly-tracking/performance-rates`
- [ ] Implement performance rate calculations
- [ ] Add project filtering to existing endpoints

**Frontend:**
- [ ] Add project filter dropdown to monthly tracking
- [ ] Create activity drill-down interface
- [ ] Create Reach vs Target visualization
- [ ] Create Performance Rates dashboard
- [ ] Add comparison charts (planned vs actual)
- [ ] Update `renderMonthlyTracking.js` with new features

---

## 6. User Management & Roles

### Current Issues
- Need specific role definitions for AWYAD team structure

### Proposed Solution

#### 6.1 User Roles Definition

**Programs Department:**
- **Project Coordinator**
  - Permissions: Create/edit activities, view reports, manage project team
  - Scope: Assigned projects only

**M&E Department:**
- **M&E Officer**
  - Permissions: Create/edit indicators, approve data, generate reports, view all data
  - Scope: All projects
- **M&E Assistant**
  - Permissions: Enter data, view reports, basic data analysis
  - Scope: All projects

**Finance Department:**
- **Finance Officer**
  - Permissions: Approve budgets, track expenditure, financial reports
  - Scope: All projects
- **Finance Assistant**
  - Permissions: Enter expenditure data, view financial reports
  - Scope: Assigned projects

**Cross-Functional:**
- **System Administrator**
  - Permissions: All system access, user management, system configuration
  - Scope: Entire system
- **Executive Management**
  - Permissions: View all reports, dashboards, approve major decisions
  - Scope: Strategic view only (no data entry)

#### 6.2 Database Updates

```sql
-- Pre-populate roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('project_coordinator', 'Project Coordinator', 'Manages project activities and team', false),
('me_officer', 'M&E Officer', 'Full M&E system access with approval rights', false),
('me_assistant', 'M&E Assistant', 'Data entry and basic reporting', false),
('finance_officer', 'Finance Officer', 'Financial oversight and approval', false),
('finance_assistant', 'Finance Assistant', 'Financial data entry', false),
('executive', 'Executive Management', 'Strategic view and oversight', false);

-- Permission sets for each role
-- (Detailed permissions mapping will be in separate migration)
```

#### 6.3 Implementation Tasks

**Backend:**
- [ ] Create role seeding script
- [ ] Create permission mappings
- [ ] Update authorization middleware
- [ ] Add role-based data scoping
- [ ] Create user management API endpoints

**Frontend:**
- [ ] Create user management interface
- [ ] Add role assignment UI
- [ ] Implement role-based UI element visibility
- [ ] Add permission-based feature access

---

## 7. Non-Program Activities Module

### Current Issues
- No way to track activities not tied to specific projects
- Need to support: Partnerships, Communications, Advocacy, HR, ED Office, Logistics & Procurement

### Proposed Solution

#### 7.1 Database Schema

```sql
-- Non-program activity categories
CREATE TABLE non_program_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed categories
INSERT INTO non_program_categories (code, name, description) VALUES
('PARTNERSHIP', 'Partnerships', 'Partnership development and management activities'),
('COMMUNICATIONS', 'Communications', 'Communications and outreach activities'),
('ADVOCACY', 'Advocacy', 'Advocacy and policy influence activities'),
('HR', 'Human Resources', 'HR and staff management activities'),
('ED_OFFICE', 'Executive Director Office', 'ED office strategic activities'),
('LOGISTICS', 'Logistics and Procurement', 'Logistics, procurement, and supply chain activities');

-- Non-program activities table
CREATE TABLE non_program_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES non_program_categories(id),
    activity_name VARCHAR(500) NOT NULL,
    description TEXT,
    planned_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    target INTEGER DEFAULT 0, -- What was planned to be achieved
    achieved INTEGER DEFAULT 0, -- What was actually achieved
    unit VARCHAR(100), -- Unit of measurement (e.g., "partnerships", "events", "staff trained")
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_non_program_activities_category ON non_program_activities(category_id);
CREATE INDEX idx_non_program_activities_status ON non_program_activities(status);
CREATE INDEX idx_non_program_activities_planned_date ON non_program_activities(planned_date);
```

#### 7.2 Key Features

**No Indicators Required:**
- Activities tracked independently
- Focus on targets and achieved results
- No linkage to programmatic indicators

**Simplified Tracking:**
- Activity name and description
- Target (what was planned)
- Achieved (what was accomplished)
- Status (Planned/In Progress/Completed)
- Dates (planned and completion)

**Reporting:**
- Category-wise summary reports
- Monthly activity completion tracking
- Achievement vs target analysis

#### 7.3 Implementation Tasks

**Backend:**
- [ ] Create non_program tables
- [ ] Create CRUD APIs for categories
- [ ] Create CRUD APIs for non-program activities
- [ ] Create reporting endpoints
- [ ] Add to dashboard statistics

**Frontend:**
- [ ] Create non-program activities interface
- [ ] Add to main navigation
- [ ] Create category filter/tabs
- [ ] Create simple entry form (no indicator linkage)
- [ ] Create summary reports view

---

## 8. Configurable Data Support

### Current Issues
- Partners, case types, and other lookup data are hardcoded
- Need user-configurable system reference data

### Proposed Solution

#### 8.1 Configurable Data Types

**System Configuration Categories:**
1. **Partners/Organizations** (for case referrals)
2. **Case Types** (already planned in Case Management)
3. **Case Categories** (already planned in Case Management)
4. **Service Types** (for cases and activities)
5. **Locations** (project locations)
6. **Donor Organizations**
7. **Beneficiary Categories**
8. **Activity Types**

#### 8.2 Database Schema

```sql
-- Generic configuration table for system reference data
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_category VARCHAR(100) NOT NULL, -- 'partners', 'locations', etc.
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

-- Index for fast lookups
CREATE INDEX idx_system_config_category ON system_configurations(config_category);
CREATE INDEX idx_system_config_code ON system_configurations(code);
CREATE INDEX idx_system_config_active ON system_configurations(is_active);

-- Seed initial data
INSERT INTO system_configurations (config_category, code, name) VALUES
-- Partners
('partners', 'UNHCR', 'United Nations High Commissioner for Refugees'),
('partners', 'IRC', 'International Rescue Committee'),
('partners', 'UNICEF', 'United Nations Children''s Fund'),
('partners', 'WFP', 'World Food Programme'),
-- Service Types
('service_types', 'PSYCHOSOCIAL', 'Psychosocial Support'),
('service_types', 'LEGAL', 'Legal Assistance'),
('service_types', 'MEDICAL', 'Medical Services'),
('service_types', 'SHELTER', 'Shelter Assistance'),
-- Locations
('locations', 'NAKIVALE', 'Nakivale Refugee Settlement'),
('locations', 'KAMPALA', 'Kampala'),
('locations', 'NYAKABANDE', 'Nyakabande Transit Center');
```

#### 8.3 Configuration Management Interface

**Admin Panel Features:**
- List all configuration categories
- Add/Edit/Delete/Deactivate entries
- Reorder display sequence
- Search and filter
- Bulk import from CSV
- Export current configuration

#### 8.4 Implementation Tasks

**Backend:**
- [ ] Create system_configurations table
- [ ] Create configuration API endpoints:
  - `/api/v1/config/:category` - Get all configs for category
  - `/api/v1/config/:category/:code` - Get specific config
  - POST/PUT/DELETE for CRUD operations
- [ ] Seed initial data
- [ ] Add validation to prevent deletion of in-use configs

**Frontend:**
- [ ] Create configuration management interface
- [ ] Add to admin navigation
- [ ] Create category tabs
- [ ] Implement CRUD forms
- [ ] Add import/export functionality
- [ ] Update all forms to use configurable dropdowns

---

## 9. Cross-Cutting Features

### Additional Requirements Across Multiple Modules

#### 9.1 Enhanced Data Disaggregation

**Expand Activity Tracking:**
```sql
-- Add more disaggregation fields to activities
ALTER TABLE activities ADD COLUMN age_0_4_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_0_4_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_0_4_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_5_17_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_5_17_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_5_17_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_18_49_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_18_49_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_18_49_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_50_plus_male INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_50_plus_female INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN age_50_plus_other INTEGER DEFAULT 0;

-- Nationality tracking
ALTER TABLE activities ADD COLUMN refugee_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN refugee_congolese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN refugee_south_sudanese INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN refugee_other INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN host_community INTEGER DEFAULT 0;
```

#### 9.2 Reporting Enhancements

**New Report Types:**
1. Donor-specific reports
2. Cross-project indicator rollup
3. Disability-focused reports
4. Multi-currency financial reports
5. Performance rate trending
6. Non-program activity summaries

#### 9.3 Data Import/Export

**Enhanced Import:**
- Bulk activity import with validation
- Case import from external systems
- Budget transfer import

**Enhanced Export:**
- Multi-sheet Excel export
- PDF report generation
- Formatted donor reports
- Custom export templates

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
**Week 1:**
- [ ] Create all new database tables
- [ ] Run migrations
- [ ] Set up configurable data system
- [ ] Define all user roles and permissions

**Week 2:**
- [ ] Implement configuration management APIs
- [ ] Create role seeding scripts
- [ ] Build configuration UI
- [ ] Test database changes

### Phase 2: Core Features (Weeks 3-4)
**Week 3:**
- [ ] Implement strategic dashboard hierarchy
- [ ] Build project-specific dashboards
- [ ] Create two-tier indicator system
- [ ] Add Q4 to all tracking

**Week 4:**
- [ ] Overhaul case management
- [ ] Implement case types and categories
- [ ] Add referral tracking
- [ ] Remove name fields (confidentiality)

### Phase 3: Advanced Features (Weeks 5-6)
**Week 5:**
- [ ] Multi-currency support
- [ ] Budget transfer tracking
- [ ] Disability tracking enhancements
- [ ] Gender "Other" option

**Week 6:**
- [ ] Monthly tracking enhancements
- [ ] Performance rates dashboard
- [ ] Reach vs Target visualizations
- [ ] Non-program activities module

### Phase 4: Testing & Deployment (Weeks 7-8)
**Week 7:**
- [ ] Integration testing
- [ ] Data migration from old structure
- [ ] Performance testing
- [ ] Bug fixes

**Week 8:**
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Training materials
- [ ] Production deployment

---

## Risk Mitigation

### Data Migration Risks
- **Risk:** Data loss during schema changes
- **Mitigation:** Full database backup before any migration, test migrations on staging environment

### User Adoption Risks
- **Risk:** Users struggle with new features
- **Mitigation:** Comprehensive training, user documentation, phased rollout

### Performance Risks
- **Risk:** System slowdown with complex hierarchies
- **Mitigation:** Proper indexing, query optimization, caching strategy

### Integration Risks
- **Risk:** Breaking existing functionality
- **Mitigation:** Comprehensive test coverage, backward compatibility checks

---

## Success Metrics

### Quantitative Metrics
- All 9 feedback categories implemented: 100%
- User satisfaction score: >85%
- System performance: <2s page load
- Data accuracy: >99%

### Qualitative Metrics
- Users can configure lookup data without developer intervention
- Clear distinction between AWYAD and Project indicators
- Comprehensive case management with privacy protection
- Flexible multi-currency financial tracking

---

## Support Requirements

### Training Needed
1. System administrators: Configuration management
2. M&E officers: Two-tier indicator system
3. Project coordinators: Project dashboards
4. Finance team: Multi-currency tracking
5. All users: Case management privacy protocols

### Documentation Needed
1. User manual updates for all new features
2. Configuration management guide
3. Indicator setup guide
4. Budget transfer procedures
5. Case management privacy guidelines

---

## Conclusion

This implementation plan provides a comprehensive roadmap to address all feedback from the AWYAD presentation. The phased approach ensures:

1. **Solid Foundation:** Configurable data and role management
2. **Enhanced Core Features:** Better dashboards, indicators, and case management
3. **Advanced Capabilities:** Multi-currency, performance tracking, non-program activities
4. **Quality Assurance:** Thorough testing and user training

The plan prioritizes critical features while maintaining system integrity and user experience. All solutions are designed to be scalable, maintainable, and aligned with AWYAD's organizational structure and workflows.

---

**Next Steps:**
1. Review and approve this implementation plan
2. Confirm timeline and resource allocation
3. Begin Phase 1 implementation
4. Schedule regular progress reviews

**Document Owner:** Development Team  
**Last Updated:** January 22, 2026  
**Version:** 1.0
