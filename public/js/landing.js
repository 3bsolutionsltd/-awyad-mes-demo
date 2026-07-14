/**
 * Post-login landing page module.
 *
 * Provides a task-oriented home page that helps new users choose the
 * correct workflow before they start entering data.
 */

import { createPageHeader, createCard } from './components.js';
import { stateManager } from './stateManager.js';

const RECENT_NAVIGATION_KEY = 'awyad.navigation.recent';

export async function renderDashboard(contentArea) {
    const user = stateManager.getState().user || {};
    const userName = document.getElementById('user-display')?.textContent?.trim() || 'User';
    const roleContext = getRoleContext(user);
    const recentItems = getRecentItems();

    contentArea.innerHTML = `
        <div class="container-fluid landing-page">
            ${createPageHeader({
                title: 'Welcome to AWYAD MES',
                subtitle: 'Choose the right pathway, continue your work, and learn the system as you use it.',
                icon: 'house-heart',
                actions: [
                    { label: 'Help & Quick Reference', icon: 'question-circle', variant: 'outline-primary', onClick: "window.location.hash='help'" },
                    { label: 'Open Overview Dashboard', icon: 'speedometer2', variant: 'primary', onClick: "window.location.hash='overview-dashboard'" }
                ]
            })}

            <div class="card border-0 shadow-sm mb-4" style="background: linear-gradient(135deg, #0d6efd 0%, #0f766e 100%); color: #fff; overflow: hidden;">
                <div class="card-body p-4 p-lg-5">
                    <div class="row align-items-center g-4">
                        <div class="col-lg-8">
                            <div class="text-uppercase small fw-semibold opacity-75 mb-2">Start Here</div>
                            <h3 class="mb-3">Good to see you, ${escapeHtml(userName)}.</h3>
                            <p class="mb-2 fs-5">${escapeHtml(roleContext.heroMessage)}</p>
                            <div class="small mb-3 opacity-75">Role focus: <strong>${escapeHtml(roleContext.label)}</strong></div>
                            <div class="d-flex flex-wrap gap-2">
                                ${roleContext.primaryActions.map(action => `
                                    <a href="#${action.route}" class="btn ${action.variant} fw-semibold">${action.label}</a>
                                `).join('')}
                            </div>
                        </div>
                        <div class="col-lg-4">
                            <div class="bg-white bg-opacity-10 rounded-4 p-4 h-100">
                                <div class="small text-uppercase opacity-75 mb-2">Quick Rule</div>
                                <div class="fs-5 fw-semibold mb-2">Project-specific work</div>
                                <div class="mb-3">Start from <strong>Projects</strong> or <strong>Project Dashboard</strong>.</div>
                                <div class="fs-5 fw-semibold mb-2">AWYAD-wide work</div>
                                <div>Create indicators from <strong>ITT</strong>. Use <strong>Strategic Dashboard</strong> to review AWYAD-wide performance.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-xl-8">
                    ${createCard({
                        title: 'What Do You Want To Do Today?',
                        subtitle: 'Pick a task and go straight to the right place.',
                        headerClass: 'bg-light',
                        body: renderActionCards()
                    })}
                </div>
                <div class="col-xl-4">
                    ${createCard({
                        title: 'First-Time User Progress',
                        subtitle: 'A short checklist for learning the system by doing.',
                        headerClass: 'bg-light',
                        body: renderChecklist()
                    })}
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-lg-6">
                    ${createCard({
                        title: 'Recommended Pathways',
                        subtitle: 'Use these routes to keep indicators and activities in the correct context.',
                        headerClass: 'bg-info text-white',
                        body: renderPathways()
                    })}
                </div>
                <div class="col-lg-6">
                    ${createCard({
                        title: 'Recommended For You',
                        subtitle: `${roleContext.label}: ${roleContext.subtitle}`,
                        headerClass: 'bg-dark text-white',
                        body: renderRoleAwarePanel(roleContext)
                    })}
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-4">
                    ${createCard({
                        title: 'Recent Items',
                        subtitle: 'Jump back to the modules or project dashboards you used most recently.',
                        headerClass: 'bg-light',
                        body: renderRecentItems(recentItems)
                    })}
                </div>
                <div class="col-lg-4">
                    ${createCard({
                        title: 'Learn the System Yourself',
                        subtitle: 'Self-help links for guided exploration and quick recovery when you are unsure.',
                        headerClass: 'bg-warning',
                        body: renderSelfHelpLinks()
                    })}
                </div>
                <div class="col-lg-4">
                    ${createCard({
                        title: 'Continue Your Work',
                        subtitle: 'Common destinations after sign-in.',
                        headerClass: 'bg-success text-white',
                        body: renderContinueLinks()
                    })}
                </div>
            </div>
        </div>
    `;

    initializeLandingChecklist();
}

