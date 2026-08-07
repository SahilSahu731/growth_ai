# Release process

## Environment separation

| Environment | Data | Credentials | Purpose | Promotion rule |
| --- | --- | --- | --- | --- |
| Development | Synthetic only | Developer-specific test credentials | Local implementation | Never promoted directly |
| Preview | Isolated synthetic database per branch or shared nonproduction fixture database | Preview-only credentials | Pull-request review | Destroy or expire after merge |
| Staging | Persistent synthetic/test-mode data | Staging-only credentials | Release candidate and provider lifecycle tests | Same commit promoted to production |
| Production | Real user data | Production-only least-privilege credentials | Customer traffic | Protected approval and release checklist |

No credential, webhook secret, OAuth client, model project, payment account mode, Convex deployment, email domain, analytics project, or backup bucket may be shared between production and a lower environment.

## Required checks

1. `npm ci`
2. `npm run security:scan`
3. `npm audit --omit=dev --audit-level=high`
4. `npm run verify`
5. `npm run build`
6. Environment-specific smoke and integration tests
7. Migration and rollback review
8. Privacy, accessibility, copy, entitlement, and telemetry review for changed behavior

## Release checklist

- [ ] Release owner is named in the release/PR.
- [ ] Exact commit SHA is approved and all required CI checks pass.
- [ ] Environment validation passes without printing values.
- [ ] Convex schema/function deployment is backward-compatible with the currently running web application.
- [ ] Data migration has a tested resume and recovery path.
- [ ] New functionality has a feature flag or a documented rollback method.
- [ ] Monitoring dashboards and alerts cover the changed critical path.
- [ ] User-facing, legal, support, and operational documentation is current.
- [ ] Staging smoke tests pass with synthetic/test-mode data.
- [ ] Production deployment records the commit SHA, deployment ID, schema version, operator, and time.
- [ ] Production smoke tests pass without mutating customer content.
- [ ] The rollback window closes only after error, latency, billing, auth, and AI metrics remain healthy.

## Rollback ownership

The person approving a release must name a release owner and rollback owner. For a one-person project both roles may be `@SahilSahu731`, but the release record must still state them explicitly. Do not assume an unavailable person owns rollback.

Rollback means redeploying the last known-good web commit and disabling new behavior through feature flags. Database schema removals and destructive migrations must never be the first step of a release because they may not be reversible by redeploying application code.

## Production deployment record

Copy this into the release entry:

```text
Release:
Commit SHA:
Web deployment ID:
Convex deployment/schema version:
Release owner:
Rollback owner:
Started at:
Completed at:
Smoke-test result:
Rollback deadline:
Known risks:
```
