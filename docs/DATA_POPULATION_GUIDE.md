# Data Population Guide - AWYAD MES

This guide explains the **4 ways** to populate your MES system with data.

## 📊 Available Data Population Methods

### 1. ✅ SQL Seed Script (Fastest - Recommended for Demo Data)

Load all demo data directly into PostgreSQL database.

**What it includes:**
- 2 Thematic Areas (GBV & Child Protection)
- 2 Projects (UNFPA & UNICEF programs)
- 11 Indicators with targets and quarterly breakdowns
- 6 Activities with disaggregation data
- 3 Cases (GBV and CP cases)

**How to use:**
```powershell
# Run the seed script
.\load-demo-data.ps1

# With custom database settings
.\load-demo-data.ps1 -DbName awyad_mes -DbUser postgres -DbPassword your_password
```

**Pros:** 
- ✅ Fastest method
- ✅ Loads complete relational data with proper IDs
- ✅ Includes all disaggregation data
- ✅ Transactional (all or nothing)

**Cons:**
- ❌ Direct database access required
- ❌ Not suitable for production imports

---

### 2. ✅ API Import Script (Best for Testing APIs)

Import data via REST API endpoints using PowerShell automation.

**What it does:**
- Creates thematic areas via API
- Creates projects linked to thematic areas
- Creates indicators with all tracking data
- Creates activities with disaggregation
- Creates cases with services

**How to use:**
```powershell
# Run API import (server must be running)
.\import-via-api.ps1

# With custom credentials
.\import-via-api.ps1 -Email admin@awyad.org -Password YourPassword -BaseUrl http://localhost:3001/api/v1
```

**Pros:**
- ✅ Tests API endpoints
- ✅ Validates authentication & authorization
- ✅ Simulates real client behavior
- ✅ Can be automated in CI/CD

**Cons:**
- ❌ Slower than direct SQL
- ❌ Requires server to be running
- ❌ More prone to network errors

---

### 3. 🔄 Manual Entry via UI (Best for Learning)

Use the web forms to create data manually.

**How to use:**
1. Login to http://localhost:3001
2. Navigate to each section:
   - **Projects** → Click "New Project" → Fill form
   - **Indicators** → Click "New Indicator" → Fill form
   - **Activities** → Click "New Activity" → Fill form
   - **Cases** → Click "New Case" → Fill form

**Pros:**
- ✅ Learn how the system works
- ✅ Test form validations
- ✅ See user experience
- ✅ Perfect for custom data

**Cons:**
- ❌ Time consuming
- ❌ Prone to human error
- ❌ Not suitable for bulk data

---

### 4. ⏳ CSV Import (Coming Soon)

Import data from CSV files (your existing AWYAD data).

**CSV files in workspace:**
- `STEPs General Activity trackers 2024-2026 - Revised CP Activity tracker.csv`
- `Spotlight & GBV Mainstream Activity Tracking Table- AWYAD (1) - Activity Tracking Table - 2025.csv`
- `DESIGN MONITORING EVALUATION AND LEARNING FRAMEWORK - Detail M&E Plan Instructions.csv`

**Status:** Endpoint needs to be implemented

**Future capabilities:**
- ✅ Bulk import from Excel/CSV exports
- ✅ Map columns to database fields
- ✅ Validate before import
- ✅ Show preview and errors

---

## 🎯 Recommended Workflow

### For Initial Demo/Testing:
1. **Use SQL Seed Script** - Get started immediately with realistic data
2. **Test Manual UI** - Create 1-2 items manually to see forms
3. **Try API Script** - Verify APIs work correctly

### For Production:
1. **Manual Entry** - For ongoing daily operations
2. **CSV Import** - For bulk historical data migration
3. **API Integration** - For external system integrations

---

## 📋 Quick Start Commands

```powershell
# Make sure server is running
node src/server/index.js

# In another terminal:

# Option 1: Load demo data via SQL (fastest)
.\load-demo-data.ps1

# Option 2: Load demo data via API (tests endpoints)
.\import-via-api.ps1

# Option 3: Manual entry - open browser
start http://localhost:3001
```

---

## 🔍 Verify Data Loaded

After importing, check via:

**Database:**
```powershell
psql -U postgres -d awyad_mes -c "
SELECT 
  'Thematic Areas' as entity, COUNT(*) as count FROM thematic_areas
  UNION ALL SELECT 'Projects', COUNT(*) FROM projects
  UNION ALL SELECT 'Indicators', COUNT(*) FROM indicators
  UNION ALL SELECT 'Activities', COUNT(*) FROM activities
  UNION ALL SELECT 'Cases', COUNT(*) FROM cases;
"
```

**API:**
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"emailOrUsername":"admin@awyad.org","password":"Admin@123"}').data.accessToken

$headers = @{Authorization = "Bearer $token"}

Write-Host "Projects:" (Invoke-RestMethod -Uri "http://localhost:3001/api/v1/projects" -Headers $headers).data.length
Write-Host "Indicators:" (Invoke-RestMethod -Uri "http://localhost:3001/api/v1/indicators" -Headers $headers).data.length
Write-Host "Activities:" (Invoke-RestMethod -Uri "http://localhost:3001/api/v1/activities" -Headers $headers).data.length
Write-Host "Cases:" (Invoke-RestMethod -Uri "http://localhost:3001/api/v1/cases" -Headers $headers).data.length
```

**UI:**
- Visit http://localhost:3001
- Dashboard should show counts in summary cards
- Each section should display data in tables

---

## 🗑️ Clear Data (Reset)

To start fresh:

```sql
-- Careful! This deletes all data except admin user
TRUNCATE TABLE cases, activities, indicators, projects, thematic_areas CASCADE;
```

Then reload using any method above.

---

## 📚 Data Relationships

```
Thematic Areas
  └─ Projects (many)
       ├─ Indicators (many)
       │    └─ Activities (many)
       └─ Cases (many)
```

**Important:** Create in this order to maintain referential integrity:
1. Thematic Areas first
2. Projects (linked to thematic areas)
3. Indicators (linked to both)
4. Activities (linked to indicators & projects)
5. Cases (linked to projects)

---

## 🆘 Troubleshooting

**"Foreign key violation"**
- Create parent entities first (thematic areas, then projects)

**"Duplicate key value"**
- Clear existing data or use different codes

**"Permission denied"**
- Make sure you're logged in as admin
- Check token is valid

**"Connection refused"**
- Ensure PostgreSQL is running
- Ensure Node.js server is running (for API import)

---

## 🎉 What's Next?

After loading data:
1. ✅ Explore Dashboard - See summary statistics
2. ✅ Browse Projects - View project details
3. ✅ Check Indicators - Review progress tracking
4. ✅ Test Filters - Search and filter data
5. ✅ Try Exports - Export to CSV/PDF
6. ✅ Update Records - Test CRUD operations
7. ✅ User Management - Create additional users with different roles
