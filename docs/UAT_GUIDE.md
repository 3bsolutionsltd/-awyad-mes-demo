# AWYAD MES — User Acceptance Testing (UAT) Guide
**System:** AWYAD Monitoring, Evaluation & Learning System  
**Version:** 2.0 Enterprise  
**Guide Version:** 2.1  
**Date:** June 2026  
**Estimated Duration:** 150–180 minutes (full run) | 60 minutes (smoke test)

---

## Before You Start

### 1. Start the Server
Open a terminal in the project folder and run:
```bash
npm run dev
```
Wait until you see: `Server running on port 3001`

### 2. Open Your Browser
Use **Chrome** or **Edge** (recommended). Open developer tools (`F12`) and keep the **Console** tab visible to catch any JavaScript errors throughout testing.

Navigate to: **http://localhost:3001**

### 3. Test Credentials

| Role | Username | Password | What they can do |
|------|----------|----------|-----------------|
| **Admin** | `admin` | `Admin123!` | Everything — full system access |
| **Manager** | Create in Suite 10 | `Manager123!` | View + Edit data, reports, no user management |
| **Field Officer** | Create in Suite 10 | `Field123!` | Submit activities and indicator data |
| **Viewer** | Create in Suite 10 | `Viewer123!` | Read only across all modules |

### 4. System Map

```
AWYAD MES (http://localhost:3001)
│
├── / (index.html)              → Main app shell with sidebar
│   │
│   ├── #dashboard              → Home — post-login landing page / task router
│   ├── #overview-dashboard     → Overview Dashboard — KPI cards + charts
│   ├── #strategic-dashboard    → AWYAD Strategic Dashboard (hierarchy view)
│   ├── #projects               → Project portfolio
│   ├── #indicators             → Indicator Tracking Table (ITT)
│   ├── #activities             → Activity Tracking Table (ATT)
│   ├── #cases                  → Case Management
│   ├── #monthly                → Monthly Tracking / Calendar
│   ├── #entry-form             → Activity Report Form (report completed activities)
│   ├── #profile                → User profile + password
│   ├── #sessions               → Session Management
│   ├── #help                   → Help & Quick Reference
│   │
│   ├── #users                  → User Management         (Admin only)
│   ├── #thematic-areas         → Thematic Areas config    (Admin only)
│   ├── #support-data           → Support Data management  (Admin only)
│   ├── #donors                 → Donor Management         (Admin only)
│   ├── #permissions            → Permission Matrix        (Admin only)
│   └── #audit-logs             → Audit Logs               (Admin only)
│
├── /rbm-dashboard.html         → Results-Based Management dashboard
├── /rbm-strategy.html          → Strategy Framework hierarchy
├── /rbm-indicators.html        → RBM Indicator list
├── /rbm-submit.html            → Submit Indicator Data
├── /rbm-validation.html        → Validation Queue
└── /non-program-activities.html → Non-Program Activities
```

### 5. How to Record Results

Use the checkboxes in each test. At the end, transfer results to the **Results Summary** table (Section 15).

```
☐ Pass   ☐ Fail   ☐ Skip (N/A)
Comment: ___________________________________________________
```

---

## Suite 1 — Authentication

### UAT-1.1: Load Login Page
**URL:** `http://localhost:3001/login.html`  
**Steps:**
1. Open the URL in a fresh browser tab

**Pass if:**
- Login form renders with Username and Password fields
- AWYAD branding / logo is visible
- No JavaScript errors in the browser console

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-1.2: Login — Correct Credentials
**Steps:**
1. Enter username `admin` and password `Admin123!`
2. Click **Login**

**Pass if:**
- Redirected to the main Home page
- User name shown in header or sidebar
- Sidebar navigation is visible

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-1.3: Login — Wrong Password
**Steps:**
1. Log out, then attempt login with username `admin` and password `wrongpassword`

**Pass if:**
- Error message appears ("Invalid credentials" or similar)
- No redirect occurs — page stays on login
- Error text is visible in red

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-1.4: Session Persistence
**Steps:**
1. While logged in as Admin, press **F5** to hard-refresh the page

**Pass if:**
- Stays on Home — NOT redirected back to login
- Token and session are maintained

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-1.5: Logout
**Steps:**
1. Click the Logout button (header or user menu)
2. After logout, try accessing `http://localhost:3001` directly

