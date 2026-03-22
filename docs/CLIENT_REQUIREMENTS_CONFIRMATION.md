# AWYAD MES - Requirements Confirmation Document
**Date:** January 22, 2026  
**Meeting:** Post-Presentation Feedback Session  
**Purpose:** Confirm our understanding of requested changes

---

Dear AWYAD Team,

Thank you for the valuable feedback from yesterday's presentation. We've carefully reviewed all your requirements and have documented our understanding below. Please review this document to ensure we're aligned before we begin implementation.

---

## 1. Dashboard Improvements

### What We Understood:

**Current Issue:**
- The dashboard shows only overall AWYAD perspective
- Projects don't have their own dedicated dashboards
- The hierarchy doesn't match your organizational structure

**What We'll Build:**

✅ **AWYAD Strategic Dashboard** - Reorganized to show:
- **Strategies** (Top level)
  - **Pillars** (Second level)
    - **Core Program Components** (Third level)
      - **Core Program Interventions** (stored as details within each component)
      - **Implementation Approaches** (stored as details within each component)
    - **AWYAD Indicators** (Strategic/Overall indicators)
  - **Projects** (Linked to core program components)
    - **Project Indicators** (Project-specific)

**Note:** Core Program Interventions and Implementation Approaches will be stored as flexible lists within each Core Program Component, making them easy to add/edit without complex database structures.

✅ **Individual Project Dashboards** - Each project will have:
- Project metadata (name, donor, budget, timeline, locations)
- Only that project's specific indicators
- Project activities and progress
- Financial tracking (budget vs expenditure)
- Cases linked to the project
- Project team members

**Questions for You:**
1. Do you have the Strategies and Pillars already defined, or should we work together to set them up?
2. How many Core Program Components do you typically have?
3. For each Core Program Component, can you provide the list of Interventions and Implementation Approaches?

---

## 2. Indicator System Changes

### What We Understood:

**Current Issue:**
- System only has project indicators
- No distinction between AWYAD-level and project-level indicators
- Thematic Areas vs Result Areas confusion
- Missing Q4 in quarterly breakdown
- Confusion about "LOP" meaning
- Issue with percentages showing as numbers (e.g., IND-016 showing 5,223 instead of 5,223%)

**What We'll Build:**

✅ **Two Types of Indicators:**

**AWYAD Indicators:**
- Overall/strategic indicators not tied to one project
- Linked to **Thematic Areas**
- Can aggregate from multiple project indicators

**Project Indicators:**
- Specific to individual projects
- Linked to **Result Areas** (not Thematic Areas)
- Can contribute to AWYAD indicators

✅ **Enhanced Indicator Form:**
- Indicator Scope: AWYAD or Project (radio buttons)
- Result Area (for project indicators) - dropdown
- Thematic Area (for AWYAD indicators) - dropdown  
- Indicator Level: Output / Outcome / Impact
- Data Type: Number or Percentage (to fix the display issue)
- LOP Target (Life of Project Target) - with clear label
- Annual Target
- Q1, Q2, Q3, **Q4** Targets (all four quarters)
- Baseline Value and Date

✅ **Smart Display:**
- If indicator is marked as "Percentage": shows "85%" 
- If indicator is marked as "Number": shows "5,223 individuals"

✅ **One Unified Form:**
We'll use a single indicator form that dynamically adjusts based on your selection:
- Select "AWYAD Indicator" → Form shows Thematic Area field
- Select "Project Indicator" → Form shows Project and Result Area fields
- All other fields remain the same
- This keeps the user experience consistent and simple

**Questions for You:**
1. Should we migrate your existing indicators - which ones are AWYAD vs Project?
2. Can you share a list of your Result Areas vs Thematic Areas?
3. Do you have existing AWYAD indicators that project indicators should link to?

---

## 3. Activity Tracking Enhancements

### What We Understood:

**Current Issues:**
- Some activities are done but not costed
- Currency is hardcoded to UGX only
- No way to track when extra budget comes from another project
- Gender only has Male/Female options
- No disability tracking

**What We'll Build:**

