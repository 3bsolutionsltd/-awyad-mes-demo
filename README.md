# AWYAD MES Demo - User Guide

## Overview
This is a comprehensive Monitoring, Evaluation, and Learning (MES) system demo for AWYAD's humanitarian programs. The system tracks activities, indicators, and beneficiaries across multiple thematic areas with real-time data visualization and reporting capabilities.

## Quick Start

### Local Setup
1. **Clone/Download the repository**
2. **Start the server:**
   ```bash
   python -m http.server 8000
   ```
3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Live Demo
🌐 **[View Live Demo](https://3bsolutionsltd.github.io/-awyad-mes-demo/)**

## System Features

### 📊 Dashboard
- **Overview Statistics**: Active projects, indicators on track, total activities, burn rate
- **Thematic Areas Breakdown**: RESULT 2 (GBV Response), RESULT 3 (Child Protection)
- **Progress Indicators**: Visual progress bars and achievement percentages
- **Export**: Download comprehensive dashboard summary as CSV

**Key Metrics Displayed:**
- 2 Active Projects
- 11 Indicators with real-time tracking
- 10 Activities completed/in progress
- Financial burn rate monitoring

### 📁 Projects Module
- **View all projects** with donor information
- **Budget tracking** with expenditure visualization
- **Burn rate monitoring** with color-coded alerts (green <75%, yellow 75-90%, red >90%)
- **Location mapping** showing project implementation areas

**Projects Include:**
- GBV Response and Protection (UNFPA)
- Child Protection Program (UNICEF)

### 📈 Indicator Tracking Table (ITT)
- **Baseline and targets** for each indicator
- **Quarterly breakdown** (Q1, Q2, Q3, Q4)
- **Variance calculation** (Achieved vs Target)
- **Achievement percentage** with color-coded progress bars
- **Grouped by thematic area** for easy navigation
- **Export to CSV** with full indicator details

### ✅ Activity Tracking Table (ATT)
- **Activity codes** aligned with M&E framework (3.2.1, 3.2.3, 3.2.4, etc.)
- **Disaggregation display** by:
  - Age groups: 0-4, 5-17, 18-49, 50+
  - Gender: Male/Female
  - Community type: Refugee/Host
  - Nationality: Sudanese, Congolese, South Sudanese, Others
- **Budget vs Expenditure** tracking
- **Status monitoring**: Completed, In Progress, Pending
- **Approval workflow** indicators
- **Export to CSV** with full disaggregation

### 📅 Monthly Tracking
- **Calendar view** showing activities per month across 2025
- **Quarterly summaries** with aggregated data
- **Monthly breakdown accordion** with:
  - Activity details by month
  - Refugee vs Host beneficiary counts
  - Monthly expenditure tracking
  - Disaggregation summaries
- **Export monthly report** to CSV

### 💼 Case Management
- **Active case load** tracking
- **GBV and Child Protection cases**
- **Follow-up date alerts** (highlighted in red when due soon)
- **Service tracking**: Psychosocial Support, Medical Care, Legal Aid, etc.
- **Case closure rate** monitoring
- **Beneficiary information**: Gender, age, nationality
- **Case worker assignment**

### ➕ New Activity Report (Data Entry)
- **Dynamic form** with project/indicator selection
- **Activity code** input (M&E framework aligned)
- **Location and date** tracking
- **Comprehensive disaggregation** inputs:
  - Refugee beneficiaries (4 age groups × 2 genders)
  - Host community (4 age groups × 2 genders)
  - Nationality breakdown (4 categories)
- **Real-time calculators**:
  - Auto-sum by age group
  - Gender totals
  - Grand total calculation
  - Nationality validation
- **Budget and expenditure** tracking
- **Narrative reporting** with rich text
- **File attachment** support

## Data Features

### 📱 Mobile Responsiveness ✨ NEW!
The system is now **fully responsive** and optimized for all devices:
- **Phone Support (<576px)**: Hamburger menu, swipe gestures, card-based tables
- **Tablet Support (576-992px)**: Compact sidebar, optimized layouts
- **Desktop (>992px)**: Full sidebar, multi-column views
- **Touch-Friendly**: 44x44px minimum touch targets (WCAG 2.5.5)
- **Accessibility**: Skip-to-main link, keyboard navigation, screen reader support

See [docs/MOBILE_GUIDE.md](docs/MOBILE_GUIDE.md) for complete mobile features documentation.

### Real Data Integration
The demo uses **real data extracted from your CSV files**:
- 2 Thematic Areas from Results Framework
- 11 Indicators with actual targets and achievements
- 10 Activities with real activity codes and data
- Actual nationality distributions and disaggregation patterns

### Export Capabilities
All modules support CSV export:
- **Dashboard**: Summary statistics and thematic area overview
- **Indicators**: Full ITT with baseline, targets, achieved, variance
- **Activities**: Complete ATT with disaggregation and nationality data
- **Monthly Report**: Month-by-month beneficiary and budget breakdown

## Navigation

### Collapsible Sidebar
- Click the **☰** button (top-left) to show/hide the sidebar
- Provides more screen space for data viewing
- Smooth transition animations

### 7 Main Modules
1. **Dashboard** - Overview and key metrics
2. **Projects** - Project listing and financial tracking
3. **Indicator Tracking (ITT)** - Performance against targets
4. **Activity Tracking (ATT)** - Activity implementation details
5. **Case Management** - GBV and CP case tracking
6. **Monthly Tracking** - Calendar and monthly breakdowns
7. **New Activity Report** - Data entry form

## Data Disaggregation

### Age Groups
- 0-4 years (Early Childhood)
- 5-17 years (Children and Adolescents)
- 18-49 years (Adults)
- 50+ years (Elderly)

### Community Types
- **Refugee**: 60% of typical beneficiary mix
- **Host Community**: 40% of typical beneficiary mix

### Nationality Categories
- Sudanese (typically 45% of refugees)
- Congolese (typically 30% of refugees)
- South Sudanese (typically 20% of refugees)
- Others (typically 5% of refugees)

## Documentation

All project documentation is in the [`docs/`](docs/) folder:

| Document | Description |
|----------|-------------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Quick start guide |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Developer reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment instructions |
| [docs/USER_MANUAL.md](docs/USER_MANUAL.md) | End-user manual |
| [docs/USER_TEST_GUIDE_COMPLETE.md](docs/USER_TEST_GUIDE_COMPLETE.md) | User testing guide |
| [docs/PRESENTATION_GUIDE.md](docs/PRESENTATION_GUIDE.md) | Demo & presentation guide |
| [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Test procedures |
| [docs/DATA_ENTRY_GUIDE.md](docs/DATA_ENTRY_GUIDE.md) | Data entry guide |
| [docs/MOBILE_GUIDE.md](docs/MOBILE_GUIDE.md) | Mobile usage guide |

---

## Technical Details

### Technology Stack
- **Frontend**: HTML5, Bootstrap 5.3.2, Vanilla JavaScript (ES6 Modules)
- **Icons**: Bootstrap Icons 1.11.1
- **Data**: JSON-based (imported from CSV analysis)
- **Server**: Python HTTP Server (for local development)

### Browser Compatibility
- Chrome/Brave (Recommended)
- Firefox
- Edge
- Safari

### File Structure
```
awyad-mes-demo/
├── index.html                      # Main HTML shell
├── app.js                          # Main application logic
├── mockData.js                     # Real data from CSV files
├── renderDashboard.js              # Dashboard module
├── renderProjects.js               # Projects module
├── renderIndicatorTracking.js      # ITT module
├── renderActivityTracking.js       # ATT module
├── renderCaseManagement.js         # Case management module
├── renderMonthlyTracking.js        # Monthly tracking module
├── renderEntryForm.js              # Data entry form
├── exportFunctions.js              # CSV export utilities
└── README.md                       # This file
```

## Usage Tips

### Best Practices
1. **Start with Dashboard**: Get overall program overview
2. **Check Monthly Tracking**: View temporal distribution of activities
3. **Review ITT**: Monitor performance against indicators
4. **Dive into ATT**: See detailed activity implementation
5. **Use Exports**: Generate reports for donors/stakeholders

### Data Entry
1. Select project and indicator from dropdowns
2. Enter activity code (e.g., 3.2.1, 3.2.4)
3. Fill disaggregation data (system auto-calculates totals)
4. Verify nationality totals match refugee count
5. Add budget, narrative, and attachments
6. Submit (in full system, would save to database)

### Monitoring Workflow
1. **Weekly**: Review active cases in Case Management
2. **Monthly**: Check Monthly Tracking for activity distribution
3. **Quarterly**: Export ITT and ATT for donor reports
4. **Annual**: Use Dashboard export for comprehensive overview

## Key Performance Indicators

### Dashboard Metrics
- **Indicators On-Track**: >75% achievement rate
- **Burn Rate Alert Levels**:
  - Green: <75% (healthy)
  - Yellow: 75-90% (monitor)
  - Red: >90% (action needed)

### Activity Status
- **Completed**: 100% target achieved
- **In Progress**: 50-99% achieved
- **Pending**: <50% achieved

## Support & Customization

### Customizing Data
Edit `mockData.js` to:
- Add new thematic areas
- Include additional projects
- Update indicators and activities
- Modify case management records

### Adding Features
The modular structure allows easy addition of:
- New report types
- Additional disaggregation dimensions
- Custom calculations
- Enhanced visualizations

## Future Enhancements

### Planned Features
- [ ] User authentication and role-based access
- [ ] Backend API integration (Node.js/Python)
- [ ] KoboCollect integration for mobile data collection
- [ ] Power BI connector for advanced analytics
- [ ] Interactive charts (Chart.js/D3.js)
- [ ] Real-time collaboration features
- [ ] Mobile-responsive enhancements
- [ ] PDF report generation
- [ ] Multi-language support (English, French, Arabic)
- [ ] Offline capability with sync

## Contact & Feedback

For questions, feedback, or customization requests, please contact:
- **Organization**: AWYAD
- **Purpose**: M&E System Demonstration
- **Version**: 1.0 (Demo)
- **Last Updated**: December 2025

---

## Quick Demo Script

### 5-Minute Demo Flow
1. **Dashboard** (1 min): Show overall statistics and thematic areas
2. **Monthly Tracking** (1 min): Demonstrate calendar view and quarterly summaries
3. **Activity Tracking** (1 min): Show detailed disaggregation and nationality tracking
4. **Case Management** (1 min): Display active cases and service tracking
5. **Data Entry** (1 min): Walk through form with real-time calculations and validation

### Key Talking Points
- "Real data extracted from your existing Excel tracking tools"
- "Eliminates manual formula errors and #ERROR! issues"
- "One-click CSV exports for donor reporting"
- "Built-in validation ensures data quality"
- "Nationality tracking aligns with current Excel practice"
- "Activity codes match M&E framework structure"

---

**Note**: This is a demonstration system. For production deployment, consider adding authentication, database integration, and enhanced security features.
#   - a w y a d - m e s - d e m o 
 
 
