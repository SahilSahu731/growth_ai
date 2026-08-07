"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { ArrowRight, LoaderCircle } from "lucide-react"

import { safeCallbackPath } from "@/lib/safe-callback"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path d="M21.35 11.1h-9.18v2.96h5.27a4.7 4.7 0 0 1-2.05 3.08v2.56h3.32c1.94-1.78 3.05-4.4 3.05-7.52 0-.72-.07-1.42-.2-2.08Z" fill="#4285F4" />
      <path d="M12.17 21c2.77 0 5.1-.92 6.8-2.5l-3.32-2.56c-.92.62-2.1 1-3.48 1-2.67 0-4.94-1.8-5.75-4.22H3.01v2.65A10.3 10.3 0 0 0 12.17 21Z" fill="#34A853" />
      <path d="M6.42 12.72a6.2 6.2 0 0 1 0-3.95V6.12H3.01a10.28 10.28 0 0 0 0 9.25l3.41-2.65Z" fill="#FBBC05" />
      <path d="M12.17 4.56c1.5 0 2.83.52 3.88 1.53l2.91-2.91A9.7 9.7 0 0 0 12.17 1a10.3 10.3 0 0 0-9.16 5.12l3.41 2.65c.81-2.41 3.08-4.21 5.75-4.21Z" fill="#EA4335" />
    </svg>
  )
}

export function GoogleAuthButton({ enabled, label, callbackUrl = "/chat" }: { enabled: boolean; label: string; callbackUrl?: string }) {
  const [pending, setPending] = useState(false)

  async function continueWithGoogle() {
    if (!enabled) return
    setPending(true)
    await signIn("google", { callbackUrl: safeCallbackPath(callbackUrl) })
    setPending(false)
  }

  return (
    <div>
      <button
        type="button"
        disabled={!enabled || pending}
        onClick={() => void continueWithGoogle()}
        className="group relative flex h-16 w-full items-center overflow-hidden rounded-2xl border border-[#72e7ff]/35 px-3 cursor-pointer text-white shadow-[0_16px_45px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#72e7ff]/80 hover:bg-[#101c21] hover:shadow-[0_0_0_4px_rgba(114,231,255,.08),0_20px_55px_rgba(0,0,0,.48)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(114,231,255,.08),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"><GoogleIcon /></span>
        <span className="relative flex-1 text-center tracking-[-.01em]">{pending ? "Connecting securely…" : label}</span>
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#72e7ff] text-[#031014] transition duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
        </span>
      </button>
      {!enabled ? <p className="mt-3 text-xs leading-5 text-[#72e7ff]/65">Add a valid Web application client ID and secret to enable Google sign-in.</p> : null}
    </div>
  )
}
