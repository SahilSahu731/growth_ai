# Backup and local-data handling

## Classification

Convex exports are **restricted production data** when they contain user profiles, message content, goals, tasks, billing metadata, or identifiers. They must never be stored unencrypted in the repository workspace, committed to Git, attached to issues, copied into AI prompts, or used as development fixtures.

## Inventory recorded on 2026-08-07

Both files were owned by `sahil:sahil`, initially had mode `0644`, and were unencrypted ZIP archives. They were restricted to mode `0600` on 2026-08-07 as an interim control; this does not replace the required encrypted-storage migration and verified plaintext deletion.

| Local file | SHA-256 | Users | Conversations | Goals | Tasks | Messages | Subscriptions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `backups/convex-pre-cleanup-2026-08-05.zip` | `bf72cde2d57c0c8f5724d9c83b976006cdfd23f308a844a96880abd97a308b7f` | 1 | 1 | 3 | 9 | 14 | 0 |
| `backups/convex-pre-table-delete-2026-08-05-1158.zip` | `467b9eaa27fd6ad2b173a0cc279f2a9b3960310bc18bc91a124fce371d6968f4` | 2 | 11 | 3 | 9 | 24 | 0 |

The user records contain names and email addresses. The message records contain free-form conversation content and task proposals. The inventory intentionally does not reproduce those values.

## Required encrypted destination

Use a private object-storage bucket or encrypted backup vault that provides:

- Server-side encryption with a customer-managed key where available.
- A separate production-backup service account with write access.
- Read/restore access limited to named operators using MFA.
- Object versioning and deletion protection appropriate to the retention policy.
- Access logs and alerts for bulk download or policy changes.
- A region and processor agreement consistent with the published privacy policy.

Do not use a public share link, personal chat attachment, ordinary unencrypted drive folder, or a key stored beside the encrypted archive.

## One-time migration procedure

1. Create the restricted backup destination and recovery identity.
2. Generate or select a GPG recovery key whose private key is stored outside this machine. Do not use a passphrase typed into shell history.
3. Encrypt each export to that public key:

   ```bash
   gpg --output convex-pre-cleanup-2026-08-05.zip.gpg --encrypt --recipient YOUR_BACKUP_KEY_ID backups/convex-pre-cleanup-2026-08-05.zip
   gpg --output convex-pre-table-delete-2026-08-05-1158.zip.gpg --encrypt --recipient YOUR_BACKUP_KEY_ID backups/convex-pre-table-delete-2026-08-05-1158.zip
   ```

4. Upload only the `.gpg` files through the provider's authenticated CLI or console.
5. Download each uploaded object into a newly created temporary directory.
6. Verify its SHA-256 against the uploaded encrypted object's recorded checksum.
7. Decrypt in the temporary directory and verify the plaintext SHA-256 against the inventory table.
8. List the restored archive and validate JSONL syntax without printing records:

   ```bash
   unzip -t restored-export.zip
   unzip -p restored-export.zip users/documents.jsonl | jq -c . >/dev/null
   unzip -p restored-export.zip operatorMessages/documents.jsonl | jq -c . >/dev/null
   ```

9. Record the test date, operator, storage object version, encryption-key ID, checksum result, and restore result in the backup register.
10. Only after steps 1–9 pass, remove the plaintext local exports using the operating system's approved secure-deletion method. On SSDs and copy-on-write filesystems, rely on full-disk encryption plus deletion/TRIM rather than assuming overwrite tools are effective.
11. Confirm `find backups -type f` returns no real-data export.

## Schedule and retention

Until legal/privacy review sets a stricter policy, use this baseline:

- Create an encrypted automatic backup daily.
- Retain daily backups for 14 days.
- Retain weekly backups for 8 weeks.
- Retain monthly backups for 6 months.
- Do not retain ad hoc developer exports after their verified operational purpose ends.
- Rotate the encryption key annually and immediately after suspected compromise or access removal.
- Review backup readers quarterly.
- Test a synthetic restore monthly and a production disaster-recovery restore at least quarterly under restricted access.

## Deleted-user expiration

- Remove the live account through the documented deletion workflow.
- Record a non-content deletion tombstone where legally required.
- Prevent deleted data from being reintroduced when restoring an older backup by replaying deletion tombstones after restoration.
- Allow the deleted user's content to age out of rolling backups no later than the published maximum backup-retention window.
- Never restore an old backup directly over production without applying the deletion ledger and validating deleted-user absence.
- Disclose the backup-expiration window in the privacy policy and account-deletion UI.

## Restore drill record template

| Field | Value |
| --- | --- |
| Date/time | |
| Operator | |
| Synthetic backup object/version | |
| Encryption key ID | |
| Expected encrypted checksum | |
| Downloaded encrypted checksum | |
| Expected plaintext checksum | |
| Restored plaintext checksum | |
| Archive/JSONL validation | Pass / Fail |
| Import target | Isolated development deployment |
| Row-count comparison | Pass / Fail |
| Cleanup confirmed | Yes / No |
| Incident/notes | |

## Local development rules

- Use only records from `tests/fixtures/synthetic-account.json` or newly generated `example.test`/`test.invalid` identities.
- Keep `.env.local` at mode `0600` where the filesystem supports POSIX permissions.
- Install the repository hook with `npm run hooks:install` after cloning.
- Run `npm run security:scan` before opening a pull request.
- Treat screenshots, transcripts, exports, logs, and coverage output as potentially sensitive until reviewed.
