# AWYAD MES — Complete User Test Guide
**System:** AWYAD Monitoring, Evaluation & Learning System  
**Version:** 2.0.0  
**Test Date:** March 2026  
**Estimated Duration:** 90–120 minutes (full run) | 30 minutes (quick run)  

---

## 📋 Before You Start

### 1. Start the Server
Open a terminal in the project folder and run:
```bash
npm run dev
```
Wait until you see: `Server running on port 3001`

### 2. Open Your Browser
Use **Chrome** or **Edge** (recommended).  
Navigate to: **http://localhost:3001**

### 3. Test Credentials

| Role | Username | Password | What they can do |
|------|----------|----------|-----------------|
| **Admin** | `admin` | `Admin123!` | Everything |
| **Manager** | *(create during User Mgmt test)* | `Manager123!` | View + Edit data, Reports |
| **Data Entry** | *(create during User Mgmt test)* | `Entry123!` | Enter activities |
| **Viewer** | *(create during User Mgmt test)* | `Viewer123!` | Read only |

---

## 🗺️ System Modules at a Glance

```
AWYAD MES
├── 🏠 Dashboard        → KPIs, charts, results framework overview
├── 📁 Projects         → Project portfolio, budgets, burn rates
├── 📊 Indicators (ITT) → Targets, achievements, quarterly tracking
├── ✅ Activities (ATT)  → Activity reports, beneficiary disaggregation
├── 💼 Case Management  → GBV/CP individual cases
├── 📅 Monthly Tracking → Calendar view, quarterly summaries
├── 📝 New Activity Form → Data entry form
├── 👥 User Management  → Accounts, roles, permissions
└── 📋 Reports/Exports  → CSV/Excel downloads
```

---

## ✅ TEST SUITE 1 — Authentication

### TEST 1.1: Load Login Page
**URL:** http://localhost:3001/public/login.html  
**Action:** Open URL in browser  
**Pass if:**
- Login form is visible
- AWYAD logo/branding shows
- No console errors (`F12 → Console`)

---

### TEST 1.2: Login with Correct Credentials
**Action:** Enter username `admin` and password `Admin123!`, then click **Login**  
**Pass if:**
- Redirected to Dashboard
- Username shows in header/sidebar
- Sidebar navigation is visible

---

### TEST 1.3: Login with Wrong Password
**Action:** Enter username `admin` and password `wrongpassword`, then click **Login**  
**Pass if:**
- Error message appears ("Invalid credentials" or similar)
- Page stays on login — no redirect
- Error text shown in red

---

### TEST 1.4: Session Persistence
**Action:** While logged in, press **F5** to refresh the browser  
**Pass if:**
- Stays on Dashboard (NOT redirected to login)
- User session is maintained

---

### TEST 1.5: Logout
**Action:** Click the logout button in the header or user menu  
**Pass if:**
- Redirected to login page
- Accessing http://localhost:3001 redirects back to login (not Dashboard)

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 2 — Dashboard

### TEST 2.1: KPI Summary Cards
**Navigation:** Click **Dashboard** in the sidebar  
**Pass if:**  All 4 summary cards appear:
- ✅ Active Projects (a number, e.g. 3)
- ✅ Indicators On-Track (e.g. 5 of 22)
- ✅ Activities This Month (e.g. 10)
- ✅ Budget Burn Rate (e.g. 51.2%)

---

### TEST 2.2: Thematic Areas Section
**Pass if:**
- "Thematic Areas" / "Results Framework" section visible
- Progress bars shown for each thematic area
- Color coding present (green/yellow/red)

---

### TEST 2.3: Charts / Visualizations
**Pass if:**
- At least one chart renders (Indicator Achievement, Beneficiary Trends, or Gender Distribution)
- No blank/broken chart areas

---

### TEST 2.4: Dashboard Switcher
**Action:** If buttons exist for "Strategic Dashboard" / "Project Dashboard", click each one  
**Pass if:**
- Content changes when switching between views
- Active button highlights
- No errors in console

---

### TEST 2.5: Performance
**Pass if:**
- Dashboard fully loads in under 5 seconds on localhost
- No "spinning forever" states

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 3 — Projects Module

### TEST 3.1: View Project List
**Navigation:** Click **Projects** in the sidebar  
**Pass if:**
- Project table/cards display
- Columns present: Name, Status, Budget, Expenditure, Burn Rate, Thematic Area
- At least 2 projects shown (AWYAD STEPS / GBV Response / Child Protection)

---

### TEST 3.2: Burn Rate Color Coding
**Pass if:**
- Burn rates < 60% show in **green**
- Burn rates 60–80% show in **yellow**
- Burn rates > 80% show in **red**

---

