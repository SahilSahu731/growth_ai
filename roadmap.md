# GrowthAI Production Roadmap

> **Product direction update — August 2026:** GrowthAI is now a whole-life personal-growth system rather than a builder/project-shipping product. The reusable accountability, reflection, scheduling, memory, privacy, billing, and operations work below remains valid. In all user-facing implementation, “project” should be read as a private growth intention across health, career, relationships, learning, finances, creativity, wellbeing, or personal life. GitHub is optional evidence for the small subset of intentions involving software; it is not the product center.

> **Product promise:** Tell GrowthAI what you are building, and it makes sure you do not quietly abandon it.

This document is the implementation contract for turning the current repository into a production-grade accountability product for builders, indie hackers, solo founders, and developers. It incorporates the complete intent of the supplied MVP roadmap, but expands it into an executable product, engineering, AI, security, billing, operations, and launch plan tailored to this codebase.

The roadmap is deliberately gated. Every phase must be usable, testable, and demonstrable on its own. A phase is not complete because its code exists; it is complete only when its exit criteria and evidence requirements are satisfied.

---

## 1. Product contract

### 1.1 The problem

Builders often begin with high motivation, work intensely for a few days, then gradually stop. Traditional task managers record intended work but rarely challenge avoidance, recognize repeated blocker patterns, or bring a builder back after momentum drops.

GrowthAI is not a task manager, general life coach, project-management suite, or generic chatbot. It is a focused accountability system that:

1. Captures one meaningful shipping commitment.
2. Requests evidence of progress on a reliable schedule.
3. Distinguishes real progress, real blockers, and avoidance patterns.
4. Responds with one useful observation or sharp follow-up—not an essay.
5. Detects loss of momentum before the user formally abandons the project.
6. Helps the user recover with a small, concrete next action.
7. Learns which patterns repeatedly help or hurt that specific builder.

In the product's plainest language, the coach must learn to distinguish a real blocker from an excuse or avoidance pattern. Internally and in user-facing copy, prefer precise terms such as “avoidance signal” over labeling the person or dismissing a legitimate constraint.

### 1.2 Primary job to be done

> When I am building something on my own and my motivation begins to fade, help me notice the stall, confront the real reason, and complete the next meaningful action so I keep shipping.

### 1.3 Target user

The initial target user is deliberately narrow:

- A solo builder, indie hacker, job-seeking developer, or working developer.
- Actively building one software project or preparing one concrete launch.
- Works primarily on desktop.
- Has previously abandoned or paused projects after a strong start.
- Is willing to provide short check-ins and connect GitHub later.
- Values direct, specific feedback more than motivational content.

### 1.4 Product principles

- **One commitment before many projects.** Free users get one active project. This is a product philosophy, not merely a pricing restriction.
- **Evidence over intention.** Ask what changed, shipped, was tested, or was learned.
- **One sharp intervention.** AI responses should be concise and actionable.
- **Memory must earn trust.** Reference history only when it materially improves the response.
- **No fake certainty.** AI classifications and pattern insights must be framed as interpretations, not facts.
- **Recovery over punishment.** Blunt mode may be direct, but never humiliating, manipulative, or abusive.
- **The system must work without AI.** Scheduling, streaks, deadlines, check-in state, limits, and billing are deterministic.
- **Depth before breadth.** Do not add a new audience or workflow until the core builder loop changes behavior.

### 1.5 Non-goals for V1

The following are explicitly excluded until the roadmap promotes them:

- Native iOS or Android applications.
- General-purpose life coaching.
- Habit tracking unrelated to the active build commitment.
- Team project management, tickets, sprints, or employee surveillance.
- Social feed, leaderboards, badges, or engagement gamification.
- Voice assistant.
- Autonomous code changes or repository write access.
- Multiple model selectors or prompt customization.
- Marketplace, community templates, or public discovery feed.
- Slack, Discord, Linear, Jira, Notion, and calendar integrations.
- An unlimited AI plan before unit economics are measured.

---

## 2. Current repository assessment and pivot plan

### 2.1 Current state

The repository currently contains two product directions:

1. **PickAI**, an active comparison/decision product with landing pages, comparisons, reports, plans, and Convex-backed data.
2. **GrowthAI**, partially retained developer-goal, project, coding-session, planner, progress, and review screens, with some legacy SQL access.

The target described in this roadmap is GrowthAI. Continuing to maintain both products in one navigation and data model will create confused positioning, duplicate concepts, inconsistent design, and operational risk.

### 2.2 Required product decision

Before Phase 1 begins, choose and document one of these approaches:

- **Recommended:** Pivot this repository fully to GrowthAI. Archive PickAI-specific routes and Convex tables in a reversible branch or export, then remove them from the production build.
- Split PickAI into a separate repository before modifying shared code.

Do not keep both as public products in this application.

### 2.3 Safe pivot procedure

- Create a tagged baseline before deleting or migrating PickAI behavior.
- Inventory every PickAI route, table, mutation, environment variable, and public URL.
- Export any production data before schema removal.
- Add redirects only for URLs that may already be public.
- Remove PickAI navigation, marketing copy, pricing copy, comparison actions, and unused dependencies.
- Preserve reusable UI primitives, authentication, Convex infrastructure, billing abstractions, and deployment configuration.
- Replace `docs/ARCHITECTURE.md` with the final GrowthAI architecture once the pivot is complete.
- Do not drop Convex tables until at least one release after code stops reading them.

### 2.4 Stack decision

Use the existing production foundation:

- Next.js 16 App Router and TypeScript.
- React 19.
- Convex database, queries, mutations, scheduled functions, and cron jobs.
- NextAuth initially, with Credentials and GitHub OAuth.
- Gemini or another configured model through a provider-neutral AI service boundary.
- Transactional email provider for check-in prompts and nudges.
- Razorpay for the initial India-focused premium plan; encapsulate billing so Stripe can be added later.
- Vercel or equivalent for Next.js deployment and Convex managed deployment for backend state.

