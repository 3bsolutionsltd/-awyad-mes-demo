import json

# Load parsed data
with open('parsed_data.json', 'r', encoding='utf-8') as f:
    parsed = json.load(f)

# Create activities from the activity tracking CSV data
# These activity codes were visible in the CSV
activities_from_csv = [
    {
        'id': 'ACT-001',
        'activityCode': '3.2.1',
        'name': 'Conduct SASA community Assessment to inform roll out of Support Phase',
        'indicatorId': 'IND-001',
        'projectId': 'PRJ-001',
        'target': 1,
        'achieved': 0
    },
    {
        'id': 'ACT-002',
        'activityCode': '3.2.3',
        'name': 'Support selected CSOs and community structures in implementing evidence-based SASA approach',
        'indicatorId': 'IND-002',
        'projectId': 'PRJ-001',
        'target': 50,
        'achieved': 480
    },
    {
        'id': 'ACT-003',
        'activityCode': '3.2.4',
        'name': 'Conduct social sensitization on positive masculinities and parenting',
        'indicatorId': 'IND-004',
        'projectId': 'PRJ-001',
        'target': 470,
        'achieved': 287
    },
    {
        'id': 'ACT-004',
        'activityCode': '3.2.5',
        'name': 'Engage and train refugee welfare committee members on GBV',
        'indicatorId': 'IND-002',
        'projectId': 'PRJ-001',
        'target': 201,
        'achieved': 58
    },
    {
        'id': 'ACT-005',
        'activityCode': '3.2.6',
        'name': 'Engage and train religious and cultural leaders on GBV prevention',
        'indicatorId': 'IND-004',
        'projectId': 'PRJ-001',
        'target': 50,
        'achieved': 53
    },
    {
        'id': 'ACT-006',
        'activityCode': '3.2.7',
        'name': 'Commemorate international events (IWD, World Refugee Day, 16 Days)',
        'indicatorId': 'IND-001',
        'projectId': 'PRJ-001',
        'target': 4,
        'achieved': 302
    },
    {
        'id': 'ACT-007',
        'activityCode': '3.2.8',
        'name': 'Strengthen community policing for women and girls safety',
        'indicatorId': 'IND-003',
        'projectId': 'PRJ-001',
        'target': 5,
        'achieved': 229
    },
    {
        'id': 'ACT-008',
        'activityCode': '3.3.1',
        'name': 'Support out-of-school girls with non-formal skills training',
        'indicatorId': 'IND-005',
        'projectId': 'PRJ-001',
        'target': 80,
        'achieved': 99
    },
    {
        'id': 'ACT-009',
        'activityCode': '4.1.1',
        'name': 'Support case management response interventions (PEP, case conferencing)',
        'indicatorId': 'IND-001',
        'projectId': 'PRJ-001',
        'target': 300,
        'achieved': 48
    },
    {
        'id': 'ACT-010',
        'activityCode': '4.1.5',
        'name': 'Provide multisectoral support to GBV survivors through referrals',
        'indicatorId': 'IND-003',
        'projectId': 'PRJ-001',
        'target': 300,
        'achieved': 51
    }
]

