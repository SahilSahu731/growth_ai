# GrowthAI admin setup

The admin workspace lives at `/admin` and is intentionally separate from member authentication. It does not add an admin role to `users`, and a Google-authenticated member session grants no admin access.

## Required server variables

Configure these in every deployment environment. Never prefix them with `NEXT_PUBLIC_`.

```dotenv
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD_HASH=$2b$12$...
ADMIN_SESSION_SECRET=a-long-random-server-only-value
ADMIN_SESSION_VERSION=1
```

Generate a password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('replace-me', 12))"
```

Replace `replace-me` locally before running the command. `ADMIN_PASSWORD_HASH` must contain a bcrypt value; plaintext admin passwords are rejected in every environment. Do not commit the plaintext value or paste it into tickets or logs. Generate a dedicated session signing key with a cryptographically secure generator such as:

```bash
openssl rand -base64 48
```

Deploy the updated Convex schema and functions before the Next.js release:

```bash
npx convex deploy
npm run build
```

## Security behavior

- Login requires only the configured admin email and password.
- Only bcrypt password hashes are accepted.
- The admin session secret must be dedicated and at least 32 characters; member authentication secrets are never used as a fallback.
- Failed attempts are persistently limited: more than five attempts per client fingerprint within 15 minutes blocks attempts for 30 minutes.
- The admin session is an HMAC-SHA256 signed, eight-hour `HttpOnly` cookie restricted to `/admin`; production also sets `Secure`, and `SameSite=Strict` is always used.
- Every management mutation, login, and logout is written to `adminAuditLogs`.
- Every page and every server action independently validates the admin session.
- Set a new `ADMIN_SESSION_VERSION` value to revoke all existing admin sessions immediately.
- Suspending a member removes their product access on the next NextAuth session read without deleting their data.

Use a unique password and session signing secret, store them securely, and restrict access to deployment environment settings. Rotate both if either may have been exposed.