Do not introduce Supabase, Prisma, Postgres, or Express merely because the source roadmap mentioned them. New infrastructure must solve a requirement the current stack cannot satisfy.

---

## 3. Success definition and measurement

### 3.1 North-star metric

**Weekly accountable builders:** users with an active project who submit at least two meaningful check-ins in a seven-day window and complete at least one declared next action.

This is better than daily active users because opening the application without making progress is not the desired outcome.

### 3.2 Activation definition

A user is activated when they:

1. Create an account.
2. Create one project with a real ship date.
3. Choose a check-in schedule and timezone.
4. Submit their first check-in.
5. Commit to a next action.

Target initial activation rate: at least 40% of completed signups. Revisit after the first 100 legitimate signups.

### 3.3 Core metrics

- Signup-to-project creation rate.
- Project creation-to-first-check-in rate.
- Percentage of scheduled check-ins completed within 24 hours.
- Week-one and week-four accountable-builder retention.
- Recovery rate after two missed check-ins.
- Percentage of check-ins containing concrete evidence.
- Percentage of committed next actions reported complete.
- Projects shipped before or within seven days of target date.
- AI response helpfulness and incorrect-memory report rate.
- Notification delivery, open, click, and unsubscribe rates.
- Free-to-paid conversion.
- Premium churn and failed-payment recovery.
- AI, email, and infrastructure cost per active user.

### 3.4 Validation rule

The founder must use the Stage 1 loop on a real project for fourteen consecutive days before building premium functionality. Record behavioral changes, missed prompts, annoying responses, and moments where the system exposed something genuinely useful.

If the loop does not change behavior at least once, pause roadmap execution and repair the loop. Do not compensate by adding features.

### 3.5 Founder reality check

Before treating GrowthAI as a second product track, explicitly decide whether building it is a genuine commitment or a disguised way to avoid the founder's current primary project (the supplied roadmap used Forge as the example). The fastest validation is to use the Phase 3 loop to hold the founder accountable for that primary project. Do not let building an accountability product become another abandoned or avoidance-driven project.

---

## 4. Intended user experience

### 4.1 First session

1. User lands on a page promising accountability for builders, not generic AI coaching.
2. User sees a concrete example of a check-in, a pointed response, and a recovery intervention.
3. User signs up through GitHub or email.
4. User creates one commitment:
   - Project name.
   - What they are building.
   - Why it matters personally.
   - Definition of shipped.
   - Target ship date.
5. User selects daily or every-other-day check-ins, preferred local time, timezone, and initial tone.
6. User states the next smallest shippable action.
7. Dashboard shows the commitment, countdown, next check-in, and zero-state streak.

### 4.2 Normal check-in

1. Scheduled prompt asks: “What did you do on [project]?”
2. User responds in free text.
3. System optionally asks for a URL, commit, screenshot, or concrete artifact.
4. AI classifies the entry privately and returns:
   - Acknowledgment grounded in the entry.
   - One observation or challenge.
   - At most one follow-up question.
5. User declares the next action and optional expected completion time.
6. Streak and project status update deterministically.

### 4.3 Missed-check-in recovery

1. First miss: low-pressure reminder with a direct link to check in.
2. Second consecutive miss: pointed recovery message referencing the commitment and last declared action.
3. User can respond with:
   - “I made progress.”
   - “I am blocked.”
   - “I am avoiding it.”
   - “Pause the project.”
4. GrowthAI reduces scope to a recovery action that can be completed quickly.
5. A recovered check-in starts a recovery streak without pretending the miss did not happen.

### 4.4 Weekly review

The Sunday review should show:

- What shipped.
- Check-ins completed and missed.
- Declared actions completed and carried forward.
- Repeated blockers.
- Evidence provided.
- One honest pattern observation.
- One recommended focus for the coming week.
- A user-editable summary suitable for private reflection or public export.

---

## 5. Target architecture

### 5.1 Application boundaries

- **Presentation:** Next.js Server Components for initial data and Client Components only for forms, optimistic feedback, and interactive charts.
- **Authentication:** NextAuth session boundary; GitHub and credentials providers. Every protected route verifies the session server-side.
- **Application services:** Thin TypeScript modules for projects, check-ins, scheduling, AI accountability, notifications, billing, GitHub, analytics, and exports.
- **Database:** Convex schema with explicit indexes and ownership checks in every user-data function.
- **Background work:** Convex scheduled functions and cron jobs for prompts, missed-check-in detection, weekly summaries, notification retries, and stale-project analysis.
- **AI:** Provider-neutral service with versioned prompts, structured outputs, deterministic validation, timeouts, retries, and safe fallback copy.
- **External adapters:** Email, Razorpay, GitHub, analytics, error monitoring, and file storage isolated behind interfaces.

### 5.2 Security boundary

- Never trust a `userId` from a browser form or URL.
- Derive identity from the authenticated server session or a verified Convex identity.
- Every project, check-in, review, export, notification preference, and integration query must verify ownership.
- Keep deploy keys, OAuth secrets, AI keys, webhook secrets, and email keys server-only.
- Verify Razorpay and GitHub webhook signatures before parsing business events.
- Make all external-event handlers idempotent.
- Rate-limit signup, login, check-in generation, AI responses, exports, and integration sync.
- Redact secrets, access tokens, raw passwords, and sensitive check-in content from logs.

### 5.3 Reliability requirements

