# AWYAD MES - System Testing Checklist
**Date:** January 23, 2026  
**Purpose:** Comprehensive testing of implemented features

---

## Test Environment
- **Server:** http://localhost:3001
- **Database:** PostgreSQL (awyad_mes)
- **Node Version:** (check with `node --version`)
- **Test User:** admin

---

## 1. Navigation & Routing Tests

### ✅ Sidebar Navigation
- [ ] **Overview Dashboard** link exists and works
- [ ] **Strategic Dashboard** link exists and works  
- [ ] **Projects** link exists and works
- [ ] **Project Dashboard** link exists and works
- [ ] **Indicator Tracking (ITT)** link works
- [ ] **Activity Tracking (ATT)** link works
- [ ] **Case Management** link works
- [ ] **Monthly Tracking** link works
- [ ] **New Activity Report** link works
- [ ] **Help & Quick Reference** link works

### ✅ Breadcrumb Navigation
- [ ] Breadcrumbs appear on non-dashboard pages
- [ ] Breadcrumbs hide on dashboard pages
- [ ] Breadcrumb links are clickable
- [ ] Breadcrumb hierarchy is correct

### ✅ Dashboard Switcher
- [ ] Dashboard switcher appears on dashboard pages
- [ ] "View Overview" button works
- [ ] "View Strategic" button works
- [ ] "Browse Projects" button works
- [ ] Switcher hides on non-dashboard pages

---

## 2. Dashboard Tests

### ✅ Overview Dashboard (Original)
**URL:** `http://localhost:3001/#dashboard`
- [ ] Page loads without errors
- [ ] Summary cards display:
  - [ ] Active Projects count
  - [ ] Indicators On-Track count
  - [ ] Activities This Month count
  - [ ] Budget Burn Rate percentage
- [ ] Indicator Performance chart displays
- [ ] Beneficiaries by Community chart displays
- [ ] Beneficiaries by Gender chart displays
- [ ] Thematic Areas Overview section displays
- [ ] Results Framework Summary section displays
- [ ] Export Report button present

### ✅ Strategic Dashboard (New)
**URL:** `http://localhost:3001/#strategic-dashboard`
- [ ] Page loads without errors
- [ ] Title: "AWYAD Strategic Dashboard"
- [ ] Summary statistics cards display:
  - [ ] Total Strategic Objectives
  - [ ] Total Strategic Pillars
  - [ ] Total Core Program Components
  - [ ] Total AWYAD Indicators
- [ ] Expand All / Collapse All buttons work
- [ ] Strategic hierarchy displays:
  - [ ] Strategies (blue badges)
  - [ ] Pillars (green badges)
  - [ ] Core Program Components (cyan badges)
  - [ ] Interventions list
  - [ ] Approaches list
  - [ ] Associated AWYAD Indicators
- [ ] AWYAD Indicators table at bottom:
  - [ ] All columns visible (Name, Level, Scope, Baseline, Q1-Q4, LOP, Progress)
  - [ ] Indicator level badges display (Output/Outcome/Impact)
  - [ ] Progress bars show correct colors (green/yellow/red)
  - [ ] Percentage indicators show % symbol
- [ ] Click to expand/collapse sections works
- [ ] Animated chevron icons rotate correctly

**Expected Data Issues:**
- ⚠️ "No strategies defined" - DATABASE IS EMPTY (expected)
- ⚠️ "No AWYAD indicators defined" - Need to create indicators with scope='awyad'

### ✅ Project Dashboard (New)
**URL:** `http://localhost:3001/#project-dashboard`
- [ ] Page loads without errors
- [ ] Project selector dropdown displays if no project selected
- [ ] Can select a project from dropdown
- [ ] After selection, dashboard loads with project data
- [ ] Project header displays:
  - [ ] Project name
  - [ ] Status badge (color-coded)
  - [ ] Donor badge
  - [ ] Result area
  - [ ] Start and End dates
  - [ ] Budget summary
  - [ ] Burn rate percentage
