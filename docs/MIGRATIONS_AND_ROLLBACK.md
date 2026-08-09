# Migration sequencing and rollback

Use expand/migrate/contract:

1. Add optional fields, new tables, and indexes first. Deploy code that can read old and new shapes.
2. Backfill through bounded, resumable jobs with cursor, heartbeat, attempts, and observable progress.
3. Verify counts and invariants on staging, then a production canary. Do not log customer content.
4. Switch reads behind a kill switch where practical. Keep the old path until the observation window passes.
5. Contract/remove old fields only in a later reviewed release.

Application rollback does not reverse data mutations or Convex schema changes. A rollback is safe only if the previous release tolerates the expanded schema and any new enum values. Before deployment, record the previous artifact, flag state, migration version, verification query, and forward-fix owner.

For destructive migrations, take and verify a provider backup, rehearse restoration into an isolated deployment, and obtain privacy/operations approval. Never test restoration by overwriting production.
