# Connect GrowthAI to Convex

GrowthAI's Convex schema and functions already live in `convex/`. Connecting the database means creating a Convex deployment, pushing those functions, and giving the trusted Next.js server permission to call the internal compatibility API.

## Local development

### 1. Create or select a Convex project

From the repository root, run:

```bash
npm run convex:dev
```

The first run asks you to sign in, select or create a project, and choose a development deployment. Keep this process running while developing; it watches `convex/` and pushes schema and function changes automatically.

Convex writes these values into the root `.env.local` automatically:

```dotenv
CONVEX_DEPLOYMENT="dev:your-deployment"
NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"
```

`NEXT_PUBLIC_CONVEX_URL` is a deployment address, not a secret. `CONVEX_DEPLOYMENT` tells the CLI which development deployment to use.

### 2. Create the server-only deployment token

GrowthAI's current server adapter calls internal Convex functions from Next.js. Generate a token for that development deployment:

```bash
npx convex deployment token create growthai-next-server --deployment dev --save-env .env.local
```

This adds the following server-only value:

```dotenv
CONVEX_DEPLOY_KEY="dev:your-deployment|your-secret-token"
```

Never prefix this key with `NEXT_PUBLIC_`, expose it in browser code, paste it into chat, or commit `.env.local`. The repository ignores all local environment files except `.env.example`.

### 3. Run the application

Use two terminals:

```bash
# Terminal 1: watches and deploys Convex functions
npm run convex:dev

# Terminal 2: runs Next.js
npm run dev
```

After adding or changing environment values, restart the Next.js process.

### 4. Verify the connection

```bash
npx convex data
npx convex logs
```

You can also open the deployment dashboard with:

```bash
npx convex dashboard
```

After signing in through Google and completing onboarding, the dashboard should show records in tables such as `users`, `growthProjects`, `checkIns`, and `preferences`.

## Production with Vercel

1. In the Convex dashboard, select the production deployment.
2. Open **Deployment Settings → General → Deploy keys** and generate a production deploy key with permission to deploy the schema and functions. Keep it secret.
3. In Vercel, open **Project → Settings → Environment Variables** and add:

   ```text
   CONVEX_DEPLOY_KEY=<production deploy key>
   NEXT_PUBLIC_CONVEX_URL=https://YOUR_PRODUCTION_DEPLOYMENT.convex.cloud
   ```

4. Set the Vercel build command to:

   ```bash
   npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'
   ```

5. Redeploy the application.

The build command pushes the current schema and functions before building Next.js. The production URL must belong to the same deployment as the production key.

## Common problems

- **Missing `NEXT_PUBLIC_CONVEX_URL`:** run `npm run convex:dev`, then restart Next.js.
- **Missing `CONVEX_DEPLOY_KEY`:** create the development token in step 2 or add the production key in Vercel.
- **Functions not found:** ensure `npm run convex:dev` is still running locally or `npx convex deploy` succeeded in production.
- **Unauthorized/internal function error:** confirm the key belongs to the same deployment as the URL.
- **Schema change is not visible:** check the Convex terminal for validation errors and inspect `npx convex logs`.
- **Wrong database data:** compare `.env.local`'s deployment URL with the URL shown in the selected Convex dashboard deployment.

References: [Convex Next.js quickstart](https://docs.convex.dev/quickstart/nextjs), [Convex deploy keys](https://docs.convex.dev/cli/deploy-key-types), [Convex on Vercel](https://docs.convex.dev/production/hosting/vercel).
