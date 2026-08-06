import "server-only"

import { redirect } from "next/navigation"

import { getAdminSession } from "@/lib/admin/auth"

// Next.js may begin resolving a page in parallel with a parent layout. Every
// protected page therefore checks authorization itself before reading data;
// the layout remains a second boundary for the shared shell.
export async function requireAdminPageSession() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")
  return session
}
