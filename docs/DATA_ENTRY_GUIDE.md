# Data Entry Guide - Step-by-Step
## How to Enter Test Data for Presentation

**System URL:** http://localhost:3001  
**Date:** January 21, 2026  
**Reference:** PRESENTATION_TEST_DATA.md

---

## 🚀 Before You Start

### Prerequisites Checklist:
- [ ] Server is running (`npm start` in terminal)
- [ ] Browser open at http://localhost:3001
- [ ] Logged in as **Admin** or **Manager** role
- [ ] PRESENTATION_TEST_DATA.md open in another window
- [ ] Calculator ready (optional - system auto-calculates)

### Important Tips:
- ✅ **Don't rush** - Take your time with each field
- ✅ **Check auto-calculations** - Watch totals update automatically
- ✅ **Verify before submit** - Review all data before clicking Submit
- ✅ **Use Tab key** - Quickly move between fields
- ⚠️ **Internet required** - Data won't save if offline
- ⚠️ **No draft save** - Must complete entry in one session

---

## 📝 Part 1: Entering Activities (30-45 minutes)

### ⚠️ CRITICAL: Use the Correct Form!

**You have TWO activity forms in the system:**

1. ❌ **Activity Tracking Table Modal** (DON'T USE for test data!)
   - Location: Activity Tracking page → "Create New Activity" button
   - Simple form - NO disaggregation by age/community/nationality
   - Only has: Male/Female/Other (basic)
   
2. ✅ **New Activity Report Form** (USE THIS ONE!)
   - Location: Left sidebar → **"New Activity Report"** menu item
   - URL shows: `#entry-form`
   - Full disaggregation with auto-calculations
   - Has: Refugee/Host, 4 age groups, nationality breakdown

**ALWAYS use the "New Activity Report" from the sidebar!**

---

### Activity 1: Psychosocial Support Session (EASIEST - Start Here!)

**Time:** ~8 minutes  
**Purpose:** Get comfortable with the form

#### Step-by-Step Instructions:

**1. Navigate to Entry Form**
- Click **"New Activity Report"** in left sidebar (look for this exact text)
- **Verify**: URL shows `#entry-form`
- **Verify**: Page title says "New Activity Report"
- Wait for form to load completely

> ⚠️ **IMPORTANT:** If you clicked "Create New Activity" from Activity Tracking page, you're in the WRONG form! Close that modal and use the sidebar link instead.

**2. Fill Basic Information Section**

| Field | What to Enter | Notes |
|-------|---------------|-------|
| **Project** | Select: "GBV Response and Protection" | Click dropdown, scroll if needed |
| **Indicator** | Select: "Number of GBV survivors receiving services" | **IMPORTANT**: Selecting indicator auto-populates thematic area |
| **Activity Name** | Type: "Group psychosocial support session - Women's Safe Space" | Copy-paste from test data OK |
| **Activity Code** | Type: "1.2.3" | OPTIONAL - M&E Framework code (you can leave blank) |
| **Location** | Select: "Nakivale" | **DROPDOWN** (if showing textbox, you're in wrong form!) |
| **Activity Date** | Select: January 15, 2026 | Click calendar icon or type 2026-01-15 |

> ⚠️ **CRITICAL**: The system auto-populates Thematic Area from your Indicator selection. You won't see this field, but it's automatically set in the background.

**3. Fill Budget Information Section**

Scroll down to "Budget Information" section:

| Field | Amount |
|-------|--------|
| **Activity Budget (USD)** | 350 |
| **Actual Expenditure (USD)** | 320 |

> 💡 **Tip:** Just type numbers, no $ symbol or commas needed

**4. Fill Beneficiary Disaggregation - Refugee Community**

**Refugee - Male Section:**
- 0-4 years: **0**
- 5-17 years: **0**
- 18-49 years: **0**
- 50+ years: **0**
- 👁️ **Watch:** Male subtotal auto-calculates to **0**

**Refugee - Female Section:**
- 0-4 years: **0**
- 5-17 years: **3**
- 18-49 years: **18**
- 50+ years: **4**
- 👁️ **Watch:** Female subtotal auto-calculates to **25**

👁️ **Watch:** Refugee Total auto-calculates to **25**

**5. Fill Beneficiary Disaggregation - Host Community**

**Host - Male Section:**
- 0-4 years: **0**
- 5-17 years: **0**
- 18-49 years: **0**
- 50+ years: **0**
- 👁️ **Watch:** Male subtotal auto-calculates to **0**

**Host - Female Section:**
- 0-4 years: **0**
- 5-17 years: **0**
- 18-49 years: **5**
- 50+ years: **2**
- 👁️ **Watch:** Female subtotal auto-calculates to **7**

👁️ **Watch:** Host Total auto-calculates to **7**

👁️ **Watch:** **Grand Total** auto-calculates to **32**

**6. Fill Nationality Breakdown (CRITICAL - Must Match!)**

Scroll to "Refugee Nationality Breakdown" section:

Enter these numbers:
- **Sudanese:** 8
- **Congolese:** 12
- **South Sudanese:** 4
- **Others:** 1

👁️ **Watch:** Yellow alert box shows "Total Nationality: **25**"

⚠️ **IMPORTANT:** This MUST equal Refugee Total (25). If it doesn't match, form will show error!

**7. Fill Narrative/Qualitative Notes (Optional)**

Scroll to "Narrative / Qualitative Notes" section:

Type (optional but recommended):
```
Weekly psychosocial support group session for GBV survivors focusing on trauma healing and coping mechanisms. Session included art therapy and peer support activities.
```

> 💡 **Note:** This field was called "Description" in the test data document but is labeled "Narrative / Qualitative Notes" in the actual form

**8. Review Before Submitting**

Check these carefully:
- ✅ All required fields filled (Project, Indicator, Activity Name, Location, Date, Budget, Expenditure)
- ✅ Grand Total = 32
- ✅ Refugee Total = 25
- ✅ Nationality Total = 25 (matches Refugee!)
- ✅ All numbers look correct

**9. Submit**
- Scroll to bottom
- Click **"Submit for Review"** button (blue)
- Wait for processing (2-3 seconds)
- ✅ **Success!** Green message should appear

> 💡 **Note:** There's also a "Save as Draft" button if you want to save and finish later (but for demo, just submit directly)

**9. Verify Entry**
- Click **"Activity Tracking (ATT)"** in sidebar
- Find your new activity at top of list
- Check beneficiary totals match what you entered

---

### Activity 2: Child-Friendly Space Activities (LARGE NUMBERS)

**Time:** ~10 minutes  
**Purpose:** Practice with larger beneficiary counts

#### Quick Entry Guide:

**Basic Info:**
- Project: "Child Protection Program"
- Indicator: "Number of children accessing child-friendly spaces"
- Activity Name: "Recreational and educational activities - Child-Friendly Space"
- Activity Code: 2.3.1 (optional - can skip)
- Location: Nyakabande
- Activity Date: January 18, 2026
- Budget: 800
- Expenditure: 765
- Narrative: "Daily activities including sports, games, art, and literacy support for refugee and host community children. Focus on psychosocial well-being and learning."

**Refugee Community:**
- **Male:** 0-4yrs=15, 5-17yrs=45, 18-49yrs=0, 50+=0 → **Subtotal: 60**
- **Female:** 0-4yrs=12, 5-17yrs=38, 18-49yrs=0, 50+=0 → **Subtotal: 50**
- **Refugee Total: 110**

**Host Community:**
- **Male:** 0-4yrs=8, 5-17yrs=22, 18-49yrs=0, 50+=0 → **Subtotal: 30**
- **Female:** 0-4yrs=6, 5-17yrs=24, 18-49yrs=0, 50+=0 → **Subtotal: 30**
- **Host Total: 60**

**Grand Total: 170** ← Should auto-calculate to this!

**Nationality (must = 110):**
- Sudanese: 45
- Congolese: 38
- South Sudanese: 22
- Others: 5
- **Total: 110** ✅

---

### Activity 3: GBV Awareness Campaign (MIXED DEMOGRAPHICS)

**Time:** ~10 minutes  
**Purpose:** Practice community awareness activity

**Basic Info:**
- Project: "GBV Response and Protection"
- Indicator: "Number of community members reached through awareness campaigns"
- Activity Name: "Community GBV awareness and prevention campaign"
- Activity Code: 1.4.8 (optional - can skip)
- Location: Kampala
- Activity Date: January 19, 2026
- Budget: 1200
- Expenditure: 1150
- Narrative: "Community mobilization event covering GBV prevention, reporting mechanisms, and available services. Included drama performances and interactive discussions with community leaders."

**Refugee Community:**
- **Male:** 0-4=0, 5-17=25, 18-49=85, 50+=15 → **125**
- **Female:** 0-4=0, 5-17=30, 18-49=95, 50+=20 → **145**
- **Refugee Total: 270**

**Host Community:**
- **Male:** 0-4=0, 5-17=15, 18-49=45, 50+=10 → **70**
- **Female:** 0-4=0, 5-17=20, 18-49=55, 50+=15 → **90**
- **Host Total: 160**

**Grand Total: 430**

**Nationality (must = 270):**
- Sudanese: 110
- Congolese: 95
- South Sudanese: 55
- Others: 10
- **Total: 270** ✅

---

### Activity 4: Legal Assistance (SMALL NUMBERS)

**Time:** ~7 minutes  
**Purpose:** Show specialized service

**Basic Info:**
- Project: "GBV Response and Protection"
- Indicator: "Number of GBV survivors receiving legal assistance"
- Activity Name: "Individual legal counseling and court support"
- Activity Code: 1.2.5 (optional - can skip)
- Location: Nakivale
- Activity Date: January 20, 2026
- Budget: 450
- Expenditure: 450
- Narrative: "Provision of legal counseling, assistance with legal documentation, and court accompaniment for GBV survivors pursuing legal action. Sessions conducted with partner legal aid organization."

**Refugee Community:**
- **Male:** 0-4=0, 5-17=0, 18-49=1, 50+=0 → **1**
- **Female:** 0-4=0, 5-17=2, 18-49=8, 50+=1 → **11**
- **Refugee Total: 12**

**Host Community:**
- **Male:** All zeros → **0**
- **Female:** 0-4=0, 5-17=0, 18-49=3, 50+=0 → **3**
- **Host Total: 3**

**Grand Total: 15**

**Nationality (must = 12):**
- Sudanese: 4
- Congolese: 5
- South Sudanese: 2
- Others: 1
- **Total: 12** ✅

---

### Activity 5: Child Protection Case Management

**Time:** ~8 minutes  
**Purpose:** Complete the activity set

**Basic Info:**
- Project: "Child Protection Program"
- Indicator: "Number of children receiving case management services"
- Activity Name: "Individual case management for at-risk children"
- Activity Code: 2.1.4 (optional - can skip)
- Location: Nyakabande
- Activity Date: January 21, 2026
- Budget: 600
- Expenditure: 580
- Narrative: "Comprehensive case management services for children at risk including assessment, case planning, referrals, and follow-up. Focus on children separated from families and those experiencing abuse."

**Refugee Community:**
- **Male:** 0-4=3, 5-17=9, 18-49=0, 50+=0 → **12**
- **Female:** 0-4=2, 5-17=11, 18-49=0, 50+=0 → **13**
- **Refugee Total: 25**

**Host Community:**
- **Male:** 0-4=1, 5-17=4, 18-49=0, 50+=0 → **5**
- **Female:** 0-4=1, 5-17=4, 18-49=0, 50+=0 → **5**
- **Host Total: 10**

**Grand Total: 35**

**Nationality (must = 25):**
- Sudanese: 10
- Congolese: 9
- South Sudanese: 5
- Others: 1
- **Total: 25** ✅

---

## 👥 Part 2: Entering Cases (20-30 minutes)

### Case 1: Sexual Assault Survivor (HIGH PRIORITY)

**Time:** ~10 minutes  
**Purpose:** Demonstrate GBV case with full confidentiality

#### Step-by-Step:

**1. Navigate to Case Management**
- Click **"Case Management"** in left sidebar
- Click **"Register New Case"** button (top right, blue)

**2. Fill Case Information**
- **Case Number:** GBV-NK-2026-012 (type manually)
- **Case Type:** Select "Sexual Assault" from dropdown
- **Registration Date:** January 18, 2026
- **Location:** Nakivale
- **Status:** Active (should be default)

**3. Fill Beneficiary Information**
- **Name:** [Confidential - Case 012] ← Use exactly this
- **Age:** 24
- **Gender:** Female
- **Nationality:** Congolese
- **Community Type:** Refugee
- **Contact:** [Provided with consent]

**4. Fill Case Details**
- **Description:** Copy-paste from test data:
  ```
  Survivor of sexual assault requiring comprehensive support services including medical, psychosocial, and legal assistance. Referred by community health worker.
  ```

- **Services Required:** (Check all that apply or type):
  - Medical care (completed)
  - Psychosocial support (ongoing)
  - Legal counseling (scheduled)
  - Safety planning (completed)

- **Case Worker:** Maria Nakato (type name)
- **Initial Assessment Date:** January 18, 2026
- **Follow-up Date:** January 25, 2026
- **Priority:** High (select from dropdown)
- **Confidentiality Level:** Maximum

**5. Add Notes** (if system has notes section):
```
Survivor receiving ongoing weekly psychosocial support. Legal consultation scheduled for January 23, 2026. Safety plan developed and survivor relocated to safe accommodation.
```

**6. Review Confidentiality Warning**
- ⚠️ System should display RED warning about confidentiality
- Read carefully
- Check "I understand" box if present

**7. Submit**
- Click **"Register Case"** or **"Submit"**
- ✅ Success message appears
- Case appears in Active Cases list

---

### Case 2: Child Protection - Separated Minor

**Time:** ~8 minutes

**Quick Entry:**

**Case Info:**
- Number: CP-NY-2026-008
- Type: Child Protection
- Date: January 20, 2026
- Location: Nyakabande
- Status: Active

**Beneficiary:**
- Name: [Confidential - Minor 008]
- Age: 14
- Gender: Male
- Nationality: Sudanese
- Community: Refugee
- Contact: [Guardian contact provided]

**Details:**
- Description: "Unaccompanied minor separated from family during displacement. Requiring family tracing, educational support, and psychosocial services."
- Services: Family tracing, Educational support, Psychosocial support, Foster care
- Case Worker: John Musinguzi
- Assessment: January 20, 2026
- Follow-up: January 27, 2026
- Priority: High

**Notes:**
```
Placed with certified foster family in Nyakabande. Red Cross family tracing initiated. Child enrolled in local primary school, attending Child-Friendly Space daily.
```

---

### Case 3: Psychosocial Support - Elderly Woman

**Time:** ~8 minutes

**Quick Entry:**

**Case Info:**
- Number: PSS-NK-2026-015
- Type: Psychosocial Support
- Date: January 21, 2026
- Location: Nakivale
- Status: Active

**Beneficiary:**
- Name: [Confidential - Case 015]
- Age: 67
- Gender: Female
- Nationality: South Sudanese
- Community: Refugee
- Contact: [Provided through community leader]

**Details:**
- Description: "Elderly woman experiencing severe trauma and social isolation following loss of family members during conflict. Requiring regular psychosocial support and community reintegration activities."
- Services: Individual counseling, Group support, Community integration, Medical referral
- Case Worker: Sarah Atim
- Assessment: January 21, 2026
- Follow-up: January 28, 2026
- Priority: Medium

**Notes:**
```
Client referred by health center for mental health support. Enrolled in women's support group meeting Wednesdays. Medical assessment completed - referred to hospital for follow-up care.
```

---

## 📊 Part 3: Creating/Updating Indicators (15-20 minutes)

### Option A: Create NEW Indicator (If you have permission)

**Navigate:**
- Click **"Indicator Tracking (ITT)"** in sidebar
- Click **"Add New Indicator"** button (if available)

### Option B: Update EXISTING Indicator (Easier for Demo)

**Purpose:** Show how indicator achievement updates

#### Find an Existing Indicator:

**1. Navigate to ITT**
- Click "Indicator Tracking (ITT)" in sidebar
- View all indicators

**2. Select Indicator to Update**
- Look for: "Number of children accessing child-friendly spaces"
- Or any indicator with low achievement
- Click **"Edit"** button (pencil icon)

**3. Update Achievement Value**
- Find "Achieved" field
- Current value: [whatever it shows]
- **Add 170** to current value (from Activity 2)
- Example: If current = 0, new value = 170

**4. Watch Auto-Calculations**
- 👁️ % Achieved updates automatically
- 👁️ Variance calculates (Target - Achieved)
- 👁️ Status changes color (Green/Yellow/Red)

**5. Save**
- Click **"Save"** or **"Update"**
- ✅ Success message
- Return to ITT list
- See updated progress bar

---

## 🏗️ Part 4: Creating New Project (10-15 minutes)

**Navigate:**
- Click **"Projects"** in sidebar
- Click **"Add New Project"** button

**Fill Form:**

| Field | Value |
|-------|-------|
| **Project Name** | Women's Economic Empowerment and Leadership Program |
| **Project Code** | WEELP-2026 |
| **Donor** | UN Women |
| **Thematic Area** | Select: "Local partners effectively respond to GBV" |
| **Start Date** | January 1, 2026 |
| **End Date** | December 31, 2027 |
| **Location** | Nakivale, Nyakabande, Kampala (type all three) |
| **Status** | Active |

**Financial:**
- **Total Budget:** 350000 (no commas)
- **Current Expenditure:** 0

**Description:**
```
Comprehensive program aimed at empowering refugee and host community women through skills training, business development support, and leadership capacity building. Program includes Village Savings and Loans Associations (VSLA), vocational skills training, and mentorship opportunities.
```

**Objectives** (if field available):
```
1. Train 300 women in vocational skills (tailoring, hairdressing, catering)
2. Establish 20 Village Savings and Loans Associations
3. Provide business startup grants to 100 women
4. Train 50 women in leadership and advocacy skills
```

**Submit:**
- Review all fields
- Click **"Save Project"**
- ✅ Project appears in Projects list

---

## ✅ Verification Checklist

After entering all data, verify these:

### Dashboard Check:
- [ ] **Activities This Month** increased by 5
- [ ] **Total Beneficiaries** increased by 682 (32+170+430+15+35)
- [ ] **Budget figures** updated
- [ ] **Charts** showing new data (refresh if needed: Ctrl+Shift+R)

### Activity Tracking Table Check:
- [ ] All 5 activities visible
- [ ] Correct dates showing
- [ ] Beneficiary totals correct
- [ ] Locations correct

### Case Management Check:
- [ ] 3 new cases in Active Cases
- [ ] Case types showing correctly
- [ ] Follow-up dates set

### Projects Check:
- [ ] New project visible (if created)
- [ ] 4 total projects now (was 3)

---

## 🎯 Presentation Day Tips

### Before Presentation:
1. **Test Run:** Enter Activity 1 once before the actual presentation
2. **Delete Test:** Remove the test entry so you can re-enter during demo
3. **Bookmark:** PRESENTATION_TEST_DATA.md and this guide
4. **Practice:** Know where each field is without scrolling

### During Presentation:
1. **Go Slow:** Let audience see each step
2. **Narrate:** "Now I'm selecting the project..."
3. **Point Out:** "Watch the subtotal calculate automatically"
4. **Emphasize:** "Notice the validation - nationality must match refugee total"

### If Something Goes Wrong:
- **Form error?** → Read error message aloud, fix issue, explain what happened
- **System slow?** → "As you can see, system is processing..." (stay calm)
- **Wrong number?** → "Let me correct that - easy to edit" (show edit capability)
- **Validation fails?** → "Perfect! The system caught my mistake" (turn it into a teaching moment!)

---

## 🆘 Troubleshooting

### "Submit button is grayed out"
- ✅ Check all required fields filled (red asterisk *)
- ✅ Verify nationality total matches refugee total
- ✅ Ensure all numbers are valid (no letters, no negatives)

### "Nationality total doesn't match"
- ✅ Recount: Sudanese + Congolese + South Sudanese + Others
- ✅ Must equal Refugee Total exactly
- ✅ Check for typos in any field

### "Auto-calculations not working"
- ✅ Hard refresh: Ctrl + Shift + R
- ✅ Check JavaScript console (F12)
- ✅ Restart server if needed

### "Activity not showing in ATT"
- ✅ Refresh page (Ctrl + R)
- ✅ Check you're on correct year tab (2026)
- ✅ Scroll down - might be below current view

### "Charts not updating"
- ✅ Hard refresh: Ctrl + Shift + R
- ✅ Clear browser cache
- ✅ Check console for errors (F12)

---

## 🎉 You're Ready!

**Remember:**
- ✅ You know this system inside and out
- ✅ Test data is realistic and based on actual patterns
- ✅ All calculations are pre-verified
- ✅ Mistakes during demo are OK - use them as teaching moments!

**Time Budget:**
- Activities: ~40 minutes (8 min each × 5)
- Cases: ~25 minutes (8 min each × 3)
- Indicators: ~10 minutes
- Projects: ~10 minutes
- **Total: ~85 minutes** (or just demo Activity 1 + Case 1 for speed)

**Good luck with your presentation!** 🎯🎉

---

**Need Help?**
- This guide: Open in split screen with browser
- Test data: PRESENTATION_TEST_DATA.md
- Full manual: USER_MANUAL.md
- System help: Click "Help & Quick Reference" in app