function renderActionCards() {
    const cards = [
        {
            title: 'Add AWYAD-Level Indicator',
            text: 'Use ITT, then click New Indicator and choose Organizational (AWYAD-level).',
            route: 'indicators',
            button: 'Open ITT',
            icon: 'building'
        },
        {
            title: 'Add Project Indicator or Activity',
            text: 'Use Projects and Project Dashboard when you are creating or managing project activities.',
            route: 'projects',
            button: 'Open Projects',
            icon: 'folder2-open'
        },
        {
            title: 'Report a Completed Activity',
            text: 'Use the Activity Report form only after an activity has been carried out and you need to submit full disaggregation and results.',
            route: 'entry-form',
            button: 'Open Activity Report Form',
            icon: 'clipboard2-plus'
        },
        {
            title: 'Review or Edit Indicators',
            text: 'Use ITT for direct indicator table review and updates across scopes.',
            route: 'indicators',
            button: 'Open ITT',
            icon: 'graph-up-arrow'
        },
        {
            title: 'Review or Edit Activities',
            text: 'Use ATT for direct activity updates and operational follow-up.',
            route: 'activities',
            button: 'Open ATT',
            icon: 'calendar2-check'
        },
        {
            title: 'Open Analytics Overview',
            text: 'Use the overview dashboard for KPIs, charts, and consolidated monitoring snapshots.',
            route: 'overview-dashboard',
            button: 'Open Overview Dashboard',
            icon: 'bar-chart-line'
        }
    ];

    return `
        <div class="row g-3">
            ${cards.map(card => `
                <div class="col-md-6">
                    <div class="border rounded-4 h-100 p-3 shadow-sm">
                        <div class="d-flex align-items-start gap-3">
                            <div class="rounded-circle bg-light text-primary d-inline-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
                                <i class="bi bi-${card.icon}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-2">${card.title}</h6>
                                <p class="text-muted small mb-3">${card.text}</p>
                                <a href="#${card.route}" class="btn btn-sm btn-outline-primary">${card.button}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderChecklist() {
    return `
        <div class="list-group mb-3">
            ${[
                ['landing-opened', 'Opened the home page and reviewed the pathway guide'],
                ['strategic-visited', 'Visited Strategic Dashboard'],
                ['project-visited', 'Opened Projects or a Project Dashboard'],
                ['indicator-created', 'Created or reviewed one indicator with the correct scope'],
                ['activity-entered', 'Entered or reviewed one activity']
            ].map(([key, label]) => `
                <label class="list-group-item d-flex align-items-start gap-2">
                    <input class="form-check-input mt-1 landing-check" type="checkbox" data-landing-check="${key}">
                    <span>${label}</span>
                </label>
            `).join('')}
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted" id="landingChecklistProgress">0/5 completed</small>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="resetLandingChecklistBtn">Reset</button>
        </div>
    `;
}

function renderPathways() {
    return `
        <div class="mb-3 p-3 bg-light rounded-4">
            <div class="fw-semibold mb-1">Project-specific workflow</div>
            <div class="small text-muted mb-2">Projects → Project Dashboard → Create / Manage Project Activities</div>
            <a href="#projects" class="btn btn-sm btn-outline-success">Start in Projects</a>
        </div>
        <div class="mb-3 p-3 bg-light rounded-4">
            <div class="fw-semibold mb-1">AWYAD-wide indicator workflow</div>
            <div class="small text-muted mb-2">Indicator Tracking (ITT) → New Indicator → Organizational (AWYAD-level)</div>
            <a href="#indicators" class="btn btn-sm btn-outline-primary">Start in ITT</a>
        </div>
        <div class="p-3 bg-light rounded-4">
            <div class="fw-semibold mb-1">Reporting workflow</div>
            <div class="small text-muted">Use the Activity Report form only to report activities that have already happened. Use ATT and Project Dashboard to create or manage activity records.</div>
        </div>
    `;
}

function renderRolePaths() {
    const roles = [
        ['M&E Officer', 'ITT → Strategic Dashboard → ATT'],
        ['Project Manager', 'Projects → Project Dashboard → ATT'],
        ['Data Entry User', 'Activity Report Form → ATT validation'],
        ['Administrator', 'Home → Help → Users / Permissions / Support Data']
    ];

    return `
        <div class="list-group list-group-flush">
            ${roles.map(([role, path]) => `
                <div class="list-group-item px-0">
                    <div class="fw-semibold">${role}</div>
                    <div class="small text-muted">${path}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSelfHelpLinks() {
    return `
        <div class="list-group mb-3">
            <a href="#help" class="list-group-item list-group-item-action">
                <strong>Help & Quick Reference</strong>
                <div class="small text-muted">Updated guidance for pathways, indicators, activities, and troubleshooting.</div>
            </a>
            <a href="../docs/UAT_GUIDE.md" target="_blank" class="list-group-item list-group-item-action">
                <strong>UAT Guide</strong>
                <div class="small text-muted">Testing scenarios and expected flows for user acceptance review.</div>
            </a>
            <a href="../docs/USER_MANUAL.md" target="_blank" class="list-group-item list-group-item-action">
                <strong>User Manual</strong>
                <div class="small text-muted">Longer-form operating guidance for the system.</div>
            </a>
        </div>
        <div class="alert alert-warning mb-0">
            <i class="bi bi-lightbulb"></i>
            If you are unsure where to start, open Help first, then come back here and choose a route.
        </div>
    `;
}

function renderContinueLinks() {
    return `
        <div class="d-grid gap-2">
            <a href="#projects" class="btn btn-outline-success text-start">Projects and Project Dashboards</a>
            <a href="#indicators" class="btn btn-outline-secondary text-start">Indicator Tracking Table (ITT)</a>
            <a href="#activities" class="btn btn-outline-secondary text-start">Activity Tracking Table (ATT)</a>
            <a href="#entry-form" class="btn btn-outline-secondary text-start">Activity Report Form for Completed Activities</a>
            <a href="#cases" class="btn btn-outline-secondary text-start">Case Management</a>
            <a href="#monthly" class="btn btn-outline-secondary text-start">Monthly Tracking</a>
        </div>
    `;
}

function initializeLandingChecklist() {
    const storageKey = 'awyad.landing.firstDayChecklist';
    const checks = Array.from(document.querySelectorAll('.landing-check'));
    const progressEl = document.getElementById('landingChecklistProgress');
    const resetBtn = document.getElementById('resetLandingChecklistBtn');

    if (!checks.length || !progressEl) {
        return;
    }

    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch {
        saved = {};
    }

    const updateProgress = () => {
        const completed = checks.filter(check => check.checked).length;
        progressEl.textContent = `${completed}/${checks.length} completed`;
    };

    const persist = () => {
        const state = {};
        checks.forEach(check => {
            state[check.dataset.landingCheck] = check.checked;
        });
        localStorage.setItem(storageKey, JSON.stringify(state));
    };

    checks.forEach(check => {
        const key = check.dataset.landingCheck;
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
            check.checked = Boolean(saved[key]);
        }

        check.addEventListener('change', () => {
            persist();
            updateProgress();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            checks.forEach(check => {
                check.checked = false;
            });
            persist();
            updateProgress();
        });
    }

    updateProgress();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderRoleAwarePanel(roleContext) {
    return `
        <div class="mb-3">
            <div class="fw-semibold mb-2">Priority route</div>
            <div class="small text-muted mb-3">${escapeHtml(roleContext.priorityRoute)}</div>
        </div>
        <div class="list-group list-group-flush mb-3">
            ${roleContext.recommendations.map(item => `
                <div class="list-group-item px-0">
                    <div class="fw-semibold">${escapeHtml(item.title)}</div>
                    <div class="small text-muted">${escapeHtml(item.text)}</div>
                </div>
            `).join('')}
        </div>
        <div class="border-top pt-3">
            <div class="small text-uppercase text-muted fw-semibold mb-2">Role-based quick starts</div>
            ${renderRolePaths()}
        </div>
    `;
}

function renderRecentItems(recentItems) {
    if (!recentItems.length) {
        return `
            <div class="text-muted small">
                No recent items yet. As you move through Projects, dashboards, ATT, and other modules, your recent items will appear here.
            </div>
        `;
    }

    return `
        <div class="list-group list-group-flush">
            ${recentItems.map(item => `
                <a href="#${item.href}" class="list-group-item list-group-item-action px-0">
                    <div class="fw-semibold">${escapeHtml(item.label)}</div>
                    <div class="small text-muted">Last opened ${escapeHtml(formatRecentTime(item.visitedAt))}</div>
                </a>
            `).join('')}
        </div>
    `;
}

function getRecentItems() {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_NAVIGATION_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
        return [];
    }
}

function getRoleContext(user) {
    const roleNames = normalizeRoleNames(user?.roles || []);
    const permissionNames = normalizePermissionNames(user?.permissions || []);

    const isAdmin = roleNames.some(name => name.includes('admin')) || permissionNames.includes('users.read');
    const isManager = roleNames.some(name => name.includes('manager')) || permissionNames.includes('projects.create') || permissionNames.includes('projects.update');
    const isDataEntry = roleNames.some(name => name.includes('field officer') || name.includes('data entry')) || (permissionNames.includes('activities.create') && !isManager);
    const isViewer = roleNames.some(name => name.includes('viewer')) || permissionNames.length === 0;

    if (isAdmin) {
        return {
            label: 'Administrator',
            subtitle: 'Oversee configuration, access, and system-wide workflows.',
            heroMessage: 'Use this home page to direct users correctly, review system activity, and move quickly between administration and reporting surfaces.',
            priorityRoute: 'Home → Users / Permissions / Support Data, then Overview or Strategic dashboards as needed.',
            primaryActions: [
                { route: 'users', label: 'User Management', variant: 'btn-light text-primary' },
                { route: 'permissions', label: 'Permissions', variant: 'btn-outline-light' },
                { route: 'overview-dashboard', label: 'Overview Dashboard', variant: 'btn-outline-light' }
            ],
            recommendations: [
                { title: 'Review access first', text: 'Use User Management and Permissions for setup or troubleshooting.' },
                { title: 'Guide teams to correct pathways', text: 'Project activities belong in Projects, Project Dashboard, or ATT. The Activity Report form is for completed activities only.' },
                { title: 'Monitor system usage', text: 'Use Audit Logs, Sessions, and Help to support adoption.' }
            ]
        };
    }

    if (isManager) {
        return {
            label: 'Project Manager',
            subtitle: 'Coordinate project indicators, activities, and progress review.',
            heroMessage: 'Start from Projects so indicators and activities stay tied to the right project context.',
            priorityRoute: 'Projects → Project Dashboard → Indicators / Activities → ATT review.',
            primaryActions: [
                { route: 'projects', label: 'Open Projects', variant: 'btn-light text-primary' },
                { route: 'activities', label: 'Open ATT', variant: 'btn-outline-light' },
                { route: 'overview-dashboard', label: 'View Analytics', variant: 'btn-outline-light' }
            ],
            recommendations: [
                { title: 'Create project work from Projects', text: 'Use Project Dashboard for project-specific indicators and activities.' },
                { title: 'Use ATT for operational maintenance', text: 'Review, edit, and maintain activities in ATT after they are created.' },
                { title: 'Use the Activity Report form carefully', text: 'Only report activities that have already been carried out.' }
            ]
        };
    }

    if (isDataEntry) {
        return {
            label: 'Data Entry User',
            subtitle: 'Capture implemented work accurately and validate it in the tables.',
            heroMessage: 'Your main reporting path is the Activity Report form, followed by ATT review to confirm the entry is visible and complete.',
            priorityRoute: 'Activity Report Form → ATT validation → Help if data entry rules are unclear.',
            primaryActions: [
                { route: 'entry-form', label: 'Open Activity Report Form', variant: 'btn-light text-primary' },
                { route: 'activities', label: 'Open ATT', variant: 'btn-outline-light' },
                { route: 'help', label: 'Open Help', variant: 'btn-outline-light' }
            ],
            recommendations: [
                { title: 'Report completed activities only', text: 'Do not use the reporting form to create project activities.' },
                { title: 'Check ATT after submission', text: 'Confirm the record appears and the details are correct.' },
                { title: 'Use Help for pathway decisions', text: 'If unsure, check whether you should be in ATT, Projects, or the reporting form.' }
            ]
        };
    }

    if (isViewer) {
        return {
            label: 'Viewer',
            subtitle: 'Review dashboards, tables, and reports in read-only workflows.',
            heroMessage: 'Use the dashboards and tracking tables to review performance, then export what you need.',
            priorityRoute: 'Home → Overview Dashboard / Strategic Dashboard → ITT / ATT review.',
            primaryActions: [
                { route: 'overview-dashboard', label: 'Open Overview Dashboard', variant: 'btn-light text-primary' },
                { route: 'strategic-dashboard', label: 'Strategic Dashboard', variant: 'btn-outline-light' },
                { route: 'help', label: 'Open Help', variant: 'btn-outline-light' }
            ],
            recommendations: [
                { title: 'Use Home to choose the right review surface', text: 'Overview for analytics, Strategic for AWYAD framework, ATT and ITT for record review.' },
                { title: 'Export when needed', text: 'Use module exports for sharing and offline analysis.' },
                { title: 'Do not expect create actions', text: 'Read-only roles may not see create or edit controls.' }
            ]
        };
    }

    return {
        label: 'M&E Officer',
        subtitle: 'Monitor indicators, verify activity data, and keep reporting pathways clean.',
        heroMessage: 'Use this home page to decide whether the work belongs in ITT, Strategic Dashboard, Projects, ATT, or the Activity Report form.',
        priorityRoute: 'Use ITT to create AWYAD-level indicators, Strategic Dashboard to review AWYAD-wide performance, Projects for project work, and ATT for activity maintenance.',
        primaryActions: [
            { route: 'indicators', label: 'Open ITT', variant: 'btn-light text-primary' },
            { route: 'strategic-dashboard', label: 'Strategic Dashboard', variant: 'btn-outline-light' },
            { route: 'projects', label: 'Open Projects', variant: 'btn-outline-light' },
            { route: 'activities', label: 'Open ATT', variant: 'btn-outline-light' }
        ],
        recommendations: [
            { title: 'Separate organizational and project workflows', text: 'Create AWYAD-wide indicators in ITT. Use Strategic Dashboard to review AWYAD-wide performance. Project activities belong in Projects or ATT.' },
            { title: 'Validate through the tables', text: 'Use ITT and ATT to confirm records and performance after entry.' },
            { title: 'Reserve the reporting form for completed work', text: 'The Activity Report form is not the place to create project activities.' }
        ]
    };
}

function normalizeRoleNames(roles) {
    return roles.map(role => {
        if (typeof role === 'string') return role.toLowerCase();
        return String(role.display_name || role.name || '').toLowerCase();
    }).filter(Boolean);
}

function normalizePermissionNames(permissions) {
    return permissions.map(permission => {
        if (typeof permission === 'string') return permission;
        return permission.name || '';
    }).filter(Boolean);
}

function formatRecentTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'recently';
    }
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}