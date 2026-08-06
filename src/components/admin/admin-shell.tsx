"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Activity, CreditCard, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react"

import { adminLogoutAction } from "@/app/admin/actions"
import { BrandLogo } from "@/components/brand-logo"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
] as const

function SidebarContent({ pathname, email, close }: { pathname: string; email: string; close?: () => void }) {
  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-white/8 px-5">
        <BrandLogo className="size-9" priority />
        <div><p className="font-display text-sm tracking-wide text-white">GrowthAI</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Admin control</p></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-600">Workspace</p>
        {navigation.map((item) => {
          const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return <Link key={item.href} href={item.href} onClick={close} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-neutral-400 transition hover:bg-white/6 hover:text-white", active && "bg-primary/10 text-primary ring-1 ring-primary/15")}><item.icon className="size-[18px]" />{item.label}</Link>
        })}
      </nav>
      <div className="border-t border-white/8 p-3">
        <div className="mb-2 rounded-xl bg-white/[.035] px-3 py-3"><p className="text-[10px] uppercase tracking-wider text-neutral-600">Signed in as</p><p className="mt-1 truncate text-xs font-semibold text-neutral-300">{email}</p></div>
        <form action={adminLogoutAction}><button type="submit" className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-neutral-500 transition hover:bg-red-500/8 hover:text-red-300"><LogOut className="size-4" />Sign out</button></form>
      </div>
    </>
  )
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-svh bg-[#080a0b] text-neutral-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/8 bg-[#0c0f10] lg:flex"><SidebarContent pathname={pathname} email={email} /></aside>
      {mobileOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close admin menu" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-[#0c0f10]"><button aria-label="Close admin menu" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 z-10 flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5"><X className="size-5" /></button><SidebarContent pathname={pathname} email={email} close={() => setMobileOpen(false)} /></aside></div> : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#080a0b]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3"><button type="button" aria-label="Open admin menu" onClick={() => setMobileOpen(true)} className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 lg:hidden"><Menu className="size-5" /></button><div><p className="text-xs font-bold text-white">Admin workspace</p><p className="hidden text-[10px] text-neutral-600 sm:block">Protected operational access</p></div></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" />Secure session</div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  )
}
