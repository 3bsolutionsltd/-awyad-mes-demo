# Microsoft 365 Authentication Implementation Plan (AWYAD MES)

## Objective
Implement Microsoft 365 sign-in (Microsoft Entra ID) for AWYAD MES while preserving current in-app role and permission authorization.

## Current State
- Identity: Local username/email + password login.
- Session model: App-issued JWT access token + DB-backed refresh token.
- Authorization: Role and permission checks in app/database.

## Target State
- Identity: Microsoft Entra ID (OIDC) for primary sign-in.
- Session model: Keep current app JWT and refresh-token architecture.
- Authorization: Keep current app roles/permissions unchanged.
- Transition: Hybrid mode first (local + Microsoft), then optional local-login deprecation.

## Guiding Architecture Decisions
1. Keep authorization ownership in AWYAD MES (do not move role logic to Entra groups in phase 1).
2. Use Entra for authentication only (identity proof + MFA + policy controls).
3. Mint internal app tokens after successful Entra callback to minimize API and frontend changes.
4. Support zero-downtime migration through phased rollout and feature flagging.

## Scope
### In Scope
- Microsoft login and callback flow.
- User account linking/provisioning by email.
- Internal token issuance after Microsoft login.
- Frontend login page update to add Microsoft sign-in option.
- Operational runbook, monitoring, rollback plan.

### Out of Scope (Phase 1)
- Full replacement of app authorization with Entra groups.
- B2C external user onboarding.
- Multi-tenant federation across unrelated organizations.

## Prerequisites
1. AWYAD Microsoft tenant admin access.
2. App registration in Entra ID (Tenant ID, Client ID, Client Secret).
3. Production and staging redirect URIs approved in Entra.
4. TLS/HTTPS enabled in all non-local environments.
5. Signed-off security baseline (MFA and Conditional Access policy).

## Implementation Phases

## Phase 0: Planning and Security Baseline (0.5-1 day)
### Tasks
1. Confirm tenant model: single-tenant recommended.
2. Approve login UX: button + optional local fallback during transition.
3. Define account-linking policy:
   - Primary key: email match.
   - Conflict policy: disabled users cannot auto-link.
4. Define break-glass local admin policy.

### Deliverables
- Security and architecture decision record.
- Approved tenant and account-linking policy.

## Phase 1: Entra App Registration and Environment Setup (0.5 day)
### Tasks
1. Create Entra app registration.
2. Configure redirect URIs for local/staging/prod.
3. Add required OIDC permissions (openid, profile, email).
4. Generate client secret with rotation date.
5. Add environment variables:
   - ENTRA_TENANT_ID
   - ENTRA_CLIENT_ID
   - ENTRA_CLIENT_SECRET
   - ENTRA_REDIRECT_URI
   - ENTRA_POST_LOGOUT_REDIRECT_URI

### Deliverables
- Verified app registration.
- Securely stored configuration values.

## Phase 2: Backend OIDC Flow (1-2 days)
### Tasks
1. Add OIDC client integration package.
2. Add endpoints:
   - GET /api/v1/auth/microsoft/start
   - GET /api/v1/auth/microsoft/callback
   - Optional GET /api/v1/auth/microsoft/logout
3. Implement state and nonce creation/validation.
4. Validate ID token claims (iss, aud, exp, tid, nonce).
5. Add tenant/domain guardrails.
6. On successful callback:
   - Resolve app user (find or create).
   - Load app roles/permissions.
   - Issue existing app access token and refresh token.
7. Add structured logging and error handling.

### Deliverables
- Working OIDC authentication endpoints.
- App token issuance integrated with existing middleware.

## Phase 3: Data Model and User Linking (0.5-1 day)
### Tasks
1. Add DB migration for identity source metadata in users table:
   - auth_provider
   - microsoft_oid
   - microsoft_tenant_id
   - last_microsoft_login_at (optional)
2. Add uniqueness/index strategy for microsoft_oid + microsoft_tenant_id.
3. Implement user-linking and auto-provisioning service:
   - Link existing user by email.
   - Create new user with default role if policy permits.
4. Audit trail for auto-link and first login events.

### Deliverables
- Applied migration and verified constraints.
- Deterministic account-linking behavior.

## Phase 4: Frontend Login Integration (0.5-1 day)
### Tasks
1. Add Continue with Microsoft button on login page.
2. Route click to backend start endpoint.
3. Handle callback completion and post-login redirect.
4. Preserve existing session checks and route guards.
5. Keep local login form visible under feature flag.

### Deliverables
- Login UI supports both methods in hybrid mode.
- No regression in current protected page access checks.

## Phase 5: Testing and Validation (1 day)
### Test Coverage
1. Unit tests:
   - Token claim validation.
   - Linking/provisioning decision paths.
2. Integration tests:
   - Start and callback happy path.
   - Invalid state/nonce.
   - Expired/invalid id_token.
   - Disabled user handling.
3. Regression tests:
   - Existing protected routes still require valid app JWT.
   - Existing role-based checks unchanged.
4. Manual UAT:
   - First-time Microsoft sign-in.
   - Existing user link by email.
   - Logout behavior.
   - Session expiration and refresh flow.

### Deliverables
- Test evidence report.
- UAT sign-off.

## Phase 6: Rollout and Cutover (0.5 day + monitoring)
### Tasks
1. Deploy to staging and run smoke tests.
2. Enable in production behind feature flag for pilot users.
3. Monitor auth success/failure and callback errors.
4. Expand rollout to all users.
5. Decide date to disable local login for non-admin users.

### Deliverables
- Controlled production rollout.
- Cutover decision record.

## Rollback Plan
1. Disable Microsoft login feature flag.
2. Keep existing local auth endpoints fully operational.
3. Revert login page to local-only option.
4. Retain DB schema changes (non-breaking).

## Security Controls Checklist
- Enforce HTTPS in production.
- Validate state and nonce for every login transaction.
- Validate id_token signature and issuer/audience/tenant.
- Keep refresh token cookie as httpOnly, secure, sameSite.
- Restrict accepted tenant to AWYAD tenant.
- Keep rate limiting on local endpoints during transition.
- Configure Entra MFA and conditional access policies.

## Operational Monitoring
Track these metrics from day 1:
1. Microsoft login success rate.
2. Callback failure rate by reason (state mismatch, invalid token, tenant mismatch).
3. Account-link failures.
4. Token refresh failure rate.
5. Time to authenticate p95.

## Estimated Timeline
- Minimum: 4 working days.
- Typical: 5-6 working days including UAT and staged rollout.

## Ownership Matrix
- Engineering: backend OIDC flow, frontend integration, migrations, tests.
- IT/Security: Entra app registration, conditional access, MFA policy.
- Product/Operations: communication plan and cutover approvals.

## Success Criteria
1. AWYAD users authenticate with Microsoft 365 accounts.
2. Existing API authorization behavior remains unchanged.
3. No critical auth regressions during rollout window.
4. Local login can be safely decommissioned for standard users after stabilization.

## Post-Implementation Enhancements (Optional)
1. Map Entra groups to application roles.
2. SCIM provisioning for automated lifecycle management.
3. Centralized SSO audit dashboard.
4. Decommission local password reset for migrated users.
