import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const oauthProviders = getOAuthProviderAvailability()

  return (
    <Card className="auth-card animate-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/92 shadow-[0_32px_90px_rgba(0,0,0,.35)]">
      <CardHeader className="gap-3 px-6 pt-8 sm:px-10 sm:pt-10">
        <p className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-amber-200/70"><span className="h-px w-7 bg-amber-200/50" />Welcome home</p>
        <CardTitle className="text-5xl font-black leading-[.96] tracking-[-.055em] text-(--landing-ink) sm:text-6xl">Continue<br /><span className="font-editorial font-normal italic text-neutral-400">becoming.</span></CardTitle>
        <CardDescription className="text-sm leading-7 text-(--landing-muted)">
          Return to your intentions, reflections, and the patterns helping you move forward.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-10 sm:pb-10">
        <LoginForm oauthProviders={oauthProviders} />
      </CardContent>
    </Card>
  )
}
