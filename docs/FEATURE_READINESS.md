# Feature readiness and honest marketing boundary

Shipped and represented in the plan catalog:

- access-controlled AI conversation with durable drafts, pagination, retry states, response feedback/reporting, edit-and-resend as a history-preserving new turn, and editable task proposals;
- Today, Upcoming, Completed, and Dismissed task views with undo and timezone-safe date-only scheduling;
- source-windowed weekly reviews with facts, labeled hypotheses, corrections, comparisons, bounded focus, and stored versions;
- a dedicated Growth Map for goals, evidence, obstacles, experiments, and outcomes with visible confidence, provenance fields, corrections, dismiss/restore, user-facing merge, time-ordered history, and deletion;
- privacy export, retention, AI-memory clearing, and account deletion for Free and paid users;
- Pro/Founder active-goal expansion; Founder has no private badge, channel, or unreleased feature promise.

Not marketed or sold: Calendar Operator, Voice Coach, deeper autonomous memory, advanced insights, team collaboration, and annual billing. Each remains excluded until its authorization, consent, storage, provenance, correction, revocation, deletion, accessibility, cost, and failure behavior is designed and tested.

Known external or evidence gates:

- 20–30 ICP interviews and a consented design-partner cohort;
- Razorpay test-mode lifecycle evidence;
- production domain, legal entity, tax and refund review;
- email-domain SPF/DKIM/DMARC and cross-client rendering evidence;
- measured Week-4 and paid retention.

These gates are intentionally not marked complete by code changes.

Known implementation boundary:

- assistant generation currently has a clear pending state, cancellation lease, retry, and durable structured final result, but does not yet expose provider tokens progressively to the browser. Checkout remains disabled while this and the external evidence gates are open.