- Scheduled prompts use the user's IANA timezone and survive daylight-saving transitions.
- Jobs have idempotency keys and retry metadata.
- Email delivery failure does not corrupt check-in state.
- AI failure does not prevent a check-in from being saved.
- Billing webhook duplication does not create duplicate subscriptions.
- GitHub API failure degrades to manual check-ins.
- Weekly reviews are reproducible from stored events.
- User-facing timestamps show local time; persisted scheduling times use UTC plus timezone metadata.

---

## 6. Proposed Convex data model

Exact field names may evolve during implementation, but relationships, indexes, ownership, and audit requirements should remain.

### 6.1 `users`

- `name`, normalized `email`, optional password hash, auth providers.
- `planTier`: `free | pro | founder`.
- `timezone`: IANA value such as `Asia/Kolkata`.
- `locale` and week-start preference.
- `onboardingCompletedAt`.
- `createdAt`, `updatedAt`, optional `deletedAt`.
- Indexes: email, external auth identity.

### 6.2 `userPreferences`

- `userId`.
- `coachTone`: `supportive | balanced | blunt`.
- `checkInCadence`: `daily | every_other_day | custom`.
- Local check-in hour and minute.
- Notification channels and consent timestamps.
- Sunday review preference.
- Quiet hours.
- Index: user.

### 6.3 `projects`

- `userId`.
- `name`, `description`, `whyItMatters`.
- `definitionOfShipped`.
- `targetShipDate`.
- `status`: `active | paused | shipped | abandoned | archived`.
- `isPrimary`.
- Initial and current next action.
- Pause/close reason.
- `createdAt`, `updatedAt`, `shippedAt`, `archivedAt`.
- Indexes: user/status, user/isPrimary, target date.
- Invariant: free users may have only one active project.

### 6.4 `checkInSchedules`

- `userId`, `projectId`.
- Cadence and local scheduled time.
- IANA timezone.
- `nextPromptAt`, `lastPromptAt`.
- Active flag.
- Schedule version to handle changes safely.
- Indexes: due prompts, project.

### 6.5 `checkInPrompts`

- `userId`, `projectId`, `scheduleId`.
- `scheduledFor`, `openedAt`, `respondedAt`, `missedAt`.
- `status`: `scheduled | sent | opened | completed | missed | cancelled`.
- Delivery channel and notification ID.
- Idempotency key.
- Indexes: due/status, project/time, user/time.

### 6.6 `checkIns`

- `userId`, `projectId`, optional prompt ID.
- Raw user response.
- User-selected state: progress, blocked, avoiding, pause request.
- AI classification: `meaningful_progress | maintenance | real_blocker | unclear | avoidance_signal`.
- Classification confidence and prompt version.
- Concise AI response and follow-up question.
- Declared next action, estimated minutes, expected completion date.
- Optional evidence summary.
- User feedback: helpful/not helpful and correction.
- `createdAt`, `updatedAt`.
- Indexes: project/time, user/time, classification.

### 6.7 `evidence`

- `userId`, `projectId`, `checkInId`.
- Type: URL, GitHub commit, pull request, deployment, screenshot, text note.
- External URL or storage reference.
- Extracted metadata and verification status.
- `createdAt`.
- Indexes: project, check-in, external identifier.

### 6.8 `projectEvents`

Append-only activity used for analytics and reproducible reviews:

- `userId`, `projectId`.
- Event type: project created, prompt sent, check-in completed, check-in missed, next action committed, action completed, project paused, resumed, shipped, GitHub activity observed.
- Event time, actor, metadata, schema version.
- Idempotency key for external events.
- Indexes: project/time, user/time, idempotency key.

### 6.9 `streaks`

- `userId`, `projectId`.
- Current streak, longest streak.
- Last qualifying date in the user's timezone.
- Miss count and recovery count.
- Updated transactionally from qualifying events.
- Index: project.

### 6.10 `weeklyReviews`

- `userId`, `projectId`, ISO week start.
- Deterministic metrics snapshot.
- AI narrative, observation, and next-week recommendation.
- Prompt/model version and generation status.
- User edits, export status, feedback.
- Unique index: project/week.

### 6.11 `patternInsights`

- `userId`, optional project ID.
- Pattern type: repeated blocker, vague check-ins, late-stage stall, schedule mismatch, over-scoping, recovery trigger.
- Supporting check-in/event IDs.
- Confidence, first/last observed timestamps.
- Status: active, acknowledged, dismissed, resolved.
- User correction.
- Indexes: user/status, project/status.

### 6.12 `notifications`

- User, project, prompt/review reference.
- Channel, template, recipient.
- Scheduled/sent/delivered/failed timestamps.
- Provider message ID, attempt count, next retry.
- Failure category without sensitive payload.
- Idempotency key.
- Indexes: due retry, provider ID, user/time.

### 6.13 `subscriptions` and `billingEvents`

- Subscription provider and customer/subscription IDs.
- User, plan, status, period start/end, cancel-at-period-end.
- Provider price/plan ID and amount/currency snapshot.
- Webhook event ID, signature verification result, processing status.
- Raw payload stored only if policy allows; otherwise retain a sanitized digest.
- Indexes: user, provider customer, provider subscription, webhook event ID.

### 6.14 `githubConnections` and `githubActivity`

- Encrypted or provider-managed token reference; never expose tokens to client code.
- GitHub user ID/login, installation ID if using a GitHub App.
- Selected repository IDs and permissions.
- Last sync cursor/time and failure status.
- Normalized commits, pull requests, releases, and deployments.
- Indexes: user, repo/time, external event ID.

### 6.15 `referrals`

- Referrer user, invite code, referred user.
- Created, clicked, signed-up, activated, rewarded timestamps.
- Campaign/source.
- Fraud/reversal status.
- Indexes: code, referrer, referred user.

---

## 7. Delivery phases

## Phase 0 — Product truth, scope, and validation design