### TEST 3.3: Create a New Project
**Navigation:** Projects → Click **"Create Project"** or **"+ New Project"**  

Use this test data:
```
Project Name:    UNHCR Women Empowerment Initiative
Donor:           UNHCR
Description:     Strengthen protection services for women and girls in Nakivale settlement
Thematic Area:   RESULT 2 — Local partners effectively respond to GBV and protection risks
                 (select from the dropdown)
Start Date:      2026-04-01
End Date:        2027-03-31
Budget:          250000
Status:          Planning
```

> **Note:** The form does NOT have fields for Project Code or Country — only the fields above are present.  
> **Thematic Area** is a required dropdown — it must be selected before the form will submit.

**Pass if:**
- Form accepts the data
- Success confirmation appears
- New project appears in the project list

---

### TEST 3.4: Edit Project
**Action:** Find the project you just created ("UNHCR Women Empowerment Initiative") → Click **Edit**  
Change Budget from `250000` to `300000` and Status from `Planning` to `Active`  
**Pass if:**
- Changes saved successfully
- Updated values show in project detail

---

### TEST 3.5: View Project Details
**Action:** Click the project name to open its detail page  
**Pass if:**
- Overview section shows all project fields
- Budget vs Expenditure visible
- Related Indicators tab (or section) is accessible
- Related Activities tab (or section) is accessible

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 4 — Indicator Tracking (ITT)

### TEST 4.1: View Indicator List
**Navigation:** Click **Indicators** (ITT) in the sidebar  
**Pass if:**
- Summary cards show: Total, On Track, At Risk, Off Track
- Indicators grouped by Thematic Area
- Table shows columns: Code, Name, LOP Target, Annual Target, Q1–Q4, Achieved, % Achievement

---

### TEST 4.2: 2-Row Header Table
**Pass if:**
- Header row 1: LOP | Annual | Q1 | Q2 | Q3 | Q4
- Header row 2: Target column labels
- Data rows align correctly

---

### TEST 4.3: Progress Bars and Color Coding
**Pass if:**
- Each indicator shows a progress bar
- Bars color-coded: Green (≥70%), Yellow (40–69%), Red (<40%)
- % Achievement figure visible

---

### TEST 4.4: Variance Calculation
**Pass if:**
- Variance column shows: Achieved − Target
- Positive variance shows in **green**
- Negative variance shows in **red**

---

### TEST 4.5: Create New Indicator
**Navigation:** Indicators → Click **"+ Add Indicator"** or **"New Indicator"**  

Use this test data:
```
Indicator Name:   Number of HH with access to clean water
Indicator Code:   IND-WATER-TEST
Type:             Output
Unit:             Households
Baseline Value:   100
LOP Target:       900
Annual Target:    400
Q1 Target:        80
Q2 Target:        120
Q3 Target:        100
Q4 Target:        100
Linked Project:   Water Supply Infrastructure Improvement
```

**Pass if:**
- Indicator saved successfully
- Appears in indicator list
- Progress shows at 0% or baseline

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 5 — Activity Tracking (ATT)

### TEST 5.1: View Activity List
**Navigation:** Click **Activities** (ATT) in the sidebar  
**Pass if:**
- Summary cards show: Total, Completed, Pending, Total Budget, Burn Rate
- Activity table displays with columns: Code, Title, Date, Location, Total Beneficiaries, Budget, Status

---

### TEST 5.2: Beneficiary Disaggregation Display
**Action:** Click on any existing activity to open its details  
**Pass if:**
- Disaggregation breakdown visible:
  - Refugee vs Host Community
  - Male vs Female
  - Age groups: 0–4, 5–17, 18–49, 50+
  - Nationality: Sudanese, Congolese, South Sudanese, Others

---

### TEST 5.3: Create a New Activity Report
**Navigation:** Click **"+ New Activity"** or **"New Activity Report"** in the sidebar  

Use this test data:
```
Activity Title:  Community Mobilization Workshop – Phase 1
Activity Code:   ACT-WSII-TEST-001
Linked Project:  Water Supply Infrastructure Improvement
Date:            2026-04-15
Location:        Sana'a, Bani Matar
Budget:          15,000 USD
Expenditure:     12,500 USD
Status:          Completed

Refugee Beneficiaries:
  Male 0-4:    12    Female 0-4:   10
  Male 5-17:   25    Female 5-17:  22
  Male 18-49:  18    Female 18-49: 20
  Male 50+:    3     Female 50+:   5
  (Subtotal Male: 58, Female: 57, Refugee Total: 115)

Host Community Beneficiaries:
  Male 0-4:    8     Female 0-4:   9
  Male 5-17:   14    Female 5-17:  16
  Male 18-49:  12    Female 18-49: 15
  Male 50+:    2     Female 50+:   4
  (Subtotal Male: 36, Female: 44, Host Total: 80)

Grand Total: 195

Nationality (should match Refugee total = 115):
  Sudanese:         60
  Congolese:        30
  South Sudanese:   15
  Others:           10
  Total:            115 ✓
```

