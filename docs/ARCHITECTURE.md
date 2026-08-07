# GrowthAI architecture and operations

## Boundaries

NextAuth owns Google authentication and server sessions. Google accounts are linked by provider subject plus verified email; provider profile changes do not overwrite a user's saved name. Next.js server actions and route handlers are the application boundary. They currently call public Convex functions using a server-only deployment credential and a fixed server identity. Every callable function rejects requests without that identity, and resource mutations also verify user ownership. Replacing the runtime deployment credential with a least-privilege application identity remains a G2 release gate.

Administration is a separate identity boundary and never uses a `users.role` field or a member session. Environment-backed email and password authentication creates a short-lived signed cookie scoped to `/admin`. Protected pages and mutations each re-check that session. Convex-backed throttling limits login attempts, and privileged changes are recorded in `adminAuditLogs`. Member suspension is re-evaluated whenever NextAuth resolves a session, so access removal takes effect without waiting for JWT expiry.

Convex stores the core product and operational tables:

- `users` for identity, plan, timezone, and AI conversation preferences
- `operatorConversations` and `operatorMessages` for paginated chat history, idempotent durable turns, generation state, and structured proposals
- `operatorGoals` and `operatorTasks` for the synchronized execution model
- `subscriptions`, `billingCheckoutLocks`, and `billingEvents` for Razorpay state, atomic checkout creation, and webhook idempotency
- `adminLoginAttempts` and `adminAuditLogs` for admin abuse prevention and privileged-operation traceability; neither table grants identity or access
- `aiUsageWindows`, `aiDailyUsage`, and `aiProviderCircuit` for bounded per-user/network generation, daily request/token/estimated-cost budgets, and automatic provider isolation after consecutive failures
- `announcements` for prioritized and optionally scheduled top bars, floating banners, and popup notices with validated presentation settings managed through the admin workspace

Every task has a required `goalId`. Free accounts are limited to three active goals inside the database mutation, so the rule cannot be bypassed through the interface. Completing or archiving a goal dismisses its remaining open tasks in the same transaction.

## External systems

- Gemini supplies schema-constrained structured operator turns through `@google/genai`; independent pre-provider safety routing and a deterministic implementation keep chat safe and useful when Gemini is unavailable.
- Razorpay hosts payment checkout and sends signature-verified, idempotent subscription webhooks. Checkout creation is authenticated, same-origin, POST-only, and resolves provider plan IDs and amounts exclusively on the server.
- Google OAuth is the only enabled user sign-in provider.

## Reliability rules

- Task proposals require explicit user approval before persistence.
- User messages are committed before generation, keyed by a client request ID, protected by a short generation lease, and remain retryable after failure.
- Only one generation lease per user may run at a time. If two distinct messages arrive together, Convex transaction ordering lets the first acquire the lease; the second is still persisted in database order as `failed/GENERATION_BUSY` and can be retried. Replays of one request ID never create another message or reply.
- Unsent browser drafts are stored per conversation and removed only after the server confirms persistence.
- Conversations load the newest 80 messages first and expose cursor pagination for older history.
- Goal limits, task duration limits, per-day task limits, ownership, and valid goal state are enforced in Convex.
- AI receives only relevant conversation, goals, and open tasks rather than unrelated account data. User content is isolated from the system instruction and treated as untrusted.
- Crisis/high-risk routing executes before any provider call. Model use has per-user/network limits, daily budgets, a timeout, an automatic global circuit breaker, and an emergency kill switch. Cost estimates use environment-configured current provider rates rather than hard-coded pricing.
- Account export contains the account, chats, goals, tasks, and subscriptions.
- Verified deletion removes all user-owned product data before deleting the user.
- Seed and migration functions are internal and idempotent.
- Paid entitlement changes only when a signed Razorpay event matches a subscription created by the server, its owner, and its exact configured provider plan ID. Browser-supplied amounts, plan IDs, subscription IDs, and entitlement state are never trusted.
- Subscription cancellation checks the signed-in owner, changes Razorpay first, and leaves local entitlement unchanged until the provider webhook confirms the lifecycle change.

## Deployment checklist

1. Use separate Convex, Google OAuth, Gemini, and Razorpay credentials for preview and production.
2. Run `npm run verify` and `npm run build`.
3. Deploy Convex before the matching Next.js release.
4. Test Google sign-in, chat, task approval, task editing, goal limits, goal completion, export, and deletion with a disposable account.
5. Test checkout creation, abandoned-checkout resume, cancellation, every allowed lifecycle event, invalid signatures, plan-ID mismatches, and duplicate webhook deliveries in Razorpay test mode before enabling live checkout.
