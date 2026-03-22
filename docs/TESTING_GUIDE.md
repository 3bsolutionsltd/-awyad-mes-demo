# 🧪 Testing Guide - New Modular System

## Quick Test Checklist

### Prerequisites
- [ ] Backend server running on port 3001
- [ ] Database has demo data loaded
- [ ] Browser supports ES6 modules

### How to Test the New System

#### Option 1: Test New System Directly
1. Open `http://localhost:3001/index-new.html`
2. Login with your credentials
3. Test each module

#### Option 2: Switch to New System
1. Backup old system:
   ```powershell
   Rename-Item "public\index.html" "public\index-old.html"
   Rename-Item "public\index-new.html" "public\index.html"
   ```
2. Open `http://localhost:3001/`
3. Login and test

---

## Module-by-Module Testing

### 1. Dashboard ✅
**URL**: `http://localhost:3001/index-new.html#dashboard`

**What to Check**:
- [ ] 4 summary cards display (Projects, Indicators On-Track, Activities, Burn Rate)
- [ ] Thematic areas section shows all areas with progress bars
- [ ] Results framework table shows all indicators grouped by thematic area
- [ ] All numbers match database data
- [ ] No console errors
- [ ] Loading spinner shows while fetching
- [ ] Error handling works (stop server to test)

**Expected Data**:
- Total projects: Should match project count in database
- Indicators on track: Count of indicators with ≥70% achievement
- Activities this month: Count of activities in current month
- Average burn rate: (Total expenditure / Total budget) × 100

---

### 2. Projects 📁
**URL**: `http://localhost:3001/index-new.html#projects`

**What to Check**:
- [ ] Summary cards show totals (Total, Active, Budget, Avg Burn Rate)
- [ ] Project table displays all projects
- [ ] Thematic area badges show correctly
- [ ] Burn rate progress bars display (color-coded: green <60%, yellow 60-80%, red >80%)
- [ ] Budget and expenditure formatted as currency
- [ ] Status badges color-coded
- [ ] View/Edit buttons present (placeholders)

**Test Cases**:
1. Create Project button → Shows "Phase 3" alert
2. Export button → Shows "Phase 3" alert
3. View button → Shows alert with project ID
4. Edit button → Shows alert with project ID

---

### 3. Indicators (ITT) 📊
**URL**: `http://localhost:3001/index-new.html#indicators`

**What to Check**:
- [ ] Summary cards (Total, On Track, At Risk, Off Track)
- [ ] Indicators grouped by thematic area
- [ ] 2-row header table (LOP, Annual, Q1-Q4)
- [ ] Progress bars show correct percentages
- [ ] Variance calculated correctly (Achieved - Target)
- [ ] Variance colored (green if positive, red if negative)
- [ ] Quarterly breakdown cards show aggregated data

**Calculation Verification**:
- Progress % = (Achieved / Target) × 100
- On Track = Progress ≥ 70%
- At Risk = Progress 40-69%
- Off Track = Progress < 40%

---

### 4. Activities (ATT) 📅
**URL**: `http://localhost:3001/index-new.html#activities`

**What to Check**:
- [ ] Summary cards (Total, Approved, Beneficiaries, Burn Rate)
- [ ] Activity table displays all activities (12 columns)
- [ ] Disaggregation summary shows for first 4 activities
- [ ] Nationality breakdown table displays
- [ ] Totals calculated correctly
- [ ] Burn rate indicators color-coded
- [ ] Status and approval badges display

**Critical Data Check**:
- [ ] Refugee male/female totals add up correctly
- [ ] Host male/female totals add up correctly
- [ ] Grand total = Refugee total + Host total
- [ ] Nationality total matches refugee total (or shows warning)

**Disaggregation Table Structure**:
```
Age Group  | Male | Female | Subtotal
0-4        |  X   |   Y    |  X+Y
5-17       |  X   |   Y    |  X+Y
18-49      |  X   |   Y    |  X+Y
50+        |  X   |   Y    |  X+Y
Total      |  ΣX  |   ΣY   |  ΣX+ΣY
```

---

### 5. Cases 💼
**URL**: `http://localhost:3001/index-new.html#cases`

**What to Check**:
- [ ] Summary cards (Active Load, Closed, Total, Needs Follow-Up)
- [ ] Active cases table shows open cases
- [ ] Follow-up alerts display for cases needing follow-up
- [ ] Rows highlighted (yellow) for cases needing follow-up
- [ ] Closed cases table shows closed cases
- [ ] Duration calculated correctly (days between open and close)
- [ ] Case statistics table shows breakdown by type