✅ **Non-Costed Activities:**
- Checkbox: "Is this activity costed?" (Yes/No)
- If No, budget fields become optional

✅ **Multi-Currency Support:**
- Currency dropdown with options: **UGX (Default)**, USD, EUR, GBP
- Note: System currently only supports USD; we'll add the others with UGX as the new default
- Exchange rates updated regularly (weekly or as configured)
- Reports can show in any currency
- All financial tracking shows original + converted currency
- Consolidated reports will use UGX as the base currency

✅ **Budget Transfers Between Projects:**

**The Scenario:**
Sometimes an activity in Project A runs out of money, but you need to complete it. You can transfer funds from Project B to help finish the activity.

**What We'll Track:**
- Source Project (where money comes from)
- Destination Activity/Project (where money goes to)
- Amount and Currency
- Transfer Date
- Reason for transfer
- Approval records

**Example:**
```
Project A: GBV Response
  Activity: Community Training
    Original Budget: $5,000 (spent)
    Transfer In: +$2,000 (from Project B)
    Total Available: $7,000

Project B: Child Protection
    Original Budget: $50,000
    Transfer Out: -$2,000 (to Project A)
    Remaining: $48,000
```

**Reporting:**
- Both projects show the transfer in their financial reports
- Audit trail maintained for all fund movements
- Budget calculations: Original ± Transfers = Total Available

✅ **Enhanced Gender Options:**
- Male
- Female
- Other
- Prefer not to say

✅ **Disability Tracking:**
- Separate count for People with Disabilities (PWDs)
- PWDs broken down by: Male, Female, Other
- Included in total beneficiary count
- Separate disability-focused reports available

**Questions for You:**
1. What exchange rate frequency works for you (daily/weekly/monthly)?
2. Should budget transfers require approval before they're recorded?

---

## 4. Case Management Overhaul

### What We Understood:

**Current Issues:**
- Case Name field exists (privacy concern)
- Need Case Type and Case Categories structure
- Missing referral tracking (both directions)
- "Case Description" should be "Support Offered"
- Cases need dynamic tracking options

**What We'll Build:**

✅ **Privacy Protection:**
- **Remove:** All name fields from case records
- Cases tracked by Case Number only

✅ **Case Type & Categories:**
- Configurable Case Types (e.g., GBV, Child Protection, etc.)
- Each Type has multiple Categories
- Admin can add/edit these without coding

✅ **Dual Referral Tracking:**
- **Referred From:** Which partner/organization sent the case to you
- **Referred To:** Which partner you referred the case to
- Referral Date
- Both fields visible in case records and reports

✅ **Terminology Change:**
- ~~"Case Description"~~ → **"Support Offered"**
- Multi-line text field for confidential service notes

✅ **Dynamic Tracking:**
- Filter cases by: Project, Location, Case Type, Status
- Custom tags for flexible categorization
- Track cases across multiple dimensions simultaneously

**Detailed Case Form Fields:**
- Case Number (auto-generated)
- Case Type (dropdown - configurable)
- Case Category (dropdown - based on type)
- Date Reported
- Project (dropdown)
- Location (dropdown)
- Age Group, Gender, Nationality
- Disability Status (Yes/No)
- Status (Open/In Progress/Closed)
- Referred From (partner name)
- Referred To (partner name)
- Referral Date
- Support Offered (text area)
- Services Provided (checkboxes)
- Follow-up Date
- Case Worker

**Questions for You:**
1. Can you provide your current Case Types and Categories list?
2. Should we import existing case data, or start fresh?

---

## 5. Monthly Tracking Enhancements

### What We Understood:

**Current Issues:**
- Can't track by specific projects
- Can't drill down to individual activities
- No Reach vs Target comparison
- Only financial burn rate available, no performance rates

**What We'll Build:**

✅ **Project-Based Tracking:**
- Filter by one or multiple projects
- Compare performance across projects
- Project-specific monthly trends

✅ **Activity Drill-Down:**
- Click on any indicator to see underlying activities
- Activity-level completion tracking
- Activity-specific reach vs target

