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
                subtitle: 'User guides, tutorials, and system documentation',
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
}

/**
 * Render Quick Start section
 */
function renderQuickStart() {
    return `
        <div class="quick-start">
            <h5><i class="bi bi-rocket-takeoff"></i> Welcome to AWYAD M&E System!</h5>
            <p class="lead">Follow these steps to get started:</p>
            
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="card h-100 border-primary">
                        <div class="card-body">
                            <h6 class="card-title text-primary">
                                <span class="badge bg-primary rounded-circle">1</span>
                                Explore the Dashboard
                            </h6>
                            <p class="card-text">
                                View real-time KPIs, project performance, and indicator achievement.
                            </p>
                            <a href="#dashboard" class="btn btn-sm btn-outline-primary">Go to Dashboard</a>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card h-100 border-success">
                        <div class="card-body">
                            <h6 class="card-title text-success">
                                <span class="badge bg-success rounded-circle">2</span>
                                Add Your First Activity
                            </h6>
                            <p class="card-text">
                                Use the New Activity Report form to record your field work.
                            </p>
                            <a href="#entry-form" class="btn btn-sm btn-outline-success">New Activity</a>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card h-100 border-info">
                        <div class="card-body">
                            <h6 class="card-title text-info">
                                <span class="badge bg-info rounded-circle">3</span>
                                Generate Reports
                            </h6>
                            <p class="card-text">
                                Export data to Excel from any module for analysis and sharing.
                            </p>
                            <button class="btn btn-sm btn-outline-info" disabled>Export Options</button>
                        </div>
                    </div>
                </div>
            </div>

            <hr class="my-4">

            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <strong>Pro Tip:</strong> Use the sidebar menu (☰) to navigate between modules. 
                Click the toggle button to collapse the sidebar for more screen space.
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
        <h6>Indicator Workflow:</h6>
        <ol>
            <li><strong>Create Indicator:</strong> Set code, name, type, targets</li>
            <li><strong>Link to Activities:</strong> Activities contribute to achievement</li>
            <li><strong>Update Progress:</strong> Edit achieved values monthly</li>
            <li><strong>Monitor Status:</strong> Check on-track/at-risk/off-track</li>
        </ol>
        
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
        <h6>Recording an Activity:</h6>
        <ol>
            <li>Click <strong>New Activity Report</strong> in sidebar</li>
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
            <strong>Best Practice:</strong> Enter disaggregation data immediately after activity completion for accuracy.
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
                        <strong>How to add a new activity with beneficiaries</strong>
                    </button>
                </h2>
                <div id="task1" class="accordion-collapse collapse show" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>Click <strong>New Activity Report</strong> in sidebar</li>
                            <li>Select <strong>Project</strong> from dropdown</li>
                            <li>Select <strong>Indicator</strong> from dropdown</li>
                            <li>Enter <strong>Activity Name</strong> (e.g., "Community sensitization on GBV")</li>
                            <li>Set <strong>Planned Date</strong></li>
                            <li>Choose <strong>Location</strong></li>
                            <li>Enter disaggregation:
                                <ul>
                                    <li>Refugee Male: 0-4 (5), 5-17 (30), 18-49 (45), 50+ (10)</li>
                                    <li>Refugee Female: 0-4 (8), 5-17 (35), 18-49 (50), 50+ (12)</li>
                                </ul>
                            </li>
                            <li>System calculates total automatically (195 in this example)</li>
                            <li>Enter <strong>Budget</strong> if applicable</li>
                            <li>Click <strong>Save Activity</strong></li>
                        </ol>
                        <div class="alert alert-success">
                            ✅ Activity saved! It will appear in Activity Tracking and count towards indicator achievement.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Task 2 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task2">
                        <strong>How to update indicator achievement</strong>
                    </button>
                </h2>
                <div id="task2" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
                    <div class="accordion-body">
                        <ol>
                            <li>Go to <strong>Indicator Tracking (ITT)</strong></li>
                            <li>Find your indicator in the table</li>
                            <li>Click <strong>✏️ Edit</strong> button</li>
                            <li>Update <strong>Achieved</strong> field with current value</li>
                            <li>Click <strong>Update Indicator</strong></li>
                        </ol>
                        <p><strong>System automatically:</strong></p>
                        <ul>
                            <li>Calculates percentage achieved</li>
                            <li>Updates progress bar color</li>
                            <li>Reflects in dashboard</li>
                            <li>Updates variance (Achieved - Target)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Task 3 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task3">
                        <strong>How to export data to Excel</strong>
                    </button>
                </h2>
                <div id="task3" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
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

            <!-- Task 4 -->
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#task4">
                        <strong>How to register a GBV case</strong>
                    </button>
                </h2>
                <div id="task4" class="accordion-collapse collapse" data-bs-parent="#tasksAccordion">
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
                        <h6 class="mb-1">Year tabs not showing 2024</h6>
                        <p class="mb-1"><strong>Solution:</strong> Hard refresh browser (Ctrl+Shift+R)</p>
                        <small class="text-muted">Browser cache may show old code</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">Quarterly Progress chart is flat</h6>
                        <p class="mb-1"><strong>Explanation:</strong> Normal when Q1/Q2/Q3 not set</p>
                        <small class="text-muted">Annual progress is still accurate</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">Gender chart not displaying</h6>
                        <p class="mb-1"><strong>Solution:</strong> Hard refresh and check data entry</p>
                        <small class="text-muted">Ensure activities have male/female counts</small>
                    </div>
                    <div class="list-group-item">
                        <h6 class="mb-1">Project showing N/A for thematic area</h6>
                        <p class="mb-1"><strong>Solution:</strong> Edit project and assign area</p>
                        <small class="text-muted">Select from thematic area dropdown</small>
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
                <li><i class="bi bi-file-text"></i> <a href="USER_MANUAL.md" target="_blank">Full User Manual</a></li>
                <li><i class="bi bi-question-circle"></i> This Help Page (bookmark it!)</li>
                <li><i class="bi bi-code-square"></i> API Documentation (for developers)</li>
            </ul>

            <div class="alert alert-info mt-3">
                <strong>System Version:</strong> 2.0.0 (Enterprise)<br>
                <strong>Last Updated:</strong> January 20, 2026
            </div>
        </div>
    `;
}
