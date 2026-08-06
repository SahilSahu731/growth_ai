# GrowthAI admin setup

The admin workspace lives at `/admin` and is intentionally separate from member authentication. It does not add an admin role to `users`, and a Google-authenticated member session grants no admin access.

## Required server variables

Configure these in every deployment environment. Never prefix them with `NEXT_PUBLIC_`.

```dotenv
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
ADMIN_LOGIN_SECRET_HASH=$2b$12$...
ADMIN_SESSION_SECRET=a-long-random-server-only-value
ADMIN_SESSION_VERSION=1
```

Generate the password hash and the independent login-secret hash separately:

```bash
node -e "console.log(require('bcryptjs').hashSync('replace-me', 12))"
```

Replace `replace-me` locally before running the command. Do not commit the plaintext values or paste them into tickets or logs. Generate the session signing key with a cryptographically secure generator such as:

```bash
openssl rand -base64 48
```

Deploy the updated Convex schema and functions before the Next.js release:

```bash
npx convex deploy
npm run build
```

## Security behavior

- Login requires the configured email, password, and independent secret string.
- Both secret credentials are stored only as bcrypt hashes.
- Failed attempts are persistently limited: more than five attempts per client fingerprint within 15 minutes blocks attempts for 30 minutes.
- The admin session is an HMAC-SHA256 signed, eight-hour `HttpOnly` cookie restricted to `/admin`; production also sets `Secure`, and `SameSite=Strict` is always used.
- Every management mutation, login, and logout is written to `adminAuditLogs`.
- Every page and every server action independently validates the admin session.
- Set a new `ADMIN_SESSION_VERSION` value to revoke all existing admin sessions immediately.
- Suspending a member removes their product access on the next NextAuth session read without deleting their data.

Use a unique password and secret string, store them in a password manager, and restrict access to deployment environment settings. Rotate all three secrets if any one may have been exposed.
