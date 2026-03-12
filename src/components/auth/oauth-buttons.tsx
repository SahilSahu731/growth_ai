"use client"

import { useState, type ComponentProps, type ReactElement } from "react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type OAuthProviderAvailability = {
  google: boolean
}

type OAuthProviderId = keyof OAuthProviderAvailability

type OAuthButtonsProps = {
  providers: OAuthProviderAvailability
  mode: "signin" | "signup"
  className?: string
}

function GoogleIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.35 11.1h-9.18v2.96h5.27a4.7 4.7 0 0 1-2.05 3.08v2.56h3.32c1.94-1.78 3.05-4.4 3.05-7.52 0-.72-.07-1.42-.2-2.08Z"
        fill="#4285F4"
      />
      <path
        d="M12.17 21c2.77 0 5.1-.92 6.8-2.5l-3.32-2.56c-.92.62-2.1 1-3.48 1-2.67 0-4.94-1.8-5.75-4.22H3.01v2.65A10.3 10.3 0 0 0 12.17 21Z"
        fill="#34A853"
      />
      <path
        d="M6.42 12.72a6.2 6.2 0 0 1 0-3.95V6.12H3.01a10.28 10.28 0 0 0 0 9.25l3.41-2.65Z"
        fill="#FBBC05"
      />
      <path
        d="M12.17 4.56c1.5 0 2.83.52 3.88 1.53l2.91-2.91A9.7 9.7 0 0 0 12.17 1a10.3 10.3 0 0 0-9.16 5.12l3.41 2.65c.81-2.41 3.08-4.21 5.75-4.21Z"
        fill="#EA4335"
      />
    </svg>
  )
}

const PROVIDER_META: Record<OAuthProviderId, { label: string; Icon: (props: ComponentProps<"svg">) => ReactElement }> = {
  google: { label: "Google", Icon: GoogleIcon },
}

export function OAuthButtons({ providers, mode, className }: OAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(null)
  const providerIds: OAuthProviderId[] = ["google"]
  const disabledProviders = providerIds.filter((providerId) => !providers[providerId])

  const ctaPrefix = mode === "signin" ? "Continue with" : "Sign up with"

  async function handleProviderSignIn(providerId: OAuthProviderId) {
    setPendingProvider(providerId)
    await signIn(providerId, { callbackUrl: "/dashboard" })
    setPendingProvider(null)
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {providerIds.map((providerId) => {
        const { label, Icon } = PROVIDER_META[providerId]
        const isPending = pendingProvider === providerId
        const isEnabled = providers[providerId]

        return (
          <Button
            key={providerId}
            type="button"
            variant="outline"
            className="h-12 w-full justify-center gap-2.5 rounded-full border-black/15 bg-white px-5 text-sm text-(--landing-ink) hover:bg-(--landing-surface)"
            disabled={pendingProvider !== null || !isEnabled}
            onClick={() => {
              if (!isEnabled) return
              void handleProviderSignIn(providerId)
            }}
          >
            <Icon className="size-4" />
            {isPending ? `${ctaPrefix} ${label}...` : `${ctaPrefix} ${label}`}
          </Button>
        )
      })}

      {disabledProviders.length > 0 ? (
        <p className="text-xs leading-6 text-(--landing-muted)">
          {`To enable ${disabledProviders.map((provider) => PROVIDER_META[provider].label).join(" and ")}, set provider credentials in .env and restart the server.`}
        </p>
      ) : null}
    </div>
  )
}