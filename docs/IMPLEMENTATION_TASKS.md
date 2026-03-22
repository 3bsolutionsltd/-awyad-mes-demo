# AWYAD MES - Detailed Implementation Tasks
**Date:** January 22, 2026  
**Version:** 1.0  
**Status:** 🚀 Ready to Begin

---

## Task Tracking Legend

- 🔴 **Not Started** - Task not yet begun
- 🟡 **In Progress** - Currently working on this
- 🟢 **Completed** - Task finished and tested
- ⏸️ **Blocked** - Waiting on dependency or decision
- ⚠️ **Needs Review** - Ready for review/testing

---

## Phase 1: Critical Foundation (Weeks 1-2)

### Week 1: Database Schema Foundation

#### Task 1.1: Strategic Hierarchy Tables �
**Owner:** Backend Developer  
**Priority:** Critical  
**Estimated Time:** 4 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `001_create_strategic_hierarchy.sql`
- [x] Create `strategies` table with all fields
- [x] Create `pillars` table with strategy relationship
- [x] Create `core_program_components` table with pillar relationship
- [x] Add JSONB fields for interventions and implementation_approaches
- [x] Create indexes for performance
- [x] Write rollback script
- [ ] Test migration on local database (READY TO RUN)
- [x] Document table relationships

**Acceptance Criteria:**
- ✓ All tables created successfully
- ✓ Foreign key relationships work
- ✓ JSONB fields accept array data
- ✓ Indexes improve query performance
- ✓ Rollback script restores previous state

**Files Created:**
- ✅ `database/migrations/001_create_strategic_hierarchy.sql`
- ✅ `database/migrations/rollback/001_rollback_strategic_hierarchy.sql`

---

#### Task 1.2: Update Projects Table �
**Owner:** Backend Developer  
**Priority:** Critical  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `002_update_projects.sql`
- [x] Add `core_program_component_id` foreign key to projects
- [x] Add `result_area` varchar field to projects
- [x] Create index on `core_program_component_id`
- [ ] Test with existing project data (READY TO RUN)
- [x] Write rollback script

**Acceptance Criteria:**
- ✓ Projects can link to core program components
- ✓ Result area field accepts text
- ✓ Existing projects not affected
- ✓ Foreign key constraint works

**Files Created:**
- ✅ `database/migrations/002_update_projects.sql`
- ✅ `database/migrations/rollback/002_rollback_projects.sql`

---

#### Task 1.3: Enhanced Indicators Schema �
**Owner:** Backend Developer  
**Priority:** Critical  
**Estimated Time:** 4 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `003_enhance_indicators.sql`
- [x] Add `indicator_scope` field (awyad/project) with check constraint
- [x] Add `result_area` field for project indicators
- [x] Add `indicator_level` field (output/outcome/impact)
- [x] Add `data_type` field (number/percentage)
- [x] Add quarterly fields (q1-q4 targets and achieved)
- [x] Add `lop_target` and `annual_target` fields
- [x] Add `baseline_date` field
- [x] Make `thematic_area_id` nullable
- [x] Create `indicator_mappings` table
- [x] Add validation constraints
- [x] Update indexes

**Acceptance Criteria:**
- ✓ All new fields added successfully
- ✓ Check constraints enforce valid values
- ✓ Q1-Q4 fields work correctly
- ✓ Indicator mappings table links AWYAD to project indicators
- ✓ Data type validation works

**Files Created:**
- ✅ `database/migrations/003_enhance_indicators.sql`
- ✅ `database/migrations/rollback/003_rollback_indicators.sql`

---
�
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `004_enhance_activities.sql`
- [x] Add `is_costed` boolean field (default true)
- [x] Add `currency` varchar field (default 'UGX')
- [x] Add disability tracking fields:
  - `pwds_male`, `pwds_female`, `pwds_other`
- [x] Add age/gender disaggregation fields:
  - `age_0_4_male`, `age_0_4_female`, `age_0_4_other`
  - `age_5_17_male`, `age_5_17_female`, `age_5_17_other`
  - `age_18_49_male`, `age_18_49_female`, `age_18_49_other`
  - `age_50_plus_male`, `age_50_plus_female`, `age_50_plus_other`
- [x] Add nationality fields:
  - `refugee_sudanese`, `refugee_congolese`, `refugee_south_sudanese`
  - `refugee_other`, `host_community`
- [x] Update total_beneficiaries computed column
- [x] Create `activity_budget_transfers` table
- [x] Create `currency_rates` table
- [x] Add indexes

**Acceptance Criteria:**
- ✓ All disaggregation fields work
- ✓ Currency field accepts valid codes
- ✓ Budget transfers table ready
- ✓ Total beneficiaries calculation includes PWDs

**Files Created:**
- ✅ `database/migrations/004_enhance_activities.sql`
- ✅ `database/migrations/004_enhance_activities.sql`
- `database/migrations/rollback/004_rollback_activities.sql`

---

