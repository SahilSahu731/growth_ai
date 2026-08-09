import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type { AnnouncementAlignment, AnnouncementButtonStyle, AnnouncementPlacement, AnnouncementTone } from "@/lib/announcement-types"

export type AdminPlanTier = "free" | "pro" | "founder" | "team"

function admin(subject: string, scope: string) {
  return { role: "admin" as const, subject: `admin:${subject.toLowerCase().slice(0, 160)}`, scope }
}

export type AdminUser = {
  id: string
  name: string
  email: string
  authProvider: string
  planTier: AdminPlanTier
  accountStatus?: "active" | "suspended" | "deletion_pending" | "deleted"
  suspendedAt?: string
  suspensionReason?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  activeGoals?: number
  openTasks?: number
  subscriptions?: number
}

export type AdminDashboard = {
  totals: {
    users: number; activeUsers: number; suspendedUsers: number; conversations: number; messages: number
    activeGoals: number; openTasks: number; completedTasks: number; activeSubscriptions: number; failedBillingEvents: number
  }
  lastSevenDays: { users: number; messages: number; completedTasks: number }
  planDistribution: Array<{ tier: AdminPlanTier; count: number }>
  recentUsers: AdminUser[]
  recentBillingEvents: Array<Record<string, unknown> & { id: string; eventType: string; status: string; createdAt: string }>
}

export type AdminUserDetail = {
  user: AdminUser & { timezone?: string; locale?: string; coachTone?: string; emailNotifications?: boolean }
  counts: { conversations: number; messages: number; goals: number; tasks: number }
  conversations: Array<{ id: string; title: string; state: string; createdAt: string; updatedAt: string }>
  messages: Array<{ id: string; role: "user" | "assistant"; content: string; conversationId: string; createdAt: string }>
  goals: Array<{ id: string; title: string; description: string; status: "active" | "completed" | "archived"; updatedAt: string }>
  tasks: Array<{ id: string; title: string; note: string; status: "todo" | "done" | "dismissed"; goalId: string; scheduledFor: string; updatedAt: string }>
  subscriptions: Array<{ id: string; providerSubscriptionId: string; planTier: string; status: string; amount: number; currency: string; updatedAt: string }>
}

export function consumeAdminLoginAttempt(key: string): Promise<{ allowed: boolean; retryAt: string | null }> {
  return convexMutation("admin:consumeLoginAttempt", { key }, admin("login-throttle", "admin:login"))
}

export function clearAdminLoginAttempts(key: string): Promise<boolean> {
  return convexMutation("admin:clearLoginAttempts", { key }, admin("login-throttle", "admin:login"))
}

export function createAdminSessionRecord(input: { tokenHash: string; email: string; roles: string[]; deviceHash: string; absoluteExpiresAt: string }): Promise<boolean> {
  return convexMutation("admin:createSession", input, admin(input.email, "admin:session"))
}

export function validateAdminSessionRecord(input: { tokenHash: string; email: string; deviceHash: string }): Promise<{ email: string; roles: string[]; absoluteExpiresAt: string } | null> {
  return convexMutation("admin:validateSession", input, admin(input.email, "admin:session"))
}

export function revokeAdminSessionRecord(tokenHash: string, email: string): Promise<boolean> {
  return convexMutation("admin:revokeSession", { tokenHash }, admin(email, "admin:session"))
}

export function listAdminSessionRecords(email: string): Promise<Array<{ id: string; roles: string[]; device: string; createdAt: string; lastSeenAt: string; idleExpiresAt: string; absoluteExpiresAt: string; revokedAt: string | null }>> {
  return convexQuery("admin:listSessions", { email }, admin(email, "admin:session"))
}

export function recordAdminAudit(input: { actor: string; actorRole?: string; action: string; targetType: string; targetId?: string; reason?: string; ticket?: string; requestId?: string; result?: string; summary: string }): Promise<boolean> {
  return convexMutation("admin:recordAudit", input, admin(input.actor, "admin:audit"))
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return convexQuery("admin:getDashboard", {}, admin("session", "admin:read"))
}

export function listAdminUsers(input: { search: string; page: number; pageSize: number }): Promise<{ items: AdminUser[]; total: number; page: number; pageSize: number; pages: number }> {
  return convexQuery("admin:listUsers", input, admin("session", "admin:read"))
}

export function getAdminUserDetail(input: { userId: string; actor: string; reason: string; ticket: string; requestId: string }): Promise<AdminUserDetail | null> {
  return convexMutation("admin:getUserDetail", input, admin(input.actor, "admin:sensitive-read"))
}

export function updateAdminUser(input: { actor: string; userId: string; name: string }): Promise<AdminUser> {
  return convexMutation("admin:updateUser", input, admin(input.actor, "admin:write"))
}

export function setAdminUserAccess(input: { actor: string; userId: string; suspended: boolean; reason?: string }): Promise<boolean> {
  return convexMutation("admin:setUserAccess", input, admin(input.actor, "admin:write"))
}

