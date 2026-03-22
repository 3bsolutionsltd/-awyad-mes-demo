# AWYAD MES — System Presentation Guide
**For:** Stakeholders, Donors, Program Staff, New Users  
**System:** AWYAD Monitoring, Evaluation & Learning System  
**Version:** 2.0.0 | March 2026  
**Presenter:** AWYAD M&E Team  

---

## 🎯 Purpose of This Guide

This guide helps you deliver a clear, compelling demonstration of the AWYAD MES system. It covers:
- What to say and show at each step
- Suggested talking points per module
- Tips for handling questions
- A short 20-minute version and a full 60-minute version

---

## ⏱️ Presentation Versions

| Version | Duration | Best For |
|---------|----------|----------|
| **Quick Demo** | 15–20 min | Donor meetings, executives, brief introductions |
| **Full Walkthrough** | 50–60 min | Staff training, new users, deep technical review |

---

## 🖥️ Setup Before You Present

1. **Start the server:**
   ```bash
   npm run dev
   ```
2. **Open the system in browser:** http://localhost:3001
3. **Open a second tab:** http://localhost:3001/public/login.html (for login demo)
4. **Zoom browser to 90%** for better screen visibility during projection
5. **Check data loaded:** Confirm at least 2–3 projects, 10+ indicators, 10+ activities exist
6. **Close unrelated browser tabs and apps** to avoid distractions

**Pro tip:** Pre-log in as Admin before starting so you can jump straight into modules.

---

---

# PART 1: OPENING & CONTEXT SETTING

## Slide/Section: The Problem We Solve

**Say this:**

> "Before we built this system, AWYAD's M&E data was scattered across dozens of Excel files. Reporting was manual, time-consuming, and prone to errors. It was impossible to get a real-time view of program performance across multiple donors, projects, and thematic areas.
>
> Today, I'm going to show you how the AWYAD MES changes that completely."

**Show this:**

Write or display this contrast table:

| Before AWYAD MES | After AWYAD MES |
|------------------|-----------------|
| Data in multiple Excel files | One centralized system |
| Manual calculations | Auto-calculated KPIs |
| Hours to generate reports | One-click reports |
| No real-time visibility | Live dashboard |
| Fragmented beneficiary tracking | Full disaggregation by gender, age, nationality |

---

## Slide/Section: About the System

**Say this:**

> "AWYAD MES is a web-based Monitoring, Evaluation, and Learning (MEL) system built specifically for AWYAD's humanitarian programs in Yemen. It covers everything from strategic indicators down to individual beneficiary cases."

**Key facts to mention:**
- Covers **3 active projects** across GBV, Child Protection, and STEPS programs
- Tracks **22+ indicators** with quarterly targets
- Manages **individual GBV and child protection cases**
- Supports **4 user roles** with controlled access
- **Fully responsive** — works on phone, tablet, and desktop

---

## Slide/Section: System Architecture (Optional — for technical audiences)

**Say this:**

> "Under the hood, the system uses a modern, three-tier architecture:
> - **Frontend:** HTML5, Bootstrap, JavaScript — runs in any browser
> - **Backend:** Node.js + Express API
> - **Database:** PostgreSQL — reliable, enterprise-grade storage
> - **Security:** JWT authentication, role-based access, audit logging"

---

---

# PART 2: LIVE DEMONSTRATION

## DEMO STEP 1 — Login and Authentication

**Say this:**
> "Let's start from the beginning — how users access the system securely."

**Show this:**
1. Navigate to: http://localhost:3001/public/login.html
2. Type in: Username `admin`, Password (do not show on screen — type quietly)
3. Click Login

**Points to make while logging in:**
- "Every user has their own account with a unique role"
- "The system uses JWT tokens — sessions are secure and time-limited"
- "Passwords are encrypted using bcrypt — never stored in plain text"

**After login:**
> "Once logged in, I land on the Dashboard — the central command center for the whole program."

---

## DEMO STEP 2 — The Dashboard

**Say this:**
> "The Dashboard gives leadership and M&E staff an instant view of organizational performance — without opening a single Excel file."

**Show this — point to each element:**

### KPI Cards (top of page)
| Card | What to say |
|------|-------------|
| Active Projects | "Right now we have [X] active projects running in parallel" |
| Indicators On-Track | "Of our [22] indicators, [X] are on track to meet targets — that's the green zone" |
| Activities This Month | "This month alone, [X] activities have been reported" |
| Budget Burn Rate | "We've used [51%] of our total budget — healthy financial management" |

### Results Framework / Thematic Areas
> "Below the KPIs, we can see performance broken down by thematic area — GBV Response, Child Protection, STEPS Program. Color coding makes it instantly clear which areas need attention:
> - Green means we're on track (≥70%)
> - Yellow means watch closely (40–69%)
> - Red means action needed (below 40%)"

### Charts (if visible)
> "These charts automatically update as new data is entered. No manual refreshing needed."

**Key message to deliver:**
> "What used to take a reporting officer 2 days to compile is now visible in real-time, all the time."

---

