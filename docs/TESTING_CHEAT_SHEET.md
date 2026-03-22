# 🎯 QUICK TESTING CHEAT SHEET
**Fast Reference for Manual Testing - March 14, 2026**

---

## 🚀 START SERVER
```powershell
npm run dev
```
**URL:** http://localhost:3001

---

## 🔐 LOGIN CREDENTIALS

### Admin User
```
URL: http://localhost:3001/public/login.html
Username: admin
Password: Admin123!  (or just "password" - try both)
```

---

## ✅ 5-MINUTE SMOKE TEST

### 1. Login (1 min)
- Go to http://localhost:3001/public/login.html
- Login as admin
- ✅ Should redirect to dashboard

### 2. Navigation (2 min)
Click each link, verify loads:
- ✅ Dashboard
- ✅ Projects  
- ✅ Activities
- ✅ Profile (FIXED)
- ✅ Help (FIXED)

### 3. Create Project (2 min)
- Click "New Project"
- Enter:
  - Name: Test Water Project
  - Code: TEST-001
  - Budget: 100000
- Save
- ✅ Should appear in list

---

## 📊 TEST DATA - COPY & PASTE

### Quick Project
```
Name: Emergency Water Supply
Code: EWS-2026-001
Budget: 250000
Start: 2026-04-01
End: 2026-12-31
Location: Sana'a
```

### Quick Activity
```
Title: Community Training Workshop
Type: Training
Date: 2026-03-20
Participants: 30
Male: 18
Female: 12
Budget: 5000
```

### Quick Indicator
```
Name: Households with clean water access
Code: IND-WATER-001
Baseline: 50
Target: 500
Unit: Households
```

### Quick Case/Beneficiary
```
Name: Ahmed Mohammed
Age: 35
Gender: Male
Location: Sana'a, Bani Matar
Household Size: 6
Phone: +967-777-123456
Need: Water access
Priority: High
```

---

## 🧪 CRITICAL TEST PATHS

### Path 1: Authentication
1. Login → Dashboard → Logout → Login

### Path 2: Data Entry
1. Dashboard → Projects → Create → Save → View

### Path 3: Navigation
1. Dashboard → Projects → Activities → Reports → Back

### Path 4: User Flow
1. Login → Create Project → Add Indicator → Create Activity → Generate Report

---

## ✅ SUCCESS CRITERIA

**System is ready if:**
- [x] Login works
- [x] Dashboard loads
- [x] Can create project
- [x] Can create activity
- [x] Navigation links work
- [x] No critical errors in console

**If all ✅ → Deploy tomorrow!**

---

## 🐛 QUICK BUG CHECK

### Open Browser Console (F12)
**Look for:**
- ❌ Red errors (critical)
- ⚠️ Yellow warnings (acceptable)
- 404 errors (page not found - bad)
- 500 errors (server error - very bad)

**Acceptable:**
- Favicon 404
- Minor styling warnings
- Deprecation warnings

**Not Acceptable:**
- Cannot connect errors
- Authentication failed
- Database errors
- Crash/freeze

---

## 📱 BROWSER TEST MATRIX

| Feature | Chrome | Edge | Firefox |
|---------|--------|------|---------|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Create Data | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ |

**Minimum:** Works in Chrome  
**Good:** Works in Chrome + Edge  
**Excellent:** Works in all 3

---

## ⏱️ PERFORMANCE QUICK CHECK

### Expected Load Times:
- Login page: < 2 seconds
- Dashboard: < 3 seconds
- Create form: < 1 second
- Report generation: < 5 seconds

**Test:** Open DevTools → Network tab → Check load time

---

## 🎯 PRIORITY TESTS (Do These First)

### 🔥 P0 - Must Work (15 min)
1. ✅ Login
2. ✅ View dashboard
3. ✅ Create project
4. ✅ View created project

### ⚡ P1 - Should Work (20 min)
5. ✅ Create activity
6. ✅ Create indicator
7. ✅ Navigation links
8. ✅ User management

### 💎 P2 - Nice to Have (25 min)
9. ✅ Generate reports
10. ✅ Export data
11. ✅ Charts/visualizations
12. ✅ Form validation

---

## 📞 QUICK TROUBLESHOOTING

### Problem: Can't login
**Try:**
```
Username: admin
Passwords to try:
1. Admin123!
2. password
3. admin123
4. Admin@123
```

### Problem: 404 errors
**Check:**
- Server running? `npm run dev`
- Correct URL? http://localhost:3001
- Port 3001 available?

### Problem: Database errors
**Fix:**
```powershell
npm run db:verify
```

### Problem: Page won't load
**Try:**
- F5 (refresh)
- Ctrl+Shift+R (hard refresh)
- Clear cache
- Different browser

---

## 🎉 TESTING COMPLETE CHECKLIST

- [ ] Server starts ✅
- [ ] Login works ✅
- [ ] Dashboard loads ✅
- [ ] Navigation works ✅
- [ ] Can create data ✅
- [ ] Data saves ✅
- [ ] No critical errors ✅

**All checked? → Ready to deploy!** 🚀

---

## 📊 REPORT YOUR RESULTS

**Pass:** All critical tests work  
**Conditional Pass:** Minor issues, but deployable  
**Fail:** Critical functionality broken

### Quick Report Template:
```
TESTED: [Date/Time]
TESTER: [Your Name]
RESULT: PASS / CONDITIONAL / FAIL

TESTS PASSED: X / 7
CRITICAL ISSUES: [None / List them]
MINOR ISSUES: [None / List them]

RECOMMENDATION:
✅ Deploy tomorrow
⚠️ Fix minor issues first
❌ Need major fixes
```

---

## 🚀 READY FOR DEPLOYMENT?

### ✅ YES - Deploy if:
- Login works
- Can create/view data
- Navigation functional
- No crashes

### ⚠️ MAYBE - Fix first if:
- Some features broken
- Performance issues
- Validation not working

### ❌ NO - Don't deploy if:
- Can't login
- Database errors
- Server crashes
- Data loss risk

---

**Last Updated:** March 14, 2026  
**For Full Guide:** See [USER_TESTING_GUIDE.md](USER_TESTING_GUIDE.md)

**Quick Start:**
1. Start server: `npm run dev`
2. Open: http://localhost:3001/public/login.html
3. Login: admin / Admin123!
4. Test the 7 critical items above
5. ✅ Deploy if all pass!

**Good luck!** 🍀
