import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignupForm } from "@/components/auth/signup-form"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

export default function SignupPage() {
  const oauthProviders = getOAuthProviderAvailability()

  return (
    <Card className="animate-reveal overflow-hidden rounded-[2rem] border border-black/10 bg-white/92 shadow-2xl shadow-amber-950/10">
      <CardHeader className="gap-3 px-6 pt-7 sm:px-10 sm:pt-10">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-muted)">Start Your Journey</p>
        <CardTitle className="font-display text-4xl leading-tight text-(--landing-ink)">Create account</CardTitle>
        <CardDescription className="text-sm leading-7 text-(--landing-muted)">
          Set up your Growth_AI account in less than a minute.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-10 sm:pb-10">
        <SignupForm oauthProviders={oauthProviders} />
      </CardContent>
    </Card>
  )
}
