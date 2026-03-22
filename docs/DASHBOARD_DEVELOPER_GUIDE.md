# Dashboard System - Developer Quick Reference

## 🚀 Quick Start

### 1. View Strategic Dashboard
```javascript
window.location.hash = 'strategic-dashboard';
```

### 2. View Project Dashboard
```javascript
window.location.hash = 'project-dashboard?id=PROJECT_UUID';
```

### 3. Get Dashboard Data
```javascript
import { dashboardService } from './services/dashboardService.js';

// Strategic hierarchy
const hierarchy = await dashboardService.getStrategicHierarchy();

// Project details
const project = await dashboardService.getProjectDetails(projectId);

// Clear cache when data updates
dashboardService.clearCache();
```

---

## 📁 File Organization

```
public/
├── css/
│   └── dashboards.css                 # All dashboard styles
├── js/
│   ├── services/
│   │   └── dashboardService.js        # API layer with caching
│   ├── components/
│   │   ├── strategyCard.js            # Strategy display
│   │   ├── treeView.js                # Generic tree
│   │   ├── componentCard.js           # Component details
│   │   └── dashboardSwitcher.js       # View switcher
│   ├── dashboards/
│   │   ├── strategicDashboard.js      # AWYAD Strategic view
│   │   └── projectDashboard.js        # Project-specific view
│   └── navigation.js                  # Routes (updated)
```

---

## 🎨 Components Usage

### Strategy Card
```javascript
import { createStrategyCard } from './components/strategyCard.js';

const html = createStrategyCard({
    id: 'uuid',
    code: 'STRAT1',
    name: 'Protection Strategy',
    pillars: [...],
    pillar_count: 7,
    component_count: 19,
    project_count: 12
}, false); // second param: expanded state
```

### Tree View
```javascript
import { createTreeView } from './components/treeView.js';

const html = createTreeView(data, {
    containerId: 'my-tree',
    childrenKey: 'children',
    labelKey: 'name',
    showSearch: true,
    showExpandAll: true,
    onNodeClick: (nodeId) => console.log('Clicked:', nodeId)
});
```

### Component Card
```javascript
import { createComponentCard } from './components/componentCard.js';

const html = createComponentCard({
    id: 'uuid',
    code: 'COMP1',
    name: 'GBV Response',
    interventions: [...],
    implementation_approaches: [...],
    projects: [...]
});
```

### Dashboard Switcher
```javascript
import { 
    createDashboardSwitcher, 
    initializeDashboardSwitcher 
} from './components/dashboardSwitcher.js';

// In HTML
const html = createDashboardSwitcher();

// After DOM ready
await initializeDashboardSwitcher();
```

---

## 🛠 API Service Methods

### Strategic Dashboard
```javascript
// All strategic hierarchy (Strategies → Pillars → Components)
const hierarchy = await dashboardService.getStrategicHierarchy();
// Returns: { success: true, data: [...] }

// AWYAD-level indicators
const indicators = await dashboardService.getAWYADIndicators();
// Returns: { success: true, data: [...] }

// Overall statistics
const stats = await dashboardService.getOverallSummary();
// Returns: { success: true, data: { strategy_count, pillar_count, ... } }

// Projects under a component
const projects = await dashboardService.getProjectsByComponent(componentId);
```

### Project Dashboard
```javascript
// All projects (for selector)
const projects = await dashboardService.getAllProjects();

// Complete project details
const project = await dashboardService.getProjectDetails(projectId);

// Financial data with transfers
const financials = await dashboardService.getProjectFinancials(projectId);

// Project-specific indicators
const indicators = await dashboardService.getProjectIndicators(projectId);

// Activities (with optional filters)
const activities = await dashboardService.getProjectActivities(projectId, {
    status: 'In Progress',
    location: 'District A'
});

// Cases (privacy-safe)
const cases = await dashboardService.getProjectCases(projectId);
// Returns: { success: true, data: { recent: [...], stats: {...} } }

// Team members
const team = await dashboardService.getProjectTeam(projectId);

// Monthly performance (last 6 months)
const performance = await dashboardService.getProjectPerformance(projectId, 6);

// Activity timeline (Gantt data)
const timeline = await dashboardService.getActivityTimeline(projectId);

// Beneficiaries with disaggregation
const beneficiaries = await dashboardService.getBeneficiarySummary(projectId);
```

### Caching
```javascript
// Clear specific cache
dashboardService.clearCache('strategic-hierarchy');

// Clear all cache
dashboardService.clearCache();

// Preload data for faster UX
await dashboardService.preloadDashboardData();

// Refresh all data
await dashboardService.refreshAll();
```

