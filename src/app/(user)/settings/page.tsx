import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect("/login")

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section>
        <p className="text-sm text-zinc-500">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">Account and limits</h1>
        <p className="mt-2 text-sm text-zinc-400">Billing is not enabled yet. Usage gates are prepared for the PickAI free/pro model.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Account</CardDescription>
            <CardTitle className="text-2xl text-white">{session.user.name ?? "PickAI User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">{session.user.email}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Free plan</CardDescription>
            <CardTitle className="text-2xl text-white">3 comparisons/month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-400">
            <p>3 options per comparison</p>
            <p>Limited uploads and research</p>
            <p>Pro checkout placeholder for later</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
