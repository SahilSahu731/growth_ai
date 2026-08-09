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

1. Generate independent PKCS#8 keys:

   ```bash
   npm run convex:keys
   ```

   Copy the output to `.env.local`; do not commit or paste it into logs. Set `CONVEX_AUTH_BASE_URL` to an HTTPS URL reachable by Convex. Because the Convex cloud cannot fetch JWKS from localhost, use an access-controlled development tunnel or a deployed preview URL.

2. Configure the issuer base in the selected Convex deployment:

   ```bash
   npx convex env set CONVEX_AUTH_BASE_URL https://YOUR-DEV-OR-PREVIEW-ORIGIN
   npx convex env set DELETED_IDENTITY_HMAC_SECRET YOUR-GENERATED-HMAC-SECRET
   ```

3. Run `npm run convex:dev` from a deployment-only terminal. Its deploy credential remains in the CLI environment, not the terminal or service running `npm run dev`.

4. Start Next.js with `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_AUTH_BASE_URL`, and the five scoped private keys. Do not set `CONVEX_DEPLOY_KEY` in this process.

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
