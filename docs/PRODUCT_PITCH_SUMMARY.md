# MES Platform — Product Pitch Summary
**Prepared by:** 3B Solutions Ltd  
**Product:** Monitoring, Evaluation & Learning (MEL) Management System  
**Version:** 2.0 Enterprise  
**Date:** June 2026

---

## 1. The Problem We Solve

Humanitarian organizations, NGOs, and development programs universally struggle with the same operational pain points:

| Before MES | After MES |
|---|---|
| M&E data scattered across dozens of Excel files | Single, centralized system of record |
| Manual calculations prone to human error | Automated aggregations and totals |
| Beneficiary disaggregation tracked inconsistently | Standardized, multi-dimensional disaggregation |
| Donor reports take days to compile | One-click CSV/Excel exports, any time |
| No real-time visibility into program performance | Live dashboards with color-coded alerts |
| Case data in paper files or unsecured spreadsheets | Secure, role-based digital case management |
| Multiple staff editing the same files simultaneously | Multi-user platform with granular permissions |

---

## 2. What Is the MES Platform?

**MES (Monitoring, Evaluation & Learning System)** is a full-stack, enterprise-grade digital platform purpose-built for results-based management (RBM) in the humanitarian and development sector.

It provides organizations with a single, secure, real-time system to:
- Plan and manage projects linked to their strategic framework
- Track indicators, activities, and beneficiary data
- Manage protection cases (GBV, Child Protection, etc.)
- Generate donor-compliant reports instantly
- Monitor financial burn rates and budget utilization
- Collaborate securely across a distributed team

The platform is already **production-proven**, having been custom-developed and deployed for a humanitarian organization in Uganda managing UNFPA and UNICEF-funded programs.

