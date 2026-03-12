import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="landing-atmosphere min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="animate-reveal rounded-2xl border border-black/10 bg-white/90">
          <CardHeader>
            <CardTitle className="font-display text-3xl text-(--landing-ink)">Your Dashboard</CardTitle>
            <CardDescription>
              Signed in as {session.user.email}. This is your starting point for plan execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-4">
              <p className="text-sm text-(--landing-muted)">
                Next step: connect your first goal and let Growth_AI generate your daily system.
              </p>
            </div>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