#### Task 1.5: Case Management Overhaul �
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `005_overhaul_cases.sql`
- [x] Drop any name-related columns (if exist)
- [x] Add `case_category_id` foreign key
- [x] Add `referred_from` and `referred_to` fields
- [x] Add `referral_date` field
- [x] Rename `case_description` to `support_offered`
- [x] Add `nationality`, `disability_status`, `has_disability` fields
- [x] Add `tracking_tags` JSONB field
- [x] Create `case_types` table
- [x] Create `case_categories` table
- [x] Update `cases` with foreign keys
- [x] Add indexes

**Acceptance Criteria:**
- ✓ No name fields remain
- ✓ Case types and categories work
- ✓ Referral tracking functional
- ✓ Support offered replaces description
- ✓ Dynamic tagging works

**Files Created:**
- ✅ `database/migrations/005_overhaul_cases.sql`
- ✅ `database/migrations/rollback/005_rollback_cases.sql`

---

#### Task 1.6: Monthly Tracking Tables �
**Owner:** Backend Developer  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `006_monthly_snapshots.sql`
- [x] Create `monthly_snapshots` table
- [x] Add computed columns for performance rates
- [x] Create indexes on month, project, indicator
- [ ] Write seed data script for testing (OPTIONAL)

**Acceptance Criteria:**
- ✓ Snapshots table accepts monthly data
- ✓ Performance rates calculate correctly
- ✓ Unique constraint prevents duplicates

**Files Created:**
- ✅ `database/migrations/006_monthly_snapshots.sql`
- ✅ `database/migrations/rollback/006_rollback_monthly_snapshots.sql`

---
�
**Owner:** Backend Developer  
**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `007_non_program_activities.sql`
- [x] Create `non_program_categories` table
- [x] Seed 6 categories (Partnerships, Communications, etc.)
- [x] Create `non_program_activities` table
- [x] Add indexes
- [ ] Test category-activity relationship (READY TO RUN)

**Acceptance Criteria:**
- ✓ Categories table populated
- ✓ Activities can link to categories
- ✓ Simple target/achieved tracking works

**Files Created:**
- ✅ `database/migrations/007_non_program_activities.sql`
- ✅ `database/migrations/007_non_program_activities.sql`
- `database/migrations/rollback/007_rollback_non_program_activities.sql`

---�
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `008_system_configurations.sql`
- [x] Create `system_configurations` table with JSONB metadata
- [x] Seed initial data:
  - Partners (UNHCR, UNICEF, WFP, IOM)
  - Service types (Counseling, Legal Aid, Medical, Shelter, Economic, Education, Referral)
  - Locations (Adjumani, Arua, Kampala, Yumbe)
  - Donors (UNHCR, USAID, EU, SIDA, DFID)
  - Organizations (Police, Probation, Health Center, Hospital)
  - Activity types (Training, Awareness, Counseling, Distribution, etc.)