### Objective

Make the product understandable in one sentence, choose the repository pivot strategy, and define how usefulness will be measured before changing production code.

### Product work

- Place the product promise at the top of the README and internal product brief.
- Write three concrete user stories from real builder experiences.
- Interview at least five target builders about abandoned projects and current accountability methods.
- Identify the exact trigger that causes them to disengage.
- Create a clickable low-fidelity prototype of setup, dashboard, check-in, missed-check-in recovery, and weekly review.
- Test whether users understand the product without calling it an “AI growth platform.”
- Decide whether the initial tone defaults to balanced or supportive.
- Define “meaningful progress” examples for at least ten common builder activities.

### Engineering work

- Document the PickAI archive/split decision.
- Create an environment inventory and secret rotation plan.
- Establish `development`, `preview`, and `production` environments.
- Add CI commands for install, lint, typecheck, unit tests, and build.
- Define analytics events before implementing screens.
- Create lightweight architecture decision records for auth, notifications, billing, AI provider, and GitHub integration.

### Exit criteria

- Five target users can explain the product after viewing the prototype.
- The repository pivot decision is approved and reversible.
- North-star, activation, retention, and recovery metrics are documented.
- No feature outside the product promise is in the Phase 1 backlog.

---

## Phase 1 — Repository consolidation and production foundation

### Objective

Turn the mixed repository into a clean GrowthAI application with reliable authentication, environments, ownership enforcement, observability, and a coherent design system.

### Product and design

- Replace PickAI branding, metadata, navigation, pricing, copy, and comparison examples.
- Design a builder-focused visual system: project status, streak, deadline, next action, and check-in states.
- Produce responsive layouts for landing, onboarding, dashboard, settings, and auth.
- Ensure keyboard navigation, visible focus, sufficient contrast, reduced-motion support, and semantic headings.

### Authentication

- Keep email/password auth with secure password hashing.
- Add GitHub OAuth; make it the prominent option because the audience is developers.
- Decide whether Google OAuth remains useful; remove it if it adds confusion.
- Link accounts by verified email without silently overwriting an existing credential account.
- Add session expiry handling, safe callback URLs, generic login errors, and account deletion.
- Add password reset before broad public launch.
- Add email verification before enabling notification delivery or paid checkout.

### Backend and data

- Add the GrowthAI Convex tables and indexes described above.
- Implement a reusable `requireUser`/ownership helper for all Convex functions.
- Move any still-active legacy SQL-backed GrowthAI features to Convex.
- Eliminate `DATABASE_URL` from the active GrowthAI path.
- Add schema validators for statuses, tone, cadence, dates, text lengths, URLs, and pagination.
- Add soft-delete or archive behavior where recovery is valuable.
- Add a development seed script with representative users/projects/check-ins.

### Platform

- Add error monitoring and source maps.
- Add privacy-safe product analytics with environment separation.
- Add structured server logs with request/job IDs.
- Add feature flags for AI pattern memory, billing, GitHub, public pages, and referrals.
- Add security headers and explicit image/connect source policies.
- Configure dependency auditing and scheduled dependency updates.

### Testing

- Unit-test auth normalization, ownership helpers, plan limits, dates, and timezones.
- Integration-test signup, GitHub sign-in callback, protected-route redirects, and account linking.
- Add a browser smoke test for landing → signup → onboarding.

### Exit criteria

- No PickAI screen or copy appears in the GrowthAI production flow.
- New and returning users can authenticate with email and GitHub.
- Unauthorized users cannot access another user's data through routes or direct backend calls.
- CI passes lint, typecheck, tests, and production build.
- Preview and production have isolated data and secrets.

---

## Phase 2 — The one-project commitment

### Objective

Let a user make one specific, deadline-bound shipping commitment and understand exactly what “done” means.

### Onboarding flow

- Ask “What are you building?” using concise free text.
- Ask why it matters personally; do not accept only generic market language.
- Require a target ship date.
- Require a definition of shipped, such as deployed MVP, first paying customer, submitted application, or published package.
- Ask for the smallest next shippable action.
- Ask daily or every-other-day cadence, local time, and timezone.
- Explain notification consent and allow email opt-out without blocking in-app use.
- Prevent a second active free project with an explanatory upgrade/focus message.

### Dashboard

- Show the active commitment prominently.
- Show target-date countdown and overdue state.
- Show next action, next check-in time, current streak, and recent evidence.
- Provide obvious actions: check in, edit next action, pause, mark shipped.
- Avoid task-list expansion; there is only one current next action in MVP.
- Show a useful zero state immediately after onboarding.

### Backend rules

- Enforce one active project for free users transactionally.
- Normalize target date to the user's timezone.
- Validate that target date is in the future, with an explicit override for overdue imported work.
- Record project lifecycle changes in `projectEvents`.
- Make `mark shipped`, `pause`, `resume`, and `archive` idempotent.
- Require confirmation and a reason for abandonment.

### Analytics

- Track onboarding step completion and abandonment without storing raw private answers in analytics.
- Track project creation, cadence choice, deadline distance, and first next action.

### Exit criteria

- A new user can create exactly one commitment in under three minutes.
- A free user cannot create two active projects through UI or direct API calls.
- Deadline and next-check-in times are correct across tested timezones.
- Project lifecycle events are complete enough to reconstruct the project state.

---

## Phase 3 — Core check-in loop

### Objective

Deliver the smallest useful accountability loop: prompt → free-text response → concise AI challenge → next action.

### Check-in UI

- Present a focused conversation-like surface, not a general chat window.
- Prompt: “What did you do on [project]?”
- Allow free text with clear privacy expectations.
- Offer optional quick states: made progress, blocked, avoiding, need to pause.
- Accept optional evidence URL in MVP; file uploads can follow.
- Stream or show response progress without losing submitted content.
- Allow the user to correct an AI interpretation.
- End with a required next action unless the project is paused or shipped.

