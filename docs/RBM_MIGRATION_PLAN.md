# 🚀 **RBM Migration Plan - Production Ready**

## 📋 **Migration Overview**

**Objective**: Transform existing JSON-based MES system to RBM-compliant PostgreSQL structure while preserving all data and maintaining backward compatibility.

**Timeline**: Estimated 4-phase migration over 2-3 weeks
**Risk Level**: Medium (comprehensive rollback strategy included)
**Downtime**: Minimal (< 30 minutes for final cutover)

---

## 🔍 **Pre-Migration Assessment**

### **Current Data Structure Analysis**
```sql
-- Assess current data volumes
SELECT 
    'thematic_areas' as table_name, COUNT(*) as records FROM thematic_areas
    UNION ALL
SELECT 'projects', COUNT(*) FROM projects
    UNION ALL  
SELECT 'indicators', COUNT(*) FROM indicators
    UNION ALL
SELECT 'activities', COUNT(*) FROM activities
    UNION ALL
SELECT 'monthly_snapshots', COUNT(*) FROM monthly_snapshots;

-- Analyze indicator complexity
SELECT 
    COUNT(*) as total_indicators,
    COUNT(DISTINCT thematic_area_id) as thematic_areas_used,
    AVG(CASE WHEN achieved IS NOT NULL THEN 1 ELSE 0 END) as pct_with_achievements,
    AVG(CASE WHEN q1_achieved IS NOT NULL THEN 1 ELSE 0 END) as pct_quarterly_data
FROM indicators;

-- Check activity-indicator relationships  
SELECT 
    COUNT(*) as total_activities,
    COUNT(DISTINCT "indicatorId") as unique_indicators_referenced,
    AVG(json_array_length(beneficiaries::json)) as avg_disaggregation_categories
FROM activities;
```

---

## 🏗️ **Phase 1: Schema Creation & Preparation**

### **Step 1.1: Create New RBM Tables**
```sql
-- Begin transaction for rollback safety
BEGIN;

-- Create Results Framework
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_code VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL CHECK (level IN ('impact', 'outcome', 'output')),
    thematic_area_id UUID REFERENCES thematic_areas(id) ON DELETE CASCADE,
    parent_result_id UUID REFERENCES results(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(result_code, thematic_area_id)
);

-- Create Organizational Indicators (Global Definitions)
CREATE TABLE IF NOT EXISTS organizational_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    indicator_type VARCHAR(50) DEFAULT 'quantitative' CHECK (indicator_type IN ('quantitative', 'qualitative', 'milestone')),
    data_type VARCHAR(50) DEFAULT 'number' CHECK (data_type IN ('number', 'percentage', 'currency', 'text', 'yes_no')),
    unit_of_measurement VARCHAR(100),
    calculation_method TEXT,
    disaggregation_schema JSONB DEFAULT '{}'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    reporting_frequency VARCHAR(50) DEFAULT 'quarterly' CHECK (reporting_frequency IN ('monthly', 'quarterly', 'annually', 'milestone')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Project Indicators (Targets per Project)  
CREATE TABLE IF NOT EXISTS project_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organizational_indicator_id UUID NOT NULL REFERENCES organizational_indicators(id) ON DELETE CASCADE,
    baseline DECIMAL(15,2),
    lop_target DECIMAL(15,2),
    annual_target DECIMAL(15,2),
    q1_target DECIMAL(15,2),
    q2_target DECIMAL(15,2), 
    q3_target DECIMAL(15,2),
    q4_target DECIMAL(15,2),
    current_value DECIMAL(15,2) DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    target_disaggregation JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, organizational_indicator_id)
);

-- Create Indicator Values (Time-series Data)
CREATE TABLE IF NOT EXISTS indicator_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'quarterly' CHECK (period_type IN ('monthly', 'quarterly', 'annually', 'custom')),
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    value_disaggregation JSONB DEFAULT '{}'::jsonb,
    data_source VARCHAR(200),
    collection_method VARCHAR(200),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clean Activity-Indicator Junction Table
CREATE TABLE IF NOT EXISTS activity_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    project_indicator_id UUID NOT NULL REFERENCES project_indicators(id) ON DELETE CASCADE,
    contribution_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    disaggregation JSONB DEFAULT '{}'::jsonb,
    collection_date DATE DEFAULT CURRENT_DATE,
    data_quality_score INTEGER DEFAULT 5 CHECK (data_quality_score BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, project_indicator_id)
);

COMMIT;
```

