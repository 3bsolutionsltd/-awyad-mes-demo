/**
 * Help & Quick Reference Guide Module
 * 
 * Provides interactive help documentation and quick reference guides
 * for all system features and workflows.
 * 
 * @module help
 * @author AWYAD MES Team
 * @since 2.0.0
 */

import { createPageHeader, createCard } from './components.js';

/**
 * Render the help and quick reference page
 * 
 * @param {HTMLElement} contentArea - Container element for content
 * @returns {void}
 */
export async function renderHelp(contentArea) {
    contentArea.innerHTML = `
        <div class="container-fluid">
            ${createPageHeader({
                title: 'Help & Quick Reference',
                subtitle: 'Current workflows, onboarding, and self-help resources',
                icon: 'question-circle'
            })}

            <!-- Quick Start Section -->
            <div class="row mb-4">
                <div class="col-12">
                    ${createCard({
                        title: 'Quick Start Guide',
                        subtitle: 'Get started with AWYAD M&E System in 5 minutes',
                        headerClass: 'bg-primary text-white',
                        body: renderQuickStart()
                    })}
                </div>
            </div>

            <!-- Pathway Navigator -->
            <div class="row mb-4">
                <div class="col-12">
                    ${createCard({
                        title: 'Pathway Navigator (Recommended Routes)',
                        subtitle: 'Choose the right entry point before you add data',
                        headerClass: 'bg-info text-white',
                        body: renderPathwayNavigator()
                    })}
                </div>
            </div>

            <!-- Self Help Toolkit -->
            <div class="row mb-4">
                <div class="col-12">
                    ${createCard({
                        title: 'Self-Help Toolkit for New Users',
                        subtitle: 'Learn by doing with guided checklists and role-based paths',
                        headerClass: 'bg-dark text-white',
                        body: renderSelfHelpToolkit()
                    })}
                </div>
            </div>

            <!-- Module Guides -->
            <div class="row mb-4">
                <div class="col-md-6">
                    ${createCard({
                        title: 'Dashboard',
                        subtitle: 'Understanding KPIs and metrics',
                        body: renderDashboardGuide()
                    })}
                </div>
                <div class="col-md-6">
                    ${createCard({
                        title: 'Projects Management',
                        subtitle: 'Track budgets and performance',
                        body: renderProjectsGuide()
                    })}
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    ${createCard({
                        title: 'Indicator Tracking',
                        subtitle: 'Monitor targets and achievement',
                        body: renderIndicatorsGuide()
                    })}
                </div>
                <div class="col-md-6">
                    ${createCard({
                        title: 'Activity Tracking',
                        subtitle: 'Record activities and beneficiaries',
                        body: renderActivitiesGuide()
                    })}
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    ${createCard({
                        title: 'Case Management',
                        subtitle: 'GBV case tracking workflow',
                        body: renderCasesGuide()
                    })}
                </div>
                <div class="col-md-6">
                    ${createCard({
                        title: 'Monthly Tracking',
                        subtitle: 'Calendar views and reports',
                        body: renderMonthlyGuide()
                    })}
                </div>
            </div>

            <!-- Common Tasks -->
            <div class="row mb-4">
                <div class="col-12">
                    ${createCard({
                        title: 'Common Tasks',
                        subtitle: 'Step-by-step tutorials for frequent operations',
                        headerClass: 'bg-success text-white',
                        body: renderCommonTasks()
                    })}
                </div>
            </div>

            <!-- Troubleshooting -->
            <div class="row mb-4">
                <div class="col-12">
                    ${createCard({
                        title: 'Troubleshooting',
                        subtitle: 'Solutions to common issues',
                        headerClass: 'bg-warning',
                        body: renderTroubleshooting()
                    })}
                </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="row mb-4">
                <div class="col-md-6">
                    ${createCard({
                        title: 'Keyboard Shortcuts',
                        subtitle: 'Speed up your workflow',
                        body: renderKeyboardShortcuts()
                    })}
                </div>
                <div class="col-md-6">
                    ${createCard({
                        title: 'Contact Support',
                        subtitle: 'Get help when you need it',
                        body: renderContactInfo()
                    })}
                </div>
            </div>
        </div>
    `;

    initializeSelfHelpToolkit();
}

