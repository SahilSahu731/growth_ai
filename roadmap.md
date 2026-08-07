# GrowthAI Product and Engineering Roadmap

This is the ordered execution plan for taking GrowthAI from a polished private alpha to a secure, trustworthy, scalable paid product. It covers the known repository findings, missing launch requirements, and the product capabilities needed to create a defensible business.

The missing Gemini API key and Razorpay credentials are intentionally not treated as defects in this roadmap. Tasks for making those integrations correct, safe, testable, and production-ready remain included.

## Implementation status — 2026-08-07

Checked items below are implemented in this working tree and backed by the verification commands in this status record. Unchecked items are intentionally not claimed as complete. Tasks requiring provider, deployment, encrypted-storage, or GitHub authority have exact instructions in [docs/EXTERNAL_COMPLETION_STEPS.md](docs/EXTERNAL_COMPLETION_STEPS.md).

Current evidence: secret scan, production dependency audit (0 vulnerabilities), license review, lint, both TypeScript checks, 80 unit/integration/authorization tests, coverage thresholds, and the optimized production build pass. The expanded 22-case desktop/mobile Playwright and axe suite is committed but must run in CI or a host that permits Chromium; this workspace blocks Chromium sandbox startup. Production environment validation intentionally fails until the external domain, legal contacts, scoped keys, and named MFA administrator values are supplied.

## How to use this roadmap

- Work from top to bottom. Do not begin a later release gate while a blocking item in an earlier gate remains open.
- Every checkbox represents a testable deliverable, not an activity such as “look into” or “consider.”
- Mark an item complete only when its acceptance criteria are satisfied in development, preview, and production where applicable.
- Add the pull request, test, decision record, or incident reference beside a completed item.
- Any new production feature must include authorization, validation, observability, accessibility, tests, documentation, and rollback behavior.
- Never use real customer data in local development, screenshots, fixtures, or automated tests.

## Release gates

| Gate | Meaning | Shipping rule |
| --- | --- | --- |
| G0 | Emergency containment | Complete before sharing the repository or onboarding additional testers |
| G1 | Correct private alpha | Complete before relying on stored user data or AI output |
| G2 | Trustworthy public beta | Complete before inviting the general public |
| G3 | Paid launch | Complete before accepting live payments |
| G4 | Product-market-fit system | Complete before meaningful paid acquisition |
| G5 | Scale and operational maturity | Complete before high-volume or team/enterprise use |

---

# G0 — Emergency containment and repository safety

## 0.1 Revoke and remove the historical credential

- [ ] Revoke or rotate the Google API key that appeared in commit `802e957e7765594389d9f10bc2713bb1db4384e7`.
- [ ] Search every branch, tag, stash, reflog, release artifact, CI log, deployment log, backup, and fork for the exposed value without printing it into new logs.
- [ ] Purge the secret from Git history with `git filter-repo` or BFG.
- [ ] Coordinate the history rewrite before force-pushing shared branches.
- [ ] Require every collaborator to discard old clones or correctly rebase onto the cleaned history.
- [ ] Confirm a fresh clone and full-history secret scan no longer find the credential.
- [ ] Enable repository secret scanning and push protection.
- [x] Add a documented credential-rotation procedure.

### Checkpoint 0.1

- [ ] The old credential is rejected by the provider.
- [ ] A clean clone contains no copy of it in any reachable ref.
- [ ] Secret scanning blocks a controlled test secret before it reaches the main branch.

## 0.2 Secure local data and environment files

- [x] Inventory the contents and owners of every file under `backups/`.
- [ ] Move real Convex exports out of the project workspace into access-controlled encrypted storage.
- [ ] Securely remove unnecessary local copies after the protected backup is verified.
- [ ] Replace local real-user data with synthetic fixtures.
- [x] Change `.env.local` permissions to owner-only access (`0600`) on supported systems.
- [x] Confirm `.env*`, database exports, screenshots, logs, coverage artifacts, and local AI transcripts are ignored by Git.
- [x] Add a pre-commit secret and sensitive-file scan.
- [x] Define encrypted backup retention, rotation, restoration, and deletion procedures.
- [x] Document how deleted user data expires from backups.
- [ ] Run and record a backup restoration drill using synthetic data.

### Checkpoint 0.2

- [ ] No real user record exists in the repository workspace or developer fixtures.
- [ ] Backups are encrypted, access-controlled, retention-limited, and restorable.
- [ ] A clean working tree cannot accidentally stage an environment file or export.

## 0.3 Establish release control

- [ ] Protect the main branch and require reviewed pull requests.
- [ ] Require `lint`, both TypeScript checks, tests, a production build, secret scanning, and dependency scanning before merge.
- [x] Add CODEOWNERS for authentication, billing, Convex schema/functions, privacy, and deployment configuration.
- [x] Define development, preview, staging, and production environments with distinct credentials and datasets.
- [x] Add a release checklist and rollback owner.
- [ ] Record the currently deployed commit SHA and schema version in each environment.
- [x] Add typed environment-schema validation that fails startup/build for missing, malformed, insecure, or mutually inconsistent production values.
- [x] Remove undocumented and unused variables such as legacy admin-login and Convex-site values after confirming there are no consumers.
- [x] Keep `.env.example`, setup guides, deployment configuration, and validation schema synchronized.
- [x] Validate that public/browser-prefixed variables never contain secrets.

### G0 exit criteria

- [ ] All known leaked credentials are revoked and removed.
- [ ] Real data is no longer stored in the workspace.
- [ ] Main-branch changes cannot bypass basic security and verification checks.

---

# G1 — Data correctness, authentication, and safe AI foundations

## 1.1 Add regression tests before repairing invariants