### AI behavior V1

- Identify concrete progress mentioned by the user.
- Distinguish likely real blocker, unclear update, and avoidance signal.
- Ask at most one follow-up question.
- Keep response within a strict length budget.
- Do not diagnose mental-health conditions or make moral judgments.
- Do not claim repository activity unless verified.
- If confidence is low, ask for clarification instead of accusing the user.

### AI implementation

- Define a versioned structured output schema:
  - Classification.
  - Confidence.
  - Evidence phrase from the user's own update.
  - Concise response.
  - Optional follow-up question.
  - Suggested next-action refinement.
- Validate model output and discard unknown enum values.
- Add timeouts, bounded retries, token limits, and a deterministic fallback response.
- Save the user's check-in before calling the model.
- Record model, prompt version, latency, token usage, error category, and estimated cost.
- Never include another user's data in prompts.

### Streak V1

- Define a qualifying check-in precisely.
- Calculate streaks by the user's local date and cadence, not server date.
- Do not reward empty or whitespace-only entries.
- Display current and longest streak without shame-heavy loss animations.
- Add unit tests around midnight, timezone changes, and every-other-day cadence.

### Testing and evaluation

- Create at least 100 labeled synthetic check-ins covering progress, blockers, avoidance, ambiguity, adversarial instructions, and sensitive content.
- Have a human label expected classification and acceptable tone.
- Measure schema validity, classification agreement, verbosity, false accusation rate, and unsafe response rate.
- Add regression cases for every production complaint.

### Exit criteria

- Check-ins are never lost when AI fails.
- At least 95% of evaluation responses satisfy the structured schema and length limit.
- The AI does not falsely claim memory or external evidence.
- A user can complete a check-in and declare a next action in under two minutes.
- Founder uses the loop for fourteen days and documents at least one changed behavior.

---

## Phase 4 — Scheduling, notifications, and recovery

### Objective

Reliably ask for progress at the promised time and respond intelligently when the user disappears.

### Scheduling engine

- Use Convex scheduled functions/cron to enqueue due prompts.
- Store schedule in local-time semantics plus IANA timezone.
- Generate prompts ahead of delivery with unique idempotency keys.
- Handle cadence edits without duplicate prompts.
- Cancel future prompts when a project pauses, ships, or archives.
- Mark prompts missed only after an explicit grace window.
- Backfill safely after temporary scheduler outages.

### Notification delivery

- Start with in-app and transactional email.
- Use one-click deep links that return to the correct check-in.
- Create templates for scheduled prompt, first miss, second miss, weekly review, deadline warning, and shipped celebration.
- Add unsubscribe/preferences links to every non-essential email.
- Configure SPF, DKIM, DMARC, sender domain, suppression handling, and bounce processing.
- Track provider delivery states without storing email body content in logs.
- Retry transient failures with exponential backoff and cap attempts.

### Missed-check-in logic

- First miss: simple reminder.
- Two consecutive misses: pointed nudge referencing project purpose and last committed action.
- Three or more misses: recovery flow, not escalating guilt.
- Offer pause and schedule adjustment when behavior suggests cadence mismatch.
- Prevent multiple recovery emails for the same missed sequence.

### Recovery experience

- Ask whether the problem is scope, blocker, energy/time, uncertainty, or loss of interest.
- Reduce the next action to something achievable in 15–45 minutes.
- Allow the user to reject the suggestion.
- Record which recovery action restored activity.

### Exit criteria

- Test accounts receive prompts within the defined delivery window across at least six timezones.
- Duplicate scheduler execution sends no duplicate email.
- Paused/shipped users receive no project prompts.
- Bounce, unsubscribe, and retry behavior is verified in provider test mode.
- A two-miss sequence produces exactly one pointed recovery intervention.

---

## Phase 5 — Pattern memory and genuinely personalized accountability

### Objective

Make the AI say something a generic reminder application could not say because it understands the user's history.

### Memory design

- Do not send the complete check-in history to the model.
- Build a compact, inspectable memory representation from recent check-ins, open next actions, missed prompts, prior blockers, and active pattern insights.
- Cite internal dates or entries when referencing a pattern.
- Let users inspect, correct, dismiss, or delete inferred patterns.
- Expire weak insights that are no longer supported.

### Required behaviors

- Recognize repeated blocker language.
- Notice when the same next action is carried forward repeatedly.
- Detect shorter or vaguer check-ins over at least three entries.
- Recognize pre-launch and “almost done” stalls.
- Identify cadence mismatch, such as consistent late responses.
- Compare stated confidence with observed action carefully, without pretending commits equal all work.

### Tone setting

- Support `supportive`, `balanced`, and `blunt`.
- Define a written tone policy and prohibited language for each.
- Tone changes style, not factual interpretation or safety rules.
- Preview tone during onboarding and settings.
- Allow a per-response “too soft / right / too harsh” feedback control.

### Stall detection

- Combine deterministic signals and AI interpretation:
  - Consecutive misses.
  - Shrinking update length.
  - Repeated next action.
  - Lack of evidence.
  - Target date approaching.
  - Later GitHub inactivity.
- Require multiple signals before strong language.
- Store why a stall was detected and show that explanation to the user.
- Avoid silently modifying project status.

### Evaluation

- Add longitudinal evaluation scenarios spanning 5–15 check-ins.
- Measure whether referenced facts are accurate.
- Measure false pattern detection and inappropriate bluntness.
- Require human review of prompt changes affecting stall or avoidance classification.

### Exit criteria

- The AI correctly references a relevant prior event in longitudinal tests.
- Users can see and correct every stored behavioral insight.
- No intervention claims a pattern without identifiable supporting entries.
- At least one beta user reports a useful observation that required history.

