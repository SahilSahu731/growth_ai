import { NextResponse } from "next/server"
import { claimScheduledPrompt, finishNotification, listDueNotifications, listDueSchedules, markMissedPrompts } from "@/lib/data/growth"
import { CHECK_IN_GRACE_HOURS, nextCheckInAt } from "@/lib/growth/domain"
import { sendCheckInEmail } from "@/lib/notifications/email"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const current = new Date()
  const schedules = await listDueSchedules(current.toISOString())
  let claimed = 0
  for (const schedule of schedules) {
    const nextPromptAt = nextCheckInAt({ after: new Date(schedule.nextPromptAt), timezone: schedule.timezone, hour: schedule.localHour, minute: schedule.localMinute, cadence: schedule.cadence }).toISOString()
    const result = await claimScheduledPrompt({ scheduleId: schedule.id, expectedPromptAt: schedule.nextPromptAt, nextPromptAt })
    if (result.claimed) claimed += 1
  }
  const notifications = await listDueNotifications(current.toISOString())
  let sent = 0
  for (const notification of notifications) {
    const result = await sendCheckInEmail({ to: notification.recipient, projectName: notification.projectName, projectId: notification.projectId })
    await finishNotification({ notificationId: notification.id, sent: result.sent, ...(result.sent ? { providerMessageId: result.providerMessageId } : { failureCategory: result.failureCategory }) })
    if (result.sent) sent += 1
  }
  const before = new Date(current.getTime() - CHECK_IN_GRACE_HOURS * 60 * 60_000).toISOString()
  const missed = await markMissedPrompts(before)
  return NextResponse.json({ schedules: schedules.length, claimed, notifications: notifications.length, sent, missed: missed.marked })
}