- [x] Add a Convex test harness with isolated synthetic users and data.
- [x] Add a regression test proving a conversation with more than 80 messages returns the newest messages.
- [x] Add tests for goal creation, editing, completion, archiving, reopening, and deletion.
- [x] Add tests proving every plan's active-goal limit applies to both creation and reactivation.
- [x] Add tests for duplicate goal titles during create and update.
- [x] Add tests for task transitions between `todo`, `done`, and `dismissed`.
- [x] Add tests proving `completedAt` is set and cleared consistently.
- [x] Add tests for the three-task daily limit, including concurrent acceptance.
- [x] Add a test preventing an empty goal when all proposed tasks are rejected by limits.
- [x] Add tests for conversation deletion and retained task origins.
- [x] Add tests for duplicate and concurrent message submissions.
- [x] Add tests for generation failure after a user sends a message.
- [x] Add tests for account export and deletion with a large synthetic account.
- [x] Expand coverage collection beyond `src/lib/**/*.ts` to routes, server actions, Convex functions, authorization, billing, and critical components.
- [x] Publish coverage by subsystem so a narrow library score cannot be mistaken for application coverage.
- [x] Establish a ratcheting coverage baseline that cannot fall on changed critical code.
- [x] Add Playwright setup for desktop and mobile critical journeys.
- [x] Add contract tests at the Next.js-to-Convex and Next.js-to-model boundaries.
- [x] Keep unit tests fast while running integration and end-to-end suites as separate CI jobs.

## 1.2 Fix message durability and history

- [x] Fetch the newest message window rather than the oldest 80 messages.
- [x] Return messages in stable chronological order after fetching the newest page.
- [x] Add cursor pagination or infinite history loading.
- [x] Persist the user message before invoking the model.
- [x] Store an explicit assistant-generation state such as `pending`, `complete`, `failed`, or `cancelled`.
- [x] Allow a failed assistant response to be retried without duplicating the user message.
- [x] Generate a client request/idempotency key for every submitted message.
- [x] Enforce idempotency in the database for retries, double clicks, multiple tabs, and flaky connections.
- [x] Define ordering behavior for two valid simultaneous messages in one conversation.
- [x] Preserve the unsent draft locally when navigation or connectivity interrupts submission.
- [x] Replace the inaccurate “Your message was not lost” copy with state that reflects actual persistence.

### Checkpoint 1.2

- [x] A 500-message conversation can load recent messages and paginate to the beginning.
- [x] Replaying the same request 10 times creates one user message and one assistant generation.
- [x] A forced model outage leaves the user message visible and retryable.

## 1.3 Repair goal and task invariants

- [x] Centralize active-goal-limit enforcement in one server-side function used by user and admin mutations.
- [x] Enforce the limit when a goal is created, reopened, restored, or changed by an administrator.
- [x] Clear `completedAt` when a goal is reopened.
- [x] Set `completedAt` only when the goal is currently complete.
- [x] Recheck normalized duplicate titles when a goal title changes.
- [x] Define whether archived goals may retain completion timestamps and test that rule.
- [x] Clear task `completedAt` whenever its status is no longer `done`.
- [x] Make weekly completion metrics require both an in-range completion timestamp and the correct status.
- [x] Check task capacity before creating a goal from an AI proposal.
- [x] Make goal creation and task acceptance atomic.
- [x] Prevent two concurrent proposals from exceeding daily or plan limits.
- [x] Return specific, user-safe error codes for every rejected invariant.
- [x] Add an undo path for task completion and dismissal.

### Checkpoint 1.3

- [x] Limits cannot be bypassed through any user, AI, admin, retry, or concurrent path.
- [x] Dashboard and weekly statistics match independently queried source records.

## 1.4 Strengthen data modeling and referential integrity

- [ ] Replace string record identifiers with native Convex IDs where practical.
- [ ] Replace ISO timestamp strings with consistently indexed numeric timestamps where practical.
- [x] Add indexes for every user-owned, status, date, conversation, subscription, and admin-list lookup.
- [x] Define explicit behavior for tasks retained after their source conversation is deleted.
- [x] Null, snapshot, or model deleted source references instead of leaving accidental dangling IDs.
- [x] Prevent conversation creation for a missing or deleted user.
- [x] Prevent orphaned goals, tasks, messages, subscriptions, and preferences.
- [x] Split public user projections from authentication records so password hashes can never be returned accidentally.
- [x] Model account state explicitly (`active`, `suspended`, `deletion_pending`, `deleted`) instead of overloading `deletedAt`.
- [x] Add suspension reason, actor, timestamp, review, and reversal fields.
- [x] Add schema migration notes and rollback steps for each model change.

## 1.5 Correct member authentication flows

- [x] Read, validate, and honor a same-origin `callbackUrl` during Google sign-in.
- [x] Reject external or malformed callback destinations.
- [x] Stop automatically creating a new chat on every successful login.
- [x] Create a conversation only after an explicit New Chat action or first submitted message.
- [x] Store provider subject/account identifiers in addition to email.
- [x] Require and record provider-verified email before linking an account.
- [x] Define safe account-linking behavior when providers share an email.
- [x] Stop overwriting user-controlled profile names on every OAuth login.
- [x] Replace production auth errors with user-safe copy, a retry action, support path, and request ID.
- [x] Remove server configuration instructions from public error pages.
- [x] Remove the dormant credentials/password and GitHub auth code unless those providers are intentionally completed.
- [x] If credentials auth is retained, implement verification, resets, email ownership checks, breach-resistant hashing, throttling, MFA, tests, and documentation before exposing it. *(Not applicable: credentials auth was removed.)*
- [ ] Add integration tests for login, logout, callbacks, session expiry, deleted users, suspended users, and provider errors.

## 1.6 Migrate and harden the AI integration

