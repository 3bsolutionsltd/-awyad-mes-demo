# AWYAD MES — Demo & Presentation Guide

> **System:** AWYAD Monitoring & Evaluation System (MES)  
> **Stack:** Node.js + Express · PostgreSQL · Vanilla JS + Bootstrap 5  
> **Dev URL:** http://localhost:3001  
> **Admin login:** `admin` / `Admin123!`

---

## Overview

The AWYAD MES is a full monitoring, evaluation, and learning (MEL) platform built for humanitarian field operations. It covers the complete results chain — from strategic framework down to individual beneficiary-level activities and protection case management.

---

## Pre-Demo Checklist

Before the demo, ensure:

- [ ] Server is running: `npm run dev` (port 3001)
- [ ] Database is seeded with demo data (run `011_demo_2026.sql` if needed)
- [ ] Browser tab is open at `http://localhost:3001`
- [ ] Logged in as admin (`admin` / `Admin123!`)
- [ ] Screen resolution ≥ 1280px wide (dashboard best at full screen)

---

## Demo Accounts

| Username | Password | Role | What to show |
|----------|----------|------|--------------|
| `admin` | `Admin123!` | Admin | Full system — all pages |
| *(create a manager demo account)* | | Manager | Programme view, no admin panel |

---

## Recommended Demo Flow (45 minutes)

### 1. Login & Overview (3 min)

1. Open `http://localhost:3001` — login screen with AWYAD branding
2. Log in as `admin` / `Admin123!`
3. **Main Dashboard** loads automatically — point out:
   - Summary cards: Active Projects, On-Track Indicators, Activities This Month, Budget Burn Rate
   - Thematic area progress bars
   - Gender & beneficiary disaggregation charts
   - Indicator performance table with colour-coded status

> **Talking point:** *"This gives the programme team an at-a-glance view of the entire portfolio every morning."*

---

### 2. Strategic Dashboard (5 min)

**Nav:** Sidebar → **Strategic Dashboard**

1. Show the **AWYAD Strategic Framework** hierarchy:
   - 2 Strategies → Pillars → Core Programme Components
   - Protection Strategy (PROT) and Empowerment Strategy (EMP)
2. Point out **AWYAD-level indicators** — organisation-wide KPIs linked to strategies
3. Click on a **Component** (e.g., GBV Prevention & Response) to drill down to projects
4. Switch to a specific project using the **Project Selector** at the top

> **Talking point:** *"This connects every activity on the ground back to AWYAD's five-year strategic framework — something donors increasingly expect to see."*

---

### 3. Project Dashboard (7 min)

**Nav:** Sidebar → **Project Dashboard** (or click through from Strategic Dashboard)

Demo with: **GBV Prevention & Response — Nakivale 2026**

1. **Project Header:** Name, donor (UNHCR), budget ($220,000), location (Nakivale/Isingiro), status badge
2. **Financial Performance section:**
   - Budget vs. Expenditure bar
   - Burn rate gauge — real-time financial health
   - Cash flow projection
3. **Indicator Performance section:**
   - Click on an indicator name → **Indicator Details modal** pops up
   - Show the **Details tab**: targets, achieved, Q1–Q4 breakdown, progress bar
   - Click **Linked Activities tab**: lazy-loads all activities contributing to that indicator — with dates, location, status, beneficiaries, budget
