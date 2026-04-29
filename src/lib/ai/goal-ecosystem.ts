import type { AppGoal } from "@/lib/db"
import {
  GOAL_ECOSYSTEM_QUESTION_IDS,
  GOAL_ECOSYSTEM_QUESTIONS,
  type GoalEcosystemAnswers,
} from "@/lib/ai/goal-ecosystem-config"

export type GoalEcosystemDraft = {
  modelName: string
  insights: {
    whyItMatters: string
    nextStep: string
    weeklyCommitmentHours: number
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

const DAY_MS = 1000 * 60 * 60 * 24

const WEEKLY_HOURS_BY_OPTION: Record<string, number> = {
  "2_4_hours": 3,
  "5_7_hours": 6,
  "8_12_hours": 10,
  "13_plus_hours": 14,
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
    const match = value.trim().match(/^\d{4}-\d{2}-\d{2}$/)

    if (!match) {
      return null
    }

    const parsed = new Date(`${value}T00:00:00.000Z`)

    if (!Number.isNaN(parsed.getTime())) {
      return value
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

function getOptionLabel(questionId: string, optionId: string): string {
  const question = GOAL_ECOSYSTEM_QUESTIONS.find((item) => item.id === questionId)

  if (!question) {
    return optionId
  }

  return question.options.find((item) => item.id === optionId)?.label ?? optionId
}

function inferWeeklyHours(answers: GoalEcosystemAnswers): number {
  const optionId = answers.weeklyCapacity.optionId

  if (WEEKLY_HOURS_BY_OPTION[optionId]) {
    return WEEKLY_HOURS_BY_OPTION[optionId]
  }

  const customHours = extractFirstInteger(answers.weeklyCapacity.customText?.trim() ?? "")

  if (!customHours) {
    return 6
  }

  return clamp(customHours, 1, 40)
}

function clampDateWithinRange(input: string | null, minimum: Date, maximum: Date, fallback: Date): string {
  const parsedInput = input ? new Date(`${input}T00:00:00.000Z`) : fallback
  const parsedFallback = Number.isNaN(parsedInput.getTime()) ? fallback : parsedInput

  if (parsedFallback < minimum) {
    return formatDateOnly(minimum)
  }

  if (parsedFallback > maximum) {
    return formatDateOnly(maximum)
  }

  return formatDateOnly(parsedFallback)
}

function buildPrompt(goal: AppGoal, answers: GoalEcosystemAnswers): string {
  const today = new Date().toISOString().slice(0, 10)

  const answerLines = GOAL_ECOSYSTEM_QUESTIONS.map((question, index) => {
    const answer = answers[question.id]
    const label = getOptionLabel(question.id, answer.optionId)

    if (answer.optionId === "something_else") {
      return `${index + 1}) ${question.question}: ${label} - ${answer.customText?.trim() ?? ""}`
    }

    return `${index + 1}) ${question.question}: ${label}`
  })

  return [
    "You are a practical execution strategist.",
    "Build a complete goal ecosystem from the user preferences below.",
    "Return ONLY valid JSON. No markdown, no extra text.",
    "JSON schema:",
    '{"insights":{"whyItMatters":"","nextStep":"","weeklyCommitmentHours":6},"phases":[{"title":"","objective":"","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}],"milestones":[{"title":"","dueDate":"YYYY-MM-DD","phaseIndex":1}],"tasks":[{"title":"","details":"","dueDate":"YYYY-MM-DD","phaseIndex":1,"milestoneIndex":1}]}',
    "Constraints:",
    "- 3 to 5 phases",
    "- 4 to 14 milestones",
    "- 12 to 32 tasks",
    "- every task must be very specific and easy to execute",
    "- dates must be between today and target date",
    "- include realistic pacing based on weekly time capacity",
    `Today: ${today}`,
    `Goal title: ${goal.title}`,
    `Goal category: ${goal.category}`,
    `Developer track: ${goal.developerTrack ?? "not specified"}`,
    `Developer goal type: ${goal.goalType ?? "not specified"}`,
    `Goal target date: ${goal.targetDate}`,
    "User preferences:",
    ...answerLines,
  ].join("\n")
}

export function validateGoalEcosystemAnswers(
  payload: unknown
): { ok: true; answers: GoalEcosystemAnswers } | { ok: false; error: string } {
  if (!isRecord(payload)) {
    return { ok: false, error: "Invalid request body." }
  }

  const answers = {} as GoalEcosystemAnswers

  for (const questionId of GOAL_ECOSYSTEM_QUESTION_IDS) {
    const question = GOAL_ECOSYSTEM_QUESTIONS.find((item) => item.id === questionId)
    const rawAnswer = payload[questionId]

    if (!question || !isRecord(rawAnswer)) {
      return { ok: false, error: "All setup answers are required." }
    }

    const optionId = asString(rawAnswer.optionId)
    const customText = asString(rawAnswer.customText)
    const isValidOption = question.options.some((option) => option.id === optionId)

    if (!isValidOption) {
      return { ok: false, error: "Please select a valid option for each setup question." }
    }

    if (optionId === "something_else") {
      if (customText.length < 3 || customText.length > 240) {
        return { ok: false, error: "For Something else, please add 3 to 240 characters." }
      }
    } else if (customText.length > 240) {
      return { ok: false, error: "Custom notes should be 240 characters or less." }
    }

    answers[questionId] = {
      optionId,
      customText,
    }
  }

  return { ok: true, answers }
}

function normalizeDraft(payload: unknown, goal: AppGoal, answers: GoalEcosystemAnswers, modelName: string): GoalEcosystemDraft {
  const now = new Date()
  const todayDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const minimumTargetDate = addDays(todayDate, 21)

  const targetDateFromGoal = parseDateOnly(goal.targetDate)
  const parsedGoalTarget = targetDateFromGoal ? new Date(`${targetDateFromGoal}T00:00:00.000Z`) : null
  const goalTargetDate =
    parsedGoalTarget && parsedGoalTarget > minimumTargetDate ? parsedGoalTarget : addDays(todayDate, 90)

  const root = isRecord(payload) ? payload : {}
  const insightsRaw = isRecord(root.insights) ? root.insights : {}
  const phasesRaw = Array.isArray(root.phases) ? root.phases : []
  const milestonesRaw = Array.isArray(root.milestones) ? root.milestones : []
  const tasksRaw = Array.isArray(root.tasks) ? root.tasks : []

  const phaseCount = clamp(phasesRaw.length || 4, 3, 5)
  const totalDays = Math.max(phaseCount * 7, Math.ceil((goalTargetDate.getTime() - todayDate.getTime()) / DAY_MS))

  const phases = Array.from({ length: phaseCount }, (_, index) => {
    const source = isRecord(phasesRaw[index]) ? phasesRaw[index] : {}
    const rawStart = parseDateOnly(source.startDate)
    const rawEnd = parseDateOnly(source.endDate)

    const computedStart = addDays(todayDate, Math.floor((index / phaseCount) * totalDays))
    const computedEnd = addDays(todayDate, Math.floor(((index + 1) / phaseCount) * totalDays))

    const startDate = clampDateWithinRange(rawStart, todayDate, goalTargetDate, computedStart)
    const endDate = clampDateWithinRange(rawEnd, todayDate, goalTargetDate, computedEnd)

    return {
      title: asString(source.title) || `Phase ${index + 1}`,
      objective: asString(source.objective) || "Complete planned actions and validate progress.",
      startDate,
      endDate,
      phaseOrder: index + 1,
    }
  })

  const milestonesSource = milestonesRaw.slice(0, 14)
  const milestones: GoalEcosystemDraft["milestones"] = []

  if (milestonesSource.length > 0) {
    const milestoneOrderByPhase = new Map<number, number>()

    for (const item of milestonesSource) {
      const source = isRecord(item) ? item : {}
      const phaseOrder = clamp(Number(source.phaseIndex ?? source.phaseOrder ?? 1), 1, phases.length)
      const nextOrder = (milestoneOrderByPhase.get(phaseOrder) ?? 0) + 1
      milestoneOrderByPhase.set(phaseOrder, nextOrder)

      const phaseEnd = new Date(`${phases[phaseOrder - 1].endDate}T00:00:00.000Z`)
      const dueDate = clampDateWithinRange(parseDateOnly(source.dueDate), todayDate, goalTargetDate, phaseEnd)

      milestones.push({
        title: asString(source.title) || `Phase ${phaseOrder} milestone ${nextOrder}`,
        dueDate,
        phaseOrder,
        milestoneOrder: nextOrder,
        status: "pending",
      })
    }
  } else {
    for (const phase of phases) {
      milestones.push({
        title: `${phase.title} checkpoint`,
        dueDate: phase.endDate,
        phaseOrder: phase.phaseOrder,
        milestoneOrder: 1,
        status: "pending",
      })
    }
  }

  const tasksSource = tasksRaw.slice(0, 32)
  const tasks: GoalEcosystemDraft["tasks"] = []

  if (tasksSource.length > 0) {
    const taskOrderByPhase = new Map<number, number>()

    for (const item of tasksSource) {
      const source = isRecord(item) ? item : {}
      const phaseOrder = clamp(Number(source.phaseIndex ?? source.phaseOrder ?? 1), 1, phases.length)
      const nextOrder = (taskOrderByPhase.get(phaseOrder) ?? 0) + 1
      taskOrderByPhase.set(phaseOrder, nextOrder)

      const phaseEnd = new Date(`${phases[phaseOrder - 1].endDate}T00:00:00.000Z`)
      const dueDate = clampDateWithinRange(parseDateOnly(source.dueDate), todayDate, goalTargetDate, phaseEnd)

      const availableMilestones = milestones
        .filter((item) => item.phaseOrder === phaseOrder)
        .map((item) => item.milestoneOrder)
      const rawMilestoneOrder = Number(source.milestoneIndex ?? source.milestoneOrder)
      const milestoneOrder =
        Number.isFinite(rawMilestoneOrder) && availableMilestones.includes(rawMilestoneOrder)
          ? rawMilestoneOrder
          : availableMilestones[0]

      tasks.push({
        title: asString(source.title) || `Phase ${phaseOrder} task ${nextOrder}`,
        details: asString(source.details) || "Complete this action and update status.",
        dueDate,
        phaseOrder,
        taskOrder: nextOrder,
        milestoneOrder,
        isCompleted: false,
      })
    }
  } else {
    for (const phase of phases) {
      const phaseMilestoneOrder = milestones.find((item) => item.phaseOrder === phase.phaseOrder)?.milestoneOrder

      tasks.push({
        title: `${phase.title}: plan the week`,
        details: "Create a concrete weekly plan for this phase.",
        dueDate: phase.startDate,
        phaseOrder: phase.phaseOrder,
        taskOrder: 1,
        milestoneOrder: phaseMilestoneOrder,
        isCompleted: false,
      })

      tasks.push({
        title: `${phase.title}: execute highest leverage action`,
        details: "Complete the most important task that moves this goal forward.",
        dueDate: phase.endDate,
        phaseOrder: phase.phaseOrder,
        taskOrder: 2,
        milestoneOrder: phaseMilestoneOrder,
        isCompleted: false,
      })

      tasks.push({
        title: `${phase.title}: review and adjust`,
        details: "Review outcomes and refine next phase plan.",
        dueDate: phase.endDate,
        phaseOrder: phase.phaseOrder,
        taskOrder: 3,
        milestoneOrder: phaseMilestoneOrder,
        isCompleted: false,
      })
    }
  }

  const whyItMatters =
    asString(insightsRaw.whyItMatters) ||
    `This goal matters because it strengthens your ${goal.category.toLowerCase()} growth and compounds over time.`
  const nextStep =
    asString(insightsRaw.nextStep) ||
    `Start with the first task in ${phases[0]?.title ?? "Phase 1"} within the next 24 hours.`
  const weeklyCommitmentHours = clamp(Number(insightsRaw.weeklyCommitmentHours ?? inferWeeklyHours(answers)), 1, 40)

  return {
    modelName,
    insights: {
      whyItMatters: whyItMatters.slice(0, 500),
      nextStep: nextStep.slice(0, 300),
      weeklyCommitmentHours,
    },
    phases,
    milestones,
    tasks,
  }
}

export async function generateGoalEcosystemWithGemini(input: {
  goal: AppGoal
  answers: GoalEcosystemAnswers
}): Promise<GoalEcosystemDraft> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.")
  }

  const prompt = buildPrompt(input.goal, input.answers)

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
          temperature: 0.35,
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

  return normalizeDraft(parsed, input.goal, input.answers, modelName)
}
