import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  findUserByEmail,
  getDeveloperProfile,
  listCodingSessionsByUserId,
  listDeveloperSkills,
  listGoalsByUserId,
  listProjectsByUserId,
} from "@/lib/db"

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const profile = await getDeveloperProfile(user.id)
  if (!profile) redirect("/onboarding")

  const [skills, goals, projects, sessions] = await Promise.all([
    listDeveloperSkills(user.id),
    listGoalsByUserId(user.id),
    listProjectsByUserId(user.id),
    listCodingSessionsByUserId(user.id, 30),
  ])
  const minutes = sessions.reduce((sum, item) => sum + item.durationMinutes, 0)
  const completedGoals = goals.filter((goal) => goal.status === "completed").length
  const shippedProjects = projects.filter((project) => project.status === "shipped").length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Progress</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-(--landing-ink)">Developer signal board</h1>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Coding time", `${Math.round(minutes / 60)}h`, `${sessions.length} sessions`],
          ["Goal closes", String(completedGoals), `${goals.length} total goals`],
          ["Shipped projects", String(shippedProjects), `${projects.length} in pipeline`],
          ["Weekly target", `${profile.weeklyCodingHours}h`, profile.targetTrack],
        ].map(([label, value, detail]) => (
          <Card key={label} className="rounded-xl border border-black/10 bg-white/92">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-(--landing-muted)">{label}</CardDescription>
              <CardTitle className="font-display text-4xl text-(--landing-ink)">{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="truncate text-sm text-(--landing-muted)">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Skills</CardDescription>
            <CardTitle className="font-display text-2xl text-(--landing-ink)">Progression cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-(--landing-ink)">{skill.name}</p>
                  <Badge variant="outline" className="border-black/10 bg-white font-mono text-(--landing-muted)">{skill.evidenceCount} proofs</Badge>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-(--landing-muted)">
                    <span>Level {skill.currentLevel}</span>
                    <span>Target {skill.targetLevel}</span>
                  </div>
                  <Progress value={(skill.currentLevel / skill.targetLevel) * 100} className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10 bg-white/92">
          <CardHeader>
            <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Timeline</CardDescription>
            <CardTitle className="font-display text-2xl text-(--landing-ink)">Project readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-4 text-sm text-(--landing-muted)">Projects will appear here as portfolio evidence.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-(--landing-ink)">{project.title}</p>
                    <Badge className="bg-(--landing-accent-soft) text-(--landing-accent)">{project.status}</Badge>
                  </div>
                  <Progress value={project.portfolioReadiness} className="mt-3 h-2 rounded-full bg-white *:data-[slot=progress-indicator]:bg-(--landing-accent)" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