- [x] Replace `@google/generative-ai` with the supported `@google/genai` SDK.
- [x] Replace the retired `gemini-2.0-flash` default with a currently supported model selected from official documentation.
- [x] Keep the model name environment-configurable and validate it at startup.
- [x] Use a true system instruction instead of concatenating all trusted and untrusted content into one prompt string.
- [x] Use an SDK-supported structured-output schema rather than extracting JSON with brace/fence heuristics.
- [x] Validate all model output again on the server before saving it.
- [x] Validate scheduled dates as real calendar dates in the user's timezone.
- [x] Handle blocked output, truncation, refusal, malformed structure, timeout, and provider overload separately.
- [x] Always clear timeout resources in `finally`.
- [x] Persist model, prompt version, latency, outcome, retry count, and token/cost metadata without storing unnecessary sensitive text.
- [x] Pass the selected `coachTone` into the operator prompt and verify visibly different supported tones.
- [x] Define a deterministic fallback contract matching the structured model contract.
- [x] Version prompts and maintain a changelog/evaluation score for every prompt release.

## 1.7 Build an AI safety layer independent of the model

- [x] Run crisis and high-risk classification before every model call, including configured-provider paths.
- [x] Prevent task/goal generation when a safety response should take precedence.
- [x] Provide locale-aware crisis resources with clear emergency language.
- [x] Add boundaries for medical, legal, financial, diagnostic, therapeutic, abusive, delusional, and dependency-forming requests.
- [x] Add prompt-injection and data-exfiltration defenses.
- [x] Ensure retrieved user text is always treated as untrusted data.
- [x] Add per-user and per-IP generation limits.
- [x] Add concurrent-generation limits per conversation and user.
- [x] Add daily token/cost budgets and a global provider circuit breaker.
- [x] Add a kill switch that disables model calls while preserving the deterministic fallback.
- [x] Create a versioned safety evaluation suite with ordinary, adversarial, multilingual, and ambiguous cases.
- [x] Require the safety suite to pass before prompt or model changes deploy.
- [x] Define human escalation and incident review procedures without implying live clinical support.

### Checkpoint 1.6–1.7

- [ ] The supported model passes structured-output, safety, prompt-injection, timeout, and fallback tests.
- [x] A provider outage does not lose messages or make the core product unavailable.
- [x] Unsafe prompts never create goals or tasks before the safety response is shown.

## 1.8 Make preferences truthful and functional

- [x] Detect the browser timezone after sign-in and ask before replacing an existing explicit choice.
- [x] Validate IANA timezone names server-side.
- [x] Use timezone consistently for Today, scheduled tasks, weekly windows, reports, reminders, and billing display. *(No reminder delivery exists yet; all current date surfaces use the saved timezone.)*
- [x] Decide whether locale is a supported feature; use it for dates/content or remove the field and UI.
- [x] Make coach tone affect generation and previews or remove the control.
- [x] Remove the email-summary toggle until delivery exists, or implement it fully in G3.
- [x] Distinguish required service communication from optional marketing/product communication.
- [x] Record preference changes and make them exportable/deletable.

### G1 exit criteria

- [ ] All regression tests above pass in CI.
- [x] User messages survive provider and network failures.
- [x] Goal/task limits and statistics are correct under concurrency.
- [x] Authentication returns users to the intended safe destination.
- [x] The supported AI path has independent safety controls and a tested fallback.

---

# G2 — Security, privacy, accessibility, and public-beta trust

Production-only evidence and exact owner steps are tracked in `docs/EXTERNAL_COMPLETION_STEPS.md`; manual accessibility evidence uses `docs/ACCESSIBILITY_TEST_PLAN.md`.

## 2.1 Remove deployment authority from the application runtime

- [ ] Keep `CONVEX_DEPLOY_KEY` only in the deployment environment that runs Convex CLI operations.
- [x] Replace runtime deploy/admin-key authentication with a dedicated application identity using supported Convex authentication.
- [x] Grant the runtime only the capabilities required by member and service operations.
- [ ] Separate member, admin, webhook, background-job, preview, CI, and deployment identities.
- [x] Stop relying on a fixed token identifier as an additional security boundary.
- [x] Avoid mutable shared authentication state on a singleton Convex HTTP client.
- [x] Add authorization tests proving member, admin, webhook, and anonymous identities cannot call each other's functions.
- [ ] Rotate the old deploy credential after the migration.
- [x] Update `docs/CONVEX_SETUP.md` and architecture documentation.

### Checkpoint 2.1

- [ ] Removing the deploy key from the production web runtime does not break any user or admin flow.
- [ ] Compromising the web-runtime identity cannot deploy code or read unrelated data directly.

## 2.2 Replace the single-admin security model

- [x] Choose a managed administrator identity provider or a passkey/MFA-capable authentication design.
- [x] Require MFA for every administrator.
- [x] Remove plaintext production password support.
- [x] Require a dedicated 32-byte-or-stronger admin session secret; never fall back to member auth secrets.
- [x] Fail production startup when admin security configuration is weak or missing.
- [x] Implement roles such as support-read, support-write, billing, security-auditor, and owner.
- [x] Apply least privilege to every admin query and mutation.
- [x] Add step-up authentication for content access, plan changes, suspension, export, and deletion.
- [x] Add server-side session records, rotation, revocation, idle expiry, absolute expiry, and device/session listing.
- [ ] Add emergency access recovery with dual control and audit trails.
- [x] Rate-limit admin login by trusted IP, account, device signal, and global volume.
- [x] Do not trust arbitrary `x-forwarded-for` values outside a configured proxy boundary.
- [ ] Add exponential backoff and alerts for credential stuffing.

## 2.3 Make privileged access auditable

