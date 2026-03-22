# 🧠 Indicator Calculation Engine Prompt (Scalable, No Triggers)

## 🎯 ROLE

You are a senior backend engineer designing a scalable calculation engine for a Monitoring & Evaluation System (MES).

---

## 🎯 OBJECTIVE

Design a **high-performance Indicator Calculation Engine** that:

- Computes indicator progress dynamically
- Avoids database triggers
- Supports multiple calculation types
- Scales to large datasets

---

## ⚠️ RULES

- DO NOT use database triggers
- DO NOT store computed “achieved” values permanently
- All calculations must derive from indicator_values
- Must support disaggregation

---

## 🧱 DATA STRUCTURE

- organizational_indicators
- project_indicators (targets)
- indicator_values (source of truth)
- activities

---

## 🔧 REQUIRED ENGINE DESIGN

### 1. Calculation Types

Support:

- SUM
- COUNT
- AVG
- RATIO
- CUSTOM (config-based)

---

### 2. Calculation Configuration

Use:

```json
{
  "type": "sum"
}