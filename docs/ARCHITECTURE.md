# GrowthAI architecture and operations

## Boundaries

NextAuth owns Google authentication and server sessions. Next.js server actions and route handlers are the application boundary. They call public Convex functions using a server-only deployment credential and a fixed server identity. Every callable function rejects requests without that identity, and resource mutations also verify user ownership.

Convex stores only seven product tables:

- `users` for identity, plan, timezone, and AI conversation preferences
- `operatorConversations` and `operatorMessages` for chat history and structured proposals
- `operatorGoals` and `operatorTasks` for the synchronized execution model
- `subscriptions` and `billingEvents` for Razorpay state and webhook idempotency

Every task has a required `goalId`. Free accounts are limited to three active goals inside the database mutation, so the rule cannot be bypassed through the interface. Completing or archiving a goal dismisses its remaining open tasks in the same transaction.

## External systems

- Gemini supplies validated structured operator turns; a deterministic implementation keeps chat useful when Gemini is unavailable.
- Razorpay creates checkout sessions and sends signature-verified, idempotent subscription webhooks.
- Google OAuth is the only enabled user sign-in provider.

## Reliability rules

- Task proposals require explicit user approval before persistence.
- Goal limits, task duration limits, per-day task limits, ownership, and valid goal state are enforced in Convex.
- AI receives only relevant conversation, goals, and open tasks rather than unrelated account data.
- Account export contains the account, chats, goals, tasks, and subscriptions.
- Verified deletion removes all user-owned product data before deleting the user.
- Seed and migration functions are internal and idempotent.

## Deployment checklist

1. Use separate Convex, Google OAuth, Gemini, and Razorpay credentials for preview and production.
2. Run `npm run verify` and `npm run build`.
3. Deploy Convex before the matching Next.js release.
4. Test Google sign-in, chat, task approval, task editing, goal limits, goal completion, export, and deletion with a disposable account.
5. Test the complete Razorpay test-mode lifecycle and duplicate webhook deliveries before enabling paid checkout.
