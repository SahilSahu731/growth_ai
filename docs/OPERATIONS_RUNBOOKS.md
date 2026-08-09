# Operations runbooks

## First response

1. Open `/admin/operations`, record the incident ID/time, affected subsystem, and safe job/event IDs.
2. Stop expansion with the narrowest kill switch: `GEMINI_DISABLED=1`, `BILLING_CHECKOUT_ENABLED=false`, `NOTIFICATIONS_ENABLED=false`, `ANNOUNCEMENTS_ENABLED=false`, or `MAJOR_EXPERIENCES_ENABLED=false`.
3. Do not replay a payment or privacy job until ownership, idempotency, and provider state are confirmed.
4. Preserve structured logs and audit entries; never paste customer content or secrets into the incident channel.
5. Escalate any cross-user access, message loss, billing overcharge, compromised administrator, or secret exposure as critical.

## Provider/model outage

Set `GEMINI_DISABLED=1`. The deterministic fallback remains available. Verify `/health`, `/api/ready`, a signed-in fallback turn, circuit status, and that no raw prompt was logged. Re-enable only after a canary and error-rate recovery.

## Database outage

Keep public pages available, disable checkout and large mutations, and confirm readiness returns 503 without dependency details. After recovery, inspect webhook, email, deletion, and export backlogs before reopening mutations.

## Billing drift or duplicate event

Disable new checkout if scope is unclear. Compare the signed provider event, stored subscription, and entitlement. Use the existing idempotent replay action only with a reason and provider event ID. Never grant access from a browser redirect.

## Stuck deletion/export

Automatic recovery scans every 15 minutes. A job is stale after 15 minutes without a heartbeat. Confirm it is failed/stale, inspect its stage/error code, then use the owner-only retry action with an incident reason. Jobs are bounded and idempotent. Export downloads require the signed-in owner plus the one-time random token and expire after 24 hours.

## Email outage

Set `NOTIFICATIONS_ENABLED=false` for optional summaries. Mandatory transactional messages remain queued/retried; if the provider is unsafe, remove its runtime credential and communicate through an approved channel. Review dead letters before resuming.

## Compromised administrator or leaked secret

Increment `ADMIN_SESSION_VERSION`, rotate the affected secret/provider credential, revoke sessions, preserve audit logs, and follow `SECURITY_INCIDENT_RESPONSE.md` plus `CREDENTIAL_ROTATION.md`. Review all sensitive reads and writes since the earliest possible compromise.

## Rollback and restore

Roll application code back only when the deployed schema remains forward-compatible. Convex schema/data changes are not automatically rolled back with code; follow `MIGRATIONS_AND_ROLLBACK.md`. Restoration must be rehearsed against isolated data before it is counted as launch-ready evidence.
