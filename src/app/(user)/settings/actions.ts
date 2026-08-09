"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { getAccountOverview, updateAccountPreferences, type CoachTone } from "@/lib/data/account"

export type SettingsActionState = { error?: string; success?: string }

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

export async function updateSettingsAction(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  const account = await getAccountOverview(userId)
  if (!account) return { error: "Your account could not be loaded." }
  const section = field(formData, "section")
  const legacyForm = !section
  const coachTone = (section === "coach" || legacyForm ? field(formData, "coachTone") : account.preferences.coachTone) as CoachTone
  const timezone = section === "general" || legacyForm ? field(formData, "timezone") : account.preferences.timezone
  const notificationSection = section === "notifications"
  const emailNotifications = legacyForm || notificationSection ? formData.get("emailNotifications") === "on" : account.preferences.emailNotifications
  if (!["supportive", "balanced", "blunt"].includes(coachTone)) return { error: "Choose a conversation style." }
  try {
    await updateAccountPreferences({
      userId,
      coachTone,
      timezone,
      emailNotifications,
      notificationQuietStart: notificationSection ? field(formData, "notificationQuietStart") : account.preferences.notificationQuietStart,
      notificationQuietEnd: notificationSection ? field(formData, "notificationQuietEnd") : account.preferences.notificationQuietEnd,
      notificationFrequency: notificationSection && emailNotifications ? "weekly" : "off",
      notificationSnoozedUntil: notificationSection ? (field(formData, "notificationSnoozedUntil") ? `${field(formData, "notificationSnoozedUntil")}T23:59:59.999Z` : undefined) : account.preferences.notificationSnoozedUntil ?? undefined,
    })
    revalidatePath("/settings")
    return { success: "Preferences saved." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save preferences." }
  }
}
