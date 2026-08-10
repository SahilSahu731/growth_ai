# Connect GrowthAI to Convex without deployment authority at runtime

GrowthAI uses Convex custom JWT authentication. The web runtime never reads `CONVEX_DEPLOY_KEY`, never calls `setAdminAuth`, and never shares an authenticated singleton client. Each call uses a new client and a two-minute token for exactly one role, subject, and scope.

## Identity map

| Identity | Issuer | Capabilities |
| --- | --- | --- |
| member | `/convex/member` | Only the signed-in member subject and the requested account/operator/billing scope |
| auth | `/convex/auth` | OAuth account lookup and verified account linking |
| admin | `/convex/admin` | Admin session, role-approved read/write, billing, audit, or delete scope |
| webhook | `/convex/webhook` | Razorpay event ingestion only |
| background | `/convex/background` | AI provider circuit reporting only |
| anonymous | none | Current public announcement only |
| deployment | Convex CLI deploy key | Schema/function deployment only; never present in Next.js runtime |

Convex validates RS256 tokens using the role-specific JWKS endpoints under `/api/convex/jwks/[role]`. Function authorization checks role, exact scope, and member subject; it does not rely on a fixed `tokenIdentifier`.

## Local setup

1. Select a local Convex deployment. This keeps the JWKS endpoint private and
   lets Convex reach `http://localhost:3000` without an internet tunnel:

   ```bash
   npx convex deployment select local
   ```

2. Generate independent PKCS#8 keys:

   ```bash
   npm run convex:keys
   ```

   Copy the five role keys to `.env.local`; do not commit or paste them into
   logs. Set `CONVEX_AUTH_BASE_URL=http://localhost:3000` there. Do not copy
   `DELETED_IDENTITY_HMAC_SECRET` into the web runtime.

3. Configure the local Convex deployment:

   ```bash
   npx convex env set CONVEX_AUTH_BASE_URL http://localhost:3000
   npx convex env set DELETED_IDENTITY_HMAC_SECRET YOUR-GENERATED-HMAC-SECRET
   ```

4. Run `npm run dev`. The command keeps Convex and Next.js in the same process
   group, so the web server cannot start by itself while port 3210 is closed.
   Use `npm run dev:web` only when a Convex backend is already running. Keep
   `CONVEX_DEPLOY_KEY` out of `.env.local`; if a cloud deployment command needs
   one, load it from a separate ignored deployment-only env file.

To develop against Convex Cloud instead, `CONVEX_AUTH_BASE_URL` must be an HTTPS
origin reachable by Convex. Use a deliberately configured development tunnel or
a deployed preview URL, configure the same origin in the Convex deployment, and
review the exposure before starting the tunnel.

## Production deployment order

1. Create distinct preview and production keys with `npm run convex:keys`; store the role keys in the relevant runtime secret store and `DELETED_IDENTITY_HMAC_SECRET` only in the matching Convex deployment environment.
2. Deploy the Next.js release so its public JWKS routes are reachable. Product database calls remain unavailable until the next step.
3. In an isolated CI deployment job, set `CONVEX_DEPLOY_KEY` and `CONVEX_AUTH_BASE_URL`, then run `npx convex deploy`. The job must not copy the deploy key into Vercel/runtime environment variables.
4. Run authenticated member, admin, webhook, retention, export, and deletion smoke tests.
5. Delete the old runtime deploy variable and rotate/revoke the old deploy key in Convex Deployment Settings.

Schema changes follow the expand/migrate/contract sequence in `MIGRATIONS_AND_ROLLBACK.md`. Deploy new optional fields/indexes before code that requires them. Privacy jobs are resumable, but a Convex deployment does not automatically roll data back with the Next.js artifact.

For stronger compartmentalization, deploy admin, webhook, and background entry points as separate services/projects and inject only that service's private key. The role/scope boundary works in one codebase, but process isolation is required before claiming that a full web-runtime compromise cannot read every runtime secret.

## Rotation

Generate a new key and key ID for one role, deploy the JWKS/runtime secret, allow the five-minute JWKS cache to expire, validate calls, then remove the prior key. Deployment-key rotation is separate and occurs only in the deployment system.
