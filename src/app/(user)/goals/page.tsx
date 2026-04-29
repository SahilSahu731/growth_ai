import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Link from "next/link"

import { authOptions } from "@/auth"
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { deleteGoalAction, updateGoalProgressAction, updateGoalStatusAction } from "@/app/(user)/goals/actions"
import { type AppGoal, findUserByEmail, getDeveloperProfile, type GoalStatus, listGoalsByUserId } from "@/lib/db"

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

type GoalRisk = "ahead" | "on-track" | "at-risk" | "critical" | "done"

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

function getExpectedProgress(goal: AppGoal): number {
  const createdAt = new Date(goal.createdAt)
  const targetDate = new Date(`${goal.targetDate}T00:00:00.000Z`)

  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(targetDate.getTime()) || targetDate <= createdAt) {
    return 0
  }

  const now = new Date()
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - createdAt.getTime()) / DAY_MS))
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - createdAt.getTime()) / DAY_MS)))

  return Math.round((elapsedDays / totalDays) * 100)
}

function getGoalRisk(goal: AppGoal): GoalRisk {
  if (goal.status === "completed") return "done"
  if (goal.status === "archived") return "done"

  const daysLeft = getDaysLeft(goal.targetDate)
  const expected = getExpectedProgress(goal)
  const gap = goal.progress - expected

  if (daysLeft < 0 && goal.progress < 100) return "critical"
  if (daysLeft <= 7 && goal.progress < 55) return "critical"
  if (gap <= -20) return "at-risk"
  if (gap >= 10) return "ahead"

  return "on-track"
}

function getRiskAdvice(goal: AppGoal): string {
  const risk = getGoalRisk(goal)

  if (risk === "critical") {
    return "Run one 60-minute rescue block in the next 24h and complete only the next actionable step."
  }

  if (risk === "at-risk") {
    return "Increase this goal by one extra focus session this week to close the gap."
  }

  if (risk === "ahead") {
    return "You are ahead. Lock this pace by preserving your current weekly cadence."
  }

  if (risk === "done") {
    return "Captured outcome. Archive it or define a stronger next milestone."
  }

  return "Maintain weekly consistency and review progress every two days."
}

function getDeadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue`
  if (daysLeft === 0) return "Due today"
  if (daysLeft === 1) return "Due tomorrow"

  return `Due in ${daysLeft} days`
}

function getFocusPlan(goals: AppGoal[]): Array<{ id: string; title: string; sessions: number; step: string }> {
  return goals
    .filter((goal) => goal.status === "active" || goal.status === "paused")
    .sort((left, right) => {
      const riskPriority = {
        critical: 0,
        "at-risk": 1,
        "on-track": 2,
        ahead: 3,
        done: 4,
      } as const

      return riskPriority[getGoalRisk(left)] - riskPriority[getGoalRisk(right)]
    })
    .slice(0, 3)
    .map((goal) => ({
      id: goal.id,
      title: goal.title,
      sessions: Math.max(2, Math.min(7, Math.round(goal.weeklyCommitmentHours / 2))),
      step: goal.nextStep,
    }))
}

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    redirect("/login")
  }

  let goals: AppGoal[] = []
  let errorMessage: string | null = null

  try {
    const appUser = await findUserByEmail(email)

    if (!appUser) {
      errorMessage = "We could not find your profile record. Please sign out and sign in again."
    } else {
      const profile = await getDeveloperProfile(appUser.id)

      if (!profile) {
        redirect("/onboarding")
      }

      goals = await listGoalsByUserId(appUser.id)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    if (message.includes("DATABASE_URL")) {
      errorMessage = "Database is not configured. Add a valid DATABASE_URL in your .env file to use goals."
    } else {
      errorMessage = "Unable to load goals right now. Please try again in a moment."
      console.error("Failed to load goals", error)
    }
  }

  const activeGoals = goals.filter((goal) => goal.status === "active")
  const completedGoals = goals.filter((goal) => goal.status === "completed")
  const atRiskGoals = goals.filter((goal) => {
    const risk = getGoalRisk(goal)
    return risk === "at-risk" || risk === "critical"
  })
  const dueThisWeek = goals.filter((goal) => goal.status !== "completed" && goal.status !== "archived" && getDaysLeft(goal.targetDate) <= 7)
  const averageProgress = goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0
  const totalWeeklyCommitment = activeGoals.reduce((sum, goal) => sum + goal.weeklyCommitmentHours, 0)
  const focusPlan = getFocusPlan(goals)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Goals</p>
          <h1 className="font-display text-4xl leading-none text-(--landing-ink)">Goal execution engine</h1>
          <p className="text-sm text-(--landing-muted)">Create outcomes, track risk, and run weekly focus loops.</p>
        </div>
        <CreateGoalDialog />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader className="gap-1">
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Active goals</CardDescription>
            <CardTitle className="font-display text-4xl leading-none text-(--landing-ink)">{activeGoals.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-(--landing-muted)">{atRiskGoals.length} currently need intervention</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader className="gap-1">
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Average progress</CardDescription>
            <CardTitle className="font-display text-4xl leading-none text-(--landing-ink)">{averageProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-(--landing-muted)">{dueThisWeek.length} goals due within 7 days</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader className="gap-1">
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Completed</CardDescription>
            <CardTitle className="font-display text-4xl leading-none text-(--landing-ink)">{completedGoals.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-(--landing-muted)">
              {goals.length > 0 ? `${Math.round((completedGoals.length / goals.length) * 100)}% completion rate` : "No goals completed yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader className="gap-1">
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Weekly load</CardDescription>
            <CardTitle className="font-display text-4xl leading-none text-(--landing-ink)">{totalWeeklyCommitment}h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-(--landing-muted)">Total commitment across active goals</p>
          </CardContent>
        </Card>
      </section>

      {errorMessage ? (
        <Card className="rounded-2xl border border-red-200 bg-red-50/80">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-red-700">Goals are unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-red-700">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <section>
        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Weekly focus plan</CardDescription>
            <CardTitle className="font-display text-3xl text-(--landing-ink)">Where to spend energy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusPlan.length === 0 ? (
              <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-4 text-sm leading-6 text-(--landing-muted)">
                Add your first goal and this panel will auto-build a weekly focus plan.
              </p>
            ) : (
              focusPlan.map((item) => (
                <div key={item.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-4">
                  <p className="text-sm font-medium text-(--landing-ink)">{item.title}</p>
                  <p className="mt-1 text-xs text-(--landing-muted)">
                    Suggested cadence: {item.sessions} focus sessions this week
                  </p>
                  <p className="mt-2 text-xs leading-5 text-(--landing-ink)">{item.step}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Your goals</p>
            <h2 className="font-display text-3xl text-(--landing-ink)">Execution board</h2>
          </div>
          <p className="text-xs text-(--landing-muted)">Update progress at least every 48 hours</p>
        </div>

        {goals.length === 0 ? (
          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardContent className="py-8">
              <p className="text-sm leading-6 text-(--landing-muted)">
                No goals yet. Click Create goal to start with one meaningful outcome and a clear first step.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {goals.map((goal) => {
              const daysLeft = getDaysLeft(goal.targetDate)
              const risk = getGoalRisk(goal)
              const statusStyle = STATUS_STYLES[goal.status]
              const riskStyle = RISK_STYLES[risk]
              const isEcosystemReady = goal.source === "ai"
              const purposeText = isEcosystemReady
                ? goal.whyItMatters
                : "Complete setup inside this goal to generate a personal strategy, phases, and milestones."
              const nextActionText = isEcosystemReady
                ? goal.nextStep
                : "Open goal and answer 5 simple option-based questions."

              return (
                <Card key={goal.id} className="rounded-2xl border border-black/10 bg-white/92">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-black/10 bg-white text-(--landing-muted)">
                        {goal.category}
                      </Badge>
                      <Badge className={isEcosystemReady ? "bg-(--landing-accent-soft) text-(--landing-accent)" : "bg-black/8 text-(--landing-muted)"}>
                        {isEcosystemReady ? "Ecosystem Ready" : "Ecosystem Pending"}
                      </Badge>
                      <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
                      <Badge className={riskStyle.className}>{riskStyle.label}</Badge>
                    </div>

                    <div>
                      <CardTitle className="font-display text-2xl leading-tight text-(--landing-ink)">{goal.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(goal.targetDate)} • {getDeadlineLabel(daysLeft)}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Why this matters</p>
                      <p className="mt-1.5 text-sm leading-6 text-(--landing-ink)">{purposeText}</p>
                    </div>

                    <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Next action</p>
                      <p className="mt-1.5 text-sm leading-6 text-(--landing-ink)">{nextActionText}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-(--landing-muted)">
                        <span>{goal.progress}% complete</span>
                        <span>{goal.weeklyCommitmentHours}h/week commitment</span>
                      </div>
                      <Progress
                        value={goal.progress}
                        className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
                      />
                    </div>

                    <p className="text-xs leading-5 text-(--landing-muted)">{getRiskAdvice(goal)}</p>

                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-black/15 bg-white">
                        <Link href={`/goals/${goal.id}?tab=overview`}>Open goal</Link>
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <form action={updateGoalProgressAction} className="space-y-2 rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                        <input type="hidden" name="goalId" value={goal.id} />
                        <label htmlFor={`progress-${goal.id}`} className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                          Progress update
                        </label>
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
                        <div className="flex items-center gap-2">
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
                            Done
                          </Button>
                        </div>
                      </form>

                      <div className="space-y-2 rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                        <form action={updateGoalStatusAction} className="space-y-2">
                          <input type="hidden" name="goalId" value={goal.id} />
                          <label htmlFor={`status-${goal.id}`} className="text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                            Status
                          </label>
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

                        <form action={deleteGoalAction}>
                          <input type="hidden" name="goalId" value={goal.id} />
                          <Button type="submit" variant="destructive" size="sm" className="h-8 rounded-lg">
                            Delete goal
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
