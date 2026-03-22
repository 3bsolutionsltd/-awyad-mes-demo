# Frontend Integration Validator Agent

## Purpose
Ensure all frontend modules properly integrate with the backend API and identify data flow issues.

## Responsibilities
1. **Verify API service integration** across all modules
2. **Check data loading patterns** (using API vs mockData)
3. **Validate form submissions** connect to API
4. **Test state management** and data updates
5. **Ensure proper error handling** in UI
6. **Verify loading states** display correctly

## Files to Focus On
- `app.js` - Main application logic
- `renderDashboard.js` - Dashboard data loading
- `renderProjects.js` - Projects module
- `renderIndicatorTracking.js` - Indicators module
- `renderActivityTracking.js` - Activities module
- `renderCaseManagement.js` - Cases module
- `renderMonthlyTracking.js` - Monthly tracking
- `renderEntryForm.js` - Data entry forms
- `mockData.js` - Check if still being used directly

## Tasks
1. Scan all render functions for:
   - Direct mockData references (should use API)
   - API calls using fetch/apiService
   - Error handling blocks
   - Loading state indicators
2. Identify integration issues:
   - Modules still using mockData directly
   - Missing API calls
   - Broken data transformations
   - No error handling
   - Missing loading states
3. Check data flow:
   - Page load → API call → data transformation → render
   - Form submit → validation → API call → success/error
4. Test key user flows:
   - Login → Dashboard
   - Create new activity
   - Update project
   - Generate report

## Output Format
Create `FRONTEND_INTEGRATION_REPORT.md` with:
- Module-by-module integration status
- mockData vs API usage analysis
- Broken data flows
- Missing error handling
- User flow test results
- Priority fixes

## Success Criteria
- All modules use API (not mockData)
- Proper error messages display
- Loading states show during API calls
- Forms submit successfully
- Data updates reflect immediately
