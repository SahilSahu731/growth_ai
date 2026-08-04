"use client"

import { useActionState } from "react"
import { editWeeklyReviewAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { WeeklyReview } from "@/lib/growth/types"

export function ReviewEditor({ review }: { review: WeeklyReview }) {
  const [state, action, pending] = useActionState(editWeeklyReviewAction, {} as GrowthActionState)
  return <form action={action} className="space-y-3"><input type="hidden" name="reviewId" value={review.id} /><Textarea name="narrative" defaultValue={review.narrative} className="min-h-36 bg-zinc-950/40" maxLength={3000} required />{state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}{state.success ? <p className="text-xs text-emerald-300">{state.success}</p> : null}<Button disabled={pending} variant="outline" className="rounded-full border-white/15">{pending ? "Saving…" : "Save edited review"}</Button></form>
}
