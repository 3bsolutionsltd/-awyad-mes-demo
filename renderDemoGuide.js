// renderDemoGuide.js - Demo Guide Module
export function renderDemoGuide() {
    return `
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="bi bi-book me-2"></i>Demo Guide</h2>
                    </div>

                    <!-- Welcome Section -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h4 class="card-title text-primary"><i class="bi bi-stars me-2"></i>Welcome to AWYAD MES Demo</h4>
                            <p class="lead">This comprehensive Monitoring, Evaluation, and Learning (MES) system tracks humanitarian programs across multiple thematic areas with real-time data visualization and reporting capabilities.</p>
                            <hr>
                            <p><strong>Built for:</strong> AWYAD's GBV Response and Child Protection Programs</p>
                            <p><strong>Data Source:</strong> Real data extracted from current Excel tracking tools</p>
                            <p><strong>Coverage:</strong> 2 Thematic Areas • 11 Indicators • 10 Activities • 3 Active Cases</p>
                        </div>
                    </div>

                    <!-- Quick Start -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-rocket-takeoff me-2"></i>Quick Start Guide</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="bi bi-1-circle-fill text-primary me-2"></i>Navigate the System</h6>
                                    <p>Use the sidebar menu to access different modules. Click the <i class="bi bi-list"></i> icon to collapse/expand the menu.</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-2-circle-fill text-primary me-2"></i>Explore Data</h6>
                                    <p>View real-time statistics, track indicators, and monitor activities across all thematic areas.</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-3-circle-fill text-primary me-2"></i>Export Reports</h6>
                                    <p>Download CSV reports from Dashboard, Indicator Tracking, Activity Tracking, and Monthly Tracking modules.</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-4-circle-fill text-primary me-2"></i>Enter New Data</h6>
                                    <p>Use the Entry Form to add new beneficiary data with automatic calculation and validation.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Module Overview -->
                    <div class="card mb-4">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-grid-3x3-gap me-2"></i>System Modules</h5>
                        </div>
                        <div class="card-body">
                            <div class="accordion" id="modulesAccordion">
                                
                                <!-- Dashboard -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#module1">
                                            <i class="bi bi-speedometer2 me-2"></i><strong>Dashboard</strong>
                                        </button>
                                    </h2>
                                    <div id="module1" class="accordion-collapse collapse show" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> High-level overview of all program activities and performance</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Key statistics: Active projects, indicators on track, total activities, budget burn rate</li>
                                                <li>Thematic area breakdown with visual progress bars</li>
                                                <li>Quick identification of indicators needing attention</li>
                                                <li>CSV export of complete dashboard summary</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Start here for daily monitoring and quick status checks</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Projects -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module2">
                                            <i class="bi bi-folder me-2"></i><strong>Projects</strong>
                                        </button>
                                    </h2>
                                    <div id="module2" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Manage and monitor project-level information</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Project details: Budget, timeline, thematic area assignment</li>
                                                <li>Associated indicators for each project</li>
                                                <li>Budget tracking and spending analysis</li>
                                                <li>Project status at a glance</li>
                                            </ul>
                                            <p><strong>Current Projects:</strong> GBV Response ($500k) • Child Protection ($420k)</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Indicator Tracking -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module3">
                                            <i class="bi bi-graph-up me-2"></i><strong>Indicator Tracking Table (ITT)</strong>
                                        </button>
                                    </h2>
                                    <div id="module3" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Track performance against indicator targets</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>11 real indicators from current M&E framework</li>
                                                <li>Target vs. Achieved comparison with variance calculation</li>
                                                <li>Progress percentage and visual indicators</li>
                                                <li>Alert badges for off-track indicators</li>
                                                <li>Full ITT export to CSV</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Monthly reporting, performance analysis, donor reporting</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Activity Tracking -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module4">
                                            <i class="bi bi-list-check me-2"></i><strong>Activity Tracking Table (ATT)</strong>
                                        </button>
                                    </h2>
                                    <div id="module4" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Detailed activity-level tracking with full disaggregation</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Activity codes from M&E framework (3.2.x, 4.1.x series)</li>
                                                <li>Complete disaggregation by: Age (4 groups) × Gender (2) × Community Type (2)</li>
                                                <li>Nationality breakdown (Syrian, Lebanese, Palestinian, Other)</li>
                                                <li>10 activities with real beneficiary numbers</li>
                                                <li>Export with full disaggregation details</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Detailed analysis, donor reporting, beneficiary profiling</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Case Management -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module5">
                                            <i class="bi bi-person-badge me-2"></i><strong>Case Management</strong>
                                        </button>
                                    </h2>
                                    <div id="module5" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Track GBV and Child Protection cases</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Active cases table with follow-up alerts</li>
                                                <li>Closed cases with duration tracking</li>
                                                <li>Case details: Type, location, beneficiary info, services provided</li>
                                                <li>Assigned case workers and status tracking</li>
                                                <li>Color-coded alerts for urgent follow-ups</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Case worker assignments, service delivery tracking, case closure monitoring</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Monthly Tracking -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module6">
                                            <i class="bi bi-calendar-month me-2"></i><strong>Monthly Tracking</strong>
                                        </button>
                                    </h2>
                                    <div id="module6" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Time-based activity tracking and reporting</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Calendar view showing activities per month</li>
                                                <li>Quarterly summary cards (Q1-Q4) with aggregated metrics</li>
                                                <li>Monthly accordion with detailed breakdowns</li>
                                                <li>Disaggregation by age, gender, community type per month</li>
                                                <li>Export monthly breakdown to CSV</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Quarterly reports, trend analysis, seasonal planning</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Entry Form -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#module7">
                                            <i class="bi bi-pencil-square me-2"></i><strong>Entry Form</strong>
                                        </button>
                                    </h2>
                                    <div id="module7" class="accordion-collapse collapse" data-bs-parent="#modulesAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Purpose:</strong> Add new beneficiary data to the system</p>
                                            <p><strong>Features:</strong></p>
                                            <ul>
                                                <li>Activity selection with activity code display</li>
                                                <li>Automatic beneficiary calculator with real-time totals</li>
                                                <li>Full disaggregation input: Age groups × Gender × Community type</li>
                                                <li>Nationality breakdown with validation</li>
                                                <li>Automatic verification (ensures nationality sum = total beneficiaries)</li>
                                                <li>Form validation and error messages</li>
                                            </ul>
                                            <p><strong>Use Case:</strong> Daily data entry, field staff reporting, beneficiary registration</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- Data Features -->
                    <div class="card mb-4">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="bi bi-database me-2"></i>Data & Disaggregation</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6><i class="bi bi-people-fill text-info me-2"></i>Age Groups</h6>
                                    <ul>
                                        <li>0-5 years (Early Childhood)</li>
                                        <li>6-12 years (Children)</li>
                                        <li>13-17 years (Adolescents)</li>
                                        <li>18+ years (Adults)</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-gender-ambiguous text-info me-2"></i>Gender & Community</h6>
                                    <ul>
                                        <li>Male / Female</li>
                                        <li>Host Community / Refugee</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-flag text-info me-2"></i>Nationality Tracking</h6>
                                    <ul>
                                        <li>Syrian</li>
                                        <li>Lebanese</li>
                                        <li>Palestinian</li>
                                        <li>Other</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="bi bi-file-earmark-spreadsheet text-info me-2"></i>Export Capabilities</h6>
                                    <ul>
                                        <li>Dashboard Summary CSV</li>
                                        <li>Complete ITT Export</li>
                                        <li>ATT with Disaggregation</li>
                                        <li>Monthly Breakdown CSV</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 5-Minute Demo Script -->
                    <div class="card mb-4" style="display: none;">
                        <div class="card-header bg-warning">
                            <h5 class="mb-0"><i class="bi bi-clock me-2"></i>5-Minute Demo Script</h5>
                        </div>
                        <div class="card-body">
                            <ol>
                                <li class="mb-3">
                                    <strong>Dashboard (1 min)</strong>
                                    <ul>
                                        <li>Show high-level statistics</li>
                                        <li>Highlight thematic areas and progress bars</li>
                                        <li>Demo CSV export feature</li>
                                    </ul>
                                </li>
                                <li class="mb-3">
                                    <strong>Indicator Tracking (1 min)</strong>
                                    <ul>
                                        <li>Explain real indicator data from current tools</li>
                                        <li>Show target vs achieved comparison</li>
                                        <li>Point out off-track indicators</li>
                                    </ul>
                                </li>
                                <li class="mb-3">
                                    <strong>Activity Tracking (1 min)</strong>
                                    <ul>
                                        <li>Show activity codes from M&E framework</li>
                                        <li>Explain disaggregation structure</li>
                                        <li>Demonstrate export with full details</li>
                                    </ul>
                                </li>
                                <li class="mb-3">
                                    <strong>Monthly Tracking (1 min)</strong>
                                    <ul>
                                        <li>Navigate calendar view</li>
                                        <li>Show quarterly summaries</li>
                                        <li>Open monthly accordion for detailed breakdown</li>
                                    </ul>
                                </li>
                                <li class="mb-3">
                                    <strong>Entry Form (1 min)</strong>
                                    <ul>
                                        <li>Fill in sample activity</li>
                                        <li>Show automatic calculation</li>
                                        <li>Demonstrate nationality validation</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    </div>

                    <!-- Key Talking Points -->
                    <div class="card mb-4" style="display: none;">
                        <div class="card-header bg-danger text-white">
                            <h5 class="mb-0"><i class="bi bi-megaphone me-2"></i>Key Talking Points</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-danger mb-3">
                                <h6><i class="bi bi-exclamation-triangle me-2"></i>Emphasize These Benefits:</h6>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Real Data Integration:</strong> Uses actual data from current Excel tools</li>
                                        <li><strong>Time Savings:</strong> Replaces multiple Excel files with one system</li>
                                        <li><strong>Automatic Calculations:</strong> No more #ERROR! formulas</li>
                                        <li><strong>Data Quality:</strong> Built-in validation prevents entry errors</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <ul>
                                        <li><strong>Easy Reporting:</strong> One-click CSV exports for donors</li>
                                        <li><strong>Real-time Insights:</strong> Instant visibility into program performance</li>
                                        <li><strong>User-Friendly:</strong> Clean interface, no training required</li>
                                        <li><strong>Scalable:</strong> Ready for backend integration and expansion</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Technical Details -->
                    <div class="card mb-4" style="display: none;">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Technical Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <h6>Frontend Stack</h6>
                                    <ul>
                                        <li>HTML5</li>
                                        <li>Bootstrap 5.3.2</li>
                                        <li>JavaScript ES6 Modules</li>
                                        <li>Bootstrap Icons</li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <h6>Browser Support</h6>
                                    <ul>
                                        <li>Chrome/Edge (recommended)</li>
                                        <li>Firefox</li>
                                        <li>Safari</li>
                                        <li>Mobile responsive</li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <h6>Future Enhancements</h6>
                                    <ul>
                                        <li>Backend API integration</li>
                                        <li>User authentication</li>
                                        <li>Role-based access</li>
                                        <li>Power BI integration</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contact -->
                    <div class="card mb-4 border-primary">
                        <div class="card-body text-center">
                            <h5><i class="bi bi-envelope me-2"></i>Questions or Feedback?</h5>
                            <p>This is a demonstration system. For production implementation, customization, or technical questions, please contact the development team.</p>
                            <p class="mb-0"><strong>Repository:</strong> <a href="https://github.com/3bsolutionsltd/-awyad-mes-demo" target="_blank">github.com/3bsolutionsltd/-awyad-mes-demo</a></p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}