✅ **Reach vs Target Visualization:**
```
Example Display:
────────────────────────────────
Indicator: GBV Survivors Supported
Target:    550 individuals
Reached:   467 individuals  
Gap:       83 (15% short)
Progress:  ████████████████░░░ 85%
────────────────────────────────
```

✅ **Four Performance Rates:**

1. **Programmatic Performance Rate**
   - Formula: (Achieved / Target) × 100
   - Shows: Are we meeting our indicator targets?

2. **Activity Completion Rate**
   - Formula: (Completed Activities / Planned Activities) × 100
   - Shows: Are we completing planned activities on time?

3. **Beneficiary Reach Rate**
   - Formula: (Actual Beneficiaries / Target Beneficiaries) × 100
   - Shows: Are we reaching enough people?

4. **Financial Burn Rate** (existing)
   - Formula: (Expenditure / Budget) × 100
   - Shows: Are we spending as planned?

**Dashboard Display:**
```
Performance Rates Summary
─────────────────────────────────
Metric                  Rate    Status
─────────────────────────────────
Programmatic           85%     ✓ Good
Activity Completion    78%     ⚠ Fair
Beneficiary Reach      92%     ✓ Good
Financial Burn         62%     ✓ Good
─────────────────────────────────
```

**Questions for You:**
1. What thresholds should we use for Good/Fair/Poor ratings?
2. Do you want weekly or monthly snapshots?

---

## 6. User Management & Roles

### What We Understood:

**Your Team Structure:**

**Programs Department:**
- Project Coordinator

**M&E Department:**
- M&E Officer
- M&E Assistant

**Finance Department:**
- Finance Officer
- Finance Assistant

**What We'll Build:**

✅ **Defined Roles with Permissions:**

| Role | Key Permissions | Data Scope |
|------|----------------|------------|
| **Project Coordinator** | Create/edit activities, manage project team, view reports | Assigned projects only |
| **M&E Officer** | Create/edit indicators, approve data, generate all reports, full system access | All projects |
| **M&E Assistant** | Enter data, view reports, basic analysis | All projects (read-only on approvals) |
| **Finance Officer** | Approve budgets, track expenditure, financial reports, budget transfers | All projects |
| **Finance Assistant** | Enter expenditure data, view financial reports | Assigned projects only |
| **System Administrator** | All system access, user management, configurations | Entire system |
| **Executive Management** | View all dashboards and reports | Strategic view (no data entry) |

**Questions for You:**
1. Should Project Coordinators be able to view other projects' data?
2. Do you need additional roles beyond these?

---

## 7. Non-Program Activities

### What We Understood:

**Current Issue:**
- No way to track activities not tied to projects
- These activities don't need indicators

