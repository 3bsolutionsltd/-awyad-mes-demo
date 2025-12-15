import csv
import json
import re
from collections import defaultdict

# Parse Summary Dashboard
def parse_summary_dashboard():
    thematic_areas = []
    indicators = []
    activities = []
    
    current_result = None
    current_indicator = None
    
    with open('AWYAD - STEPS - RESULTS BASED FRAMEWORK - Summary Dashboard.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        ta_counter = 1
        ind_counter = 1
        act_counter = 1
        
        for row in reader:
            if not row[0]:
                continue
                
            # Check if it's a RESULT (Thematic Area)
            if row[0].startswith('RESULT'):
                result_match = re.match(r'RESULT (\d+):(.*)', row[0])
                if result_match:
                    result_num = result_match.group(1)
                    description = result_match.group(2).strip()
                    current_result = {
                        'id': f'TA-{ta_counter:03d}',
                        'code': f'RESULT {result_num}',
                        'name': description[:50] + '...' if len(description) > 50 else description,
                        'description': description,
                        'indicators': []
                    }
                    thematic_areas.append(current_result)
                    ta_counter += 1
                    current_indicator = None
            
            # Check if it's an Indicator
            elif row[0].startswith('Indicator'):
                if current_result:
                    indicator_text = row[0].replace('\n', ' ').strip()
                    current_indicator = {
                        'id': f'IND-{ind_counter:03d}',
                        'code': f'I.{current_result["code"][-1]}.{len(current_result["indicators"])+1}',
                        'name': indicator_text,
                        'thematicAreaId': current_result['id'],
                        'type': 'Outcome',
                        'baseline': 0,
                        'baselineDate': '2024-01-01'
                    }
                    
                    # Try to parse targets from the row
                    try:
                        target_val = row[2].replace(',', '') if row[2] else '0'
                        achieved_val = row[3].replace(',', '') if row[3] and row[3] != '#ERROR!' else '0'
                        current_indicator['lopTarget'] = int(target_val) if target_val.isdigit() else 0
                        current_indicator['achieved'] = int(achieved_val) if achieved_val.isdigit() else 0
                        current_indicator['annualTarget'] = current_indicator['lopTarget']
                        current_indicator['unit'] = 'Individuals'
                        
                        # Divide targets into quarters
                        quarter_target = current_indicator['lopTarget'] // 4
                        current_indicator['q1Target'] = quarter_target
                        current_indicator['q2Target'] = quarter_target
                        current_indicator['q3Target'] = quarter_target
                        current_indicator['q4Target'] = quarter_target
                    except:
                        current_indicator['lopTarget'] = 0
                        current_indicator['achieved'] = 0
                        current_indicator['annualTarget'] = 0
                        current_indicator['q1Target'] = 0
                        current_indicator['q2Target'] = 0
                        current_indicator['q3Target'] = 0
                        current_indicator['q4Target'] = 0
                        current_indicator['unit'] = 'Individuals'
                    
                    indicators.append(current_indicator)
                    current_result['indicators'].append(current_indicator['id'])
                    ind_counter += 1
            
            # Check if it's an Activity (has activity name in column 1)
            elif row[1] and current_indicator and not row[0].startswith('RESULT'):
                activity_name = row[1].strip()
                if activity_name and len(activity_name) > 5:  # Filter out empty/short entries
                    activity = {
                        'id': f'ACT-{act_counter:03d}',
                        'activityCode': '',
                        'name': activity_name,
                        'indicatorId': current_indicator['id'],
                        'date': '2025-01-15',
                        'location': 'Multiple Locations',
                        'status': 'Completed' if row[3] and row[3] != '#ERROR!' else 'Pending',
                        'reportedBy': 'System Import',
                        'approvalStatus': 'Approved',
                        'budget': 50000,
                        'expenditure': 35000
                    }
                    
                    # Try to parse target and achieved
                    try:
                        target_val = row[2].replace(',', '') if row[2] else '0'
                        achieved_val = row[3].replace(',', '') if row[3] and row[3] != '#ERROR!' else '0'
                        activity['target'] = int(target_val) if target_val.isdigit() else 0
                        activity['achieved'] = int(achieved_val) if achieved_val.isdigit() else 0
                    except:
                        activity['target'] = 0
                        activity['achieved'] = 0
                    
                    activities.append(activity)
                    act_counter += 1
    
    return thematic_areas, indicators, activities


# Parse Activity Tracking for detailed disaggregation
def parse_activity_tracking():
    activities_detail = []
    
    with open('Spotlight & GBV Mainstream Activity Tracking Table- AWYAD (1) - Activity Tracking Table - 2025.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header1 = next(reader)
        header2 = next(reader)
        header3 = next(reader)
        
        for row in reader:
            if len(row) < 10:
                continue
            
            # Look for activity code in first column
            activity_code = row[0].strip() if row[0] else ''
            activity_name = row[1].strip() if len(row) > 1 and row[1] else ''
            
            if activity_code and re.match(r'3\.\d+\.\d+', activity_code):
                # Parse disaggregation data (columns vary, but generally after activity name)
                activity = {
                    'activityCode': activity_code,
                    'name': activity_name,
                    'disaggregation': {
                        'refugee': {
                            'male': {'0-4': 0, '5-17': 0, '18-49': 0, '50+': 0},
                            'female': {'0-4': 0, '5-17': 0, '18-49': 0, '50+': 0}
                        },
                        'host': {
                            'male': {'0-4': 0, '5-17': 0, '18-49': 0, '50+': 0},
                            'female': {'0-4': 0, '5-17': 0, '18-49': 0, '50+': 0}
                        }
                    },
                    'nationality': {
                        'sudanese': 0,
                        'congolese': 0,
                        'southSudanese': 0,
                        'others': 0
                    }
                }
                
                # Try to parse totals from later columns
                try:
                    # Look for total columns (varies by structure)
                    for i in range(2, min(len(row), 50)):
                        val = row[i].replace(',', '') if row[i] else '0'
                        if val.isdigit():
                            num = int(val)
                            # Distribute across age groups for demo purposes
                            if num > 0:
                                activity['disaggregation']['refugee']['female']['18-49'] = num // 4
                                activity['disaggregation']['refugee']['male']['18-49'] = num // 4
                                activity['disaggregation']['host']['female']['18-49'] = num // 4
                                activity['disaggregation']['host']['male']['18-49'] = num // 4
                                break
                except:
                    pass
                
                activities_detail.append(activity)
    
    return activities_detail


# Main execution
print("Parsing Summary Dashboard...")
thematic_areas, indicators, activities = parse_summary_dashboard()

print("Parsing Activity Tracking...")
activities_detail = parse_activity_tracking()

# Merge activity details with activities from summary
activity_code_map = {a['activityCode']: a for a in activities_detail if 'activityCode' in a}

for i, activity in enumerate(activities):
    # Assign activity code from detail if available
    if i < len(activities_detail) and activities_detail[i].get('activityCode'):
        activity['activityCode'] = activities_detail[i]['activityCode']
        activity['disaggregation'] = activities_detail[i]['disaggregation']
        activity['nationality'] = activities_detail[i]['nationality']
    else:
        # Generate default disaggregation
        activity['activityCode'] = f'3.2.{i+1}'
        activity['disaggregation'] = {
            'refugee': {
                'male': {'0-4': 5, '5-17': 10, '18-49': 20, '50+': 5},
                'female': {'0-4': 5, '5-17': 15, '18-49': 25, '50+': 5}
            },
            'host': {
                'male': {'0-4': 3, '5-17': 8, '18-49': 15, '50+': 4},
                'female': {'0-4': 3, '5-17': 10, '18-49': 18, '50+': 4}
            }
        }
        activity['nationality'] = {
            'sudanese': 15,
            'congolese': 10,
            'southSudanese': 8,
            'others': 7
        }
    
    # Calculate beneficiaries from disaggregation
    d = activity['disaggregation']
    activity['beneficiaries'] = {
        'maleRefugee': sum(d['refugee']['male'].values()),
        'femaleRefugee': sum(d['refugee']['female'].values()),
        'maleHost': sum(d['host']['male'].values()),
        'femaleHost': sum(d['host']['female'].values())
    }

# Create projects (extracted from thematic areas)
projects = [
    {
        'id': 'PRJ-001',
        'name': 'GBV Response and Protection',
        'donor': 'UNFPA',
        'thematicAreaId': thematic_areas[0]['id'] if len(thematic_areas) > 0 else 'TA-001',
        'status': 'Active',
        'startDate': '2024-01-15',
        'endDate': '2025-12-31',
        'budget': 500000,
        'expenditure': 312500,
        'burnRate': 62.5,
        'locations': ['Nakivale', 'Kampala', 'Nyakabande']
    },
    {
        'id': 'PRJ-002',
        'name': 'Child Protection Program',
        'donor': 'UNICEF',
        'thematicAreaId': thematic_areas[1]['id'] if len(thematic_areas) > 1 else 'TA-002',
        'status': 'Active',
        'startDate': '2024-03-01',
        'endDate': '2026-02-28',
        'budget': 420000,
        'expenditure': 158200,
        'burnRate': 37.7,
        'locations': ['Nakivale', 'Kampala']
    }
]

# Assign projectId to indicators
for indicator in indicators:
    indicator['projectId'] = 'PRJ-001' if 'GBV' in indicator['name'] or 'women' in indicator['name'].lower() else 'PRJ-002'

# Output results
output = {
    'thematicAreas': thematic_areas,
    'projects': projects,
    'indicators': indicators,
    'activities': activities[:20]  # Limit to first 20 activities
}

print(f"\nParsed:")
print(f"- {len(thematic_areas)} Thematic Areas")
print(f"- {len(projects)} Projects")
print(f"- {len(indicators)} Indicators")
print(f"- {len(activities)} Activities (showing first 20)")

# Write to JSON file
with open('parsed_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("\n✅ Data exported to parsed_data.json")
print("\nSample Thematic Area:")
print(json.dumps(thematic_areas[0] if thematic_areas else {}, indent=2))
print("\nSample Activity:")
print(json.dumps(activities[0] if activities else {}, indent=2))
