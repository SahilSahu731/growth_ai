"use client"

import Link from "next/link"
import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain02Icon,
  ComputerSettingsIcon,
  DashboardSquare01Icon,
  File01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type UserSidebarShellProps = {
  children: ReactNode
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
}

const NAV_ITEMS = [
  { href: "/compare/new", label: "New comparison", icon: PlusSignIcon },
  { href: "/dashboard", label: "Saved comparisons", icon: DashboardSquare01Icon },
  { href: "/reports", label: "Reports", icon: File01Icon },
  { href: "/settings", label: "Settings", icon: ComputerSettingsIcon },
] as const

const EXAMPLES = ["Apartments", "Job offers", "Phones", "Insurance", "Loans", "Courses", "Travel plans"]

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "U"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "/reports") return pathname.startsWith("/reports")
  return pathname === href || pathname.startsWith(`${href}/`)
}

function currentTitle(pathname: string): string {
  if (pathname.startsWith("/compare/new")) return "New comparison"
  if (pathname.startsWith("/compare/")) return "Decision workspace"
  if (pathname.startsWith("/reports")) return "Decision report"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Saved comparisons"
}

export function UserSidebarShell({ children, user }: UserSidebarShellProps) {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const displayName = user.name ?? "PickAI User"
  const displayEmail = user.email ?? ""
  const initials = useMemo(() => getInitials(user.name ?? user.email ?? "User"), [user.email, user.name])

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/" })
    setIsSigningOut(false)
  }

  return (
    <TooltipProvider delayDuration={120}>
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "17rem",
            "--sidebar-width-icon": "3.25rem",
          } as CSSProperties
        }
      >
        <Sidebar collapsible="icon" className="border-r border-zinc-800 bg-[#171717] text-zinc-100">
          <SidebarHeader className="gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="size-9 shrink-0 rounded-lg border-0 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white" />
              <Link
                href="/dashboard"
                className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white hover:bg-zinc-800 group-data-[collapsible=icon]:hidden"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#10a37f] text-xs font-semibold text-white">
                  P
                </span>
                <span className="truncate">PickAI</span>
              </Link>
            </div>

            <Link
              href="/compare/new"
              className="flex h-10 items-center gap-2 rounded-lg bg-zinc-800 px-3 text-sm font-medium text-white transition hover:bg-zinc-700 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Compare anything</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 pb-2">
            <SidebarGroup className="space-y-1 px-0 py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                    isActive(pathname, item.href) && "bg-zinc-800 text-white"
                  )}
                  title={item.label}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              ))}
            </SidebarGroup>

            <SidebarGroup className="space-y-1 border-t border-zinc-800 px-0 py-3 group-data-[collapsible=icon]:hidden">
              <p className="px-2 pb-1 text-xs text-zinc-500">Try comparing</p>
              {EXAMPLES.map((item) => (
                <Link
                  key={item}
                  href={`/compare/new?example=${encodeURIComponent(item)}`}
                  className="block truncate rounded-lg px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  {item}
                </Link>
              ))}
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-zinc-800 p-2">
            <div className="rounded-lg border border-zinc-800 p-2 group-data-[collapsible=icon]:hidden">
              <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                <HugeiconsIcon icon={AiBrain02Icon} className="size-4" />
                Free plan
              </div>
              <p className="text-xs leading-5 text-zinc-500">3 saved comparisons/month. Pro limits are prepared for later.</p>
            </div>

            <Link
              href="/settings"
              title={displayEmail ? `${displayName} (${displayEmail})` : displayName}
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white group-data-[collapsible=icon]:justify-center"
            >
              <Avatar size="sm" className="size-7 shrink-0">
                {user.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                <AvatarFallback className="bg-zinc-700 text-xs text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm leading-5">{displayName}</p>
                {displayEmail ? <p className="truncate text-xs text-zinc-500">{displayEmail}</p> : null}
              </div>
            </Link>

            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start rounded-lg px-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white group-data-[collapsible=icon]:hidden"
              disabled={isSigningOut}
              onClick={() => {
                void handleSignOut()
              }}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-svh bg-[#212121]">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#212121]/90 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger className="size-9 rounded-lg border border-white/10 bg-[#2f2f2f] text-zinc-300 hover:bg-zinc-700 md:hidden" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{currentTitle(pathname)}</p>
              <p className="truncate text-xs text-zinc-500">Compare anything with sources, risks, and tradeoffs</p>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
