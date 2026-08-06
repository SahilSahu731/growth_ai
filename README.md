# GrowthAI

GrowthAI is a chat-first AI growth operator for the whole of life—not a journal, a generic chatbot, or a giant task board. A person talks naturally about what feels stuck; GrowthAI gathers evidence, identifies a likely bottleneck, proposes a short direction, and turns an approved plan into concrete tasks that can adapt as reality changes.

## Product experience

- Direct-to-chat sign-in with no onboarding form or required goal definition.
- AI-led discovery, quick-reply choices, bounded task proposals, explicit approval, and a persistent Today list.
- Editable goals and task cards that stay synchronized across chat, Goals, Tasks, and weekly reports.
- A database-enforced three-goal limit on Free, with expanded goal capacity on paid plans.
- Timezone-aware planning, account export, and verified account deletion.
- A separately authenticated admin workspace for users, content, access, plans, billing visibility, platform metrics, and privileged audit history.
- Admin-managed, scheduled global announcement banners for offers, warnings, launches, and service notices.
- Gemini structured operator responses with a fully usable deterministic fallback and explicit safeguards against shame, diagnosis, therapy impersonation, and high-stakes directives.

The visual system is informed by the locally supplied Timmo reference: a dark editorial canvas, focused typography, subtle grid backgrounds, soft bordered cards, bento layouts, and restrained motion. GrowthAI retains its own identity and content.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Convex application database
- NextAuth with Google as the only account sign-in provider
- Gemini structured responses and Razorpay billing webhooks
- Vitest domain and integration-boundary tests

## Local setup

```bash
npm install
cp .env.example .env.local
npm run convex:dev
npm run dev
```

Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the root `.env.local` before testing authentication. See [Google OAuth setup](./docs/GOOGLE_OAUTH_SETUP.md) for the exact local and production callback URLs. The app remains usable without Gemini through deterministic guidance. Billing and OAuth require their corresponding environment credentials.

Run `npm run convex:dev` to create or connect a development database and deploy the schema/functions. Convex functions called by the app require the trusted Next.js server identity; the deployment token stays server-only. Follow [Convex setup](./docs/CONVEX_SETUP.md) to generate that token safely and configure production.

The admin workspace is available at `/admin` after its independent email, password, and session signing key are configured. It does not use member roles or member sessions. Follow [Admin setup](./docs/ADMIN_SETUP.md) before deploying it.

## Verification

```bash
npm run verify
npm run build
```

`verify` runs ESLint, TypeScript, and the test suite. The independent build command validates the production application and generated Next.js route types.

## Operations

- Send Razorpay subscription events to `/api/webhooks/razorpay`.
- Use distinct secrets for development, preview, and production.

See [roadmap.md](./roadmap.md) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
