import Link from "next/link"
import { LockKeyhole } from "lucide-react"

import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { getOAuthProviderAvailability } from "@/lib/oauth-config"

export const dynamic = "force-dynamic"

const areas = ["Health", "Relationships", "Purpose", "Wellbeing"]

export default function SignupPage() {
  const { google } = getOAuthProviderAvailability()

  return (
    <div className="animate-reveal relative w-full max-w-md">
      <p className="text-[20px] font-bold uppercase tracking-[.28em] text-[#72e7ff]">Begin exactly here</p>
      <h1 className="mt-5 text-7xl font-semibold text-white">Grow into<br />your life.</h1>
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px w-10 bg-[#72e7ff]" />
        <p className="font-semibold text-white">One direction. All of you.</p>
      </div>
      <p className="mt-4 max-w-sm text-xs leading-6 text-white/40">Build a private practice for changing what matters—without turning your life into another performance.</p>
      {/* <div className="mt-5 flex flex-wrap gap-1.5">{areas.map((area) => <span key={area} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/35">{area}</span>)}</div> */}

      <div className="mt-8"><GoogleAuthButton enabled={google} label="Start with Google" /></div>

      <div className="mt-5 flex items-center gap-2 text-sm tracking-wide text-white/30"><LockKeyhole className="size-3.5" />Private, passwordless, and free to begin</div>
      <p className="mt-6 text-[12px] leading-5 text-white/20">GrowthAI supports reflection and planning. It is not medical or emergency care.</p>
      <p className="mt-6 text-xs text-white/30">Already have a space? <Link href="/login" className="font-semibold text-white underline decoration-[#72e7ff]/50 underline-offset-4 transition hover:text-[#72e7ff]">Sign in</Link></p>
    </div>
  )
}
