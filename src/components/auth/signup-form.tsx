"use client"

import Link from "next/link"
import { useActionState } from "react"

import { signupAction, type AuthActionState } from "@/app/(auth)/actions"
import { OAuthButtons, type OAuthProviderAvailability } from "@/components/auth/oauth-buttons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_STATE: AuthActionState = {}

type SignupFormProps = {
  oauthProviders: OAuthProviderAvailability
}

export function SignupForm({ oauthProviders }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(signupAction, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-5 sm:space-y-6">
      <OAuthButtons providers={oauthProviders} mode="signup" />
      <div className="relative flex items-center justify-center">
        <div className="h-px w-full bg-black/10" />
        <span className="absolute bg-white px-3 text-xs uppercase tracking-[0.15em] text-(--landing-muted)">
          or sign up with email
        </span>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-sm text-(--landing-ink)">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          className="h-12 rounded-xl border-black/15 bg-white px-4 text-sm"
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-sm text-(--landing-ink)">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-xl border-black/15 bg-white px-4 text-sm"
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="password" className="text-sm text-(--landing-ink)">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          className="h-12 rounded-xl border-black/15 bg-white px-4 text-sm"
          required
        />
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="confirmPassword" className="text-sm text-(--landing-ink)">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          className="h-12 rounded-xl border-black/15 bg-white px-4 text-sm"
          required
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-(--landing-ink) text-sm text-(--landing-surface) hover:bg-(--landing-accent)"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Create account"}
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
