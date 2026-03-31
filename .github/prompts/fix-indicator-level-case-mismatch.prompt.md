---
description: "Fix indicator_level validation error: option values are lowercase (output/outcome/impact) but Joi expects title-case (Output/Outcome/Impact). Use when: 'indicator_level must be one of [Output, Outcome, Impact]' error appears on indicator create/edit."
agent: agent
---

# Fix indicator_level Case Mismatch

## Root Cause

The `<select>` dropdowns for **Indicator Level** in `indicatorForms.js` use lowercase `value` attributes
(`output`, `outcome`, `impact`) but the Joi schema in `indicators.js` validates against title-case
values (`Output`, `Outcome`, `Impact`). This causes every indicator save to fail with:

> `"indicator_level" must be one of [Output, Outcome, Impact]`

The Joi schema is the source of truth (it also writes to the DB). Fix the HTML values to match.

## Context Files

Read before making changes:

- [public/js/indicatorForms.js](../../public/js/indicatorForms.js) — two `<select>` dropdowns with `name="indicator_level"` (search for `piLevel` and `indicatorLevel`)
- [src/server/routes/indicators.js](../../src/server/routes/indicators.js) — Joi schema line ~21: `Joi.string().valid('Output', 'Outcome', 'Impact')`

## Changes Required

### `public/js/indicatorForms.js` — two locations

#### 1. Standalone Indicator form (`id="indicatorLevel"`, around line 58)

```html
<!-- BEFORE -->
<option value="output">Output</option>
<option value="outcome">Outcome</option>
<option value="impact">Impact</option>

<!-- AFTER -->
<option value="Output">Output</option>
<option value="Outcome">Outcome</option>
<option value="Impact">Impact</option>
```

#### 2. Project Indicator form (`id="piLevel"`, around line 604)

Same fix — the identical three `<option>` lines appear here too:

```html
<!-- BEFORE -->
<option value="output">Output</option>
<option value="outcome">Outcome</option>
<option value="impact">Impact</option>

<!-- AFTER -->
<option value="Output">Output</option>
<option value="Outcome">Outcome</option>
<option value="Impact">Impact</option>
```

### `src/server/routes/indicators.js` — no change needed

The Joi schema already has the correct title-case values. Do not alter it.

## Edit Indicator form

If there is an edit/update indicator form that pre-selects the current `indicator_level` value
(e.g., using `selected` ternaries or `form.querySelector`), verify it also uses title-case values
so the pre-selection still works after this fix. Search for `indicator_level` in:

- `public/js/indicatorForms.js` — look for edit/populate logic that sets `select.value = indicator.indicator_level`
- If the DB already stored lowercase values from before this fix, a one-time migration may be needed:

```sql
-- Run only if existing rows have lowercase indicator_level values
UPDATE indicators SET indicator_level = initcap(indicator_level)
WHERE indicator_level IN ('output', 'outcome', 'impact');
```

Check whether a migration is needed by running:
```
SELECT DISTINCT indicator_level FROM indicators;
```

## Constraints

- Change `value` attributes only — do not change the visible label text (`Output`, `Outcome`, `Impact`).
- Do not change any other `<select>` or `<option>` elements.
- Do not modify the Joi schema.
