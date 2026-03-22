/**
 * Test Data Factory
 * Provides consistent mock data across test files.
 */

export const TEST_USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
export const TEST_PROJECT_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
export const TEST_ACTIVITY_ID = 'cccccccc-0000-0000-0000-000000000001';
export const TEST_INDICATOR_ID = 'dddddddd-0000-0000-0000-000000000001';
export const TEST_CASE_ID = 'eeeeeeee-0000-0000-0000-000000000001';
export const TEST_THEMATIC_AREA_ID = 'ffffffff-0000-0000-0000-000000000001';
export const TEST_STRATEGY_ID = '11111111-0000-0000-0000-000000000001';
export const TEST_SUBMISSION_ID = '22222222-0000-0000-0000-000000000001';

export const mockUser = () => ({
    id: TEST_USER_ID,
    email: 'admin@awyad.org',
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    roles: [{ id: '1', name: 'admin', display_name: 'Administrator' }],
    permissions: [{ name: 'projects.read' }, { name: 'activities.read' }],
});

export const mockProject = (overrides = {}) => ({
    id: TEST_PROJECT_ID,
    name: 'Test Project',
    donor: 'UNHCR',
    description: 'A test project',
    thematic_area_id: TEST_THEMATIC_AREA_ID,
    thematic_area_name: 'Protection',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    budget: 100000,
    expenditure: 25000,
    status: 'Active',
    currency: 'USD',
    created_at: '2025-01-01T00:00:00Z',
    created_by_username: 'admin',
    ...overrides,
});

export const mockActivity = (overrides = {}) => ({
    id: TEST_ACTIVITY_ID,
    project_id: TEST_PROJECT_ID,
    indicator_id: TEST_INDICATOR_ID,
    activity_name: 'Community Training',
    status: 'Planned',
    planned_date: '2025-06-01',
    completion_date: null,
    location: 'Kampala',
    latitude: null,
    longitude: null,
    beneficiary_id: null,
    total_beneficiaries: 50,
    budget: 5000,
    actual_cost: 0,
    currency: 'USD',
    is_locked: false,
    locked_by: null,
    locked_at: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

export const mockIndicator = (overrides = {}) => ({
    id: TEST_INDICATOR_ID,
    indicator_scope: 'project',
    name: 'Number of people trained',
    indicator_level: 'Output',
    data_type: 'Number',
    project_id: TEST_PROJECT_ID,
    lop_target: 500,
    annual_target: 200,
    achieved: 75,
    baseline: 0,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

export const mockCase = (overrides = {}) => ({
    id: TEST_CASE_ID,
    case_number: 'CASE-2025-001',
    project_id: TEST_PROJECT_ID,
    client_identifier: 'CLI-001',
    client_age: 25,
    client_gender: 'Female',
    case_type_id: 'tttttttt-0000-0000-0000-000000000001',
    status: 'Open',
    priority: 'Medium',
    date_reported: '2025-01-15',
    created_at: '2025-01-15T00:00:00Z',
    ...overrides,
});

export const mockKoboSubmission = (overrides = {}) => ({
    id: TEST_SUBMISSION_ID,
    form_id: 'test_form_123',
    submission_uuid: 'uuid-sub-001',
    status: 'pending',
    payload: { _uuid: 'uuid-sub-001', _xform_id_string: 'test_form_123' },
    received_at: '2025-01-01T00:00:00Z',
    mapped_to: null,
    mapped_activity_name: null,
    ...overrides,
});

/** Returns a pg-style result object for databaseService.query() mocks */
export const pgResult = (rows) => ({ rows, rowCount: rows.length });
