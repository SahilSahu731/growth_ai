"use client"

import Link from "next/link"
import { useActionState, useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowRight, ArrowUp, Brain, Check, CheckCircle2, Copy, FileText, Flag, ListTodo, LockKeyhole, Sparkles, Target, ThumbsDown, ThumbsUp, WifiOff, type LucideIcon } from "lucide-react"

import {
  acceptOperatorTasksAction,
  editOperatorTaskProposalAction,
  loadOlderMessagesAction,
  sendOperatorMessageAction,
  submitMessageFeedbackAction,
  stopOperatorGenerationAction,
  type ChatActionState,
  type OperatorFormState,
} from "@/app/(user)/chat/actions"
import { BrandLogo } from "@/components/brand-logo"
import { EditableTaskCard } from "@/components/operator/editable-task-card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { addDateDays, dateKeyInTimeZone, formatDateOnly } from "@/lib/date-time"
import type { OperatorMessage, OperatorTask, OperatorWeeklyActivity, OperatorWorkspace } from "@/lib/operator/types"

const starters = [
  "I feel stuck but don’t know why",
  "I know what I want but cannot stay consistent",
  "I need help deciding what to do next",
]

export function ChatExperience({ workspace, weeklyActivity, userName }: { workspace: OperatorWorkspace; weeklyActivity: OperatorWeeklyActivity | null; userName: string }) {
  const draftStorageKey = `growthai:chat-draft:${workspace.conversation.id}`
  const [draft, setDraft] = useState("")
  const [olderMessages, setOlderMessages] = useState<OperatorMessage[]>([])
  const [historyCursor, setHistoryCursor] = useState(workspace.messageCursor)
  const [historyDone, setHistoryDone] = useState(!workspace.hasMoreMessages)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [online, setOnline] = useState(true)
  const submitMessage = useCallback(async (previous: ChatActionState, formData: FormData) => {
    const next = await sendOperatorMessageAction(previous, formData)
    if (next.sentAt) {
      setDraft("")
      window.localStorage.removeItem(draftStorageKey)
    }
    return next
  }, [draftStorageKey])
  const [state, sendAction, pending] = useActionState(submitMessage, {} as ChatActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const firstName = userName.trim().split(/\s+/)[0] || "there"
  const recentIds = new Set(workspace.messages.map((message) => message.id))
  const messages = [...olderMessages.filter((message) => !recentIds.has(message.id)), ...workspace.messages]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length])

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setDraft(window.localStorage.getItem(draftStorageKey) ?? "")
    }, 0)
    return () => window.clearTimeout(restoreTimer)
  }, [draftStorageKey])

  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update) }
  }, [])

  function updateDraft(value: string) {
    setDraft(value)
    if (value) window.localStorage.setItem(draftStorageKey, value)
    else window.localStorage.removeItem(draftStorageKey)
  }

  async function loadEarlierMessages() {
    if (loadingHistory || historyDone || !historyCursor) return
    setLoadingHistory(true)
    const result = await loadOlderMessagesAction(workspace.conversation.id, historyCursor)
    if (!("error" in result)) {
      setOlderMessages((current) => {
        const known = new Set([...current, ...workspace.messages].map((message) => message.id))
        return [...result.page.filter((message) => !known.has(message.id)), ...current]
      })
      setHistoryCursor(result.continueCursor)
      setHistoryDone(result.isDone)
    }
    setLoadingHistory(false)
  }

  return (
    <div className="grid h-svh min-h-0 w-full overflow-hidden bg-[#111] xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="relative flex min-h-0 flex-col bg-[#171717]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[.08] px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 size-9 rounded-lg text-white/50 hover:bg-white/[.06] hover:text-white md:hidden" />
            <BrandLogo className="size-8" priority />
            <div>
              <p className="text-sm font-semibold text-white">GrowthAI</p>
              <p className="text-[10px] capitalize tracking-wide text-white/35">{workspace.conversation.state.replaceAll("_", " ")}</p>
            </div>
          </div>
          {online ? <span className="hidden rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1 text-[10px] font-medium text-white/40 sm:inline-flex">Your AI growth operator</span> : <span role="status" className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-[10px] text-amber-200"><WifiOff className="size-3" />Offline — draft is saved</span>}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyConversation firstName={firstName} conversationId={workspace.conversation.id} workspace={workspace} weeklyActivity={weeklyActivity} sendAction={sendAction} pending={pending} />
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-7 sm:py-10">
              {!historyDone ? <button type="button" disabled={loadingHistory} onClick={() => void loadEarlierMessages()} className="mx-auto mb-8 block rounded-full border border-white/10 px-4 py-2 text-xs text-white/55 transition hover:border-primary/30 hover:text-white disabled:opacity-50">{loadingHistory ? "Loading…" : "Load earlier messages"}</button> : null}
              {messages.map((message) => (
                <Message key={message.id} message={message} conversationId={workspace.conversation.id} sendAction={sendAction} pending={pending} locale={workspace.locale} timezone={workspace.timezone} />
              ))}
              {pending ? <Thinking conversationId={workspace.conversation.id} /> : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {workspace.tasks.length ? (
          <details className="mx-4 mb-2 shrink-0 rounded-xl border border-white/[.09] bg-[#202020] xl:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-white/70">
              <span className="flex items-center gap-2"><ListTodo className="size-4 text-primary" />Today & next</span>
              <span className="rounded-full bg-primary/[.12] px-2 py-0.5 text-[10px] text-primary">{workspace.tasks.length}</span>
            </summary>
            <div className="max-h-52 space-y-2 overflow-y-auto border-t border-white/[.08] p-2.5">
              {workspace.tasks.map((task) => <EditableTaskCard key={task.id} task={task} goals={workspace.goals} locale={workspace.locale} compact />)}
            </div>
          </details>
        ) : null}

        <div className="shrink-0 bg-[linear-gradient(to_top,#171717_75%,transparent)] px-4 pb-4 pt-3 sm:px-7 sm:pb-6">
          <form ref={formRef} action={sendAction} onSubmit={assignNewRequestId} className="mx-auto max-w-3xl">
            <input type="hidden" name="conversationId" value={workspace.conversation.id} />
            <input type="hidden" name="requestId" />
            <div className="rounded-2xl border border-white/[.12] bg-[#242424] p-2 shadow-[0_12px_35px_rgba(0,0,0,.3)] transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/[.05]">
              <textarea
                name="message"
                value={draft}
                onChange={(event) => updateDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    if (draft.trim() && !pending) formRef.current?.requestSubmit()
                  }
                }}
                placeholder="Talk about what feels stuck, ask for a plan, or say ‘I’m stuck’…"
                rows={2}
                maxLength={4000}
                className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/25"
              />
              <div className="flex items-center justify-between gap-3 px-1 pb-1">
                <p className="hidden text-[10px] text-white/25 sm:block">GrowthAI can make mistakes. Keep major life decisions yours.</p>
                <button
                  type="submit"
                  disabled={!online || pending || draft.trim().length < 2}
                  aria-label="Send message"
                  className="ml-auto flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/85 disabled:bg-white/10 disabled:text-white/25"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            </div>
            {state.error ? <p role="alert" className="mt-2 px-2 text-xs text-red-300">{state.error}</p> : null}
          </form>
        </div>
      </section>

      <TaskPanel tasks={workspace.tasks} goals={workspace.goals} locale={workspace.locale} />
    </div>
  )
}

