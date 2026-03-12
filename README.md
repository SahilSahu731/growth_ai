This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Auth + Database Setup

This project uses:

- `next-auth` (Credentials + optional OAuth providers)
- Neon PostgreSQL (`@neondatabase/serverless`)

### 1. Configure environment variables

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` (or `AUTH_SECRET`)
- `NEXTAUTH_URL`

Optional OAuth variables (enable Google login button):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 2. Start the app

```bash
npm run dev
```

Routes:

- `/login`
- `/signup`
- `/dashboard` (protected)

Note: the `app_users` table is created automatically on first auth request.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
