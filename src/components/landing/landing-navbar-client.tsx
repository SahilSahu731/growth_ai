"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

type LandingNavbarClientProps = {
  user: {
    name: string | null
    email: string | null
    image: string | null
  } | null
}

const navigation: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Why", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "MVP", href: "#mvp" },
  { label: "Adaptive", href: "#adaptive" },
]

function getUserInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return "U"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function MenuGlyph() {
  return (
    <span aria-hidden className="flex w-4 flex-col gap-1.5">
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
    </span>
  )
}

export function LandingNavbarClient({ user }: LandingNavbarClientProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const displayName = user?.name ?? "Growth User"
  const displayEmail = user?.email ?? null
  const initials = useMemo(
    () => getUserInitials(user?.name ?? user?.email ?? "User"),
    [user?.email, user?.name]
  )

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/" })
    setIsSigningOut(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-(--landing-surface)/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.45rem] w-full max-w-280 items-center justify-between px-4 sm:px-6">
        <Link href="#top" className="group flex items-center gap-2.5" aria-label="Growth_AI home">
          <span className="flex size-7 items-center justify-center rounded-full border border-black/15 bg-white text-[0.64rem] font-semibold text-(--landing-ink)">
            G
          </span>
          <span className="font-display text-[1.22rem] tracking-tight text-(--landing-ink)">Growth_AI</span>
        </Link>

        <nav className="hidden items-center gap-6 rounded-full border border-black/10 bg-white/70 px-5 py-2 md:flex" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-(--landing-muted) transition-colors hover:text-(--landing-ink)"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-full border-black/12 bg-white/85 px-2.5 text-left hover:bg-white"
                >
                  <Avatar size="sm" className="ring-1 ring-black/8">
                    {user.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                    <AvatarFallback className="bg-(--landing-accent-soft) text-(--landing-accent)">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-36 text-left leading-tight">
                    <p className="truncate text-sm font-medium text-(--landing-ink)">{displayName}</p>
                    <p className="truncate text-[0.68rem] text-(--landing-muted)">Workspace</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!w-72 bg-white p-2">
                <DropdownMenuLabel className="rounded-xl border border-black/10 bg-(--landing-surface) p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar size="default" className="ring-1 ring-black/8">
                      {user.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                      <AvatarFallback className="bg-(--landing-accent-soft) text-(--landing-accent)">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-(--landing-ink)">{displayName}</p>
                      {displayEmail ? <p className="truncate text-sm text-(--landing-muted)">{displayEmail}</p> : null}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="min-h-10 rounded-lg text-sm font-medium">
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-10 rounded-lg text-sm font-medium">
                  <Link href="/goals">Goals</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-10 rounded-lg text-sm font-medium">
                  <Link href="/planner">Planner</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-10 rounded-lg text-sm font-medium">
                  <Link href="/progress">Progress</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="min-h-10 rounded-lg text-sm font-medium">
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-10 rounded-lg text-sm font-medium"
                  onSelect={(event) => {
                    event.preventDefault()
                    void handleSignOut()
                  }}
                >
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-9 rounded-full px-4 text-xs text-(--landing-muted) hover:bg-black/6 hover:text-(--landing-ink)"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-9 rounded-full bg-(--landing-ink) px-5 text-xs text-(--landing-surface) hover:bg-(--landing-accent)"
              >
                <Link href="/signup">Create Account</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-black/15 bg-white px-3 text-[0.7rem] text-(--landing-ink) md:hidden"
            >
              <MenuGlyph />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[86vw] border-l border-black/15 bg-(--landing-surface) p-0 sm:max-w-sm"
          >
            <SheetHeader className="gap-2 border-b border-black/10 p-6 text-left">
              <SheetTitle className="font-display text-2xl text-(--landing-ink)">Growth_AI</SheetTitle>
              <SheetDescription className="text-sm text-(--landing-muted)">
                Goals are easy. Systems are hard. We build them.
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col p-5" aria-label="Mobile">
              {navigation.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-2 py-2 text-sm font-medium text-(--landing-ink) transition-colors hover:bg-black/5"
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <Separator />
            <div className="space-y-2 p-5">
              {user ? (
                <>
                  <div className="rounded-xl border border-black/10 bg-white/80 p-3">
                    <p className="text-sm font-semibold text-(--landing-ink)">{displayName}</p>
                    {displayEmail ? <p className="text-xs text-(--landing-muted)">{displayEmail}</p> : null}
                  </div>
                  <SheetClose asChild>
                    <Button asChild className="h-10 w-full rounded-full bg-(--landing-ink) text-(--landing-surface)">
                      <Link href="/dashboard">Open Dashboard</Link>
                    </Button>
                  </SheetClose>
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="h-9 rounded-full text-xs">
                        <Link href="/goals">Goals</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="h-9 rounded-full text-xs">
                        <Link href="/planner">Planner</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="h-9 rounded-full text-xs">
                        <Link href="/progress">Progress</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="h-9 rounded-full text-xs">
                        <Link href="/settings">Settings</Link>
                      </Button>
                    </SheetClose>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full rounded-full"
                    disabled={isSigningOut}
                    onClick={() => {
                      void handleSignOut()
                    }}
                  >
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </Button>
                </>
              ) : (
                <>
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-10 w-full rounded-full text-(--landing-muted) hover:bg-black/5 hover:text-(--landing-ink)"
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="h-10 w-full rounded-full bg-(--landing-ink) text-(--landing-surface)">
                      <Link href="/signup">Create Account</Link>
                    </Button>
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
