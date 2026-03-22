# Migration Guide - From Demo to Production System

This guide will help you migrate from the demo version to the new professional system.

## Overview

The system has been completely restructured with professional development practices:

### What's Changed:
- ✅ Proper project structure (src/, public/, data/, tests/)
- ✅ RESTful API with Express.js
- ✅ Centralized state management
- ✅ Input validation and error handling
- ✅ Logging and monitoring
- ✅ Security middleware
- ✅ Testing framework
- ✅ Code linting and formatting
- ✅ Environment configuration
- ✅ Documentation

### What's Preserved:
- ✅ All existing data (mockData)
- ✅ All existing functionality
- ✅ UI/UX (can be gradually improved)
- ✅ Export features
- ✅ All render functions

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Express.js for the server
- Winston for logging
- Joi for validation
- ESLint and Prettier for code quality
- Jest for testing

### Step 2: Configure Environment

```bash
# Copy environment template
copy .env.example .env
```

Edit `.env` if you need custom settings (optional for local development).

### Step 3: Prepare Data

The system automatically loads from `mockData.js`. No action needed if the file exists.

```bash
# Verify mockData.js exists
dir mockData.js
```

### Step 4: Start the Server

```bash
# Development mode (recommended)
npm run dev

# Or production mode
npm start
```

### Step 5: Verify Installation

Open your browser to: http://localhost:3000

Check that:
- ✅ Dashboard loads
- ✅ All navigation works
- ✅ Data is displayed correctly

### Step 6: Test API

```bash
# Test health endpoint
curl http://localhost:3000/api/v1/health

# Test dashboard stats
curl http://localhost:3000/api/v1/dashboard/stats
```

## File Location Changes

### Old Structure → New Structure

```
OLD                          NEW
─────────────────────────────────────────────────
app.js                    → src/client/app.js
mockData.js               → data/mockData.js
index.html                → public/index.html
renderDashboard.js        → src/client/components/
renderProjects.js         → src/client/components/
exportFunctions.js        → src/client/utils/
(no backend)              → src/server/ (NEW)
(no API)                  → src/server/routes/ (NEW)
(no validation)           → src/shared/validators.js (NEW)
(no logging)              → src/server/utils/logger.js (NEW)
```

## Backward Compatibility

During the transition period, the server serves files from both:
- `/public/` (new location)
- Root directory (old location)

This means the old demo will continue to work while you migrate.

## API Integration

### Old Way (Demo):
```javascript
// Direct access to mockData
import { mockData } from './mockData.js';
const activities = mockData.activities;
```

### New Way (Production):
```javascript
// API request
import apiService from './src/client/services/apiService.js';
const activities = await apiService.getActivities();
```

## Migrating Your Code

### 1. Update Imports

**Old:**
```javascript
import { mockData } from './mockData.js';
```

**New:**
```javascript
import apiService from './src/client/services/apiService.js';
```

### 2. Update Data Access

**Old:**
```javascript
function displayActivities() {
  const activities = mockData.activities;
  // render activities
}
```

**New:**
```javascript
async function displayActivities() {
  const response = await apiService.getActivities();
  const activities = response.data.data;
  // render activities
}
```

### 3. Update Form Submissions

**Old:**
```javascript
function submitActivity(formData) {
  mockData.activities.push(formData);
  // update UI
}
```

**New:**
```javascript
async function submitActivity(formData) {
  try {
    const response = await apiService.createActivity(formData);
    // update UI with response.data
  } catch (error) {
    // handle error
  }
}
```

## Features to Implement Next

### Phase 1: Core Functionality (Week 1-2)
- [ ] Migrate all render functions to components
- [ ] Update app.js to use API service
- [ ] Test all CRUD operations
- [ ] Verify data persistence

### Phase 2: Enhanced Features (Week 3-4)
- [ ] Add user authentication
- [ ] Implement proper database (PostgreSQL/MongoDB)
- [ ] Add advanced filtering
- [ ] Implement data validation on forms

### Phase 3: Production Ready (Week 5-6)
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive tests
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation completion

## Testing Your Migration

### 1. Verify Data Loading
```bash
# Check server logs
cat logs/combined.log
```

### 2. Test Each Page
- [ ] Dashboard
- [ ] Projects
- [ ] Activities
- [ ] Indicators
- [ ] Case Management
- [ ] Monthly Tracking
- [ ] Entry Form

### 3. Test API Endpoints
```bash
# Get projects
curl http://localhost:3000/api/v1/projects

# Get activities
curl http://localhost:3000/api/v1/activities

# Get dashboard
curl http://localhost:3000/api/v1/dashboard/overview
```

### 4. Test Data Operations
- [ ] Create new activity
- [ ] Update existing activity
- [ ] Delete activity
- [ ] Export data

## Rollback Plan

If you need to roll back to the demo:

1. Keep the old files (they're not deleted)
2. Stop the new server
3. Use any simple HTTP server:
   ```bash
   npx http-server -p 3000
   ```

## Common Issues

### Issue: Port 3000 already in use
**Solution:** Change port in `.env`:
```env
PORT=3001
```

### Issue: Cannot find module 'express'
**Solution:** Reinstall dependencies:
```bash
npm install
```

### Issue: Data not loading
**Solution:** Check that mockData.js is in the data/ directory:
```bash
copy mockData.js data\mockData.js
```

### Issue: API returns 404
**Solution:** Verify API base URL in your requests:
```javascript
// Correct
fetch('/api/v1/activities')

// Incorrect
fetch('/activities')
```

## Getting Help

1. Check logs: `logs/combined.log` and `logs/error.log`
2. Review README_NEW.md for complete documentation
3. Check server console for error messages
4. Test API endpoints with curl or Postman

## Next Steps

After successful migration:

1. **Review the code structure**
   - Familiarize yourself with new directories
   - Understand the separation of concerns

2. **Start using the API**
   - Test all endpoints
   - Understand request/response formats

3. **Customize for your needs**
   - Add custom validation rules
   - Implement additional features
   - Integrate with your database

4. **Deploy to production**
   - Follow deployment guide
   - Set up monitoring
   - Configure backups

---

**Questions or issues?** 
- Check the logs in `logs/` directory
- Review error messages carefully
- Test one component at a time