---

## 🎯 Adding New Dashboard Section

### Step 1: Create Render Function
```javascript
// In projectDashboard.js or strategicDashboard.js

function renderNewSection(data) {
    if (!data || data.length === 0) {
        return `
            <div class="alert alert-info">
                No data available.
            </div>
        `;
    }
    
    return `
        <div class="row mb-4">
            <div class="col-12">
                <h4><i class="bi bi-icon-name"></i> Section Title</h4>
                <div class="card">
                    <div class="card-body">
                        <!-- Section content -->
                    </div>
                </div>
            </div>
        </div>
    `;
}
```

### Step 2: Add to Main Render
```javascript
// In main render function
container.innerHTML = `
    ${createDashboardSwitcher()}
    ${renderProjectHeader(project)}
    ${renderNewSection(newData)}  // <-- Add here
    ${renderFinancialPerformance(financials, project)}
    ...
`;
```

### Step 3: Add API Method (if needed)
```javascript
// In dashboardService.js

async getNewData(projectId) {
    return await this._fetchWithCache(
        `${API_BASE}/projects/${projectId}/new-data`,
        `project-${projectId}-new-data`
    );
}
```

### Step 4: Fetch Data
```javascript
// In main dashboard function
const [
    detailsResponse,
    newDataResponse  // <-- Add here
] = await Promise.all([
    dashboardService.getProjectDetails(projectId),
    dashboardService.getNewData(projectId)  // <-- Add here
]);

const newData = newDataResponse.success ? newDataResponse.data : null;
```

---

## 🎨 CSS Classes Reference

### Layout
```css
.strategic-dashboard-new      /* Container for strategic dashboard */
.project-dashboard-new        /* Container for project dashboard */
.dashboard-switcher           /* Switcher component */
.summary-cards                /* Summary statistics section */
```

### Hierarchy Components
```css
.strategy-card                /* Strategy card container */
.strategy-header              /* Strategy header (clickable) */
.strategy-body                /* Strategy content (collapsible) */
.strategy-badges              /* Badge container */

.pillar-item                  /* Pillar container */
.pillar-header                /* Pillar header */
.pillar-components            /* Pillar components container */

.component-item               /* Component container */
.component-detail-card        /* Detailed component modal */
```

### Status Badges
```css
.badge.bg-success            /* Active, Completed, On Track */
.badge.bg-primary            /* In Progress, On Track */
.badge.bg-warning            /* At Risk, Pending */
.badge.bg-danger             /* Behind, Overdue */
.badge.bg-secondary          /* Cancelled, N/A */
.badge.bg-info               /* Planning */
```

### Responsive Utilities
```css
/* Mobile: < 768px */
.col-6                       /* 2 per row on mobile */
.col-sm-4                    /* 3 per row on small */
.col-md-2                    /* 6 per row on desktop */

/* Visibility */
.d-none.d-md-block          /* Hide mobile, show desktop */
.d-md-none                   /* Hide desktop, show mobile */
```

---

## 📊 Data Structures

### Strategic Hierarchy
```javascript
{
    success: true,
    data: [
        {
            id: "uuid",
            code: "STRAT1",
            name: "Protection Strategy",
            description: "...",
            pillar_count: 7,
            component_count: 19,
            project_count: 12,
            pillars: [
                {
                    id: "uuid",
                    code: "PILLAR1.1",
                    name: "Violence Prevention",
                    component_count: 5,
                    components: [
                        {
                            id: "uuid",
                            code: "COMP1.1.1",
                            name: "GBV Response",
                            interventions: [
                                { name: "Intervention 1", description: "...", order: 1 }
                            ],
                            implementation_approaches: [
                                { name: "Approach 1", description: "...", order: 1 }
                            ],
                            project_count: 3
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Project Details
```javascript
{
    success: true,
    data: {
        id: "uuid",
        name: "Project Alpha",
        donor: "USAID",
        status: "Active",
        start_date: "2024-01-01",
        end_date: "2026-12-31",
        budget: 500000,
        expenditure: 250000,
        burn_rate: 50.0,
        location: "District A",
        team_count: 5
    }
}
```

### Project Financials
```javascript
{
    success: true,
    data: {
        original_budget: 500000,
        transfers_in: 50000,
        transfers_out: 30000,
        total_available: 520000,
        expenditure: 260000,
        available_balance: 260000,
        burn_rate: 50.0
    }
}
```

### Project Indicators
```javascript
{
    success: true,
    data: [
        {
            id: "uuid",
            name: "Indicator A",
            description: "Number of...",
            target: 1000,
            achieved: 800,
            q1: 200,
            q2: 250,
            q3: 175,
            q4: 175
        }
    ]
}
```

### Project Cases
```javascript
{
    success: true,
    data: {
        recent: [
            {
                id: "uuid",
                case_number: "CASE-001",
                case_type: "GBV",
                date_opened: "2024-01-15",
                status: "Open"
                // NO NAMES for privacy
            }
        ],
        stats: {
            total_cases: 45,
            active: 23,
            closed: 18,
            pending: 4
        }
    }
}
```

---

## 🔧 Common Tasks

### Refresh Dashboard Data
```javascript
// Clear cache for specific project
dashboardService.clearCache(`project-${projectId}-details`);

