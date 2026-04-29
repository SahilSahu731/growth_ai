"use client"

import { useActionState, useEffect, useRef } from "react"

import { addEvidenceAction, addOptionAction, type CompareActionState } from "@/app/(user)/compare/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_STATE: CompareActionState = {}

export function AddOptionForm({ comparisonId }: { comparisonId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(addOptionAction, INITIAL_STATE)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="comparisonId" value={comparisonId} />
      <div className="space-y-2">
        <Label htmlFor="option-name">Option name</Label>
        <Input id="option-name" name="name" placeholder="Option A" className="h-10 rounded-xl border-white/10 bg-[#303030]" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Details</Label>
        <Textarea id="description" name="description" placeholder="Important specs, terms, location, salary, features..." className="min-h-20 rounded-xl border-white/10 bg-[#303030]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="price" placeholder="Price/value" className="h-10 rounded-xl border-white/10 bg-[#303030]" />
        <Input name="sourceUrl" placeholder="Source URL" className="h-10 rounded-xl border-white/10 bg-[#303030]" />
      </div>
      <Input name="notes" placeholder="Your notes or concerns" className="h-10 rounded-xl border-white/10 bg-[#303030]" />
      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
      <Button type="submit" disabled={isPending} className="h-10 rounded-full bg-white px-5 text-zinc-950 hover:bg-zinc-200">
        {isPending ? "Adding..." : "Add option"}
      </Button>
    </form>
  )
}

export function AddEvidenceForm({ comparisonId }: { comparisonId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(addEvidenceAction, INITIAL_STATE)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="comparisonId" value={comparisonId} />
      <div className="space-y-2">
        <Label htmlFor="pastedEvidence">Paste evidence</Label>
        <Textarea
          id="pastedEvidence"
          name="pastedEvidence"
          placeholder="Paste product specs, offer details, lease terms, bill details, reviews, or notes..."
          className="min-h-24 rounded-xl border-white/10 bg-[#303030]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Upload evidence</Label>
        <Input id="file" name="file" type="file" className="h-10 rounded-xl border-white/10 bg-[#303030]" />
        <p className="text-xs text-zinc-500">Images, PDFs, screenshots, and documents are saved as comparison evidence. UploadThing storage is prepared for production env setup.</p>
      </div>
      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
      <Button type="submit" disabled={isPending} className="h-10 rounded-full bg-zinc-800 px-5 text-white hover:bg-zinc-700">
        {isPending ? "Saving..." : "Save evidence"}
      </Button>
    </form>
  )
}
