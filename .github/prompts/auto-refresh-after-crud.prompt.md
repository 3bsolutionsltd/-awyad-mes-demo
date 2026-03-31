---
description: "Fix stale UI after CRUD operations — after creating or editing data (indicators, projects, activities, thematic areas, cases), the page requires a manual refresh to show the changes. Use when users must refresh to see new data."
name: "auto-refresh-after-crud"
argument-hint: "Optionally scope to a module, e.g. 'project dashboard' or 'indicators'. Omit to audit all."
agent: "agent"
---

## Goal

After any successful create or edit operation, the relevant section of the page must re-render automatically — **no manual refresh required**.

---

## Architecture Overview

The app uses a hash-based router (`public/js/navigation.js`). Routes map to async render functions that return HTML strings injected into `#main-content` (or `#content-area`). All create/edit modals accept an `onSuccess` callback that fires after a successful API call.

### Gold-standard re-render pattern (already in use)

From `public/js/dashboards/projectDashboard.js`:

```js
window.addProjectIndicator = (projectId, projectName) => {
    showCreateProjectIndicatorModal(projectId, projectName, () => {
        renderProjectDashboardNew(projectId).then(html => {
            const container = document.getElementById('main-content')
                || document.querySelector('[data-section="project-dashboard"]');
            if (container) container.innerHTML = html;
        });
    });
};
```

Use this pattern as a reference for all fixes.

---

## What to Fix

### 1. Find all `window.location.reload()` / `location.reload()` after CRUD

Search `public/js/**` for:
- `window.location.reload()`
- `location.reload()`

**Do NOT change these legitimate uses:**
- Error-state retry buttons (`onclick="location.reload()"` inside alert/error HTML templates) — these are intentional UI affordances.
- The `app.js` error boundary reload button.

**Do change:**
- Any `location.reload()` or `window.location.reload()` called inside an `onSuccess` callback or directly after a successful API response in a CRUD action handler.

**Replacement pattern:** Call the appropriate targeted re-render function instead. See Section 3 for the mapping of route → render function.

---

### 2. Find all call sites of modal functions not passing an `onSuccess` callback

Search `public/js/**` for calls to:
- `showCreateProjectModal(`
- `showEditProjectModal(`
- `showCreateProjectIndicatorModal(`
- `showEditIndicatorModal(`
- `showCreateThematicAreaModal(`
- `showEditThematicAreaModal(`
- `showCreateActivityModal(`
- `showEditActivityModal(`
- `showCreateCaseModal(`
- `showEditCaseModal(`

For each call site, confirm an `onSuccess` callback is passed (last argument). If missing or empty (`() => {}`), add the correct re-render callback from Section 3.

---

### 3. Route → Re-render function mapping

| Active route (`window.location.hash`) | Re-render call |
|---------------------------------------|---------------|
| `#project-dashboard` | `renderProjectDashboardNew(projectId).then(html => { document.getElementById('main-content').innerHTML = html; })` |
| `#projects` | `renderProjects(document.getElementById('content-area'))` |
| `#thematic-areas` | `renderThematicAreas(document.getElementById('main-content'))` |
| `#activities` | `renderActivities(document.getElementById('content-area'))` |
| `#cases` | `renderCases(document.getElementById('content-area'))` |
| Financial dashboard | `window.refreshFinancialDashboard()` |

To detect context at callback time when a callback is defined in a shared location:

```js
const hash = window.location.hash;
if (hash.startsWith('#project-dashboard')) {
    const projectId = new URLSearchParams(hash.split('?')[1] || '').get('id');
    renderProjectDashboardNew(projectId).then(html => {
        const container = document.getElementById('main-content')
            || document.querySelector('[data-section="project-dashboard"]');
        if (container) container.innerHTML = html;
    });
} else {
    // fallback for list pages — call the appropriate render function
}
```

---

### 4. Import requirements

When adding a re-render call in a file, ensure the render function is imported. Example:

```js
import { renderProjectDashboardNew } from '../dashboards/projectDashboard.js';
// or
import { renderThematicAreas } from '../thematicAreas.js';
```

Check existing imports at the top of the file first to avoid duplicates.

---

## Constraints

- **Do NOT use `window.location.reload()`** as a fallback — this causes a full page reload and resets authentication state in the hash router.
- **Do NOT use `window.location.href = ...`** unless navigating away is the intended action.
- **Do NOT add `setTimeout` delays** — call re-render immediately in the callback.
- **Do NOT modify the modal form code** (`projectForms.js`, `indicatorForms.js`, etc.) — the `onSuccess` callback mechanism already works correctly; only fix the call sites.

---

## Verification Steps

After making changes:

1. Open the project dashboard (`#project-dashboard?id=<some-id>`).
2. Click **Edit Project** — edit a field — save. Confirm the dashboard updates without a full page reload.
3. Click **Add Indicator** — fill in fields — save. Confirm the indicator list updates immediately.
4. Click **Edit Indicator** — edit — save. Confirm the indicator list updates immediately.
5. Navigate to **Thematic Areas** — create a new area — confirm the list refreshes.
6. Navigate to **Activities** — edit an activity — confirm the list refreshes.
7. Navigate to **Cases** — create a case — confirm the list refreshes.
8. Open the Financial Dashboard — reverse a budget transfer — confirm the dashboard refreshes without a page reload.
