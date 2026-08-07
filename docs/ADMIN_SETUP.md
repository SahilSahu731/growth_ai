# Administrator security setup

Production administration uses named accounts with bcrypt passwords, mandatory TOTP MFA, explicit roles, a dedicated session secret, and server-side session records. Member credentials and `AUTH_SECRET` are never accepted for admin sessions.

## Configure named accounts

Generate a bcrypt hash for each administrator and a unique Base32 TOTP secret. Enroll the secret in that administrator's authenticator application through a separately verified channel. Then set:

```dotenv
ADMIN_SESSION_SECRET="a distinct random value of at least 32 bytes"
ADMIN_SESSION_VERSION="1"
ADMIN_ACCOUNTS_JSON='[{"email":"owner@example.com","passwordHash":"$2b$12$...","totpSecret":"BASE32...","roles":["owner"]}]'
TRUSTED_PROXY_HOPS="1"
```

Supported roles are `support-read`, `support-write`, `billing`, `security-auditor`, and `owner`. Give each person only the roles required for their job. Legacy `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, and `ADMIN_ROLES` exist only for local migration and fail the production configuration gate.

Sessions have a 30-minute rolling idle expiry and eight-hour absolute expiry. Each session is bound to a server-salted device/network fingerprint, stored in Convex, listable on the Security screen, and revocable on logout. Incrementing `ADMIN_SESSION_VERSION` invalidates all signed cookies; revoke server records as part of an incident.

Sensitive user/message views require a support reason and case/ticket reference. Reads record actor, role, reason, ticket, target, request ID, result, and time. Mutating actions remain separately role checked and audited.

Viewing account/message content and changing plans, access, conversations, or user deletion requires an administrator login with password and TOTP from the last ten minutes. If the window expires, sign out and complete MFA again. Member account deletion and AI-memory clearing similarly require a member sign-in from the last fifteen minutes.

## Still required outside the repository

- Protect administrator email accounts and the secret manager with phishing-resistant MFA.
- Maintain two owners; no shared accounts.
- Store emergency recovery material in two separate custodians' vaults. Both must approve use, and the event must be entered in the audit system.
- Split admin hosting from the member runtime and inject only the admin Convex key.
- Configure alerts for blocked login waves, bulk reads, exports, plan/access changes, and deletions.
- Export audit events to write-once/tamper-evident storage.