**Pass if:**
- Redirected to login page on logout
- Direct navigation to root also redirects to login (no bypass)

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-1.6: Password Change
**Steps:**
1. Log in as Admin
2. Navigate to **Profile** (sidebar or header menu)
3. Find the **Change Password** section
4. Enter current password `Admin123!`, new password `Admin456!`, confirm `Admin456!`
5. Submit the change
6. Log out, then log in again using the **new** password `Admin456!`
7. After confirming it works, change the password back to `Admin123!`

**Pass if:**
- Password change accepted with success message
- New password works for login
- Old password no longer accepted

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 2 — Dashboards

> The system opens on **Home** (`#dashboard`) after login. The analytics dashboard views are separate sidebar routes: **Overview Dashboard** (`#overview-dashboard`) and **Strategic Dashboard** (`#strategic-dashboard`).

### UAT-2.1: Overview Dashboard — KPI Summary Cards
**Navigation:** Click **Overview Dashboard** in the sidebar  
**Pass if:**
- 4 KPI summary cards are visible:
  - Active Projects (a positive number)
  - Indicators On-Track
  - Activities This Month / Total Activities
  - Budget Burn Rate (percentage)
- No "NaN", "null", or blank values in any card

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-2.2: Overview Dashboard — Thematic Area Progress Bars
**Pass if:**
- "Thematic Areas" or "Results Framework" section is visible
- Progress bars shown for RESULT 2 (GBV) and RESULT 3 (Child Protection)
- Color coding present: green / yellow / red based on achievement

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-2.3: Overview Dashboard — Charts Render Correctly
**Pass if:**
- At least one chart renders without blank area or broken canvas
- Charts include data (not empty state)
- No console errors related to chart libraries

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-2.4: Overview Dashboard — Project/Strategic View Switcher
**Action:** Within the Overview Dashboard, locate the **"AWYAD Strategic View"** / **"Project Dashboards"** switcher bar at the top of the content area and click each button  
**Pass if:**
- Selecting **"AWYAD Strategic View"** hides the project selector dropdown
- Selecting **"Project Dashboards"** reveals a project selector dropdown
- Choosing a project from the dropdown loads a project-specific dashboard
- Selection persists across page refreshes (saved in browser localStorage)

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-2.5: Strategic Dashboard — Hierarchy View
**Navigation:** Click **Strategic Dashboard** in the sidebar  
**Pass if:**
- Page loads showing the AWYAD Strategic Framework
- Summary cards show totals for Strategies, Pillars, Components, and Projects
- Strategy cards are expandable/collapsible by clicking the card header
- Each strategy card shows badge counts: Pillars, Components, Projects
- AWYAD-level indicators section is visible below the hierarchy
- No "NaN", "null", or blank badge counts in any card

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-2.6: Dashboard Performance
**Pass if:**
- Both dashboard views fully load within 5 seconds on localhost
- No spinners stuck indefinitely
- All API calls resolve (check Network tab in F12 — no failed requests)

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 3 — Projects Module

### UAT-3.1: View Project List
**Navigation:** Click **Projects** in the sidebar  
**Pass if:**
- Project list/table displays
- Shows at least 2 projects: "GBV Response and Protection" and "Child Protection Program"
- Columns present: Name, Status, Budget, Expenditure, Burn Rate, Thematic Area

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-3.2: Burn Rate Color Coding
**Pass if:**
- Burn rates < 75% show in **green**
- Burn rates 75–90% show in **yellow/amber**
- Burn rates > 90% show in **red**

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-3.3: Create a New Project
**Navigation:** Projects → Click **"+ New Project"** or **"Create Project"**

Enter the following test data:
```
Project Name:  UNHCR Women Empowerment Initiative
Donor:         UNHCR
Description:   Strengthen protection services for women and girls in Nakivale settlement
Thematic Area: RESULT 2 — Local partners effectively respond to GBV and protection risks
               (select from dropdown)
Start Date:    2026-07-01
End Date:      2027-06-30
Budget:        250000
Status:        Planning
```

> **Note:** Thematic Area is a **required** dropdown — the form will not submit without it.

