# **Requirements Specification Document (RSD)**
# **AWYAD Monitoring and Evaluation System (MES)**
**Version:** 1.1
**Date:** 2025-12-13

---

### **1. Project Overview**

This document outlines the requirements for a new, custom-built Monitoring and Evaluation System (MES) for AWYAD. The primary goal is to develop a centralized, flexible, and scalable platform that streamlines data collection, management, analysis, and reporting across all of the organization's programmatic areas and projects.

The system will replace current fragmented processes (e.g., complex Excel/CSV trackers) and provide real-time insights, enforce data quality, automate calculations, and demonstrate the linkage between project-level outcomes and the organization's overall strategic objectives.

### **2. System Goals and Objectives**

*   **Centralize Data:** Create a single source of truth for all M&E data, eliminating `#ERROR!` issues found in current spreadsheets.
*   **Standardize Reporting:** Automate the generation of reports for various stakeholders (donors, internal management) with flexible, cumulative reporting cycles (monthly, quarterly, semi-annual, annual).
*   **Improve Data Quality:** Implement validation rules and approval workflows to ensure data is accurate, complete, and consistent.
*   **Link Strategy to Results:** Clearly show how project indicators contribute to AWYAD's high-level thematic area indicators.
*   **Enhance Decision-Making:** Provide real-time dashboards and advanced analytics to support timely and data-driven decision-making.
*   **Track Financials:** Integrate activity budgets and expenditures to monitor burn rates and financial performance alongside programmatic progress.

### **3. Core System Architecture & Features**

#### **3.1. Hierarchical Structure**

The system's data model must be hierarchical to reflect AWYAD's operational structure, as seen in the provided tracking sheets:

1.  **Thematic Areas / Results:** The highest level of the hierarchy (e.g., "Result 3: Local partners effectively respond to Child Protection risks..."). Each thematic area will have its own overarching indicators.
2.  **Projects:** Each project will be linked to a primary thematic area. Projects have defined metadata, including:
    *   Project Name
    *   Start and End Dates (supporting multi-year projects like 2024-2026)
    *   Donor(s)
    *   Budget
    *   Status (e.g., Active, Completed)
3.  **Indicators:** Indicators exist at both the Thematic Area level and the Project level. The system must support the linking of project indicators to thematic area indicators. Indicator attributes include:
    *   Indicator Name & Code (e.g., I.2.6.5)
    *   Type (e.g., Outcome, Impact)
    *   Baseline & Date Collected
    *   Life of Project (LOP), Annual, and Quarterly Targets
    *   Unit of Measurement
4.  **Activities:** All activities must be linked to a project and an indicator. The system will track:
    *   Activity Name & Description
    *   Corresponding Budget
    *   Actual Expenditure
    *   Status ("Not yet started," "In progress," "Completed," "Date Completed")

#### **3.2. User Roles and Permissions**

The system will have a robust role-based access control (RBAC) model:
*   **System Administrator:** Manages the overall system, user accounts, and core configurations.
*   **Program Manager / Head of Programs:** Enters and approves annual work plans, projects, and high-level indicators. Final approver in the data workflow.
*   **M&E Team:** Manages indicator definitions, reviews and verifies submitted data, and designs complex reports.
*   **Field Officer / Data Entry Clerk:** Enters **cumulative** monthly activity data, beneficiary numbers, and narratives against pre-defined activities.
*   **View-Only User:** Can view dashboards and generate reports but cannot edit data.

### **4. Functional Requirements**

#### **4.1. Modules**
1.  **Projects Module:** Manages project definitions, metadata, and their link to thematic areas.
2.  **Indicator Tracking Module (ITT):** A digital version of the "Indicator Tracking Table." Manages indicator definitions, targets (LOP, annual, quarterly), baselines, and automatically calculates progress.
3.  **Activity Tracking Module (ATT):** A digital version of the "Activity Tracking Table." Facilitates the reporting of activity completion status and links to the ITT. Captures expenditure against budget.
4.  **Data Entry & Disaggregation Engine:** The core module for data entry. It must support the breakdown of all beneficiary data by the dimensions specified in section 4.2.
5.  **Evidence & Documents Module:** Allows users to upload supporting evidence (photos, scanned attendance sheets, reports).
6.  **Approval Workflow Module:** Manages the process for data submission, review, and approval.
7.  **Dashboards & Exports Module:** Provides dashboards and allows data exports into Excel, CSV, and PDF. This will house the Power BI integration and replicate views like the "Summary Dashboard."
8.  **Case Management Sub-Module:** A specialized section for tracking case management activities, including metrics like "Active Case Load" and "Closed Cases."

#### **4.2. Data Disaggregation**
This is a critical requirement based on the detailed tracking sheets. The system must be able to disaggregate **all beneficiary data** by the following dimensions simultaneously:
*   **Time:** Month, Quarter, Year.
*   **Location / Community Type:**
    *   Refugee
    *   Host (National)
*   **Specific Location:** (e.g., Nakivale, Nyakabande, Kampala Divisions).
*   **Gender:** Male, Female.
*   **Age Group:** 0-4 yrs, 5-17 yrs, 18-49 yrs, 50+ yrs.
*   **Nationality (for Refugees):** Sudanese, Congolese, South Sudanese, Other.
*   **Vulnerability:** People with Disabilities (PWD), etc.

#### **4.3. Data Entry and Validation**
*   The system shall enforce mandatory fields during data entry.
*   As per instructions, data entry for `Actuals` and `Targets` will be for **whole numbers**, with percentages being calculated automatically by the system.
*   Data will be entered and treated as **cumulative**, with the system handling the logic for monthly, quarterly, and annual roll-ups.
*   Unique identifiers (Refugee ID, National ID) must be captured to prevent duplicate counting.

#### **4.4. Reporting and Analytics**
*   The system will automatically generate reports mirroring the provided `Summary Dashboard` and `Activity Tracking Table` layouts.
*   **Automated Calculations:** The system will automatically calculate:
    *   `Variance` (Target - Achieved)
    *   `% Achieved` ((Achieved / Target) * 100)
    *   Budget `Burn Rate`
    *   All sub-totals and grand-totals for disaggregated data.
*   Reports must aggregate project indicator data up to the corresponding thematic area indicators.

### **5. System Integrations**

*   **KoboCollect:** The system will integrate with KoboCollect for field data collection.
*   **Power BI:** The system will feature an embedded Power BI integration. Data from the MES will be pushed to Power BI, and dashboards will be accessible directly from within the MES user interface.

### **6. Technical Specifications**

*   **Architecture:** A multi-layer web architecture.
*   **API-Driven:** The backend will be API-driven to ensure flexibility and future integrations.
*   **Database:** A relational database designed to handle the complex, multi-dimensional nature of the data, avoiding the wide-column format of the current spreadsheets.

### **7. Next Steps**

1.  **Finalize Requirements:** Share this updated document with all stakeholders to confirm its accuracy.
2.  **Prototype Key Screens:** The development team should create mockups of the key data entry and dashboard screens for user validation.
3.  **Develop Detailed Proposal:** The development team will create a final technical proposal, project plan, and cost structure.