function EmptyConversation({
  firstName,
  conversationId,
  workspace,
  weeklyActivity,
  sendAction,
  pending,
}: {
  firstName: string
  conversationId: string
  workspace: OperatorWorkspace
  weeklyActivity: OperatorWeeklyActivity | null
  sendAction: (payload: FormData) => void
  pending: boolean
}) {
  const activeGoals = workspace.goals.filter((goal) => goal.status === "active").length
  const reportReady = weeklyActivity?.enoughData ?? false
  const mapReady = (weeklyActivity?.conversationTurns ?? 0) >= 3 || activeGoals > 0

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_35px_rgba(114,231,255,.15)]"><Sparkles className="size-4" /></span>
        <p className="text-sm font-semibold text-primary">Hey {firstName}. What are we moving forward?</p>
      </div>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-.045em] text-white sm:text-5xl">Start a conversation or open your growth workspace.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">GrowthAI turns useful context into goals, focused tasks, and an honest view of your progress.</p>

      <div className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureShortcut href="/tasks" icon={ListTodo} label="Tasks" detail={`${weeklyActivity?.openTasks ?? workspace.tasks.length} open`} />
        <FeatureShortcut href="/goals" icon={Target} label="Goals" detail={`${activeGoals} of ${workspace.goalLimit} active`} />
        <FeatureShortcut href={reportReady ? "/weekly-report" : undefined} icon={FileText} label="Weekly report" detail={reportReady ? "Ready to review" : "Needs more activity"} locked={!reportReady} />
        <FeatureShortcut href={mapReady ? "/growth-map" : undefined} icon={Brain} label="Growth map" detail={mapReady ? "See your direction" : "Build context first"} locked={!mapReady} />
      </div>

      <p className="mt-8 text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Or start with one of these</p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {starters.map((starter) => (
          <form key={starter} action={sendAction} onSubmit={assignNewRequestId}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <input type="hidden" name="requestId" />
            <button
              name="message"
              value={starter}
              disabled={pending}
              className="group flex h-full min-h-20 w-full items-start justify-between gap-3 rounded-xl border border-white/[.09] bg-white/[.035] px-4 py-3.5 text-left text-sm leading-5 text-white/70 transition hover:border-primary/30 hover:bg-primary/[.07] hover:text-white disabled:opacity-40"
            >
              {starter}
              <ArrowUp className="size-4 rotate-45 text-white/25 transition group-hover:text-primary" />
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}