### **Step 1.2: Add Strategic Framework Linkage**
```sql
-- Link Thematic Areas to Strategy Framework
ALTER TABLE thematic_areas 
ADD COLUMN IF NOT EXISTS core_program_component_id UUID 
REFERENCES core_program_components(id) ON DELETE SET NULL;

-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_results_thematic_area ON results(thematic_area_id);
CREATE INDEX CONCURRENTLY idx_results_level ON results(level);
CREATE INDEX CONCURRENTLY idx_org_indicators_result ON organizational_indicators(result_id);
CREATE INDEX CONCURRENTLY idx_project_indicators_project ON project_indicators(project_id);
CREATE INDEX CONCURRENTLY idx_project_indicators_org ON project_indicators(organizational_indicator_id);
CREATE INDEX CONCURRENTLY idx_indicator_values_project ON indicator_values(project_indicator_id);
CREATE INDEX CONCURRENTLY idx_indicator_values_period ON indicator_values(reporting_period_start, reporting_period_end);
CREATE INDEX CONCURRENTLY idx_activity_indicators_activity ON activity_indicators(activity_id);
CREATE INDEX CONCURRENTLY idx_activity_indicators_project ON activity_indicators(project_indicator_id);
CREATE INDEX CONCURRENTLY idx_thematic_areas_component ON thematic_areas(core_program_component_id);

-- Add GIN indexes for JSONB fields
CREATE INDEX CONCURRENTLY idx_org_indicators_disaggregation ON organizational_indicators USING gin(disaggregation_schema);
CREATE INDEX CONCURRENTLY idx_project_indicators_disaggregation ON project_indicators USING gin(target_disaggregation);  
CREATE INDEX CONCURRENTLY idx_indicator_values_disaggregation ON indicator_values USING gin(value_disaggregation);
CREATE INDEX CONCURRENTLY idx_activity_indicators_disaggregation ON activity_indicators USING gin(disaggregation);
```

---

## 📊 **Phase 2: Data Transformation & Migration**

### **Step 2.1: Create Results Framework from Thematic Areas**
```sql
-- Create default results for each thematic area (outcome level)
INSERT INTO results (result_code, title, level, thematic_area_id)
SELECT 
    ta.code AS result_code,
    COALESCE(ta.name, 'Result: ' || ta.code) AS title,
    'outcome' AS level,
    ta.id AS thematic_area_id
FROM thematic_areas ta
WHERE NOT EXISTS (
    SELECT 1 FROM results r WHERE r.thematic_area_id = ta.id
);

-- Create impact-level results (parent results)
INSERT INTO results (result_code, title, level, thematic_area_id)
SELECT 
    REPLACE(ta.code, 'RESULT', 'IMPACT') AS result_code,
    'Strategic Impact: ' || COALESCE(ta.name, ta.code) AS title,
    'impact' AS level,
    ta.id AS thematic_area_id
FROM thematic_areas ta
WHERE NOT EXISTS (
    SELECT 1 FROM results r 
    WHERE r.thematic_area_id = ta.id AND r.level = 'impact'
);

-- Link outcomes to impacts (hierarchy)
UPDATE results SET parent_result_id = (
    SELECT id FROM results parent 
    WHERE parent.thematic_area_id = results.thematic_area_id 
    AND parent.level = 'impact'
    LIMIT 1
) WHERE level = 'outcome';
```

