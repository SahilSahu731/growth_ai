# Service objectives and alert policy

These are launch targets, not uptime promises. They become enforceable only after a named on-call owner, provider-backed telemetry, and a 30-day baseline exist.

| Signal | Objective | Alert threshold | Severity / owner |
| --- | --- | --- | --- |
| Public and authenticated availability | 99.9% over 30 days | 3 failed canaries in 5 minutes | Critical / on-call engineering |
| Persisted user-message durability | 99.99% acknowledged messages retained | Any confirmed loss or cross-user read | Critical / security + engineering |
| Core API p95 | under 2.5 seconds excluding model generation | over 2.5 seconds for 15 minutes and 100+ samples | Warning / engineering |
| Model turn p95 | under 15 seconds | over 20 seconds for 15 minutes or fallback above 10% | Warning / AI owner |
| Billing correctness | 100% verified entitlements match provider state | any critical drift; 3 webhook dead letters in 10 minutes | Critical / billing owner |
| Account deletion | 99% complete within 24 hours; 100% within 30 days where legally permitted | any stale job over 30 minutes; failure after 5 attempts | Critical / privacy owner |
| Transactional email | 99% accepted by provider within 10 minutes | dead letter or failure above 5% for 15 minutes | Warning / operations |

Alerts must identify a safe request/job reference, impact, first responder, and the matching runbook. Group repeated alerts by error category for 15 minutes. Never include message text, email addresses, access tokens, webhook bodies, or exported data.

The in-product Operations screen is a bounded diagnostic view, not the paging system. Provider selection and privacy review remain an external launch gate.
