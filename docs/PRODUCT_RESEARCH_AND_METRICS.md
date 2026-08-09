# Product research and measurement

## Initial hypothesis—not a customer claim

The initial ICP is an English-speaking solo knowledge worker, independent builder, or early-stage founder managing one to three self-directed priorities. The recurring problem is not “the whole of life”; it is turning an ambiguous, stuck moment into one approved, manageable next action and learning from the result within a week.

Job to be done: “When I am circling an important self-directed priority, help me clarify what is actually blocking it, choose a small experiment, and revisit evidence without turning the process into pressure.”

Likely alternatives to investigate are notes, a generic chatbot, a task manager, journaling, a coach, and doing nothing. The hypothesized trigger is repeated avoidance or uncertainty before planning a day or week. The desired outcome is one credible next action and a calmer plan the user returns to. The reason to pay must be demonstrated by repeated use; the current paid distinction is only a larger active-goal limit.

GrowthAI deliberately does not provide therapy, diagnosis, crisis support, medical/legal/financial direction, calendar operation, voice coaching, behavioral advertising, streaks, wellbeing scores, or autonomous action on third-party services. Public messaging is therefore centered on solo builders and knowledge workers moving one ambiguous self-directed priority into a small approved action; landing-page walkthroughs are explicitly labeled as synthetic examples, not customer outcomes.

## Interview gate

Do not treat the ICP as validated until 20–30 interviews are recorded. Use the same guide:

1. Tell me about the last time an important self-directed priority felt stuck.
2. What triggered the moment, and what did you do next?
3. Which tools or people did you use? What was useful or frustrating?
4. How frequently does this happen, and what does it cost you?
5. Show the artifacts you used, if comfortable; do not ask for sensitive content.
6. What would a credible improvement look like one day and one week later?
7. What would make an AI tool unacceptable or unsafe here?
8. What have you paid for, or seriously considered paying for, to solve it?

Store participant consent, cohort, date, researcher, redacted notes, and withdrawal status in the approved research system—not source control. Do not publish quotes, testimonials, or outcomes without explicit publication consent and substantiation.

Design-partner consent must separately cover product feedback, use of de-identified usage events, optional recording/transcription, retention period, team access, withdrawal, deletion, and whether a quote may ever be published. Complimentary design-partner access uses the audited `design_partner` grant source and a fixed expiry.

The ranked hypothesis list remains blocked on real interview evidence. Populate it only after synthesis; never backfill fictional participants or supporting quotes.

## Metric definitions

- Activation: a user records product activity and accepts at least one AI-proposed task. The version is `core-loop-v1`.
- Day-1 / Day-7 retention: an activated user has a later privacy-safe product event at least 1 / 7 days after their first event.
- Week-4 retention: evaluate an activated cohort for activity at least 28 days later once the observation window exists.
- Paid retention: an activated paid cohort remains provider-entitled at the selected renewal boundary.
- Task completion: completed task events divided by accepted task events; deferral and dismissal are reported separately.
- Weekly return: unique activated users viewing a source-backed report in a later week.
- Conversion: signed subscription activations divided by checkout starts, segmented by catalog plan.
- Latency: p95 stored end-to-end assistant latency. Initial operational target: under 8 seconds; revise only with measured user tolerance.
- AI fallback: assistant generations whose outcome is not provider success.
- Unit cost: recorded model cost divided by active users for the same period.

Admin → Analytics shows content-free funnel counts, activation, returns, p95 latency, fallback, and unit cost. Events include identifiers and plan but never message text, task titles, or goal content. Validate event totals against task, message, report, and subscription source tables before decisions.

Paid acquisition remains off until multiple cohorts demonstrate Week-4 return and interviews show the workflow solves the named problem. Predeclare experiment primary metric, duration, minimum sample, and guardrails (deletion, report-response, payment failure, and support rates) before changing pricing or messaging.