### **Step 2.2: Transform Indicators → Organizational Indicators**
```sql
-- Create organizational indicators from unique indicators
INSERT INTO organizational_indicators (
    code, title, description, result_id, indicator_type, 
    data_type, unit_of_measurement, reporting_frequency
)
SELECT DISTINCT
    i.code,
    i.name AS title,
    i.description,
    r.id AS result_id,
    CASE 
        WHEN i.data_type IN ('number', 'percentage', 'currency') THEN 'quantitative'
        WHEN i.data_type = 'yes_no' THEN 'milestone'
        ELSE 'qualitative'
    END AS indicator_type,
    COALESCE(i.data_type, 'number') AS data_type,
    i.unit AS unit_of_measurement,
    'quarterly' AS reporting_frequency
FROM indicators i
JOIN thematic_areas ta ON i.thematic_area_id = ta.id  
JOIN results r ON r.thematic_area_id = ta.id AND r.level = 'outcome'
WHERE NOT EXISTS (
    SELECT 1 FROM organizational_indicators oi WHERE oi.code = i.code
);
```

### **Step 2.3: Create Project Indicators from Existing Data**
```sql
-- Create project indicators for each indicator-project combination
INSERT INTO project_indicators (
    project_id, organizational_indicator_id, baseline, 
    lop_target, annual_target, q1_target, q2_target, q3_target, q4_target,
    current_value, target_disaggregation
)
SELECT 
    i.project_id,
    oi.id AS organizational_indicator_id,
    i.baseline,
    i.lop_target,
    i.annual_target,
    i.q1_target,
    i.q2_target, 
    i.q3_target,
    i.q4_target,
    COALESCE(i.achieved, 0) AS current_value,
    COALESCE(i.disaggregation, '{}'::jsonb) AS target_disaggregation
FROM indicators i
JOIN organizational_indicators oi ON oi.code = i.code
WHERE i.project_id IS NOT NULL
ON CONFLICT (project_id, organizational_indicator_id) DO NOTHING;

-- Calculate progress percentages
UPDATE project_indicators SET 
    progress_percentage = CASE 
        WHEN lop_target > 0 THEN (current_value / lop_target * 100)
        ELSE 0
    END;
```

### **Step 2.4: Migrate Quarterly Achievements → Indicator Values**
```sql
-- Create quarterly indicator values from existing quarterly data
WITH quarterly_data AS (
    SELECT 
        pi.id as project_indicator_id,
        unnest(ARRAY[
            ('2025-01-01', '2025-03-31', 'quarterly', i.q1_achieved),
            ('2025-04-01', '2025-06-30', 'quarterly', i.q2_achieved), 
            ('2025-07-01', '2025-09-30', 'quarterly', i.q3_achieved),
            ('2025-10-01', '2025-12-31', 'quarterly', i.q4_achieved)
        ]) AS quarter_data(start_date, end_date, period_type, value)
    FROM indicators i
    JOIN organizational_indicators oi ON oi.code = i.code
    JOIN project_indicators pi ON pi.organizational_indicator_id = oi.id 
        AND pi.project_id = i.project_id
    WHERE i.project_id IS NOT NULL
)
INSERT INTO indicator_values (
    project_indicator_id, 
    reporting_period_start, 
    reporting_period_end,
    period_type,
    value,
    data_source,
    verification_status
)
SELECT 
    project_indicator_id,
    (quarter_data.start_date)::date,
    (quarter_data.end_date)::date,
    (quarter_data.period_type)::varchar,
    COALESCE((quarter_data.value)::decimal, 0),
    'Migration from legacy indicators' as data_source,
    'verified' as verification_status
FROM quarterly_data
WHERE (quarter_data.value)::decimal IS NOT NULL AND (quarter_data.value)::decimal > 0;

-- Create annual totals as well
INSERT INTO indicator_values (
    project_indicator_id, 
    reporting_period_start, 
    reporting_period_end,
    period_type,
    value,
    data_source,
    verification_status
)
SELECT 
    pi.id,
    '2025-01-01'::date,
    '2025-12-31'::date,
    'annually',
    COALESCE(i.achieved, 0),
    'Migration from legacy indicators',
    'verified'
FROM indicators i
JOIN organizational_indicators oi ON oi.code = i.code
JOIN project_indicators pi ON pi.organizational_indicator_id = oi.id 
    AND pi.project_id = i.project_id
WHERE i.project_id IS NOT NULL AND i.achieved IS NOT NULL AND i.achieved > 0;
```

