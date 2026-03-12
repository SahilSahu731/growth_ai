import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const oauthProviders = getOAuthProviderAvailability()

  return (
    <Card className="animate-reveal overflow-hidden rounded-[2rem] border border-black/10 bg-white/92 shadow-2xl shadow-amber-950/10">
      <CardHeader className="gap-3 px-6 pt-7 sm:px-10 sm:pt-10">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-muted)">Account Access</p>
        <CardTitle className="font-display text-4xl leading-tight text-(--landing-ink)">Welcome back</CardTitle>
        <CardDescription className="text-sm leading-7 text-(--landing-muted)">
          Sign in to continue building your growth system.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-10 sm:pb-10">
        <LoginForm oauthProviders={oauthProviders} />
      </CardContent>
    </Card>
  )
}
