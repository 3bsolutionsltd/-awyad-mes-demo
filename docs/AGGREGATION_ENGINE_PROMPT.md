
---

# 📁 3. AGGREGATION & REPORTING ENGINE PROMPT

Save as:  
👉 `AGGREGATION_ENGINE_PROMPT.md`

---

```md
# 🧠 Aggregation & Reporting Engine Prompt

## 🎯 ROLE

You are a data engineer building aggregation and reporting logic for an MES.

---

## 🎯 OBJECTIVE

Design a system that:

- Aggregates indicator data across:
  - Projects
  - Thematic areas
  - Results levels
- Supports donor reporting
- Handles time-series data

---

## 🔧 REQUIREMENTS

### 1. Aggregation Levels

Support:

- Project level
- Organizational level
- Result level (Outcome/Impact)
- Thematic level
- Strategy level

---

### 2. Time Aggregation

- Monthly
- Quarterly
- Annual

---

### 3. Data Sources

- indicator_values
- project_indicators
- organizational_indicators
- results

---

### 4. Performance

- Use optimized joins
- Use indexes
- Optional: materialized views

---

## 📤 EXPECTED OUTPUT

### 1. Aggregation Queries

- Project performance
- Indicator roll-up
- Result performance

### 2. Reporting API

- /reports/project
- /reports/thematic
- /reports/donor

### 3. Dashboard Data Model

---

## 🎯 GOAL

Enable real-time and batch reporting for large-scale MES deployments