# G2 production completion steps

The repository now contains the application-side G2 controls. The following items cannot be truthfully completed by source code alone. The launch owner must record evidence for each item in the release ticket before inviting the public or accepting payment.

## 1. Confirm the legal owner and public contacts

1. Decide the production legal entity, registered address, governing jurisdiction, canonical HTTPS domain, minimum user age, privacy contact, security contact, and support contact.
2. Set `LEGAL_ENTITY_NAME`, `LEGAL_CONTACT_ADDRESS`, `LEGAL_JURISDICTION`, `MINIMUM_USER_AGE`, `LEGAL_CONTACT_EMAIL`, `SECURITY_CONTACT_EMAIL`, `SUPPORT_CONTACT_EMAIL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL` in the production secret store.
3. Have qualified counsel review `/privacy`, `/terms`, `/ai-safety`, retention periods, billing language, and the real subprocessor contracts. Record reviewer, date, required changes, and approved document versions.
4. Sign required DPAs and update `/subprocessors` whenever a provider, purpose, or processing region changes.

## 2. Remove deployment authority from runtime

1. Run `npm run convex:keys` separately for preview and production. Store each role's PKCS#8 private key in the smallest service that needs it.
2. Set `CONVEX_AUTH_BASE_URL` in Convex to the canonical HTTPS origin with `npx convex env set CONVEX_AUTH_BASE_URL https://YOUR_DOMAIN`, then set the generated deletion-tombstone key with `npx convex env set DELETED_IDENTITY_HMAC_SECRET YOUR_GENERATED_VALUE`. Use a distinct value per deployment and keep it out of the web runtime.
3. Put `CONVEX_DEPLOY_KEY` only in an isolated CI deployment environment. Remove it from Vercel/Next.js runtime, local shared `.env` files, preview runtime, and monitoring configuration.
4. Deploy Next.js so the five JWKS endpoints are reachable, deploy Convex from CI, and run member/admin/webhook/background/anonymous authorization smoke tests.
5. Rotate or revoke the historical Convex deploy key in Convex Dashboard → Deployment Settings. Save a redacted screenshot or audit entry in the release ticket.
6. Before claiming process-level compartmentalization, split member, admin, webhook, and background handlers into separate deployment projects and give each project only its own private key. A monolithic runtime can enforce logical scopes but an arbitrary-code-execution compromise could still read all secrets loaded into that process.

## 3. Enrol production administrators

1. Create at least two individually named owner accounts. Generate unique bcrypt hashes and unique Base32 TOTP secrets; set `ADMIN_ACCOUNTS_JSON` as documented in `docs/ADMIN_SETUP.md`.
2. Deliver TOTP enrollment out of band, verify one code with each person, and protect administrator mailboxes and the secret manager with phishing-resistant MFA.
3. Set a unique 32-byte-or-stronger `ADMIN_SESSION_SECRET`, set `TRUSTED_PROXY_HOPS` from the hosting topology, and validate that spoofed `x-forwarded-for` values do not alter rate-limit identity.
4. Decide whether to replace password+TOTP with a managed workforce identity provider or passkeys. Record the choice, threat model, account recovery design, and review date.
5. Store emergency recovery material with two independent custodians. Require both approvals, a time-limited incident ticket, credential rotation after use, and a permanent audit record.

## 4. Operate audit and incident controls

1. Export admin audit events at least every five minutes to write-once or retention-locked storage under a separate security identity. Do not give support roles delete permission.
2. Alert on blocked-login waves, repeated failures, unusually broad account/message reads, exports, plan/access changes, and deletion attempts. Test each alert quarterly.
3. Review owner accounts monthly, all admin roles quarterly, sensitive-read tickets weekly, and audit export health daily. Retain audit events for the counsel-approved period.
4. Assign a named security owner and backup. Follow `docs/SECURITY_INCIDENT_RESPONSE.md`, run a tabletop before launch, and record time-to-detect and time-to-revoke.

## 5. Confirm domain, mail, and transport security

1. Verify the support, privacy, and security mailboxes are owned and monitored. Publish SPF, DKIM, and DMARC records; use a DMARC analyzer to confirm alignment and send test messages from outside the organization.
2. Publish response expectations internally and on the site. Test the footer bug-report link and `/.well-known/security.txt` from a clean browser.
3. Confirm every production and subdomain request redirects to HTTPS, the certificate chain is valid, OAuth and Razorpay windows still work, and no mixed content remains.
4. Set `ENABLE_HSTS=1`, deploy, verify the header, observe for at least one release, then consider `includeSubDomains` or preload only after every subdomain is permanently HTTPS-ready.

## 6. Complete independent security and accessibility validation

1. Engage an external tester for authenticated authorization, IDOR/BOLA, OAuth/session handling, admin MFA/recovery, CSRF, CSP bypass, SSRF, webhook replay/signature validation, export/deletion, rate limiting, and tenant isolation. Remediate high/critical findings before paid launch and retest fixes.
2. Execute every row in `docs/ACCESSIBILITY_TEST_PLAN.md` at 200% and 400% zoom using keyboard only, VoiceOver/Safari, NVDA with Firefox or Chrome, iOS VoiceOver, and Android TalkBack.
3. Test with real content, long names, validation failures, loading/error states, reduced motion, and 320 CSS-pixel viewports. Attach results and issue links to the release ticket.

## 7. Final production evidence

Run `npm run verify`, `npm run test:coverage`, `npm run build`, `npm run security:scan`, `npm audit --omit=dev`, `npm run license:check`, and `npm run test:e2e` against the release commit. Then use disposable accounts to verify consent, sign-in, chat, retention, memory clearing, export, deletion, admin support-access audit, session revocation, and the five Convex identities. Do not mark the G2 exit gate complete until the external evidence above is attached.