- [x] Audit every admin read of message content or sensitive user data.
- [x] Record actor, reason/ticket, target, action, timestamp, request ID, and result.
- [x] Require a support justification before opening conversation content.
- [x] Notify or disclose to users how support access works.
- [x] Separate audit storage permissions from ordinary admin permissions.
- [x] Make audit entries append-only in application code.
- [ ] Export audit records to tamper-evident external storage.
- [x] Define audit retention and access-review schedules.
- [ ] Add alerts for bulk reads, exports, repeated failures, plan changes, and deletions.

## 2.4 Publish accurate legal and trust surfaces

- [ ] Decide the production company/legal entity, jurisdiction, contact address, and canonical domain.
- [x] Add `/privacy` covering collected data, purposes, legal bases, AI providers, payments, analytics, retention, exports, deletion, support access, backups, and user rights.
- [x] Add `/terms` covering eligibility, acceptable use, subscription terms, cancellation, refunds, limitations, and dispute terms.
- [x] Add `/security` with accurate security practices and reporting contact.
- [x] Add `/ai-safety` explaining limitations, non-clinical status, safety behavior, and escalation resources.
- [x] Publish a subprocessor list including hosting, database, model, authentication, payment, email, analytics, and monitoring providers actually used.
- [x] Add accessible Privacy and Terms links on landing, pricing, login, signup, settings, and checkout surfaces.
- [x] Add an explicit model-processing notice before a user's first AI conversation.
- [x] Record acceptance of the applicable Terms/Privacy version where legally required.
- [x] Define minimum age and handle underage users appropriately.
- [x] Define data retention for messages, tasks, goals, generated output, model telemetry, billing, audit logs, and backups.
- [x] Align every “private” marketing statement with actual admin and provider access.
- [ ] Review the documents with qualified counsel before public launch.

## 2.5 Complete privacy controls

- [x] Let users delete individual conversations without accidental dangling references.
- [x] Let users delete or clear AI memory independently of account deletion.
- [x] Offer optional automatic message-retention periods.
- [x] Minimize content sent to model and monitoring providers.
- [x] Redact secrets and sensitive identifiers from logs and error reports.
- [x] Make export machine-readable, documented, complete, and timestamped.
- [x] Include preferences, subscription history, retained origin metadata, and legally exportable access history.
- [x] Make account deletion asynchronous, resumable, observable, and safe for large accounts.
- [x] Show deletion scope, billing prerequisites, cooling-off period, and backup-retention behavior accurately.
- [x] Preserve only legally required records after deletion and document why.
- [x] Add automated tests proving deleted users cannot authenticate or reappear through restoration jobs.
- [x] Create a data-subject-request workflow with identity verification and completion tracking.

## 2.6 Establish application security controls

- [x] Apply a nonce- or hash-based Content Security Policy to all routes.
- [x] Remove `unsafe-inline` where feasible.
- [ ] Add HSTS in production after HTTPS/domain readiness is confirmed.
- [x] Review COOP/COEP behavior around OAuth and payment windows.
- [x] Preserve frame, MIME, referrer, and permissions protections.
- [x] Add CSRF/origin validation for sensitive admin and account operations.
- [x] Add step-up confirmation for account deletion and irreversible actions.
- [x] Validate and normalize all server-action, route-handler, webhook, URL, color, date, and search inputs.
- [x] Validate announcement foreground/background contrast before publication.
- [x] Add dependency-update automation with grouped, reviewed upgrades.
- [x] Add SAST, secret scanning, dependency scanning, and license review to CI.
- [x] Establish a vulnerability-reporting process and `security.txt`.
- [ ] Run a focused external penetration test before paid launch.

## 2.7 Reach WCAG 2.2 AA on critical journeys

- [x] Define accessible semantic color tokens with at least 4.5:1 normal-text and 3:1 large-text contrast.
- [x] Increase supporting text that is currently 9–11px to a readable responsive scale.
- [x] Improve login security, support, legal, and muted-copy contrast.
- [x] Make interactive hit targets at least 44×44 CSS pixels where practical.
- [x] Add visible focus states that are not color-only.
- [x] Implement correct tablist roles, `aria-controls`, roving focus, and arrow-key navigation.
- [x] Stop auto-rotation on hover, keyboard focus, user interaction, and reduced-motion preference.
- [x] Provide an explicit pause control for rotating content.
- [x] Give announcement dialogs initial focus, focus trapping, Escape behavior, accessible names, and focus return.
- [x] Ensure a nondismissible announcement never prevents access to the application or assistive controls.
- [x] Replace noninteractive elements styled as links/buttons with actual controls or plain text.
- [x] Label icon-only buttons and expose state changes to assistive technology.
- [x] Verify form errors are associated, announced, and recoverable.
- [ ] Test landing, login, chat, tasks, settings, pricing, billing, export, delete, and admin journeys at 200% and 400% zoom.
- [x] Add automated axe checks to Playwright while retaining manual keyboard and screen-reader testing.
- [ ] Test with keyboard only, VoiceOver/Safari, NVDA/Firefox or Chrome, and mobile screen readers.
- [x] Fix invalid or ineffective classes such as `hover:text-red-650`.

## 2.8 Make public presentation accurate and consistent

- [x] Resolve “one active intention” versus the actual three-free-goal limit.
- [x] Remove claims for calendar, voice, deep memory, advanced insights, paid exports, founder badge/channel, and other unavailable capabilities.
- [x] Mark roadmap features clearly as planned or beta instead of implying availability.
- [x] Verify every marketing claim against an automated feature/entitlement test or documented product behavior.
- [x] Replace `/dashboard`, `/reviews`, and `/goals/[goalId]` redirects with real pages or remove all links/promises to them.
- [x] Add a real feedback/report-bug link to the development announcement.
- [x] Reframe the current development notice as a private/public beta message appropriate to the release stage.
- [ ] Verify the support email is owned, monitored, protected by SPF/DKIM/DMARC, and has response expectations.
- [x] Generate the copyright year rather than hard-coding it.
- [x] Point footer/account navigation at real destinations rather than routes that only redirect.
- [x] Remove the stray/overbroad `*:text-white` login selector and style intended elements semantically.
- [ ] Verify the oversized login headline and all auth content on 320px-wide devices.

