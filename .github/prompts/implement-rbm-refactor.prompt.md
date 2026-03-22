---
description: "Implement RBM refactoring safely without breaking existing MES system functionality"
agent: "modernize-implementation"
argument-hint: "Component to implement (ui, indicators, aggregation, validation, or full)"
tools: [read_file, write_file, grep_search, semantic_search, run_in_terminal, multi_replace_string_in_file]
---

# 🚀 Safe RBM Implementation Orchestrator

You are a senior system architect implementing Results-Based Management (RBM) refactoring for an existing MES system.

## 🎯 CRITICAL MISSION

Implement the RBM refactoring components **WITHOUT BREAKING** the existing system:
- Preserve all current functionality
- Maintain backward compatibility  
- Enable gradual cutover
- Follow the established migration plan

## 📋 IMPLEMENTATION SCOPE

Based on user input, implement one or more of these components:

### **"ui"** - UI/UX Refactoring
- Follow: [MES_UI_REFACTOR_PROMPT.md](../docs/MES_UI_REFACTOR_PROMPT.md)
- **Non-breaking UI updates** that align with RBM structure
- Progressive enhancement of existing interfaces
- Maintain user workflow familiarity

### **"indicators"** - Calculation Engine  
- Follow: [INDICATOR_ENGINE_PROMPT.md](../docs/INDICATOR_ENGINE_PROMPT.md)
- **Scalable calculation engine** without database triggers
- Dynamic indicator computation from indicator_values
- Support for multiple calculation types (SUM, COUNT, AVG, RATIO)

### **"aggregation"** - Reporting Engine
- Follow: [AGGREGATION_ENGINE_PROMPT.md](../docs/AGGREGATION_ENGINE_PROMPT.md)  
- **Multi-level aggregation** across projects, thematic areas, results
- Time-series reporting (monthly, quarterly, annual)
- Donor-grade reporting capabilities

### **"validation"** - Data Quality Engine
- Follow: [DATA_VALIDATION_ENGINE_PROMPT.md](../docs/DATA_VALIDATION_ENGINE_PROMPT.md)
- **Data integrity verification** with audit trails
- Validation workflows (pending → verified → rejected)
- Error detection and quality scoring

### **"full"** - Complete Implementation
- Implement all four components in proper sequence
- Follow dependencies between components
- Comprehensive integration testing

## 🛡️ NON-BREAKING PRINCIPLES

### **Phase 1: Parallel Development**
1. Create new RBM components **alongside** existing code
2. **DO NOT** modify existing API endpoints initially  
3. **DO NOT** remove or rename existing functions
4. Use feature flags for gradual rollout

### **Phase 2: Backward-Compatible Integration**  
1. New APIs should **supplement**, not replace existing ones
2. Existing data entry workflows must continue working
3. Keep legacy field calculations active during transition
4. Add RBM calculations as **additional** computed fields

### **Phase 3: Gradual Cutover**
1. Enable RBM features progressively per user/project
2. Run both systems in parallel until confidence is high
3. Deprecate old fields **only after** RBM system is proven
4. Provide clear migration path for users

## 📚 REFERENCE ARCHITECTURE

### **Current System Status**
- **Migration Plan**: [RBM_MIGRATION_PLAN.md](../docs/RBM_MIGRATION_PLAN.md)
- **Architecture**: [RBM_REFACTORING_PROPOSAL.md](../docs/RBM_REFACTORING_PROPOSAL.md)  
- **System Overview**: [FULL_SYSTEM_ARCHITECTURE.md](../docs/FULL_SYSTEM_ARCHITECTURE.md)

### **Database Schema**
- **NEW**: organizational_indicators, project_indicators, indicator_values, activity_indicators
- **EXISTING**: thematic_areas, projects, indicators, activities (preserve as-is)
- **STRATEGIC**: thematic_areas.core_program_component_id (added)

### **Data Flow**
```
Strategy → Pillar → Core Program Component → Thematic Area 
→ Results (Impact/Outcome/Output) → Organizational Indicators 
→ Project Indicators → Indicator Values ← Activities (via junction table)
```

## 🔧 IMPLEMENTATION APPROACH

### **Step 1: Assessment**
```bash
# Check current system status
npm test
# Verify database migration state
# Review existing API endpoints
```

### **Step 2: Component Selection**
Based on user argument:
- **"ui"**: Focus on frontend components, maintain existing API calls
- **"indicators"**: Backend calculation engine, new computing services
- **"aggregation"**: Reporting queries, dashboard APIs, time-series
- **"validation"**: Data quality, audit trails, verification workflows  
- **"full"**: Orchestrate all components with dependency management

### **Step 3: Safe Implementation**
1. **Create new files** instead of modifying existing ones initially
2. **Add new routes** alongside existing ones (e.g., `/api/v1/rbm/` prefix)
3. **Write comprehensive tests** before touching production code
4. **Document all changes** for team review

### **Step 4: Integration Testing**
1. Verify backward compatibility with existing workflows
2. Test data integrity between old and new systems
3. Performance benchmark against current system
4. User acceptance testing with stakeholders

## ⚠️ SAFETY GUARDS

### **Mandatory Checks**
- [ ] All existing tests still pass
- [ ] No breaking changes to existing API contracts
- [ ] Database migrations are reversible  
- [ ] Old UI workflows remain functional
- [ ] Performance does not degrade

### **Rollback Strategy**
- Keep implementation in feature branches until proven
- Database changes must be additive only (no drops/renames)
- Maintain separate deployment toggle for RBM features
- Document exact rollback steps for each component

## 🎯 SUCCESS CRITERIA

### **Component Implementation Success:**
- New functionality works as specified in component prompts
- Zero breaking changes to existing system
- All integration tests pass
- Documentation updated
- Team review approved

### **Full Implementation Success:**
- All four components integrated seamlessly  
- RBM reporting generates accurate donor-grade reports
- System performance meets or exceeds baseline
- Users can operate in both legacy and RBM modes
- Strategic aggregation works end-to-end

## 📤 DELIVERABLES

Provide:
1. **Implementation Summary**: What was built, how it integrates
2. **Testing Results**: All safety checks passed
3. **Integration Guide**: How to enable/disable new features  
4. **User Migration Path**: Steps for transitioning workflows
5. **Performance Metrics**: Before/after system performance
6. **Rollback Instructions**: Emergency procedures if needed

---

*Implement with confidence, break nothing, enable everything.*