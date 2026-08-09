# Paid launch runbook

GrowthAI checkout is fail-closed. `BILLING_CHECKOUT_ENABLED=false` blocks new sales while existing subscriptions, signed webhooks, grace periods, cancellation, email, and reconciliation continue to run.

## Deployment configuration

Configure Razorpay and Resend separately in test and production. Web-runtime secrets belong in the web host; reconciliation and email-worker secrets also belong in the Convex deployment environment.

- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_PRO_MONTHLY`, `RAZORPAY_PLAN_ID_FOUNDER`.
- Email: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `TRANSACTIONAL_EMAIL_FROM`.
- Canonical URL: `NEXT_PUBLIC_APP_URL`.
- Sales switch: keep `BILLING_CHECKOUT_ENABLED=false` until every required test below has evidence.

Register signed webhooks for subscription authenticated, activated, charged, pending, halted, paused, resumed, updated, cancelled, and completed; payment failed/refunded; and refund processed. Register Resend delivered, bounced, and complained events at `/api/webhooks/resend`.

## Automated release gate

Run:

```bash
npm run validate:env
npm run verify
npm run build
```

The billing integration suite covers receipt durability, duplicate event IDs with mismatched payloads, retry metadata, server-only activation, and stale-event rejection. It does not replace provider test-mode evidence.

## Test-mode lifecycle evidence

Create a dated evidence folder outside Git if it contains customer data or provider identifiers. Record tester, deployment SHA, test account, provider dashboard timestamps, app screenshots, webhook event IDs, and the expected/actual entitlement for each row.

| Required scenario | Expected result | Evidence |
| --- | --- | --- |
| Pricing, Settings, and upgrade-dialog checkout | Same catalog price and hosted Razorpay URL | Pending external test |
| Refresh, close, and reopen checkout | No access; abandoned `created` record expires within 24 hours | Pending external test |
| Browser retries and duplicate webhook | One receipt/business transition; duplicate reported | Pending external test |
| Redirect without webhook | Free entitlement remains | Pending external test |
| Invalid/mismatched signature | HTTP 401 and no receipt | Pending external test |
| Renewal | Period advances, active entitlement remains, one renewal email | Pending external test |
| Payment failure | 72-hour grace, warning email, then provider recovery or revocation | Pending external test |
| Pause/resume | Access revoked/restored only from provider state | Pending external test |
| Period-end cancellation | Access remains through provider period end | Pending external test |
| Immediate cancellation/refund | Access revoked; event remains auditable | Pending external test |
| Delayed/out-of-order event | Older event has `stale` disposition and cannot downgrade newer state | Pending external test |
| Provider API outage | Checkout fails closed; reconciliation alert appears; existing access is unchanged | Pending external test |
| Account deletion | Active subscription blocks deletion; cancellation is required first | Pending external test |

Do not enable checkout until all rows pass in Razorpay test mode and the evidence is reviewed by someone other than the implementer.

## Operations

- Failed billing events retry with exponential backoff and become dead letters after five attempts. Owner MFA and a reason are required for replay in Admin → Billing.
- Reconciliation runs every six hours. Status drift is repaired only when the provider plan ID matches the server-created checkout; a plan mismatch is quarantined with a critical alert.
- Abandoned checkout records are expired every 30 minutes. Checkout locks expire after 10 minutes.
- Payment failures receive 72 hours of grace. Pauses and refunds revoke immediately. A period-end cancellation retains access only until the signed provider period end.
- Complimentary access is a separate, expiring grant. Only an owner with fresh MFA can create it, with source and reason in the audit log.

## Email production gate

The code uses Resend with HTML and plain-text alternatives, delivery records, idempotency, retries, dead letters, and signed delivery webhooks. Before production, verify the exact sending domain in Resend and record:

- SPF alignment;
- DKIM verification;
- DMARC policy and aggregate-report mailbox;
- separate test and production projects/keys;
- rendering in Gmail web/mobile, Apple Mail, Outlook web/desktop, and a narrow 320px client;
- delivery, bounce, complaint, and unsubscribe behavior.

DNS ownership and cross-client results are external launch gates and cannot be established by repository code.

