import Link from "next/link"
import { LockKeyhole } from "lucide-react"

import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  const { google } = getOAuthProviderAvailability()

  return (
    <div className="animate-reveal relative w-full max-w-md">
      <p className="text-[20px] font-bold uppercase tracking-[.28em] text-[#72e7ff]">Welcome back</p>
      <h1 className="text-7xl font-semibold text-white">Keep<br />Growing.</h1>
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px w-10 bg-[#72e7ff]" />
        <p className=" *:text-white">Your life is still in motion.</p>
      </div>
      <p className="mt-4 max-w-sm text-xs leading-6 text-white/40">Return to the intentions you chose, the patterns you noticed, and the next step that still feels true.</p>

      <div className="mt-9"><GoogleAuthButton enabled={google} label="Continue with Google" /></div>

      <div className="mt-5 flex items-center gap-2 text-[10px] tracking-wide text-white/30"><LockKeyhole className="size-3.5" />Secure passwordless authentication</div>
      <p className="mt-10 text-xs text-white/30">New to GrowthAI? <Link href="/signup" className="font-semibold text-white underline decoration-[#72e7ff]/50 underline-offset-4 transition hover:text-[#72e7ff]">Create your space</Link></p>
    </div>
  )
}
