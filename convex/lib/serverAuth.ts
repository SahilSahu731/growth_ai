/* eslint-disable @typescript-eslint/no-explicit-any */

export async function requireServer(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity?.tokenIdentifier !== "https://growthai.local|growthai-next-server") {
    throw new Error("Unauthorized server request")
  }
}
