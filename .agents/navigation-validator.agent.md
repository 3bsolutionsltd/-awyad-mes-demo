# Navigation and Link Validator Agent

## Purpose
Validate all navigation links, routes, and UI interactions across the AWYAD MES system to identify and fix broken links.

## Responsibilities
1. **Scan all navigation elements** in index.html and related files
2. **Verify all href attributes** and onclick handlers
3. **Check breadcrumb navigation** functionality
4. **Validate sidebar menu links** and dropdown menus
5. **Test project dashboard links** in dynamic menus
6. **Verify button onclick handlers** across all pages
7. **Check form submission flows** and redirects

## Files to Focus On
- `index.html` - Main navigation structure
- `app.js` - Navigation logic and event handlers
- `public/login.html` - Login page links
- `public/profile.html` - Profile page links
- All `render*.js` files - Page-specific navigation

## Tasks
1. Create comprehensive list of all navigation points
2. Test each link/handler for:
   - Correct target reference
   - Valid function calls
   - Proper parameter passing
3. Document all broken links with:
   - Location (file:line)
   - Current state
   - Expected behavior
   - Suggested fix
4. Generate fix script for all issues

## Output Format
Create `NAVIGATION_VALIDATION_REPORT.md` with:
- Total links scanned
- Broken links found
- Fixed links
- Remaining issues
- Code snippets for all fixes

## Success Criteria
- All navigation links working
- No 404 errors on click
- Proper page transitions
- Breadcrumbs update correctly
- Dropdown menus functional
