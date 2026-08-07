# Privileged-audit operations

Application audit events are append-only through the exposed Convex functions and use an `admin:audit-read` identity distinct from ordinary support access. Sensitive reads record actor, role, reason, ticket, target, request ID, result, and time.

Production must add an external retention-locked copy. Export at least every five minutes using a dedicated security service identity, verify continuity/counts, encrypt in transit and at rest, and deny deletion to application and support principals. Alert if exports stop or sequence/count checks diverge.

Review schedule:

- Daily: export health and security alert delivery.
- Weekly: sensitive content reads and their linked tickets.
- Monthly: owner accounts, emergency access material, failed/blocked-login trends, exports, deletions, and access changes.
- Quarterly: every administrator role, proxy trust configuration, alert tests, and a sample restoration/query of archived events.

Retention duration and access must be approved by security, privacy, and counsel. Record reviewer, review time, evidence link, exceptions, remediation owner, and due date. Never place message bodies, passwords, tokens, TOTP seeds, full payment identifiers, or unnecessary personal data in audit summaries.
