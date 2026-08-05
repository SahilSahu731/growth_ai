"use client"

import Link from "next/link"
import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Brain02Icon,
  Calendar03Icon,
  ComputerSettingsIcon,
  File01Icon,
  Target01Icon,
  Task01Icon,
  VoiceIcon,
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
    planTier: "free" | "pro" | "founder"
  }
  conversations: Array<{ id: string; title: string }>
}

const NAV_ITEMS = [
  { href: "/goals", label: "Goals", icon: Target01Icon },
  { href: "/tasks", label: "Tasks", icon: Task01Icon },
  { href: "/weekly-report", label: "Weekly report", icon: File01Icon },
  { href: "/growth-map", label: "Growth map", icon: Brain02Icon },
  { href: "/settings", label: "Settings", icon: ComputerSettingsIcon },
] as const

const PRO_ITEMS = [
  { label: "Calendar operator", icon: Calendar03Icon },
  { label: "Deep insights", icon: Analytics01Icon },
  { label: "Voice coach", icon: VoiceIcon },
] as const

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "U"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function currentTitle(pathname: string): string {
  if (pathname.startsWith("/chat")) return "Chat"
  if (pathname.startsWith("/goals")) return "Goals"
  if (pathname.startsWith("/tasks")) return "Tasks"
  if (pathname.startsWith("/weekly-report")) return "Weekly report"
  if (pathname.startsWith("/growth-map")) return "Growth map"
  if (pathname.startsWith("/settings")) return "Settings"
  return "GrowthAI"
}

export function UserSidebarShell({ children, user, conversations }: UserSidebarShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isChat = pathname.startsWith("/chat")
  const activeConversationId = searchParams.get("conversation")
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
                href="/chat"
                className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 font-display text-sm text-neutral-950 hover:bg-neutral-100 group-data-[collapsible=icon]:hidden"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-xs font-semibold text-white">
                  G
                </span>
                <span className="truncate">GrowthAI</span>
              </Link>
            </div>

            <Link
              href="/chat?new=1"
              className="flex h-10 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/85 group-data-[collapsible=icon]:hidden"
            >
              + New chat
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

            <SidebarGroup className="space-y-1 border-t border-neutral-200 px-0 py-3 group-data-[collapsible=icon]:hidden">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Pro tools</p>
              {PRO_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href="/pricing"
                  className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">Pro</span>
                </Link>
              ))}
            </SidebarGroup>

            {conversations.length ? (
              <SidebarGroup className="space-y-1 border-t border-neutral-200 px-0 py-3 group-data-[collapsible=icon]:hidden">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Recent chats</p>
                {conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/chat?conversation=${encodeURIComponent(conversation.id)}`}
                    className={cn(
                      "block truncate rounded-lg px-2 py-2 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950",
                      activeConversationId === conversation.id && "bg-neutral-100 font-semibold text-neutral-950"
                    )}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </Link>
                ))}
              </SidebarGroup>
            ) : null}
          </SidebarContent>

          <SidebarFooter className="border-t border-neutral-200 p-2">
            {user.planTier === "free" ? <Link href="/pricing" className="rounded-xl border border-primary/20 bg-primary/[.06] p-3 group-data-[collapsible=icon]:hidden"><p className="text-xs font-semibold text-neutral-800">Unlock GrowthAI Pro</p><p className="mt-1 text-[10px] leading-4 text-neutral-500">Calendar actions, deeper memory, and voice.</p></Link> : null}

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

        <SidebarInset className={cn("min-h-svh bg-[#fafafa]", isChat && "h-svh overflow-hidden bg-[#171717]")}>
          {!isChat ? <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-[#fafafa]/90 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger className="size-9 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 md:hidden" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-neutral-900">{currentTitle(pathname)}</p>
              <p className="truncate text-xs text-neutral-400">A quiet space for meaningful change</p>
            </div>
          </header> : null}

          <main className={cn("flex-1", isChat ? "min-h-0 overflow-hidden p-0" : "p-4 sm:p-6 lg:p-8")}>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
