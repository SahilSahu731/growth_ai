export type AiGoalQuestionId =
  | "outcomeAndDeadline"
  | "motivation"
  | "weeklyTimeCommitment"
  | "currentLevelAndResources"
  | "constraintsAndBlockers"

export type AiGoalAnswers = Record<AiGoalQuestionId, string>

export const AI_GOAL_QUESTIONS: ReadonlyArray<{
  id: AiGoalQuestionId
  question: string
  helper: string
  placeholder: string
}> = [
  {
    id: "outcomeAndDeadline",
    question: "What exact outcome do you want, and by what date?",
    helper: "Be concrete: include measurable result and target date.",
    placeholder: "Example: Reach 10 paid users by 2026-06-30.",
  },
  {
    id: "motivation",
    question: "Why is this important to you right now?",
    helper: "This helps AI optimize urgency and consistency recommendations.",
    placeholder: "Example: I need this to validate my startup idea before graduation.",
  },
  {
    id: "weeklyTimeCommitment",
    question: "How much time can you realistically commit each week?",
    helper: "Be honest about available hours.",
    placeholder: "Example: 8 hours per week, mostly evenings.",
  },
  {
    id: "currentLevelAndResources",
    question: "What is your current level and what resources do you already have?",
    helper: "Mention skills, tools, mentors, or budget.",
    placeholder: "Example: Beginner at paid ads, but strong design skills and a $200 budget.",
  },
  {
    id: "constraintsAndBlockers",
    question: "What constraints or blockers should we plan around?",
    helper: "Think schedule, health, energy, obligations, and risk factors.",
    placeholder: "Example: Full-time job 9-6, can only work weekdays after 8 PM.",
  },
] as const

export const AI_GOAL_QUESTION_IDS = AI_GOAL_QUESTIONS.map((item) => item.id)

export type AiGoalRoadmapDraft = {
  modelName: string
  goal: {
    title: string
    category: string
    whyItMatters: string
    nextStep: string
    weeklyCommitmentHours: number
    targetDate: string
  }
  phases: Array<{
    title: string
    objective: string
    startDate: string
    endDate: string
    phaseOrder: number
  }>
  milestones: Array<{
    title: string
    dueDate: string
    phaseOrder: number
    milestoneOrder: number
    status: "pending" | "completed"
  }>
  tasks: Array<{
    title: string
    details: string
    dueDate: string
    phaseOrder: number
    taskOrder: number
    milestoneOrder?: number
    isCompleted: boolean
  }>
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  if (value < min) return min
  if (value > max) return max

  return Math.round(value)
}

function parseDateOnly(value: unknown): string | null {
  if (typeof value === "string") {
    const match = value.trim().match(/\d{4}-\d{2}-\d{2}/)

    if (match) {
      const candidate = match[0]
      const parsed = new Date(`${candidate}T00:00:00.000Z`)

      if (!Number.isNaN(parsed.getTime())) {
        return candidate
      }
    }
  }

  return null
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setUTCDate(next.getUTCDate() + days)

  return next
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function extractFirstInteger(value: string): number | null {
  const match = value.match(/\d+/)

  if (!match) return null

  const parsed = Number.parseInt(match[0], 10)

  return Number.isFinite(parsed) ? parsed : null
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error("Gemini returned an empty response.")
  }

  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i)
  const candidate = codeBlockMatch ? codeBlockMatch[1] : trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const firstBrace = candidate.indexOf("{")
    const lastBrace = candidate.lastIndexOf("}")

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1))
    }

    throw new Error("Gemini response was not valid JSON.")
  }
}

export function validateAiGoalAnswers(payload: unknown): { ok: true; answers: AiGoalAnswers } | { ok: false; error: string } {
  if (!isRecord(payload)) {
    return { ok: false, error: "Invalid request body." }
  }

  const answers: Partial<AiGoalAnswers> = {}

  for (const id of AI_GOAL_QUESTION_IDS) {
    const value = payload[id]

    if (typeof value !== "string") {
      return { ok: false, error: "All AI answers are required." }
    }

    const normalized = value.trim()

    if (normalized.length < 6 || normalized.length > 1200) {
      return { ok: false, error: "Each answer should be between 6 and 1200 characters." }
    }

    answers[id] = normalized
  }

  return { ok: true, answers: answers as AiGoalAnswers }
}

function buildPrompt(answers: AiGoalAnswers): string {
  const today = new Date().toISOString().slice(0, 10)

  return [
    "You are an expert execution coach.",
    "Create a realistic, practical roadmap from user answers.",
    "Return ONLY valid JSON. No markdown, no prose.",
    "Use this exact schema:",
    '{"goal":{"title":"","category":"","whyItMatters":"","nextStep":"","weeklyCommitmentHours":8,"targetDate":"YYYY-MM-DD"},"phases":[{"title":"","objective":"","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}],"milestones":[{"title":"","dueDate":"YYYY-MM-DD","phaseIndex":1}],"tasks":[{"title":"","details":"","dueDate":"YYYY-MM-DD","phaseIndex":1,"milestoneIndex":1}]}',
    "Constraints:",
    "- 3 to 5 phases",
    "- 4 to 12 milestones",
    "- 10 to 30 tasks",
    "- all dates must be valid and not before today",
    "- keep tasks specific, short, and actionable",
    "- default category should be one of: Career, Health, Business, Learning, Personal, Finance",
    `Today: ${today}`,
    "User answers:",
    `1) Outcome + deadline: ${answers.outcomeAndDeadline}`,
    `2) Motivation: ${answers.motivation}`,
    `3) Weekly commitment: ${answers.weeklyTimeCommitment}`,
    `4) Current level/resources: ${answers.currentLevelAndResources}`,
    `5) Constraints/blockers: ${answers.constraintsAndBlockers}`,
  ].join("\n")
}

