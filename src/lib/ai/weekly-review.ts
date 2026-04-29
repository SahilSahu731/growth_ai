import type { AppGoal, AppProject, CodingSession, DeveloperProfile, DeveloperSkill } from "@/lib/db"

export type WeeklyReviewDraft = {
  modelName: string
  shippedSummary: string
  blockers: string
  skillMovement: string
  nextSprint: string
  highLeverageAction: string
  aiReviewText: string
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  error?: { message?: string }
}

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i)
  const candidate = codeBlockMatch ? codeBlockMatch[1] : trimmed

  try {
    return JSON.parse(candidate) as Record<string, unknown>
  } catch {
    const firstBrace = candidate.indexOf("{")
    const lastBrace = candidate.lastIndexOf("}")

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>
    }
  }

  throw new Error("Gemini response was not valid JSON.")
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function buildPrompt(input: {
  profile: DeveloperProfile
  goals: AppGoal[]
  projects: AppProject[]
  skills: DeveloperSkill[]
  sessions: CodingSession[]
}): string {
  return [
    "You are a senior engineering growth coach.",
    "Create a concise weekly developer review from the user's data.",
    "Return ONLY valid JSON with this exact shape:",
    '{"shippedSummary":"","blockers":"","skillMovement":"","nextSprint":"","highLeverageAction":"","aiReviewText":""}',
    "Keep every field specific and under 320 characters.",
    `Persona: ${input.profile.persona}`,
    `Target track: ${input.profile.targetTrack}`,
    `Level: ${input.profile.currentLevel}`,
    `Weekly coding hours: ${input.profile.weeklyCodingHours}`,
    `Goals: ${input.goals.map((goal) => `${goal.title} ${goal.progress}% ${goal.status}`).join("; ") || "none"}`,
    `Projects: ${input.projects.map((project) => `${project.title} ${project.status} ${project.portfolioReadiness}%`).join("; ") || "none"}`,
    `Skills: ${input.skills.map((skill) => `${skill.name} ${skill.currentLevel}/${skill.targetLevel}`).join("; ") || "none"}`,
    `Sessions: ${input.sessions.map((session) => `${session.durationMinutes}m ${session.sessionType}: ${session.completedSummary}; blockers: ${session.blockers || "none"}`).join(" | ") || "none"}`,
  ].join("\n")
}

export async function generateWeeklyReviewWithGemini(input: {
  profile: DeveloperProfile
  goals: AppGoal[]
  projects: AppProject[]
  skills: DeveloperSkill[]
  sessions: CodingSession[]
}): Promise<WeeklyReviewDraft> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.")
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
        generationConfig: { temperature: 0.35, responseMimeType: "application/json" },
      }),
    }
  )

  const payload = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini request failed.")
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? ""
  const parsed = extractJson(text)

  return {
    modelName,
    shippedSummary: asString(parsed.shippedSummary, "No shipped work detected yet. Log sessions to build a stronger review."),
    blockers: asString(parsed.blockers, "No clear blocker pattern yet."),
    skillMovement: asString(parsed.skillMovement, "Skill movement will appear after more evidence is logged."),
    nextSprint: asString(parsed.nextSprint, "Pick one project and complete the next concrete task."),
    highLeverageAction: asString(parsed.highLeverageAction, "Log one focused coding session today."),
    aiReviewText: asString(parsed.aiReviewText, "Your developer cockpit is ready. Add execution data to unlock sharper weekly reviews."),
  }
}
