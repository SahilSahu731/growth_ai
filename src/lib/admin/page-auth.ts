import "server-only"

import { redirect } from "next/navigation"

import { adminHasRole, getAdminSession } from "@/lib/admin/auth"
import type { AdminRole } from "@/lib/admin/credential-config"

// Next.js may begin resolving a page in parallel with a parent layout. Every
// protected page therefore checks authorization itself before reading data;
// the layout remains a second boundary for the shared shell.
export async function requireAdminPageSession() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")
  return session
}

export async function requireAdminPageRole(...roles: AdminRole[]) {
  const session = await requireAdminPageSession()
  if (!adminHasRole(session, ...roles)) redirect("/admin?forbidden=1")
  return session
}
