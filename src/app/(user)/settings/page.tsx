import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { SettingsWorkspace } from "@/components/settings/settings-workspace"
import { getAccountOverview } from "@/lib/data/account"

export const metadata = { title: "Settings" }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const account = await getAccountOverview(session.user.id)
  if (!account) redirect("/login")

  return <SettingsWorkspace user={{ name: session.user.name ?? "GrowthAI member", email: session.user.email ?? account.user.email, image: session.user.image ?? null, planTier: account.user.planTier }} preferences={account.preferences} />
}