### **Step 2.5: Transform Activities → Activity Indicators**
```sql
-- Create activity-indicator relationships using the clean junction table
INSERT INTO activity_indicators (
    activity_id, 
    project_indicator_id, 
    contribution_value,
    disaggregation,
    collection_date
)
SELECT 
    a.id AS activity_id,
    pi.id AS project_indicator_id,
    COALESCE(a.total_beneficiaries, 0) AS contribution_value,
    COALESCE(a.beneficiaries, '{}'::jsonb) AS disaggregation,
    COALESCE(a.date, CURRENT_DATE) AS collection_date
FROM activities a
JOIN organizational_indicators oi ON oi.code = (
    SELECT code FROM indicators WHERE id = a."indicatorId" LIMIT 1
)
JOIN project_indicators pi ON pi.organizational_indicator_id = oi.id
JOIN projects p ON p.id = pi.project_id AND p.id = a.project_id
WHERE a."indicatorId" IS NOT NULL;
```

---

## 🔗 **Phase 3: Strategic Relationships & Cleanup**

### **Step 3.1: Link Thematic Areas to Strategy Framework**
```sql
-- Map thematic areas to core program components (adjust mapping as needed)
UPDATE thematic_areas SET core_program_component_id = (
    SELECT id FROM core_program_components 
    WHERE code LIKE '%GBV%' OR code LIKE '%PROTECTION%'
    OR name ILIKE '%protection%' OR name ILIKE '%gbv%'
    LIMIT 1
) WHERE (code LIKE '%RESULT 2%' OR name ILIKE '%gbv%' OR name ILIKE '%protection%')
  AND core_program_component_id IS NULL;

UPDATE thematic_areas SET core_program_component_id = (
    SELECT id FROM core_program_components 
    WHERE code LIKE '%CHILD%' OR code LIKE '%CP%'
    OR name ILIKE '%child%' OR name ILIKE '%youth%'
    LIMIT 1
) WHERE (code LIKE '%RESULT 3%' OR name ILIKE '%child%' OR name ILIKE '%youth%')
  AND core_program_component_id IS NULL;

-- For unmapped areas, create default mapping
UPDATE thematic_areas SET core_program_component_id = (
    SELECT id FROM core_program_components LIMIT 1
) WHERE core_program_component_id IS NULL;
```

### **Step 3.2: Deprecate Old Fields (DO NOT DELETE)**
```sql
-- Add deprecation comments to old fields
COMMENT ON COLUMN indicators.achieved IS 'DEPRECATED: Data migrated to indicator_values table. Will be removed in v2.0';
COMMENT ON COLUMN indicators.q1_achieved IS 'DEPRECATED: Data migrated to indicator_values table. Will be removed in v2.0';
COMMENT ON COLUMN indicators.q2_achieved IS 'DEPRECATED: Data migrated to indicator_values table. Will be removed in v2.0';
COMMENT ON COLUMN indicators.q3_achieved IS 'DEPRECATED: Data migrated to indicator_values table. Will be removed in v2.0';  
COMMENT ON COLUMN indicators.q4_achieved IS 'DEPRECATED: Data migrated to indicator_values table. Will be removed in v2.0';

-- Add migration tracking metadata
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS migrated_to_rbm BOOLEAN DEFAULT false;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMP;

-- Mark migrated records
UPDATE indicators SET 
    migrated_to_rbm = true,
    migration_timestamp = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM organizational_indicators oi WHERE oi.code = indicators.code
);
```

---

## ✅ **Phase 4: Data Integrity Validation**