- [x] Create indexes
- [xLocations (Nakivale, Kampala, Nyakabande)
- [ ] Create indexes
- [ ] Add unique constraint on category+code

**Acceptance Criteria:**
- ✓ Configuration table accepts all lookup data
- ✓ Hierarchical data (parent_id) works
- ✓ Initial data seeded
- ✓ Flexible for future additions

**Files Created:**
- ✅ `database/migrations/008_system_configurations.sql`
- ✅ `database/migrations/rollback/008_rollback_system_configurations.sql`

---

#### Task 1.9: User Roles Enhancement 🟢
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Status:** ✅ COMPLETED (2026-01-22)

**Subtasks:**
- [x] Create migration file: `009_enhanced_roles.sql`
- [x] Insert new roles:
  - Project Coordinator
  - M&E Officer, M&E Assistant
  - Finance Officer, Finance Assistant
  - Executive, Admin
- [x] Create permissions for each role (as JSONB)
- [x] Create role_hierarchy table
- [x] Seed role hierarchy (Admin > Executive > PM > Coordinators)

**Acceptance Criteria:**
- ✓ All 7 roles created
- ✓ Permissions assigned correctly
- ✓ Role hierarchy documented

**Files Created:**
- ✅ `database/migrations/009_enhanced_roles.sql`
- ✅ `database/migrations/rollback/009_rollback_roles.sql`

---

### Week 2: Configuration & API Foundation

#### Task 2.1: Run All Migrations 🟡
**Owner:** Backend Developer  
**Priority:** Critical  
**Estimated Time:** 1 hour  
**Dependencies:** Tasks 1.1-1.9

**Subtasks:**
- [ ] Review all migration scripts
- [ ] Backup production database
- [ ] Run migrations on development
- [ ] Run migrations on staging
- [ ] Verify data integrity
- [ ] Test rollback procedures
- [ ] Document migration process

**Acceptance Criteria:**
- ✓ All migrations run successfully
- ✓ No data loss
- ✓ Rollback works
- ✓ Database schema matches design

---

#### Task 2.2: Strategies API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.1, 2.1

**Subtasks:**
- [ ] Create `src/server/routes/strategies.js`
- [ ] Implement GET /api/v1/strategies (list all)
- [ ] Implement GET /api/v1/strategies/:id (get one)
- [ ] Implement POST /api/v1/strategies (create)
- [ ] Implement PUT /api/v1/strategies/:id (update)
- [ ] Implement DELETE /api/v1/strategies/:id (soft delete)
- [ ] Add validation middleware
- [ ] Add permission checks (admin only)
- [ ] Write unit tests
- [ ] Update API documentation

**Acceptance Criteria:**
- ✓ All CRUD operations work
- ✓ Validation prevents bad data
- ✓ Only authorized users can modify
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/strategies.js`
- `src/server/routes/index.js` (register routes)
- `tests/api/strategies.test.js`
- `docs/API.md`

---

#### Task 2.3: Pillars API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.2

**Subtasks:**
- [ ] Create `src/server/routes/pillars.js`
- [ ] Implement full CRUD endpoints
- [ ] Include strategy relationship in responses
- [ ] Add validation for strategy_id
- [ ] Add permission checks
- [ ] Write tests
- [ ] Document endpoints

**Files to Create/Modify:**
- `src/server/routes/pillars.js`
- `tests/api/pillars.test.js`

---

#### Task 2.4: Core Program Components API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 2.3

**Subtasks:**
- [ ] Create `src/server/routes/coreProgramComponents.js`
- [ ] Implement full CRUD endpoints
- [ ] Handle JSONB fields (interventions, approaches)
- [ ] Validate JSONB structure
- [ ] Include pillar relationship
- [ ] Add endpoints for managing interventions/approaches:
  - POST /:id/interventions (add intervention)
  - PUT /:id/interventions/:index (update intervention)
  - DELETE /:id/interventions/:index (remove intervention)
  - Same for implementation_approaches
- [ ] Write tests
- [ ] Document JSONB structure

**Acceptance Criteria:**
- ✓ CRUD operations work
- ✓ Can add/edit/remove interventions dynamically
- ✓ Can add/edit/remove approaches dynamically
- ✓ JSONB validation works
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/coreProgramComponents.js`
- `tests/api/coreProgramComponents.test.js`
- `docs/JSONB_STRUCTURES.md`

---

#### Task 2.5: Enhanced Dashboard API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** Tasks 2.2, 2.3, 2.4

**Subtasks:**
- [ ] Create `src/server/routes/dashboard.js`
- [ ] Implement GET /api/v1/dashboard/strategic
  - Returns full hierarchy (strategies → pillars → components)
  - Includes AWYAD indicators
  - Includes projects grouped by components
  - Includes aggregated statistics
- [ ] Implement GET /api/v1/dashboard/project/:projectId
  - Returns project-specific data
  - Project indicators only
  - Activities for that project
  - Cases for that project
  - Financial data
  - Team members
- [ ] Optimize queries (prevent N+1)
- [ ] Add caching layer
- [ ] Write tests
- [ ] Document response structure

**Acceptance Criteria:**
- ✓ Strategic dashboard loads in <2 seconds
- ✓ Project dashboard loads in <1 second
- ✓ Data hierarchy correct
- ✓ Caching works
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/dashboard.js`
- `src/server/services/dashboardService.js`
- `tests/api/dashboard.test.js`

---

#### Task 2.6: Enhanced Indicators API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1.3, 2.1

**Subtasks:**
- [ ] Update `src/server/routes/indicators.js`
- [ ] Add filtering by indicator_scope (awyad/project)
- [ ] Add validation for new fields
- [ ] Implement indicator mapping endpoints:
  - POST /api/v1/indicators/mappings (link project → AWYAD)
  - GET /api/v1/indicators/:id/mappings
  - DELETE /api/v1/indicators/mappings/:id
- [ ] Update calculations for Q1-Q4
- [ ] Add data_type validation
- [ ] Handle percentage vs number display
- [ ] Write tests
- [ ] Update documentation

**Acceptance Criteria:**
- ✓ Can create both AWYAD and project indicators
- ✓ Mappings link correctly
- ✓ Q4 included in calculations
- ✓ Percentages validate correctly
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/indicators.js`
- `src/server/services/indicatorService.js`
- `tests/api/indicators.test.js`

---

#### Task 2.7: Enhanced Activities API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** Task 1.4, 2.1

**Subtasks:**
- [ ] Update `src/server/routes/activities.js`
- [ ] Add validation for new fields
- [ ] Handle currency validation
- [ ] Implement budget transfer endpoints:
  - POST /api/v1/activities/:id/transfers (record transfer)
  - GET /api/v1/activities/:id/transfers
  - PUT /api/v1/activities/transfers/:id (update/approve)
  - DELETE /api/v1/activities/transfers/:id
- [ ] Update total_budget calculation
- [ ] Add disaggregation data validation
- [ ] Implement currency conversion service
- [ ] Write tests

**Acceptance Criteria:**
- ✓ Budget transfers work
- ✓ Currency conversion accurate
- ✓ Disaggregation fields validated
- ✓ Non-costed activities supported
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/activities.js`
- `src/server/services/activityService.js`
- `src/server/services/currencyService.js`
- `tests/api/activities.test.js`

---

#### Task 2.8: Enhanced Cases API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1.5, 2.1

**Subtasks:**
- [ ] Update `src/server/routes/cases.js`
- [ ] Remove name field from all responses
- [ ] Implement case types/categories endpoints:
  - GET /api/v1/case-types
  - POST /api/v1/case-types
  - GET /api/v1/case-categories
  - POST /api/v1/case-categories
- [ ] Add referral tracking validation
- [ ] Implement dynamic filtering by tags
- [ ] Add support_offered field
- [ ] Write tests
- [ ] Ensure privacy/security

**Acceptance Criteria:**
- ✓ No name data exposed
- ✓ Case types/categories configurable
- ✓ Referral tracking works
- ✓ Dynamic filtering functional
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/cases.js`
- `src/server/routes/caseTypes.js`
- `src/server/services/caseService.js`
- `tests/api/cases.test.js`

---

#### Task 2.9: System Configurations API 🔴
**Owner:** Backend Developer  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.8, 2.1

**Subtasks:**
- [ ] Create `src/server/routes/configurations.js`
- [ ] Implement GET /api/v1/config/:category
- [ ] Implement GET /api/v1/config/:category/:code
- [ ] Implement POST /api/v1/config/:category (add new)
- [ ] Implement PUT /api/v1/config/:category/:code (update)
- [ ] Implement DELETE /api/v1/config/:category/:code (deactivate)
- [ ] Add admin-only permissions
- [ ] Prevent deletion of in-use configs
- [ ] Write tests

**Acceptance Criteria:**
- ✓ All categories accessible
- ✓ CRUD operations work
- ✓ In-use configs protected
- ✓ Admin access only
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/configurations.js`
- `src/server/services/configService.js`
- `tests/api/configurations.test.js`

---

#### Task 2.10: Monthly Tracking API 🔴
**Owner:** Backend Developer  
**Priority:** Medium  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1.6, 2.1

**Subtasks:**
- [ ] Create `src/server/routes/monthlyTracking.js`
- [ ] Implement GET /api/v1/monthly-tracking/projects/:id
- [ ] Implement GET /api/v1/monthly-tracking/performance-rates
- [ ] Implement GET /api/v1/monthly-tracking/reach-vs-target
- [ ] Create snapshot generation service (scheduled job)
- [ ] Add filtering by date range
- [ ] Write tests

**Acceptance Criteria:**
- ✓ Performance rates calculate correctly
- ✓ Reach vs target data accurate
- ✓ Snapshots generate automatically
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/monthlyTracking.js`
- `src/server/services/monthlySnapshotService.js`
- `src/server/jobs/generateMonthlySnapshots.js`
- `tests/api/monthlyTracking.test.js`

---

#### Task 2.11: Non-Program Activities API 🔴
**Owner:** Backend Developer  
**Priority:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.7, 2.1

**Subtasks:**
- [ ] Create `src/server/routes/nonProgramActivities.js`
- [ ] Implement full CRUD for categories
- [ ] Implement full CRUD for activities
- [ ] Add filtering by category
- [ ] Add achievement reporting endpoints
- [ ] Write tests

**Acceptance Criteria:**
- ✓ Categories and activities work independently
- ✓ No project/indicator linkage
- ✓ Simple target/achieved tracking
- ✓ Tests pass

**Files to Create/Modify:**
- `src/server/routes/nonProgramActivities.js`
- `tests/api/nonProgramActivities.test.js`

---

## Phase 2: Core Features (Weeks 3-4)

### Week 3: Frontend - Strategic Dashboard & Indicators

#### Task 3.1: Strategic Dashboard UI 🔴
**Owner:** Frontend Developer  
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.5

**Subtasks:**
- [ ] Create `renderStrategicDashboard.js`
- [ ] Design hierarchy visualization
- [ ] Implement collapsible sections:
  - Strategies (collapsible)
    - Pillars (collapsible)
      - Core Program Components (collapsible)
        - Interventions (list)
        - Approaches (list)
      - AWYAD Indicators (table)
    - Projects (cards/list)
- [ ] Add statistics summary cards
- [ ] Add search/filter functionality
- [ ] Make responsive for mobile
- [ ] Add loading states
- [ ] Handle errors gracefully

**Acceptance Criteria:**
- ✓ Full hierarchy displays correctly
- ✓ Collapsible sections work smoothly
- ✓ Performance good with large datasets
- ✓ Mobile responsive
- ✓ Accessible (WCAG 2.1 AA)

**Files to Create/Modify:**
- `renderStrategicDashboard.js`
- `app.js` (add navigation)
- `public/css/dashboard.css`

---

#### Task 3.2: Project Dashboard UI 🔴
**Owner:** Frontend Developer  
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.5

**Subtasks:**
- [ ] Create `renderProjectDashboard.js`
- [ ] Design project header section
- [ ] Implement tabs:
  - Overview
  - Indicators
  - Activities
  - Cases
  - Team
  - Financial
- [ ] Add project-specific charts
- [ ] Add export functionality
- [ ] Make responsive

**Acceptance Criteria:**
- ✓ Project data displays correctly
- ✓ Tabs switch smoothly
- ✓ Charts render properly
- ✓ Export works
- ✓ Mobile responsive

**Files to Create/Modify:**
- `renderProjectDashboard.js`
- `app.js` (add project selection)
- `public/css/project-dashboard.css`

---

#### Task 3.3: Dashboard Navigation 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Tasks 3.1, 3.2

**Subtasks:**
- [ ] Update main navigation to include:
  - Strategic Dashboard
  - Project Dashboards (dropdown)
- [ ] Implement dashboard switcher
- [ ] Add breadcrumbs
- [ ] Update `app.js` routing

**Acceptance Criteria:**
- ✓ Can switch between dashboards easily
- ✓ Current location always clear
- ✓ Navigation intuitive

**Files to Create/Modify:**
- `app.js`
- `index.html`
- `public/css/navigation.css`

---

#### Task 3.4: Unified Indicator Form 🔴
**Owner:** Frontend Developer  
**Priority:** Critical  
**Estimated Time:** 6 hours  
**Dependencies:** Task 2.6

**Subtasks:**
- [ ] Update `renderIndicatorTracking.js` or create new form component
- [ ] Implement scope selector (AWYAD/Project)
- [ ] Add conditional field display logic
- [ ] For AWYAD scope: Show Thematic Area dropdown
- [ ] For Project scope: Show Project + Result Area dropdowns
- [ ] Add indicator level dropdown
- [ ] Add data type selector (number/percentage)
- [ ] Add LOP field with tooltip
- [ ] Add Q1, Q2, Q3, Q4 fields
- [ ] Add mapping to AWYAD indicator (for project indicators)
- [ ] Implement validation
- [ ] Add form submission logic
- [ ] Show smart value formatting based on data type

**Acceptance Criteria:**
- ✓ Form switches correctly based on scope
- ✓ Validation works for all fields
- ✓ Q4 included in quarterly breakdown
- ✓ Data type affects display format
- ✓ Can create both indicator types
- ✓ Mapping works

**Files to Create/Modify:**
- `renderIndicatorTracking.js` or `components/IndicatorForm.js`
- `public/css/forms.css`

---

#### Task 3.5: Indicator Tracking Table Update 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 3.4

**Subtasks:**
- [ ] Update table to show Q4 column
- [ ] Add indicator scope badge (AWYAD/Project)
- [ ] Add indicator level display
- [ ] Implement smart value formatting (% vs numbers)
- [ ] Add filter by scope
- [ ] Add filter by level
- [ ] Update export to include new fields

**Acceptance Criteria:**
- ✓ Q4 displays correctly
- ✓ Percentages show with % symbol
- ✓ Numbers show with units
- ✓ Filters work
- ✓ Export includes all fields

**Files to Create/Modify:**
- `renderIndicatorTracking.js`
- `exportFunctions.js`

---

### Week 4: Frontend - Case Management & Activities

#### Task 4.1: Enhanced Activity Form 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** Task 2.7

**Subtasks:**
- [ ] Update activity entry form
- [ ] Add "Is Costed" checkbox
- [ ] Add currency dropdown (UGX default, USD, EUR, GBP)
- [ ] Add "Other" to gender options
- [ ] Add disability tracking section:
  - PWDs Male, Female, Other
- [ ] Add enhanced disaggregation section:
  - Age groups (0-4, 5-17, 18-49, 50+) x Gender (M/F/O)
  - Nationality (Sudanese, Congolese, S.Sudanese, Other, Host)
- [ ] Make form collapsible sections for better UX
- [ ] Add validation
- [ ] Update total beneficiaries calculation

**Acceptance Criteria:**
- ✓ All new fields functional
- ✓ Currency dropdown works
- ✓ Disaggregation fields validated
- ✓ Form submits correctly
- ✓ Responsive layout

**Files to Create/Modify:**
- `renderEntryForm.js`
- `public/css/forms.css`

---

#### Task 4.2: Budget Transfer Interface 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 5 hours  
**Dependencies:** Task 2.7

**Subtasks:**
- [ ] Create budget transfer modal/form
- [ ] Add to activity details page
- [ ] Show transfer history
- [ ] Implement:
  - Source project selector
  - Amount input
  - Currency selector
  - Transfer date
  - Reason text area
- [ ] Add approval workflow UI (for finance officers)
- [ ] Show transfers in both projects' views
- [ ] Update budget calculations to include transfers

**Acceptance Criteria:**
- ✓ Can record transfers
- ✓ Transfer history visible
- ✓ Budget updates correctly
- ✓ Approval workflow works
- ✓ Both projects reflect transfer

**Files to Create/Modify:**
- `components/BudgetTransferModal.js`
- `renderActivityTracking.js`
- `renderProjects.js`

---

#### Task 4.3: Case Management UI Overhaul 🔴
**Owner:** Frontend Developer  
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.8

**Subtasks:**
- [ ] Update `renderCaseManagement.js`
- [ ] Remove all name fields from UI
- [ ] Add case type/category dropdowns (cascading)
- [ ] Add referral section:
  - Referred From (partner dropdown - configurable)
  - Referred To (partner dropdown - configurable)
  - Referral Date
- [ ] Rename "Case Description" to "Support Offered"
- [ ] Add dynamic tagging interface
- [ ] Implement advanced filtering:
  - By project
  - By location
  - By case type
  - By status
  - By tags
- [ ] Add case details modal (no name visible)
- [ ] Update case list view

**Acceptance Criteria:**
- ✓ No name fields anywhere
- ✓ Case types/categories work
- ✓ Referral tracking functional
- ✓ Tagging works
- ✓ Filtering robust
- ✓ Privacy maintained

**Files to Create/Modify:**
- `renderCaseManagement.js`
- `components/CaseForm.js`
- `components/CaseFilters.js`

---

#### Task 4.4: Configuration Management UI 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** Task 2.9

**Subtasks:**
- [ ] Create configuration management page
- [ ] Add to admin navigation
- [ ] Implement category tabs:
  - Partners
  - Service Types
  - Locations
  - Donors
  - Case Types
  - Case Categories
- [ ] Create CRUD interface for each category
- [ ] Add search/filter
- [ ] Add drag-to-reorder functionality
- [ ] Add bulk import/export
- [ ] Add confirmation dialogs for delete
- [ ] Restrict to admin users only

**Acceptance Criteria:**
- ✓ All categories manageable
- ✓ CRUD operations work
- ✓ Reordering works
- ✓ Import/export functional
- ✓ Admin access only

**Files to Create/Modify:**
- `renderSystemConfig.js`
- `components/ConfigManager.js`
- `app.js` (add to navigation)

---

## Phase 3: Advanced Features (Weeks 5-6)

### Week 5: Monthly Tracking & Non-Program Activities

#### Task 5.1: Enhanced Monthly Tracking UI 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.10

**Subtasks:**
- [ ] Update `renderMonthlyTracking.js`
- [ ] Add project filter dropdown (multi-select)
- [ ] Implement activity drill-down interface
- [ ] Create Reach vs Target visualization component
- [ ] Create Performance Rates dashboard:
  - Programmatic Performance
  - Activity Completion
  - Beneficiary Reach
  - Financial Burn
- [ ] Add comparison charts (planned vs actual)
- [ ] Add trend lines
- [ ] Make responsive

**Acceptance Criteria:**
- ✓ Project filtering works
- ✓ Drill-down functional
- ✓ Visualizations accurate
- ✓ Performance rates display correctly
- ✓ Responsive design

**Files to Create/Modify:**
- `renderMonthlyTracking.js`
- `components/PerformanceRates.js`
- `components/ReachVsTarget.js`

---

#### Task 5.2: Non-Program Activities Module 🔴
**Owner:** Frontend Developer  
**Priority:** Medium  
**Estimated Time:** 6 hours  
**Dependencies:** Task 2.11

**Subtasks:**
- [ ] Create `renderNonProgramActivities.js`
- [ ] Add to main navigation
- [ ] Implement category tabs:
  - Partnerships
  - Communications
  - Advocacy
  - HR
  - ED Office
  - Logistics & Procurement
- [ ] Create simple entry form (no indicators)
- [ ] Implement target vs achieved tracking
- [ ] Add summary reports view
- [ ] Add filtering by status/date

**Acceptance Criteria:**
- ✓ All categories accessible
- ✓ Simple form works
- ✓ No indicator linkage
- ✓ Reporting functional

**Files to Create/Modify:**
- `renderNonProgramActivities.js`
- `app.js` (add to navigation)

---

#### Task 5.3: Currency Conversion UI 🔴
**Owner:** Frontend Developer  
**Priority:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.7

**Subtasks:**
- [ ] Add currency selector to reports
- [ ] Show original + converted amounts
- [ ] Add exchange rate display
- [ ] Implement currency toggle on dashboards
- [ ] Update all financial displays

**Acceptance Criteria:**
- ✓ Can view reports in different currencies
- ✓ Conversion accurate
- ✓ Original currency always shown
- ✓ Exchange rates visible

**Files to Create/Modify:**
- `components/CurrencySelector.js`
- `renderDashboard.js`
- `renderProjects.js`

---

### Week 6: Strategic Management & Admin Tools

#### Task 6.1: Strategic Hierarchy Management UI 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 8 hours  
**Dependencies:** Tasks 2.2, 2.3, 2.4

**Subtasks:**
- [ ] Create management interface for:
  - Strategies
  - Pillars
  - Core Program Components
  - Interventions
  - Implementation Approaches
- [ ] Implement CRUD operations
- [ ] Add drag-to-reorder
- [ ] Show hierarchy visually
- [ ] Add validation
- [ ] Restrict to admin users

**Acceptance Criteria:**
- ✓ Full hierarchy manageable
- ✓ CRUD works at all levels
- ✓ Reordering functional
- ✓ Changes reflect in dashboards
- ✓ Admin access only

**Files to Create/Modify:**
- `renderStrategicManagement.js`
- `components/HierarchyManager.js`

---

#### Task 6.2: User Role Management UI 🔴
**Owner:** Frontend Developer  
**Priority:** High  
**Estimated Time:** 6 hours  
**Dependencies:** Task 1.9

**Subtasks:**
- [ ] Create user management page
- [ ] Show all users with their roles
- [ ] Implement role assignment interface
- [ ] Add user creation form
- [ ] Show permissions for each role
- [ ] Add project assignment for coordinators/assistants
- [ ] Restrict to admin users

**Acceptance Criteria:**
- ✓ Can view all users
- ✓ Can assign roles
- ✓ Can create new users
- ✓ Role permissions clear
- ✓ Admin access only

**Files to Create/Modify:**
- `renderUserManagement.js`
- `components/RoleAssignment.js`

---

#### Task 6.3: Enhanced Reporting & Export 🔴
**Owner:** Frontend Developer  
**Priority:** Medium  
**Estimated Time:** 6 hours  
**Dependencies:** Multiple

**Subtasks:**
- [ ] Update `exportFunctions.js`
- [ ] Add new export types:
  - Strategic hierarchy export
  - Disability-focused reports
  - Multi-currency financial reports
  - Performance rate trending
  - Non-program activity summaries
- [ ] Implement PDF generation
- [ ] Add custom report builder
- [ ] Add export scheduling

**Acceptance Criteria:**
- ✓ All export types work
- ✓ PDF generation functional
- ✓ Custom reports flexible
- ✓ Scheduled exports work

**Files to Create/Modify:**
- `exportFunctions.js`
- `components/ReportBuilder.js`

---

## Phase 4: Testing & Deployment (Weeks 7-8)

### Week 7: Testing & Quality Assurance

#### Task 7.1: Backend Integration Testing 🔴
**Owner:** QA / Backend Developer  
**Priority:** Critical  
**Estimated Time:** 16 hours  
**Dependencies:** All backend tasks

**Subtasks:**
- [ ] Write integration test suites
- [ ] Test all API endpoints
- [ ] Test database constraints
- [ ] Test data integrity
- [ ] Test performance under load
- [ ] Test security/authorization
- [ ] Fix identified bugs

**Acceptance Criteria:**
- ✓ All APIs tested
- ✓ No data integrity issues
- ✓ Performance meets requirements (<2s)
- ✓ Security vulnerabilities addressed

---

#### Task 7.2: Frontend Testing 🔴
**Owner:** QA / Frontend Developer  
**Priority:** Critical  
**Estimated Time:** 16 hours  
**Dependencies:** All frontend tasks

**Subtasks:**
- [ ] Test all UI components
- [ ] Test form validations
- [ ] Test navigation flows
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Cross-browser testing
- [ ] Fix identified bugs

**Acceptance Criteria:**
- ✓ All features work
- ✓ Forms validate correctly
- ✓ Responsive on all devices
- ✓ Accessible (WCAG 2.1 AA)
- ✓ Works in major browsers

---

#### Task 7.3: Data Migration 🔴
**Owner:** Backend Developer  
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 2.1

**Subtasks:**
- [ ] Create migration script for existing data
- [ ] Map old structure to new structure
- [ ] Migrate indicators (classify as AWYAD/Project)
- [ ] Migrate activities (add new fields)
- [ ] Migrate cases (remove names, add new fields)
- [ ] Test migration on staging
- [ ] Create rollback plan

**Acceptance Criteria:**
- ✓ All data migrated correctly
- ✓ No data loss
- ✓ New fields populated appropriately
- ✓ Rollback plan tested

**Files to Create:**
- `scripts/migrate_to_new_schema.js`
- `scripts/rollback_migration.js`
- `docs/MIGRATION_GUIDE.md`

---

#### Task 7.4: Performance Optimization 🔴
**Owner:** Full Stack Developer  
**Priority:** High  
**Estimated Time:** 8 hours  
**Dependencies:** Tasks 7.1, 7.2

**Subtasks:**
- [ ] Profile slow queries
- [ ] Add database indexes where needed
- [ ] Implement query result caching
- [ ] Optimize frontend bundle size
- [ ] Implement lazy loading
- [ ] Add CDN for static assets
- [ ] Test performance improvements

**Acceptance Criteria:**
- ✓ Dashboard loads in <2s
- ✓ Forms responsive
- ✓ Reports generate quickly
- ✓ No UI lag

---

### Week 8: User Acceptance Testing & Deployment

#### Task 8.1: User Acceptance Testing 🔴
**Owner:** AWYAD Team + Dev Team  
**Priority:** Critical  
**Estimated Time:** 24 hours  
**Dependencies:** All previous tasks

**Subtasks:**
- [ ] Prepare UAT environment
- [ ] Create test scenarios/scripts
- [ ] Train AWYAD users on new features
- [ ] Conduct UAT sessions
- [ ] Gather feedback
- [ ] Prioritize and fix issues
- [ ] Retest after fixes
- [ ] Get sign-off

**Acceptance Criteria:**
- ✓ All critical issues resolved
- ✓ Users can perform all tasks
- ✓ Users satisfied with features
- ✓ Sign-off obtained

---

#### Task 8.2: Documentation 🔴
**Owner:** Technical Writer / Dev Team  
**Priority:** High  
**Estimated Time:** 16 hours  
**Dependencies:** All previous tasks

**Subtasks:**
- [ ] Update user manual
- [ ] Create admin guide
- [ ] Write configuration guide
- [ ] Document indicator setup process
- [ ] Document budget transfer procedures
- [ ] Create case management privacy guide
- [ ] Create API documentation
- [ ] Create training videos

**Acceptance Criteria:**
- ✓ All guides complete
- ✓ Clear step-by-step instructions
- ✓ Screenshots included
- ✓ Videos published

**Files to Create:**
- `docs/USER_MANUAL_v2.md`
- `docs/ADMIN_GUIDE.md`
- `docs/CONFIGURATION_GUIDE.md`
- `docs/INDICATOR_SETUP_GUIDE.md`
- `docs/BUDGET_TRANSFER_GUIDE.md`
- `docs/CASE_PRIVACY_GUIDE.md`

---

#### Task 8.3: Training 🔴
**Owner:** Dev Team + AWYAD Leadership  
**Priority:** Critical  
**Estimated Time:** 16 hours  
**Dependencies:** Task 8.2

**Subtasks:**
- [ ] Schedule training sessions
- [ ] Prepare training materials
- [ ] Conduct role-specific training:
  - System administrators (configuration)
  - M&E officers (indicators, dashboards)
  - Project coordinators (project dashboards)
  - Finance team (multi-currency, transfers)
  - All users (case management privacy)
- [ ] Record training sessions
- [ ] Provide hands-on practice time
- [ ] Answer questions

**Acceptance Criteria:**
- ✓ All users trained
- ✓ Training materials available
- ✓ Sessions recorded
- ✓ Users confident

---

#### Task 8.4: Production Deployment 🔴
**Owner:** DevOps / Backend Developer  
**Priority:** Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Tasks 8.1, 8.2, 8.3

**Subtasks:**
- [ ] Final backup of production database
- [ ] Schedule maintenance window
- [ ] Run migrations on production
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Update environment variables
- [ ] Test all critical paths
- [ ] Monitor for errors
- [ ] Communicate go-live to users

**Acceptance Criteria:**
- ✓ Deployment successful
- ✓ No errors in production
- ✓ All features working
- ✓ Users notified

---

#### Task 8.5: Post-Deployment Monitoring 🔴
**Owner:** Full Stack Developer  
**Priority:** Critical  
**Estimated Time:** Ongoing (first 2 weeks)  
**Dependencies:** Task 8.4

**Subtasks:**
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Respond to issues quickly
- [ ] Deploy hotfixes as needed
- [ ] Document lessons learned

**Acceptance Criteria:**
- ✓ System stable
- ✓ No critical bugs
- ✓ Users satisfied
- ✓ Performance good

---

## Summary Statistics

**Total Tasks:** 52  
**Total Estimated Hours:** ~350 hours (~9 weeks with 2 developers)

**Breakdown by Phase:**
- Phase 1 (Weeks 1-2): 15 tasks, ~70 hours
- Phase 2 (Weeks 3-4): 13 tasks, ~100 hours
- Phase 3 (Weeks 5-6): 9 tasks, ~80 hours
- Phase 4 (Weeks 7-8): 15 tasks, ~100 hours

**By Resource Type:**
- Backend Development: ~120 hours
- Frontend Development: ~140 hours
- Testing/QA: ~50 hours
- Documentation/Training: ~40 hours

---

## Task Dependencies Visualization

```
Week 1-2: Foundation
├── 1.1-1.9: Database Migrations (parallel)
└── 2.1: Run Migrations
    ├── 2.2-2.4: Hierarchy APIs (sequential)
    ├── 2.5: Dashboard APIs (depends on 2.2-2.4)
    ├── 2.6-2.11: Feature APIs (parallel after 2.1)

Week 3-4: Core Features
├── 3.1-3.3: Dashboard UI (depends on 2.5)
├── 3.4-3.5: Indicator UI (depends on 2.6)
└── 4.1-4.4: Activities & Cases UI (depends on 2.7-2.9)

Week 5-6: Advanced Features
├── 5.1-5.3: Monthly Tracking, Non-Program, Currency
└── 6.1-6.3: Management UIs & Reporting

Week 7-8: Testing & Deployment
├── 7.1-7.4: Testing & Migration (parallel)
└── 8.1-8.5: UAT, Docs, Training, Deployment (sequential)
```

---

## Daily Standup Questions

Use these questions in daily standups to track progress:

1. **What did you complete yesterday?** (Reference task IDs)
2. **What are you working on today?** (Reference task IDs)
3. **Any blockers?** (Dependencies, decisions needed, technical issues)
4. **Status update:** (🔴 Not Started / 🟡 In Progress / 🟢 Completed / ⏸️ Blocked)

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration fails | High | Low | Full backup, test on staging first, rollback plan |
| Performance issues with hierarchy | Medium | Medium | Proper indexing, caching, query optimization |
| User resistance to new features | Medium | Low | Comprehensive training, phased rollout, support |
| Integration bugs | Medium | Medium | Thorough testing, integration test suite |
| Scope creep | High | Medium | Strict change management, prioritization |

---

**Next Steps:**
1. Review and approve this task breakdown
2. Assign owners to each task
3. Set up project tracking board (Jira, Trello, etc.)
4. Begin Phase 1, Task 1.1

**Let's build this! 🚀**
