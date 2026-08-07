# G1 data migration and rollout

The G1 schema changes are backward-compatible: new identity, account-state, message-generation, task-origin, and AI-usage fields are optional for existing records and required by new write paths where appropriate. Existing ISO timestamps and legacy string IDs remain readable during this release.

## Deployment order

1. Verify an encrypted backup and restoration drill using `docs/BACKUP_AND_DATA_HANDLING.md`.
2. Deploy the additive Convex schema and functions.
3. Run the Convex integration suite against an isolated deployment.
4. Deploy the matching Next.js commit.
5. Test Google login with an existing account and a new account.
6. Test a chat turn, forced provider failure/retry, goal reactivation, task undo, conversation deletion, export, and deletion.
7. Confirm new users have `providerAccountId`, `emailVerifiedAt`, and `accountStatus`.
8. Confirm new user messages have `requestId`, `generationStatus`, `usageDate`, and exactly zero or one reply.
9. Monitor authorization, schema validation, generation failure, rate-limit, and account-link conflicts.

## Lazy compatibility/backfill behavior

- An existing OAuth account is linked to Google's stable provider subject on its next verified login.
- Existing profile names are preserved rather than overwritten by provider updates.
- A missing `accountStatus` is interpreted as `suspended` when legacy `deletedAt` exists and `active` otherwise.
- Existing messages without generation fields remain ordinary historical messages.
- Existing tasks keep their legacy source IDs until their conversation is deleted; deletion snapshots source context and clears dangling identifiers.
- Existing ISO timestamps and legacy IDs remain supported. Replacing them with native Convex references/numeric timestamps requires a separately rehearsed dual-write/backfill/read-switch/cleanup migration and must not be combined with this correctness release.

## Native-ID and numeric-time follow-up

This migration requires access to a real staging copy and therefore cannot be declared complete from repository code alone:

1. Add optional native reference and numeric timestamp fields alongside legacy fields.
2. Dual-write both representations for at least one release.
3. Backfill in bounded, resumable batches; record cursor, counts, failures, and checksums.
4. Validate every reference resolves and timestamp values preserve ordering/timezone semantics.
5. Switch indexed reads to the new fields behind a feature flag.
6. Compare old/new query results in staging and production shadow reads.
7. Stop legacy writes only after the comparison is clean.
8. Remove old indexes/fields in a later release with another verified backup and rollback plan.

Never make legacy fields required or delete them in the same release that introduces the new representation.

## Rollback

The additive schema can coexist with the previous web application. If the new web release fails, redeploy the previous web commit while leaving optional fields and indexes in place. Do not roll back by deleting tables, fields, or newly written messages. Repair forward after preserving evidence and user content.
