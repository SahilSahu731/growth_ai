import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { SessionForm } from "@/components/developer/session-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  findUserByEmail,
  getDeveloperProfile,
  getGoalRoadmapByGoalIdForUser,
  listCodingSessionsByUserId,
  listGoalsByUserId,
  listProjectsByUserId,
  type AppGoal,
} from "@/lib/db"

async function getOpenTasks(goals: AppGoal[], userId: string) {
  const groups = await Promise.all(
    goals
      .filter((goal) => goal.status === "active")
      .slice(0, 4)
      .map(async (goal) => {
        const roadmap = await getGoalRoadmapByGoalIdForUser({ goalId: goal.id, userId })
        return roadmap.tasks.filter((task) => !task.isCompleted).slice(0, 4).map((task) => ({ ...task, goalTitle: goal.title }))
      })
  )

  return groups.flat().slice(0, 10)
}

export default async function PlannerPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const profile = await getDeveloperProfile(user.id)
  if (!profile) redirect("/onboarding")

  const [goals, projects, sessions] = await Promise.all([
    listGoalsByUserId(user.id),
    listProjectsByUserId(user.id),
    listCodingSessionsByUserId(user.id, 10),
  ])
  const tasks = await getOpenTasks(goals, user.id)
  const weekBlocks = ["Mon build", "Tue debug", "Wed ship", "Thu review", "Fri polish"]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-2xl border border-black/10 bg-white/92 p-5">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Planner</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-(--landing-ink)">Weekly sprint console</h1>
        <p className="mt-2 text-sm text-(--landing-muted)">Plan focused coding blocks and log proof of execution.</p>
      </section>

      <section className="grid gap-3 lg:grid-cols-5">
        {weekBlocks.map((block, index) => (
          <Card key={block} className="rounded-xl border border-black/10 bg-white/92">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-[0.64rem] uppercase tracking-[0.14em]">Block {index + 1}</CardDescription>
              <CardTitle className="font-display text-xl text-(--landing-ink)">{block}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-(--landing-muted)">
                {tasks[index]?.title ?? "Reserve for active roadmap work"}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Session Log</CardDescription>
            <CardTitle className="font-display text-2xl text-(--landing-ink)">Record coding evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionForm goals={goals} projects={projects} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Roadmap Pull</CardDescription>
            <CardTitle className="font-display text-2xl text-(--landing-ink)">Open sprint tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-4 text-sm text-(--landing-muted)">Build a goal ecosystem to pull tasks into this sprint console.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-(--landing-ink)">{task.title}</p>
                      <p className="mt-1 text-xs text-(--landing-muted)">{task.goalTitle} / due {task.dueDate}</p>
                    </div>
                    <Badge variant="outline" className="border-black/10 bg-white font-mono text-(--landing-muted)">todo</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border border-black/10 bg-white/92">
        <CardHeader>
          <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Recent Sessions</CardDescription>
          <CardTitle className="font-display text-2xl text-(--landing-ink)">Execution trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-(--landing-muted)">No coding sessions logged yet.</p>
          ) : (
            sessions.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-black/10 bg-(--landing-surface) p-3 sm:grid-cols-[auto_1fr_auto]">
                <Badge className="h-fit bg-(--landing-accent-soft) text-(--landing-accent)">{item.sessionType.replaceAll("_", " ")}</Badge>
                <p className="text-sm text-(--landing-ink)">{item.completedSummary}</p>
                <p className="font-mono text-xs text-(--landing-muted)">{item.durationMinutes}m</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
