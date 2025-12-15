export const mockData = {
    thematicAreas: [
        {
            id: 'TA-001',
            code: 'RESULT 1',
            name: 'Women Economic Empowerment',
            description: 'Women and girls have increased economic opportunities and financial independence',
            indicators: ['IND-002', 'IND-006']
        },
        {
            id: 'TA-002',
            code: 'RESULT 2',
            name: 'GBV Response',
            description: 'GBV survivors receive quality, timely, and comprehensive response services',
            indicators: ['IND-001', 'IND-004', 'IND-007']
        },
        {
            id: 'TA-003',
            code: 'RESULT 3',
            name: 'Prevention and Advocacy',
            description: 'Local partners effectively respond to Child Protection risks and promote gender equality',
            indicators: ['IND-003', 'IND-005']
        }
    ],

    projects: [
        {
            id: 'PRJ-001',
            name: 'Women Empowerment and Protection Initiative',
            donor: 'UN Women',
            thematicAreaId: 'TA-002',
            status: 'Active',
            startDate: '2024-01-15',
            endDate: '2025-12-31',
            budget: 500000,
            expenditure: 312500,
            burnRate: 62.5,
            locations: ['Nakivale', 'Kampala']
        },
        {
            id: 'PRJ-002',
            name: 'Safe Spaces for Survivors Program',
            donor: 'UNFPA',
            thematicAreaId: 'TA-002',
            status: 'Active',
            startDate: '2024-03-01',
            endDate: '2026-02-28',
            budget: 350000,
            expenditure: 158200,
            burnRate: 45.2,
            locations: ['Nyakabande', 'Nakivale']
        },
        {
            id: 'PRJ-003',
            name: 'Economic Empowerment for Women',
            donor: 'European Union',
            thematicAreaId: 'TA-001',
            status: 'Completed',
            startDate: '2023-06-01',
            endDate: '2024-11-30',
            budget: 280000,
            expenditure: 276360,
            burnRate: 98.7,
            locations: ['Kampala', 'Nakivale']
        },
        {
            id: 'PRJ-004',
            name: 'Community Awareness and Advocacy',
            donor: 'USAID',
            thematicAreaId: 'TA-003',
            status: 'Active',
            startDate: '2024-09-01',
            endDate: '2026-08-31',
            budget: 420000,
            expenditure: 76860,
            burnRate: 18.3,
            locations: ['Nakivale', 'Nyakabande', 'Kampala']
        }
    ],
    
    indicators: [
        {
            id: 'IND-001',
            code: 'I.2.1.1',
            name: 'Number of GBV survivors receiving psychosocial support',
            projectId: 'PRJ-001',
            thematicAreaId: 'TA-002',
            type: 'Outcome',
            baseline: 45,
            baselineDate: '2024-01-01',
            lopTarget: 500,
            annualTarget: 400,
            q1Target: 100,
            q2Target: 100,
            q3Target: 100,
            q4Target: 100,
            achieved: 342,
            unit: 'Individuals'
        },
        {
            id: 'IND-002',
            code: 'I.1.3.2',
            name: 'Number of women trained in income-generating activities',
            projectId: 'PRJ-003',
            thematicAreaId: 'TA-001',
            type: 'Output',
            baseline: 0,
            baselineDate: '2023-06-01',
            lopTarget: 300,
            annualTarget: 300,
            q1Target: 75,
            q2Target: 75,
            q3Target: 75,
            q4Target: 75,
            achieved: 278,
            unit: 'Individuals'
        },
        {
            id: 'IND-003',
            code: 'I.3.2.1',
            name: 'Number of community awareness sessions conducted',
            projectId: 'PRJ-004',
            thematicAreaId: 'TA-003',
            type: 'Output',
            baseline: 10,
            baselineDate: '2024-09-01',
            lopTarget: 150,
            annualTarget: 60,
            q1Target: 15,
            q2Target: 15,
            q3Target: 15,
            q4Target: 15,
            achieved: 95,
            unit: 'Sessions'
        },
        {
            id: 'IND-004',
            code: 'I.2.4.3',
            name: 'Number of women accessing safe spaces',
            projectId: 'PRJ-002',
            thematicAreaId: 'TA-002',
            type: 'Output',
            baseline: 120,
            baselineDate: '2024-03-01',
            lopTarget: 800,
            annualTarget: 400,
            q1Target: 100,
            q2Target: 100,
            q3Target: 100,
            q4Target: 100,
            achieved: 612,
            unit: 'Individuals'
        },
        {
            id: 'IND-005',
            code: 'I.3.1.4',
            name: 'Number of local advocacy campaigns implemented',
            projectId: 'PRJ-004',
            thematicAreaId: 'TA-003',
            type: 'Output',
            baseline: 5,
            baselineDate: '2024-09-01',
            lopTarget: 25,
            annualTarget: 10,
            q1Target: 3,
            q2Target: 3,
            q3Target: 2,
            q4Target: 2,
            achieved: 18,
            unit: 'Campaigns'
        },
        {
            id: 'IND-006',
            code: 'I.1.2.1',
            name: 'Number of women-led businesses established',
            projectId: 'PRJ-003',
            thematicAreaId: 'TA-001',
            type: 'Outcome',
            baseline: 0,
            baselineDate: '2023-06-01',
            lopTarget: 50,
            annualTarget: 50,
            q1Target: 10,
            q2Target: 15,
            q3Target: 15,
            q4Target: 10,
            achieved: 42,
            unit: 'Businesses'
        },
        {
            id: 'IND-007',
            code: 'I.2.3.2',
            name: 'Number of GBV cases referred to service providers',
            projectId: 'PRJ-001',
            thematicAreaId: 'TA-002',
            type: 'Output',
            baseline: 25,
            baselineDate: '2024-01-01',
            lopTarget: 200,
            annualTarget: 150,
            q1Target: 40,
            q2Target: 40,
            q3Target: 35,
            q4Target: 35,
            achieved: 128,
            unit: 'Cases'
        }
    ],
    
    activities: [
        {
            id: 'ACT-001',
            activityCode: '3.2.1',
            name: 'Psychosocial Support Session - Al-Zahra Center',
            indicatorId: 'IND-001',
            projectId: 'PRJ-001',
            date: '2024-12-10',
            location: 'Nakivale',
            reportedBy: 'Sarah Ahmed',
            status: 'Completed',
            approvalStatus: 'Approved',
            budget: 5000,
            expenditure: 4850,
            beneficiaries: {
                maleRefugee: 12,
                femaleRefugee: 45,
                maleHost: 3,
                femaleHost: 8
            },
            disaggregation: {
                refugee: { male: { '0-4': 2, '5-17': 5, '18-49': 3, '50+': 2 }, female: { '0-4': 3, '5-17': 12, '18-49': 25, '50+': 5 } },
                host: { male: { '0-4': 0, '5-17': 1, '18-49': 2, '50+': 0 }, female: { '0-4': 1, '5-17': 2, '18-49': 4, '50+': 1 } }
            },
            nationality: {
                sudanese: 8,
                congolese: 25,
                southSudanese: 15,
                others: 9
            }
        },
        {
            id: 'ACT-002',
            activityCode: '3.2.4',
            name: 'Vocational Training Workshop - Sewing Skills',
            indicatorId: 'IND-002',
            projectId: 'PRJ-003',
            date: '2024-12-08',
            location: 'Kampala',
            reportedBy: 'Layla Hassan',
            status: 'Completed',
            approvalStatus: 'Approved',
            budget: 8000,
            expenditure: 7800,
            beneficiaries: {
                maleRefugee: 5,
                femaleRefugee: 32,
                maleHost: 2,
                femaleHost: 18
            },
            disaggregation: {
                refugee: { male: { '0-4': 0, '5-17': 0, '18-49': 4, '50+': 1 }, female: { '0-4': 0, '5-17': 8, '18-49': 22, '50+': 2 } },
                host: { male: { '0-4': 0, '5-17': 0, '18-49': 2, '50+': 0 }, female: { '0-4': 0, '5-17': 3, '18-49': 13, '50+': 2 } }
            },
            nationality: {
                sudanese: 5,
                congolese: 18,
                southSudanese: 10,
                others: 4
            }
        },
        {
            id: 'ACT-003',
            activityCode: '3.2.3',
            name: 'Community Dialogue on Gender Equality',
            indicatorId: 'IND-003',
            projectId: 'PRJ-004',
            date: '2024-12-12',
            location: 'Nyakabande',
            reportedBy: 'Mohammed Khalil',
            status: 'Completed',
            approvalStatus: 'Pending Review',
            budget: 3000,
            expenditure: 2950,
            beneficiaries: {
                maleRefugee: 28,
                femaleRefugee: 35,
                maleHost: 15,
                femaleHost: 22
            },
            disaggregation: {
                refugee: { male: { '0-4': 2, '5-17': 8, '18-49': 15, '50+': 3 }, female: { '0-4': 3, '5-17': 10, '18-49': 18, '50+': 4 } },
                host: { male: { '0-4': 1, '5-17': 5, '18-49': 8, '50+': 1 }, female: { '0-4': 2, '5-17': 7, '18-49': 11, '50+': 2 } }
            },
            nationality: {
                sudanese: 12,
                congolese: 28,
                southSudanese: 18,
                others: 5
            }
        },
        {
            id: 'ACT-004',
            activityCode: '3.2.7',
            name: 'Safe Space Monthly Activities Report',
            indicatorId: 'IND-004',
            projectId: 'PRJ-002',
            date: '2024-12-11',
            location: 'Nakivale',
            reportedBy: 'Fatima Ibrahim',
            status: 'Completed',
            approvalStatus: 'Approved',
            budget: 12000,
            expenditure: 11500,
            beneficiaries: {
                maleRefugee: 8,
                femaleRefugee: 125,
                maleHost: 5,
                femaleHost: 42
            },
            disaggregation: {
                refugee: { male: { '0-4': 1, '5-17': 3, '18-49': 3, '50+': 1 }, female: { '0-4': 5, '5-17': 35, '18-49': 75, '50+': 10 } },
                host: { male: { '0-4': 0, '5-17': 2, '18-49': 2, '50+': 1 }, female: { '0-4': 2, '5-17': 10, '18-49': 25, '50+': 5 } }
            },
            nationality: {
                sudanese: 18,
                congolese: 65,
                southSudanese: 42,
                others: 8
            }
        },
        {
            id: 'ACT-005',
            activityCode: '3.2.6',
            name: 'Youth Advocacy Campaign - Social Media',
            indicatorId: 'IND-005',
            projectId: 'PRJ-004',
            date: '2024-12-13',
            location: 'Kampala',
            reportedBy: 'Ahmad Mustafa',
            status: 'Completed',
            approvalStatus: 'Pending Review',
            budget: 4500,
            expenditure: 4200,
            beneficiaries: {
                maleRefugee: 85,
                femaleRefugee: 95,
                maleHost: 120,
                femaleHost: 140
            },
            disaggregation: {
                refugee: { male: { '0-4': 0, '5-17': 45, '18-49': 38, '50+': 2 }, female: { '0-4': 0, '5-17': 50, '18-49': 42, '50+': 3 } },
                host: { male: { '0-4': 0, '5-17': 60, '18-49': 55, '50+': 5 }, female: { '0-4': 0, '5-17': 70, '18-49': 65, '50+': 5 } }
            },
            nationality: {
                sudanese: 45,
                congolese: 68,
                southSudanese: 52,
                others: 15
            }
        }
    ],

    caseManagement: [
        {
            id: 'CASE-001',
            caseId: 'GBV-2024-1234',
            projectId: 'PRJ-001',
            dateOpened: '2024-11-15',
            status: 'Active',
            caseType: 'GBV - Domestic Violence',
            location: 'Nakivale',
            beneficiaryAge: 28,
            beneficiaryGender: 'Female',
            nationality: 'South Sudanese',
            servicesProvided: ['Psychosocial Support', 'Legal Aid', 'Safe Shelter'],
            followUpDate: '2024-12-20',
            caseWorker: 'Sarah Ahmed'
        },
        {
            id: 'CASE-002',
            caseId: 'GBV-2024-1235',
            projectId: 'PRJ-002',
            dateOpened: '2024-12-01',
            status: 'Active',
            caseType: 'GBV - Sexual Assault',
            location: 'Nyakabande',
            beneficiaryAge: 22,
            beneficiaryGender: 'Female',
            nationality: 'Congolese',
            servicesProvided: ['Medical Care', 'Psychosocial Support'],
            followUpDate: '2024-12-18',
            caseWorker: 'Fatima Ibrahim'
        },
        {
            id: 'CASE-003',
            caseId: 'GBV-2024-1156',
            projectId: 'PRJ-001',
            dateOpened: '2024-10-20',
            dateClosed: '2024-12-10',
            status: 'Closed',
            caseType: 'GBV - Psychological Abuse',
            location: 'Kampala',
            beneficiaryAge: 35,
            beneficiaryGender: 'Female',
            nationality: 'Host (Ugandan)',
            servicesProvided: ['Psychosocial Support', 'Economic Empowerment'],
            caseWorker: 'Sarah Ahmed'
        }
    ],

    users: [
        { id: 'USER-001', name: 'Sarah Ahmed', role: 'Field Officer', location: 'Nakivale' },
        { id: 'USER-002', name: 'Layla Hassan', role: 'Field Officer', location: 'Kampala' },
        { id: 'USER-003', name: 'Mohammed Khalil', role: 'Field Officer', location: 'Nyakabande' },
        { id: 'USER-004', name: 'Fatima Ibrahim', role: 'M&E Officer', location: 'All' },
        { id: 'USER-005', name: 'Ahmad Mustafa', role: 'Program Manager', location: 'All' }
    ]
};
