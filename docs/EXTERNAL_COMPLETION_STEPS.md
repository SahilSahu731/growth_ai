# External completion steps for G0.2–G1

These items cannot be completed safely from the repository sandbox. Perform them in order and attach the resulting evidence to the release record. Gemini and Razorpay credentials are intentionally optional here.

## 0. Revoke and purge the historical Google credential

1. In **Google Cloud Console → APIs & Services → Credentials**, identify the API key recorded for commit `802e957e7765594389d9f10bc2713bb1db4384e7` by credential ID/fingerprint and revoke it. If a replacement is needed, create a new restricted key following `docs/CREDENTIAL_ROTATION.md`; never reuse the leaked value.
2. Confirm a controlled request with the old key is rejected and save redacted evidence.
3. Notify collaborators that a coordinated history rewrite is starting. Freeze merges and take a protected repository backup accessible only to the owner.
4. Install `git-filter-repo` and a maintained secret scanner such as Gitleaks on a trusted machine. Scan every branch, tag, stash, reflog, release artifact, CI/deployment log, backup, and known fork with redaction enabled.
5. In a fresh mirror clone, create a mode-`0600` replacement file outside the repository containing the exact leaked value mapped to `***REMOVED***`. Enter the value through a hidden prompt or secure editor—not a command argument or shell history—and run `git filter-repo --replace-text /absolute/restricted/replacements.txt --force`.
6. Run the full-history redacted secret scan against the rewritten mirror. Inspect the target commit and all refs, and proceed only when the scan is clean.
7. Coordinate the force-push of rewritten branches/tags, then delete/recreate affected release artifacts and cached source archives. Do not force-push while collaborators are still writing.
8. Require collaborators to archive/delete old clones and make fresh clones; do not merge old histories back into the cleaned repository.
9. Enable GitHub secret scanning and push protection, then prove it blocks a documented synthetic canary.
10. Record provider revocation evidence, scan version/results, rewritten refs, force-push time, owner, collaborators notified, and fresh-clone verification. Securely remove the temporary replacement file using controls appropriate to its filesystem.

## 1. Protect and remove the two plaintext backups

1. Create a private backup bucket/vault with a customer-managed encryption key, MFA, versioning, access logs, and named restore operators.
2. Create or select a GPG recovery public key whose private key is stored on a different encrypted device or managed recovery vault.
3. Follow the exact encryption, upload, checksum, decrypt, ZIP/JSONL validation, and record procedure in `docs/BACKUP_AND_DATA_HANDLING.md` for both inventoried ZIPs.
4. Import the restored **synthetic** drill archive into an isolated Convex development deployment and compare table counts.
5. Fill in the restore-drill table in that document, including object versions and checksums.
6. Only after both encrypted objects and the drill are verified, delete these plaintext files through the operating system's approved deletion process:
   - `backups/convex-pre-cleanup-2026-08-05.zip`
   - `backups/convex-pre-table-delete-2026-08-05-1158.zip`
7. Run `find backups -type f -print` and confirm no real-data export remains. Do not commit a restored export.

## 2. Enable the local Git protection

The sandbox cannot write `.git/config`. From the repository root on the host, run:

```bash
npm run hooks:install
git config --get core.hooksPath
npm run security:scan
```

The second command must print `.githooks`, and the scan must pass. Test the hook only with a synthetic canary matching a scanner test pattern; never create a real credential.

## 3. Protect GitHub `main`

In GitHub, open **Settings → Rules → Rulesets → New branch ruleset**, target `main`, activate it, and configure:

1. Require pull requests with at least one approval.
2. Require review from CODEOWNERS and dismiss stale approvals.
3. Require conversation resolution and require the branch to be up to date.
4. Require these checks exactly after the workflow has run once: `security`, `verify`, and `e2e`.
5. Block force pushes and branch deletion; apply the rules to administrators.
6. Enable **Settings → Code security** secret scanning, push protection, and Dependabot alerts/updates.
7. Open a test pull request and retain links proving an unauthorized direct push is blocked and all three checks are required.

## 4. Configure production values and separate environments

Create independent Development, Preview, Staging, and Production projects/datasets as defined in `docs/RELEASE_PROCESS.md`. Do not reuse OAuth clients, Convex deployments, secrets, backup stores, model projects, or payment modes between Production and lower environments.

The current local production-validation rehearsal reports these non-Gemini/non-Razorpay items:

1. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to the same canonical production `https://` origin.
2. Generate an admin bcrypt hash without placing the password in shell history. One safe option is an interactive Node script on the host that reads from a hidden prompt; store only the resulting bcrypt value as `ADMIN_PASSWORD_HASH`.
3. Generate `ADMIN_SESSION_SECRET` with at least 32 random bytes, for example `openssl rand -base64 48`, and store it in the production secret manager.
4. Keep `AUTH_SECRET` at least 32 random bytes and use a separate value from the admin secret.
5. Set the remaining documented Google OAuth, Convex, and application values from `.env.example` in the correct environment.
6. Run `npm run validate:env` inside each deployment environment. It must exit zero without printing secret values.

## 5. Deploy the additive Convex release and rehearse migration

1. Create a fresh isolated staging Convex deployment with synthetic data.
2. Run `npm ci`, `npm run verify`, and `npm run test:coverage`.
3. With the staging Convex deployment selected, run `npx convex deploy` and record the deployment identifier/schema version.
4. Follow every smoke test and field check in `docs/G1_DATA_MIGRATION.md`.
5. Promote the exact tested web commit; do not rebuild a different commit for production.
6. Record commit SHA, web deployment ID, Convex deployment/schema version, owners, timestamps, and smoke result using `docs/RELEASE_PROCESS.md`.
7. Do not convert legacy string IDs or ISO timestamps until the separately rehearsed dual-write/backfill/read-switch procedure in `docs/G1_DATA_MIGRATION.md` has completed against representative staging data.

## 6. Run provider-backed acceptance tests

In staging, using a dedicated Google OAuth client and synthetic accounts:

1. Test new login, existing-account login/linking, safe internal callback, rejected external callback, logout, JWT expiry/renewal, deleted account, suspended account, denied consent, and provider outage.
2. Confirm OAuth redirect URIs match staging exactly and no production user is created.
3. After the Gemini key is added later, run the supported model against the structured-output and versioned safety suites, including timeout, malformed output, blocked output, prompt injection, multilingual crisis, and kill-switch cases.
4. Run the synthetic incident exercise in `docs/AI_SAFETY_OPERATIONS.md` and name the incident, privacy, engineering, and rollback owners.

## 7. Final evidence gate

Do not mark the remaining roadmap checkpoints complete until all of the following exist: encrypted-backup object versions, a successful restore record, GitHub ruleset evidence, green required checks, zero-result secret scan, passing environment validation, staging migration results, provider-backed auth/AI results, and a production release record.
