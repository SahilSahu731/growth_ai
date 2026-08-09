"use client"

import { useTransition } from "react"
import { RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { setOperatorTaskStatusAction } from "@/app/(user)/chat/actions"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"

export function TaskHistoryCard({ task, goals }: { task: OperatorTask; goals: OperatorGoal[] }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const goal = goals.find((item) => item.id === task.goalId)
  function restore() {
    startTransition(async () => {
      const data = new FormData()
      data.set("taskId", task.id)
      data.set("status", "todo")
      const result = await setOperatorTaskStatusAction(data)
      if (result.success) router.refresh()
    })
  }
  return <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-neutral-800">{task.title}</h3><span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold text-neutral-500">{goal?.title ?? "Goal"}</span></div><p className="mt-2 text-xs leading-5 text-neutral-500">{task.status === "done" ? "Completed" : "Dismissed"} · originally scheduled {task.scheduledFor}</p>{task.originConversationTitle ? <p className="mt-1 text-[10px] text-neutral-400">From “{task.originConversationTitle}”</p> : null}</div><button type="button" disabled={pending} onClick={restore} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-[10px] font-semibold text-neutral-600 hover:border-primary/40 hover:text-neutral-900 disabled:opacity-50"><RotateCcw className="size-3" />{pending ? "Restoring…" : "Restore"}</button></div></article>
}