**Pass if:**
- Form submits with success confirmation
- New project "UNHCR Women Empowerment Initiative" appears in the project list

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-3.4: Edit an Existing Project
**Steps:**
1. Find "UNHCR Women Empowerment Initiative" in the project list
2. Click **Edit**
3. Change Budget from `250000` to `300000`
4. Change Status from `Planning` to `Active`
5. Save

**Pass if:**
- Changes saved with confirmation
- Updated Budget (300,000) and Status (Active) visible in project list/detail

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-3.5: Project Detail — All Tabs
**Steps:**
1. Click the project name "GBV Response and Protection" to open its detail view

**Pass if:**
- Overview section shows: Name, Donor, Budget, Expenditure, Burn Rate, Status, Dates, Thematic Area
- At minimum the following tabs/sections accessible: **Overview**, **Indicators**, **Activities**
- No blank or error state on any tab

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 4 — Indicator Tracking Table (ITT)

### UAT-4.1: View Indicator List
**Navigation:** Click **Indicators** in the sidebar  
**Pass if:**
- Summary cards show: Total, On Track, At Risk, Off Track
- Indicators grouped or labelled by Thematic Area
- Table columns present: Code, Name, LOP Target, Annual Target, Q1, Q2, Q3, Q4, Achieved, % Achievement

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-4.2: Two-Row Table Header
**Pass if:**
- Header row 1: LOP | Annual | Q1 | Q2 | Q3 | Q4
- Header row 2: Target / sub-labels beneath each column group
- Data rows align correctly under both header rows

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-4.3: Progress Bars and Achievement Colour Coding
**Pass if:**
- Each indicator row has a visible progress bar
- Bars are colour-coded: green (≥ 75%), yellow (40–74%), red (< 40%)
- % Achievement figure displayed alongside or inside the bar

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-4.4: Variance Column
**Pass if:**
- Variance = Achieved − Target shown for each indicator
- Positive variance shown in **green**
- Negative variance shown in **red**

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-4.5: View Individual Indicator Detail
**Steps:**
1. Click on any indicator name or its View/Detail button

**Pass if:**
- Detail modal or page opens
- Shows: Code, Name, Type, Unit, Baseline, LOP Target, quarterly breakdown, Achievement %
- Progress bar renders without error
- No `toFixed is not a function` or similar JS error in console

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-4.6: Create a New Indicator
**Navigation:** Indicators → Click **"+ Add Indicator"** or **"New Indicator"**

Enter:
```
Indicator Name:  Number of women receiving legal aid services
Indicator Code:  I.2.TEST
Type:            Output
Thematic Area:   RESULT 2 — GBV Response
Unit:            Individuals
Baseline:        0
LOP Target:      500
Annual Target:   200
Q1 Target:       40
Q2 Target:       60
Q3 Target:       50
Q4 Target:       50
```

**Pass if:**
- Indicator saved successfully
- Appears in the indicator list
- Initial achievement shows 0% or baseline

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 5 — Activity Tracking Table (ATT)

### UAT-5.1: View Activity List
**Navigation:** Click **Activities** in the sidebar  
**Pass if:**
- Summary cards show: Total Activities, Completed, Pending, Budget, Burn Rate
- Activity table shows columns: Code, Title, Date, Location, Total Beneficiaries, Budget, Status

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-5.2: Beneficiary Disaggregation Display
**Steps:**
1. Click on any existing activity to view its details

**Pass if:**
- Disaggregation breakdown is visible showing:
  - Community type: Refugee / Host Community
  - Gender: Male / Female
  - Age groups: 0–4, 5–17, 18–49, 50+
  - Nationality: Sudanese, Congolese, South Sudanese, Others

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-5.3: Create a New Activity Report
**Navigation:** Click **"+ New Activity"** in the sidebar or Activities section

Enter the following test data:

```
Activity Title:   GBV Awareness Community Session — Nakivale
Activity Code:    3.2.1
Linked Project:   GBV Response and Protection
Date:             2026-07-15
Location:         Nakivale
Budget:           8,000
Expenditure:      6,500
Status:           Completed

Refugee Beneficiaries:
  Male 0–4:    8     Female 0–4:    7
  Male 5–17:  20     Female 5–17:  18
  Male 18–49: 12     Female 18–49: 15
  Male 50+:    2     Female 50+:    3
  (Subtotal Male: 42, Female: 43, Refugee Total: 85)

Host Community Beneficiaries:
  Male 0–4:    5     Female 0–4:    6
  Male 5–17:  10     Female 5–17:  12
  Male 18–49:  8     Female 18–49: 10
  Male 50+:    1     Female 50+:    2
  (Subtotal Male: 24, Female: 30, Host Total: 54)

Grand Total: 139

Nationality (must total = Refugee total 85):
  Sudanese:         40
  Congolese:        25
  South Sudanese:   15
  Others:            5
  Total:            85 ✓
```

**Pass if:**
- Grand total auto-calculates to 139
- Nationality total (85) matches refugee total (85)
- Activity saved with success confirmation
- Appears in activity list

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-5.4: Nationality Validation
**Steps:**
1. Open the New Activity form again
2. Enter refugee total of 50
3. Deliberately enter nationality totals that add up to 40 (not 50)
4. Try to submit

**Pass if:**
- Form shows a validation error: nationality total must match refugee total
- Form does not submit until corrected

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-5.5: Activity Export
**Action:** Click the **Export** button in the Activities module  
**Pass if:**
- File downloads (CSV or Excel)
- File includes all activity columns, including disaggregation data

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 6 — Case Management

### UAT-6.1: View Case List
**Navigation:** Click **Cases** in the sidebar  
**Pass if:**
- Active case count displayed in summary
- Case table shows columns: Case ID, Type, Beneficiary (gender/age), Case Worker, Status, Follow-up Date
- Overdue follow-up dates highlighted in red or orange

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-6.2: Create a New Case
**Navigation:** Cases → Click **"+ New Case"**

Enter:
```
Case Type:        GBV — Psychosocial Support
Date Opened:      2026-07-01
Beneficiary:
  Gender:         Female
  Age:            24
  Nationality:    Congolese
  Location:       Nakivale
Case Worker:      (select any available case worker)
Services Needed:  Psychosocial Support, Legal Assistance
Confidential:     Yes
Follow-up Date:   2026-07-22
Notes:            Initial intake. Client referred from community mobilizer.
```

**Pass if:**
- Case saved with a system-generated Case ID
- Appears in the case list with correct type and status (Open)
- Confidentiality flag shown

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-6.3: Overdue Follow-Up Alert
**Steps:**
1. Open the case you just created
2. Change the Follow-up Date to **today's date** (2026-06-18) or yesterday
3. Save

**Pass if:**
- Case row is highlighted in red / orange in the list
- A visual alert or badge indicates the follow-up is overdue

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-6.4: Close a Case
**Steps:**
1. Open an existing case
2. Change Status to **Closed**
3. Save

**Pass if:**
- Case moves out of Active cases
- Closure date is recorded
- Case closure rate / statistics update accordingly

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 7 — Monthly Tracking

### UAT-7.1: Calendar View
**Navigation:** Click **Monthly Tracking** in the sidebar  
**Pass if:**
- Calendar or month-grid view displayed for the current period
- Activities appear on their correct dates
- Month navigation (Previous / Next) buttons work

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-7.2: Year Switcher
**Action:** If year tabs (2024, 2025, 2026) are present, click each  
**Pass if:**
- Data updates to show activities for the selected year
- YTD summaries refresh accordingly

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-7.3: Quarterly Summaries
**Pass if:**
- Q1–Q4 sections show aggregated beneficiary totals
- Budget totals per quarter shown
- Data is consistent with individual activity records

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-7.4: Export Monthly Report
**Action:** Click **Export** in Monthly Tracking  
**Pass if:**
- File downloads successfully
- Report contains month-by-month breakdown with beneficiary and budget data

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 8 — Results-Based Management (RBM)

> **Note:** The RBM module is a separate section of the system. Navigate directly to each URL listed below.