### G2 exit criteria

- [ ] An external tester can understand what data is collected, who can access it, and how to delete it.
- [ ] Critical user journeys pass automated and manual accessibility checks.
- [ ] Runtime compromise does not expose deployment authority.
- [ ] All public claims describe capabilities that actually work.
- [ ] The application has a documented security owner and incident path.

---

# G3 — Billing correctness and paid-launch readiness

## 3.1 Repair the billing state machine

- [ ] Persist webhook receipt in a transaction that cannot be rolled back by downstream processing failure.
- [ ] Record processing status, failure category, retry count, next retry, and final disposition.
- [ ] Make every event handler idempotent by provider event ID and business transition.
- [ ] Handle duplicate, delayed, missing, and out-of-order events.
- [ ] Reject invalid signatures before parsing or mutating business state.
- [ ] Store only the minimum webhook metadata required for diagnosis and reconciliation.
- [ ] Add a dead-letter/replay workflow restricted to authorized administrators.
- [ ] Add scheduled subscription reconciliation against the payment provider.
- [ ] Expire or reconcile abandoned `created` checkouts so they cannot lock a user indefinitely.
- [ ] Handle cancellation at period end, immediate cancellation, payment failure, pause, resume, renewal, plan change, and refund states.
- [ ] Define access behavior during payment grace periods.
- [ ] Make entitlement updates monotonic and resilient to old events.
- [ ] Add alerts for webhook failures, reconciliation drift, and unexpected entitlement changes.

## 3.2 Create a single source of truth for plans

- [ ] Store price, currency, interval, limits, provider plan ID, availability, and feature entitlements in one typed plan catalog.
- [ ] Remove duplicated hard-coded amounts from UI and payment configuration.
- [ ] Define Free, Pro, Founder, and Team status explicitly; remove Team until it is a real product if necessary.
- [ ] Model complimentary/admin-granted access separately from paid subscriptions.
- [ ] Require source, reason, actor, start, expiry, and audit entry for complimentary access.
- [ ] Prevent ordinary administrators from silently assigning paid plans.
- [ ] Create one server-side entitlement API consumed by every route and mutation.
- [ ] Test every feature and limit against every plan and subscription state.
- [ ] Show taxes, billing interval, renewal behavior, cancellation, refund terms, and regional currency accurately.
- [ ] Add annual pricing only after unit economics and refund behavior are defined.

## 3.3 Deliver the features being sold

- [ ] Decide the exact paid-launch feature set and remove every unsupported promise.
- [ ] Gate paid capabilities on server-verified entitlements, never UI state alone.
- [ ] Make any paid export distinction real or list export as a privacy right rather than a paid feature.
- [ ] Implement Founder benefits or remove the tier.
- [ ] Implement a real feedback channel and founder designation if advertised.
- [ ] Do not advertise Calendar Operator until calendar authorization, sync, conflicts, privacy, revocation, and failure behavior are complete.
- [ ] Do not advertise Voice Coach until consent, audio storage, transcription, deletion, accessibility, cost, and safety behavior are complete.
- [ ] Do not advertise deeper memory until memory controls, provenance, correction, expiration, deletion, and model disclosure are complete.
- [ ] Do not advertise advanced insights until definitions, evidence, accuracy, and user controls are complete.

## 3.4 Complete transactional communication

- [ ] Select and configure an email delivery provider using separate environments.
- [ ] Create verified sending domains with SPF, DKIM, and DMARC.
- [ ] Add templates for receipt/confirmation, renewal, payment failure, cancellation, plan change, security alerts, export readiness, and deletion status.
- [ ] Create an email-delivery record with status, attempt count, provider ID, and error category.
- [ ] Implement retries and provider webhook processing.
- [ ] Separate mandatory transactional email from optional summaries/marketing.
- [ ] Add unsubscribe and preference controls for optional email.
- [ ] Add accessible plain-text alternatives.
- [ ] Test templates across major email clients and mobile widths.

## 3.5 Validate the complete paid lifecycle

- [ ] Test successful checkout from pricing, settings, and upgrade dialogs.
- [ ] Test authenticated return destinations after checkout and login.
- [ ] Test refresh/close/reopen during checkout.
- [ ] Test duplicate webhooks and browser retries.
- [ ] Test renewal, payment failure, grace period, recovery, cancellation, refund, and account deletion.
- [ ] Test provider outage and delayed webhook behavior.
- [ ] Verify a redirect alone never grants access.
- [ ] Verify unsigned or mismatched events never grant access.
- [ ] Reconcile provider records with application subscriptions and entitlements.
- [ ] Run the documented test-mode checklist and retain evidence.
- [ ] Add a kill switch that prevents new checkout while keeping existing users functional.

### G3 exit criteria

- [ ] A complete test-mode subscription lifecycle passes automatically and manually.
- [ ] Failed billing events remain visible and replayable.
- [ ] Prices and entitlements have one authoritative definition.
- [ ] Every advertised paid feature exists and is enforced on the server.
- [ ] Privacy, refund, cancellation, tax, and support information is visible before purchase.

---

# G4 — Build the product loop that earns retention

## 4.1 Define the initial customer and outcome

- [ ] Select one initial ideal customer profile and one high-frequency problem instead of targeting “the whole of life.”
- [ ] Interview at least 20–30 target users using a consistent research guide.
- [ ] Recruit a small design-partner cohort with explicit feedback and data-use consent.
- [ ] Define the job-to-be-done, current alternatives, triggering moment, desired outcome, and reason to pay.
- [ ] Define what GrowthAI will deliberately not do.
- [ ] Turn repeated interview evidence into a ranked product hypothesis list.
- [ ] Do not publish fabricated testimonials or unverified outcomes.