4. **Add Indicator button** — show the creation form (don't save during demo)
5. Scroll to **Activities** section, then **Cases** section

> **Talking point:** *"Project managers can drill from the indicator all the way to the specific activity that generated the result — this is the traceability donors ask for."*

---

### 4. Indicator Tracking Table — ITT (5 min)

**Nav:** Sidebar → **Indicators**

1. Show indicators grouped by **Thematic Area** (Results 2, 3, 5)
2. Point out colour-coded status:
   - 🟢 **On Track** ≥ 70%
   - 🟡 **At Risk** 40–70%
   - 🔴 **Off Track** < 40%
3. Show columns: Code, Level (Output/Outcome/Impact), Baseline, LOP Target, Annual Target, Q1–Q4, Achieved, % Achievement, Variance
4. Filter by thematic area or status — use the search box
5. Click **View** on any indicator — same rich details modal with Activities tab
6. Click **Export to Excel** — downloads multi-column indicator sheet

> **Talking point:** *"The ITT replaces the manual Excel trackers programmes typically maintain. It's always up to date because activities feed it directly."*

---

### 5. Activity Tracking Table — ATT (7 min)

**Nav:** Sidebar → **Activities**

1. Show summary cards: Total Activities, Completed, Approved, Total Beneficiaries, Budget
2. Click into any activity to show full **Beneficiary Disaggregation**:
   - Refugee vs. Host Community
   - Gender split (Male / Female)  
   - Age groups (0–4, 5–17, 18–49, 50+)
   - Nationality breakdown
3. Show **Approval Workflow** status badges (Pending / Approved / Rejected)
4. Show the **Age Disaggregation chart** and **Nationality pie chart**
5. Click **New Activity** → walk through the entry form fields briefly (project, indicator, date, location, beneficiaries)
6. Click **Export** → multi-sheet Excel (Activities, Disaggregation, Nationality)

> **Talking point:** *"Every UNHCR and EU donor report requires beneficiary disaggregation by age, sex, and population type. The system captures this at the point of data entry — no post-hoc aggregation."*

---

### 6. Case Management (5 min)

**Nav:** Sidebar → **Cases**

1. Show **Active / Closed tabs**
2. Summary cards: Active Caseload, Needs Follow-up (highlighted red if overdue), Closure Rate %
3. Click into a case to show:
   - Beneficiary details (anonymised ID)
   - Case type and category (GBV / Child Protection / Livelihood)
   - Status, referral trail, service notes
   - Days open, last follow-up alert
4. Show **follow-up tracking** — cases flagged as overdue
5. Click **New Case** — show the form briefly

> **Talking point:** *"The case management module is integrated with indicators — closing a case can automatically contribute to protection outcome indicators."*

---

### 7. Monthly Tracking (3 min)

**Nav:** Sidebar → **Monthly Tracking**

1. Select **2026** from the year navigator
2. Show the **calendar view** — activity counts per month
3. Show the **quarterly summaries** — Q1–Q4 totals
4. Show the **time-series chart** — activities & beneficiaries trend line
5. Click **Export** → monthly report Excel

> **Talking point:** *"Programme coordinators use this for quarterly donor reports — it takes seconds instead of days."*

---

### 8. RBM Dashboard (3 min)

**URL:** Navigate directly to `http://localhost:3001/rbm-dashboard.html`

1. Show **KPI cards**: Total Indicators, On-Track, At-Risk, Off-Track, Pending Validations
2. Use **Pillar tabs** to filter (PROT-P1, PROT-P2, EMP-P1 etc.)
3. Show paginated indicator table — colour-coded progress bars
4. Show **search and filter** by result level (Impact / Outcome / Output)

> **Talking point:** *"The RBM module supports AWYAD's results-based management framework — leadership can review all 80+ indicators across the organisation in one screen."*

---

### 9. Admin Panel — quick tour (5 min)

*(Skip if audience is programme staff only)*

#### User Management — `#users`
- Create a new user, assign role (Manager / Viewer)
- Show Active / Inactive status

#### Permission Matrix — `#permissions`
- Click a cell to grant/revoke a permission
- Explain the four roles: Admin, Manager, User, Viewer

#### Support Data — `#support-data`
- Show Case Types list (GBV, Child Protection, Livelihood…)
- Click a type to see its Categories in the right panel
- Add a new category live

#### Thematic Areas — `#thematic-areas`
- Show Results 2, 3, 5 — explain how they map to UNHCR result areas

#### Audit Logs — `#audit-logs`
- Show the audit trail — every data change logged with user, timestamp, old/new values

> **Talking point:** *"The audit trail is essential for programme accountability and external evaluations. Every change is logged — who did what and when."*

---

### 10. Data Entry Demo (3 min)

**Nav:** Sidebar → **Entry Form**

1. Fill in a quick test activity:
   - Select a project → Nakivale GBV project
   - Select indicator
   - Enter beneficiary numbers (e.g., 30 female 18–49 refugee)
   - Select location, date, status
2. Show validation (try to submit empty required fields)
3. Submit as draft

> **Talking point:** *"Field officers enter data on tablets or phones — the system is responsive. Data flows directly into the dashboard without any intermediate step."*

---

## Key Differentiators to Emphasise

| Feature | Benefit |
|---------|---------|
| Strategic hierarchy drill-down | Links every activity to AWYAD's 5-year strategy |
| Beneficiary disaggregation at entry | No manual post-processing for donor reports |
| Indicator → Activities drill-through | Full traceability for evaluations |
| Case management integrated with indicators | Protection outcomes tracked in real time |
| Role-based access control | Field staff can enter; only managers can approve |
| Audit trail on every change | Accountability and compliance-ready |
| One-click Excel export | Donor report packs generated in seconds |
| RBM Dashboard | Organisation-wide indicator view for leadership |

---

## Common Questions & Answers

**Q: Can multiple users enter data simultaneously?**  
A: Yes — the system is multi-user. Each session is tracked separately and data is committed immediately to the shared database.

**Q: How does it handle offline areas?**  
A: Current version requires internet connectivity. Offline-first capability is on the roadmap.

**Q: Can we customise the thematic areas and case types?**  
A: Yes — admin users can add/edit/deactivate thematic areas, case types, and categories through the Support Data and Thematic Areas pages without developer involvement.

**Q: Is beneficiary data anonymised?**  
A: Case management uses a beneficiary ID system. Personal details are stored according to the data protection policy configured at deployment.

**Q: How are indicators linked to activities?**  
A: Each activity is linked to one indicator at the time of data entry. Achievement values can be aggregated across all linked activities for automatic indicator progress.

**Q: Can we export for UNHCR 4W/5W reporting?**  
A: The Excel export includes all disaggregation columns needed for 4W/5W. Mapping templates can be applied at export time.

---

## Demo Reset (if needed)

To restore clean demo data after a live demo session:

```bash
# Re-run the 2026 demo seed (clears and re-inserts demo projects/indicators/activities)
psql -U postgres -d awyad_mes -f database/seeds/011_demo_2026.sql
```

---

## Presenter Notes

- **Best flow for donor audience:** Steps 1 → 2 → 3 → 5 → 6 → Monthly → End (skip admin)
- **Best flow for IT/technical audience:** Steps 1 → 9 (full admin tour) → 5 → RBM
- **Best flow for M&E audience:** Steps 1 → 4 (ITT deep dive) → 3 (project dashboard) → 7 (RBM) → Monthly
- Keep the browser cached — first load may be slower due to cold DB queries
- Have the project dashboard pre-loaded on Nakivale GBV project before the session
- If live entry demo goes wrong, say *"let me show you a completed record"* and open an existing activity
