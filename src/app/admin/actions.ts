"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  adminHasRole,
  adminSessionHasRecentMfa,
  adminLoginFingerprints,
  createAdminSession,
  deleteAdminSession,
  getAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/auth"
import type { AdminRole } from "@/lib/admin/credential-config"
import {
  clearAdminLoginAttempts,
  consumeAdminLoginAttempt,
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  deleteAdminConversation,
  deleteAdminUser,
  recordAdminAudit,
  setAdminGoalStatus,
  setAdminTaskStatus,
  setAdminUserAccess,
  updateAdminUser,
  grantAdminComplimentaryAccess,
  replayAdminBillingEvent,
  retryAdminOperationJob,
  updateAdminAnnouncement,
} from "@/lib/data/admin"
import { ANNOUNCEMENT_PRESETS, type AnnouncementAlignment, type AnnouncementButtonStyle, type AnnouncementPlacement, type AnnouncementTone } from "@/lib/announcement-types"

export type AdminActionState = { error?: string; success?: string }

function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function rawText(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

async function requireAdmin(...roles: AdminRole[]) {
  const session = await getAdminSession()
  if (!session) throw new Error("Your admin session has expired. Sign in again.")
  if (roles.length && !adminHasRole(session, ...roles)) throw new Error("Your administrator role does not allow this operation.")
  return session
}

async function requireFreshAdmin(...roles: AdminRole[]) {
  const session = await requireAdmin(...roles)
  if (!adminSessionHasRecentMfa(session)) throw new Error("Fresh administrator MFA is required. Sign out and sign in again before this sensitive operation.")
  return session
}

function safeMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("session has expired")) return error.message
  if (error instanceof Error && error.message.includes("administrator role")) return error.message
  if (error instanceof Error && error.message.includes("Fresh administrator MFA")) return error.message
  if (!(error instanceof Error)) return "The change could not be completed. Please try again."
  const coded = error.message.match(/^(GOAL_LIMIT_REACHED|USER_NOT_FOUND|GOAL_NOT_FOUND|TASK_NOT_FOUND|CONVERSATION_NOT_FOUND):\s*(.+)$/)
  if (coded) return coded[2]
  const allowed = [
    "User not found", "Goal not found", "Task not found", "Conversation not found",
    "Confirmation email does not match", "Name must contain at least 2 characters", "Announcement not found",
    "Announcement must contain at least 3 characters", "Link text and URL must be provided together",
    "Announcement links must use HTTPS or a local path", "Start time is invalid", "End time is invalid",
    "End time must be after start time", "Choose a valid announcement style",
    "Choose a valid announcement placement", "Choose a valid text alignment", "Choose a valid button style",
    "Announcement text and background must have at least 4.5:1 contrast", "Announcement accent and background must have at least 3:1 contrast",
  ].includes(error.message) || /^(Background|Text|Accent) color must be/.test(error.message)
  return allowed ? error.message : "The change could not be completed. Please try again."
}

export async function adminLoginAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const email = text(formData, "email").toLowerCase()
  const password = rawText(formData, "password")
  const otp = text(formData, "otp")
  if (!email || !password || !otp) return { error: "Enter your admin email, password, and authenticator code." }
  if (email.length > 320 || password.length > 1024 || !/^\d{6}$/.test(otp)) return { error: "The admin credentials are not valid." }

  try {
    const fingerprints = await adminLoginFingerprints(email)
    const throttles = await Promise.all(fingerprints.map(consumeAdminLoginAttempt))
    if (throttles.some((item) => !item.allowed)) {
      await recordAdminAudit({ actor: email, action: "admin.login.blocked", targetType: "admin_session", summary: "Credential-stuffing controls blocked an administrator login attempt." }).catch(() => undefined)
      return { error: "Too many attempts. Wait before trying again." }
    }

    const valid = await verifyAdminCredentials({ email, password, otp })
    if (!valid) return { error: "The admin credentials are not valid." }

    await createAdminSession(email)
    await Promise.all(fingerprints.map(clearAdminLoginAttempts))
    await recordAdminAudit({
      actor: email,
      action: "admin.login",
      targetType: "admin_session",
      summary: "Admin signed in with email and password.",
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
    const session = await requireFreshAdmin("support-write", "billing")
    const userId = text(formData, "userId")
    const name = text(formData, "name")
    if (!userId || !name) return { error: "Enter valid account details." }
    await updateAdminUser({ actor: session.email, userId, name })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/users")
    revalidatePath("/admin")
    return { success: "Account details updated." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function grantComplimentaryAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireFreshAdmin("owner")
    const userId = text(formData, "userId")
    const planTier = text(formData, "planTier")
    const source = text(formData, "source")
    const reason = text(formData, "reason")
    const startsAt = text(formData, "startsAt")
    const expiresAt = text(formData, "expiresAt")
    if (!userId || planTier !== "pro" || !["admin_comp", "design_partner", "support_remediation"].includes(source) || reason.length < 10 || !startsAt || !expiresAt) return { error: "Complete the grant reason, source, and access window." }
    await grantAdminComplimentaryAccess({ actor: session.email, userId, planTier: "pro", source: source as "admin_comp" | "design_partner" | "support_remediation", reason, startsAt, expiresAt })
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath("/admin/billing")
    return { success: "Complimentary access granted and audited." }
  } catch (error) { return { error: safeMessage(error) } }
}

export async function replayBillingEventAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireFreshAdmin("owner")
    const providerEventId = text(formData, "providerEventId")
    const reason = text(formData, "reason")
    if (!providerEventId || reason.length < 10) return { error: "Enter a replay reason of at least 10 characters." }
    await replayAdminBillingEvent({ actor: session.email, providerEventId, reason })
    revalidatePath("/admin/billing")
    return { success: "Billing event replay completed." }
  } catch (error) { return { error: safeMessage(error) } }
}

