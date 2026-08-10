"use client"

import { useTransition } from "react"
import { RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { setOperatorTaskStatusAction } from "@/app/(user)/chat/actions"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"
import { cn } from "@/lib/utils"

export function TaskHistoryCard({ task, goals, compact = false }: { task: OperatorTask; goals: OperatorGoal[]; compact?: boolean }) {
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
  return <article className={cn("rounded-2xl border p-5", compact ? "border-white/[.08] bg-white/[.035]" : "border-neutral-200 bg-white shadow-sm")}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className={cn("text-sm font-semibold", compact ? "text-white/65" : "text-neutral-800")}>{task.title}</h3><span className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold", compact ? "bg-white/[.06] text-white/30" : "bg-neutral-100 text-neutral-500")}>{goal?.title ?? "Goal"}</span></div><p className={cn("mt-2 text-xs leading-5", compact ? "text-white/30" : "text-neutral-500")}>{task.status === "done" ? "Completed" : "Dismissed"} · originally scheduled {task.scheduledFor}</p>{task.originConversationTitle ? <p className={cn("mt-1 text-[10px]", compact ? "text-white/25" : "text-neutral-400")}>From “{task.originConversationTitle}”</p> : null}</div><button type="button" disabled={pending} onClick={restore} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-semibold disabled:opacity-50", compact ? "border-white/10 text-white/40 hover:border-primary/40 hover:text-white" : "border-neutral-200 text-neutral-600 hover:border-primary/40 hover:text-neutral-900")}><RotateCcw className="size-3" />{pending ? "Restoring…" : "Restore"}</button></div></article>
}