/**
 * Render Quick Start section
 */
function renderQuickStart() {
    return `
        <div class="quick-start">
            <h5><i class="bi bi-rocket-takeoff"></i> Welcome to AWYAD M&E System!</h5>
            <p class="lead">Start with these 3 steps:</p>
            
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="card h-100 border-primary">
                        <div class="card-body">
                            <h6 class="card-title text-primary">
                                <span class="badge bg-primary rounded-circle">1</span>
                                Start from ITT for AWYAD Indicators
                            </h6>
                            <p class="card-text">
                                Open ITT, click "New Indicator," and choose Organizational (AWYAD-level) for AWYAD-wide indicators.
                            </p>
                            <a href="#indicators" class="btn btn-sm btn-outline-primary">Open ITT</a>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card h-100 border-success">
                        <div class="card-body">
                            <h6 class="card-title text-success">
                                <span class="badge bg-success rounded-circle">2</span>
                                Use Projects for Project Work
                            </h6>
                            <p class="card-text">
                                Open a project dashboard to create project-specific indicators and activities together.
                            </p>
                            <a href="#projects" class="btn btn-sm btn-outline-success">Go to Projects</a>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card h-100 border-info">
                        <div class="card-body">
                            <h6 class="card-title text-info">
                                <span class="badge bg-info rounded-circle">3</span>
                                Pick the Correct Data Entry Route
                            </h6>
                            <p class="card-text">
                                Create project activities from Projects, Project Dashboard, or ATT. Use the Activity Report form only to report completed activities.
                            </p>
                            <a href="#help" class="btn btn-sm btn-outline-info">View Pathway Navigator</a>
                        </div>
                    </div>
                </div>
            </div>

            <hr class="my-4">

            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <strong>Pro Tip:</strong> If you are unsure where to add data, first check the Pathway Navigator section below.
            </div>
        </div>
    `;
}

/**
 * Render current recommended workflow pathways
 */
function renderPathwayNavigator() {
    return `
        <div class="row g-3">
            <div class="col-lg-6">
                <div class="card h-100 border-success">
                    <div class="card-body">
                        <h6 class="text-success mb-2"><i class="bi bi-signpost-2"></i> Recommended for Project Work</h6>
                        <ol class="mb-2">
                            <li>Open <strong>Projects</strong> from sidebar</li>
                            <li>Select your project and open its dashboard</li>
                            <li>Add project indicators and activities from the same project context</li>
                        </ol>
                        <a href="#projects" class="btn btn-sm btn-outline-success">Open Projects</a>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card h-100 border-primary">
                    <div class="card-body">
                        <h6 class="text-primary mb-2"><i class="bi bi-building"></i> AWYAD-Level Indicators</h6>
                        <p class="mb-2">Use ITT to create organizational indicators. Use Strategic Dashboard to review AWYAD-wide performance after entry.</p>
                        <a href="#indicators" class="btn btn-sm btn-outline-primary">Open ITT</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3 mt-1">
            <div class="col-lg-6">
                <div class="card h-100 border-secondary">
                    <div class="card-body">
                        <h6 class="mb-2"><i class="bi bi-table"></i> Indicator Tracking (ITT)</h6>
                        <p class="mb-2">Still supports creating both Organizational and Project-Specific indicators.</p>
                        <a href="#indicators" class="btn btn-sm btn-outline-secondary">Open ITT</a>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card h-100 border-secondary">
                    <div class="card-body">
                        <h6 class="mb-2"><i class="bi bi-calendar-event"></i> Activity Tracking (ATT)</h6>
                        <p class="mb-2">Use ATT for creating, editing, and maintaining activity records.</p>
                        <a href="#activities" class="btn btn-sm btn-outline-secondary">Open ATT</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="alert alert-warning mt-3 mb-0">
            <i class="bi bi-lightbulb"></i>
            <strong>Quick Rule:</strong> Create project activities in Projects, Project Dashboard, or ATT. Use the Activity Report form only after the activity has been carried out.
        </div>
    `;
}