---

## Phase 6 — Weekly reviews and outcome visibility

### Objective

Transform check-in history into a concise weekly reflection that improves the next week instead of merely summarizing activity.

### Deterministic review data

- Scheduled prompts, completed prompts, and misses.
- Meaningful-progress check-ins.
- Declared and completed next actions.
- Evidence items.
- Project status and target-date movement.
- Active and newly detected patterns.
- Recovery actions and whether they worked.

### AI review

- Generate every Sunday in the user's timezone or on user-selected day.
- Include what shipped, what stalled, one honest observation, and one high-leverage action.
- Separate facts from interpretation visually.
- Link claims back to check-ins/evidence.
- Permit editing and regeneration with strict cost controls.
- Save the generation version so historical reviews do not change unexpectedly.

### Export foundation

- Add a private print-friendly review layout.
- Support Markdown copy in this phase.
- Defer polished public images/PDF to premium unless implementation is trivial.

### Exit criteria

- Reviews are generated once per project/week despite retries.
- Every factual metric can be reproduced from stored events.
- Users can edit the narrative without altering source events.
- Founder receives and uses two consecutive weekly reviews.

---

## Phase 7 — Private beta and production hardening

### Objective

Validate the loop with real builders and make the free product reliable enough to charge for later.

### Beta program

- Recruit 20–50 builders with an active project and a real target date.
- Onboard them manually enough to observe confusion, but do not hide product problems with concierge work.
- Run weekly interviews with active, stalled, and churned users.
- Record why users miss check-ins and whether nudges help or annoy.
- Maintain a feedback taxonomy: onboarding, timing, AI accuracy, tone, privacy, bugs, missing value.

### Quality work

- Add end-to-end tests for signup, project setup, scheduled prompt simulation, check-in, miss recovery, weekly review, pause, and ship.
- Test mobile web even though native mobile is excluded.
- Run accessibility audit to WCAG 2.2 AA targets.
- Add load tests for due-prompt scans and concurrent check-ins.
- Add backup/export verification and restore drill.
- Add account export and deletion workflow.
- Create support, incident, and data-deletion runbooks.

### Security work

- Threat-model auth, IDOR, prompt injection, malicious URLs, webhook replay, OAuth token leakage, and notification abuse.
- Validate and safely render all user/model content.
- Add content-size limits and file restrictions before accepting uploads.
- Add rate limits and abuse monitoring.
- Review privacy policy, terms, refund policy, AI disclosure, and notification consent.
- Run dependency audit and remediate critical/high issues in reachable production paths.

### Beta success gate

Do not begin billing until:

- At least 30% of activated beta users remain accountable in week four, or qualitative evidence clearly identifies a fixable issue.
- At least five users report a behavior-changing intervention.
- Notification complaints are low and unsubscribe works reliably.
- AI factual-memory errors are rare and observable.
- The core loop has no known severity-one data-loss or authorization issue.

---

## Phase 8 — Premium plans and Razorpay billing

### Objective

Charge for proven power-user value without weakening the free product's one-project focus.

### Pricing hypothesis

- Free: one active project, core check-ins, basic streak, concise weekly review.
- Pro: target ₹999–₹1,499/month or regional equivalent, validated through interviews and checkout experiments.
- Consider annual pricing only after monthly retention is understood.
- Do not advertise “unlimited AI.” Define fair-use and transparent limits.

### Premium capabilities

- Multiple active projects.
- Deeper longitudinal pattern analytics.
- Full review history and month-over-month analysis.
- GitHub activity integration when Phase 9 launches.
- Rich export/share formats.
- Advanced cadence controls and notification windows.
- Longer insight history and premium model usage only if it improves outcomes.

### Razorpay implementation

- Create plans/products in Razorpay with environment-specific IDs.
- Create checkout/order server-side only.
- Attach internal user ID through provider-supported notes/metadata.
- Verify webhook signatures using raw request body.
- Handle subscription authenticated, activated, charged, pending, halted, cancelled, paused, and resumed events.
- Store webhook event IDs and process exactly once.
- Treat provider webhooks—not redirect success pages—as billing truth.
- Add billing management, cancellation, renewal date, invoices/receipts, and failed-payment messaging.
- Add grace period and downgrade behavior that never deletes projects.
- On downgrade, let the user choose the one primary active project; pause extras safely.
- Add refund/support workflow and reconciliation job.

### Entitlements

- Centralize plan capabilities in one typed module.
- Enforce limits in Convex mutations, not only UI.
- Store entitlement snapshots for auditability.
- Add feature flags for staged premium rollout.
- Test every limit and transition: free → pro, pro renewal, failed payment, cancellation, expiry, refund, downgrade.

### Exit criteria

- Razorpay test-mode lifecycle passes end to end.
- Duplicate/out-of-order webhooks produce correct subscription state.
- A failed payment does not lose user data.
- Free users encounter the one-project boundary naturally.
- At least three beta users complete a real paid transaction or explicit paid pilot.
- At least one free user reaches the one-active-project limit or requests GitHub/pattern features strongly enough to attempt payment without a founder manually pushing the sale.

---

## Phase 9 — GitHub integration, deeper analytics, and builder exports

### Objective

Use verified builder activity to improve accountability and create a premium reason to stay—without treating commits as the only valid work.

### GitHub integration strategy

- Prefer a GitHub App for repository-scoped permissions and webhook delivery; use OAuth only where appropriate.
- Request the minimum read-only permissions needed.
- Let users explicitly select repositories per project.
- Explain what is and is not read.
- Support disconnect and deletion of synchronized data.
- Encrypt or provider-manage tokens and never log them.

### Activity ingestion

