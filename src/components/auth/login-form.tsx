"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

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
  const [showPassword, setShowPassword] = useState(false)

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
        <div className="h-px w-full bg-white/10" />
        <span className="absolute bg-[#111] px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-(--landing-muted)">
          or continue with email
        </span>
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
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[.12em] text-(--landing-muted)">
            Password
          </Label>
          <span className="text-xs text-(--landing-muted)">Minimum 8 characters</span>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="auth-input h-13 rounded-2xl border-white/10 bg-white/5 px-4 pr-12 text-sm placeholder:text-neutral-600"
            required
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="group h-13 w-full rounded-2xl bg-(--landing-ink) text-sm font-bold text-(--landing-surface) transition hover:-translate-y-0.5 hover:bg-white"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : <span className="flex items-center gap-2">Enter your space <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>}
      </Button>

      <p className="text-center text-sm text-(--landing-muted)">
        New to GrowthAI?{" "}
        <Link href="/signup" className="font-medium text-(--landing-ink) underline underline-offset-4 hover:text-(--landing-accent)">
          Create an account
        </Link>
      </p>
    </form>
  )
}