export function setAdminGoalStatus(input: { actor: string; userId: string; goalId: string; status: "active" | "completed" | "archived" }): Promise<boolean> {
  return convexMutation("admin:setGoalStatus", input, admin(input.actor, "admin:write"))
}

export function setAdminTaskStatus(input: { actor: string; userId: string; taskId: string; status: "todo" | "done" | "dismissed" }): Promise<boolean> {
  return convexMutation("admin:setTaskStatus", input, admin(input.actor, "admin:write"))
}

export function deleteAdminConversation(input: { actor: string; userId: string; conversationId: string }): Promise<boolean> {
  return convexMutation("admin:deleteConversation", input, admin(input.actor, "admin:delete"))
}

export function deleteAdminUser(input: { actor: string; userId: string; confirmationEmail: string }): Promise<boolean> {
  return convexMutation("admin:deleteUser", input, admin(input.actor, "admin:delete"))
}

export type AdminBilling = {
  subscriptions: Array<{ id: string; userId: string; providerSubscriptionId: string; planTier: string; status: string; amount: number; currency: string; updatedAt: string; user: { name: string; email: string } | null }>
  events: Array<{ id: string; providerEventId: string; eventType: string; status: string; attemptCount?: number; failureCategory?: string; failureReason?: string; finalDisposition?: string; nextRetryAt?: string; createdAt: string }>
  grants: Array<{ id: string; userId: string; planTier: "pro" | "founder"; source: string; reason: string; startsAt: string; expiresAt: string; revokedAt?: string; user: { name: string; email: string } | null }>
  alerts: Array<{ id: string; kind: string; severity: string; message: string; status: string; updatedAt: string }>
  totalEvents: number
  page: number
  pages: number
}

export function grantAdminComplimentaryAccess(input: { actor: string; userId: string; planTier: "pro" | "founder"; source: "admin_comp" | "design_partner" | "support_remediation"; reason: string; startsAt: string; expiresAt: string }): Promise<Record<string, unknown>> {
  return convexMutation("admin:grantComplimentaryAccess", input, admin(input.actor, "admin:billing"))
}

export function replayAdminBillingEvent(input: { actor: string; providerEventId: string; reason: string }): Promise<Record<string, unknown>> {
  return convexMutation("billing:replayEvent", input, admin(input.actor, "admin:billing"))
}

export function getAdminBilling(page: number, pageSize = 25): Promise<AdminBilling> {
  return convexQuery("admin:getBilling", { page, pageSize }, admin("session", "admin:billing"))
}

export type AdminActivity = {
  items: Array<{ id: string; role: string; content: string; createdAt: string; conversationTitle: string; user: { id: string; name: string; email: string } | null }>
  total: number
  page: number
  pages: number
}

export function getAdminActivity(input: { page: number; actor: string; reason: string; ticket: string; requestId: string }, pageSize = 30): Promise<AdminActivity> {
  return convexMutation("admin:getActivity", { ...input, pageSize }, admin(input.actor, "admin:sensitive-read"))
}

export type AdminAuditPage = {
  items: Array<{ id: string; actor: string; actorRole?: string; action: string; targetType: string; targetId?: string; reason?: string; ticket?: string; requestId?: string; result?: string; summary: string; createdAt: string }>
  total: number
  page: number
  pages: number
}

export function getAdminAuditLogs(page: number, pageSize = 30): Promise<AdminAuditPage> {
  return convexQuery("admin:getAuditLogs", { page, pageSize }, admin("session", "admin:audit-read"))
}

export type AdminAnnouncement = {
  id: string
  title?: string
  message: string
  tone: AnnouncementTone
  placement?: AnnouncementPlacement
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  alignment?: AnnouncementAlignment
  buttonStyle?: AnnouncementButtonStyle
  showIcon?: boolean
  linkLabel?: string
  linkUrl?: string
  startsAt?: string
  endsAt?: string
  priority: number
  dismissible: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function listAdminAnnouncements(): Promise<AdminAnnouncement[]> {
  return convexQuery("admin:listAnnouncements", {}, admin("session", "admin:read"))
}

type AnnouncementInput = {
  title?: string
  message: string
  tone: AnnouncementTone
  placement: AnnouncementPlacement
  backgroundColor: string
  textColor: string
  accentColor: string
  alignment: AnnouncementAlignment
  buttonStyle: AnnouncementButtonStyle
  showIcon: boolean
  linkLabel?: string
  linkUrl?: string
  startsAt?: string
  endsAt?: string
  priority: number
  dismissible: boolean
  isActive: boolean
}

export function createAdminAnnouncement(input: AnnouncementInput & { actor: string }): Promise<AdminAnnouncement> {
  return convexMutation("admin:createAnnouncement", input, admin(input.actor, "admin:write"))
}

export function updateAdminAnnouncement(input: AnnouncementInput & { actor: string; announcementId: string }): Promise<AdminAnnouncement> {
  return convexMutation("admin:updateAnnouncement", input, admin(input.actor, "admin:write"))
}

export function deleteAdminAnnouncement(input: { actor: string; announcementId: string }): Promise<boolean> {
  return convexMutation("admin:deleteAnnouncement", input, admin(input.actor, "admin:delete"))
}