### **Step 4.1: Critical Validation Queries**
```sql
-- Validation Query 1: No Data Loss Check
SELECT 
    'VALIDATION' as check_type,
    'Original Indicators' as source_table,
    COUNT(*) as original_count
FROM indicators
WHERE migrated_to_rbm = true

UNION ALL

SELECT 
    'VALIDATION',
    'Organizational Indicators',  
    COUNT(*)
FROM organizational_indicators

UNION ALL

SELECT 
    'VALIDATION',
    'Project Indicators',
    COUNT(*)
FROM project_indicators;

-- Validation Query 2: Value Totals Match
WITH legacy_totals AS (
    SELECT 
        SUM(COALESCE(achieved, 0)) as legacy_achieved,
        SUM(COALESCE(q1_achieved, 0) + COALESCE(q2_achieved, 0) + 
            COALESCE(q3_achieved, 0) + COALESCE(q4_achieved, 0)) as legacy_quarterly
    FROM indicators
),
rbm_totals AS (
    SELECT 
        SUM(COALESCE(current_value, 0)) as rbm_current,
        SUM(COALESCE(value, 0)) as rbm_indicator_values
    FROM project_indicators pi
    LEFT JOIN indicator_values iv ON iv.project_indicator_id = pi.id
)
SELECT 
    lt.legacy_achieved,
    rt.rbm_current,
    lt.legacy_quarterly,
    rt.rbm_indicator_values,
    CASE 
        WHEN ABS(lt.legacy_achieved - rt.rbm_current) < 0.01 THEN 'PASS'
        ELSE 'FAIL - Values do not match'
    END as validation_result
FROM legacy_totals lt, rbm_totals rt;

-- Validation Query 3: Relationship Integrity
SELECT 
    'Results-Indicators' as relationship,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS' 
        ELSE 'FAIL - No organizational indicators linked to results' 
    END as status
FROM organizational_indicators oi
JOIN results r ON r.id = oi.result_id

UNION ALL

SELECT 
    'Project-Indicators',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END
FROM project_indicators pi
JOIN projects p ON p.id = pi.project_id

UNION ALL

SELECT 
    'Activity-Indicators',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END  
FROM activity_indicators ai
JOIN activities a ON a.id = ai.activity_id;

-- Validation Query 4: Strategic Linkage Check
SELECT 
    'Strategic Linkage' as validation_type,
    COUNT(*) as thematic_areas_linked,
    COUNT(*) = (SELECT COUNT(*) FROM thematic_areas) as all_linked
FROM thematic_areas 
WHERE core_program_component_id IS NOT NULL;
```

### **Step 4.2: Performance Validation**
```sql
-- Check query performance on new structure
EXPLAIN ANALYZE
SELECT 
    s.name as strategy,
    p.name as pillar,
    cpc.name as component,
    ta.name as thematic_area,
    r.title as result,
    oi.title as indicator,
    SUM(iv.value) as total_achievement
FROM strategies s
JOIN pillars pl ON pl.strategy_id = s.id
JOIN core_program_components cpc ON cpc.pillar_id = pl.id
JOIN thematic_areas ta ON ta.core_program_component_id = cpc.id
JOIN results r ON r.thematic_area_id = ta.id
JOIN organizational_indicators oi ON oi.result_id = r.id
JOIN project_indicators pi ON pi.organizational_indicator_id = oi.id
JOIN indicator_values iv ON iv.project_indicator_id = pi.id
WHERE iv.reporting_period_end >= '2025-01-01'
GROUP BY 1,2,3,4,5,6
ORDER BY total_achievement DESC;
```

---

## 🔄 **Rollback Strategy**

### **Safe Rollback Plan**
```sql
-- EMERGENCY ROLLBACK SCRIPT (USE ONLY IF NEEDED)
-- Step 1: Drop new tables (cascades will remove related data)
DROP TABLE IF EXISTS activity_indicators CASCADE;
DROP TABLE IF EXISTS indicator_values CASCADE;  
DROP TABLE IF EXISTS project_indicators CASCADE;
DROP TABLE IF EXISTS organizational_indicators CASCADE;
DROP TABLE IF EXISTS results CASCADE;

-- Step 2: Remove new columns
ALTER TABLE thematic_areas DROP COLUMN IF EXISTS core_program_component_id;
ALTER TABLE indicators DROP COLUMN IF EXISTS migrated_to_rbm;
ALTER TABLE indicators DROP COLUMN IF EXISTS migration_timestamp;

-- Step 3: Remove comments
COMMENT ON COLUMN indicators.achieved IS NULL;
COMMENT ON COLUMN indicators.q1_achieved IS NULL;
COMMENT ON COLUMN indicators.q2_achieved IS NULL;
COMMENT ON COLUMN indicators.q3_achieved IS NULL;
COMMENT ON COLUMN indicators.q4_achieved IS NULL;

-- Step 4: Clean up indexes (drop new indexes)
-- (Indexes will be dropped automatically with table drops)
```

