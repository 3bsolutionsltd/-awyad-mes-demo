# AGENTS.md - Multi-Agent System for AWYAD MES Deployment

## Overview
This directory contains specialized agents designed to work in parallel to prepare the AWYAD MES system for production deployment.

## Available Agents

### 1. Navigation Validator (`@navigation-validator`)
**Purpose**: Find and fix all broken navigation links
**Focus**: UI links, buttons, breadcrumbs, menu items
**Output**: `NAVIGATION_VALIDATION_REPORT.md`

### 2. API Routes Validator (`@api-validator`)
**Purpose**: Verify all backend API endpoints are working
**Focus**: Route definitions, middleware, endpoint accessibility
**Output**: `API_VALIDATION_REPORT.md`

### 3. Frontend Integration Validator (`@frontend-integration`)
**Purpose**: Ensure frontend properly connects to backend API
**Focus**: API calls, data flow, error handling, loading states
**Output**: `FRONTEND_INTEGRATION_REPORT.md`

### 4. Database Validator (`@database-validator`)
**Purpose**: Verify PostgreSQL database is production-ready
**Focus**: Connection, schema, data integrity, migrations
**Output**: `DATABASE_VALIDATION_REPORT.md`

### 5. Deployment Orchestrator (`@deployment-orchestrator`)
**Purpose**: Coordinate all validation results and create deployment plan
**Focus**: Integration of all reports, risk assessment, runbook creation
**Output**: `DEPLOYMENT_READINESS_REPORT.md`

## How to Use These Agents

### Sequential Approach (Recommended for First Run)
Run agents in this order:
1. Database Validator (ensures data layer is ready)
2. API Routes Validator (ensures backend is functional)
3. Frontend Integration Validator (ensures UI connects to backend)
4. Navigation Validator (ensures all UI links work)
5. Deployment Orchestrator (synthesizes all findings)

**Commands:**
```
@database-validator Please validate the database connection and schema
@api-validator Please validate all API routes and endpoints
@frontend-integration Please check all frontend-backend integration
@navigation-validator Please find and document all broken links
@deployment-orchestrator Please create the deployment readiness report
```

### Parallel Approach (Faster, for experienced users)
Run multiple agents simultaneously in different conversations:
- Terminal 1: `@database-validator run full validation`
- Terminal 2: `@api-validator run full validation`
- Terminal 3: `@frontend-integration run full validation`
- Terminal 4: `@navigation-validator run full validation`
- Wait for all to complete, then:
- Terminal 5: `@deployment-orchestrator compile all reports and create deployment plan`

## Agent Capabilities

Each agent can:
- ✅ Read and analyze code
- ✅ Run tests and validations
- ✅ Identify issues and bugs
- ✅ Generate reports
- ✅ Suggest fixes
- ✅ Create code patches
- ✅ Document findings

## Expected Timeline

| Agent | Estimated Duration | Priority |
|-------|-------------------|----------|
| Database Validator | 15-20 min | Critical |
| API Routes Validator | 20-30 min | Critical |
| Frontend Integration | 30-45 min | Critical |
| Navigation Validator | 20-30 min | High |
| Deployment Orchestrator | 30-45 min | Critical |
| **Total** | **~2-3 hours** | - |

## Integration with Deployment Timeline

### Today (March 14, 2026) - Preparation
- **Now - 2 hours**: Run all validation agents
- **Next 2-4 hours**: Fix critical and high-priority issues
- **Evening**: Final integration testing
- **Before EOD**: Deployment runbook ready

### Tomorrow (March 15, 2026) - Deployment Day
- **Morning (8-10 AM)**: Final smoke tests
- **Mid-morning (10-11 AM)**: Database backup & migrations
- **Noon (11-12 PM)**: Application deployment
- **Afternoon (12-2 PM)**: Post-deployment testing
- **Late afternoon (2-4 PM)**: Monitoring and stabilization

## Critical Success Factors

1. **All agents must complete successfully** before deployment
2. **All CRITICAL blockers must be fixed**
3. **Deployment runbook must be reviewed** by team
4. **Rollback plan must be tested**
5. **Monitoring must be in place**

## Emergency Contacts & Escalation

If any agent identifies a critical blocker:
1. Immediately flag in the report
2. Assess impact on deployment timeline
3. Determine if issue is Go/No-Go
4. Document required fix
5. Escalate to deployment orchestrator

## Post-Agent Checklist

After all agents complete:
- [ ] Review all 5 validation reports
- [ ] Triage and prioritize all issues
- [ ] Assign fixes to team members
- [ ] Create fix tracking board
- [ ] Update deployment timeline
- [ ] Conduct team sync meeting
- [ ] Make Go/No-Go decision

## Notes

- Each agent is autonomous and specialized
- Agents can be run in any order (except orchestrator, which should run last)
- Reports are self-contained and can be reviewed independently
- All agents use the same codebase and documentation
- Agents will NOT make changes without explicit permission
- See individual `.agent.md` files for detailed agent specifications
