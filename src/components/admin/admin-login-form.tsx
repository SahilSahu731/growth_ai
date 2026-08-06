"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { LockKeyhole, Mail } from "lucide-react"

import { adminLoginAction, type AdminActionState } from "@/app/admin/actions"

const initialState: AdminActionState = {}

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? "Verifying credentials…" : "Enter admin workspace"}
    </button>
  )
}

function CredentialField({ name, label, type, autoComplete, icon: Icon, placeholder }: {
  name: string; label: string; type: "email" | "password"; autoComplete: string; icon: typeof Mail; placeholder: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-neutral-300">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-xl border border-[#2d3538] bg-[#111719] px-4 transition focus-within:border-cyan-300/60 focus-within:bg-[#141c1f] focus-within:ring-4 focus-within:ring-cyan-300/5">
        <Icon className="size-4 shrink-0 text-[#77878c]" />
        <input name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} required className="admin-login-input min-w-0 flex-1 bg-transparent text-sm text-[#f5f7f7] caret-cyan-300 outline-none placeholder:text-[#647277]" />
      </span>
    </label>
  )
}

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLoginAction, initialState)
  return (
    <form action={action} className="mt-8 space-y-5">
      <CredentialField name="email" label="Admin email" type="email" autoComplete="username" icon={Mail} placeholder="admin@company.com" />
      <CredentialField name="password" label="Admin password" type="password" autoComplete="current-password" icon={LockKeyhole} placeholder="Your admin password" />
      {state.error ? <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-xs leading-5 text-red-300">{state.error}</p> : null}
      <LoginButton />
    </form>
  )
}
