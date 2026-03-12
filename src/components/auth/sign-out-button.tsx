"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false)

  async function handleSignOut() {
    setIsPending(true)
    await signOut({ callbackUrl: "/" })
  }

  return (
    <Button type="button" variant="outline" className="h-10" disabled={isPending} onClick={handleSignOut}>
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  )
}
