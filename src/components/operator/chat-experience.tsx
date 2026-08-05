"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { ArrowUp, Check, CheckCircle2, ListTodo, Sparkles } from "lucide-react"

import {
  acceptOperatorTasksAction,
  sendOperatorMessageAction,
  type ChatActionState,
  type OperatorFormState,
} from "@/app/(user)/chat/actions"
import { EditableTaskCard } from "@/components/operator/editable-task-card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { OperatorMessage, OperatorTask, OperatorWorkspace } from "@/lib/operator/types"

const starters = [
  "I feel stuck but don’t know why",
  "I know what I want but cannot stay consistent",
  "I need help deciding what to do next",
]

export function ChatExperience({ workspace, userName }: { workspace: OperatorWorkspace; userName: string }) {
  const [draft, setDraft] = useState("")
  const submitMessage = useCallback(async (previous: ChatActionState, formData: FormData) => {
    const next = await sendOperatorMessageAction(previous, formData)
    if (next.sentAt) setDraft("")
    return next
  }, [])
  const [state, sendAction, pending] = useActionState(submitMessage, {} as ChatActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const firstName = userName.trim().split(/\s+/)[0] || "there"

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [workspace.messages.length])

  return (
    <div className="grid h-svh min-h-0 w-full overflow-hidden bg-[#111] xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="relative flex min-h-0 flex-col bg-[#171717]">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[.08] px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 size-9 rounded-lg text-white/50 hover:bg-white/[.06] hover:text-white md:hidden" />
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">G</span>
            <div>
              <p className="text-sm font-semibold text-white">GrowthAI</p>
              <p className="text-[10px] capitalize tracking-wide text-white/35">{workspace.conversation.state.replaceAll("_", " ")}</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-white/[.08] bg-white/[.04] px-3 py-1 text-[10px] font-medium text-white/40 sm:inline-flex">Your AI growth operator</span>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {workspace.messages.length === 0 ? (
            <EmptyConversation firstName={firstName} conversationId={workspace.conversation.id} sendAction={sendAction} pending={pending} />
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-7 sm:py-10">
              {workspace.messages.map((message) => (
                <Message key={message.id} message={message} conversationId={workspace.conversation.id} sendAction={sendAction} pending={pending} />
              ))}
              {pending ? <Thinking /> : null}
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
              {workspace.tasks.map((task) => <EditableTaskCard key={task.id} task={task} goals={workspace.goals} compact />)}
            </div>
          </details>
        ) : null}

        <div className="shrink-0 bg-[linear-gradient(to_top,#171717_75%,transparent)] px-4 pb-4 pt-3 sm:px-7 sm:pb-6">
          <form ref={formRef} action={sendAction} className="mx-auto max-w-3xl">
            <input type="hidden" name="conversationId" value={workspace.conversation.id} />
            <div className="rounded-2xl border border-white/[.12] bg-[#242424] p-2 shadow-[0_12px_35px_rgba(0,0,0,.3)] transition focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/[.05]">
              <textarea
                name="message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
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
                  disabled={pending || draft.trim().length < 2}
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

      <TaskPanel tasks={workspace.tasks} goals={workspace.goals} />
    </div>
  )
}

function EmptyConversation({
  firstName,
  conversationId,
  sendAction,
  pending,
}: {
  firstName: string
  conversationId: string
  sendAction: (payload: FormData) => void
  pending: boolean
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-5 py-12 sm:px-8">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_35px_rgba(114,231,255,.15)]"><Sparkles className="size-5" /></span>
      <p className="mt-7 text-sm font-semibold text-primary">Hey {firstName}.</p>
      <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-.045em] text-white sm:text-6xl">You don’t need to know where to begin.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Tell me what life has felt like recently. I’ll help separate the noise from what deserves attention first.</p>
      <div className="mt-9 grid gap-2.5">
        {starters.map((starter) => (
          <form key={starter} action={sendAction}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <button
              name="message"
              value={starter}
              disabled={pending}
              className="group flex w-full items-center justify-between rounded-xl border border-white/[.09] bg-white/[.035] px-4 py-3.5 text-left text-sm text-white/70 transition hover:border-primary/30 hover:bg-primary/[.07] hover:text-white disabled:opacity-40"
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

function Message({
  message,
  conversationId,
  sendAction,
  pending,
}: {
  message: OperatorMessage
  conversationId: string
  sendAction: (payload: FormData) => void
  pending: boolean
}) {
  if (message.role === "user") {
    return (
      <div className="mb-8 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2b2b2b] px-4 py-3 text-sm leading-6 text-white/85 sm:max-w-[72%]">{message.content}</div>
      </div>
    )
  }

  return (
    <article className="mb-10 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground sm:size-9">G</span>
      <div className="min-w-0 pt-1">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/80">{message.content}</p>

        {message.taskDrafts.length ? (
          <TaskProposal message={message} conversationId={conversationId} />
        ) : null}

        {message.quickReplies.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {message.quickReplies.map((reply) => (
              <form key={reply} action={sendAction}>
                <input type="hidden" name="conversationId" value={conversationId} />
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

function TaskProposal({ message, conversationId }: { message: OperatorMessage; conversationId: string }) {
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
                <span>{formatTaskDate(task.scheduledFor)}</span>
                <span>{task.estimatedMinutes} min</span>
                <span>Done when: {task.completionCondition}</span>
              </div>
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

function TaskPanel({ tasks, goals }: { tasks: OperatorTask[]; goals: OperatorWorkspace["goals"] }) {
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
            {tasks.map((task) => <EditableTaskCard key={task.id} task={task} goals={goals} compact />)}
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

function Thinking() {
  return (
    <div className="mb-10 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground sm:size-9">G</span>
      <div className="flex items-center gap-1.5 pt-3"><span className="size-1.5 animate-pulse rounded-full bg-white/30" /><span className="size-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:120ms]" /><span className="size-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" /></div>
    </div>
  )
}

function formatTaskDate(value: string) {
  const today = new Date().toISOString().slice(0, 10)
  if (value === today) return "Today"
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  if (value === tomorrow.toISOString().slice(0, 10)) return "Tomorrow"
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))
}
