"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
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

const navigation: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Why", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "MVP", href: "#mvp" },
  { label: "Adaptive", href: "#adaptive" },
]

function MenuGlyph() {
  return (
    <span aria-hidden className="flex w-4 flex-col gap-1.5">
      <span className="h-px w-full bg-current" />
      <span className="h-px w-full bg-current" />
    </span>
  )
}

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-(--landing-surface)/88 backdrop-blur-lg">
      <div className="mx-auto flex h-[4.35rem] w-full max-w-280 items-center justify-between px-4 sm:px-6">
        <Link href="#top" className="group flex items-center gap-2.5" aria-label="Growth_AI home">
          <span className="flex size-7 items-center justify-center rounded-full border border-black/15 bg-white text-[0.64rem] font-semibold text-(--landing-ink)">
            G
          </span>
          <span className="font-display text-[1.22rem] tracking-tight text-(--landing-ink)">Growth_AI</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
