# AI safety operations

GrowthAI is a planning product, not an emergency, medical, therapeutic, legal, or financial service. Automated safety routing must never imply that a clinician or human operator is monitoring a conversation.

## Immediate response

1. If an automated evaluation, user report, or support request identifies unsafe output, record the time, environment, request/support reference, model, prompt version, safety category, and outcome. Do not copy unnecessary conversation text into tickets or chat.
2. Set `GEMINI_DISABLED=1` in the affected runtime and redeploy if continued generation could cause harm. The deterministic safety and fallback paths remain available.
3. If the issue is isolated and can be bounded safely, disable the affected prompt/model release and restore the last evaluated prompt version.
4. Tell affected users only what is known. Never promise live crisis monitoring or clinical follow-up.
5. Direct an apparently imminent emergency to local emergency services. GrowthAI staff must not attempt diagnosis or intervention beyond the published safety response.

## Escalation ownership

- The on-call product/security owner is incident commander.
- A privacy owner decides whether user content may be inspected and limits access to the minimum necessary.
- A named engineering owner applies the kill switch or rollback.
- Legal or qualified safety counsel must review material harm, recurring unsafe behavior, or disclosure obligations before public statements.

If these roles are not assigned for an environment, that environment must not be opened to public users.

## Review and recovery

1. Preserve sanitized technical evidence: hashes/IDs, timestamps, versions, status codes, and redacted output classifications.
2. Add a synthetic regression case to the versioned safety suite. Never turn a user's private message directly into a fixture.
3. Document root cause, affected scope, mitigations, owner, and due dates.
4. Require the full safety, provider-contract, durability, and end-to-end suites before re-enabling generation.
5. Re-enable in staging first, run the model-specific evaluation, then use a controlled production rollout with monitoring.
6. Close the incident only after the regression is passing and the prompt/model changelog is updated.

## Quarterly exercise

Run a synthetic drill that covers a crisis prompt, prompt injection, provider timeout, malformed structured output, rate limiting, kill-switch activation, rollback, and recovery. Record the date, participants, deployed SHA, prompt/model versions, evidence links, and follow-up tasks in the release record.