### UAT-8.1: RBM Dashboard
**URL:** `http://localhost:3001/rbm-dashboard.html`  
**Pass if:**
- Page loads with RBM navigation bar visible
- **Pillar tabs** visible across the top (including an "All Pillars" option)
- Indicators displayed with achievement percentage bars (green / amber / red)
- Period filter dropdown (2024 / 2025) is functional — changing the period updates displayed data
- Result level badges visible: Impact / Outcome / Output
- Print button present and triggers browser print dialog

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-8.2: Strategy Framework Hierarchy
**URL:** `http://localhost:3001/rbm-strategy.html`  
**Pass if:**
- Page loads showing a hierarchical structure
- Visual hierarchy shows: Strategy → Pillars → Core Program Components → Thematic Areas
- Each level has colour-coded cards/badges (blue = Strategy, green = Pillar, orange = CPC, purple = TA)
- **Expand All** / **Collapse All** buttons work correctly
- Individual sections can be expanded/collapsed

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-8.3: RBM Indicators List
**URL:** `http://localhost:3001/rbm-indicators.html`  
**Pass if:**
- Indicator list loads
- Indicators show code, name, result level, achievement, and linked thematic area
- Filtering or searching works (if filter controls are present)

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-8.4: Submit Indicator Data
**URL:** `http://localhost:3001/rbm-submit.html`  
**Steps:**
1. Select an indicator from the dropdown
2. Enter a reporting period
3. Enter an achieved value (e.g., 45)
4. Add a note and submit

**Pass if:**
- Form submits with success message
- Submission appears in the Validation Queue (UAT-8.5)

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-8.5: Validation Queue
**URL:** `http://localhost:3001/rbm-validation.html`  
**Pass if:**
- Validation queue loads showing pending submissions
- Status filter (Pending / Flagged / Verified) is functional
- Admin can approve or flag a submission
- Approved submission updates indicator achievement on the RBM Dashboard

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 9 — Non-Program Activities

**URL:** `http://localhost:3001/non-program-activities.html`

### UAT-9.1: View Non-Program Activity List
**Pass if:**
- Page loads with a list of non-program activities (or empty state with instructions)
- **New Activity** button is visible
- **Manage Categories** button is visible

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-9.2: Create a Non-Program Activity
**Steps:**
1. Click **New Activity**
2. Enter a title, select or create a category, add a date and description
3. Submit

**Pass if:**
- Activity created and appears in the list
- Category is correctly assigned

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-9.3: Manage Categories
**Steps:**
1. Click **Manage Categories**
2. Create a new category called "Capacity Building"

**Pass if:**
- Category is created and available in the New Activity dropdown

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 10 — User Management

> **Log in as Admin for this entire suite.**

### UAT-10.1: View User List
**Navigation:** Click **Users** in the sidebar (Admin only)  
**Pass if:**
- User list shows all accounts
- Columns: Username, Email, Role, Status, Last Login
- Admin account visible

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.2: Create a Manager Account
**Navigation:** Users → **"+ New User"**

Enter:
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
- User created with success confirmation
- Appears in user list with "Manager" role badge

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.3: Create a Field Officer Account
```
Username: fieldofficer1
Email:    field@awyad.org
Password: Field123!
Role:     Field Officer (or Data Entry)
Status:   Active
```

**Pass if:** User created with correct role assigned

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.4: Create a Viewer Account
```
Username: viewer1
Email:    viewer@awyad.org
Password: Viewer123!
Role:     Viewer
Status:   Active
```

**Pass if:** User created with Viewer role

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.5: Role-Based Access — Viewer Restrictions
**Steps:**
1. Log out
2. Log in as `viewer1` / `Viewer123!`

**Pass if:**
- No **"+ New"** or **"Create"** buttons visible in Projects, Indicators, Activities, or Cases
- No **Users** item in sidebar navigation
- All data is visible (read-only access)
- Exporting data works

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.6: Role-Based Access — Field Officer Restrictions
**Steps:**
1. Log in as `fieldofficer1` / `Field123!`

**Pass if:**
- Can access and submit New Activity forms
- Can access Submit Indicator Data (`/rbm-submit.html`)
- Cannot access User Management
- Cannot create or edit Projects

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-10.7: Role-Based Access Summary

| Action | Admin | Manager | Field Officer | Viewer |
|--------|-------|---------|---------------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Create / Edit Project | ✅ | ✅ | ❌ | ❌ |
| Submit Activity | ✅ | ✅ | ✅ | ❌ |
| Submit Indicator Data | ✅ | ✅ | ✅ | ❌ |
| Create / Manage Case | ✅ | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| Approve RBM Submissions | ✅ | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ |

Test any row you haven't already covered with the steps above.

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 11 — Reports and Exports

### UAT-11.1: Dashboard Export
**Action:** Dashboard → Click **Export** / **Download**  
**Pass if:**
- CSV or Excel file downloads
- File includes KPI summary and thematic area data

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-11.2: Indicator Report Export
**Action:** Indicators → Click **Export**  
**Pass if:**
- File includes all indicators with: Code, Name, LOP Target, Annual Target, Q1–Q4, Achieved, % Achievement

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-11.3: Activity Report Export
**Action:** Activities → Click **Export**  
**Pass if:**
- File includes full disaggregation columns (refugee/host, gender, age, nationality)
- Budget and expenditure data included

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-11.4: Monthly Report Export
**Action:** Monthly Tracking → **Export Monthly Report**  
**Pass if:**
- File contains month-by-month breakdown
- Quarterly summaries included

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-11.5: RBM Dashboard Print
**Action:** Navigate to `http://localhost:3001/rbm-dashboard.html` → click **Print**  
**Pass if:**
- Browser print dialog opens
- Print preview shows the RBM dashboard content
- Navigation bar is hidden in print preview (`.no-print` elements excluded)

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 12 — User Profile

### UAT-12.1: View Profile Page
**Navigation:** Click **Profile** in the sidebar or header  
**Pass if:**
- Profile page loads showing current user's: name, username, email, role
- Change Password section is accessible

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-12.2: Update Profile Information
**Steps:**
1. Edit display name or any editable profile field
2. Save

**Pass if:**
- Changes saved with confirmation
- Updated name reflects in the header/sidebar

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 13 — Audit Logs

> **Admin only.**

### UAT-13.1: View Audit Log
**Navigation:** Sidebar → **Audit Logs** (if visible) or `http://localhost:3001/#audit`  
**Pass if:**
- Audit log table loads
- Shows recent actions: who performed them, what action, timestamp
- Actions from your testing session (logins, creates, edits) are recorded

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-13.2: Audit Log Filtering
**Steps:**
1. Filter by **Action Type** (e.g., LOGIN, CREATE, UPDATE)
2. Filter by **User**
3. Filter by **Date range**

**Pass if:**
- Each filter narrows the results correctly

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Suite 14 — Navigation and UI

### UAT-14.1: All Primary Navigation Links

Click each sidebar item and confirm it loads correctly:

| # | Link | Expected Page | Admin only? | Result |
|---|------|---------------|:-----------:|--------|
| 1 | Home | Post-login landing page and pathway guidance | | ☐ Pass ☐ Fail |
| 2 | Overview Dashboard | KPI cards and charts | | ☐ Pass ☐ Fail |
| 3 | Strategic Dashboard | Strategy hierarchy + AWYAD indicators | | ☐ Pass ☐ Fail |
| 4 | Projects | Project list | | ☐ Pass ☐ Fail |
| 5 | Indicator Tracking (ITT) | ITT table | | ☐ Pass ☐ Fail |
| 6 | Activity Tracking (ATT) | ATT table | | ☐ Pass ☐ Fail |
| 7 | Case Management | Case management | | ☐ Pass ☐ Fail |
| 8 | Monthly Tracking | Calendar / month view | | ☐ Pass ☐ Fail |
| 9 | Activity Report Form | Report completed activities with disaggregation | | ☐ Pass ☐ Fail |
| 10 | RBM Dashboard | `/rbm-dashboard.html` | | ☐ Pass ☐ Fail |
| 11 | Submit Indicator Data | `/rbm-submit.html` | | ☐ Pass ☐ Fail |
| 12 | RBM Validation | `/rbm-validation.html` | | ☐ Pass ☐ Fail |
| 13 | Help & Quick Reference | Help guides | | ☐ Pass ☐ Fail |
| 14 | Profile | Profile/settings | | ☐ Pass ☐ Fail |
| 15 | Sessions | Session management | | ☐ Pass ☐ Fail |
| 16 | User Management | User list and creation | ✅ | ☐ Pass ☐ Fail |
| 17 | Thematic Areas | Thematic area config | ✅ | ☐ Pass ☐ Fail |
| 18 | Support Data | Support data management | ✅ | ☐ Pass ☐ Fail |
| 19 | Donors | Donor management | ✅ | ☐ Pass ☐ Fail |
| 20 | Permissions | Permission matrix | ✅ | ☐ Pass ☐ Fail |
| 21 | Audit Logs | Audit log table | ✅ | ☐ Pass ☐ Fail |
| 22 | Non-Program Activities | `/non-program-activities.html` | | ☐ Pass ☐ Fail |

