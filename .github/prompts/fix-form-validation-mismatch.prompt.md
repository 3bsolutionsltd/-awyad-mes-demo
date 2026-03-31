---
description: "Fix form select option values that don't match server-side Joi validation — e.g. lowercase 'number' sent but server expects 'Number'. Use when: getting 'must be one of' Joi errors on form submit, data_type validation errors, indicator form errors."
name: "fix-form-validation-mismatch"
argument-hint: "Describe the field and error, e.g. 'data_type must be one of [Number, Percentage]'"
agent: "agent"
---

A form `<select>` option value doesn't match the server-side Joi `.valid(...)` list. Fix both sides so they agree.

## Steps

1. **Locate the Joi schema** in `src/server/routes/` for the failing endpoint. Note the exact string values in `.valid(...)`.

2. **Locate every HTML `<select>` for this field** across `public/js/**`:
   - Search for `name="<fieldname>"` to find all form occurrences (create, edit, enhanced forms).
   - Check every `<option value="...">` — values must exactly match the Joi `.valid()` list (case-sensitive).

3. **Fix the mismatching option values** in the frontend. Do NOT change the Joi schema on the server — it is the source of truth.

4. **Check the edit form too** — if there's an edit modal that pre-populates the select (e.g. `${indicator?.data_type === 'number' ? 'selected' : ''}`), update those comparison strings to match the corrected case.

5. **Verify no other indication forms** use the same old lowercase values (search for the old string across `public/js/**`).

## Example

Error: `"data_type" must be one of [Number, Percentage]`

- Server Joi: `data_type: Joi.string().valid('Number', 'Percentage')`
- Frontend bug: `<option value="number">` and `<option value="percentage">`
- Fix: change to `<option value="Number">` and `<option value="Percentage">`

## After fixing

Refresh the browser (hard reload: Ctrl+Shift+R) and test submitting the form. No server restart required.
