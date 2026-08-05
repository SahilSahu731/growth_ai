"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { updateAccountPreferences, type CoachTone } from "@/lib/data/account"

export type SettingsActionState = { error?: string; success?: string }

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

export async function updateSettingsAction(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  const coachTone = field(formData, "coachTone") as CoachTone
  const timezone = field(formData, "timezone")
  if (!["supportive", "balanced", "blunt"].includes(coachTone)) return { error: "Choose a conversation style." }
  try {
    await updateAccountPreferences({
      userId,
      coachTone,
      timezone,
      emailNotifications: formData.get("emailNotifications") === "on",
    })
    revalidatePath("/settings")
    return { success: "Preferences saved." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save preferences." }
  }
}