**Follow-Up Logic**:
- Needs Follow-Up = nextFollowUp date < today
- Should show badge: "Follow-up needed" (red) or "On track" (green)

---

### 6. Monthly Tracking 📆
**URL**: `http://localhost:3001/index-new.html#monthly`

**What to Check**:
- [ ] Summary cards (Current Month, YTD Activities, YTD Beneficiaries, YTD Budget)
- [ ] Calendar table shows 12 months with activity counts
- [ ] Current month highlighted in blue
- [ ] Quarterly summary cards show Q1-Q4 data
- [ ] Monthly accordion displays (12 items)
- [ ] Current month accordion expanded by default
- [ ] Activity tables in each accordion section

**Test Cases**:
1. Click different months in accordion → Should expand/collapse
2. Verify current month is highlighted
3. Check YTD totals add up

---

### 7. Entry Form ✍️
**URL**: `http://localhost:3001/index-new.html#entry-form`

**What to Check**:
- [ ] All form fields display
- [ ] Project dropdown populated from database
- [ ] Indicator dropdown populated from database
- [ ] Refugee disaggregation table auto-calculates
- [ ] Host disaggregation table auto-calculates
- [ ] Grand total updates automatically
- [ ] Nationality validation works (shows warning if mismatch)
- [ ] Reset button clears form
- [ ] Submit button validates required fields

**Auto-Calculation Test**:
1. Enter refugee male 0-4: 10
2. Enter refugee female 0-4: 15
3. **Expected**: Subtotal = 25, Male Total = 10, Female Total = 15, Grand Total = 25
4. Enter host male 0-4: 5
5. Enter host female 0-4: 8
6. **Expected**: Overall Grand Total = 25 + 13 = 38

**Nationality Validation Test**:
1. Set refugee total to 100
2. Set nationality totals: Sudanese=30, Congolese=20, South Sudanese=20, Others=20
3. **Expected**: Nationality total = 90, shows warning (mismatch with 100)

---

## Navigation Testing

### Test Navigation
- [ ] Click Dashboard → Loads dashboard
- [ ] Click Projects → Loads projects
- [ ] Click Indicators → Loads ITT
- [ ] Click Activities → Loads ATT
- [ ] Click Cases → Loads case management
- [ ] Click Monthly → Loads monthly tracking
- [ ] Click New Activity Report → Loads entry form

### Test URL Hash
- [ ] `#dashboard` → Dashboard
- [ ] `#projects` → Projects
- [ ] `#indicators` → Indicators
- [ ] `#activities` → Activities
- [ ] `#cases` → Cases
- [ ] `#monthly` → Monthly
- [ ] `#entry-form` → Entry Form
- [ ] `#invalid` → 404 page

### Test Browser Back/Forward
1. Navigate: Dashboard → Projects → Activities
2. Click browser back button
3. **Expected**: Goes back to Projects
4. Click browser forward button
5. **Expected**: Goes forward to Activities

---

## Error Handling Testing

### Test API Failures
1. Stop the backend server
2. Navigate to any page
3. **Expected**: 
   - Loading spinner shows
   - After timeout, error message displays
   - "Retry" button appears
   - Click retry → Attempts to reload

### Test Network Errors
1. Disconnect internet (or block localhost)
2. Try to load a page
3. **Expected**: Error message with retry option

### Test Invalid Data
1. Manually modify API response (if possible)
2. Send invalid JSON
3. **Expected**: Application doesn't crash, shows error

---

## Console Error Checking

### Open Browser DevTools
**Chrome**: F12 or Right-click → Inspect  
**Edge**: F12 or Right-click → Inspect  
**Firefox**: F12 or Right-click → Inspect Element

### What to Look For
- [ ] **No red errors** in Console tab
- [ ] **No 404 errors** for missing files
- [ ] **No undefined variables**
- [ ] **No failed API calls** (if server is running)
- [ ] Only info/log messages (acceptable)

### Common Errors to Watch For
❌ `Uncaught ReferenceError: X is not defined`  
❌ `Failed to load module script`  
❌ `Uncaught SyntaxError`  
❌ `TypeError: Cannot read property 'X' of undefined`  
✅ Console should be clean!

---

## Performance Testing

### Page Load Time
1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Check "DOMContentLoaded" time
4. **Expected**: < 2 seconds

### Module Load Time
1. Click navigation items
2. Observe loading spinner
3. **Expected**: Content appears within 1 second

### Memory Usage
1. Open DevTools → Performance tab
2. Record for 30 seconds while navigating
3. Stop recording
4. **Expected**: No memory leaks, steady memory usage

---

## Data Accuracy Verification

### Compare with Database
For each module, verify data matches database:

