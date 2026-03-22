# 🧠 MES Feedback Patch Prompt (AWYAD Alignment)

## 🎯 ROLE

You are a senior system architect, UX designer, and PostgreSQL expert working on a donor-grade Monitoring & Evaluation System (MES).

---

## 🎯 OBJECTIVE

Refactor and extend an existing RBM-based MES system to fully align with AWYAD feedback and system requirements.

⚠️ IMPORTANT:
- DO NOT redesign the system
- DO NOT remove existing working features
- Apply incremental, safe updates only

---

## 📦 CONTEXT

The system already supports:

- RBM structure (Results → Indicators → Projects)
- Organizational Indicators (AWYAD level)
- Project Indicators
- Indicator Values (data layer)
- Activities
- Dashboards (basic)

---

## ⚠️ REQUIRED FIXES (FROM FEEDBACK)

---

### 🔴 1. DASHBOARD RESTRUCTURE

Add 3 dashboard levels:

1. AWYAD Dashboard (Strategic)
2. Thematic Dashboard
3. Project Dashboard (NEW)

---

### 🔴 2. STRATEGY-FIRST NAVIGATION

Ensure UI hierarchy:

Strategy
→ Pillar
→ Core Program Component
→ Thematic Area
→ Projects

---

### 🔴 3. RESULT AREA vs THEMATIC AREA

Clarify separation:

- Thematic Area → organizational level
- Result Area → project level

---

### 🔴 4. INDICATOR FORM UPDATE

Add fields:

- result_area_id
- indicator_level (output / outcome)
- data_type (number / percentage / ratio)

---

### 🔴 5. PERCENTAGE FORMATTING

Ensure:

- Percentage indicators display as %
- Number indicators display as numeric

---

### 🔴 6. ACTIVITY FUNDING (MULTI-SOURCE)

Support:

- Multiple funding sources per activity
- Cross-project funding

---

### 🔴 7. NON-PROGRAM ACTIVITIES

Support activities that:

- Are NOT tied to indicators
- Track:
  - target
  - achieved

---

### 🔴 8. CASE MANAGEMENT UPDATE

- Remove name field (PII)
- Add:
  - case_source
  - referral_to
- Make fields configurable

---

### 🔴 9. MONTHLY TRACKING

Add:

- Project-level tracking
- Reach vs Target
- Performance rate (achieved / target)

---

### 🔴 10. USER ROLES

Add structured roles:

- Program
- M&E
- Finance
- Admin

---

## 📤 EXPECTED OUTPUT

### 1. DATABASE CHANGES

- ALTER TABLE statements
- New tables (if needed)
- Updated relationships

---

### 2. UI CHANGES

- Updated layouts
- New screens
- Navigation structure

---

### 3. API CHANGES

- New endpoints
- Updated payloads

---

### 4. DATA FLOW

Explain how:

- Activities → Indicators → Dashboard
- Funding flows across projects

---

### 5. BACKWARD COMPATIBILITY

Explain how changes:

- Do NOT break existing data
- Support gradual rollout

---

## 🎯 GOAL

Achieve full alignment with AWYAD MES requirements and feedback while preserving system stability.