import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type { AnnouncementAlignment, AnnouncementButtonStyle, AnnouncementPlacement, AnnouncementTone } from "@/lib/announcement-types"

export type AdminPlanTier = "free" | "pro" | "founder" | "team"

export type AdminUser = {
  id: string
  name: string
  email: string
  authProvider: string
  planTier: AdminPlanTier
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
  return convexMutation("admin:consumeLoginAttempt", { key })
}

export function clearAdminLoginAttempts(key: string): Promise<boolean> {
  return convexMutation("admin:clearLoginAttempts", { key })
}

export function recordAdminAudit(input: { actor: string; action: string; targetType: string; targetId?: string; summary: string }): Promise<boolean> {
  return convexMutation("admin:recordAudit", input)
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return convexQuery("admin:getDashboard", {})
}

export function listAdminUsers(input: { search: string; page: number; pageSize: number }): Promise<{ items: AdminUser[]; total: number; page: number; pageSize: number; pages: number }> {
  return convexQuery("admin:listUsers", input)
}

export function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  return convexQuery("admin:getUserDetail", { userId })
}

export function updateAdminUser(input: { actor: string; userId: string; name: string; planTier: AdminPlanTier }): Promise<AdminUser> {
  return convexMutation("admin:updateUser", input)
}

export function setAdminUserAccess(input: { actor: string; userId: string; suspended: boolean }): Promise<boolean> {
  return convexMutation("admin:setUserAccess", input)
}

export function setAdminGoalStatus(input: { actor: string; userId: string; goalId: string; status: "active" | "completed" | "archived" }): Promise<boolean> {
  return convexMutation("admin:setGoalStatus", input)
}

export function setAdminTaskStatus(input: { actor: string; userId: string; taskId: string; status: "todo" | "done" | "dismissed" }): Promise<boolean> {
  return convexMutation("admin:setTaskStatus", input)
}

export function deleteAdminConversation(input: { actor: string; userId: string; conversationId: string }): Promise<boolean> {
  return convexMutation("admin:deleteConversation", input)
}

export function deleteAdminUser(input: { actor: string; userId: string; confirmationEmail: string }): Promise<boolean> {
  return convexMutation("admin:deleteUser", input)
}

export type AdminBilling = {
  subscriptions: Array<{ id: string; userId: string; providerSubscriptionId: string; planTier: string; status: string; amount: number; currency: string; updatedAt: string; user: { name: string; email: string } | null }>
  events: Array<{ id: string; providerEventId: string; eventType: string; status: string; failureReason?: string; createdAt: string }>
  totalEvents: number
  page: number
  pages: number
}

export function getAdminBilling(page: number, pageSize = 25): Promise<AdminBilling> {
  return convexQuery("admin:getBilling", { page, pageSize })
}

export type AdminActivity = {
  items: Array<{ id: string; role: string; content: string; createdAt: string; conversationTitle: string; user: { id: string; name: string; email: string } | null }>
  total: number
  page: number
  pages: number
}

export function getAdminActivity(page: number, pageSize = 30): Promise<AdminActivity> {
  return convexQuery("admin:getActivity", { page, pageSize })
}

export type AdminAuditPage = {
  items: Array<{ id: string; actor: string; action: string; targetType: string; targetId?: string; summary: string; createdAt: string }>
  total: number
  page: number
  pages: number
}

export function getAdminAuditLogs(page: number, pageSize = 30): Promise<AdminAuditPage> {
  return convexQuery("admin:getAuditLogs", { page, pageSize })
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
  return convexQuery("admin:listAnnouncements", {})
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
  return convexMutation("admin:createAnnouncement", input)
}

export function updateAdminAnnouncement(input: AnnouncementInput & { actor: string; announcementId: string }): Promise<AdminAnnouncement> {
  return convexMutation("admin:updateAnnouncement", input)
}

export function deleteAdminAnnouncement(input: { actor: string; announcementId: string }): Promise<boolean> {
  return convexMutation("admin:deleteAnnouncement", input)
}
