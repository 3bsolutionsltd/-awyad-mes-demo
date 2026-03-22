# 🧠 MES UI Refactor Prompt (RBM-Compliant & Non-Breaking)

## 🎯 ROLE

You are a senior UX architect and frontend engineer specializing in enterprise MIS and M&E systems.

You are working on an existing Monitoring & Evaluation System (MES) that has been refactored to support Results-Based Management (RBM).

---

## 🎯 OBJECTIVE

Update the UI/UX to align with the RBM architecture WITHOUT breaking:

- Existing workflows
- Data entry processes
- User familiarity (field officers, M&E officers)

---

## ⚠️ CRITICAL RULES

- DO NOT redesign everything from scratch
- DO NOT remove existing features abruptly
- DO NOT introduce complex UX for field users
- Maintain backward compatibility in UI flow
- Focus on progressive enhancement

---

## 🧱 BACKEND STRUCTURE (IMPORTANT)

The system now follows:

Thematic Areas  
→ Results (Impact → Outcome → Output)  
→ Organizational Indicators  
→ Project Indicators  
→ Indicator Values  
→ Activities  

---

## 🔧 REQUIRED UI CHANGES

### 1. Project Dashboard Refactor

Update project view from:

OLD:
- Activities
- Indicators (flat)

NEW:
- Results Tab (hierarchical)

Structure:

Project
→ Results
   → Outcomes
      → Indicators (project indicators)
         → Progress (%)
         → Target
         → Achieved (computed)

---

### 2. Indicator View (CRITICAL)

Indicators must now:

- Show computed values (NOT manually entered)
- Show:
  - Target
  - Achieved
  - Progress %
  - Trend (time-based)
  - Disaggregation

---

### 3. Data Entry (Activity Form)

Enhance activity form:

OLD:
User enters activity data only

NEW:
- System auto-suggests linked indicators
- User confirms mapping
- Data feeds indicator_values

---

### 4. Remove Manual Tracking UI

REMOVE:
- Manual “achieved” entry fields
- Manual quarterly tracking inputs

These are now computed.

---

### 5. Results Dashboard (NEW)

Add:

Thematic Area View:

- Impact → Outcome → Output
- Each level shows:
  - % achieved
  - contributing indicators

---

### 6. Admin Configuration UI

Add admin screens:

- Manage Results Framework
- Manage Organizational Indicators
- Define calculation methods

---

## 📤 EXPECTED OUTPUT

Provide:

### 1. UI Wireframes (Text or structured layout)
- Project dashboard
- Indicator view
- Data entry screen

### 2. UX Flow Description
- Before vs After changes

### 3. Component Structure (React-friendly if possible)

### 4. Migration Strategy (UI)
- How to introduce changes without confusing users

---

## 🎯 GOAL

A clean RBM-aligned UI that:

- Feels familiar to existing users
- Supports Results-based reporting
- Avoids breaking workflows