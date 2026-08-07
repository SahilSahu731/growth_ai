import "server-only"

import { ConvexHttpClient } from "convex/browser"
import { makeFunctionReference, type FunctionReference } from "convex/server"
import { createConvexIdentityToken, type ConvexIdentityRole } from "@/lib/convex-identity"

function deploymentUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable.")
  return url
}

type Identity = { role: ConvexIdentityRole; subject: string; scope: string }

async function authenticatedClient(identity: Identity) {
  // A client is deliberately request-local. ConvexHttpClient authentication is
  // mutable, so sharing one singleton across roles can leak an admin identity
  // into a concurrent member or webhook request.
  const client = new ConvexHttpClient(deploymentUrl())
  client.setAuth(await createConvexIdentityToken(identity))
  return client
}

function anonymousClient() {
  return new ConvexHttpClient(deploymentUrl())
}

function reference<Kind extends "query" | "mutation", Args extends Record<string, unknown>, Result>(
  name: string
): FunctionReference<Kind, "public", Args, Result> {
  // The public visibility here is a TypeScript SDK limitation: the HTTP client
  // accepts internal function names at runtime when authenticated as an admin.
  return makeFunctionReference<Kind, Args, Result>(name)
}

export async function convexQuery<Args extends Record<string, unknown>, Result>(name: string, args: Args, identity: Identity): Promise<Result> {
  const client = await authenticatedClient(identity)
  const query = client.query.bind(client) as unknown as (
    ref: FunctionReference<"query", "public", Args, Result>, values: Args
  ) => Promise<Result>
  return query(reference<"query", Args, Result>(name), args)
}

export async function convexMutation<Args extends Record<string, unknown>, Result>(name: string, args: Args, identity: Identity): Promise<Result> {
  const client = await authenticatedClient(identity)
  const mutation = client.mutation.bind(client) as unknown as (
    ref: FunctionReference<"mutation", "public", Args, Result>, values: Args
  ) => Promise<Result>
  return mutation(reference<"mutation", Args, Result>(name), args)
}

export async function convexAnonymousQuery<Args extends Record<string, unknown>, Result>(name: string, args: Args): Promise<Result> {
  const client = anonymousClient()
  const query = client.query.bind(client) as unknown as (
    ref: FunctionReference<"query", "public", Args, Result>, values: Args
  ) => Promise<Result>
  return query(reference<"query", Args, Result>(name), args)
}
