---
description: "Add per-project currency selection to the budget field in Create/Edit Project forms and update all budget displays. Use when: adding currency support to projects, fixing hardcoded USD budget labels, making budget currency-aware."
agent: agent
---

# Add Multi-Currency Support to Project Budget

The project budget field is currently hardcoded to USD (`Budget (USD)` label, `$` symbol in display).
The app already has `public/js/utils/currencyUtils.js` with `SUPPORTED_CURRENCIES`, `formatCurrency()`, and `getCurrencySymbol()`.
Wire everything together end-to-end: DB → API → forms → display.

## Context Files

Read these files before making any changes:

- [database/schema.sql](../../database/schema.sql) — current `projects` table schema
- [src/server/routes/projects.js](../../src/server/routes/projects.js) — Joi schemas, GET/POST/PUT handlers
- [public/js/projectForms.js](../../public/js/projectForms.js) — create modal, edit modal, view modal HTML templates and submit handlers
- [public/js/utils/currencyUtils.js](../../public/js/utils/currencyUtils.js) — `SUPPORTED_CURRENCIES`, `formatCurrency`, `getCurrencySymbol`
- [public/js/projects.js](../../public/js/projects.js) — table rendering (donor/budget columns)
- [renderProjects.js](../../renderProjects.js) — root-level table rendering

## Step 1 — Database Migration

Determine the next migration number by listing `database/migrations/` then create  
`database/migrations/<NNN>_project_budget_currency.sql`:

```sql
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
```

Run the migration:
```
node database/migrate.js
```

## Step 2 — API: projects.js

### Joi schemas — add to BOTH `createProjectSchema` AND `updateProjectSchema`

> **Common mistake:** adding `budget_currency` only to `createProjectSchema` and
> forgetting `updateProjectSchema`. This causes `"budget_currency" is not allowed`
> on every PUT /api/v1/projects/:id call.

Add `budget_currency` to both schemas:

```js
// createProjectSchema
budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP').default('USD'),

// updateProjectSchema
budget_currency: Joi.string().valid('UGX', 'USD', 'EUR', 'GBP'),
```

### GET list & GET /:id
The `p.*` wildcard in the SELECT already includes `budget_currency` once the column exists — no query change needed. Verify both queries use `p.*` or explicitly add `p.budget_currency` if they use an explicit column list.

### POST handler
Destructure `budget_currency` from `value` alongside `budget`:
```js
const { ..., budget, budget_currency, ... } = value;
```
Add it to the INSERT column list and `$N` placeholder in the VALUES clause.

### PUT handler — critical: `updateProjectSchema` must include `budget_currency`

Omitting `budget_currency` from `updateProjectSchema` causes Joi to reject it with
`"budget_currency" is not allowed` on every edit-project save. Double-check the
schema above was applied to **both** `createProjectSchema` and `updateProjectSchema`.

For the SQL update: `budget_currency` flows into `projectFields` via the existing
`const { component_ids, donor_ids, ...projectFields } = value` spread and feeds the
dynamic `UPDATE projects SET ...` builder automatically — no extra code needed there.

## Step 3 — Frontend: projectForms.js

### Create modal
Replace the `Budget (USD)` label + plain input with a label+input+currency-select group:

```html
<label class="form-label">Budget</label>
<div class="input-group">
    <select class="form-select" id="projectBudgetCurrency" name="budget_currency" style="max-width:100px">
        <option value="USD">USD</option>
        <option value="UGX">UGX</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
    </select>
    <input type="number" class="form-control" id="projectBudget" name="budget" min="0" step="0.01" value="0">
</div>
```

### Edit modal
Same input-group pattern. Pre-select the saved currency:

```html
<option value="USD" ${project.budget_currency === 'USD' ? 'selected' : ''}>USD</option>
<option value="UGX" ${project.budget_currency === 'UGX' ? 'selected' : ''}>UGX</option>
<option value="EUR" ${project.budget_currency === 'EUR' ? 'selected' : ''}>EUR</option>
<option value="GBP" ${project.budget_currency === 'GBP' ? 'selected' : ''}>GBP</option>
```

### Create & Edit submit handlers
`budget_currency` is a named form field, so `Object.fromEntries(new FormData(form))` already picks it up. No change needed unless the handler manually builds the payload — in that case add:
```js
data.budget_currency = form.querySelector('[name="budget_currency"]').value;
```

### View modal (budget display line)
Replace the hardcoded `$${...}` with `formatCurrency`:

```js
import { formatCurrency } from './utils/currencyUtils.js';
// ...
formatCurrency(project.budget || 0, project.budget_currency || 'USD')
```

## Step 4 — Table Display

### public/js/projects.js and renderProjects.js
Find every place budget is rendered in a table cell and replace hardcoded `$` formatting with `formatCurrency`:

```js
import { formatCurrency } from './utils/currencyUtils.js';
// ...
formatCurrency(project.budget || 0, project.budget_currency || 'USD')
```

## Step 5 — Restart the Server

After all file changes are saved, restart the Node.js server so the updated Joi
schemas and new column are picked up by the running process:

```
# Stop the running server (Ctrl+C in the npm start terminal), then:
npm start
```

If the server is managed by a process manager (e.g., PM2), reload it instead:
```
pm2 reload all
```

## Step 6 — Verify

- Open Create Project modal → confirm currency dropdown appears beside budget input.
- Create a project with UGX currency → it saves and reloads correctly.
- Open Edit Project → currency dropdown pre-selects the saved currency.
- Project table and view modal show the correct symbol (e.g., `1,200,000 UGX` or `$5,000`).
- Dashboard / financial performance endpoint still works (no schema changes there).

## Constraints

- Do **not** add currency conversion or exchange rate logic — store and display the selected currency as-is.
- Do **not** change any other tables (activities, expenditure) in this task.
- `budget_currency` defaults to `'USD'` for all existing projects.
- Follow the existing `ON CONFLICT DO NOTHING` / `IF NOT EXISTS` pattern in all SQL.