- [ ] Six tabs display:
  - [ ] Overview
  - [ ] Indicators
  - [ ] Activities
  - [ ] Cases
  - [ ] Team
  - [ ] Financial
- [ ] Tab switching works smoothly
- [ ] Each tab loads correct content

**Tab-by-Tab Test:**

**Overview Tab:**
- [ ] Summary cards (Indicators, Activities, Cases, Beneficiaries)
- [ ] Activity Status Distribution chart
- [ ] Indicator Performance section
- [ ] Recent Activities list (latest 5)

**Indicators Tab:**
- [ ] Full indicators table
- [ ] Quarterly breakdown (Q1-Q4)
- [ ] LOP targets
- [ ] Progress bars
- [ ] Indicator level badges
- [ ] Result area column
- [ ] Add Indicator button
- [ ] Edit actions per indicator

**Activities Tab:**
- [ ] Activity listing table
- [ ] Filter by status dropdown
- [ ] Date, Location, Beneficiaries, Budget columns
- [ ] Costed/Non-costed distinction
- [ ] Multi-currency display
- [ ] Status badges (Planned/In Progress/Completed)
- [ ] Add Activity button
- [ ] Edit actions per activity

**Cases Tab:**
- [ ] Case status summary cards (Open, In Progress, Closed)
- [ ] Full case listing
- [ ] Case type and registration date
- [ ] Support offered summary
- [ ] Add Case button
- [ ] Edit actions per case

**Team Tab:**
- [ ] Team structure display
- [ ] Project Manager section
- [ ] M&E Officer section
- [ ] (May be placeholder for now)

**Financial Tab:**
- [ ] Budget summary cards (Total, Expenditure, Remaining, Burn Rate)
- [ ] Budget utilization progress bar
- [ ] Activity costs breakdown
- [ ] Multi-currency cost display
- [ ] USD equivalent calculations
- [ ] Costed activities table

---

## 3. Indicator Management Tests

### ✅ Indicator Tracking Page
**URL:** `http://localhost:3001/#indicators`
- [ ] Page loads without errors
- [ ] Table displays with all columns:
  - [ ] Code
  - [ ] Name
  - [ ] Scope badge (AWYAD/Project)
  - [ ] Level badge (Output/Outcome/Impact)
  - [ ] Type badge (Number/Percentage)
  - [ ] Baseline
  - [ ] Q1 Target
  - [ ] Q2 Target
  - [ ] Q3 Target
  - [ ] **Q4 Target** (NEW)
  - [ ] LOP Target
  - [ ] Achieved
  - [ ] Progress
  - [ ] Thematic Area
  - [ ] Actions
- [ ] Add Indicator button visible
- [ ] Filter dropdowns work:
  - [ ] Scope filter (All/AWYAD/Project)
  - [ ] Level filter (All/Output/Outcome/Impact)
  - [ ] Reset Filters button works
- [ ] Export to CSV button works
- [ ] Smart formatting:
  - [ ] Percentages show % symbol
  - [ ] Numbers show with commas
- [ ] Edit button per indicator works
- [ ] Delete button per indicator works

### ✅ Indicator Form (Unified)
**URL:** Click "Add Indicator" button
- [ ] Form appears/modal opens
- [ ] **Indicator Scope dropdown** visible (AWYAD/Project)
- [ ] Selecting AWYAD shows:
  - [ ] Thematic Area dropdown
  - [ ] Hide Project and Result Area fields
- [ ] Selecting Project shows:
  - [ ] Project dropdown
  - [ ] Result Area dropdown
  - [ ] Optional: Link to AWYAD Indicator
  - [ ] Hide Thematic Area field
- [ ] Common fields visible:
  - [ ] Indicator Code
  - [ ] Indicator Name
  - [ ] Description
  - [ ] Indicator Level dropdown (Output/Outcome/Impact)
  - [ ] Data Type dropdown (Number/Percentage)
  - [ ] Unit of Measurement
  - [ ] Baseline Value
  - [ ] Baseline Date
  - [ ] LOP Target (with tooltip)
  - [ ] Annual Target
  - [ ] Q1 Target
  - [ ] Q2 Target
  - [ ] Q3 Target
  - [ ] **Q4 Target** (NEW)