function normalizeDraft(payload: unknown, answers: AiGoalAnswers, modelName: string): AiGoalRoadmapDraft {
  const today = new Date()
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const fallbackTargetDate = addDays(todayDate, 90)

  const weeklyHoursFromAnswer = extractFirstInteger(answers.weeklyTimeCommitment) ?? 6

  const root = isRecord(payload) ? payload : {}
  const goalRaw = isRecord(root.goal) ? root.goal : {}
  const phasesRaw = Array.isArray(root.phases) ? root.phases : []
  const milestonesRaw = Array.isArray(root.milestones) ? root.milestones : []
  const tasksRaw = Array.isArray(root.tasks) ? root.tasks : []

  const targetDate =
    parseDateOnly(goalRaw.targetDate) ??
    parseDateOnly(answers.outcomeAndDeadline) ??
    formatDateOnly(fallbackTargetDate)

  const goalTitle = asString(goalRaw.title) || asString(answers.outcomeAndDeadline).slice(0, 120) || "AI generated goal"
  const goalCategory = asString(goalRaw.category, "General") || "General"
  const goalWhy = asString(goalRaw.whyItMatters) || answers.motivation
  const goalNextStep = asString(goalRaw.nextStep) || "Block your first focused work session in the next 24 hours."
  const goalWeeklyHours = clamp(Number(goalRaw.weeklyCommitmentHours ?? weeklyHoursFromAnswer), 1, 40)

  const phaseCount = clamp(phasesRaw.length || 3, 3, 5)
  const targetDateObj = new Date(`${targetDate}T00:00:00.000Z`)
  const totalDays = Math.max(phaseCount * 7, Math.ceil((targetDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)))

  const phases = Array.from({ length: phaseCount }, (_, index) => {
    const source = isRecord(phasesRaw[index]) ? phasesRaw[index] : {}
    const phaseStart = addDays(todayDate, Math.floor((index / phaseCount) * totalDays))
    const phaseEnd = addDays(todayDate, Math.floor(((index + 1) / phaseCount) * totalDays))

    const startDate = parseDateOnly(source.startDate) ?? formatDateOnly(phaseStart)
    const endDate = parseDateOnly(source.endDate) ?? formatDateOnly(phaseEnd)

    return {
      title: asString(source.title) || `Phase ${index + 1}`,
      objective: asString(source.objective) || "Execute focused work and verify progress.",
      startDate,
      endDate,
      phaseOrder: index + 1,
    }
  })

  const milestonesSource = milestonesRaw.slice(0, 12)
  const milestones =
    milestonesSource.length > 0
      ? milestonesSource
          .map((item, index) => {
            const source = isRecord(item) ? item : {}
            const phaseIndex = clamp(Number(source.phaseIndex ?? 1), 1, phases.length)

            return {
              title: asString(source.title) || `Milestone ${index + 1}`,
              dueDate: parseDateOnly(source.dueDate) ?? phases[phaseIndex - 1].endDate,
              phaseOrder: phaseIndex,
              milestoneOrder: index + 1,
              status: "pending" as const,
            }
          })
          .slice(0, 12)
      : phases.map((phase, index) => ({
          title: `${phase.title} checkpoint`,
          dueDate: phase.endDate,
          phaseOrder: phase.phaseOrder,
          milestoneOrder: index + 1,
          status: "pending" as const,
        }))

  const tasksSource = tasksRaw.slice(0, 30)
  const tasks =
    tasksSource.length > 0
      ? tasksSource
          .map((item, index) => {
            const source = isRecord(item) ? item : {}
            const phaseIndex = clamp(Number(source.phaseIndex ?? 1), 1, phases.length)
            const milestoneIndex = clamp(Number(source.milestoneIndex ?? 1), 1, milestones.length)

            return {
              title: asString(source.title) || `Task ${index + 1}`,
              details: asString(source.details) || "Complete and mark this task when done.",
              dueDate: parseDateOnly(source.dueDate) ?? phases[phaseIndex - 1].endDate,
              phaseOrder: phaseIndex,
              milestoneOrder: milestoneIndex,
              taskOrder: index + 1,
              isCompleted: false,
            }
          })
          .slice(0, 30)
      : phases.flatMap((phase, phaseIndex) => {
          const milestone = milestones.find((item) => item.phaseOrder === phase.phaseOrder)

          return [
            {
              title: `${phase.title}: define weekly sprint`,
              details: "Plan exactly what will be completed in this phase.",
              dueDate: phase.endDate,
              phaseOrder: phase.phaseOrder,
              milestoneOrder: milestone?.milestoneOrder,
              taskOrder: phaseIndex * 2 + 1,
              isCompleted: false,
            },
            {
              title: `${phase.title}: execute key action`,
              details: "Run the highest-leverage action and log outcome.",
              dueDate: phase.endDate,
              phaseOrder: phase.phaseOrder,
              milestoneOrder: milestone?.milestoneOrder,
              taskOrder: phaseIndex * 2 + 2,
              isCompleted: false,
            },
          ]
        })

  return {
    modelName,
    goal: {
      title: goalTitle.slice(0, 120),
      category: goalCategory.slice(0, 32),
      whyItMatters: goalWhy.slice(0, 500),
      nextStep: goalNextStep.slice(0, 300),
      weeklyCommitmentHours: goalWeeklyHours,
      targetDate,
    },
    phases,
    milestones,
    tasks,
  }
}

export async function generateRoadmapWithGemini(answers: AiGoalAnswers): Promise<AiGoalRoadmapDraft> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.")
  }

  const prompt = buildPrompt(answers)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    }
  )

  const payload = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini request failed.")
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? ""
  const parsed = extractJson(text)

  return normalizeDraft(parsed, answers, modelName)
}