- Ingest commits, pull requests, merges, releases, and deployment signals.
- Verify webhook signatures and deduplicate event IDs.
- Backfill a limited window after connection.
- Handle renamed, transferred, private, and deleted repositories.
- Respect GitHub rate limits and retry guidance.
- Show sync status and last successful sync.

### Accountability behavior

- Cross-reference check-ins with verified activity carefully.
- Useful wording: “I did not see activity in the connected repository for six days. Was the work happening elsewhere?”
- Never say the user lied.
- Allow non-code work such as research, design, sales, deployment, and customer interviews.
- Let users mark repositories temporarily irrelevant.

### Premium analytics

- Month-over-month check-in consistency.
- Common stall stage: ideation, initial build, integration, polish, launch, or post-launch.
- Repeated blocker categories.
- Average carry-forward count for next actions.
- Best check-in day/time.
- Recovery patterns that worked.
- GitHub activity trend versus self-reported progress, with clear caveats.

### Export/reflect

- Generate editable project retrospectives.
- Export Markdown, PDF, and a social-image summary.
- Include shipped work, lessons, blockers, and next steps.
- Never expose private check-ins by default.
- Add a “build in public” variant optimized for sharing on X without auto-posting.

### Exit criteria

- Repository activity arrives reliably and idempotently.
- Users can disconnect GitHub and remove synchronized data.
- AI never treats no commits as definitive proof of no progress.
- At least one user publishes an exported retrospective voluntarily.

---

## Phase 10 — Public commitment pages and organic growth loop

### Objective

Turn successful accountability outcomes into opt-in distribution only after paying users validate the product.

### Public commitment pages

- Explicitly opt-in and private by default.
- Custom public slug with reserved-word protection.
- Show project title, definition of shipped, target date, current status, and optionally streak.
- Give users field-level visibility controls.
- Never expose raw check-ins, private reasons, emails, repository names, or AI pattern insights by default.
- Add unpublish, robots/noindex control, report-abuse, and link-preview metadata.
- Cache public pages safely without leaking private state.

### Referrals

- Generate simple invite links.
- Attribute click, signup, activation, and conversion.
- Reward only after an activation or paid threshold.
- Add self-referral, duplicate-account, refund, and abuse controls.
- Keep incentives modest; the product result should be the main reason to share.

### Content loop

- Turn completed weekly reviews and shipped projects into editable public artifacts.
- Provide X-ready text and image but require user confirmation before publishing.
- Preserve honest metrics; do not fabricate streaks, revenue, or progress.
- Track share creation and referred activation, not vanity impressions alone.

### Exit criteria

- Public pages expose only fields explicitly approved by the owner.
- Referral attribution survives signup and OAuth flows.
- Abuse and unpublish workflows are operational.
- Growth features are retained only if they produce activated builders, not empty traffic.

---

## Phase 11 — General availability and operational maturity

### Objective

Launch publicly with predictable operations, support, security, costs, and incident response.

### Production readiness checklist

- Separate production Convex deployment and external provider accounts.
- Automated CI/CD with preview environments and protected production deployment.
- Database indexes reviewed against actual query patterns.
- Scheduled-job dashboards and alerts for backlog, failure, and duplicate delivery.
- AI latency, schema failure, fallback, and cost alerts.
- Email bounce/complaint alerts and suppression handling.
- Billing reconciliation and webhook failure alerts.
- OAuth integration health and token-refresh monitoring.
- Error budgets and severity definitions.
- On-call/owner contact and incident communication templates.
- Daily backup/export strategy and tested restore process.
- Data retention, deletion, and legal policy implementation.
- Status page and support contact.

### Performance targets

- Public and authenticated initial pages meet agreed Core Web Vitals targets.
- Non-AI mutations feel immediate and use optimistic UI safely.
- Check-in save completes independently of model latency.
- Typical AI response appears within an acceptable target measured at p50/p95.
- Due-prompt processing completes within the delivery window at projected launch volume.

### Launch plan

- Begin with a controlled cohort, then increase access gradually.
- Create an onboarding checklist and short demo.
- Publish transparent free/pro limits.
- Use founder's own real project history as the first case study.
- Maintain a public changelog.
- Review activation, recovery, retention, cost, and support every week for the first eight weeks.

### Exit criteria

- No unresolved critical security or data-loss issue.
- Monitoring covers all critical user journeys and scheduled jobs.
- Support and incident workflows have named owners.
- Unit economics are understood at current usage.
- Public launch can be rolled back without data loss.

---

## Phase 12 — Post-launch learning and defensibility

### Objective

Improve accountability outcomes using accumulated behavior—not by becoming a generic assistant.

Potential work, only when supported by data:

- Personalized recovery strategies based on what previously restored momentum.
- Deadline-risk forecast with transparent contributing signals.
- Project phase recognition and phase-specific interventions.
- Schedule recommendations based on actual response patterns.
- Comparison of planned versus observed effort.
- Private accountability partner, only if solo users repeatedly request it.
- Calendar/Linear/Notion integrations only when they reduce duplicate reporting.
- Mobile PWA improvements before considering native apps.
- Additional payment provider for international expansion.

Every new feature must answer:

1. Does it improve activation, accountable retention, recovery, or shipping?
2. Can we measure that improvement?
3. Does it preserve the focused builder-accountability identity?
4. Can we operate it securely and affordably?

---

## 8. AI quality and safety program

### 8.1 Prompt architecture

- Store prompts as versioned source files, not editable production strings.
- Separate classification, response generation, weekly review, and export prompts.
- Use structured schemas for all machine-consumed output.
- Provide only the minimum relevant history.
- Delimit user content and explicitly treat it as untrusted data.
- Do not allow check-in text to override system policies or request secrets.

### 8.2 Evaluation suites