## 4.2 Instrument the core product funnel

- [ ] Define activation as a measurable event, such as a meaningful conversation followed by one accepted task.
- [ ] Define Day-1, Day-7, Week-4, and paid retention.
- [ ] Track privacy-conscious events for conversation started, evidence gathered, plan proposed, task accepted, task completed, report viewed, upgrade viewed, checkout started, and subscription activated.
- [ ] Avoid sending raw message text or sensitive goal content to analytics.
- [ ] Track funnel version, acquisition source, experiment assignment, and plan.
- [ ] Build internal dashboards for activation, retention, task completion, weekly return, conversion, latency, AI fallback, safety intervention, and cost per active user.
- [ ] Validate analytics event accuracy against source data.
- [ ] Add user-facing consent/control if the selected analytics implementation requires it.

## 4.3 Make chat feel dependable and fast

- [ ] Stream assistant output while preserving structured final data.
- [ ] Add a Stop generating action.
- [ ] Add retry/regenerate without duplicating approved tasks.
- [ ] Add copy, useful/not-useful feedback, and report-response actions.
- [ ] Add timestamps and clear pending/failed states.
- [ ] Support editing/resending a user message with explicit branch or history behavior.
- [ ] Preserve drafts between navigation and reloads.
- [ ] Show offline/reconnecting state.
- [ ] Keep the Today panel usable while generation runs.
- [ ] Add conversation archive, search, rename, and pagination.
- [ ] Avoid creating empty conversations.
- [ ] Set and monitor a p95 end-to-end response-latency target.

## 4.4 Create a real action-management experience

- [ ] Add Today, Upcoming, Completed, and Dismissed task views.
- [ ] Provide undo after completion and dismissal.
- [ ] Show completed work without cluttering the primary action view.
- [ ] Support rescheduling with timezone-safe dates.
- [ ] Explain why an AI-suggested task supports a goal.
- [ ] Let users edit AI proposals before acceptance.
- [ ] Handle overdue tasks without shame-oriented language.
- [ ] Support a deliberate defer/replan flow.
- [ ] Make task limits understandable before the user hits them.
- [ ] Measure proposal acceptance, task completion, deferral, and abandonment.

## 4.5 Build evidence-based weekly review

- [ ] Replace the three-count placeholder with a real weekly review.
- [ ] Show completed, deferred, dismissed, and overdue commitments.
- [ ] Cite the underlying conversations/tasks for each insight.
- [ ] Separate factual observations from AI hypotheses.
- [ ] Let users correct or reject an interpretation.
- [ ] Show changes from the previous week.
- [ ] Recommend no more than a small, bounded next-week focus.
- [ ] Store report versions and the source-data window used to generate them.
- [ ] Make the report accessible from a real route and history.
- [ ] Add sharing/export only with explicit privacy controls.

## 4.6 Build a meaningful Growth Map

- [ ] Define the Growth Map's entities: goals, evidence, recurring obstacles, experiments, outcomes, and confidence.
- [ ] Preserve provenance from every insight to user-confirmed evidence.
- [ ] Allow users to edit, dismiss, merge, and delete inferred patterns.
- [ ] Show uncertainty instead of presenting model guesses as facts.
- [ ] Visualize progress over time without reducing wellbeing to a manipulative score.
- [ ] Respect memory and retention controls.
- [ ] Add a dedicated route instead of redirecting to chat.
- [ ] Evaluate whether users understand and revisit it before putting it behind a paywall.

## 4.7 Add progressive onboarding without a long form

- [ ] Keep direct-to-chat entry while adding contextual onboarding.
- [ ] Explain what GrowthAI does and does not do before the first conversation.
- [ ] Ask for model-processing consent and capture timezone progressively.
- [ ] Demonstrate how proposals, approval, tasks, privacy, and deletion work.
- [ ] Add an optional example conversation using synthetic content.
- [ ] Let users skip nonessential setup.
- [ ] Measure onboarding completion and time to first value.

## 4.8 Implement notifications only when useful

- [ ] Research which reminder moments improve completion rather than create pressure.
- [ ] Implement weekly email summaries only after the weekly report is valuable.
- [ ] Add reminder scheduling in the user's timezone.
- [ ] Add quiet hours, frequency caps, snooze, unsubscribe, and per-channel preferences.
- [ ] Prevent duplicate sends through idempotency.
- [ ] Record delivery, bounce, complaint, and unsubscribe events.
- [ ] Let users preview and disable all optional reminders.
- [ ] Measure incremental retention rather than email open rate alone.

## 4.9 Improve marketing and conversion honestly

- [ ] Rewrite the homepage for the chosen customer and concrete outcome.
- [ ] Add a real product walkthrough using synthetic data.
- [ ] Add use cases based on observed customer problems.
- [ ] Add a feature comparison that exactly matches entitlements.
- [ ] Add pricing FAQ covering cancellation, refunds, privacy, AI limits, and support.
- [ ] Add genuine design-partner stories only with consent and substantiated claims.
- [ ] Add a trust section linking Privacy, Security, AI Safety, and subprocessors.
- [ ] Add a visible feedback/contact route.
- [ ] Define Founder tier quantity, eligibility, duration, and benefits or remove it.
- [ ] Do not add annual plans until retention supports the commitment.
- [ ] Test pricing and messaging changes with predeclared success metrics and guardrails.

### G4 exit criteria

- [ ] The initial customer and use case are supported by interview and usage evidence.
- [ ] Activation, retention, task completion, report return, conversion, latency, and unit cost are measurable.
- [ ] Weekly review and Growth Map provide traceable value beyond generic chat.
- [ ] Paid acquisition is not started until retained cohorts show repeat value.

---

