"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

import { signupAction, type AuthActionState } from "@/app/(auth)/actions"
import { OAuthButtons, type OAuthProviderAvailability } from "@/components/auth/oauth-buttons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_STATE: AuthActionState = {}

type SignupFormProps = {
  oauthProviders: OAuthProviderAvailability
  referralCode?: string
}

export function SignupForm({ oauthProviders, referralCode }: SignupFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (prevState: AuthActionState, formData: FormData) => {
      const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
      const password = formData.get("password")?.toString() ?? ""

      const result = await signupAction(prevState, formData)

      if (!result.success) {
        return result
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      })

      if (signInResult?.error) {
        return {
          error: "Account created but sign in failed. Please sign in manually.",
          success: result.success,
          email: result.email,
        }
      }

      router.push(signInResult?.url ?? "/dashboard")
      router.refresh()
      return result
    },
    INITIAL_STATE
  )

  return (
    <form action={formAction} className="space-y-5 sm:space-y-6">
      {referralCode ? <input type="hidden" name="referralCode" value={referralCode} /> : null}
      <OAuthButtons providers={oauthProviders} mode="signup" />
      <div className="relative flex items-center justify-center">
        <div className="h-px w-full bg-white/10" />
        <span className="absolute bg-[#111] px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-(--landing-muted)">
          or sign up with email
        </span>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-[.12em] text-(--landing-muted)">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          className="auth-input h-13 rounded-2xl border-white/10 bg-white/5 px-4 text-sm placeholder:text-neutral-600"
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[.12em] text-(--landing-muted)">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="auth-input h-13 rounded-2xl border-white/10 bg-white/5 px-4 text-sm placeholder:text-neutral-600"
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[.12em] text-(--landing-muted)">
          Password
        </Label>
        <div className="relative">
          <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" autoComplete="new-password" className="auth-input h-13 rounded-2xl border-white/10 bg-white/5 px-4 pr-12 text-sm placeholder:text-neutral-600" required />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-[.12em] text-(--landing-muted)">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Repeat your password"
          autoComplete="new-password"
          className="auth-input h-13 rounded-2xl border-white/10 bg-white/5 px-4 text-sm placeholder:text-neutral-600"
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <Button
        type="submit"
        className="group h-13 w-full rounded-2xl bg-(--landing-ink) text-sm font-bold text-(--landing-surface) transition hover:-translate-y-0.5 hover:bg-white"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : <span className="flex items-center gap-2">Begin my growth <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>}
      </Button>

      <p className="text-center text-sm text-(--landing-muted)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--landing-ink) underline underline-offset-4 hover:text-(--landing-accent)">
          Sign in
        </Link>
      </p>
    </form>
  )
}
