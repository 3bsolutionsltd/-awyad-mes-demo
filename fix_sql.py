import re

# Read the SQL file
with open('database/populate_strategic_data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Function to convert PostgreSQL ARRAY to JSONB string
def array_to_jsonb(match):
    array_content = match.group(1)
    # Split by ', ' but be careful with apostrophes inside strings
    items = re.findall(r"'([^']*)'", array_content)
    # Convert to JSON array
    json_items = '", "'.join(items)
    return f"'[\"{json_items}\"]'::jsonb"

# Replace intervention_areas with interventions
content = content.replace('intervention_areas', 'interventions')

# Convert ARRAY['item1', 'item2'] to '["item1", "item2"]'::jsonb
content = re.sub(r"ARRAY\[((?:'[^']*',?\s*)+)\]", array_to_jsonb, content)

# Write the fixed file
with open('database/populate_strategic_data_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SQL file created: database/populate_strategic_data_fixed.sql")
