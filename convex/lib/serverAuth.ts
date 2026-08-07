/* eslint-disable @typescript-eslint/no-explicit-any */

export async function requireServer(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("AUTH_REQUIRED: Authenticated application identity required")
  return identity
}

export async function requireScope(ctx: any, role: "member" | "admin" | "webhook" | "background" | "auth", scope: string) {
  const identity = await requireServer(ctx)
  if (identity.role !== role || identity.scope !== scope) throw new Error("FORBIDDEN: Application identity does not have this capability")
  return identity
}

export async function requireMember(ctx: any, userId: string, scope: string) {
  const identity = await requireScope(ctx, "member", scope)
  if (identity.subject !== `member:${userId}`) throw new Error("FORBIDDEN: Member identity does not own this resource")
  return identity
}
