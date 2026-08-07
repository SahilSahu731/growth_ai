# Communication preference policy

GrowthAI currently sends no email summaries, newsletters, product marketing, or promotional communication. The former email-summary control was removed because no delivery system exists; its legacy stored value is retained only for backward-compatible export/deletion and has no delivery effect.

When transactional delivery is introduced, required service communication must be limited to account security, authentication, billing receipts/failures/renewals/cancellation, requested exports, deletion status, and material terms/privacy changes where required. These messages must not contain promotional content and must not depend on marketing consent.

Marketing, product announcements, research invitations, tips, and nonessential summaries require a separate purpose-specific opt-in that is off by default, timestamped, versioned, exportable, immediately revocable, and enforced by the delivery service. Unsubscribing from optional communication must never suppress security, billing, export, or deletion messages.

Do not reintroduce a communication toggle until the preference schema, consent record, provider suppression sync, unsubscribe endpoint, tests, retention behavior, and accurate UI are implemented together.