- Single-check-in classification set.
- Longitudinal repeated-blocker set.
- Stall-detection set.
- Tone consistency set.
- Hallucinated-memory set.
- Prompt-injection set.
- Sensitive-content and crisis-language set.
- Multilingual/Indian-English set if that audience is targeted.
- Regression set built from anonymized, consented failure patterns.

### 8.3 Release gate for prompt/model changes

- Schema validity meets target.
- No regression in false accusation or hallucinated memory.
- Safety cases pass.
- Cost and latency impact are measured.
- A human reviews sampled outputs across all tones.
- Prompt/model version can be rolled back independently of application deployment.

### 8.4 Safety boundaries

- GrowthAI is not therapy or crisis support.
- Avoid shame, insults, coercion, threats, dependency language, or claims that the user is lazy.
- If a check-in indicates immediate danger or self-harm, stop accountability coaching and show appropriate crisis/support guidance based on the user's region where feasible.
- Allow users to mute blunt interventions immediately.
- Provide a report mechanism for harmful or incorrect responses.

---

## 9. Testing strategy

### Unit tests

- Plan entitlement rules.
- One-active-project invariant.
- Date, timezone, cadence, grace-window, and streak calculations.
- Prompt/missed/recovery state transitions.
- Billing state transitions.
- Webhook signature and idempotency helpers.
- AI output validation and fallbacks.
- GitHub event normalization.

### Convex integration tests

- Ownership enforcement on every user-data operation.
- Concurrent project creation for free users.
- Concurrent prompt completion.
- Duplicate schedule execution.
- Weekly review uniqueness.
- Billing and GitHub duplicate/out-of-order events.
- Archive/delete cascades and data export.

### Browser tests

- Email signup/login/logout/reset.
- GitHub OAuth callback and account link.
- Onboarding and project creation.
- Check-in with AI success and fallback.
- Streak update.
- Pause/resume/ship.
- Notification deep link.
- Upgrade/cancel/downgrade.
- GitHub connection/disconnection.
- Public page privacy controls.

### Non-functional tests

- Accessibility automation plus manual keyboard/screen-reader testing.
- Load tests for prompt scheduling and check-in submission.
- Security tests for IDOR, CSRF, XSS, malicious URLs, prompt injection, webhook replay, and rate limits.
- Restore drill and account-deletion verification.
- Responsive testing on common desktop and mobile web sizes.

---

## 10. Analytics event contract

Use stable versioned event names and avoid raw check-in content in analytics.

- `signup_started`, `signup_completed`.
- `onboarding_step_completed`, `onboarding_abandoned`.
- `project_created`, `project_paused`, `project_resumed`, `project_shipped`, `project_abandoned`.
- `prompt_scheduled`, `prompt_sent`, `prompt_opened`, `prompt_missed`.
- `checkin_started`, `checkin_completed`, `checkin_corrected`.
- `next_action_committed`, `next_action_completed`, `next_action_carried_forward`.
- `recovery_started`, `recovery_completed`.
- `weekly_review_generated`, `weekly_review_opened`, `weekly_review_edited`.
- `ai_response_rated`, `pattern_acknowledged`, `pattern_dismissed`.
- `paywall_viewed`, `checkout_started`, `subscription_activated`, `subscription_cancelled`, `payment_failed`.
- `github_connected`, `github_sync_completed`, `github_disconnected`.
- `export_created`, `public_page_published`, `referral_activated`.

Each event must document actor, timestamp, environment, schema version, allowed properties, and retention policy.

---

## 11. Definition of done for every feature

A feature is complete only when:

- Product behavior and edge cases are documented.
- UI includes loading, empty, success, error, offline/retry, and permission states.
- Mobile web and keyboard behavior are acceptable.
- Server-side authorization and input validation exist.
- Data indexes and retention implications are reviewed.
- Analytics events are implemented without private payload leakage.
- Unit/integration/browser coverage is proportional to risk.
- Observability identifies failure without exposing secrets.
- Accessibility is reviewed.
- Documentation and environment variables are updated.
- Feature flag and rollback path exist for high-risk functionality.
- Acceptance criteria have been demonstrated in preview.

---

## 12. Suggested execution sequence

The sequence below is intentionally strict:

1. Phase 0 product truth and pivot decision.
2. Phase 1 repository consolidation and foundation.
3. Phase 2 one-project commitment.
4. Phase 3 core check-in loop.
5. Fourteen-day founder dogfood period.
6. Phase 4 scheduling and recovery.
7. Phase 5 memory and stall detection.
8. Phase 6 weekly reviews.
9. Phase 7 private beta and hardening.
10. Only after beta evidence: Phase 8 premium billing.
11. Only after paying users: Phase 9 GitHub/analytics/export.
12. Only after paid retention: Phase 10 public growth loop.
13. Phase 11 public launch and operations.
14. Phase 12 learning-driven expansion.

Do not parallelize premium, growth, and core-loop work. The primary risk is not engineering speed; it is building a sophisticated product around an accountability interaction that has not yet proven it changes behavior.

---

## 13. Final launch standard

GrowthAI is ready for a serious public launch when a new builder can:

1. Understand the promise immediately.
2. Sign in safely with GitHub or email.
3. Make one deadline-bound project commitment.
4. Receive prompts at the promised local time.
5. Submit a check-in without losing data if AI fails.
6. Receive concise feedback grounded in their update and history.
7. Recover after missed check-ins without being shamed.
8. Review what shipped and what stalled each week.
9. Upgrade and cancel without billing ambiguity or data loss.
10. Connect GitHub optionally without granting unnecessary access.
11. Export or share only information they explicitly approve.
12. Delete their account and associated data reliably.

The product succeeds when users ship more consistently—not when they send more messages to an AI.
