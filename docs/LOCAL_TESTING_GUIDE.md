# LOCAL TESTING GUIDE
## AWYAD MES System - Multi-Agent Implementation Validation

**Version:** 1.0  
**Date:** March 12, 2026  
**Purpose:** Comprehensive testing guide for validating the multi-agent implementation locally before production deployment

---

## 📋 TABLE OF CONTENTS
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [API Testing Guide](#api-testing-guide)
7. [End-to-End Testing Scenarios](#end-to-end-testing-scenarios)
8. [Troubleshooting](#troubleshooting)
9. [Success Criteria](#success-criteria)

---

## ✅ PREREQUISITES

### System Requirements
- [x] **Node.js:** v16.0.0 or higher (`node --version`)
- [x] **PostgreSQL:** v13 or higher (`psql --version`)
- [x] **npm:** v8.0.0 or higher (`npm --version`)
- [x] **Git:** For version control
- [x] **Code Editor:** VS Code recommended
- [x] **API Testing Tool:** Postman, Insomnia, or Thunder Client

### Verify Installation
```powershell
# Check Node.js
node --version

# Check PostgreSQL
psql --version

# Check npm
npm --version

# Check if PostgreSQL service is running
Get-Service -Name postgresql*
```

### Install Dependencies
```powershell
# Navigate to project directory
cd C:\Users\DELL\awyad-mes-demo

# Install all npm packages (if not already installed)
npm install

# Verify package.json dependencies are installed
npm list --depth=0
```

**Expected Dependencies:**
- ✅ express@4.18.2
- ✅ pg@8.16.3 (PostgreSQL driver)
- ✅ jsonwebtoken@9.0.3
- ✅ bcryptjs@2.4.3
- ✅ joi@17.11.0
- ✅ chart.js@4.5.1
- ✅ winston@3.11.0
- ✅ helmet@7.1.0
- ✅ cors@2.8.5

---

## ⚙️ ENVIRONMENT SETUP

### Step 1: Create .env File
Currently only `.env.example` exists. Create actual `.env` file:

```powershell
# Copy example to create .env
Copy-Item .env.example .env

# Edit .env file
notepad .env
```

### Step 2: Configure Environment Variables
Edit `.env` with the following critical settings:

```env
NODE_ENV=development
PORT=3001
HOST=localhost

# ⚠️ CRITICAL: Enable PostgreSQL
USE_DATABASE=true  # Change from false to true!

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=awyad_mes
DB_USER=postgres
DB_PASSWORD=your_actual_password_here  # Update this!
DB_POOL_SIZE=20

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production-$(Get-Random)
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=/api/v1
MAX_REQUEST_SIZE=10mb

# Security
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug  # Use debug for testing
LOG_FILE=logs/app.log
```

**⚠️ IMPORTANT CHANGES:**
1. **USE_DATABASE=true** (enables PostgreSQL instead of JSON files)
2. **DB_PASSWORD** (set your actual PostgreSQL password)
3. **LOG_LEVEL=debug** (for detailed testing logs)
4. **PORT=3001** (avoid conflicts if port 3000 is in use)

### Step 3: Create Logs Directory
```powershell
# Create logs directory if it doesn't exist
New-Item -ItemType Directory -Force -Path logs
```

---

## 🗄️ DATABASE SETUP

### Step 1: Verify PostgreSQL is Running
```powershell
# Check PostgreSQL service status
Get-Service -Name postgresql*

# If not running, start it
Start-Service postgresql-x64-15  # Adjust version number as needed

# Test connection
psql -U postgres -c "SELECT version();"
```

### Step 2: Create Database (If Not Exists)
```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE awyad_mes;
\c awyad_mes
\q
```

### Step 3: Backup Existing Data (If Any)
```powershell
# Create backup directory
New-Item -ItemType Directory -Force -Path database\backups

# Backup existing database
pg_dump -U postgres -d awyad_mes -F c -f database\backups\awyad_mes_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').backup

# List backups
Get-ChildItem database\backups\
```

### Step 4: Run Database Migrations
```powershell
# Navigate to migrations directory
cd database\migrations

# Run all migrations
psql -U postgres -d awyad_mes -f run_all_migrations.sql

# Expected output: SUCCESS messages for all 9 migrations
```

**⚠️ Verify Migrations:**
```sql
-- Connect to database
psql -U postgres -d awyad_mes

-- Check new tables exist
\dt

-- Should see these NEW tables:
-- strategies
-- pillars
-- core_program_components
-- activity_budget_transfers
-- currency_rates
-- case_types
-- case_categories
-- monthly_snapshots
-- non_program_categories
-- non_program_activities
-- system_configurations
-- enhanced RBAC tables

-- Check case_beneficiaries table structure (should have NO beneficiary_name)
\d case_beneficiaries

-- Exit psql
\q
```

### Step 5: Seed Case Types (Optional but Recommended)
```powershell
# Run case type seeds
psql -U postgres -d awyad_mes -f ..\seeds\seed_case_types.sql

# Verify seed data
psql -U postgres -d awyad_mes -c "SELECT * FROM case_types;"
psql -U postgres -d awyad_mes -c "SELECT * FROM case_categories;"
```

---

## 🔧 BACKEND INTEGRATION

### Step 1: Update Route Registration
The route registration needs one critical update:

**File:** `src/server/routes/index.js`

**⚠️ REQUIRED CHANGE:**
Replace old `cases.js` with new `casesNew.js` (privacy-first implementation)

```javascript
// OLD (Line 8):
import casesRouter from './cases.js';

// NEW (Line 8):
import casesRouter from './casesNew.js';
```

**Why:** `casesNew.js` implements privacy-first case management (NO NAME fields), while `cases.js` is the old implementation with beneficiary names.

### Step 2: Verify Route Registrations
Open `src/server/routes/index.js` and confirm these routes are registered:

```javascript
✅ router.use('/monthly-tracking', monthlyTrackingRouter);     // NEW
✅ router.use('/non-program-activities', nonProgramActivitiesRouter);  // NEW
✅ router.use('/cases', casesRouter);  // Updated to use casesNew.js
✅ router.use('/indicators', indicatorsRouter);  // Enhanced
✅ router.use('/activities', activitiesRouter);  // Enhanced
```

### Step 3: Start the Server
```powershell
# From project root
cd C:\Users\DELL\awyad-mes-demo

# Start server in development mode
npm run dev

# Expected output:
# 🚀 Server running at http://localhost:3001
# 📊 API available at http://localhost:3001/api/v1
# 🌍 Environment: development
# 💾 Storage: PostgreSQL Database
# ✅ Server started successfully
```

### Step 4: Test Health Endpoint
```powershell
# In new PowerShell window
curl http://localhost:3001/api/v1/health

# Expected response:
# {
#   "success": true,
#   "message": "API is running",
#   "timestamp": "2026-03-12T...",
#   "database": {
#     "enabled": true,
#     "status": "healthy"
#   }
# }
```

**✅ SUCCESS INDICATOR:** `"database.status": "healthy"`

---

## 🎨 FRONTEND INTEGRATION

### Step 1: Verify Static File Serving
The server already serves static files from `public/` directory.

### Step 2: Check Required HTML Pages
Verify these HTML pages exist or need creation:

```powershell
# Check existing pages
Get-ChildItem public\*.html

# Expected pages (may need creation):
# - indicators.html (for indicator management)
# - activities.html (for activity management with budget transfers)
# - cases.html (for privacy-first case management)
# - dashboards.html (for strategic and project dashboards)
# - monthly-tracking.html (for performance monitoring)
```

### Step 3: Verify JavaScript Files Integration
Check that HTML pages include:

**For Indicators Page:**
```html
<!-- Core Libraries -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1"></script>

<!-- Indicator Module -->
<script type="module" src="/js/indicators/indicatorFormEnhanced.js"></script>
<script type="module" src="/js/indicators/indicatorListEnhanced.js"></script>
<script type="module" src="/js/indicators/indicatorMapping.js"></script>

<!-- CSS -->
<link rel="stylesheet" href="/css/dashboards.css">
```

**For Activities Page:**
```html
<script type="module" src="/js/activities/activityFormEnhanced.js"></script>
<script type="module" src="/js/activities/budgetTransfer.js"></script>
<script type="module" src="/js/activities/financialDashboard.js"></script>
```

**For Cases Page:**
```html
<script type="module" src="/js/cases/caseFormEnhanced.js"></script>
<script type="module" src="/js/cases/caseListEnhanced.js"></script>
```

**For Dashboards Page:**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1"></script>
<script type="module" src="/js/dashboards/strategicDashboard.js"></script>
<script type="module" src="/js/dashboards/projectDashboard.js"></script>
<link rel="stylesheet" href="/css/dashboards.css">
```

**For Monthly Tracking Page:**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1"></script>
<script type="module" src="/js/monthly/monthlyTracking.js"></script>
<script type="module" src="/js/monthly/reachVsTarget.js"></script>
<script type="module" src="/js/monthly/performanceRates.js"></script>
<script type="module" src="/js/monthly/monthlyCharts.js"></script>
```

### Step 4: Test Frontend Access
```powershell
# Open browser to test pages
Start-Process "http://localhost:3001/"
Start-Process "http://localhost:3001/indicators.html"  # If exists
```

---

## 🧪 API TESTING GUIDE

### Authentication First
All protected endpoints require JWT token. Test authentication:

**1. Login:**
```http
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "Admin"
    }
  }
}
```

**Save token for subsequent requests!**

### Test NEW Indicator Endpoints (11+ new endpoints)

**1. Get indicators by scope:**
```http
GET http://localhost:3001/api/v1/indicators?scope=AWYAD
Authorization: Bearer YOUR_TOKEN_HERE
```

**2. Create AWYAD indicator:**
```http
POST http://localhost:3001/api/v1/indicators
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "indicator_name": "Number of youth accessing vocational training",
  "indicator_scope": "AWYAD",
  "thematic_area_id": 1,
  "disaggregation_categories": ["age", "gender", "disability"],
  "data_type": "number",
  "q1_target": 100,
  "q2_target": 150,
  "q3_target": 200,
  "q4_target": 250,
  "lop_target": 700,
  "baseline": 0,
  "baseline_date": "2024-01-01"
}
```

**3. Create project indicator:**
```http
POST http://localhost:3001/api/v1/indicators
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "indicator_name": "Beneficiaries completing IT training",
  "indicator_scope": "Project",
  "project_id": 1,
  "result_area": "Outcome 1.1",
  "disaggregation_categories": ["age", "gender"],
  "data_type": "number",
  "q1_target": 50,
  "q2_target": 75,
  "q3_target": 100,
  "q4_target": 125,
  "lop_target": 350
}
```

**4. Map project indicator to AWYAD:**
```http
POST http://localhost:3001/api/v1/indicators/mappings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "project_indicator_id": 2,
  "awyad_indicator_id": 1,
  "contribution_weight": 50
}
```

**5. Get AWYAD aggregated data:**
```http
GET http://localhost:3001/api/v1/indicators/1/awyad-aggregated
Authorization: Bearer YOUR_TOKEN_HERE
```

### Test NEW Activity Endpoints (15+ enhanced)

**1. Create multi-currency activity:**
```http
POST http://localhost:3001/api/v1/activities
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "project_id": 1,
  "activity_name": "Youth Vocational Training",
  "activity_type": "Training",
  "is_costed": true,
  "planned_budget": 50000000,
  "currency": "UGX",
  "start_date": "2024-04-01",
  "end_date": "2024-06-30",
  "pwds_male": 5,
  "pwds_female": 7,
  "pwds_other": 1,
  "total_pwds": 13
}
```

**2. Get currency rates:**
```http
GET http://localhost:3001/api/v1/activities/currency-rates
Authorization: Bearer YOUR_TOKEN_HERE
```

**3. Create budget transfer:**
```http
POST http://localhost:3001/api/v1/activities/budget-transfers
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "source_activity_id": 1,
  "destination_activity_id": 2,
  "amount": 5000000,
  "transfer_reason": "Urgent need for additional training resources",
  "approved_by": "Program Director"
}
```

**4. Get activity with budget transfers:**
```http
GET http://localhost:3001/api/v1/activities/1/budget-transfers
Authorization: Bearer YOUR_TOKEN_HERE
```

### Test NEW Case Endpoints (30+ privacy-first)

**⚠️ CRITICAL:** All case endpoints must REJECT any `name`, `beneficiary_name`, or identifiable fields!

**1. Get case types:**
```http
GET http://localhost:3001/api/v1/cases/types
Authorization: Bearer YOUR_TOKEN_HERE
```

**2. Create case (NO NAME):**
```http
POST http://localhost:3001/api/v1/cases
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "project_id": 1,
  "case_type_id": 1,
  "case_category_id": 1,
  "date_opened": "2024-03-01",
  "age": 22,
  "gender": "Female",
  "location_district": "Kampala",
  "location_subcounty": "Central",
  "referred_from": "Community Health Worker",
  "support_offered": "Vocational counseling and referral to training",
  "is_pwd": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "case_number": "CASE-2024-001",  // Auto-generated
    "project_id": 1,
    "case_type_id": 1,
    // NO name field anywhere!
  }
}
```

**3. Test name rejection (should fail):**
```http
POST http://localhost:3001/api/v1/cases
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "project_id": 1,
  "beneficiary_name": "John Doe",  // Should be rejected!
  "case_type_id": 1
}
```

**Expected:** 400 Bad Request - "Name fields are not allowed"

**4. Get case statistics:**
```http
GET http://localhost:3001/api/v1/cases/statistics
Authorization: Bearer YOUR_TOKEN_HERE
```

**5. Get cases by type:**
```http
GET http://localhost:3001/api/v1/cases?case_type_id=1
Authorization: Bearer YOUR_TOKEN_HERE
```

### Test NEW Monthly Tracking Endpoints (20+)

**1. Generate monthly snapshot:**
```http
POST http://localhost:3001/api/v1/monthly-tracking/snapshots/generate
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "project_id": 1,
  "month": "2024-03",
  "generate_for_all_projects": false
}
```

**2. Get performance rates:**
```http
GET http://localhost:3001/api/v1/monthly-tracking/performance-rates?project_id=1&months=6
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "programmatic_rate": 75.5,
    "activity_completion_rate": 82.0,
    "beneficiary_reach_rate": 68.3,
    "budget_burn_rate": 71.2,
    "monthly_history": [...]
  }
}
```

**3. Get reach vs target analysis:**
```http
GET http://localhost:3001/api/v1/monthly-tracking/reach-vs-target?project_id=1
Authorization: Bearer YOUR_TOKEN_HERE
```

**4. Get monthly trends:**
```http
GET http://localhost:3001/api/v1/monthly-tracking/trends?project_id=1&months=12
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🎯 END-TO-END TESTING SCENARIOS

### Scenario 1: Complete Indicator Workflow
**Goal:** Create AWYAD indicator, create project indicator, map them, verify aggregation

1. **Create AWYAD Indicator** (Training access)
2. **Create Project Indicator** (IT training completion)
3. **Map Project to AWYAD** (50% contribution weight)
4. **Add project data** (50 beneficiaries in Q1)
5. **Verify AWYAD aggregation** (should show 25 beneficiaries - 50% of 50)
6. **Check both dashboards** (Strategic shows AWYAD, Project shows project indicator)

**Success Criteria:**
- ✅ AWYAD indicator shows aggregated data from project
- ✅ Contribution weight correctly applied
- ✅ Q1-Q4 data properly structured
- ✅ LOP calculations accurate

### Scenario 2: Multi-Currency Budget Transfer
**Goal:** Create activities in different currencies, transfer budget, verify conversion

1. **Get current exchange rates** (`/activities/currency-rates`)
2. **Create Activity A** (UGX 50,000,000)
3. **Create Activity B** (USD 10,000)
4. **Transfer from A to B** (UGX 5,000,000)
5. **Verify Activity A budget** (reduced by 5,000,000)
6. **Verify Activity B budget** (increased by converted amount)
7. **Check transfer history** (audit trail present)
8. **View financial dashboard** (shows both currencies)

**Success Criteria:**
- ✅ Currency conversion accurate
- ✅ Both activity budgets updated correctly
- ✅ Transfer reversible
- ✅ Audit trail captured
- ✅ Dashboard shows multi-currency totals

### Scenario 3: Privacy-First Case Management
**Goal:** Create case without name, verify privacy, test referrals

1. **Get case types** (`/cases/types`)
2. **Create case without name** (age: 22, gender: Female)
3. **Verify auto case number** (CASE-2024-XXX)
4. **Try to create case with name** (should fail validation)
5. **Update case with referral** (referred_to: "Medical Clinic")
6. **Get case statistics** (aggregate data only)
7. **Export cases** (verify NO name in export)
8. **Test case list filters** (by type, category, district)

**Success Criteria:**
- ✅ No name field accepted
- ✅ Auto case number generated
- ✅ Validation blocks name attempts
- ✅ Referral tracking works
- ✅ Statistics aggregate without exposing identities
- ✅ Export privacy-compliant

### Scenario 4: Monthly Performance Tracking
**Goal:** Generate snapshot, calculate rates, analyze reach vs target

1. **Create project with activities and indicators**
2. **Add planned targets** (Q1: 100, Q2: 150, Q3: 200, Q4: 250)
3. **Add actual data** (Q1: 75 - 25% below target)
4. **Generate monthly snapshot** (`POST /monthly-tracking/snapshots/generate`)
5. **Get performance rates** (should show 75% programmatic rate)
6. **Get reach vs target** (should identify 25% gap)
7. **View monthly dashboard** (4 KPI cards, trend charts)
8. **Compare projects** (if multiple projects exist)

**Success Criteria:**
- ✅ Snapshot captured automatically
- ✅ 4 performance rates calculated accurately
- ✅ Gap analysis identifies shortfalls
- ✅ Trend charts render
- ✅ At-risk indicators flagged

### Scenario 5: Strategic Dashboard Navigation
**Goal:** Navigate full organizational hierarchy in strategic dashboard

1. **Open Strategic Dashboard**
2. **Verify Strategies listed** (expand/collapse works)
3. **Click Strategy → View Pillars**
4. **Click Pillar → View Components**
5. **Click Component → View linked indicators**
6. **Test filters** (by thematic area, status)
7. **Verify rollup statistics** (aggregated to strategy level)
8. **Test drill-down to project level**

**Success Criteria:**
- ✅ Full hierarchy renders (Strategies → Pillars → Components)
- ✅ Expand/collapse interactions smooth
- ✅ Aggregation accurate at each level
- ✅ Drill-down to projects works
- ✅ Responsive on mobile/tablet

---

## 🐛 TROUBLESHOOTING

### Issue: Server won't start - "Database connection failed"
**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Verify PostgreSQL service running: `Get-Service postgresql*`
2. Check `.env` has correct `DB_PASSWORD`
3. Test connection: `psql -U postgres -d awyad_mes`
4. Verify `USE_DATABASE=true` in `.env`

### Issue: Migration fails - "relation already exists"
**Symptoms:**
```
ERROR: relation "strategies" already exists
```

**Solutions:**
1. Migrations ran partially. Check what exists:
   ```sql
   \dt  -- List tables
   ```
2. Either run remaining migrations individually OR
3. Rollback and start fresh:
   ```powershell
   psql -U postgres -d awyad_mes -f database\migrations\rollback_all_migrations.sql
   psql -U postgres -d awyad_mes -f database\migrations\run_all_migrations.sql
   ```

### Issue: API returns 401 Unauthorized
**Symptoms:**
```json
{"success": false, "message": "No token provided"}
```

**Solutions:**
1. Login first: `POST /api/v1/auth/login`
2. Copy token from response
3. Add header: `Authorization: Bearer YOUR_TOKEN`
4. Check token not expired (1 hour default)

### Issue: Cases API accepts name field (privacy violation!)
**Symptoms:**
Case created with `beneficiary_name` field

**Solutions:**
1. Verify using `casesNew.js` not `cases.js`:
   ```javascript
   // In src/server/routes/index.js
   import casesRouter from './casesNew.js';  // Correct
   ```
2. Restart server after changing route
3. Test validation: should return 400 error for name fields

### Issue: Frontend charts not rendering
**Symptoms:**
Console error: "Chart is not defined"

**Solutions:**
1. Verify Chart.js CDN included:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1"></script>
   ```
2. Add before custom chart scripts
3. Check browser console for errors
4. Test with simple chart first

### Issue: Currency conversion wrong
**Symptoms:**
Budget transfer shows incorrect converted amounts

**Solutions:**
1. Check currency rates exist:
   ```sql
   SELECT * FROM currency_rates WHERE effective_date <= CURRENT_DATE ORDER BY effective_date DESC LIMIT 1;
   ```
2. If no rates, insert defaults:
   ```sql
   INSERT INTO currency_rates (from_currency, to_currency, rate, effective_date) VALUES
   ('USD', 'UGX', 3700, CURRENT_DATE),
   ('EUR', 'UGX', 4000, CURRENT_DATE),
   ('GBP', 'UGX', 4680, CURRENT_DATE);
   ```
3. Verify conversions use latest rates

### Issue: Performance rates show 0% or null
**Symptoms:**
`GET /monthly-tracking/performance-rates` returns null values

**Solutions:**
1. Verify data exists:
   ```sql
   SELECT COUNT(*) FROM activities WHERE project_id = 1;
   SELECT COUNT(*) FROM indicators WHERE project_id = 1;
   ```
2. Generate snapshot first: `POST /monthly-tracking/snapshots/generate`
3. Ensure targets set (q1_target, q2_target, etc.)
4. Check actual values recorded

### Issue: Module imports fail - "Cannot find module"
**Symptoms:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './indicatorService.js'
```

**Solutions:**
1. Verify file exists:
   ```powershell
   Test-Path src\server\services\indicatorService.js
   ```
2. Check import path includes `.js` extension
3. Verify file export: `export default { ... }`
4. Restart server (imports cached)

---

## ✅ SUCCESS CRITERIA

### Backend Testing Complete When:
- [x] All 9 database migrations run successfully
- [x] Server starts without errors
- [x] Health endpoint returns `"database.status": "healthy"`
- [x] Authentication works (login returns JWT token)
- [x] All indicator endpoints respond correctly (11+ endpoints)
- [x] All activity endpoints respond correctly (15+ endpoints)
- [x] All case endpoints respond correctly (30+ endpoints)
- [x] All monthly tracking endpoints respond correctly (20+ endpoints)
- [x] Case API rejects name fields (privacy validation working)
- [x] Currency conversion calculates correctly
- [x] Budget transfers update both activities
- [x] Performance rates calculate accurately

### Frontend Testing Complete When:
- [x] All JavaScript files load without console errors
- [x] Chart.js renders visualizations
- [x] Indicator form switches fields based on scope (AWYAD vs Project)
- [x] Activity form shows currency dropdown and PWD fields
- [x] Case form has NO name field
- [x] Budget transfer interface shows conversion preview
- [x] Strategic dashboard renders full hierarchy
- [x] Project dashboard shows all 7 sections
- [x] Monthly tracking displays 4 KPI cards correctly
- [x] All dashboards responsive (mobile/tablet/desktop)
- [x] Dark mode toggle works (if implemented)

### End-to-End Testing Complete When:
- [x] Scenario 1: Indicator workflow complete (AWYAD + Project + Mapping)
- [x] Scenario 2: Multi-currency transfer complete (UGX → USD)
- [x] Scenario 3: Privacy-first case creation complete (NO names)
- [x] Scenario 4: Monthly performance tracking complete (all 4 rates)
- [x] Scenario 5: Strategic dashboard navigation complete (full hierarchy)
- [x] All user roles tested (Admin, Program Manager, Data Officer)
- [x] Data export tested (CSV/Excel) - privacy-compliant
- [x] Performance acceptable (page loads <3s, API responses <500ms)

### Ready for Production When:
- [x] All success criteria above met
- [x] No critical bugs identified
- [x] Security audit passed (JWT, CORS, rate limiting)
- [x] Backup strategy tested (database backup/restore)
- [x] Rollback procedures documented and tested
- [x] Production environment configured (.env for prod)
- [x] Deployment runbook created
- [x] User training materials prepared

---

## 📝 TESTING CHECKLIST

Use this checklist to track testing progress:

### Database Setup
- [ ] PostgreSQL service running
- [ ] Database created
- [ ] Backup created (if existing data)
- [ ] All 9 migrations executed
- [ ] Case types seeded
- [ ] All 12 new tables present
- [ ] case_beneficiaries has NO beneficiary_name column

### Environment Configuration
- [ ] .env file created
- [ ] USE_DATABASE=true
- [ ] DB_PASSWORD correct
- [ ] JWT_SECRET generated
- [ ] PORT configured
- [ ] logs/ directory created

### Backend Integration
- [ ] Route registration updated (casesNew.js)
- [ ] npm install completed
- [ ] Server starts successfully
- [ ] Health endpoint responds
- [ ] Database connection healthy
- [ ] Authentication works

### API Testing - Indicators
- [ ] GET /indicators?scope=AWYAD
- [ ] POST /indicators (AWYAD)
- [ ] POST /indicators (Project)
- [ ] POST /indicators/mappings
- [ ] GET /indicators/:id/awyad-aggregated
- [ ] PUT /indicators/:id
- [ ] DELETE /indicators/:id

### API Testing - Activities
- [ ] POST /activities (multi-currency)
- [ ] GET /activities/currency-rates
- [ ] POST /activities/budget-transfers
- [ ] GET /activities/:id/budget-transfers
- [ ] PUT /activities/:id
- [ ] GET /activities?project_id=X

### API Testing - Cases
- [ ] GET /cases/types
- [ ] POST /cases (without name) ✅
- [ ] POST /cases (with name) ❌ Should fail
- [ ] GET /cases/statistics
- [ ] GET /cases?case_type_id=X
- [ ] PUT /cases/:id
- [ ] Export cases (verify NO names)

### API Testing - Monthly Tracking
- [ ] POST /monthly-tracking/snapshots/generate
- [ ] GET /monthly-tracking/performance-rates
- [ ] GET /monthly-tracking/reach-vs-target
- [ ] GET /monthly-tracking/trends

### Frontend Integration
- [ ] All JavaScript files accessible
- [ ] Chart.js loads
- [ ] indicatorFormEnhanced.js works
- [ ] activityFormEnhanced.js works
- [ ] caseFormEnhanced.js works (NO name field)
- [ ] budgetTransfer.js works
- [ ] strategicDashboard.js renders
- [ ] projectDashboard.js renders
- [ ] monthlyTracking.js works
- [ ] CSS styles applied

### End-to-End Scenarios
- [ ] Scenario 1: Complete indicator workflow
- [ ] Scenario 2: Multi-currency budget transfer
- [ ] Scenario 3: Privacy-first case management
- [ ] Scenario 4: Monthly performance tracking
- [ ] Scenario 5: Strategic dashboard navigation

### Final Validation
- [ ] No console errors
- [ ] No server errors
- [ ] All success criteria met
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for production

---

## 📞 NEXT STEPS AFTER TESTING

Once all testing complete:

1. **Document Issues:** Create issue list for any bugs found
2. **Performance Optimization:** If needed, add indexes or optimize queries
3. **Security Hardening:** Final security audit
4. **Production Deployment:** Follow DEPLOYMENT.md guide
5. **User Training:** Conduct training sessions
6. **Go Live:** Launch to production!

---

**Testing Status:** 🚦 READY TO BEGIN  
**Last Updated:** March 12, 2026  
**Tester:** _______________  
**Date:** _______________
