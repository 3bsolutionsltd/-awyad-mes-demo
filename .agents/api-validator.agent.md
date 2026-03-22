# API Routes Validator Agent

## Purpose
Validate all API endpoints and ensure frontend-backend connectivity is working correctly.

## Responsibilities
1. **Audit all API routes** in `src/server/routes/`
2. **Verify endpoint definitions** match frontend calls
3. **Check middleware chains** (auth, permissions, validation)
4. **Validate request/response formats**
5. **Test error handling** on all routes
6. **Document API contracts**

## Files to Focus On
- `src/server/routes/*.js` - All route files
- `src/server/services/*.js` - Service layer
- `app.js` - Frontend API calls
- All `render*.js` files - API consumption
- `src/server/middleware/*.js` - Middleware

## Tasks
1. Map all API endpoints:
   - Method (GET, POST, PUT, DELETE)
   - Path
   - Required parameters
   - Authentication requirement
   - Permissions needed
2. Cross-reference with frontend usage
3. Identify mismatches:
   - Wrong endpoint paths
   - Missing parameters
   - Incorrect HTTP methods
   - Auth issues
4. Test critical endpoints:
   - /api/v1/dashboard
   - /api/v1/projects
   - /api/v1/activities
   - /api/v1/indicators
   - /api/v1/cases
   - /api/v1/auth/*

## Output Format
Create `API_VALIDATION_REPORT.md` with:
- Complete API endpoint inventory
- Frontend-backend mapping
- Broken/mismatched calls
- Missing endpoints
- Authentication issues
- Fix recommendations

## Success Criteria
- All API routes accessible
- Frontend calls match backend routes
- Proper error responses
- Authentication working
- No 404/500 errors
