import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { generateRoadmapWithGemini, validateAiGoalAnswers } from "@/lib/ai/goal-architect"
import { createAiGoalWithRoadmap, findUserByEmail } from "@/lib/db"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUser = await findUserByEmail(email)

  if (!appUser) {
    return NextResponse.json({ error: "User profile not found." }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  const parsed = validateAiGoalAnswers(payload)

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const draft = await generateRoadmapWithGemini(parsed.answers)

    const goal = await createAiGoalWithRoadmap({
      userId: appUser.id,
      modelName: draft.modelName,
      answers: parsed.answers,
      goal: draft.goal,
      phases: draft.phases,
      milestones: draft.milestones,
      tasks: draft.tasks,
    })

    return NextResponse.json({
      goalId: goal.id,
      title: goal.title,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI is not configured. Please set GEMINI_API_KEY in your environment." },
        { status: 500 }
      )
    }

    console.error("AI goal generation failed", error)

    return NextResponse.json(
      { error: "Failed to generate AI roadmap right now. Please try again." },
      { status: 500 }
    )
  }
}