## DEMO STEP 3 — Projects Module

**Say this:**
> "Now let me show you how projects are managed. This replaces the project tracking sheet that used to live in email attachments."

**Show this:**
1. Click **Projects** in the sidebar
2. Point to the project list

**Talk through while showing:**
- "Each project has a donor, timeline, budget, and status"
- "The burn rate column shows financial health — color-coded so you can spot issues immediately"
- Click on one project to open details
- "In the detail view, you can see related indicators and activities — everything is connected"

**For a full demo, show the Create Project form:**
> "Adding a new project is a simple form. All fields are validated — the system won't accept incomplete submissions."

---

## DEMO STEP 4 — Indicator Tracking (ITT)

**Say this:**
> "This is one of the most important modules — the Indicator Tracking Table. It's the digital version of the M&E framework you're familiar with from donor reports."

**Show this:**
1. Click **Indicators** in the sidebar
2. Point to the 2-row table header

**Talk through:**
- "Indicators are organized by thematic area, just like the Results Framework"
- "For each indicator, you can see the Life of Project target, annual target, and quarterly breakdowns — Q1 through Q4"
- "The system automatically calculates the achievement percentage and variance"
- Point to a colored progress bar: "Green means we're hitting our target. Red means we need to act."

**Key talking point:**
> "Previously, tracking variance against quarterly targets required manual Excel formulas. Here it's automatic and always up to date."

---

## DEMO STEP 5 — Activity Tracking (ATT)

**Say this:**
> "The Activity Tracking module is where field staff record what was actually done and who was served."

**Show this:**
1. Click **Activities** in the sidebar
2. Click on one activity to view details

**Demonstrate disaggregation:**
> "This is where the system really shines for donor reporting. For every single activity, we capture beneficiaries broken down by:
> - Community type: Refugee vs. Host Community
> - Gender: Male vs. Female
> - Age group: Children (0–17), Adults (18–49), Elderly (50+)
> - Nationality: Sudanese, Congolese, South Sudanese, Others"

**Then show the New Activity Form:**
1. Click **New Activity Report** in the sidebar
2. Show the disaggregation input grid

> "And here's the key feature — as staff enter numbers, the system auto-calculates all totals. If the nationality total doesn't match the refugee total, the system flags it. Built-in data quality checks."

---

## DEMO STEP 6 — Case Management

**Say this:**
> "This module handles something particularly sensitive — GBV and child protection cases. It's built with confidentiality in mind."

**Show this:**
1. Click **Cases** in the sidebar

**Talk through:**
- "Each case has a unique ID, an assigned case worker, services provided, and a follow-up date"
- Point to red-highlighted rows: "Rows in red mean follow-up is overdue — the system automatically alerts case workers"
- "Case types cover the full spectrum of services: psychosocial support, medical referral, legal aid, and more"
- "Once a case is resolved, it moves to Closed status and contributes to the closure rate statistics"

**Key message:**
> "This replaces paper-based case files. Everything is searchable, trackable, and confidential."

---

## DEMO STEP 7 — Monthly Tracking

**Say this:**
> "For program managers and M&E officers, the Monthly Tracking module provides a time-dimension view of all activities."

**Show this:**
1. Click **Monthly Tracking** in the sidebar
2. Show the calendar

**Talk through:**
- "Activities are displayed on the calendar by date — easy to see which months were busy and which were slow"
- "The year tabs at the top let you switch between 2024, 2025, and 2026 — multi-year tracking built in"
- "Quarterly summaries aggregate totals for budget, beneficiaries, and activities per quarter"
- "One click to export the monthly report to Excel — ready for donor submission"

---

## DEMO STEP 8 — User Management and Security (Admin audience)

**Say this:**
> "The system supports multiple users with controlled access. Let me show you how that works."

**Show this:**
1. Click **Users** in the sidebar (Admin only)
2. Show the user list

**Talk through the 4 roles:**

| Role | What they can do |
|------|-----------------|
| **Administrator** | Full access — user management, audit logs, all modules |
| **Manager** | All data access, create/edit projects and indicators |
| **Data Entry** | Create and submit activity reports |
| **Viewer** | Read-only — perfect for donors or board members |

> "This means a field data entry officer cannot accidentally edit project budgets. And a donor given Viewer access can see performance data but cannot change anything."

**Show audit log (if accessible):**
> "Every action in the system is logged — who made a change, when, and what they changed. Full accountability."

---

## DEMO STEP 9 — Data Export and Reports

**Say this:**
> "Finally, one of the most useful features for reporting — one-click data export."

**Show this:**
1. Go to Activities module
2. Click Export button — show file downloading

> "Every module has an Export button. Activities, indicators, monthly tracking — all export to Excel or CSV, formatted and ready to paste into donor reports."

---

---

# PART 3: CLOSING THE PRESENTATION

## Closing Summary