1. **Projects**:
   ```sql
   SELECT COUNT(*) FROM projects; -- Should match "Total Projects"
   SELECT SUM(budget), SUM(expenditure) FROM projects; -- Check totals
   ```

2. **Indicators**:
   ```sql
   SELECT COUNT(*) FROM indicators; -- Should match "Total Indicators"
   SELECT * FROM indicators WHERE (achieved / target_lop * 100) >= 70; -- On Track count
   ```

3. **Activities**:
   ```sql
   SELECT COUNT(*) FROM activities; -- Total Activities
   SELECT SUM(refugee_male_0_4 + refugee_female_0_4 + ...) FROM activities; -- Beneficiaries
   ```

4. **Cases**:
   ```sql
   SELECT COUNT(*) FROM cases WHERE status = 'Active'; -- Active Load
   SELECT COUNT(*) FROM cases WHERE status = 'Closed'; -- Closed
   ```

---

## Browser Compatibility

### Test in Multiple Browsers
- [ ] **Chrome** (version 90+)
- [ ] **Edge** (version 90+)
- [ ] **Firefox** (version 88+)
- [ ] **Safari** (version 14+) - if available

### Check for:
- [ ] ES6 module support
- [ ] Fetch API support
- [ ] Template literals rendering
- [ ] Arrow functions working
- [ ] Async/await functioning
- [ ] No polyfill errors

---

## Mobile Responsiveness

### Test on Mobile Devices
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Test different screen sizes:
   - [ ] Mobile (375px)
   - [ ] Tablet (768px)
   - [ ] Desktop (1920px)

### Check Responsiveness:
- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally
- [ ] Cards stack vertically
- [ ] Buttons remain accessible
- [ ] No horizontal scroll on page
- [ ] Text readable without zooming

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key moves through interactive elements
- [ ] Enter key activates buttons/links
- [ ] Escape key closes modals (if any)
- [ ] Navigation links accessible via keyboard

### Screen Reader
- [ ] Alt text on icons
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Form labels associated

---

## Integration Points

### Authentication
- [ ] Login redirects to dashboard
- [ ] Logout clears session
- [ ] User info displays correctly
- [ ] Permission-based visibility works

### State Management
1. Load dashboard (fetches data)
2. Navigate to projects (should use cached data if available)
3. Create activity (should update state)
4. Navigate back to dashboard (should reflect changes)

---

## Rollback Plan

If issues are found:

1. **Immediate Rollback**:
   ```powershell
   Rename-Item "public\index.html" "public\index-new-broken.html"
   Rename-Item "public\index-old.html" "public\index.html"
   ```

2. **Document Issues**:
   - Screenshot errors
   - Note console messages
   - Record steps to reproduce
   - Document expected vs actual behavior

3. **Fix Issues**:
   - Review error messages
   - Check data transformer
   - Verify API endpoints
   - Test calculations

4. **Re-Test**:
   - Fix issues one by one
   - Test each fix
   - Verify no new issues introduced

---

## Success Criteria

### Minimum Requirements for Go-Live
- [ ] ✅ All 7 modules load without errors
- [ ] ✅ Navigation works (click & URL hash)
- [ ] ✅ Data displays correctly from database
- [ ] ✅ Calculations are accurate
- [ ] ✅ No console errors
- [ ] ✅ Loading states work
- [ ] ✅ Error handling works
- [ ] ✅ Forms validate
- [ ] ✅ Auto-calculation works
- [ ] ✅ Responsive design maintained

### Nice-to-Have (Can fix later)
- [ ] ⚠️ Minor styling tweaks
- [ ] ⚠️ Tooltip improvements
- [ ] ⚠️ Animation polish
- [ ] ⚠️ Additional validation messages

---

## Bug Report Template

When you find an issue:

```markdown
**Module**: [Dashboard / Projects / Indicators / etc.]
**Severity**: [Critical / High / Medium / Low]
**Issue**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens
**Console Errors**: Copy any error messages
**Screenshot**: Attach if possible
**Browser**: Chrome / Firefox / Edge / Safari
**Fix Priority**: [Must Fix / Should Fix / Nice to Fix]
```

---

## Contact & Support

- **Code Location**: `c:\Users\DELL\awyad-mes-demo\public\js\`
- **Documentation**: See `DAY1_COMPLETE.md` and `IMPLEMENTATION_LOG.md`
- **Architecture**: See `SYSTEM_ARCHITECTURE.md`
- **API Docs**: See `ARCHITECTURE.md`

---

**Happy Testing! 🧪🚀**

Remember: The goal is to verify the new system works as well or better than the old system, with cleaner code and better maintainability.
