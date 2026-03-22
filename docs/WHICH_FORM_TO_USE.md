# WHICH FORM TO USE - QUICK GUIDE

## ⚠️ CRITICAL: You Have TWO Activity Forms!

### ❌ Form 1: Activity Tracking Table Modal (DON'T USE!)
**Location:** Activity Tracking page → "Create New Activity" button  
**Appearance:** Popup modal  
**Has:**
- Simple fields only
- Direct/Indirect beneficiaries (Male/Female/Other)
- NO age disaggregation
- NO community type (Refugee/Host)
- NO nationality breakdown

**When to Use:** NEVER for your test data! This is for quick basic entries only.

---

### ✅ Form 2: New Activity Report (USE THIS!)
**Location:** Left sidebar → "New Activity Report" menu item  
**URL:** Shows `#entry-form`  
**Page Title:** "New Activity Report"  
**Has:**
- Full disaggregation
- Refugee Community (Male/Female × 4 age groups)
- Host Community (Male/Female × 4 age groups)  
- Nationality breakdown (Sudanese, Congolese, South Sudanese, Others)
- Auto-calculating totals
- Budget/Expenditure fields
- Narrative notes

**When to Use:** ALWAYS for test data and presentation demos!

---

## 🔍 How to Tell Which Form You're In:

### Signs You're in the WRONG Form (Modal):
- ❌ Location is a **textfield** (not dropdown)
- ❌ Only see "Direct Beneficiaries" with Male/Female/Other
- ❌ NO "Beneficiary Disaggregation" section
- ❌ NO "Refugee Nationality Breakdown" section
- ❌ Page has dark overlay (it's a modal popup)

### Signs You're in the RIGHT Form (Entry Page):
- ✅ Location is a **dropdown** (Nakivale, Nyakabande, Kampala, Other)
- ✅ See "Beneficiary Disaggregation" heading
- ✅ Two cards: Blue "Refugee Beneficiaries" and Green "Host Community Beneficiaries"
- ✅ Each has 4 age groups with Male/Female columns
- ✅ "Refugee Nationality Breakdown" section below
- ✅ Yellow warning box showing nationality total
- ✅ Full page (not a modal popup)
- ✅ URL shows `#entry-form`

---

## 📋 Step-by-Step to Access the RIGHT Form:

1. **Look at left sidebar** (navigation menu)
2. **Scroll down** to find "New Activity Report" (should be near top)
3. **Click "New Activity Report"**
4. **Verify**: 
   - URL changes to `#entry-form`
   - Page title says "New Activity Report"
   - Location field is a DROPDOWN
5. **Start entering data** following DATA_ENTRY_GUIDE.md

---

## 🚨 If You're in the Wrong Form:

**If you accidentally opened the Activity Tracking modal:**
1. Click the X or "Cancel" button to close the modal
2. Look at the left sidebar
3. Click "New Activity Report" instead
4. Verify you see the full disaggregation form

---

## ✅ Quick Verification Checklist:

Before entering data, check these:
- [ ] Page URL shows `#entry-form`
- [ ] Page title says "New Activity Report"
- [ ] Location field is a DROPDOWN (not textbox)
- [ ] I can see "Beneficiary Disaggregation" section
- [ ] I can see blue "Refugee Beneficiaries" card
- [ ] I can see green "Host Community Beneficiaries" card
- [ ] Each card has 4 age groups (0-4, 5-17, 18-49, 50+)
- [ ] I can see "Refugee Nationality Breakdown" section below

**If ALL checkboxes are checked: ✅ You're in the RIGHT form!**

**If ANY checkbox is unchecked: ❌ You're in the WRONG form - go back to sidebar!**

---

## 💡 Pro Tip:

**Bookmark the right form:**
1. Navigate to the correct form (New Activity Report from sidebar)
2. Bookmark the page: `http://localhost:3001/index.html#entry-form`
3. Use this bookmark for all test data entry
4. Avoid clicking "Create New Activity" buttons elsewhere

---

**Updated:** January 21, 2026  
**For:** Presentation test data entry  
**See also:** DATA_ENTRY_GUIDE.md (now updated with correct form instructions)
