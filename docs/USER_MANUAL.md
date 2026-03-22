# AWYAD M&E System - User Manual

**Version:** 2.0.0  
**Last Updated:** January 20, 2026  
**Organization:** AWYAD (Association for Women and Youth in Action for Development)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Projects Management](#projects-management)
5. [Indicator Tracking (ITT)](#indicator-tracking-itt)
6. [Activity Tracking (ATT)](#activity-tracking-att)
7. [Case Management](#case-management)
8. [Monthly Tracking](#monthly-tracking)
9. [Data Entry Forms](#data-entry-forms)
10. [Reports and Export](#reports-and-export)
11. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

### About AWYAD M&E System

The AWYAD Monitoring and Evaluation (M&E) System is a comprehensive platform designed to track and manage:
- **Projects** across multiple donors and thematic areas
- **Indicators** with targets and achievement monitoring
- **Activities** with beneficiary disaggregation
- **GBV Cases** with service tracking and follow-up
- **Monthly Progress** with calendar views and quarterly summaries

### Key Features

✅ **Real-time Dashboard** - Live KPIs and performance metrics  
✅ **Beneficiary Disaggregation** - Track by gender, age, community type, nationality  
✅ **Budget Tracking** - Monitor expenditure and burn rates  
✅ **Multi-year Data** - Automatic year detection and historical tracking  
✅ **Data Export** - Excel export for all modules  
✅ **Visual Analytics** - Charts and graphs for data visualization  

---

## 2. Getting Started

### System Access

1. **URL:** `http://localhost:3001` (or your deployed URL)
2. **Login Credentials:**
   - Username: `admin`
   - Password: `password123` (change on first login)

### Navigation

The system uses a **sidebar menu** with the following sections:

| Menu Item | Purpose |
|-----------|---------|
| 🏠 **Dashboard** | Overview of all KPIs and performance |
| 📁 **Projects** | Manage projects, budgets, and donors |
| 📊 **Indicator Tracking (ITT)** | Monitor indicators and targets |
| ✅ **Activity Tracking (ATT)** | Track activities and beneficiaries |
| 💼 **Case Management** | GBV case registration and follow-up |
| 📅 **Monthly Tracking** | Calendar view and monthly breakdown |
| ➕ **New Activity Report** | Quick activity entry form |
| 📖 **Demo Guide** | System tutorials and help |

### Sidebar Toggle

- Click the **☰ menu button** (top-left) to collapse/expand the sidebar
- Useful for viewing more data on smaller screens

---

## 3. Dashboard Overview

### Summary Cards

The dashboard displays 4 key metrics:

1. **Active Projects** - Total number of ongoing projects
2. **Indicators On-Track** - Indicators achieving ≥70% of target
3. **Activities This Month** - Activities planned/completed this month
4. **Budget Burn Rate** - Percentage of budget spent

### Charts

#### Indicator Performance
- **Type:** Bar chart
- **Shows:** Top 10 indicators comparing target vs achieved
- **Color Coding:**
  - 🟢 Green: >100% achievement
  - 🟡 Yellow: 70-100% achievement
  - 🔴 Red: <70% achievement

#### Beneficiaries by Community Type
- **Type:** Pie chart
- **Shows:** Distribution between Refugee and Host communities
- **Data Source:** Sum of all activity beneficiaries

#### Gender Distribution
- **Type:** Pie chart
- **Shows:** Male vs Female beneficiaries
- **Data Source:** Aggregated from all activities

### Thematic Areas Overview

Shows progress for each thematic area:
- **Progress bar** indicates % of indicators on-track
- **Badge** shows number of projects
- **Text** shows indicator count (on-track / total)

### Results Framework Summary Table

Displays all indicators with:
- **Code:** Unique identifier
- **Indicator Name:** Full description
- **Type:** Outcome/Output
- **Annual Target:** Year-end goal
- **Achieved:** Current achievement
- **% Achieved:** Progress percentage
- **Progress Bar:** Visual representation

---

## 4. Projects Management

### Overview

Track all projects with budgets, expenditure, and performance metrics.

### Summary Cards

1. **Total Projects** - All projects in database
2. **Active Projects** - Currently running projects
3. **Total Budget** - Combined budget across all projects
4. **Avg Burn Rate** - Average spending percentage

### Charts

1. **Budget vs Expenditure** - Bar chart comparing budget to spending
2. **Top 10 Projects** - Projects ranked by budget size
3. **Overall Budget Utilization** - Pie chart of budget allocation
4. **Burn Rate Gauge** - Visual indicator of financial health

### Projects Table

Columns:
- **Project Name** - Full project title
- **Donor** - Funding organization
- **Thematic Area** - Strategic result area
- **Status** - Active/Planning/Completed/On Hold
- **Budget** - Total allocated funds
- **Expenditure** - Amount spent to date
- **Burn Rate** - Spending percentage with progress bar
- **Actions** - Edit/View buttons

### Adding a New Project

1. Click **Projects** in sidebar
2. Click **+ New Project** button
3. Fill in required fields:
   - Project Name (required)
   - Donor (required)
   - Thematic Area (select from dropdown)
   - Start Date (required)
   - End Date (must be after start date)
   - Budget (in USD)
   - Location
   - Status
4. Click **Save Project**

### Editing a Project

1. Click **✏️ Edit** button in Actions column
2. Modify fields as needed
3. Click **Update Project**
4. Budget and expenditure changes update burn rate automatically

---

## 5. Indicator Tracking (ITT)

### Overview

Monitor progress towards strategic results and performance targets.

### Summary Cards

1. **Total Indicators** - All indicators being monitored
2. **On Track** - Indicators with ≥70% achievement
3. **At Risk** - Indicators with 40-69% achievement
4. **Off Track** - Indicators with <40% achievement

### Charts

#### Achievement Overview
- **Type:** Bar chart
- **Shows:** Target vs Achieved for top 10 indicators
- **Sorting:** By achievement value (descending)

#### Quarterly Progress ⚠️
- **Type:** Line chart
- **Shows:** Target vs Achieved by quarter
- **Note:** Currently shows estimated distribution
- **Flat Line Issue:** Occurs when quarterly targets (Q1, Q2, Q3) are not set
- **Solution:** Quarterly data entry coming in future update

#### Cumulative Performance
- **Type:** Area chart
- **Shows:** Cumulative achievement over time

### Results Framework Table

Displays all indicators grouped by thematic area:

**Columns:**
- **Code** - Indicator ID
- **Indicator Name** - Full description
- **Type** - Outcome/Output/Impact
- **Baseline** - Starting value
- **Targets:**
  - LOP (Life of Project)
  - Annual
  - Q1, Q2, Q3 (Quarterly)
- **Achieved** - Current value
- **Variance** - Difference from target
- **Progress** - Visual bar with percentage
- **Actions** - Edit/View buttons

**Color Coding:**
- 🟢 **Green progress bar:** ≥70% (On Track)
- 🟡 **Yellow progress bar:** 40-69% (At Risk)
- 🔴 **Red progress bar:** <40% (Off Track)

### Quarterly Breakdown Section

Shows estimated quarterly distribution:
- **Q1, Q2, Q3, Q4** cards
- **Target** - Expected achievement
- **Achieved** - Actual progress
- **Percentage** - Achievement rate
- **Note:** System estimates based on annual totals until monthly tracking enabled

### Adding/Updating Indicators

1. Navigate to **Indicator Tracking (ITT)**
2. Click **+ New Indicator** button
3. Fill in details:
   - Code (e.g., IND-001)
   - Name (full description)
   - Type (Outcome/Output)
   - Thematic Area
   - Baseline value
   - Targets (LOP, Annual, Quarterly)
   - Unit of measurement
4. Click **Save Indicator**

### Updating Achievement

1. Find indicator in table
2. Click **✏️ Edit** button
3. Update **Achieved** field
4. System automatically:
   - Calculates percentage
   - Updates progress bar color
   - Adjusts variance
   - Reflects in all dashboards

---

## 6. Activity Tracking (ATT)

### Overview

Track all field activities with beneficiary disaggregation and budget tracking.

### Summary Cards

1. **Total Activities** - All activities in database
2. **Completed** - Activities marked as complete
3. **Total Beneficiaries** - Sum of all beneficiaries reached
4. **Total Budget** - Combined activity budgets

### Activity Table

**Columns:**
- **Activity Code** - Unique identifier
- **Activity Name** - Description
- **Project** - Associated project
- **Indicator** - Linked indicator
- **Location** - Implementation site
- **Date** - Planned/completion date
- **Status** - Planned/In Progress/Completed
- **Beneficiaries** - Total count with breakdown
- **Budget** - Allocated amount
- **Actions** - Edit/View buttons

### Beneficiary Disaggregation

Each activity tracks:

**By Community Type:**
- 🏕️ **Refugee:** Male, Female (by age group)
- 🏘️ **Host Community:** Male, Female (by age group)

**Age Groups:**
- 0-4 years
- 5-17 years
- 18-49 years
- 50+ years

**By Nationality:**
- Sudanese
- Congolese
- South Sudanese
- Others

### Adding a New Activity

**Option 1: New Activity Report (Quick Entry)**
1. Click **New Activity Report** in sidebar
2. Fill in form sections:
   - **Basic Information:**
     - Project (dropdown)
     - Indicator (dropdown)
     - Activity Name
     - Description
     - Location
   - **Dates:**
     - Planned Date (required)
     - Completion Date (if completed)
   - **Beneficiary Disaggregation:**
     - Enter counts by gender, age, community type
   - **Budget:**
     - Allocated Budget
     - Actual Cost (if spent)
3. Click **Save Activity**
4. System auto-calculates totals

**Option 2: Activity Tracking Page**
1. Navigate to **Activity Tracking (ATT)**
2. Click **+ New Activity** button
3. Follow same form as above

### Editing an Activity

1. Find activity in table
2. Click **✏️ Edit** button
3. Modify any fields
4. Disaggregation updates:
   - Change any age/gender values
   - Totals recalculate automatically
5. Click **Update Activity**

### Understanding the Data

**Total Beneficiaries Calculation:**
```
Total = Refugee (Male + Female, all ages) 
      + Host (Male + Female, all ages)
```

**Burn Rate Calculation:**
```
Burn Rate = (Actual Cost / Budget) × 100%
```

---

## 7. Case Management

### Overview

Manage GBV (Gender-Based Violence) cases with service tracking and follow-up.

### Summary Cards

1. **Total Cases** - All registered cases
2. **Open Cases** - Currently active cases
3. **Closed Cases** - Completed cases
4. **Follow-up Required** - Cases needing attention

### Tabs

#### Active Cases
Shows ongoing cases with:
- Case Number (GBV-XXXX format)
- Case Type
- Services Provided
- Date Reported
- Location
- Status
- Actions

**Case Types:**
- GBV Case Management
- Psychosocial Support
- Legal Support
- Medical Referral
- Child Protection
- SEA (Sexual Exploitation and Abuse)
- Case Conferencing
- Multi-sectoral Support
- PEP Access
- Safe House Accommodation

#### Closed Cases
Shows completed cases with:
- Case Number
- Case Type
- Services Provided
- Date Closed
- Location
- Actions

### Registering a New Case

1. Navigate to **Case Management**
2. Click **+ New Case** button
3. Fill in case details:
   - **Case Number** - Auto-generated (GBV-XXXX)
   - **Case Type** - Select from dropdown
   - **Severity** - Low/Medium/High/Critical
   - **Status** - Open/Closed/Follow-up Required/Referred
   - **Date Reported**
   - **Location** - Settlement/area
   - **Services Provided** - Multi-select
   - **Beneficiary Information:**
     - Age
     - Gender
   - **Follow-up Date** (if needed)
   - **Notes** - Confidential case details
4. Click **Save Case**

### Case Workflow

```
New Case Registration
    ↓
Service Provision
    ↓
Follow-up (if needed)
    ↓
Case Closure
```

### Updating Case Status

1. Find case in table
2. Click **✏️ Edit** button
3. Update:
   - Status
   - Services Provided
   - Follow-up Date
   - Closure Date (if closing)
4. Click **Update Case**

### Case Locations

The system tracks cases across 8 settlements:
- Nakivale Settlement
- Bidibidi Settlement
- Kampala Urban
- Kyaka II Settlement
- Rhino Camp
- Palabek Settlement
- Imvepi Settlement
- Kiryandongo Settlement

### Data Privacy

⚠️ **Important:** Case data is sensitive and confidential:
- Only authorized users can access Case Management
- Never include personally identifiable information in exports
- Follow organizational data protection policies

---

## 8. Monthly Tracking

### Overview

Calendar view of activities with monthly and quarterly breakdowns.

### Year Selection

**Dynamic Year Tabs:**
- System automatically detects years from activity dates
- Shows tabs for 2024, 2025, 2026 (based on data)
- Click year button to switch views
- Current year highlighted in blue

### Summary Cards

1. **Current Month** - Activities this month
2. **YTD Activities** - Year-to-date total
3. **YTD Beneficiaries** - Total reached this year
4. **YTD Budget Execution** - Total expenditure

### Calendar View

**Monthly Activity Calendar:**
- Shows all 12 months in grid
- **Activity Count** badge on each month
- **Color Coding:**
  - 🟢 Green: >2 activities (high)
  - 🟡 Yellow: 1-2 activities (moderate)
  - ⚪ White: 0 activities (none)

### Quarterly Summary

Shows 4 quarter cards (Q1, Q2, Q3, Q4):
- **Months** - Which months included
- **Activities** - Count for quarter
- **Beneficiaries** - Total reached
- **Budget** - Total spent

### Monthly Breakdown Accordion

Click on any month to expand and see:
- **Activities table** with:
  - Activity Code
  - Activity Name
  - Location
  - Refugee count
  - Host count
  - Total beneficiaries
  - Budget
  - Status
- **Monthly Total** row (highlighted)
- **Disaggregation Summary:**
  - Refugee Beneficiaries (Male/Female)
  - Host Community (Male/Female)

### Using Monthly Tracking

**To view a specific month:**
1. Select year (e.g., 2025)
2. Scroll to month cards
3. Click month name to expand
4. Review activities and totals

**To view a specific quarter:**
1. Check quarterly summary cards
2. Compare performance across quarters
3. Identify trends

**To export monthly data:**
1. Click **Export Monthly Report** button
2. System generates Excel file
3. Includes all activities for selected year

---

## 9. Data Entry Forms

### New Activity Report Form

**Best Practice for Activity Entry:**

#### Step 1: Basic Information
```
Project: [Select from dropdown]
Indicator: [Select from dropdown]
Activity Name: [Descriptive title]
Description: [Optional details]
Location: [Settlement/area]
```

#### Step 2: Dates
```
Planned Date: [Required - when activity is scheduled]
Completion Date: [Optional - when activity was completed]
Status: Planned/In Progress/Completed
```

#### Step 3: Beneficiary Disaggregation

**Refugee Community:**
- Male:
  - 0-4 years: ___
  - 5-17 years: ___
  - 18-49 years: ___
  - 50+ years: ___
- Female:
  - 0-4 years: ___
  - 5-17 years: ___
  - 18-49 years: ___
  - 50+ years: ___

**Host Community:**
- (Same structure as Refugee)

**Nationality:**
- Sudanese: ___
- Congolese: ___
- South Sudanese: ___
- Others: ___

#### Step 4: Budget
```
Budget: [Allocated amount in USD]
Actual Cost: [Amount spent - optional]
```

#### Step 5: Save
- Click **Save Activity**
- System validates all required fields
- Confirms successful save
- Redirects to Activity Tracking page

### Form Validation Rules

**Required Fields:**
- Project (must select from existing projects)
- Indicator (must select from existing indicators)
- Activity Name (minimum 5 characters)
- Planned Date (cannot be in distant past)

**Optional Fields:**
- Description
- Completion Date
- All disaggregation fields (default to 0)
- Budget (defaults to 0)
- Actual Cost

**Auto-Calculations:**
- Total beneficiaries = Sum of all disaggregation
- Burn rate = (Actual Cost / Budget) × 100%
- Variance = Achieved - Target

### Tips for Accurate Data Entry

✅ **Do:**
- Enter data as soon as activity is completed
- Double-check beneficiary counts
- Include location information
- Add notes for context
- Review totals before saving

❌ **Don't:**
- Leave required fields blank
- Enter unrealistic numbers
- Duplicate activities
- Forget to link to correct project/indicator
- Skip disaggregation data

---

## 10. Reports and Export

### Export Options

All pages have export functionality:

#### Dashboard Export
- Click **Export Report** button
- Generates Excel file with:
  - Summary metrics
  - All indicators
  - All activities
  - All cases
  - Charts as images

#### Projects Export
- Click **Export Projects** button
- Includes:
  - Project details
  - Budget breakdown
  - Expenditure tracking
  - Burn rate analysis

#### Indicators Export
- Click **Export Indicators** button
- Contains:
  - All indicator data
  - Achievement percentages
  - Variance calculations
  - Quarterly breakdown

#### Activities Export
- Click **Export Activities** button
- Features:
  - Activity details
  - Full disaggregation
  - Budget information
  - Linked projects/indicators

#### Monthly Export
- Click **Export Monthly Report** button
- Covers:
  - Selected year only
  - Monthly breakdown
  - Quarterly summaries
  - Beneficiary totals

### Report Formats

**Excel (.xlsx):**
- Multiple sheets per report
- Formatted tables
- Conditional formatting
- Chart data included

### Scheduling Reports

Currently manual export only. Future versions will include:
- Automated monthly reports
- Email delivery
- Custom report builder

---

## 11. Troubleshooting

### Common Issues

#### Issue: "Only seeing 2025 and 2026 year tabs, not 2024"
**Solution:** Hard refresh browser (Ctrl+Shift+R)
- System detects years dynamically from activity dates
- Browser cache may show old code
- Hard refresh forces reload

#### Issue: "Gender Distribution chart not showing"
**Solution:** System updated to read from activity disaggregation
- Ensure activities have male/female counts entered
- Hard refresh browser
- Check browser console (F12) for errors

#### Issue: "Quarterly Progress chart shows flat line"
**Explanation:** This is expected when quarterly targets are not set
- System shows estimated distribution
- Quarterly data entry coming in future update
- Annual progress is still accurate

#### Issue: "Project shows N/A for thematic area"
**Solution:** Project not assigned to thematic area
- Edit project
- Select thematic area from dropdown
- Save changes

#### Issue: "Budget burn rate showing 0%"
**Explanation:** No expenditure recorded
- Edit project or activity
- Enter actual cost/expenditure
- System auto-calculates burn rate

#### Issue: "Case Management showing wrong totals"
**Solution:** Hard refresh browser
- System updated field mappings
- Clear browser cache if needed

### Browser Compatibility

**Recommended Browsers:**
- ✅ Google Chrome (latest)
- ✅ Microsoft Edge (latest)
- ✅ Mozilla Firefox (latest)
- ⚠️ Safari (some features may vary)

**Not Supported:**
- ❌ Internet Explorer

### Performance Tips

**For faster loading:**
- Limit table rows with filters
- Export large datasets instead of viewing in browser
- Clear browser cache monthly
- Use modern browser version

### Getting Help

**Support Contacts:**
- System Administrator: [admin@awyad.org]
- Technical Support: [support@awyad.org]
- Training: [training@awyad.org]

**Documentation:**
- User Manual: This document
- Demo Guide: Access via sidebar menu
- API Documentation: [For developers]

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + R` | Hard refresh browser |
| `F12` | Open developer console |
| `Ctrl + F` | Search within page |
| `Esc` | Close modal dialogs |

## Appendix B: Data Dictionary

### Key Terms

**Activity:** A planned or completed program intervention with beneficiaries

**Beneficiary:** An individual who receives services from AWYAD programs

**Burn Rate:** Percentage of budget spent (Expenditure ÷ Budget × 100%)

**Disaggregation:** Breaking down beneficiary data by age, gender, community type

**Indicator:** A measurable metric tracking progress towards objectives

**LOP:** Life of Project - total target for entire project duration

**Thematic Area:** Strategic result area (e.g., GBV Response, Child Protection)

**Variance:** Difference between target and achieved (Achieved - Target)

**YTD:** Year-to-Date - cumulative from January 1 to current date

---

## Appendix C: Sample Workflows

### Workflow 1: Monthly Activity Reporting

1. **Week 1:** Plan activities for the month
   - Add activities with planned dates
   - Link to projects and indicators
   - Set beneficiary targets

2. **Throughout Month:** Implement activities
   - Update status as activities progress
   - Mark completion dates

3. **End of Month:** Record achievements
   - Enter actual beneficiary counts
   - Add disaggregation data
   - Record expenditure
   - Update indicator achievement

4. **Monthly Review:** Generate reports
   - Export monthly report
   - Review performance vs targets
   - Share with stakeholders

### Workflow 2: Quarterly Performance Review

1. **Data Verification:**
   - Check all activities completed
   - Verify beneficiary totals
   - Confirm budget spent

2. **Indicator Update:**
   - Update quarterly achievement
   - Compare to quarterly targets
   - Document variances

3. **Report Generation:**
   - Export indicator tracking report
   - Export quarterly summary
   - Prepare narrative analysis

4. **Stakeholder Meeting:**
   - Present dashboard
   - Discuss on-track/at-risk indicators
   - Plan corrective actions

---

**End of User Manual**

*For additional support or training, please contact the AWYAD M&E Team.*
