# G5 readiness record

## Implemented in the repository

- Public landing/pricing renders are cacheable; account personalization is isolated to `/api/account/state`.
- Announcement reads are cached, explicitly invalidated, layout-stable, and return a real 503 on dependency failure.
- Platform/admin queries and member hot paths are bounded; weekly activity no longer fans out by conversation.
- Account deletion and export are staged, resumable, expiring, ownership-checked jobs with automatic recovery.
- Edge request IDs, safe structured operational logs, dependency readiness, health, route error/loading/not-found states, feature kill switches, and a protected Operations view exist.
- CI covers deterministic install, lint, TypeScript, tests, coverage, accessibility, build, secret/dependency/license scans, and static performance budgets. Manual staging/production smoke workflows are non-mutating.
- Canonical URL use is centralized; social images, corrected icons, JSON-LD, robots, sitemap, and non-installable browser manifest are present.
- Supported Node/npm versions, safe clean/load/smoke scripts, migration guidance, SLO targets, and runbooks are documented.

## External evidence still required before claiming G5 complete

- Select logging/error/metrics/tracing providers after privacy review, wire paging, and capture a 30-day baseline.
- Configure preview deployments and synthetic isolated datasets in the hosting provider.
- Run mobile slow-network Web Vitals, screen-reader/keyboard checks, visual regression baselines, and large seeded platform/load tests in staging.
- Exercise rollback/restore and the six incident scenarios; retain dates, participants, findings, and follow-ups.
- Assign named on-call, billing, privacy, security, AI, and operations owners.
- Confirm one production domain, configure `NEXT_PUBLIC_APP_URL`, submit the sitemap, and monitor indexing.
- Finish generated Convex API migration, validators, semantic-token migration, and component visual-regression coverage in reviewed batches.
- Obtain customer evidence before exposing Team/enterprise pricing or organization data models.

Until those items and the earlier launch gates are evidenced, paid checkout must remain disabled by default.