**Live Demo:** [https://3bsolutionsltd.github.io/-awyad-mes-demo/](https://3bsolutionsltd.github.io/-awyad-mes-demo/)

---

## 3. Core Modules

### 3.1 Strategic Framework Management
Align all programs to organizational strategy through a full hierarchy:
- **Strategy → Pillars → Core Program Components → Thematic Areas → Results → Indicators**
- Supports Results-Based Management (RBM) frameworks used by UNICEF, UNFPA, and World Bank
- Impact → Outcome → Output hierarchy
- Strategic dashboard with expandable/collapsible hierarchy visualization
- Aggregate indicator performance across all projects

### 3.2 Project Management
Full project lifecycle management:
- Create and manage multiple concurrent projects
- Link projects to strategic pillars and core program components
- Assign donors, locations, start/end dates, and status
- 6-tab project dashboard: Overview, Indicators, Activities, Cases, Team, Financial
- Multi-currency budget tracking (UGX, USD, EUR, GBP)
- Automatic burn rate calculation with color-coded alerts (Green < 75% / Yellow 75–90% / Red > 90%)
- Team member assignment and management

### 3.3 Indicator Tracking Table (ITT)
Complete indicator performance management:
- Two-tier indicator architecture: organizational-level definitions + project-level targets
- Quarterly tracking (Q1–Q4) against Life of Project (LOP) targets
- Variance analysis: Achieved vs. Target with percentage calculations
- Color-coded performance visualization
- Disaggregated indicator values
- Export to CSV for donor reporting

### 3.4 Activity Tracking Table (ATT)
Detailed activity implementation records:
- Activity codes aligned to M&E frameworks (e.g., 3.2.1, 3.2.4)
- Multi-dimensional beneficiary disaggregation:
  - **Gender:** Male / Female
  - **Age:** 0–4, 5–17, 18–49, 50+
  - **Community type:** Refugee / Host Community
  - **Nationality:** Sudanese, Congolese, South Sudanese, Others, etc.
  - **Disability status (PWD)**
- Auto-calculating totals and cross-validation
- Budget vs. expenditure tracking per activity
- Activity status workflow: Pending → In Progress → Completed
- Approval workflow indicators
- Advanced filtering and CSV export

### 3.5 Case Management
Secure protection case tracking for GBV and Child Protection programs:
- Case intake with full client information (gender, age, nationality)
- Severity classification and case status workflow (Open → In Progress → Resolved → Closed)
- Service tracking: Psychosocial Support, Medical Care, Legal Aid, Shelter, etc.
- Referral tracking and inter-agency referral pathways
- Follow-up date scheduling with automated alerts (highlighted when overdue)
- Confidentiality controls — case workers only see assigned cases
- Case load analytics and closure rate monitoring
- Case worker assignment

### 3.6 Monthly Tracking
Temporal analysis of program implementation:
- Calendar view of activities across all months
- Quarterly summary aggregations
- Monthly accordion breakdown: activity details, beneficiary counts, expenditure, disaggregation
- Refugee vs. host community monthly comparisons
- Export monthly reports to CSV

### 3.7 Real-Time Dashboard
Executive-level overview for leadership and donors:
- Active projects count, indicators on-track, total activities, burn rate
- Thematic area breakdown with progress bars
- Achievement percentages per indicator
- Financial performance at a glance
- Exportable dashboard summary for reporting

### 3.8 Data Entry Module
Field staff and program officers can submit activity reports directly:
- Dynamic form with project and indicator selection
- Activity code input aligned to M&E frameworks
- Location and date tracking
- Guided disaggregation inputs with real-time auto-calculation
- Nationality validation (totals must match refugee count)
- Budget and expenditure entry
- Narrative reporting with rich text
- File attachment support

---

## 4. Authentication, Security & Compliance

The platform is built to enterprise and humanitarian sector security standards:

| Feature | Detail |
|---|---|
| Authentication | JWT tokens — 15-min access token + 7-day refresh token |
| Password security | bcrypt hashing (10 salt rounds) |
| Authorization | Role-Based Access Control (RBAC) |
| User roles | Admin, Manager, Field Officer, Viewer (4 default roles) |
| Permissions | 30+ granular permissions for fine-grained access control |
| Audit logging | 30+ action types logged — who did what, when |
| Rate limiting | Brute-force and DoS protection |
| SQL injection | Parameterized queries throughout |
| XSS protection | Input sanitization and output encoding |
| Security headers | Helmet.js middleware (HSTS, X-Frame-Options, CSP, etc.) |
| CORS | Configurable per deployment |
| Data integrity | ACID-compliant PostgreSQL with referential integrity |

---

## 5. Integrations & Extensibility

The platform is designed for open integration with the humanitarian technology ecosystem:

| Integration | Status | Notes |
|---|---|---|
| **Kobo Toolbox / Kobo Collect** | Available as add-on | Sync field data collection directly into activities (3–4 weeks dev effort) |
| **Power BI** | Available as add-on | Direct PostgreSQL connection or REST API feed for advanced dashboards |
| **ODK (Open Data Kit)** | Planned | Similar approach to Kobo integration |
| **CSV / Excel import & export** | ✅ Built-in | All modules support bulk export; import tools available |
| **RESTful API** | ✅ Built-in | 80+ documented API endpoints for third-party integrations |
| **DHIS2** | Roadmap | Common in health and humanitarian contexts |
| **ActivityInfo** | Roadmap | Widely used in UN-coordinated responses |

---

## 6. Technical Specifications

### Stack
| Layer | Technology |
|---|---|
| Frontend | HTML5 + Bootstrap 5.3, Vanilla JavaScript ES6 Modules |
| Backend | Node.js + Express.js (RESTful API, 80+ endpoints) |
| Database | PostgreSQL 15 (15+ tables, ACID compliant) |
| Authentication | JWT + bcrypt |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston |

### Performance
- API response time: **< 500ms** (95th percentile)
- Database query time: **< 100ms** average
- Test coverage: **85%+**
- Uptime target: **99.9%**

### Scale
- **27,000+ lines** of production code
- **80+ RESTful API endpoints**
- **15+ relational database tables**
- **20+ frontend modules**

### Deployment Options
| Option | Suitable For |
|---|---|
| **Cloud (Fly.io / Heroku / Render)** | Small–medium organizations; managed, low ops overhead |
| **AWS / Azure / GCP** | Larger organizations; full control and compliance |
| **On-premise / private server** | Organizations with strict data residency requirements |
| **Static demo (GitHub Pages / Netlify)** | Demonstrations and pre-sales evaluations |

### Mobile Support
- Fully responsive across phone, tablet, and desktop
- Hamburger menu and swipe gestures on mobile
- Touch-friendly (WCAG 2.5.5 — minimum 44×44px touch targets)
- Keyboard navigation and screen reader support

---

## 7. Who Is This For?

### Primary Target Organizations
The MES platform is designed for any organization that:
1. Manages donor-funded programs or projects
2. Must report against indicators and targets
3. Tracks beneficiary data (especially disaggregated data)
4. Operates in protection, health, education, livelihoods, or WASH sectors
5. Has multiple staff needing concurrent access to M&E data

### Specific Customer Segments

**International and Local NGOs**  
Organizations managing UNFPA, UNICEF, UNHCR, USAID, EU, or bilateral donor funding that require results-based reporting and beneficiary tracking.

**Humanitarian Response Organizations**  
Refugee response and emergency programs needing real-time case management, GBV/Child Protection tracking, and activity disaggregation by nationality and community type.

**Development Organizations**  
Long-term development programs (livelihoods, women's empowerment, community development) that need to track progress against strategic frameworks over multi-year timelines.

**UN Agencies (country or field level)**  
Country office teams needing a lightweight, deployable system that integrates with their tools (Kobo, Power BI, DHIS2) without full organizational IT overhead.

**Government Ministries / Departments**  
Social welfare, gender, youth, and community development ministries tracking national program performance and beneficiary data.

**Research & Advocacy Organizations**  
Programs requiring rigorous data collection, disaggregation, and donor-grade evidence reporting.

---

## 8. Competitive Advantages

| Advantage | Detail |
|---|---|
| **Purpose-built for the sector** | Designed specifically around humanitarian M&E workflows, not adapted from generic project management tools |
| **RBM-aligned** | Full Results Framework hierarchy (Impact → Outcome → Output) aligned with UN, USAID, and DFID standards |
| **Beneficiary disaggregation built-in** | Age, gender, disability, community type, nationality — standard across all data entry, not an afterthought |
| **Case management included** | GBV and Child Protection case tracking is part of the platform — not a separate system |
| **Zero vendor lock-in** | Open-source stack (Node.js + PostgreSQL); client owns 100% of source code and IP |
| **Kobo + Power BI ready** | Field data collection and BI integration pathways already designed |
| **Enterprise security** | Audit logging, RBAC, JWT — audit-ready out of the box |
| **Affordable custom deployment** | Fraction of the cost of enterprise tools like Salesforce NPSP, Apricot, or DevResults |
| **Rapid onboarding** | Typical deployment and training: 2–4 weeks |
| **Fully owned** | The client receives all source code, not a SaaS subscription |

---

## 9. Pricing Model

The platform is delivered as a **custom-built, fully-owned solution** — not a recurring SaaS subscription. Clients own their data and their code.

### Typical Engagement Structure

| Package | Scope | Indicative Cost |
|---|---|---|
| **Standard Deployment** | Full system setup, configuration, data migration, user training | $15,000 – $25,000 |
| **Custom Module Add-ons** | Kobo integration, Power BI, custom reports, mobile app | $3,000 – $8,000 per module |
| **Maintenance & Support** | Annual support contract, updates, hosting management | $3,000 – $6,000/year |
| **Component Value (if priced separately)** | Strategic Framework + Projects + ITT + ATT + Cases + Auth + Admin | **$69,000** |

> **Note:** All prices are indicative and depend on scope, number of users, and customization requirements. A formal quote is provided after a discovery call.

---

## 10. What's Included in a Deployment

Every client deployment includes:

- ✅ Full source code ownership (no license fees ever)
- ✅ Complete database with client's real data migrated in
- ✅ All 7 core modules configured to client's framework
- ✅ User accounts, roles, and permissions configured
- ✅ Production deployment (cloud or on-premise)
- ✅ Staff training (admin, managers, field officers)
- ✅ Documentation: user manual, admin guide, developer guide
- ✅ 30-day post-launch support
- ✅ Export templates matching client's donor report formats

---

## 11. Sample Indicators of Fit — Qualifying Questions for Prospects

Use these questions to assess whether a prospect is a strong fit:

1. Do you currently track program indicators against quarterly or annual targets?
2. Do you report disaggregated beneficiary data (gender, age, community type) to donors?
3. Are your M&E staff spending significant time consolidating Excel files to produce reports?
4. Do you manage GBV, Child Protection, or other protection cases?
5. Do you use Kobo Toolbox or ODK for field data collection?
6. Do multiple staff need to access and update M&E data simultaneously?
7. Do your donors (UNFPA, UNICEF, USAID, EU, UNHCR, etc.) require results-based reporting?
8. Do you have a strategic framework or results framework that your programs are aligned to?

**Strong fit:** 4+ "yes" answers.  
**Ideal fit:** 6+ "yes" answers.

---

## 12. Contact & Next Steps

**3B Solutions Ltd**  
Custom Software Development for the Development Sector

To proceed, a prospect should:
1. **Discovery call** (30 min) — review their current M&E setup and gaps
2. **Live demo walkthrough** (60 min) — tailored to their context using the live demo
3. **Proposal** — scoped quote based on their framework, users, and data volume
4. **Pilot / Proof of Concept** — optional 4-week pilot on a single project before full rollout

---

*This document is confidential and intended for prospect evaluation purposes only.*
