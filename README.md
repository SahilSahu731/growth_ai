# GrowthAI

GrowthAI is a calm personal-growth system for the whole of life—not a project manager and not an average AI chat app. A person chooses one meaningful intention in health, career, relationships, learning, finances, creativity, wellbeing, or personal life; reflects on what changed; receives grounded guidance; and gradually understands the patterns that help or hinder them.

## Product experience

- Guided onboarding for a life area, meaningful intention, reflection date, personal reason, definition of progress, and one small next step.
- Short reflections with supportive, balanced, or direct guidance.
- Timezone-aware prompts, reflection rhythms, missed-day recovery, and editable weekly reviews.
- Evidence-backed pattern memory that distinguishes observations from interpretation.
- Multiple intentions on paid plans, privacy-safe public growth pages, referrals, export, and verified deletion.
- Optional GitHub activity for coding-related intentions; it is supporting evidence, never a universal measure of growth.
- Gemini structured responses with deterministic fallback and explicit safeguards against shame, diagnosis, therapy impersonation, and high-stakes directives.

The visual system is informed by the locally supplied Timmo reference: a dark editorial canvas, focused typography, subtle grid backgrounds, soft bordered cards, bento layouts, and restrained motion. GrowthAI retains its own identity and content.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Convex application database
- NextAuth with Google as the only account sign-in provider
- Gemini, Resend, Razorpay, and optional GitHub App webhooks
- Vitest domain and integration-boundary tests

## Local setup

```bash
npm install
cp .env.example .env.local
npm run convex:dev
npm run dev
```

Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the root `.env.local` before testing authentication. See [Google OAuth setup](./docs/GOOGLE_OAUTH_SETUP.md) for the exact local and production callback URLs. The app remains usable without Gemini through deterministic guidance. Email, billing, OAuth, and webhooks require their corresponding environment credentials.

Run `npm run convex:dev` to create or connect a development database and deploy the schema/functions. Because GrowthAI currently calls internal Convex functions from its trusted Next.js server, it also needs a server-only deployment token. Follow [Convex setup](./docs/CONVEX_SETUP.md) to generate that token safely and configure production.

## Verification

```bash
npm run verify
npm run build
```

`verify` runs ESLint, TypeScript, and the test suite. The independent build command validates the production application and generated Next.js route types.

## Operations

- Call `GET /api/cron/check-ins` with `Authorization: Bearer $CRON_SECRET` every 5–15 minutes.
- Send Razorpay subscription events to `/api/webhooks/razorpay`.
- Send GitHub App events to `/api/webhooks/github` only when optional developer evidence is enabled.
- Use distinct secrets for development, preview, and production.

See [roadmap.md](./roadmap.md) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