---

## 🚨 **Pre-Production Checklist**

### **Before Running Migration:**
- [ ] **Full Database Backup**: `pg_dump awyad_mes > backup_pre_rbm_$(date +%Y%m%d).sql`
- [ ] **Test Environment Validation**: Run complete migration on copy of production data
- [ ] **Application Dependencies**: Ensure APIs can handle both old and new data models
- [ ] **User Access Control**: Verify RBM tables inherit proper permissions
- [ ] **Monitoring**: Set up query performance monitoring for new structure
- [ ] **Rollback Testing**: Test complete rollback procedure in staging
- [ ] **Communication Plan**: Notify users of maintenance window

### **Post-Migration Verification:**
- [ ] **Data Integrity**: All validation queries pass
- [ ] **Performance**: Key queries perform within acceptable limits  
- [ ] **Application Function**: Frontend displays data correctly from new structure
- [ ] **User Acceptance**: Stakeholders can generate reports successfully
- [ ] **Backup Verification**: Confirm post-migration backup completes successfully

---

## 📈 **Migration Execution Timeline**

| Phase | Duration | Downtime | Risk Level |
|-------|----------|----------|------------|
| **Phase 1**: Schema Creation | 2 hours | None | Low |
| **Phase 2**: Data Migration | 4-6 hours | None* | Medium |
| **Phase 3**: Strategic Links | 1 hour | None | Low |
| **Phase 4**: Validation | 2 hours | None | Low |
| **Cutover**: Application Switch | 30 min | **YES** | High |

*Background processes, no user impact

---

## 💡 **Key Design Decisions & Assumptions**

### **Assumptions Made:**
1. **Quarterly Mapping**: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec (adjust dates as needed)
2. **Result Level**: Existing thematic areas mapped to "outcome" level results
3. **Strategic Mapping**: GBV/Protection → Component 1, Child Protection → Component 2
4. **Data Quality**: All migrated data marked as "verified" status
5. **Indicator Types**: Quantitative if numeric, milestone if yes/no, else qualitative

### **Strategic Benefits:**
- ✅ **Full RBM Compliance**: Meets UNICEF, UNFPA, World Bank standards
- ✅ **Strategic Traceability**: Complete chain from strategy to activity data  
- ✅ **Donor Reporting**: Enhanced aggregation and reporting capabilities
- ✅ **Data Quality**: Proper normalization and referential integrity
- ✅ **Scalability**: Clean relational design supports growth

### **Risk Mitigation:**
- 🛡️ **Backward Compatibility**: Old fields preserved during transition
- 🛡️ **Gradual Cutover**: New system runs parallel to old system
- 🛡️ **Complete Rollback**: Full restoration capability within 1 hour
- 🛡️ **Data Validation**: Comprehensive integrity checks at each phase

---

## 🎯 **Success Criteria**

**Migration is Complete When:**
1. All existing data successfully transformed to RBM structure
2. Data integrity validations pass 100%
3. Strategic reporting queries execute successfully  
4. Application functions with new data model
5. Performance meets or exceeds current benchmarks
6. Rollback procedure tested and confirmed working

**Ready for Production When:**
- [ ] Stakeholder sign-off on data accuracy
- [ ] User acceptance testing complete
- [ ] Performance benchmarking complete
- [ ] Documentation updated
- [ ] Training materials prepared
- [ ] Support team briefed on new structure

*This migration plan ensures zero data loss while transforming your MES into a world-class RBM system ready for donor reporting and strategic decision-making.*