**Say this:**
> "Let me summarize what you've just seen:
>
> - A **secure, role-based system** that gives every staff member the right level of access
> - A **real-time dashboard** for leadership to monitor performance without waiting for reports
> - A **complete indicator tracking** system aligned with the M&E framework
> - **Automatic disaggregation** — every beneficiary counted by gender, age, community type, and nationality
> - **Case management** with confidentiality and follow-up alerting for GBV and child protection
> - **One-click exports** that turn six manual reporting days into minutes
>
> This is not a prototype. This is a production-ready system running live data today."

---

## Key Messages to Leave Behind

1. **"Single source of truth"** — All M&E data in one place, always up to date
2. **"Built for the work"** — Designed specifically for humanitarian programs with refugee populations
3. **"Saves reporting time"** — What took days now takes minutes
4. **"Data quality built in"** — Validation and checks prevent errors at the point of entry
5. **"Grows with you"** — New projects and indicators can be added at any time

---

## Handling Common Questions

**Q: What happens if the internet goes down?**
> "The system runs on your local server or a cloud server. For field offices with limited connectivity, data can be pre-loaded and synced. The architecture supports both local and hosted deployment."

**Q: How is GBV case data kept confidential?**
> "Cases are not linked to publicly identifiable information. Access is restricted to authorized case workers and managers. Audit logs track who accesses case records."

**Q: Can we connect this to KoboToolbox or PowerBI?**
> "Yes. The system has a RESTful API that allows integration with data collection tools like KoboToolbox and visualization tools like PowerBI. This is documented in our integration guide."

**Q: What if a donor wants access to see our reports?**
> "We can create a Viewer account for them — read-only access to dashboards and exports, but no ability to edit anything."

**Q: Can we add new indicators or thematic areas?**
> "Absolutely. The system is fully configurable. New indicators, thematic areas, and projects can be added through the user interface without any technical changes."

**Q: Who owns the data?**
> "AWYAD owns all data. The system is hosted on AWYAD-controlled infrastructure. No data leaves your servers without your explicit export action."

---

## Q&A Facilitation Tips

- Keep answers **short and concrete** — reference what they just saw in the demo
- If you don't know the answer, say: *"Let me check that and follow up with you after the session"*
- For technical questions from a non-technical audience, redirect: *"That's a great technical question — what matters for you is that it works reliably and securely, which I've just demonstrated"*
- Invite feedback: *"What would make this more useful for your team's workflow?"*

---

---

# APPENDIX A: Quick Demo Script (15–20 minutes)

For tight schedules, cover only these steps:

| Time | Step | Key Message |
|------|------|-------------|
| 0:00–1:00 | Login | "Secure, role-based access" |
| 1:00–4:00 | Dashboard | "Real-time KPIs — no more manual reports" |
| 4:00–7:00 | Indicator Tracking (ITT) | "Every indicator tracked against quarterly targets automatically" |
| 7:00–11:00 | Activity Tracking (ATT) | "Full beneficiary disaggregation at the click of a form" |
| 11:00–13:00 | Case Management | "Confidential, tracked, alerted" |
| 13:00–15:00 | Export to Excel | "One click — donor-ready" |
| 15:00–20:00 | Questions | — |

---

# APPENDIX B: Full Walkthrough Script (60 minutes)

| Time | Step | Focus |
|------|------|-------|
| 0:00–5:00 | Opening & context | The problem we solve |
| 5:00–10:00 | Login + Dashboard | Overview of KPIs and charts |
| 10:00–15:00 | Projects module | Create/view/edit project |
| 15:00–25:00 | Indicator Tracking (ITT) | Full table, variance, quarterly data |
| 25:00–35:00 | Activity Tracking (ATT) | New activity form + disaggregation |
| 35:00–42:00 | Case Management | Create case, follow-up alerts |
| 42:00–47:00 | Monthly Tracking | Calendar, year switching, export |
| 47:00–52:00 | User Management | Create users, role restrictions |
| 52:00–55:00 | Exports | Download all report types |
| 55:00–60:00 | Q&A | Open questions |

---

# APPENDIX C: Audience-Specific Talking Points

### For Donors / Funding Partners
Focus on: **Accountability, disaggregation, financial tracking**
- "Your funding is tracked in real-time — budget vs. expenditure for every project"
- "Every beneficiary is counted and disaggregated — gender, age, nationality, community type"
- "If you want a progress update, we can generate an export in under 60 seconds"

### For Program Managers
Focus on: **Efficiency, decision-making speed**
- "No more collecting Excel files from 5 field offices — everyone enters data in one system"
- "You can see which activities are behind schedule and which indicators need attention before the end of the quarter"

### For Field Staff / Data Entry Officers
Focus on: **Ease of use, data entry form**
- "The mobile-responsive design means you can update records from a tablet in the field"
- "The form auto-calculates totals — you don't need to do any math"
- "If you make a mistake, a Manager can correct it — nothing is permanently lost"

### For M&E Officers
Focus on: **Indicator framework, reports**
- "The ITT structure matches your existing M&E framework exactly"
- "Quarterly targets are tracked automatically — no manual variance calculation"
- "Exports are formatted for direct use in donor reports"

---

*Presentation Guide Version 1.0 — AWYAD MES System — March 2026*
