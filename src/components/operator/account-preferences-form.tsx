"use client"

import { useActionState } from "react"
import { updateSettingsAction, type SettingsActionState } from "@/app/(user)/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AccountOverview } from "@/lib/data/account"

export function AccountPreferencesForm({ preferences }: { preferences: AccountOverview["preferences"] }) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState)
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="coachTone">Conversation style</Label>
        <select id="coachTone" name="coachTone" defaultValue={preferences.coachTone} className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm">
          <option value="supportive">Supportive</option>
          <option value="balanced">Balanced</option>
          <option value="blunt">Direct</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" name="timezone" defaultValue={preferences.timezone} placeholder="Asia/Kolkata" required />
      </div>
      <label className="flex items-center gap-3 text-sm text-neutral-600">
        <input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications} className="accent-primary" />
        Email me important weekly summaries
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button disabled={pending} className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  )
}