# G5 — Performance, scale, reliability, and organizational maturity

## 5.1 Remove full-table and N+1 data access

- [ ] Replace admin user, content, activity, billing, audit, and search `.collect()` flows with indexed pagination.
- [ ] Paginate member conversations, goals, tasks, reports, and exports.
- [ ] Remove weekly-activity fan-out that loads a workspace for every conversation.
- [ ] Avoid repeatedly loading the same session, account, goals, and open tasks during one route render.
- [ ] Add query limits and continuation cursors to every potentially unbounded endpoint.
- [ ] Add load tests representing large users and large platform tables.
- [ ] Track query latency, rows/documents scanned, error rate, and payload size.
- [ ] Define and enforce maximum export and synchronous-mutation workloads.

## 5.2 Make destructive and large jobs resumable

- [ ] Convert account deletion into a staged background workflow.
- [ ] Tombstone access immediately, then delete data in bounded batches.
- [ ] Store job cursor, attempts, progress, failure, and completion state.
- [ ] Make deletion retries idempotent.
- [ ] Convert large export generation into an asynchronous expiring download.
- [ ] Authenticate every download and prevent predictable URLs.
- [ ] Add alerts and admin recovery actions for stuck jobs.
- [ ] Apply the same bounded-job design to reconciliation, retention cleanup, and notifications.

## 5.3 Add production observability

- [ ] Choose error monitoring, structured logging, metrics, and tracing providers with privacy review.
- [ ] Generate a request/correlation ID at the edge and propagate it through Next.js, Convex, model, email, and payment operations.
- [ ] Log structured event names and safe identifiers rather than raw content.
- [ ] Add dashboards for auth failures, generation failures, Convex errors, billing drift, job backlog, email failures, and admin activity.
- [ ] Add `/health` and readiness checks that validate critical dependencies without exposing secrets.
- [ ] Stop masking announcement database failures as successful empty responses.
- [ ] Add route-level error boundaries, loading states, and not-found pages outside admin.
- [ ] Define SLOs for availability, message durability, p95 latency, billing correctness, and deletion completion.
- [ ] Create actionable alerts with severity, owner, runbook, and anti-noise thresholds.

## 5.4 Establish delivery and incident operations

- [ ] Add a CI workflow for install, lint, typecheck, unit/integration tests, accessibility smoke tests, build, secret scan, and dependency scan.
- [ ] Use locked deterministic installs and pin supported Node/package-manager versions.
- [ ] Add preview deployments with synthetic isolated data.
- [ ] Add staging smoke tests after deployment.
- [ ] Add production canary/smoke tests that do not mutate customer data.
- [ ] Add feature flags and kill switches for AI, billing checkout, notifications, announcements, and major new experiences.
- [ ] Document database/schema migration sequencing and rollback limitations.
- [ ] Create rollback, degraded-mode, incident-response, credential-rotation, data-breach, provider-outage, and restore runbooks.
- [ ] Assign an on-call owner before the product has uptime promises.
- [ ] Run incident simulations for model outage, database outage, compromised admin, leaked secret, duplicate billing event, and failed deletion.

## 5.5 Optimize public performance and caching

- [ ] Make landing and pricing pages cacheable without calling `getServerSession` during the public server render.
- [ ] Personalize the account CTA through a small isolated client/session path.
- [ ] Prevent announcement loading from causing layout shift.
- [ ] Cache or server-render active announcements with explicit invalidation.
- [ ] Stop refetching the same announcement after every client-side pathname change.
- [ ] Remove unused UI components after verifying no dynamic consumers.
- [ ] Remove unused starter SVGs and dead assets.
- [ ] Remove unused dependencies after an import/build audit.
- [ ] Reduce font families, weights, and subsets.
- [ ] Convert the raster logo to a lightweight vector where appropriate.
- [ ] Create optimized favicon, Apple, maskable, and social-image assets.
- [ ] Measure route JavaScript, CSS, image, font, LCP, CLS, INP, and server response budgets in CI.
- [ ] Test on slow mobile hardware and constrained networks.
- [ ] Decide whether GrowthAI is an installable PWA; add a tested service worker/offline strategy or remove misleading installability signals.

## 5.6 Repair SEO and public metadata

- [ ] Choose one canonical production domain.
- [ ] Require `NEXT_PUBLIC_APP_URL` or an equivalent validated public URL in production builds.
- [ ] Use that single value for metadata, canonical URLs, sitemap, robots, OAuth documentation, JSON-LD, email links, and payment returns.
- [ ] Correct icon dimensions in metadata and the web manifest.
- [ ] Add a 1200×630 Open Graph image and large-image Twitter card.
- [ ] Add accurate Organization, SoftwareApplication/Product, and FAQ structured data where content exists.
- [ ] Ensure protected, admin, auth, preview, and duplicate pages are `noindex`.
- [ ] Submit and monitor sitemap/indexing only after canonical URLs are correct.
- [ ] Add public content only when it directly serves the chosen customer rather than generating generic SEO pages.

## 5.7 Refactor the design system

- [ ] Replace global overrides of generic utilities such as `.bg-white` and `.text-neutral-*` with semantic design tokens.
- [ ] Define tokens for canvas, surfaces, elevation, text, borders, accent, focus, danger, warning, success, and charts.
- [ ] Define component states for hover, focus, active, disabled, loading, error, and destructive actions.
- [ ] Decide whether light theme is supported; implement it fully or declare dark-only accurately.
- [ ] Add a component showcase with visual and accessibility regression tests.
- [ ] Remove or consolidate unused shadcn/Radix primitives.
- [ ] Establish responsive typography and spacing scales.
- [ ] Add visual-regression screenshots for landing, login, chat, settings, pricing, billing, reports, and admin.

## 5.8 Clean repository and type architecture