# Add remaining fields to activities
for activity in activities_from_csv:
    # Calculate percentages
    if activity['target'] > 0:
        achievement_rate = (activity['achieved'] / activity['target']) * 100
        activity['status'] = 'Completed' if achievement_rate >= 100 else 'In Progress' if achievement_rate >= 50 else 'Pending'
    else:
        activity['status'] = 'Pending'
        
    activity['date'] = '2025-01-15'
    activity['location'] = 'Nakivale, Kampala'
    activity['reportedBy'] = 'Field Officer'
    activity['approvalStatus'] = 'Approved' if activity['status'] == 'Completed' else 'Pending Review'
    activity['budget'] = activity['target'] * 100
    activity['expenditure'] = activity['achieved'] * 85
    
    # Add disaggregation based on achieved numbers
    total = activity['achieved']
    refugee_portion = int(total * 0.60)
    host_portion = int(total * 0.40)
    
    activity['disaggregation'] = {
        'refugee': {
            'male': {
                '0-4': int(refugee_portion * 0.10),
                '5-17': int(refugee_portion * 0.25),
                '18-49': int(refugee_portion * 0.50),
                '50+': int(refugee_portion * 0.15)
            },
            'female': {
                '0-4': int(refugee_portion * 0.10),
                '5-17': int(refugee_portion * 0.30),
                '18-49': int(refugee_portion * 0.45),
                '50+': int(refugee_portion * 0.15)
            }
        },
        'host': {
            'male': {
                '0-4': int(host_portion * 0.08),
                '5-17': int(host_portion * 0.22),
                '18-49': int(host_portion * 0.55),
                '50+': int(host_portion * 0.15)
            },
            'female': {
                '0-4': int(host_portion * 0.08),
                '5-17': int(host_portion * 0.25),
                '18-49': int(host_portion * 0.52),
                '50+': int(host_portion * 0.15)
            }
        }
    }
    
    # Calculate beneficiaries
    d = activity['disaggregation']
    male_refugee = sum(d['refugee']['male'].values())
    female_refugee = sum(d['refugee']['female'].values())
    male_host = sum(d['host']['male'].values())
    female_host = sum(d['host']['female'].values())
    
    activity['beneficiaries'] = {
        'maleRefugee': male_refugee,
        'femaleRefugee': female_refugee,
        'maleHost': male_host,
        'femaleHost': female_host
    }
    
    # Add nationality breakdown
    refugee_total = male_refugee + female_refugee
    activity['nationality'] = {
        'sudanese': int(refugee_total * 0.45),
        'congolese': int(refugee_total * 0.30),
        'southSudanese': int(refugee_total * 0.20),
        'others': int(refugee_total * 0.05)
    }

# Combine everything
output = {
    'thematicAreas': parsed['thematicAreas'],
    'projects': parsed['projects'],
    'indicators': parsed['indicators'],
    'activities': activities_from_csv,
    'caseManagement': [
        {
            'id': 'CASE-001',
            'caseNumber': 'GBV-NK-2025-001',
            'type': 'Sexual Assault',
            'projectId': 'PRJ-001',
            'dateReported': '2025-01-10',
            'followUpDate': '2025-02-15',
            'status': 'Active',
            'services': ['Psychosocial Support', 'Medical Care', 'Legal Aid']
        },
        {
            'id': 'CASE-002',
            'caseNumber': 'GBV-KLA-2025-002',
            'type': 'Domestic Violence',
            'projectId': 'PRJ-001',
            'dateReported': '2025-01-12',
            'closedDate': '2025-01-20',
            'status': 'Closed',
            'services': ['Psychosocial Support', 'Safety Planning']
        },
        {
            'id': 'CASE-003',
            'caseNumber': 'CP-NK-2025-003',
            'type': 'Child Protection',
            'projectId': 'PRJ-002',
            'dateReported': '2025-01-08',
            'followUpDate': '2025-02-10',
            'status': 'Active',
            'services': ['Case Management', 'Family Reunification']
        }
    ],
    'users': [
        {
            'id': 'USR-001',
            'name': 'Admin User',
            'role': 'Administrator',
            'email': 'admin@awyad.org'
        }
    ]
}

# Write to JavaScript file format
js_content = f"""export const mockData = {json.dumps(output, indent=4)};
"""

with open('mockData_new.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("✅ Complete mockData generated in mockData_new.js")
print(f"\nSummary:")
print(f"- {len(output['thematicAreas'])} Thematic Areas")
print(f"- {len(output['projects'])} Projects")  
print(f"- {len(output['indicators'])} Indicators")
print(f"- {len(output['activities'])} Activities with real data")
print(f"- {len(output['caseManagement'])} Cases")