/**
 * Render self-help tools for onboarding
 */
function renderSelfHelpToolkit() {
    return `
        <div class="row g-4">
            <div class="col-lg-7">
                <h6><i class="bi bi-check2-square"></i> First-Day Checklist</h6>
                <p class="small text-muted mb-2">Check items as you complete them. Progress is saved in your browser.</p>
                <div class="list-group" id="firstDayChecklist">
                    <label class="list-group-item d-flex gap-2 align-items-start">
                        <input class="form-check-input mt-1 help-check" type="checkbox" data-help-check="open-dashboard">
                        <span>Opened <strong>Strategic Dashboard</strong> and reviewed summary cards</span>
                    </label>
                    <label class="list-group-item d-flex gap-2 align-items-start">
                        <input class="form-check-input mt-1 help-check" type="checkbox" data-help-check="open-project-dashboard">
                        <span>Opened a <strong>Project Dashboard</strong> from Projects page</span>
                    </label>
                    <label class="list-group-item d-flex gap-2 align-items-start">
                        <input class="form-check-input mt-1 help-check" type="checkbox" data-help-check="create-indicator">
                        <span>Created one indicator with the correct scope selection</span>
                    </label>
                    <label class="list-group-item d-flex gap-2 align-items-start">
                        <input class="form-check-input mt-1 help-check" type="checkbox" data-help-check="create-activity">
                        <span>Entered one activity and verified it appears in ATT</span>
                    </label>
                    <label class="list-group-item d-flex gap-2 align-items-start">
                        <input class="form-check-input mt-1 help-check" type="checkbox" data-help-check="export-data">
                        <span>Exported one report from dashboard, ITT, or ATT</span>
                    </label>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <small class="text-muted" id="helpChecklistProgress">0/5 completed</small>
                    <button type="button" class="btn btn-sm btn-outline-secondary" id="resetHelpChecklistBtn">Reset Checklist</button>
                </div>
            </div>

            <div class="col-lg-5">
                <h6><i class="bi bi-diagram-3"></i> Role-Based Starter Paths</h6>
                <div class="list-group mb-3">
                    <div class="list-group-item">
                        <strong>M&E Officer</strong>
                        <div class="small text-muted">ITT → Strategic Dashboard → ATT</div>
                    </div>
                    <div class="list-group-item">
                        <strong>Project Manager</strong>
                        <div class="small text-muted">Projects → Project Dashboard → ATT</div>
                    </div>
                    <div class="list-group-item">
                        <strong>Data Entry User</strong>
                        <div class="small text-muted">Activity Report Form → ATT validation</div>
                    </div>
                </div>

                <h6><i class="bi bi-compass"></i> Not Sure Where to Go?</h6>
                <div class="list-group">
                    <a href="#indicators" class="list-group-item list-group-item-action">I need to add an AWYAD organizational indicator</a>
                    <a href="#projects" class="list-group-item list-group-item-action">I need to add project-level indicator or activity</a>
                    <a href="#indicators" class="list-group-item list-group-item-action">I need ITT table updates or indicator review</a>
                    <a href="#activities" class="list-group-item list-group-item-action">I need ATT activity updates</a>
                    <a href="#entry-form" class="list-group-item list-group-item-action">I need to report a completed activity with full disaggregation</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Dashboard guide
 */
function renderDashboardGuide() {
    return `
        <h6>What You See:</h6>
        <ul>
            <li><strong>Summary Cards:</strong> Active Projects, On-Track Indicators, Activities This Month, Budget Burn Rate</li>
            <li><strong>Charts:</strong> Indicator Performance, Beneficiaries by Type, Gender Distribution</li>
            <li><strong>Thematic Areas:</strong> Progress by strategic result area</li>
            <li><strong>Results Framework:</strong> All indicators with current achievement</li>
        </ul>
        
        <h6>Key Actions:</h6>
        <ul>
            <li><i class="bi bi-download"></i> Export complete dashboard report to Excel</li>
            <li><i class="bi bi-arrow-clockwise"></i> Data refreshes automatically when you navigate</li>
            <li><i class="bi bi-graph-up"></i> Click on charts for detailed views</li>
        </ul>

        <div class="alert alert-success alert-sm">
            <strong>Color Guide:</strong><br>
            🟢 Green = On Track (≥70%)<br>
            🟡 Yellow = At Risk (40-69%)<br>
            🔴 Red = Off Track (<40%)
        </div>
    `;
}

/**
 * Render Projects guide
 */
function renderProjectsGuide() {
    return `
        <h6>Managing Projects:</h6>
        <ol>
            <li>Click <strong>Projects</strong> in sidebar</li>
            <li>Click <strong>+ New Project</strong> button</li>
            <li>Fill in: Name, Donor, Thematic Area, Dates, Budget</li>
            <li>Click <strong>Save Project</strong></li>
        </ol>
        
        <h6>Understanding Burn Rate:</h6>
        <div class="bg-light p-3 rounded">
            <code>Burn Rate = (Expenditure ÷ Budget) × 100%</code>
            <p class="mb-0 mt-2"><small>
                Example: $312,500 spent of $500,000 budget = 62.5% burn rate
            </small></p>
        </div>

        <h6 class="mt-3">Quick Tips:</h6>
        <ul>
            <li>✏️ Edit projects anytime to update expenditure</li>
            <li>📊 Charts update automatically</li>
            <li>🏷️ Assign thematic areas for better tracking</li>
        </ul>
    `;
}

/**
 * Render Indicators guide
 */
function renderIndicatorsGuide() {
    return `
        <h6>Indicator Workflow (Latest):</h6>
        <ol>
            <li><strong>Choose Scope First:</strong> Organizational (AWYAD-level) or Project-Specific</li>
            <li><strong>Create Indicator:</strong> Set code, name, level, and targets</li>
            <li><strong>Set Thematic Areas:</strong> AWYAD indicators can use multiple thematic areas</li>
            <li><strong>Update Progress:</strong> Edit achieved values monthly</li>
            <li><strong>Monitor Status:</strong> Check on-track/at-risk/off-track</li>
        </ol>

        <div class="alert alert-info alert-sm">
            <strong>Recommendation:</strong> For project-specific indicators, use Project Dashboard for the most guided flow.
            ITT still supports both scopes.
        </div>
        
        <h6>Target Types:</h6>
        <ul>
            <li><strong>LOP:</strong> Life of Project - total target</li>
            <li><strong>Annual:</strong> Year-end target</li>
            <li><strong>Quarterly:</strong> Q1, Q2, Q3 breakdown (optional)</li>
        </ul>

        <div class="alert alert-warning alert-sm">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Note:</strong> Quarterly Progress chart shows flat line when Q1/Q2/Q3 targets are not set. 
            This is normal - annual progress is still accurate.
        </div>
    `;
}

/**
 * Render Activities guide
 */
function renderActivitiesGuide() {
    return `
        <h6>Recording an Activity (Latest):</h6>
        <ol>
            <li>To create a project activity, start at <strong>Projects</strong>, <strong>Project Dashboard</strong>, or <strong>Activity Tracking (ATT)</strong></li>
            <li>Use the <strong>Activity Report form</strong> only when the activity has already been carried out and you are reporting results</li>
            <li>Select Project and Indicator</li>
            <li>Enter activity details and location</li>
            <li>Add beneficiary disaggregation:
                <ul>
                    <li>By gender: Male/Female</li>
                    <li>By age: 0-4, 5-17, 18-49, 50+</li>
                    <li>By community: Refugee/Host</li>
                    <li>By nationality: Sudanese, Congolese, etc.</li>
                </ul>
            </li>
            <li>Enter budget and actual cost</li>
            <li>Click <strong>Save Activity</strong></li>
        </ol>

        <h6>Beneficiary Totals:</h6>
        <p>System automatically calculates:</p>
        <div class="bg-light p-2 rounded">
            <small><code>Total = Refugee (M+F) + Host (M+F)</code></small>
        </div>

        <div class="alert alert-info alert-sm mt-3">
            <strong>Best Practice:</strong> Create activities in Project Dashboard or ATT. Use the Activity Report form for post-activity reporting with full disaggregation.
        </div>
    `;
}

/**
 * Render Cases guide
 */
function renderCasesGuide() {
    return `
        <h6>GBV Case Management:</h6>
        <ol>
            <li>Navigate to <strong>Case Management</strong></li>
            <li>Click <strong>+ New Case</strong></li>
            <li>Case number auto-generated (GBV-XXXX)</li>
            <li>Select case type and severity</li>
            <li>Record services provided</li>
            <li>Set follow-up date if needed</li>
            <li>Save case</li>
        </ol>
        
        <h6>Case Types:</h6>
        <ul class="small">
            <li>GBV Case Management</li>
            <li>Psychosocial Support</li>
            <li>Legal Support</li>
            <li>Medical Referral</li>
            <li>Child Protection</li>
            <li>And more...</li>
        </ul>

        <div class="alert alert-danger alert-sm">
            <i class="bi bi-shield-lock"></i>
            <strong>Confidentiality:</strong> Case data is sensitive. Never share personally identifiable information.
        </div>
    `;
}

/**
 * Render Monthly Tracking guide
 */
function renderMonthlyGuide() {
    return `
        <h6>Using Monthly Tracking:</h6>
        <ol>
            <li>Click year button to switch years (2024, 2025, 2026)</li>
            <li>View calendar grid showing activity counts</li>
            <li>Click month name to expand details</li>
            <li>Review quarterly summaries</li>
            <li>Export monthly report as needed</li>
        </ol>
        
        <h6>Year Selection:</h6>
        <p>System automatically detects years from your activity dates:</p>
        <ul>
            <li>✅ 2024, 2025, 2026 tabs appear based on data</li>
            <li>✅ Future years auto-added as activities are planned</li>
            <li>✅ Past years remain accessible for historical review</li>
        </ul>

        <div class="alert alert-success alert-sm">
            <i class="bi bi-calendar-check"></i>
            <strong>Tip:</strong> Hard refresh (Ctrl+Shift+R) if year tabs don't update after adding activities.
        </div>
    `;
}

/**
 * Render Common Tasks section
 */
function renderCommonTasks() {
    return `
        <div class="accordion" id="tasksAccordion">
            <!-- Task 1 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#task1">
                        <strong>How to choose the correct pathway before data entry</strong>
                    </button>
                </h2>
                <div id="task1" class="accordion-collapse collapse show" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>If the indicator/activity is <strong>project-specific</strong>, start at <strong>Projects</strong> and open Project Dashboard.</li>
                            <li>If the indicator is <strong>organizational (AWYAD-level)</strong>, start at <strong>Indicator Tracking (ITT)</strong>.</li>
                            <li>Use <strong>ITT</strong> for direct indicator table operations when needed.</li>
                            <li>Use <strong>ATT</strong> to create or manage activity records directly.</li>
                            <li>Use the <strong>Activity Report form</strong> only to report activities that have already happened.</li>
                        </ol>
                        <div class="alert alert-success">
                            ✅ Correct pathway selection reduces data entry mistakes and duplicate records.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task 2 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task2">
                        <strong>How to create a project indicator the recommended way</strong>
                    </button>
                </h2>
                <div id="task2" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>Open <strong>Projects</strong> and select your project</li>
                            <li>Open <strong>Project Dashboard</strong></li>
                            <li>Click <strong>New Indicator</strong> and choose <strong>Project-Specific</strong></li>
                            <li>Complete project fields and save</li>
                            <li>Add related activities from the same project context</li>
                        </ol>
                        <p><strong>System supports:</strong></p>
                        <ul>
                            <li>Project-specific indicator creation from ITT as well</li>
                            <li>Scope-aware form validation</li>
                            <li>Consistent reporting across dashboards and tables</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Task 3 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task3">
                        <strong>How to create an organizational indicator with multiple thematic areas</strong>
                    </button>
                </h2>
                <div id="task3" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>Open <strong>Indicator Tracking (ITT)</strong></li>
                            <li>Start new indicator and choose <strong>Organizational (AWYAD-level)</strong></li>
                            <li>Select one or more thematic areas from the list</li>
                            <li>Save indicator and verify thematic badges in reports</li>
                        </ol>

                        <p><strong>Verification points:</strong></p>
                        <ul>
                            <li>Indicator appears in ITT with thematic context</li>
                            <li>Strategic reporting reflects assigned thematic areas</li>
                            <li>Edit form allows adding/removing thematic selections</li>
                        </ul>
                        
                        <div class="alert alert-info">
                            <i class="bi bi-grid-3x3-gap"></i>
                            For many thematic areas, use search and "Select Visible" to work faster.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task 4 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task4">
                        <strong>How to export data to Excel</strong>
                    </button>
                </h2>
                <div id="task4" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <p><strong>From Dashboard:</strong></p>
                        <ol>
                            <li>Navigate to Dashboard</li>
                            <li>Click <strong>Export Report</strong> button</li>
                            <li>Excel file downloads with all data</li>
                        </ol>

                        <p><strong>From Other Modules:</strong></p>
                        <ul>
                            <li><strong>Projects:</strong> Click "Export Projects"</li>
                            <li><strong>Indicators:</strong> Click "Export Indicators"</li>
                            <li><strong>Activities:</strong> Click "Export Activities"</li>
                            <li><strong>Monthly:</strong> Click "Export Monthly Report"</li>
                        </ul>

                        <div class="alert alert-info">
                            <i class="bi bi-file-earmark-excel"></i>
                            Files are formatted with headers, data tables, and conditional formatting.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task 5 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task5">
                        <strong>How to register a GBV case</strong>
                    </button>
                </h2>
                <div id="task5" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>Navigate to <strong>Case Management</strong></li>
                            <li>Click <strong>+ New Case</strong> button</li>
                            <li>System auto-generates case number (GBV-XXXX)</li>
                            <li>Select <strong>Case Type</strong> (e.g., GBV Case Management)</li>
                            <li>Set <strong>Severity</strong> (Low/Medium/High/Critical)</li>
                            <li>Choose <strong>Status</strong> (Open/Closed/Follow-up Required)</li>
                            <li>Enter <strong>Date Reported</strong></li>
                            <li>Select <strong>Location</strong></li>
                            <li>Choose <strong>Services Provided</strong></li>
                            <li>Add beneficiary age and gender</li>
                            <li>Set <strong>Follow-up Date</strong> if needed</li>
                            <li>Add confidential notes</li>
                            <li>Click <strong>Save Case</strong></li>
                        </ol>
                        <div class="alert alert-warning">
                            ⚠️ <strong>Privacy:</strong> Never include names or other identifying information in case records.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Troubleshooting section
 */
function renderTroubleshooting() {
    return `
        <div class="row">
            <div class="col-md-6">
                <h6>Common Issues:</h6>
                <div class="list-group">
                    <div class="list-group-item">
                        <h6 class="mb-1">I created a project indicator in ITT by mistake</h6>
                        <p class="mb-1"><strong>Solution:</strong> Use Project Dashboard for project-specific workflows going forward</p>
                        <small class="text-muted">ITT still supports project indicators, but Project Dashboard is the recommended route</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">Indicator form won\'t submit</h6>
                        <p class="mb-1"><strong>Solution:</strong> Confirm scope is selected first, then complete required fields</p>
                        <small class="text-muted">Project scope requires project and result area</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">I have many thematic areas and selection feels crowded</h6>
                        <p class="mb-1"><strong>Solution:</strong> Use thematic search plus "Select Visible" in the indicator form</p>
                        <small class="text-muted">Selected count confirms exactly what will be saved</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">Page still shows old behavior after updates</h6>
                        <p class="mb-1"><strong>Solution:</strong> Hard refresh browser (Ctrl+Shift+R)</p>
                        <small class="text-muted">Browser cache may show old code</small>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <h6>Browser Support:</h6>
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <td>✅ Google Chrome</td>
                            <td class="text-success">Recommended</td>
                        </tr>
                        <tr>
                            <td>✅ Microsoft Edge</td>
                            <td class="text-success">Recommended</td>
                        </tr>
                        <tr>
                            <td>✅ Mozilla Firefox</td>
                            <td class="text-success">Supported</td>
                        </tr>
                        <tr>
                            <td>⚠️ Safari</td>
                            <td class="text-warning">Partial</td>
                        </tr>
                        <tr>
                            <td>❌ Internet Explorer</td>
                            <td class="text-danger">Not Supported</td>
                        </tr>
                    </tbody>
                </table>

                <h6 class="mt-4">Performance Tips:</h6>
                <ul>
                    <li>Clear browser cache monthly</li>
                    <li>Use latest browser version</li>
                    <li>Export large datasets instead of viewing</li>
                    <li>Close unused tabs</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * Render Keyboard Shortcuts section
 */
function renderKeyboardShortcuts() {
    return `
        <table class="table table-hover">
            <thead class="table-light">
                <tr>
                    <th>Shortcut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd></td>
                    <td>Hard refresh browser (clears cache)</td>
                </tr>
                <tr>
                    <td><kbd>F12</kbd></td>
                    <td>Open developer console (for debugging)</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                    <td>Search within current page</td>
                </tr>
                <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Close modal dialogs</td>
                </tr>
                <tr>
                    <td><kbd>Tab</kbd></td>
                    <td>Navigate between form fields</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                    <td>Submit forms (when focused on submit button)</td>
                </tr>
            </tbody>
        </table>
    `;
}

/**
 * Render Contact Information section
 */
function renderContactInfo() {
    return `
        <div class="contact-info">
            <h6>Need Help?</h6>
            <p>Contact the AWYAD M&E Team for support:</p>
            
            <div class="list-group">
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1"><i class="bi bi-envelope"></i> System Administrator</h6>
                    </div>
                    <p class="mb-1">admin@awyad.org</p>
                    <small class="text-muted">For login issues and user management</small>
                </div>
                
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1"><i class="bi bi-headset"></i> Technical Support</h6>
                    </div>
                    <p class="mb-1">support@awyad.org</p>
                    <small class="text-muted">For bugs, errors, and technical issues</small>
                </div>
                
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1"><i class="bi bi-book"></i> Training Team</h6>
                    </div>
                    <p class="mb-1">training@awyad.org</p>
                    <small class="text-muted">For system training and user guides</small>
                </div>
            </div>

            <hr>

            <h6 class="mt-4">Documentation:</h6>
            <ul>
                <li><i class="bi bi-file-text"></i> <a href="../docs/USER_MANUAL.md" target="_blank">Full User Manual</a></li>
                <li><i class="bi bi-people"></i> <a href="../docs/UAT_GUIDE.md" target="_blank">UAT Guide</a></li>
                <li><i class="bi bi-question-circle"></i> This Help Page (bookmark it!)</li>
                <li><i class="bi bi-code-square"></i> API Documentation (for developers)</li>
            </ul>

            <div class="alert alert-info mt-3">
                <strong>System Version:</strong> 2.0.0 (Enterprise)<br>
                <strong>Last Updated:</strong> July 8, 2026
            </div>
        </div>
    `;
}

/**
 * Initialize interactive onboarding checklist widgets
 */
function initializeSelfHelpToolkit() {
    const storageKey = 'awyad.help.firstDayChecklist';
    const checks = Array.from(document.querySelectorAll('.help-check'));
    const progressEl = document.getElementById('helpChecklistProgress');
    const resetBtn = document.getElementById('resetHelpChecklistBtn');

    if (!checks.length || !progressEl) {
        return;
    }

    const saved = (() => {
        try {
            const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    })();

    const updateProgress = () => {
        const completed = checks.filter(chk => chk.checked).length;
        progressEl.textContent = `${completed}/${checks.length} completed`;
    };

    const persist = () => {
        const state = {};
        checks.forEach(chk => {
            state[chk.dataset.helpCheck] = chk.checked;
        });
        localStorage.setItem(storageKey, JSON.stringify(state));
    };

    checks.forEach(chk => {
        const key = chk.dataset.helpCheck;
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
            chk.checked = Boolean(saved[key]);
        }

        chk.addEventListener('change', () => {
            persist();
            updateProgress();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            checks.forEach(chk => {
                chk.checked = false;
            });
            persist();
            updateProgress();
        });
    }

    updateProgress();
}