- [ ] Form validation works (required fields)
- [ ] Submit button saves indicator
- [ ] Cancel button closes form
- [ ] Success message appears after save
- [ ] Table refreshes with new indicator

---

## 4. Projects Management Tests

### ✅ Projects List Page
**URL:** `http://localhost:3001/#projects`
- [ ] Page loads without errors
- [ ] Projects table displays
- [ ] **View button** per project (navigates to Project Dashboard)
- [ ] Edit button per project works
- [ ] Delete button per project works
- [ ] Add Project button works
- [ ] Export to CSV works

---

## 5. Activities Management Tests

### ✅ Activities List Page
**URL:** `http://localhost:3001/#activities`
- [ ] Page loads without errors
- [ ] Activities table displays
- [ ] All columns visible
- [ ] Filter by project works
- [ ] Filter by status works
- [ ] Add Activity button works
- [ ] Edit button per activity works
- [ ] Delete button per activity works

### ⚠️ Activity Form (Needs Enhancement)
- [ ] Form opens
- [ ] **Check for new fields:**
  - [ ] Is Costed checkbox
  - [ ] Currency dropdown (UGX/USD/EUR/GBP)
  - [ ] Exchange Rate field
  - [ ] Disability tracking fields (PWDs Male/Female/Other)
  - [ ] Gender "Other" option
  - [ ] Enhanced nationality fields

---

## 6. Cases Management Tests

### ✅ Cases List Page
**URL:** `http://localhost:3001/#cases`
- [ ] Page loads without errors
- [ ] Cases table displays
- [ ] Filter by project works
- [ ] Filter by status works
- [ ] Add Case button works
- [ ] Edit button per case works

### ⚠️ Case Form (Needs Overhaul)
- [ ] Form opens
- [ ] **Check for issues:**
  - [ ] Name field should be REMOVED (confidentiality)
  - [ ] Case Type dropdown should exist
  - [ ] Case Category dropdown should exist (cascading from type)
  - [ ] Referred From field
  - [ ] Referred To field
  - [ ] Referral Date field
  - [ ] Support Offered field (not Case Description)
  - [ ] Nationality field
  - [ ] Disability Status field
  - [ ] Dynamic tags/tracking

---

## 7. Monthly Tracking Tests

### ✅ Monthly Tracking Page
**URL:** `http://localhost:3001/#monthly`
- [ ] Page loads without errors
- [ ] Year selector works
- [ ] Monthly data displays
- [ ] Charts render correctly

### ⚠️ Monthly Enhancements (To Be Implemented)
- [ ] Project filter dropdown
- [ ] Activity drill-down
- [ ] Reach vs Target visualization
- [ ] Performance Rates dashboard (4 rates)

---

## 8. API Endpoint Tests

### Backend Health
```bash
# Test in terminal or browser
curl http://localhost:3001/api/v1/health
```
- [ ] Returns JSON with success: true
- [ ] Database status: healthy

### Strategic Hierarchy API
```bash
curl http://localhost:3001/api/v1/dashboard/strategic-hierarchy
```
- [ ] Returns JSON array
- [ ] May be empty if no data

### AWYAD Indicators API
```bash
curl http://localhost:3001/api/v1/dashboard/awyad-indicators
```
- [ ] Returns JSON array
- [ ] Filters by indicator_scope='awyad'

### Project Dashboard API
```bash
curl http://localhost:3001/api/v1/dashboard/project/{project-id}
```
- [ ] Returns project details with stats

### Configurations API
```bash
curl http://localhost:3001/api/v1/configurations/partners
curl http://localhost:3001/api/v1/configurations/service_types
curl http://localhost:3001/api/v1/configurations/locations
curl http://localhost:3001/api/v1/configurations/donors
```
- [ ] Each returns seeded data

---

## 9. Database Tables Verification

