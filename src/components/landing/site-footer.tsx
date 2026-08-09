import Link from "next/link"
import { ArrowUpRight, Heart, Mail, ShieldCheck } from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { legalDetails } from "@/lib/legal"

export function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
  const supportEmail = legalDetails().supportContact
  const primaryHref = signedIn ? "/chat" : "/signup"
  const primaryLabel = signedIn ? "Return to your space" : "Start growing free"

  return <footer className="mt-16 w-full overflow-hidden border-t border-[#2b2b2b] bg-[#0d0d0d] text-[#efefec]">
    <div className="relative border-b border-[#252525]">
      <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-primary/[.055] blur-[100px]" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:justify-between lg:px-12">
        <div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[.16em] text-primary">A calmer next step</p><h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-5xl">Build a life that feels<br /><span className="font-editorial font-normal italic text-[#8b8b86]">more like your own.</span></h2><p className="mt-5 max-w-xl text-sm font-normal leading-7 text-[#92928d] sm:text-base">Turn honest conversations into clear goals, manageable tasks, and reflection that helps without adding pressure.</p></div>
        <Link href={primaryHref} className="group inline-flex h-12 w-fit shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85">{primaryLabel}<ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
      </section>
    </div>

    <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_.65fr_.65fr_.65fr_.9fr] lg:px-12">
      <div className="max-w-sm"><Link href="/" className="inline-flex items-center gap-3 font-display text-lg tracking-wide"><BrandLogo className="size-10" />GrowthAI</Link><p className="mt-5 text-sm font-normal leading-7 text-[#a3a39e]">An access-controlled AI growth operator for choosing meaningful direction, taking smaller steps, and learning what genuinely helps.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-normal text-[#91918c]"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" />Export and deletion controls</span><span className="flex items-center gap-1.5"><Heart className="size-3.5 text-primary" />No shame loops</span></div></div>
      <FooterGroup title="Product"><FooterLink href="/#system">How it works</FooterLink><FooterLink href="/#inside">Product experience</FooterLink><FooterLink href="/pricing">Pricing</FooterLink></FooterGroup>
      <FooterGroup title="Account">{signedIn ? <><FooterLink href="/chat">Workspace</FooterLink><FooterLink href="/settings">Settings</FooterLink><FooterLink href="/billing">Plan & billing</FooterLink></> : <><FooterLink href="/signup">Create account</FooterLink><FooterLink href="/login">Log in</FooterLink><FooterLink href="/pricing">Compare plans</FooterLink></>}</FooterGroup>
      <FooterGroup title="Trust"><FooterLink href="/privacy">Privacy</FooterLink><FooterLink href="/terms">Terms</FooterLink><FooterLink href="/security">Security</FooterLink><FooterLink href="/ai-safety">AI safety</FooterLink><FooterLink href="/subprocessors">Subprocessors</FooterLink></FooterGroup>
      <FooterGroup title="Support"><FooterLink href="/contact">Contact & feedback</FooterLink><a href={`mailto:${supportEmail}`} className="flex min-h-11 items-center gap-2 text-sm font-normal text-[#b1b1ac] transition hover:text-white"><Mail className="size-4" />Email support</a><a href={`mailto:${supportEmail}?subject=GrowthAI%20public-beta%20bug%20report`} className="flex min-h-11 items-center text-sm font-normal text-[#b1b1ac] transition hover:text-white">Report a beta bug</a><p className="text-xs font-normal leading-6 text-[#8f8f8a]">Account and billing support. Public-beta target: reply within 3 business days.</p></FooterGroup>
    </div>

    <div className="border-t border-[#252525]"><div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-xs font-normal text-[#8f8f8a] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p>© {new Date().getFullYear()} GrowthAI. All rights reserved.</p><p>Public beta · A quieter way to change.</p></div></div>
  </footer>
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <nav aria-label={`${title} footer links`}><p className="mb-4 text-sm font-semibold text-[#e4e4e1]">{title}</p><div className="flex flex-col items-start gap-3">{children}</div></nav>
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="flex min-h-11 items-center text-sm font-normal text-[#b1b1ac] transition hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{children}</Link>
}