**Your Non-Program Categories:**
1. Partnerships
2. Communications
3. Advocacy
4. HR (Human Resources)
5. ED Office (Executive Director's Office)
6. Logistics and Procurement

**What We'll Build:**

✅ **Separate Non-Program Activities Module:**
- Independent from projects and indicators
- Simple tracking: Activity, Target, Achieved
- No budget/financial tracking (unless you need it?)
- Status tracking (Planned/In Progress/Completed)

**Simple Entry Form:**
- Category (dropdown: Partnerships, Communications, etc.)
- Activity Name
- Description
- Planned Date
- Completion Date
- Target (e.g., "5 partnerships" or "3 events")
- Achieved (e.g., "4 partnerships" or "2 events")
- Unit (what are you measuring)
- Status
- Notes

**Reporting:**
- Category-wise summary
- Monthly completion tracking
- Achievement vs target analysis
- No linkage to programmatic indicators

**Questions for You:**
1. Do non-program activities need budget tracking?
2. Are there other categories we should include?

---

## 8. Configurable Data Support

### What We Understood:

**Current Issue:**
- Partner names, case types, and other reference data are hardcoded
- You need to add/edit these without developer help

**What We'll Build:**

✅ **Admin Configuration Panel:**

Users with admin rights can configure:
- **Partners/Organizations** (for referrals)
- **Case Types** (configurable list)
- **Case Categories** (linked to types)
- **Service Types** (for cases and activities)
- **Locations** (project locations)
- **Donor Organizations** (configurable list)
- **Beneficiary Categories**
- **Activity Types**
- **Any other lookup data you need**

✅ **Configuration Features:**
- Add new entries
- Edit existing entries
- Deactivate (not delete) entries
- Reorder display sequence
- Search and filter
- Import from CSV
- Export current configuration

**Example Use Case:**
```
If a new partner starts working with you:
1. Admin logs in
2. Goes to "System Configuration" → "Partners"
3. Clicks "Add New Partner"
4. Enters: Partner Name, Contact Info, Description
5. Saves
6. Partner immediately appears in all referral dropdowns
```

**Questions for You:**
1. Who should have access to manage configurations?
2. Should configuration changes be logged/audited?

---

## 9. Additional Data Points

### What We Understood:

Based on your feedback, we'll also enhance:

✅ **Disaggregation by Age Groups:**
- 0-4 years (Male, Female, Other)
- 5-17 years (Male, Female, Other)
- 18-49 years (Male, Female, Other)
- 50+ years (Male, Female, Other)

✅ **Disaggregation by Nationality:**
- Refugee: Sudanese, Congolese, South Sudanese, Other
- Host Community (Nationals)

✅ **Enhanced Location Tracking:**
- By settlement/location
- By community type (Refugee/Host)

**Questions for You:**
1. Are these the correct age groups you use?
2. Any other nationalities we should add?

---

## Implementation Timeline

**Total Duration:** 8 Weeks

### Phase 1: Foundation (Weeks 1-2)
- Database updates for all new features
- Configurable data system setup
- User roles and permissions

### Phase 2: Core Features (Weeks 3-4)
- New dashboard hierarchy
- Two-tier indicator system
- Case management overhaul

### Phase 3: Advanced Features (Weeks 5-6)
- Multi-currency and budget transfers
- Monthly tracking with performance rates
- Non-program activities module

### Phase 4: Testing & Launch (Weeks 7-8)
- System testing
- User training
- Data migration
- Go-live

**Would you prefer a different timeline or phasing?**

---

## What We Need From You

To proceed efficiently, we'll need:

1. ✅ **Confirmation** that our understanding above is correct
2. 📋 **Lists/Data:**
   - Strategies and Pillars definitions
   - Result Areas list
   - Thematic Areas list
   - Case Types and Categories
   - Partner organizations
   - Current locations list
3. 🔑 **Decisions:**
   - Approval workflow for budget transfers?
   - Exchange rate update frequency?
   - Performance rate thresholds (Good/Fair/Poor)?
   - Who gets admin access to configurations?
4. 📊 **Sample Data** (if available):
   - Example of AWYAD indicators vs Project indicators
   - Sample case data (anonymized)
5. 👥 **Access:**
   - List of users and their intended roles
   - Primary contacts for each department (Programs, M&E, Finance)

---

## Next Steps

1. **You Review:** Please review this document and provide feedback
2. **We Clarify:** We'll address any questions or concerns
3. **Final Sign-Off:** Once aligned, we'll get formal approval
4. **Implementation Begins:** We start Phase 1 development
5. **Weekly Updates:** We'll provide progress updates every Friday

---

## Questions or Concerns?

Please review each section and let us know:
- ✅ Correct - we got it right
- 📝 Needs clarification - tell us what's unclear
- ❌ Incorrect - tell us what we misunderstood
- ➕ Missing - anything we didn't capture

**We want to ensure we build exactly what you need!**

---

## Contact

**Development Team Lead:** [Your Name]  
**Email:** [Your Email]  
**Phone:** [Your Phone]

**Best time to reach us:** Monday-Friday, 9 AM - 5 PM

---

**Thank you for your partnership. We're excited to build a system that truly meets AWYAD's needs!**

---

*This document serves as our requirements confirmation. Once approved, it will guide our development process and serve as a reference point for all stakeholders.*

**Status:** ⏳ Awaiting AWYAD Review and Approval  
**Version:** 1.0  
**Date:** January 22, 2026
