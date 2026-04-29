import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import {
  toggleGoalTaskCompletionAction,
  updateGoalProgressAction,
  updateGoalStatusAction,
} from "@/app/(user)/goals/actions"
import { GoalStructureDialog } from "@/components/goals/goal-structure-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  findUserByEmail,
  getDeveloperProfile,
  getGoalByIdForUser,
  getGoalRoadmapByGoalIdForUser,
  type GoalStatus,
} from "@/lib/db"

type GoalDetailPageProps = {
  params: Promise<{
    goalId: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type GoalRisk = "ahead" | "on-track" | "at-risk" | "critical" | "done"
type GoalWorkspaceTab = "overview" | "structure" | "checklist" | "controls"

const STATUS_STYLES: Record<
  GoalStatus,
  {
    label: string
    className: string
  }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-100 text-blue-700",
  },
  archived: {
    label: "Archived",
    className: "bg-black/10 text-(--landing-muted)",
  },
}

const RISK_STYLES: Record<
  GoalRisk,
  {
    label: string
    className: string
  }
> = {
  ahead: {
    label: "Ahead",
    className: "bg-emerald-100 text-emerald-700",
  },
  "on-track": {
    label: "On Track",
    className: "bg-blue-100 text-blue-700",
  },
  "at-risk": {
    label: "At Risk",
    className: "bg-amber-100 text-amber-700",
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-700",
  },
  done: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700",
  },
}

const DAY_MS = 1000 * 60 * 60 * 24
const WORKSPACE_TABS: GoalWorkspaceTab[] = ["overview", "structure", "checklist", "controls"]

const GOAL_TAB_ITEMS: ReadonlyArray<{
  id: GoalWorkspaceTab
  label: string
  description: string
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "Purpose and direction",
  },
  {
    id: "structure",
    label: "Structure",
    description: "Phases and milestones",
  },
  {
    id: "checklist",
    label: "Checklist",
    description: "Execution tasks",
  },
  {
    id: "controls",
    label: "Controls",
    description: "Progress and status",
  },
]

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

function getDaysLeft(targetDate: string): number {
  const target = new Date(`${targetDate}T00:00:00.000Z`)

  if (Number.isNaN(target.getTime())) {
    return 0
  }

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  return Math.ceil((target.getTime() - today.getTime()) / DAY_MS)
}

function getDeadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue`
  if (daysLeft === 0) return "Due today"
  if (daysLeft === 1) return "Due tomorrow"

  return `Due in ${daysLeft} days`
}

function getExpectedProgress(createdAt: string, targetDate: string): number {
  const created = new Date(createdAt)
  const target = new Date(`${targetDate}T00:00:00.000Z`)

  if (Number.isNaN(created.getTime()) || Number.isNaN(target.getTime()) || target <= created) {
    return 0
  }

  const now = new Date()
  const totalDays = Math.max(1, Math.ceil((target.getTime() - created.getTime()) / DAY_MS))
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - created.getTime()) / DAY_MS)))

  return Math.round((elapsedDays / totalDays) * 100)
}

function getRisk(status: GoalStatus, progress: number, expectedProgress: number, daysLeft: number): GoalRisk {
  if (status === "completed" || status === "archived") return "done"

  const gap = progress - expectedProgress

  if (daysLeft < 0 && progress < 100) return "critical"
  if (daysLeft <= 7 && progress < 55) return "critical"
  if (gap <= -20) return "at-risk"
  if (gap >= 10) return "ahead"

  return "on-track"
}

function getNextReviewDate(): string {
  const review = new Date()
  review.setDate(review.getDate() + 2)

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(review)
}

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function resolveWorkspaceTab(requestedTab: string | undefined, shouldAutoOpenSetup: boolean): GoalWorkspaceTab {
  if (shouldAutoOpenSetup) {
    return "structure"
  }

  if (requestedTab && WORKSPACE_TABS.includes(requestedTab as GoalWorkspaceTab)) {
    return requestedTab as GoalWorkspaceTab
  }

  return "overview"
}

function buildGoalTabHref(goalId: string, tab: GoalWorkspaceTab, setup = false): string {
  const params = new URLSearchParams({ tab })

  if (setup) {
    params.set("setup", "1")
  }

  return `/goals/${goalId}?${params.toString()}`
}

export default async function GoalDetailPage({ params, searchParams }: GoalDetailPageProps) {
  const { goalId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}

  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    redirect("/login")
  }

  const appUser = await findUserByEmail(email)

  if (!appUser) {
    redirect("/login")
  }

  const profile = await getDeveloperProfile(appUser.id)

  if (!profile) {
    redirect("/onboarding")
  }

  const goal = await getGoalByIdForUser({
    goalId,
    userId: appUser.id,
  })

  if (!goal) {
    notFound()
  }

  const roadmap = await getGoalRoadmapByGoalIdForUser({
    goalId: goal.id,
    userId: appUser.id,
  })

  const completedTaskCount = roadmap.tasks.filter((task) => task.isCompleted).length
  const totalTaskCount = roadmap.tasks.length
  const completionRate = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0
  const hasRoadmap = roadmap.phases.length > 0 || roadmap.milestones.length > 0 || roadmap.tasks.length > 0

  const milestonesByPhase = roadmap.phases.reduce(
    (acc, phase) => {
      acc[phase.id] = roadmap.milestones.filter((milestone) => milestone.phaseId === phase.id)
      return acc
    },
    {} as Record<string, typeof roadmap.milestones>
  )

  const daysLeft = getDaysLeft(goal.targetDate)
  const expectedProgress = getExpectedProgress(goal.createdAt, goal.targetDate)
  const progressGap = goal.progress - expectedProgress
  const risk = getRisk(goal.status, goal.progress, expectedProgress, daysLeft)
  const riskStyle = RISK_STYLES[risk]
  const statusStyle = STATUS_STYLES[goal.status]
  const whyItMatters = hasRoadmap
    ? goal.whyItMatters
    : "Complete setup to generate a personal strategy and stronger motivation anchor for this goal."
  const nextStep = hasRoadmap
    ? goal.nextStep
    : "Start with Structure and build a clear execution system for this goal."

  const shouldAutoOpenSetup = firstSearchParam(resolvedSearchParams.setup) === "1"
  const activeTab = resolveWorkspaceTab(firstSearchParam(resolvedSearchParams.tab), shouldAutoOpenSetup)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Goal workspace</p>
          <h1 className="font-display text-4xl leading-none text-(--landing-ink)">{goal.title}</h1>
        </div>

        <Button asChild variant="outline" className="h-10 rounded-full border-black/15 bg-white px-5 text-sm">
          <Link href="/goals">Back to goals</Link>
        </Button>
      </section>

      <Card className="rounded-2xl border border-black/10 bg-white/92">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-black/10 bg-white text-(--landing-muted)">
              {goal.category}
            </Badge>
            <Badge className={hasRoadmap ? "bg-(--landing-accent-soft) text-(--landing-accent)" : "bg-black/8 text-(--landing-muted)"}>
              {hasRoadmap ? "Structure Ready" : "Structure Pending"}
            </Badge>
            <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
            <Badge className={riskStyle.className}>{riskStyle.label}</Badge>
          </div>

          <CardDescription className="text-sm">
            {formatDate(goal.targetDate)} • {getDeadlineLabel(daysLeft)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-(--landing-muted)">
              <span>{goal.progress}% complete</span>
              <span>{hasRoadmap ? `${goal.weeklyCommitmentHours}h per week commitment` : "Setup needed"}</span>
            </div>
            <Progress
              value={goal.progress}
              className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-(--landing-muted)">Expected by now</p>
              <p className="mt-1 text-xl font-semibold text-(--landing-ink)">{expectedProgress}%</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-(--landing-muted)">Progress gap</p>
              <p className="mt-1 text-xl font-semibold text-(--landing-ink)">{progressGap > 0 ? `+${progressGap}` : progressGap}%</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-(--landing-muted)">Next review</p>
              <p className="mt-1 text-xl font-semibold text-(--landing-ink)">{getNextReviewDate()}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-(--landing-muted)">Checklist completion</p>
              <p className="mt-1 text-xl font-semibold text-(--landing-ink)">{completionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-black/10 bg-white/92">
        <CardHeader className="space-y-2">
          <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
            Workspace navigation
          </CardDescription>
          <CardTitle className="font-display text-2xl text-(--landing-ink)">Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {GOAL_TAB_ITEMS.map((item) => {
              const isActive = activeTab === item.id

              return (
                <Link
                  key={item.id}
                  href={buildGoalTabHref(goal.id, item.id)}
                  className={
                    isActive
                      ? "rounded-xl border border-(--landing-accent) bg-(--landing-accent-soft) p-3"
                      : "rounded-xl border border-black/10 bg-white p-3 hover:border-(--landing-accent)"
                  }
                >
                  <p className="text-sm font-medium text-(--landing-ink)">{item.label}</p>
                  <p className="mt-1 text-xs text-(--landing-muted)">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === "overview" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Why this matters</CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">Purpose anchor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-(--landing-ink)">{whyItMatters}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Immediate execution</CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">Next actionable step</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-(--landing-ink)">{nextStep}</p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "structure" ? (
        <section className="space-y-4">
          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                Structure setup
              </CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">
                {hasRoadmap ? "Refine your structure" : "Build your structure"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-(--landing-muted)">
                Use option-based questions with a Something else fallback. Keep it quick and readable.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <GoalStructureDialog goalId={goal.id} hasRoadmap={hasRoadmap} autoOpen={shouldAutoOpenSetup} />
                <Button asChild variant="outline" className="h-10 rounded-full border-black/15 bg-white px-4 text-sm">
                  <Link href={buildGoalTabHref(goal.id, "structure", true)}>Run setup again</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                Structure map
              </CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">Phases and milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roadmap.phases.length === 0 ? (
                <p className="text-sm text-(--landing-muted)">No structure yet. Build structure to generate phases.</p>
              ) : (
                roadmap.phases.map((phase) => (
                  <div key={phase.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-(--landing-ink)">{phase.title}</p>
                      <span className="text-[0.68rem] text-(--landing-muted)">
                        {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-(--landing-muted)">{phase.objective}</p>

                    {milestonesByPhase[phase.id]?.length ? (
                      <div className="mt-2 space-y-1">
                        {milestonesByPhase[phase.id].map((milestone) => (
                          <div key={milestone.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5">
                            <p className="text-xs text-(--landing-ink)">{milestone.title}</p>
                            <span className="text-[0.68rem] text-(--landing-muted)">{formatDate(milestone.dueDate)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "checklist" ? (
        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
              Action checklist
            </CardDescription>
            <CardTitle className="font-display text-2xl text-(--landing-ink)">Tasks with checkmarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roadmap.tasks.length === 0 ? (
              <p className="text-sm text-(--landing-muted)">No tasks yet. Build structure to generate checklist tasks.</p>
            ) : (
              roadmap.tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={task.isCompleted ? "text-sm text-(--landing-muted) line-through" : "text-sm font-medium text-(--landing-ink)"}>
                        {task.title}
                      </p>
                      {task.details ? <p className="mt-1 text-xs leading-5 text-(--landing-muted)">{task.details}</p> : null}
                      <p className="mt-1 text-[0.68rem] text-(--landing-muted)">Due {formatDate(task.dueDate)}</p>
                    </div>

                    <form action={toggleGoalTaskCompletionAction}>
                      <input type="hidden" name="goalId" value={goal.id} />
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="isCompleted" value={task.isCompleted ? "false" : "true"} />
                      <Button
                        type="submit"
                        size="sm"
                        variant={task.isCompleted ? "secondary" : "outline"}
                        className="h-8 rounded-lg border-black/15 bg-white"
                      >
                        {task.isCompleted ? "Checked" : "Check"}
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "controls" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Progress controls</CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">Update completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={updateGoalProgressAction} className="space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />

                <div className="flex items-center gap-2">
                  <input
                    id={`progress-${goal.id}`}
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={goal.progress}
                    className="h-9 w-full rounded-lg border border-black/15 bg-white px-2 text-sm text-(--landing-ink) outline-none focus:border-(--landing-accent)"
                  />
                  <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg border-black/15 bg-white">
                    Save
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    name="presetProgress"
                    value={String(Math.min(100, goal.progress + 10))}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-black/15 bg-white"
                  >
                    +10%
                  </Button>
                  <Button
                    type="submit"
                    name="presetProgress"
                    value={String(Math.max(0, goal.progress - 10))}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-black/15 bg-white"
                  >
                    -10%
                  </Button>
                  <Button
                    type="submit"
                    name="presetProgress"
                    value="100"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-black/15 bg-white"
                  >
                    Mark done
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardHeader>
              <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">State controls</CardDescription>
              <CardTitle className="font-display text-2xl text-(--landing-ink)">Goal lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={updateGoalStatusAction} className="space-y-3">
                <input type="hidden" name="goalId" value={goal.id} />

                <div className="flex items-center gap-2">
                  <select
                    id={`status-${goal.id}`}
                    name="status"
                    defaultValue={goal.status}
                    className="h-9 w-full rounded-lg border border-black/15 bg-white px-2 text-sm text-(--landing-ink) outline-none focus:border-(--landing-accent)"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg border-black/15 bg-white">
                    Apply
                  </Button>
                </div>
              </form>

              <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs leading-6 text-(--landing-muted)">
                Keep status truthful. Active means you are executing weekly, paused means temporarily off-cycle,
                completed means the outcome is achieved.
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