**Pass if:**
- Grand total auto-calculates to 195
- Nationality total (115) matches refugee total (115)
- Activity saved successfully
- Appears in activity list

---

### TEST 5.4: Auto-Calculation Validation
**Action:** While filling the form, deliberately enter a nationality total that does NOT match the refugee total  
**Pass if:**
- Validation error shown ("Nationality total must match refugee beneficiaries")
- Form does not submit until corrected

---

### TEST 5.5: Export Activities to CSV/Excel
**Action:** Click the **Export** button in the Activities module  
**Pass if:**
- File downloads to your computer
- File contains all activity columns including disaggregation

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 6 — Case Management

### TEST 6.1: View Case List
**Navigation:** Click **Cases** in the sidebar  
**Pass if:**
- Active case count shown in summary
- Case table displays columns: Case ID, Type, Beneficiary, Case Worker, Status, Follow-up Date
- Overdue follow-up dates highlighted in **red**

---

### TEST 6.2: Create a New Case
**Navigation:** Cases → Click **"+ New Case"**  

Use this test data:
```
Case Type:         Psychosocial Support
Date Opened:       2026-04-01
Beneficiary:
  Gender:          Female
  Age:             28
  Nationality:     Sudanese
  Location:        Sana'a
Case Worker:       (select any available)
Services Needed:   Psychosocial Support, Legal Assistance
Confidential:      Yes
Follow-up Date:    2026-04-22
```

**Pass if:**
- Case saved successfully
- Case ID generated automatically
- Appears in case list
- Confidentiality warning shown

---

### TEST 6.3: Follow-up Alerting
**Action:** Set a follow-up date to **today's date** (or yesterday)  
**Pass if:**
- Case row highlighted in **red** or orange in the case list
- Alert/badge visible for overdue follow-up

---

### TEST 6.4: Close a Case
**Action:** Open a case → Change status to **Closed** → Save  
**Pass if:**
- Case moves from Active to Closed cases
- Case closure date recorded
- Closure rate statistics update

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 7 — Monthly Tracking

### TEST 7.1: Calendar View
**Navigation:** Click **Monthly Tracking** in the sidebar  
**Pass if:**
- Calendar grid shown for current month
- Activities appear on correct dates
- Month navigation (Previous/Next) works

---

### TEST 7.2: Year Switcher
**Action:** If year tabs exist (2024, 2025, 2026), click each one  
**Pass if:**
- Data updates to show activities for selected year
- YTD summaries update accordingly

---

### TEST 7.3: Quarterly Summaries
**Pass if:**
- Q1–Q4 sections show aggregated beneficiary totals
- Budget totals per quarter shown
- Data matches individual activity records

---

### TEST 7.4: Export Monthly Report
**Action:** Click **Export** in Monthly Tracking  
**Pass if:**
- File downloads successfully
- Report contains month-by-month breakdown

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 8 — User Management

> **Note:** Log in as **Admin** for this entire section.

### TEST 8.1: View User List
**Navigation:** Click **Users** in the sidebar (Admin only)  
**Pass if:**
- List of all users shown
- Columns: Username, Email, Role, Status, Last Login
- Admin user visible

---

### TEST 8.2: Create a Manager Account
**Navigation:** Users → Click **"+ New User"**  

Use this test data:
```
First Name:  Sarah
Last Name:   Hassan
Username:    manager1
Email:       manager@awyad.org
Password:    Manager123!
Role:        Manager
Status:      Active
```

**Pass if:**
- User created successfully
- Appears in user list with "Manager" role badge

---

### TEST 8.3: Create a Data Entry Account
```
Username: dataentry1
Email:    entry@awyad.org
Password: Entry123!
Role:     Data Entry
```
**Pass if:** User created, correct role assigned

---

### TEST 8.4: Create a Viewer Account
```
Username: viewer1
Email:    viewer@awyad.org
Password: Viewer123!
Role:     Viewer
```
**Pass if:** User created, correct role assigned

---

### TEST 8.5: Role-Based Access Verification

| Action | Admin | Manager | Data Entry | Viewer |
|--------|-------|---------|------------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create Project | ✅ | ✅ | ❌ | ❌ |
| Create Activity | ✅ | ✅ | ✅ | ❌ |
| Create Case | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ |

**Action:** Log in as `viewer1` and verify:
- No "Create" or "Edit" buttons visible
- No "Users" menu item in sidebar
- Can view all data modules

