# AI prompt and safety changelog

## `growth-operator-v2` — 2026-08-07

- Migrated from the legacy Google Generative AI SDK to `@google/genai`.
- Replaced the shut-down Gemini 2.0 Flash default with `gemini-3.6-flash`.
- Moved trusted rules into a system instruction and isolated user content as untrusted data.
- Added a strict JSON response schema and retained server-side validation.
- Added pre-provider crisis and high-risk routing so safety does not depend on model compliance.
- Added limited multilingual crisis phrases and locale-aware emergency wording.
- Added medical, financial, legal, delusion, and emotional-dependency boundaries.
- Added real calendar-date validation, finish-reason handling, timeout cleanup, usage metadata, and a provider kill switch.
- Applied the saved coaching-tone preference to generation style without changing safety behavior.

Evaluation evidence is maintained in `src/lib/operator/orchestrator.test.ts`. A prompt version must not be released unless its safety and structured-output regression suite passes.

### Evaluation score

| Suite | Scenarios | Result | Release gate |
| --- | ---: | ---: | --- |
| Output parsing, date/task bounds, discovery/planning, and metadata | 6 | 6/6 | Pass |
| Multilingual crisis interception | 3 | 3/3 | Pass |
| Medical, financial, legal, delusion, and dependency boundaries | 5 | 5/5 | Pass |
| Mocked provider schema, safety block, timeout, overload, truncation, malformed output, circuit breaker, and kill switch | 7 | 7/7 | Pass |
| **Total** | **21** | **21/21 (100%)** | **Pass** |

This is a deterministic regression score, not a claim of clinical efficacy or a substitute for the provider-backed staging evaluation. Record a new table whenever the prompt, model, safety classifier, schema, or fallback changes; never overwrite an older release score.
