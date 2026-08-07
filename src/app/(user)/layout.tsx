import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/auth"
import { UserSidebarShell } from "@/components/user/user-sidebar-shell"
import { getAccountOverview } from "@/lib/data/account"
import { LEGAL_VERSIONS } from "@/lib/legal"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const account = userId ? await getAccountOverview(userId) : null
  if (!account) redirect("/login")
  if (account.preferences.termsAcceptedVersion !== LEGAL_VERSIONS.terms || account.preferences.privacyAcceptedVersion !== LEGAL_VERSIONS.privacy || account.preferences.aiNoticeAcceptedVersion !== LEGAL_VERSIONS.aiNotice) redirect("/consent")

  return (
    <UserSidebarShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        planTier: account?.user.planTier === "team" ? "pro" : account?.user.planTier ?? "free",
      }}
      conversations={account?.conversations ?? []}
    >
      {children}
    </UserSidebarShell>
  )
}