- [ ] Remove or properly configure the empty tracked `.codex` file.
- [ ] Remove empty/stale directories under compare, developer, goals, and unused libraries.
- [ ] Remove dead auth, GitHub, notification, preference, and placeholder code after confirming product decisions.
- [ ] Replace string-based Convex function references and `any` casts with generated typed APIs.
- [ ] Add explicit argument and return validators to public Convex functions.
- [ ] Reduce `no-explicit-any` suppressions and document unavoidable boundaries.
- [ ] Reevaluate `allowJs`, `skipLibCheck`, ES target, and experimental TypeScript settings.
- [ ] Add Node `engines` and a `packageManager` declaration.
- [ ] Add `clean` and safe cache-maintenance commands for generated artifacts.
- [ ] Update dependencies in reviewed batches, with special migrations for major Radix/Recharts/React/Tailwind changes.
- [ ] Remove extraneous optional packages where dependency resolution permits.
- [ ] Fix README's feature claims as implementation changes land.
- [ ] Update `docs/ARCHITECTURE.md`, `docs/CONVEX_SETUP.md`, auth/admin setup guides, and this roadmap after every architectural milestone.

## 5.9 Prepare team and enterprise capabilities only after demand

- [ ] Do not expose Team pricing until validated customer demand exists.
- [ ] If Team is validated, model organizations, membership, roles, ownership, invitations, transfer, and deletion explicitly.
- [ ] Separate personal conversations from organization-visible data.
- [ ] Add tenant-isolation tests at every query/mutation boundary.
- [ ] Add SSO/SAML, SCIM, domain verification, admin policies, and audit export only when required by customers.
- [ ] Add data residency, DPA, vendor review, and enterprise retention controls only with an operational owner.
- [ ] Price enterprise features from support/security cost and demonstrated value, not only seat count.

### G5 exit criteria

- [ ] Data access remains bounded under agreed load targets.
- [ ] Large deletion/export/reconciliation jobs are resumable and observable.
- [ ] Production has actionable telemetry, SLOs, runbooks, and tested rollback.
- [ ] Public pages meet defined performance and accessibility budgets.
- [ ] Team/enterprise functionality cannot cross tenant boundaries.

---

# Continuous workstreams

These checks apply to every phase and do not wait for a release gate.

## Security and privacy

- [ ] Review threat models whenever authentication, billing, AI, admin, sharing, integrations, or organizations change.
- [ ] Rotate production credentials on schedule and after personnel/provider changes.
- [ ] Review administrator access at least quarterly.
- [ ] Review subprocessors, retention, privacy copy, and data flows before adding a provider.
- [ ] Patch critical dependencies according to a documented response target.
- [ ] Repeat penetration testing after material architecture or authorization changes.

## AI quality and cost

- [ ] Run the safety and quality evaluation suite for every model, prompt, retrieval, or schema change.
- [ ] Review false-positive and false-negative safety cases.
- [ ] Track latency, tokens, cost, fallback, malformed output, and user feedback by model/prompt version.
- [ ] Sample outputs only through privacy-approved, access-controlled procedures.
- [ ] Maintain a provider/model rollback option.

## Product quality

- [ ] Review activation and retention by cohort every week during beta.
- [ ] Interview churned, retained, free, and paid users regularly.
- [ ] Remove features that add complexity without measurable user value.
- [ ] Validate every experiment with a primary metric and harm guardrails.
- [ ] Keep marketing, pricing, help text, and implementation synchronized.

## Engineering quality

- [ ] Require tests for every repaired bug and business invariant.
- [ ] Keep lint, TypeScript, tests, production build, secret scan, and dependency scan green.
- [ ] Track flaky tests and eliminate or quarantine them with an owner and deadline.
- [ ] Review bundle, query, latency, and cost budgets before releases.
- [ ] Keep generated artifacts, local exports, logs, and credentials out of source control.

---

# Definition of done for any roadmap item

An item is complete only when all applicable statements are true:

- [ ] Product behavior and edge cases are documented.
- [ ] Authorization and tenant/user ownership are enforced server-side.
- [ ] Input and output validation are implemented.
- [ ] Privacy, retention, and logging impact are reviewed.
- [ ] Accessibility works with keyboard and relevant assistive technology.
- [ ] Unit, integration, and end-to-end tests cover the happy path and failures.
- [ ] Telemetry detects failures without logging sensitive content.
- [ ] Loading, empty, error, retry, timeout, and offline states are handled.
- [ ] Documentation and customer-facing copy are accurate.
- [ ] Deployment, migration, feature flag, and rollback paths are known.
- [ ] The feature works on supported desktop/mobile browsers and responsive layouts.
- [ ] A named owner accepts ongoing operational responsibility.

---

# Final launch scorecard

The product is ready for a paid public launch only when every statement below is true:

- [ ] G0, G1, G2, and G3 exit criteria are complete.
- [ ] No known critical or high-severity security finding is open.
- [ ] No known path loses a persisted user message or bypasses a plan/data invariant.
- [ ] All advertised features exist and have tested server-side entitlements.
- [ ] Legal, privacy, AI safety, cancellation, refund, and support information is public and accurate.
- [ ] Admin access requires MFA, least privilege, step-up controls, and content-access auditing.
- [ ] The complete billing lifecycle passes in test mode and has reconciliation/replay operations.
- [ ] Critical journeys meet WCAG 2.2 AA and pass manual assistive-technology review.
- [ ] Production monitoring, alerts, backups, restoration, incident response, and rollback have been exercised.
- [ ] Activation, retention, task completion, conversion, latency, model failure, and unit cost can be measured accurately.
- [ ] At least one target customer cohort demonstrates repeat value beyond initial curiosity.

Completing this scorecard does not guarantee a million-dollar business. It creates the minimum trustworthy foundation on which retention, differentiated value, and sustainable growth can be built.