export async function setUserAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireFreshAdmin("owner")
    const userId = text(formData, "userId")
    const suspended = text(formData, "suspended") === "true"
    const reason = text(formData, "reason")
    if (!userId) return { error: "User not found." }
    if (suspended && reason.length < 3) return { error: "Enter a suspension reason." }
    await setAdminUserAccess({ actor: session.email, userId, suspended, ...(suspended ? { reason } : {}) })
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
    const session = await requireAdmin("support-write")
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
    const session = await requireAdmin("support-write")
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
    const session = await requireFreshAdmin("owner")
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
    const session = await requireFreshAdmin("owner")
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

function optionalText(formData: FormData, name: string): string | undefined {
  return text(formData, name) || undefined
}

function optionalIsoDate(formData: FormData, name: string): string | undefined {
  const value = optionalText(formData, name)
  if (!value) return undefined
  // Admin scheduling fields are explicitly UTC so behavior does not depend on
  // the deployment machine's local timezone.
  const parsed = new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function announcementInput(formData: FormData) {
  const tone = text(formData, "tone")
  if (!["info", "offer", "warning", "critical"].includes(tone)) throw new Error("Choose a valid announcement style")
  const placement = text(formData, "placement")
  const alignment = text(formData, "alignment")
  const buttonStyle = text(formData, "buttonStyle")
  if (!["top_bar", "floating_banner", "popup"].includes(placement)) throw new Error("Choose a valid announcement placement")
  if (!["left", "center"].includes(alignment)) throw new Error("Choose a valid text alignment")
  if (!["solid", "outline"].includes(buttonStyle)) throw new Error("Choose a valid button style")
  const preset = ANNOUNCEMENT_PRESETS[tone as AnnouncementTone]
  return {
    title: optionalText(formData, "title"),
    message: text(formData, "message"),
    tone: tone as AnnouncementTone,
    placement: placement as AnnouncementPlacement,
    backgroundColor: text(formData, "backgroundColor") || preset.backgroundColor,
    textColor: text(formData, "textColor") || preset.textColor,
    accentColor: text(formData, "accentColor") || preset.accentColor,
    alignment: alignment as AnnouncementAlignment,
    buttonStyle: buttonStyle as AnnouncementButtonStyle,
    showIcon: formData.get("showIcon") === "on",
    linkLabel: optionalText(formData, "linkLabel"),
    linkUrl: optionalText(formData, "linkUrl"),
    startsAt: optionalIsoDate(formData, "startsAt"),
    endsAt: optionalIsoDate(formData, "endsAt"),
    priority: Number(text(formData, "priority") || "50"),
    dismissible: formData.get("dismissible") === "on",
    isActive: formData.get("isActive") === "on",
  }
}

export async function createAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin("support-write")
    await createAdminAnnouncement({ actor: session.email, ...announcementInput(formData) })
    revalidatePath("/admin/announcements")
    revalidatePath("/api/announcements")
    return { success: "Announcement created." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function updateAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin("support-write")
    const announcementId = text(formData, "announcementId")
    if (!announcementId) return { error: "Announcement not found" }
    await updateAdminAnnouncement({ actor: session.email, announcementId, ...announcementInput(formData) })
    revalidatePath("/admin/announcements")
    revalidatePath("/api/announcements")
    return { success: "Announcement updated." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function deleteAnnouncementAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requireAdmin("owner")
    const announcementId = text(formData, "announcementId")
    if (!announcementId) return { error: "Announcement not found" }
    await deleteAdminAnnouncement({ actor: session.email, announcementId })
    revalidatePath("/admin/announcements")
    revalidatePath("/api/announcements")
    return { success: "Announcement deleted." }
  } catch (error) {
    return { error: safeMessage(error) }
  }
}

export async function retryOperationAction(formData: FormData): Promise<void> {
  const session = await requireFreshAdmin("owner")
  const kind = text(formData, "kind")
  const jobId = text(formData, "jobId")
  const reason = text(formData, "reason")
  if ((kind !== "deletion" && kind !== "export") || !jobId || reason.length < 10) throw new Error("A valid job and recovery reason are required.")
  await retryAdminOperationJob({ actor: session.email, kind, jobId, reason })
  revalidatePath("/admin/operations")
}