---

### UAT-14.2: Sidebar Collapse / Expand
**Steps:**
1. Click the **☰** hamburger button (top-left)

**Pass if:**
- Sidebar collapses to icon-only view
- Click again → sidebar expands back
- Main content area adjusts its width accordingly

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-14.3: Mobile Responsiveness
**Steps:**
1. Press `F12` → toggle Device Toolbar → select **iPhone 12** (390px wide)
2. Navigate through Dashboard, Projects, and Activities

**Pass if:**
- Layout adapts to mobile width without horizontal scrolling
- Navigation is accessible (hamburger menu)
- Tables or cards are readable
- Touch targets are reasonably large (≥ 44px)

☐ Pass   ☐ Fail   Comment: ___________________________

---

### UAT-14.4: No Console Errors on Core Pages
**Steps:**
1. Open `F12 → Console`
2. Clear console
3. Visit: Dashboard, Projects, Indicators, Activities, Cases, RBM Dashboard, Strategy Framework

**Pass if:**
- No red **error** messages in console on any page
- Yellow **warnings** are acceptable but should be noted

☐ Pass   ☐ Fail   Comment: ___________________________

---

## Section 15 — UAT Results Summary

Complete this table after all suites are finished.

| Suite | # Tests | Pass | Fail | Skip | Notes |
|-------|---------|------|------|------|-------|
| 1. Authentication | 6 | | | | |
| 2. Dashboards | 6 | | | | |
| 3. Projects | 5 | | | | |
| 4. Indicators (ITT) | 6 | | | | |
| 5. Activities (ATT) | 5 | | | | |
| 6. Case Management | 4 | | | | |
| 7. Monthly Tracking | 4 | | | | |
| 8. RBM Module | 5 | | | | |
| 9. Non-Program Activities | 3 | | | | |
| 10. User Management | 7 | | | | |
| 11. Reports & Exports | 5 | | | | |
| 12. User Profile | 2 | | | | |
| 13. Audit Logs | 2 | | | | |
| 14. Navigation & UI | 4 | | | | |
| **TOTAL** | **64** | | | | |

**Overall Score:** ______ / 64  
**Test Date:** _______________  
**Tested By:** _______________  
**Sign-off Status:** ☐ Accepted   ☐ Accepted with conditions   ☐ Rejected

**Conditions / Key Issues:**

___________________________________________________________________________

___________________________________________________________________________

---

## Bug Report Template

For each failed test, copy and complete this template:

```
BUG #:
Test ID:           (e.g., UAT-5.4)
Test Suite:        (e.g., Suite 5 — Activities)
Summary:           (one line: what failed)
Steps to Reproduce:
  1.
  2.
  3.
Expected Result:
Actual Result:
Screenshot/Video:  Yes / No
Console Error:     (paste any error message)
Severity:          Critical / High / Medium / Low
  Critical = system crash, data loss, or security issue
  High     = core feature broken, no workaround
  Medium   = feature degraded, workaround exists
  Low      = cosmetic / minor UX issue
```

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Server not responding | Run `npm run dev` in the terminal |
| Login fails with correct password | Run `npm run db:verify` to check database |
| Page shows blank or loads forever | Check `F12 → Console` and `F12 → Network` for errors |
| Export file not downloading | Try Chrome or Edge; check browser download settings |
| Mobile view broken | Hard refresh: `Ctrl + Shift + R` |
| RBM pages return 401 Unauthorized | Ensure you are logged in — token may have expired |
| Database errors | Run `npm run db:setup` to re-initialize with seed data |
| 404 on any page | Confirm server is running on port 3001 |

---

*UAT Guide v2.1 — AWYAD MES System — June 2026 — 3B Solutions Ltd*
