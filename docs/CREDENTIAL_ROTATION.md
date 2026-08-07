# Credential rotation procedure

Use this procedure for suspected exposure, routine rotation, or access removal. Never paste a credential into an issue, commit, pull request, chat, screenshot, command argument, or CI log.

1. Name an incident/rotation owner and identify the provider, environments, permissions, consumers, and last-known-safe time using credential IDs only.
2. If misuse is possible, disable or revoke the exposed credential at the provider immediately. Otherwise create the replacement first for a controlled zero-downtime rotation.
3. Create a least-privilege replacement scoped to one environment. Apply provider restrictions such as allowed APIs, origins/IPs, quotas, expiry, and alerts.
4. Store the replacement in the environment's secret manager, update one nonproduction consumer, and run its smoke tests.
5. Promote the same change through staging and production. Confirm the new credential is used without logging its value.
6. Revoke the old credential and verify a controlled request using it is rejected.
7. Search Git refs, CI/deployment logs, artifacts, backups, tickets, chat, and forks using a redacted scanner. If it reached Git, coordinate and complete the history-rewrite procedure in `docs/EXTERNAL_COMPLETION_STEPS.md`.
8. Rotate any credential that could be derived from or accessed through the exposed one. Review provider access/audit logs and billing/usage anomalies.
9. Record credential ID, owner, scope, environments, creation/revocation times, evidence links, affected systems, and next rotation date—never the secret.
10. Add a synthetic regression rule to secret scanning and close only after a fresh-clone scan and provider rejection check pass.
