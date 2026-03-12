"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

import { OAuthButtons, type OAuthProviderAvailability } from "@/components/auth/oauth-buttons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginFormProps = {
  oauthProviders: OAuthProviderAvailability
}

export function LoginForm({ oauthProviders }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
    const password = formData.get("password")?.toString() ?? ""

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    setError(null)
    setIsPending(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    })

    if (result?.error) {
      setError("Invalid email or password.")
      setIsPending(false)
      return
    }

    router.push(result?.url ?? "/dashboard")
    router.refresh()
  }

  return (
    <form action={handleSubmit} className="space-y-5 sm:space-y-6">
      <OAuthButtons providers={oauthProviders} mode="signin" />
      <div className="relative flex items-center justify-center">
        <div className="h-px w-full bg-black/10" />
        <span className="absolute bg-white px-3 text-xs uppercase tracking-[0.15em] text-(--landing-muted)">
          or continue with email
        </span>
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
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password" className="text-sm text-(--landing-ink)">
            Password
          </Label>
          <span className="text-xs text-(--landing-muted)">Minimum 8 characters</span>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          className="h-12 rounded-xl border-black/15 bg-white px-4 text-sm"
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-(--landing-ink) text-sm text-(--landing-surface) hover:bg-(--landing-accent)"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-(--landing-muted)">
        New to Growth_AI?{" "}
        <Link href="/signup" className="font-medium text-(--landing-ink) underline underline-offset-4 hover:text-(--landing-accent)">
          Create an account
        </Link>
      </p>
    </form>
  )
}
