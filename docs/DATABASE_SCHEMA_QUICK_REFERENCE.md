# AWYAD MES Database Schema - Quick Reference Guide

**Version:** 2.0  
**Date:** March 12, 2026  
**Status:** Complete (includes all Phase 1 migrations)

---

## Table of Contents

1. [Strategic Framework](#strategic-framework)
2. [Core Application Tables](#core-application-tables)
3. [Enhanced Features](#enhanced-features)
4. [Lookup & Configuration](#lookup--configuration)
5. [System Tables](#system-tables)
6. [Key Relationships](#key-relationships)

---

## Strategic Framework

### strategies
**Purpose:** Top-level organizational strategies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(500) | Strategy name |
| description | TEXT | Detailed description |
| display_order | INTEGER | Display order |
| is_active | BOOLEAN | Active status |

**Relationships:**
- Has many `pillars`

---

### pillars
**Purpose:** Strategic pillars under each strategy

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| strategy_id | UUID | FK → strategies |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(500) | Pillar name |
| display_order | INTEGER | Display order |

**Relationships:**
- Belongs to `strategy`
- Has many `core_program_components`

---

### core_program_components
**Purpose:** Program components with interventions and approaches

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pillar_id | UUID | FK → pillars |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(500) | Component name |
| interventions | JSONB | Array of interventions |
| implementation_approaches | JSONB | Array of approaches |

**Relationships:**
- Belongs to `pillar`
- Has many `projects`

**JSONB Structure:**
```json
interventions: [
  {"name": "Intervention 1", "description": "...", "order": 1},
  {"name": "Intervention 2", "description": "...", "order": 2}
]
```

---

## Core Application Tables

### projects
**Purpose:** Project management

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(200) | Project name |
| donor | VARCHAR(100) | Funding donor |
| thematic_area_id | UUID | FK → thematic_areas |
| core_program_component_id | UUID | FK → core_program_components |
| result_area | VARCHAR(200) | Result area |
| status | VARCHAR(50) | Active/Completed/etc. |
| start_date | DATE | Project start |
| end_date | DATE | Project end |
| budget | DECIMAL(15,2) | Total budget |
| expenditure | DECIMAL(15,2) | Current expenditure |
| burn_rate | DECIMAL(5,2) | Auto-calculated (%) |
| locations | TEXT[] | Array of locations |

**Key Features:**
- Auto-calculated `burn_rate` = (expenditure / budget) * 100
- Links to strategic framework via `core_program_component_id`

---

### indicators
**Purpose:** Two-tier indicator system (AWYAD and Project-level)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(500) | Indicator name |
| **indicator_scope** | VARCHAR(20) | **'awyad' or 'project'** |
| thematic_area_id | UUID | FK → thematic_areas (for AWYAD) |
| project_id | UUID | FK → projects (for project indicators) |
| result_area | VARCHAR(200) | Result area (for project) |
| **indicator_level** | VARCHAR(50) | **'output', 'outcome', 'impact'** |
| **data_type** | VARCHAR(20) | **'number' or 'percentage'** |
| baseline | INTEGER | Baseline value |
| baseline_date | DATE | When baseline established |
| **annual_target** | INTEGER | Annual target |
| **achieved** | INTEGER | Current achieved |
| **lop_target** | INTEGER | Life of Project target |
| **q1_target** | INTEGER | Q1 target |
| **q2_target** | INTEGER | Q2 target |
| **q3_target** | INTEGER | Q3 target |
| **q4_target** | INTEGER | Q4 target |
| **q1_achieved** | INTEGER | Q1 actual |
| **q2_achieved** | INTEGER | Q2 actual |
| **q3_achieved** | INTEGER | Q3 actual |
| **q4_achieved** | INTEGER | Q4 actual |

**Business Rules:**
- AWYAD indicators: Must have `thematic_area_id`
- Project indicators: Must have `project_id` and `result_area`
- Enforced by `validate_indicator_scope()` trigger

---

### indicator_mappings
**Purpose:** Links project indicators to AWYAD indicators

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| awyad_indicator_id | UUID | FK → indicators (AWYAD) |
| project_indicator_id | UUID | FK → indicators (Project) |
| contribution_weight | DECIMAL(5,2) | Weight/multiplier |

**Use Case:**
Shows how project indicators contribute to overall AWYAD indicators.

---

### activities
**Purpose:** Activity tracking with comprehensive disaggregation

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| indicator_id | UUID | FK → indicators |
| activity_name | VARCHAR(500) | Activity name |
| planned_date | DATE | Planned date |
| completion_date | DATE | Actual completion |
| status | VARCHAR(50) | Planned/Completed/etc. |
| location | VARCHAR(100) | Where activity occurred |
| **is_costed** | BOOLEAN | **Has budget or not** |
| **currency** | VARCHAR(10) | **UGX/USD/EUR/GBP** |
| budget | DECIMAL(15,2) | Activity budget |
| actual_cost | DECIMAL(15,2) | Actual cost |

**PWD Disaggregation:**
- `pwds_male`, `pwds_female`, `pwds_other`

**Age/Gender Disaggregation:**
- Age 0-4: `age_0_4_male`, `age_0_4_female`, `age_0_4_other`
- Age 5-17: `age_5_17_male`, `age_5_17_female`, `age_5_17_other`
- Age 18-49: `age_18_49_male`, `age_18_49_female`, `age_18_49_other`
- Age 50+: `age_50_plus_male`, `age_50_plus_female`, `age_50_plus_other`

**Nationality Tracking:**
- `refugee_sudanese`, `refugee_congolese`, `refugee_south_sudanese`, `refugee_other`, `host_community`

**Total Beneficiaries:**
- Auto-calculated from all age/gender fields

---

### cases
**Purpose:** Privacy-first case management

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| case_number | VARCHAR(50) | Unique case number |
| project_id | UUID | FK → projects |
| **case_type_id** | UUID | **FK → case_types** |
| **case_category_id** | UUID | **FK → case_categories** |
| date_reported | DATE | When case reported |
| severity | VARCHAR(50) | Severity level |
| status | VARCHAR(50) | Open/Closed/etc. |
| location | VARCHAR(100) | Where case occurred |
| age_group | VARCHAR(50) | Age range |
| gender | VARCHAR(20) | Male/Female/Other |
| **nationality** | VARCHAR(100) | **Nationality** |
| **disability_status** | VARCHAR(50) | **Type of disability** |
| **has_disability** | BOOLEAN | **Has disability flag** |
| **referred_from** | VARCHAR(200) | **Partner who referred** |
| **referred_to** | VARCHAR(200) | **Partner referred to** |
| **referral_date** | DATE | **When referral made** |
| **support_offered** | TEXT | **Services provided** |
| **tracking_tags** | JSONB | **Dynamic tags** |
| case_worker | VARCHAR(200) | Assigned case worker |
| follow_up_date | DATE | Next follow-up |
| closure_date | DATE | When case closed |

**Privacy Note:**
- ❌ NO name fields (removed for confidentiality)
- ✅ Use case_number for identification

---

## Enhanced Features

### activity_budget_transfers
**Purpose:** Track budget transfers between projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| activity_id | UUID | FK → activities |
| source_project_id | UUID | FK → projects (from) |
| amount | DECIMAL(15,2) | Transfer amount |
| currency | VARCHAR(10) | Currency |
| transfer_date | DATE | When transferred |
| reason | TEXT | Why transfer |
| status | VARCHAR(20) | pending/approved/rejected |
| approved_by | UUID | FK → users |

---

### currency_rates
**Purpose:** Multi-currency exchange rates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| from_currency | VARCHAR(10) | Source currency |
| to_currency | VARCHAR(10) | Target currency |
| rate | DECIMAL(15,6) | Exchange rate |
| effective_date | DATE | Rate effective date |
| is_active | BOOLEAN | Currently active |

**Unique Constraint:** (from_currency, to_currency, effective_date)

**Seeded Rates:**
- USD ↔ UGX: 3,700
- EUR ↔ UGX: 4,050
- GBP ↔ UGX: 4,700

---

### monthly_snapshots
**Purpose:** Monthly performance tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| snapshot_month | DATE | First day of month |
| project_id | UUID | FK → projects |
| indicator_id | UUID | FK → indicators |
| planned_activities | INTEGER | Activities planned |
| completed_activities | INTEGER | Activities completed |
| target_beneficiaries | INTEGER | Target beneficiaries |
| actual_beneficiaries | INTEGER | Actual beneficiaries |
| target_value | INTEGER | Indicator target |
| achieved_value | INTEGER | Indicator achieved |
| planned_budget | DECIMAL(15,2) | Budget planned |
| actual_expenditure | DECIMAL(15,2) | Actual spent |
| **performance_rate** | DECIMAL(5,2) | **Auto-calculated (%)** |
| **activity_completion_rate** | DECIMAL(5,2) | **Auto-calculated (%)** |
| **beneficiary_reach_rate** | DECIMAL(5,2) | **Auto-calculated (%)** |
| **burn_rate** | DECIMAL(5,2) | **Auto-calculated (%)** |

**Unique Constraint:** (snapshot_month, project_id, indicator_id)

**Auto-Calculated Rates:**
- `performance_rate` = (achieved_value / target_value) * 100
- `activity_completion_rate` = (completed_activities / planned_activities) * 100
- `beneficiary_reach_rate` = (actual_beneficiaries / target_beneficiaries) * 100
- `burn_rate` = (actual_expenditure / planned_budget) * 100

---

## Lookup & Configuration

### case_types
**Purpose:** Configurable case types

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(200) | Type name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |
| display_order | INTEGER | Display order |

**Seeded Types:**
- GBV (Gender-Based Violence)
- CP (Child Protection)
- LEGAL (Legal Assistance)
- PSYCHOSOCIAL (Psychosocial Support)
- OTHER (Other Protection)

---

### case_categories
**Purpose:** Categories within case types

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| case_type_id | UUID | FK → case_types |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(200) | Category name |
| display_order | INTEGER | Display order |

**Relationships:**
- Belongs to `case_type`

---

### non_program_categories
**Purpose:** Categories for non-program activities

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(50) | Unique code |
| name | VARCHAR(200) | Category name |
| display_order | INTEGER | Display order |

**Seeded Categories:**
- PARTNERSHIP (Partnerships)
- COMMUNICATIONS (Communications)
- ADVOCACY (Advocacy)
- HR (Human Resources)
- ED_OFFICE (Executive Director Office)
- LOGISTICS (Logistics and Procurement)

---

### non_program_activities
**Purpose:** Activities not tied to projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | FK → non_program_categories |
| activity_name | VARCHAR(500) | Activity name |
| planned_date | DATE | Planned date |
| completion_date | DATE | Completed date |
| status | VARCHAR(50) | Status |
| target | INTEGER | What was planned |
| achieved | INTEGER | What was achieved |
| unit | VARCHAR(100) | Unit of measurement |

---

### system_configurations
**Purpose:** Generic configuration table for all lookup data

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| config_type | VARCHAR(100) | Type (partner, district, etc.) |
| config_code | VARCHAR(100) | Code within type |
| config_value | VARCHAR(500) | The value |
| description | TEXT | Description |
| metadata | JSONB | Additional data |
| is_active | BOOLEAN | Active status |
| display_order | INTEGER | Display order |
| parent_id | UUID | For hierarchical configs |

**Unique Constraint:** (config_type, config_code)

**Seeded Types:**
- `partner` - Partners (UNHCR, UNICEF, etc.)
- `district` - Districts (Adjumani, Arua, etc.)
- `service_type` - Service types (Counseling, Legal Aid, etc.)
- `donor` - Donors (UNHCR, USAID, EU, etc.)
- `organization` - Organizations (Police, Hospitals, etc.)
- `activity_type` - Activity types (Training, Distribution, etc.)

---

## System Tables

### users
**Purpose:** User accounts

**Key Columns:**
- `email`, `username` (unique)
- `password_hash`
- `is_active`, `is_verified`
- `require_password_change` (for first login)

### roles
**Purpose:** User roles (Admin, Manager, etc.)

### permissions
**Purpose:** Granular permissions (create.project, edit.case, etc.)

### user_roles
**Purpose:** Many-to-many link between users and roles

### role_permissions
**Purpose:** Many-to-many link between roles and permissions

### audit_logs
**Purpose:** Audit trail of all changes

**Key Columns:**
- `user_id`, `action`, `resource`, `resource_id`
- `old_values`, `new_values` (JSONB)
- `ip_address`, `user_agent`

---

## Key Relationships

### Strategic Hierarchy
```
Strategy
  └─ Pillar
      └─ Core Program Component
          └─ Project
              ├─ Indicators (project-level)
              ├─ Activities
              └─ Cases
```

### Indicator Flow
```
Thematic Area
  └─ AWYAD Indicator
      └─ Indicator Mapping
          └─ Project Indicator
              └─ Activities
```

### Case Management Flow
```
Case Type
  └─ Case Category
      └─ Case
          ├─ Referral (from/to partners)
          └─ Support Offered
```

### Activity Flow
```
Project
  └─ Activity
      ├─ Budget Transfer (from another project)
      ├─ Beneficiary Data (age/gender/PWD/nationality)
      └─ Financial Data (multi-currency)
```

---

## Common Queries

### Get Active AWYAD Indicators
```sql
SELECT * FROM indicators 
WHERE indicator_scope = 'awyad' 
  AND is_active = TRUE;
```

### Get Project Indicators with Contribution to AWYAD
```sql
SELECT 
  p.name as project_name,
  pi.name as project_indicator,
  ai.name as awyad_indicator,
  im.contribution_weight
FROM indicators pi
JOIN indicator_mappings im ON pi.id = im.project_indicator_id
JOIN indicators ai ON im.awyad_indicator_id = ai.id
JOIN projects p ON pi.project_id = p.id
WHERE pi.indicator_scope = 'project';
```

### Get Activity Beneficiary Totals
```sql
SELECT 
  activity_name,
  total_beneficiaries,
  (pwds_male + pwds_female + pwds_other) as total_pwds,
  (refugee_sudanese + refugee_congolese + refugee_south_sudanese + refugee_other) as total_refugees,
  host_community
FROM activities
WHERE project_id = 'some-uuid';
```

### Get Monthly Performance Trends
```sql
SELECT 
  snapshot_month,
  performance_rate,
  activity_completion_rate,
  beneficiary_reach_rate,
  burn_rate
FROM monthly_snapshots
WHERE project_id = 'some-uuid'
ORDER BY snapshot_month DESC;
```

### Get Cases by Type with Referral Info
```sql
SELECT 
  c.case_number,
  ct.name as case_type,
  cc.name as case_category,
  c.referred_from,
  c.referred_to,
  c.has_disability
FROM cases c
JOIN case_types ct ON c.case_type_id = ct.id
LEFT JOIN case_categories cc ON c.case_category_id = cc.id
WHERE c.status = 'Open';
```

---

## Migration Commands

### Apply All Migrations
```bash
cd database/migrations
psql -U username -d awyad_mes -f run_all_migrations.sql
```

### Rollback All Migrations
```bash
cd database/migrations
psql -U username -d awyad_mes -f rollback_all_migrations.sql
```

### Use Complete Schema (Fresh Install)
```bash
psql -U username -d awyad_mes -f schema_v2.sql
```

---

## Notes

- **All timestamps:** Use `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **All IDs:** Use UUID via `gen_random_uuid()`
- **Auto-updates:** Triggers update `updated_at` automatically
- **Soft deletes:** Most tables use `is_active` flag instead of hard deletes
- **JSONB fields:** Use for flexible, evolving data structures (interventions, tracking_tags, metadata)

---

**Database Schema Quick Reference - Version 2.0**  
Last Updated: March 12, 2026
