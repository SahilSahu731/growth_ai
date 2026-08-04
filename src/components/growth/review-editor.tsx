"use client"

import { useActionState } from "react"
import { editWeeklyReviewAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { WeeklyReview } from "@/lib/growth/types"

export function ReviewEditor({ review }: { review: WeeklyReview }) {
  const [state, action, pending] = useActionState(editWeeklyReviewAction, {} as GrowthActionState)
  return <form action={action} className="space-y-3"><input type="hidden" name="reviewId" value={review.id} /><Textarea name="narrative" defaultValue={review.narrative} className="min-h-36 border-neutral-200 bg-neutral-50/60" maxLength={3000} required />{state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}{state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}<Button disabled={pending} variant="outline" className="rounded-full border-neutral-200">{pending ? "Saving…" : "Save my wording"}</Button></form>
}