// Reload dashboard
window.location.reload();

// Or refresh without reload
await dashboardService.refreshAll();
```

### Navigate Between Dashboards
```javascript
// Go to strategic
window.location.hash = 'strategic-dashboard';

// Go to specific project
window.location.hash = `project-dashboard?id=${projectId}`;

// Extract project ID from URL
const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
const projectId = urlParams.get('id');
```

### Toggle Section Visibility
```javascript
// Use Bootstrap Collapse
const section = document.getElementById('section-id');
const bsCollapse = new bootstrap.Collapse(section, { toggle: true });

// Or manually
section.classList.toggle('show');
```

### Format Display Values
```javascript
// Currency
function formatCurrency(amount) {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
}

// Numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

// Dates
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// XSS Protection
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## 🐛 Debugging Tips

### Check Dashboard Service
```javascript
// Open browser console
console.log(dashboardService);

// Check cache
console.log(dashboardService.cache);

// Test API call
dashboardService.getStrategicHierarchy().then(console.log);
```

### Check Route Handling
```javascript
// Current hash
console.log(window.location.hash);

// All registered routes
console.log(routes);

// Navigation history
console.log(window.history);
```

### Check Component Rendering
```javascript
// Find element
const element = document.querySelector('.strategy-card');
console.log(element);

// Check Bootstrap Collapse
const collapseElement = document.getElementById('strategy-collapse-uuid');
const bsCollapse = bootstrap.Collapse.getInstance(collapseElement);
console.log(bsCollapse);
```

---

## ⚡ Performance Tips

1. **Use Caching:** Let the service handle caching automatically
2. **Parallel Fetching:** Always use Promise.all() for independent requests
3. **Progressive Loading:** Show summaries first, details after
4. **Lazy Rendering:** Render tree nodes only when expanded
5. **Debounce Search:** Use debounce for search/filter inputs
6. **Minimize DOM Updates:** Batch updates when possible
7. **Use Event Delegation:** Attach handlers to parent elements

---

## 🔒 Security Checklist

- ✅ Always use `escapeHtml()` for user-generated content
- ✅ Use `authManager.authenticatedFetch()` for API calls
- ✅ Never display case subject names or sensitive data
- ✅ Validate data before rendering
- ✅ Use HTTPS in production
- ✅ Implement CSRF protection on backend
- ✅ Rate limit API endpoints

---

## 📱 Responsive Testing

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### Test Commands (Browser DevTools)
```javascript
// Simulate mobile
// Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)

// Check current viewport
console.log(`Width: ${window.innerWidth}px`);

// Force mobile CSS
document.body.style.width = '375px';
```

---

## 🎓 Best Practices

1. **Component Design:**
   - Keep components small and focused
   - Return HTML strings for easy testing
   - Document parameters clearly

2. **API Integration:**
   - Always handle errors gracefully
   - Show loading states
   - Cache when appropriate

3. **Responsive Design:**
   - Mobile-first approach
   - Test on real devices
   - Use relative units (rem, %)

4. **Code Quality:**
   - Use ESLint for consistency
   - Add JSDoc comments
   - Write reusable functions

5. **User Experience:**
   - Fast loading (< 2 seconds)
   - Clear error messages
   - Smooth transitions

---

## 📞 Quick Help

**Dashboard not showing?**
- Check browser console for errors
- Verify API endpoints are running
- Check authentication token

**Cache issues?**
- Call `dashboardService.clearCache()`
- Hard refresh browser (Ctrl+F5)

**Styling problems?**
- Check `dashboards.css` is loaded
- Inspect element in DevTools
- Verify Bootstrap 5 is loaded

**Navigation broken?**
- Check hash in URL bar
- Verify route exists in `navigation.js`
- Check console for routing errors

---

**For detailed implementation guide, see:** `STREAM_6_FRONTEND_DASHBOARD_COMPLETE.md`

**For API documentation, see:** Backend API documentation (pending)

**For user guide, see:** User manual (pending)
