import "server-only"

import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference, type FunctionReference } from "convex/server"

let client: ConvexHttpClient | null = null

function getClient(): ConvexHttpClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  const deployKey = process.env.CONVEX_DEPLOY_KEY

  if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable.")
  if (!deployKey) throw new Error("Missing CONVEX_DEPLOY_KEY environment variable.")

  client = new ConvexHttpClient(url)
  // NextAuth remains the identity provider. Only this trusted Next.js server may
  // call the internal compatibility API while the UI migrates to reactive hooks.
  ;(client as unknown as {
    setAdminAuth: (token: string, identity: { subject: string; issuer: string; tokenIdentifier: string }) => void
  }).setAdminAuth(deployKey, {
    subject: "growthai-next-server",
    issuer: "https://growthai.local",
    tokenIdentifier: "https://growthai.local|growthai-next-server",
  })
  return client
}

function reference<Kind extends "query" | "mutation", Args extends Record<string, unknown>, Result>(
  name: string
): FunctionReference<Kind, "public", Args, Result> {
  // The public visibility here is a TypeScript SDK limitation: the HTTP client
  // accepts internal function names at runtime when authenticated as an admin.
  return makeFunctionReference<Kind, Args, Result>(name)
}

export async function convexQuery<Args extends Record<string, unknown>, Result>(name: string, args: Args): Promise<Result> {
  const query = getClient().query.bind(getClient()) as unknown as (
    ref: FunctionReference<"query", "public", Args, Result>, values: Args
  ) => Promise<Result>
  return query(reference<"query", Args, Result>(name), args)
}

export async function convexMutation<Args extends Record<string, unknown>, Result>(name: string, args: Args): Promise<Result> {
  const mutation = getClient().mutation.bind(getClient()) as unknown as (
    ref: FunctionReference<"mutation", "public", Args, Result>, values: Args
  ) => Promise<Result>
  return mutation(reference<"mutation", Args, Result>(name), args)
}
