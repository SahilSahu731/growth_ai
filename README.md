# GrowthAI

GrowthAI is an accountability product for builders and indie hackers. A user commits to one concrete project, checks in with observable progress, receives concise evidence-grounded coaching, and builds a trustworthy history of actions, blockers, recovery, and shipped work.

## What is implemented

- Credentials, GitHub, and optional Google authentication with protected server routes.
- Guided onboarding: commitment, definition of shipped, deadline, next action, coaching tone, timezone, and cadence.
- Convex-backed projects, schedules, prompts, check-ins, evidence, streaks, project events, patterns, reviews, notifications, subscriptions, GitHub activity, public pages, and referrals.
- AI accountability through Gemini with bounded structured output, minimal context, timeout handling, and a deterministic fallback.
- Timezone-aware scheduling, idempotent prompt creation, email delivery through Resend, missed-check-in handling, and recovery-oriented streaks.
- Evidence-backed patterns, editable weekly reviews, opt-in public progress, JSON export, and verified permanent account deletion.
- Razorpay subscription checkout and signature-verified, idempotent webhooks.
- GitHub OAuth plus signature-verified webhook normalization. Repository events remain supporting evidence and never replace a user check-in.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Convex as the application database
- NextAuth v4 for session management
- Gemini for optional coaching/reviews
- Resend for transactional prompts
- Razorpay for India-first billing
- Vitest for domain and integration-boundary tests

## Local setup

```bash
npm install
cp .env.example .env.local
npm run convex:dev
npm run dev
```

`convex dev` creates or links a deployment. Copy its URL and a server deployment key into `.env.local`. The deployment key is server-only and must never use a `NEXT_PUBLIC_` prefix.

The app remains functional without Gemini: coaching and weekly reviews use deterministic fallbacks. Email, billing, GitHub App webhooks, and OAuth require their respective credentials.

## Verification

```bash
npm run verify
```

`verify` runs lint, TypeScript, and tests. Run the independent production compilation gate with `npm run build` (kept separate because Next.js build manages its generated route types).

## Scheduled jobs and webhooks

- Call `GET /api/cron/check-ins` with `Authorization: Bearer $CRON_SECRET` at least every 5–15 minutes.
- Configure Razorpay to send subscription events to `/api/webhooks/razorpay`.
- Configure a GitHub App webhook at `/api/webhooks/github`; repository selections use the internal `projectId|owner/repository` mapping.
- Keep all webhook secrets distinct across development, preview, and production.

See [roadmap.md](./roadmap.md) for the product plan and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system boundaries and operating notes.
