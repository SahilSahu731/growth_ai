"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { AlertTriangle, Save, ShieldBan, ShieldCheck, Trash2 } from "lucide-react"

import {
  deleteConversationAction,
  deleteUserAction,
  setGoalStatusAction,
  setTaskStatusAction,
  setUserAccessAction,
  updateUserAction,
  type AdminActionState,
} from "@/app/admin/actions"
import type { AdminPlanTier, AdminUser } from "@/lib/data/admin"

const initial: AdminActionState = {}
const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/[.035] px-3 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"

function SubmitButton({ children, destructive = false, icon: Icon = Save }: { children: React.ReactNode; destructive?: boolean; icon?: typeof Save }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className={destructive ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 text-xs font-bold text-red-300 transition hover:bg-red-500/15 disabled:opacity-50" : "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/85 disabled:opacity-50"}><Icon className="size-4" />{pending ? "Saving…" : children}</button>
}

function Feedback({ state }: { state: AdminActionState }) {
  if (!state.error && !state.success) return null
  return <p role="status" className={state.error ? "text-xs text-red-300" : "text-xs text-emerald-400"}>{state.error ?? state.success}</p>
}

export function AdminUserEditor({ user }: { user: AdminUser }) {
  const [state, action] = useActionState(updateUserAction, initial)
  return <form action={action} className="space-y-4"><input type="hidden" name="userId" value={user.id} /><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Display name</span><input className={inputClass} name="name" defaultValue={user.name} minLength={2} maxLength={100} required /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Plan entitlement</span><select className={inputClass} name="planTier" defaultValue={user.planTier}>{(["free", "pro", "founder", "team"] satisfies AdminPlanTier[]).map((tier) => <option key={tier} value={tier}>{tier[0].toUpperCase() + tier.slice(1)}</option>)}</select></label><div className="flex items-center justify-between gap-3"><Feedback state={state} /><SubmitButton>Save changes</SubmitButton></div></form>
}

export function AdminAccessControl({ user }: { user: AdminUser }) {
  const [state, action] = useActionState(setUserAccessAction, initial)
  const suspended = user.accountStatus === "suspended" || Boolean(user.deletedAt)
  return <form action={action} className="space-y-3"><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="suspended" value={suspended ? "false" : "true"} /><p className="text-xs leading-5 text-neutral-500">{suspended ? "Restoring lets this account authenticate and use product routes again." : "Suspension invalidates product access on the next session check without deleting data."}</p>{!suspended ? <label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Suspension reason</span><textarea className={`${inputClass} min-h-24 py-3`} name="reason" minLength={3} maxLength={300} required /></label> : user.suspensionReason ? <p className="rounded-xl border border-white/8 bg-white/[.025] p-3 text-xs text-neutral-400">Reason: {user.suspensionReason}</p> : null}<Feedback state={state} /><SubmitButton destructive={!suspended} icon={suspended ? ShieldCheck : ShieldBan}>{suspended ? "Restore account access" : "Suspend account access"}</SubmitButton></form>
}

export function AdminGoalStatusForm({ userId, goalId, status }: { userId: string; goalId: string; status: string }) {
  const [state, action] = useActionState(setGoalStatusAction, initial)
  return <form action={action} className="flex flex-wrap items-center gap-2"><input type="hidden" name="userId" value={userId} /><input type="hidden" name="goalId" value={goalId} /><select name="status" defaultValue={status} className="h-9 rounded-lg border border-white/10 bg-[#111516] px-2 text-xs outline-none"><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select><SubmitButton>Update</SubmitButton><Feedback state={state} /></form>
}

export function AdminTaskStatusForm({ userId, taskId, status }: { userId: string; taskId: string; status: string }) {
  const [state, action] = useActionState(setTaskStatusAction, initial)
  return <form action={action} className="flex flex-wrap items-center gap-2"><input type="hidden" name="userId" value={userId} /><input type="hidden" name="taskId" value={taskId} /><select name="status" defaultValue={status} className="h-9 rounded-lg border border-white/10 bg-[#111516] px-2 text-xs outline-none"><option value="todo">To do</option><option value="done">Done</option><option value="dismissed">Dismissed</option></select><SubmitButton>Update</SubmitButton><Feedback state={state} /></form>
}

export function AdminDeleteConversationForm({ userId, conversationId, title }: { userId: string; conversationId: string; title: string }) {
  const [state, action] = useActionState(deleteConversationAction, initial)
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete “${title}” and all of its messages? This cannot be undone.`)) event.preventDefault() }} className="flex items-center gap-2"><input type="hidden" name="userId" value={userId} /><input type="hidden" name="conversationId" value={conversationId} /><SubmitButton destructive icon={Trash2}>Delete</SubmitButton><Feedback state={state} /></form>
}

export function AdminDeleteUserForm({ user }: { user: AdminUser }) {
  const [state, action] = useActionState(deleteUserAction, initial)
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Permanently delete this account and all owned product data? This cannot be undone.")) event.preventDefault() }} className="space-y-4"><input type="hidden" name="userId" value={user.id} /><div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" /><p className="text-xs leading-5 text-red-200/70">This removes the user, conversations, messages, goals, tasks, and subscriptions. Billing audit events remain intact.</p></div><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Type <strong className="text-neutral-200">{user.email}</strong> to confirm</span><input className={inputClass} name="confirmationEmail" type="email" autoComplete="off" required /></label><Feedback state={state} /><SubmitButton destructive icon={Trash2}>Permanently delete user</SubmitButton></form>
}
