import Link from "next/link"
import type { Metadata } from "next"
import { LockKeyhole } from "lucide-react"

import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"
import { safeCallbackPath } from "@/lib/safe-callback"

export const metadata: Metadata = { title: "Log in", description: "Log in to your private GrowthAI workspace." }

export const dynamic = "force-dynamic"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { google } = getOAuthProviderAvailability()
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl)
  const callbackQuery = callbackUrl === "/chat" ? "" : `?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <div className="animate-reveal relative w-full max-w-md">
      <p className="text-[20px] font-bold uppercase tracking-[.28em] text-[#72e7ff]">Welcome back</p>
      <h1 className="text-5xl font-semibold text-white min-[380px]:text-6xl sm:text-7xl">Keep<br />Growing.</h1>
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px w-10 bg-[#72e7ff]" />
        <p className="font-semibold text-white">Your life is still in motion.</p>
      </div>
      <p className="mt-4 max-w-sm text-xs leading-6 text-white/40">Return to the intentions you chose, the patterns you noticed, and the next step that still feels true.</p>

      <div className="mt-9"><GoogleAuthButton enabled={google} label="Continue with Google" callbackUrl={callbackUrl} /></div>

      <div className="mt-5 flex items-center gap-2 text-[10px] tracking-wide text-white/30"><LockKeyhole className="size-3.5" />Secure passwordless authentication</div>
      <p className="mt-10 text-xs text-white/45">New to GrowthAI? <Link href={`/signup${callbackQuery}`} className="font-semibold text-white underline decoration-[#72e7ff]/50 underline-offset-4 transition hover:text-[#72e7ff]">Create your space</Link></p>
    </div>
  )
}
