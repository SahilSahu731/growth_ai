import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import {
  generateGoalEcosystemWithGemini,
  validateGoalEcosystemAnswers,
} from "@/lib/ai/goal-ecosystem"
import {
  findUserByEmail,
  getGoalByIdForUser,
  upsertAiGoalRoadmapForGoal,
} from "@/lib/db"

type RouteContext = {
  params: Promise<{
    goalId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { goalId } = await context.params

  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUser = await findUserByEmail(email)

  if (!appUser) {
    return NextResponse.json({ error: "User profile not found." }, { status: 401 })
  }

  const goal = await getGoalByIdForUser({
    goalId,
    userId: appUser.id,
  })

  if (!goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const parsed = validateGoalEcosystemAnswers(payload)

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const draft = await generateGoalEcosystemWithGemini({
      goal,
      answers: parsed.answers,
    })

    const isUpdated = await upsertAiGoalRoadmapForGoal({
      goalId: goal.id,
      userId: appUser.id,
      modelName: draft.modelName,
      answers: parsed.answers,
      insights: draft.insights,
      phases: draft.phases,
      milestones: draft.milestones,
      tasks: draft.tasks,
    })

    if (!isUpdated) {
      return NextResponse.json({ error: "Goal not found." }, { status: 404 })
    }

    return NextResponse.json({
      goalId: goal.id,
      ecosystemReady: true,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI is not configured. Please set GEMINI_API_KEY in your environment." },
        { status: 500 }
      )
    }

    console.error("Goal ecosystem generation failed", error)

    return NextResponse.json(
      { error: "Failed to build goal ecosystem right now. Please try again." },
      { status: 500 }
    )
  }
}
