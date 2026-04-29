import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { ProjectForm } from "@/components/developer/project-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { findUserByEmail, getDeveloperProfile, listProjectsByUserId } from "@/lib/db"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const profile = await getDeveloperProfile(user.id)
  if (!profile) redirect("/onboarding")

  const projects = await listProjectsByUserId(user.id)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Projects</p>
          <h1 className="font-display text-4xl leading-none text-(--landing-ink)">Proof-of-work pipeline</h1>
          <p className="mt-2 text-sm text-(--landing-muted)">Track the projects that make your growth visible.</p>
        </div>
        <Badge className="w-fit bg-(--landing-accent-soft) text-(--landing-accent)">GitHub ready / manual v1</Badge>
      </section>

      <Card className="rounded-2xl border border-black/10 bg-white/92">
        <CardHeader>
          <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Create</CardDescription>
          <CardTitle className="font-display text-2xl text-(--landing-ink)">Add project metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        {projects.length === 0 ? (
          <Card className="rounded-2xl border border-black/10 bg-white/92 lg:col-span-2">
            <CardContent className="py-8">
              <p className="text-sm leading-6 text-(--landing-muted)">No projects yet. Add one project and connect it to the goal you are actively building toward.</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="rounded-2xl border border-black/10 bg-white/92">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-(--landing-accent-soft) text-(--landing-accent)">{project.status}</Badge>
                  <Badge variant="outline" className="border-black/10 bg-white font-mono text-(--landing-muted)">{project.projectType.replaceAll("_", " ")}</Badge>
                </div>
                <CardTitle className="font-display text-2xl text-(--landing-ink)">{project.title}</CardTitle>
                <CardDescription>{project.stack || "Stack not defined yet"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-(--landing-muted)">
                    <span>Portfolio readiness</span>
                    <span>{project.portfolioReadiness}%</span>
                  </div>
                  <Progress value={project.portfolioReadiness} className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="truncate rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs text-(--landing-muted)">Repo: {project.repoUrl || "pending"}</p>
                  <p className="truncate rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs text-(--landing-muted)">Live: {project.liveUrl || "pending"}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
