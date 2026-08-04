"use client"

import Link from "next/link"
import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ComputerSettingsIcon,
  DashboardSquare01Icon,
  File01Icon,
  Folder01Icon,
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
  { href: "/dashboard", label: "Today", icon: DashboardSquare01Icon },
  { href: "/goals", label: "My intentions", icon: Folder01Icon },
  { href: "/reviews", label: "Weekly reviews", icon: File01Icon },
  { href: "/settings", label: "Settings", icon: ComputerSettingsIcon },
] as const

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "U"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  if (href === "/goals") return pathname.startsWith("/goals")
  return pathname === href || pathname.startsWith(`${href}/`)
}

function currentTitle(pathname: string): string {
  if (pathname.startsWith("/goals")) return "My intentions"
  if (pathname.startsWith("/reviews")) return "Weekly reviews"
  if (pathname.startsWith("/settings")) return "Settings"
  return "Today"
}

export function UserSidebarShell({ children, user }: UserSidebarShellProps) {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const displayName = user.name ?? "GrowthAI member"
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
        <Sidebar collapsible="icon" className="border-r border-neutral-200 bg-white text-neutral-900">
          <SidebarHeader className="gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="size-9 shrink-0 rounded-lg border-0 bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" />
              <Link
                href="/dashboard"
                className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 font-display text-sm text-neutral-950 hover:bg-neutral-100 group-data-[collapsible=icon]:hidden"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-xs font-semibold text-white">
                  G
                </span>
                <span className="truncate">GrowthAI</span>
              </Link>
            </div>

            <Link
              href="/goals"
              className="flex h-10 items-center rounded-full bg-neutral-950 px-4 text-xs font-bold text-white transition hover:bg-neutral-800 group-data-[collapsible=icon]:hidden"
            >
              + New intention
            </Link>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 pb-2">
            <SidebarGroup className="space-y-1 px-0 py-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                    isActive(pathname, item.href) && "bg-neutral-100 font-semibold text-neutral-950"
                  )}
                  title={item.label}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              ))}
            </SidebarGroup>

          </SidebarContent>

          <SidebarFooter className="border-t border-neutral-200 p-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 group-data-[collapsible=icon]:hidden">
              <p className="text-xs leading-5 text-neutral-500">Growth does not need to be loud to be real.</p>
            </div>

            <Link
              href="/settings"
              title={displayEmail ? `${displayName} (${displayEmail})` : displayName}
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 group-data-[collapsible=icon]:justify-center"
            >
              <Avatar size="sm" className="size-7 shrink-0">
                {user.image ? <AvatarImage src={user.image} alt={displayName} /> : null}
                <AvatarFallback className="bg-neutral-950 text-xs text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm leading-5">{displayName}</p>
                {displayEmail ? <p className="truncate text-xs text-neutral-400">{displayEmail}</p> : null}
              </div>
            </Link>

            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start rounded-lg px-2 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 group-data-[collapsible=icon]:hidden"
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

        <SidebarInset className="min-h-svh bg-[#fafafa]">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-[#fafafa]/90 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger className="size-9 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 md:hidden" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-neutral-900">{currentTitle(pathname)}</p>
              <p className="truncate text-xs text-neutral-400">A quiet space for meaningful change</p>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
