"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  adminLoginFingerprint,
  createAdminSession,
  deleteAdminSession,
  getAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/auth"
import {
  clearAdminLoginAttempts,
  consumeAdminLoginAttempt,
  deleteAdminConversation,
  deleteAdminUser,
  recordAdminAudit,
  setAdminGoalStatus,
  setAdminTaskStatus,
  setAdminUserAccess,
  updateAdminUser,
  type AdminPlanTier,
} from "@/lib/data/admin"

export type AdminActionState = { error?: string; success?: string }

function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function rawText(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new Error("Your admin session has expired. Sign in again.")
  return session
}

function safeMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("session has expired")) return error.message
  return error instanceof Error && [
    "User not found", "Goal not found", "Task not found", "Conversation not found",
    "Confirmation email does not match", "Name must contain at least 2 characters",
  ].includes(error.message) ? error.message : "The change could not be completed. Please try again."
}

export async function adminLoginAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const email = text(formData, "email").toLowerCase()
  const password = rawText(formData, "password")
  const loginSecret = rawText(formData, "loginSecret")
  if (!email || !password || !loginSecret) return { error: "Enter all three admin credentials." }
  if (email.length > 320 || password.length > 1024 || loginSecret.length > 1024) return { error: "The admin credentials are not valid." }

  try {
    const fingerprint = await adminLoginFingerprint()
    const throttle = await consumeAdminLoginAttempt(fingerprint)
    if (!throttle.allowed) return { error: "Too many attempts. Wait 30 minutes before trying again." }

    const valid = await verifyAdminCredentials({ email, password, loginSecret })
    if (!valid) return { error: "The admin credentials are not valid." }

    await createAdminSession()
    await clearAdminLoginAttempts(fingerprint)
    await recordAdminAudit({
      actor: email,
      action: "admin.login",
      targetType: "admin_session",
      summary: "Admin signed in with all three credentials.",
    }).catch((error) => console.error("Could not record admin login audit", error))
  } catch (error) {
    console.error("Admin login failed", error)
    return { error: "Admin sign-in is unavailable. Check the server configuration and try again." }
  }
  redirect("/admin")
}

export async function adminLogoutAction(): Promise<void> {
  const session = await getAdminSession()
  if (session) {
    await recordAdminAudit({
      actor: session.email,
      action: "admin.logout",
      targetType: "admin_session",
      summary: "Admin signed out.",
    }).catch((error) => console.error("Could not record admin logout audit", error))
  }
  await deleteAdminSession()
  redirect("/admin/login")
}

export async function updateUserAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const name = text(formData, "name")
    const planTier = text(formData, "planTier")
    if (!userId || !name || !["free", "pro", "founder", "team"].includes(planTier)) return { error: "Enter valid account details." }
    await updateAdminUser({ actor: session.email, userId, name, planTier: planTier as AdminPlanTier })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    revalidatePath("/admin")
    return { success: "Account details updated." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function setUserAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const suspended = text(formData, "suspended") === "true"
    if (!userId) return { error: "User not found." }
    await setAdminUserAccess({ actor: session.email, userId, suspended })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    revalidatePath("/admin")
    return { success: suspended ? "User access suspended." : "User access restored." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function setGoalStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const goalId = text(formData, "goalId")
    const status = text(formData, "status")
    if (!userId || !goalId || !["active", "completed", "archived"].includes(status)) return { error: "Invalid goal change." }
    await setAdminGoalStatus({ actor: session.email, userId, goalId, status: status as "active" | "completed" | "archived" })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin")
    return { success: "Goal status updated." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function setTaskStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const taskId = text(formData, "taskId")
    const status = text(formData, "status")
    if (!userId || !taskId || !["todo", "done", "dismissed"].includes(status)) return { error: "Invalid task change." }
    await setAdminTaskStatus({ actor: session.email, userId, taskId, status: status as "todo" | "done" | "dismissed" })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin")
    return { success: "Task status updated." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function deleteConversationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const conversationId = text(formData, "conversationId")
    if (!userId || !conversationId) return { error: "Conversation not found." }
    await deleteAdminConversation({ actor: session.email, userId, conversationId })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/activity")
    revalidatePath("/admin")
    return { success: "Conversation and its messages were deleted." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function deleteUserAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin()
    const userId = text(formData, "userId")
    const confirmationEmail = text(formData, "confirmationEmail").toLowerCase()
    if (!userId || !confirmationEmail) return { error: "Enter the user email to confirm permanent deletion." }
    await deleteAdminUser({ actor: session.email, userId, confirmationEmail })
    revalidatePath("/admin/users")
    revalidatePath("/admin")
  } catch (error) {
    return { error: safeMessage(error) }
  }
  redirect("/admin/users?deleted=1")
}