function FeatureShortcut({ href, icon: Icon, label, detail, locked = false }: { href?: string; icon: LucideIcon; label: string; detail: string; locked?: boolean }) {
  const content = <><span className="flex size-9 items-center justify-center rounded-xl bg-primary/[.1] text-primary"><Icon className="size-4" /></span><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-sm font-semibold text-white/80">{label}</p><p className="mt-1 text-[10px] text-white/35">{detail}</p></div>{locked ? <LockKeyhole className="mb-1 size-3.5 text-white/20" /> : <ArrowRight className="mb-1 size-3.5 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-primary" />}</div></>
  const className = "group rounded-2xl border border-white/[.09] bg-white/[.035] p-4 text-left transition"
  if (!href) return <div className={`${className} cursor-not-allowed opacity-60`} aria-disabled="true">{content}</div>
  return <Link href={href} className={`${className} hover:border-primary/30 hover:bg-primary/[.06]`}>{content}</Link>
}

function Message({
  message,
  conversationId,
  sendAction,
  pending,
  locale,
  timezone,
}: {
  message: OperatorMessage
  conversationId: string
  sendAction: (payload: FormData) => void
  pending: boolean
  locale: string
  timezone: string
}) {
  if (message.role === "user") {
    return (
      <div className="mb-8 flex flex-col items-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2b2b2b] px-4 py-3 text-sm leading-6 text-white/85 sm:max-w-[72%]">{message.content}</div>
        {message.generationStatus === "failed" && message.requestId ? (
          <form action={sendAction}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <input type="hidden" name="requestId" value={message.requestId} />
            <input type="hidden" name="message" value={message.content} />
            <button disabled={pending} className="rounded-full border border-red-300/20 px-3 py-1.5 text-[10px] font-semibold text-red-200 transition hover:border-red-300/40 disabled:opacity-50">Retry answer</button>
          </form>
        ) : message.generationStatus === "pending" ? <span className="text-[10px] text-white/35">Answer pending…</span> : null}
        {message.generationStatus !== "pending" ? (
          <details className="max-w-[85%] text-right sm:max-w-[72%]">
            <summary className="cursor-pointer list-none text-[10px] text-white/30 hover:text-white/60">Edit and resend</summary>
            <form action={sendAction} onSubmit={assignNewRequestId} className="mt-2 rounded-xl border border-white/[.08] bg-[#202020] p-2 text-left">
              <input type="hidden" name="conversationId" value={conversationId} />
              <input type="hidden" name="requestId" />
              <textarea name="message" defaultValue={message.content} minLength={2} maxLength={4000} rows={3} required className="w-full resize-y bg-transparent px-2 py-1.5 text-xs leading-5 text-white/80 outline-none" />
              <div className="flex items-center justify-between gap-3 border-t border-white/[.07] px-2 pt-2">
                <span className="text-[9px] text-white/25">Sent as a new turn; the original stays in history.</span>
                <button disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground disabled:opacity-50">Resend</button>
              </div>
            </form>
          </details>
        ) : null}
      </div>
    )
  }

  return (
    <article className="mb-10 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4">
      <BrandLogo className="size-8 sm:size-9" />
      <div className="min-w-0 pt-1">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">{message.content}</p>
        <MessageActions message={message} />

        {message.taskDrafts.length ? (
          <TaskProposal message={message} conversationId={conversationId} locale={locale} timezone={timezone} />
        ) : null}

        {message.quickReplies.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {message.quickReplies.map((reply) => (
              <form key={reply} action={sendAction} onSubmit={assignNewRequestId}>
                <input type="hidden" name="conversationId" value={conversationId} />
                <input type="hidden" name="requestId" />
                <button
                  name="message"
                  value={reply}
                  disabled={pending}
                  className="rounded-full border border-white/[.11] bg-white/[.035] px-3.5 py-2 text-xs font-medium text-white/60 transition hover:border-primary/40 hover:bg-primary/[.08] hover:text-white disabled:opacity-40"
                >
                  {reply}
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function MessageActions({ message }: { message: OperatorMessage }) {
  const [saved, setSaved] = useState<string | null>(null)
  async function feedback(rating: "useful" | "not_useful" | "reported", reason?: string) {
    const data = new FormData()
    data.set("messageId", message.id)
    data.set("rating", rating)
    if (reason) data.set("reason", reason)
    const result = await submitMessageFeedbackAction(data)
    if (result.success) setSaved(rating)
  }
  function report() {
    const reason = window.prompt("What was wrong with this response? Do not include passwords or payment information.", "")
    if (reason === null) return
    void feedback("reported", reason.slice(0, 300))
  }
  return <div className="mt-2 flex items-center gap-1 text-white/25"><span className="mr-2 text-[9px]">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</span><button type="button" onClick={() => void navigator.clipboard.writeText(message.content)} aria-label="Copy response" className="rounded-md p-1.5 hover:bg-white/[.06] hover:text-white"><Copy className="size-3.5" /></button><button type="button" onClick={() => void feedback("useful")} aria-label="Useful response" className={`rounded-md p-1.5 hover:bg-white/[.06] hover:text-white ${saved === "useful" ? "text-primary" : ""}`}><ThumbsUp className="size-3.5" /></button><button type="button" onClick={() => void feedback("not_useful")} aria-label="Not useful response" className={`rounded-md p-1.5 hover:bg-white/[.06] hover:text-white ${saved === "not_useful" ? "text-primary" : ""}`}><ThumbsDown className="size-3.5" /></button><button type="button" onClick={report} aria-label="Report response" className={`rounded-md p-1.5 hover:bg-red-400/10 hover:text-red-300 ${saved === "reported" ? "text-red-300" : ""}`}><Flag className="size-3.5" /></button>{saved ? <span role="status" className="ml-1 text-[9px] text-white/35">Saved</span> : null}</div>
}

function assignNewRequestId(event: FormEvent<HTMLFormElement>) {
  const input = event.currentTarget.elements.namedItem("requestId")
  if (input instanceof HTMLInputElement) input.value = crypto.randomUUID()
}

function TaskProposal({ message, conversationId, locale, timezone }: { message: OperatorMessage; conversationId: string; locale: string; timezone: string }) {
  const [state, action, pending] = useActionState(acceptOperatorTasksAction, {} as OperatorFormState)
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/[.1] bg-[#202020]">
      <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/70"><ListTodo className="size-4 text-primary" />Proposed tasks</div>
        <span className="text-[10px] text-white/30">Review before adding</span>
      </div>
      <div className="divide-y divide-white/[.07]">
        {message.taskDrafts.map((task, index) => (
          <div key={`${task.title}-${index}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 px-4 py-3.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary/[.12] text-[10px] font-bold text-primary">{index + 1}</span>
            <div>
              <p className="text-sm font-semibold text-white/80">{task.title}</p>
              <span className="mt-1.5 inline-flex rounded-full bg-primary/[.1] px-2 py-0.5 text-[9px] font-bold text-primary">Goal · {task.goalTitle || "Personal growth"}</span>
              {task.note ? <p className="mt-1 text-xs leading-5 text-white/35">{task.note}</p> : null}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/30">
                <span>{formatTaskDate(task.scheduledFor, locale, timezone)}</span>
                <span>{task.estimatedMinutes} min</span>
                <span>Done when: {task.completionCondition}</span>
              </div>
              {!message.tasksAcceptedAt ? <details className="mt-3"><summary className="cursor-pointer text-[10px] font-semibold text-primary">Edit before adding</summary><form action={editOperatorTaskProposalAction} className="mt-3 grid gap-2 rounded-xl border border-white/[.08] bg-black/10 p-3 sm:grid-cols-2"><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="messageId" value={message.id} /><input type="hidden" name="index" value={index} /><input name="title" defaultValue={task.title} minLength={3} maxLength={120} required className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white" /><input name="goalTitle" defaultValue={task.goalTitle || "Personal growth"} maxLength={80} required className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white" /><input name="scheduledFor" type="date" defaultValue={task.scheduledFor} required className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white" /><input name="estimatedMinutes" type="number" min={5} max={240} step={5} defaultValue={task.estimatedMinutes} required className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white" /><input name="completionCondition" defaultValue={task.completionCondition} minLength={3} maxLength={220} required className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white sm:col-span-2" /><textarea name="note" defaultValue={task.note} maxLength={300} placeholder="Why this supports the goal" className="min-h-16 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white sm:col-span-2" /><button className="h-9 rounded-lg border border-primary/30 px-3 text-xs font-semibold text-primary sm:col-span-2">Save proposal</button></form></details> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-white/[.08] p-3">
        {message.tasksAcceptedAt ? (
          <span className="inline-flex h-9 items-center gap-2 px-2 text-xs font-semibold text-primary"><Check className="size-4" />Added to Today</span>
        ) : (
          <form action={action}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <input type="hidden" name="messageId" value={message.id} />
            <button disabled={pending} className="h-9 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/85 disabled:opacity-50">{pending ? "Adding…" : "Add tasks to Today"}</button>
          </form>
        )}
      </div>
      {state.error ? <p role="alert" className="border-t border-white/[.08] px-4 py-3 text-xs text-red-300">{state.error}</p> : null}
    </div>
  )
}

function TaskPanel({ tasks, goals, locale }: { tasks: OperatorTask[]; goals: OperatorWorkspace["goals"]; locale: string }) {
  return (
    <aside className="hidden min-h-0 flex-col border-l border-white/[.08] bg-[#121212] xl:flex">
      <div className="border-b border-white/[.08] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Today & next</p>
            <p className="mt-1 text-[11px] text-white/35">Up to three meaningful tasks a day</p>
          </div>
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/[.05] text-primary"><ListTodo className="size-4" /></span>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
        {tasks.length ? (
          <div className="space-y-2">
            {tasks.map((task) => <EditableTaskCard key={task.id} task={task} goals={goals} locale={locale} compact />)}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/[.05] text-white/25"><CheckCircle2 className="size-5" /></span>
            <p className="mt-4 text-sm font-semibold text-white/60">No tasks yet</p>
            <p className="mt-2 text-xs leading-5 text-white/30">Talk first. GrowthAI will propose actions only when there is enough context.</p>
          </div>
        )}
      </div>
    </aside>
  )
}

function Thinking({ conversationId }: { conversationId: string }) {
  return (
    <div className="mb-10 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4">
      <BrandLogo className="size-8 sm:size-9" />
      <div className="flex items-center gap-3 pt-3"><span className="flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-white/30" /><span className="size-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:120ms]" /><span className="size-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" /></span><form action={stopOperatorGenerationAction}><input type="hidden" name="conversationId" value={conversationId} /><button className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/45 hover:border-red-300/30 hover:text-red-200">Stop generating</button></form></div>
    </div>
  )
}

function formatTaskDate(value: string, locale: string, timezone: string) {
  const today = dateKeyInTimeZone(new Date(), timezone)
  if (value === today) return "Today"
  if (value === addDateDays(today, 1)) return "Tomorrow"
  return formatDateOnly(value, locale, { month: "short", day: "numeric" })
}