**Action:** Log in as `dataentry1` and verify:
- Can access New Activity form
- Cannot access User Management
- Cannot create/edit Projects

**Pass if:** All role restrictions work as described above

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 9 — Reports and Exports

### TEST 9.1: Dashboard Export
**Navigation:** Dashboard → Click **Export** or **Download**  
**Pass if:**
- CSV/Excel file downloads
- File includes KPI summary, thematic area data

---

### TEST 9.2: Indicator Report Export
**Navigation:** Indicators (ITT) → Click **Export**  
**Pass if:**
- File includes all indicators with: Code, Name, LOP Target, Annual Target, Q1–Q4, Achieved, % Achievement

---

### TEST 9.3: Activity Report Export
**Navigation:** Activities (ATT) → Click **Export**  
**Pass if:**
- File includes all activities with full disaggregation columns
- Beneficiary, nationality, and budget data present

---

### TEST 9.4: Monthly Report Export
**Navigation:** Monthly Tracking → Click **Export Monthly Report**  
**Pass if:**
- File contains month-by-month breakdown
- Quarterly summaries included

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## ✅ TEST SUITE 10 — Navigation and UI

### TEST 10.1: All Sidebar Links
Click each of the following items in the sidebar and confirm each loads correctly:

| # | Link | Expected Page | Result |
|---|------|---------------|--------|
| 1 | Dashboard | Dashboard KPIs | ☐ Pass ☐ Fail |
| 2 | Projects | Project list | ☐ Pass ☐ Fail |
| 3 | Indicators | ITT table | ☐ Pass ☐ Fail |
| 4 | Activities | ATT table | ☐ Pass ☐ Fail |
| 5 | Cases | Case management | ☐ Pass ☐ Fail |
| 6 | Monthly Tracking | Calendar view | ☐ Pass ☐ Fail |
| 7 | New Activity Report | Data entry form | ☐ Pass ☐ Fail |
| 8 | Users (Admin) | User management | ☐ Pass ☐ Fail |
| 9 | Profile | Profile/settings | ☐ Pass ☐ Fail |
| 10 | Help | Help/Demo guide | ☐ Pass ☐ Fail |

---

### TEST 10.2: Sidebar Collapse/Expand
**Action:** Click the **☰** hamburger button (top-left)  
**Pass if:**
- Sidebar collapses to icons only
- Click again → sidebar expands
- Main content area adjusts width

---

### TEST 10.3: Mobile Responsiveness
**Action:** Press `F12` → Toggle Device Toolbar → Select **iPhone 12** (390px wide)  
**Pass if:**
- Layout adapts to mobile view
- Navigation is accessible (hamburger menu)
- Tables/cards readable — no horizontal overflow
- Touch targets are large enough (≥44px)

---

### TEST 10.4: Breadcrumb Navigation
**Action:** Navigate 2–3 levels deep (e.g., Projects → Project Detail → Edit)  
**Pass if:**
- Breadcrumbs update at each step
- Clicking breadcrumb navigates back correctly

**Tester Note:** ☐ Pass ☐ Fail — Comment: ___________________________

---

## 📊 TEST RESULTS SUMMARY

After completing all tests, fill in this summary:

| Test Suite | # Tests | Pass | Fail | Notes |
|------------|---------|------|------|-------|
| 1. Authentication | 5 | | | |
| 2. Dashboard | 5 | | | |
| 3. Projects | 5 | | | |
| 4. Indicators | 5 | | | |
| 5. Activities | 5 | | | |
| 6. Case Management | 4 | | | |
| 7. Monthly Tracking | 4 | | | |
| 8. User Management | 5 | | | |
| 9. Reports/Exports | 4 | | | |
| 10. Navigation/UI | 4 | | | |
| **TOTAL** | **46** | | | |

**Overall Score:** ______ / 46  
**Test Date:** _______________  
**Tested By:** _______________  

---

## 🐛 Bug Report Template

For each failed test, fill in:

```
BUG #:
Test Suite:     (e.g., TEST 5.4)
Description:    (What failed)
Steps to Reproduce:
  1.
  2.
  3.
Expected Result:
Actual Result:
Screenshot:     (Yes/No)
Severity:       Critical / High / Medium / Low
```

---

## 🛠️ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Server not responding | Run `npm run dev` in terminal |
| Login fails with correct password | Check database: `npm run db:verify` |
| Page shows blank/loading forever | Open `F12 → Console` for errors |
| Export file not downloading | Try a different browser (Chrome/Edge) |
| Mobile view broken | Hard refresh: `Ctrl + Shift + R` |
| Database errors | Run `npm run db:setup` to re-initialize |
| 404 on page navigation | Ensure server is running on port 3001 |

---

*Guide Version: 1.0 — AWYAD MES System User Testing — March 2026*
