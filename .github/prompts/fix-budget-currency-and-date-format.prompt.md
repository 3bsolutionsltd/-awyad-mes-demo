---
description: "Fix budget_currency not allowed on project update, and change all date displays to dd/mm/yy format. Use when: 'budget_currency is not allowed' error on edit project, date format needs to be dd/mm/yy across the app."
agent: agent
---

# Fix budget_currency Validation + Standardise Date Format to dd/mm/yy

## Task 1 — Fix "budget_currency is not allowed" on Project Update

### Root Cause

The error occurs because the Node.js server process is still running the **old code** loaded
at startup, before `updateProjectSchema` was updated to include `budget_currency`.

The code in `src/server/routes/projects.js` already has the correct schema:
```js
const updateProjectSchema = Joi.object({
    ...
    budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP'),
    ...
}).min(1);
```

### Fix: Verify + Restart

1. Open [src/server/routes/projects.js](../../src/server/routes/projects.js) and confirm
   `budget_currency` exists in **both** `createProjectSchema` (line ~19) and
   `updateProjectSchema` (line ~32). If missing from either, add:
   ```js
   // createProjectSchema
   budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('USD'),

   // updateProjectSchema
   budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP'),
   ```

2. Restart the server so the updated schema is loaded:
   - Stop the current `npm start` process (Ctrl+C in the node terminal)
   - Run `npm start` again

No frontend changes are needed for this task — `FormData` already captures the
`budget_currency` field from the select in the edit form.

---

## Task 2 — Change All Date Displays to dd/mm/yy

### Strategy

Replace all ad-hoc `new Date(x).toLocaleDateString()` calls with a single shared
formatter, and update the existing `formatDate` utility to use the `en-GB` locale
with 2-digit year. This ensures consistency across the entire app from one place.

### Step 1 — Update `formatDate` in `public/js/utils.js`

Read [public/js/utils.js](../../public/js/utils.js) and update the `formatDate` function:

```js
// BEFORE
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toISOString().split('T')[0];
}

// AFTER — returns dd/mm/yy (e.g. 25/03/26)
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
```

> **Note:** `en-GB` with `year: '2-digit'` produces `25/03/26` format.  
> The `formatDate` in `public/js/utils/monthlyUtils.js` is a separate copy — update it too (see Step 3).

### Step 2 — Replace bare `toLocaleDateString()` calls in frontend files

Search for `new Date(` in each file below and replace every instance of:
```js
new Date(someValue).toLocaleDateString()
// or
new Date(someValue).toLocaleDateString('en-US', {...})
```
with:
```js
formatDate(someValue)
```

Make sure `formatDate` is imported at the top of each file (check if it already is):
```js
import { formatDate } from './utils.js';
// or the relative path appropriate for that file
```

**Files to update:**

| File | Approx lines with bare `toLocaleDateString()` |
|---|---|
| [public/js/projectForms.js](../../public/js/projectForms.js) | ~415, ~419, ~457 |
| [public/js/activityForms.js](../../public/js/activityForms.js) | ~718, ~723, ~813 |
| [public/js/thematicAreas.js](../../public/js/thematicAreas.js) | ~102 |
| [public/js/thematicAreaForms.js](../../public/js/thematicAreaForms.js) | ~250 |
| [public/js/renderProjectDashboard.js](../../public/js/renderProjectDashboard.js) | ~108, ~109, ~729 |
| [public/js/admin/currencyManagement.js](../../public/js/admin/currencyManagement.js) | ~216, ~405, ~436, ~464 |

For each file:
1. Check if `formatDate` is already imported — if not, add the import.
2. Replace each `new Date(x).toLocaleDateString(...)` with `formatDate(x)`.
3. Do NOT change date inputs (`<input type="date">`) — those always use `YYYY-MM-DD`
   for the `value` attribute to work with the browser date picker.

### Step 3 — Update `formatDate` in `public/js/utils/monthlyUtils.js`

Read [public/js/utils/monthlyUtils.js](../../public/js/utils/monthlyUtils.js) around line 338.
Update its local `formatDate` to the same `en-GB` 2-digit-year format:

```js
// AFTER
export function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
```

### Step 4 — sessionManagement.js

Read [public/js/sessionManagement.js](../../public/js/sessionManagement.js).
It has its own local `formatDate` function (line ~13). Update it the same way.

## Constraints

- Do **not** change `<input type="date">` `value` attributes — they must stay `YYYY-MM-DD`.
- Do **not** change server-side date formatting (SQL `RETURNING` dates are ISO strings — fine).
- Do **not** change the `formatDate` used as a **sort key** or **comparison** input;
  only change display-facing calls.
- `sessionManagement.js` uses a local `formatDate` — update it in place, do not import from utils.
