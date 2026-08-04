# GrowthAI architecture and operations

## Boundaries

NextAuth owns authentication and server sessions. Next.js server actions and route handlers are the application boundary. They invoke internal Convex functions through a server-only HTTP client; every mutation that touches a project verifies its user ID. The Convex deployment key is never sent to browser code.

Convex stores stable string IDs at the application boundary. The schema includes commitments, schedules, prompt instances, check-ins, evidence, immutable project events, streak aggregates, weekly reviews, pattern insights, notifications, subscriptions, billing events, GitHub connections/activity, and referrals. Legacy comparison tables remain temporarily for a safe migration and account deletion coverage, but no legacy routes are published.

External systems are isolated in adapters:

- Gemini: structured accountability and weekly review generation, with validation and deterministic degradation.
- Resend: transactional check-in prompts. Product state does not depend on email success.
- Razorpay: checkout creation and raw-body signature-verified webhooks.
- GitHub: OAuth identity plus raw-body signature-verified App webhooks. Activity is evidence, not an automatic progress verdict.

## Reliability rules

- Save the user check-in and its analysis together through one Convex mutation.
- Prompt and webhook processing use provider/event idempotency keys.
- Scheduler claims compare the expected schedule timestamp before advancing it, preventing duplicate concurrent prompts.
- Notification failures retry up to three attempts and do not roll back product state.
- AI receives only the project and recent relevant check-ins, never the complete account history.
- Public pages are opt-in and expose no raw check-ins, motivation text, email, patterns, or private evidence.

## Deployment checklist

1. Create separate Convex, OAuth, Resend, Razorpay, and GitHub credentials for preview and production.
2. Run `npm run verify` and deploy Convex schema/functions before the Next.js release.
3. Configure the check-in cron with `CRON_SECRET` and inspect the first prompt, retry, and missed transition.
4. Verify Razorpay and GitHub test webhook signatures, duplicate delivery behavior, and out-of-order subscription events.
5. Test credential signup, GitHub account linking, onboarding, a real check-in, model fallback, weekly review edit, export, and deletion in a disposable account.
6. Enable feature flags gradually; billing stays disabled until a complete test-mode subscription lifecycle passes.

## Known launch gates that require real-world validation

Code cannot satisfy the roadmap’s behavioral gates by itself. Before calling the product launched, the founder must complete the 14-day dogfood period, conduct target-user interviews, observe repeated real usage, run the Razorpay test/live lifecycle with actual dashboard credentials, validate email delivery reputation, and complete backup/restore and incident-response drills.
