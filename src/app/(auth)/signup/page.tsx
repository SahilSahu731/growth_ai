import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignupForm } from "@/components/auth/signup-form"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const oauthProviders = getOAuthProviderAvailability()
  const { ref } = await searchParams

  return (
    <Card className="auth-card animate-reveal overflow-hidden rounded-[2rem] border border-white/10 bg-white/92 shadow-[0_32px_90px_rgba(0,0,0,.35)]">
      <CardHeader className="gap-3 px-6 pt-8 sm:px-10 sm:pt-10">
        <p className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.2em] text-amber-200/70"><span className="h-px w-7 bg-amber-200/50" />Begin somewhere real</p>
        <CardTitle className="text-5xl font-black leading-[.96] tracking-[-.055em] text-(--landing-ink) sm:text-6xl">Make room<br /><span className="font-editorial font-normal italic text-neutral-400">for change.</span></CardTitle>
        <CardDescription className="text-sm leading-7 text-(--landing-muted)">
          Create your GrowthAI account, then choose one part of life that deserves your attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 sm:px-10 sm:pb-10">
        <SignupForm oauthProviders={oauthProviders} referralCode={ref?.slice(0, 32)} />
      </CardContent>
    </Card>
  )
}