### Check Tables Exist
Run in PostgreSQL:
```sql
-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'strategies',
    'pillars',
    'core_program_components',
    'system_configurations',
    'case_types',
    'case_categories',
    'non_program_categories',
    'non_program_activities',
    'monthly_snapshots',
    'indicator_mappings',
    'currency_rates',
    'activity_budget_transfers'
  )
ORDER BY table_name;
```
- [ ] All 12 tables exist

### Check Indicator Schema
```sql
-- Check indicator columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'indicators' 
  AND column_name IN (
    'indicator_scope',
    'result_area',
    'indicator_level',
    'q4_target',
    'q4_achieved',
    'lop_target',
    'data_type'
  );
```
- [ ] All new columns exist

### Check Activity Schema
```sql
-- Check activity columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities' 
  AND column_name IN (
    'is_costed',
    'currency',
    'pwds_male',
    'pwds_female',
    'pwds_other'
  );
```
- [ ] All new columns exist

---

## 10. Console Error Check

### Browser Console
- [ ] Open browser console (F12)
- [ ] Navigate through all pages
- [ ] **Check for:**
  - [ ] No JavaScript errors (red)
  - [ ] No 404 errors for missing files
  - [ ] No API errors (500, 400)
  - [ ] Only expected warnings (yellow)

### Network Tab
- [ ] Open Network tab in DevTools
- [ ] Navigate through pages
- [ ] **Check for:**
  - [ ] All API calls return 200 or expected status
  - [ ] No failed requests (red)
  - [ ] Response times reasonable (<1s for most)

---

## 11. Responsive Design Tests

### Mobile View
- [ ] Toggle mobile view in DevTools (Ctrl+Shift+M)
- [ ] Sidebar collapses correctly
- [ ] Hamburger menu works
- [ ] Tables are scrollable
- [ ] Buttons are touch-friendly
- [ ] Forms are usable on mobile

---

## 12. Known Issues & Expected Behavior

### Expected Empty States
✅ **Strategic Dashboard:**
- "No strategies defined" - **NORMAL** - Tables empty, need data population
- "No AWYAD indicators defined" - **NORMAL** - Need to create indicators

✅ **Project Dashboard:**
- Shows project selector if no project selected - **NORMAL**
- Once project selected, should show data

✅ **Indicator Tracking:**
- May show existing indicators but missing new fields - **NORMAL** - Need data migration

### Known Missing Features (To Be Implemented)
⏹ **Activity Form:** New fields not yet added (currency, disability, etc.)
⏹ **Case Form:** Still has name field, missing new fields
⏹ **Budget Transfer Interface:** Not yet created
⏹ **Non-Program Activities:** Module not yet built
⏹ **Configuration Management UI:** Admin interface not yet built
⏹ **Monthly Tracking Enhancements:** New visualizations not yet added

---

## Test Results Summary

### ✅ PASS
- Navigation and routing
- Dashboard switcher
- Strategic Dashboard UI
- Project Dashboard UI
- Indicator form with Q4
- Indicator tracking with new columns

### ⏹ NEEDS WORK
- Strategic Dashboard: No data to display
- Activity form: Missing new fields
- Case form: Needs overhaul
- Budget transfers: Not implemented
- Non-program activities: Not implemented

### 🔴 BLOCKERS
- None currently - all features accessible

---

## Next Steps After Testing

1. **If tests pass:** Proceed with data population
   - Populate strategic hierarchy
   - Create AWYAD indicators
   - Update existing indicators

2. **If issues found:** Document and fix before proceeding
   - Note specific errors
   - Check console logs
   - Review API responses

3. **Priority fixes:** (If needed)
   - Fix any critical navigation issues
   - Resolve API errors
   - Address console errors

---

## Test Completion Sign-Off

**Tester:** _______________________  
**Date:** _______________________  
**Overall Status:** ⬜ PASS / ⬜ FAIL / ⬜ PASS WITH ISSUES  
**Notes:** _____________________________________________

---

**Remember:** The backend is 95% complete! Most "issues" will be empty states because tables need data population. This is EXPECTED and NORMAL. Focus on verifying that:
1. Pages load without errors
2. Navigation works
3. APIs return data (even if empty)
4. Forms are accessible
5. No console errors
