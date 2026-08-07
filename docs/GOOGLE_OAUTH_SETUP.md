# Google OAuth setup

GrowthAI currently accepts Google as its only account authentication provider. Keep the client secret server-side and never commit it to Git.

## 1. Create the Google OAuth client

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) and select or create a Google Cloud project.
2. Configure the app branding and audience. During testing, add the Google accounts that should be allowed to sign in as test users.
3. Open **Clients**, create a client, and select **Web application**.
4. Add these authorized JavaScript origins:

   ```text
   http://localhost:3000
   https://YOUR_DOMAIN
   ```

5. Add these authorized redirect URIs exactly, without an extra trailing slash:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://YOUR_DOMAIN/api/auth/callback/google
   ```

Google requires the redirect URI used by the application to exactly match one configured for the OAuth client, including its scheme, host, port, case, and trailing slash.

## 2. Configure local development

Create `.env.local` in the repository root—the same directory as `package.json`:

```bash
cp .env.example .env.local
```

Then add the values from the Google client:

```dotenv
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Generate a suitable authentication secret with:

```bash
openssl rand -base64 32
```

Restart `npm run dev` after changing `.env.local`. Next.js loads these variables when the server starts. Do not prefix the Google secret with `NEXT_PUBLIC_`; doing that would expose it to browser code.

## 3. Configure Vercel

In Vercel, open the GrowthAI project and go to **Settings → Environment Variables**. Add:

- `NEXT_PUBLIC_APP_URL` = `https://YOUR_DOMAIN`
- `NEXTAUTH_URL` = `https://YOUR_DOMAIN`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Apply them to the environments you use and redeploy. Vercel applies newly added or changed environment variables only to new deployments.

Run `npm run validate:env` with the production-scoped variables before deployment. Preview and production must use different OAuth clients, Convex deployments, secrets, and provider projects.

## 4. Troubleshooting

- **Button says credentials are missing:** confirm both Google variables are present, then restart or redeploy.
- **`Error 401: invalid_client` / “OAuth client was not found”:** the client ID itself is malformed, deleted, or not copied from the selected Google Cloud project. Copy the complete **Client ID** from **Google Auth Platform → Clients**. It must end exactly in `.apps.googleusercontent.com` with no extra characters or spaces. This is not a redirect-URI error.
- **`redirect_uri_mismatch`:** compare the full callback URL with the Google client entry character by character.
- **Only developer accounts can sign in:** add test users or publish the Google OAuth app when it is ready.
- **Works locally but not in production:** confirm the production domain is present in both authorized origins and redirect URIs and that Vercel has the production-scoped variables.

References: [Google OAuth web-server documentation](https://developers.google.com/identity/protocols/oauth2/web-server), [Vercel environment variables](https://vercel.com/docs/environment-variables).
