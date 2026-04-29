export type GoalEcosystemQuestionId =
  | "currentStage"
  | "weeklyCapacity"
  | "planningStyle"
  | "biggestConstraint"
  | "preferredSupport"

export type GoalEcosystemAnswer = {
  optionId: string
  customText?: string
}

export type GoalEcosystemAnswers = Record<GoalEcosystemQuestionId, GoalEcosystemAnswer>

type GoalEcosystemQuestionOption = {
  id: string
  label: string
}

type GoalEcosystemQuestion = {
  id: GoalEcosystemQuestionId
  question: string
  helper: string
  options: readonly GoalEcosystemQuestionOption[]
}

export const GOAL_ECOSYSTEM_QUESTIONS: readonly GoalEcosystemQuestion[] = [
  {
    id: "currentStage",
    question: "Where are you right now with this goal?",
    helper: "Choose the closest option. No typing needed unless you pick Something else.",
    options: [
      { id: "beginner", label: "Just starting" },
      { id: "already_started", label: "Already started" },
      { id: "stuck_midway", label: "Stuck in the middle" },
      { id: "almost_done", label: "Almost there" },
      { id: "something_else", label: "Something else" },
    ],
  },
  {
    id: "weeklyCapacity",
    question: "How much time can you give each week?",
    helper: "Pick a realistic weekly range.",
    options: [
      { id: "2_4_hours", label: "2 to 4 hours" },
      { id: "5_7_hours", label: "5 to 7 hours" },
      { id: "8_12_hours", label: "8 to 12 hours" },
      { id: "13_plus_hours", label: "13+ hours" },
      { id: "something_else", label: "Something else" },
    ],
  },
  {
    id: "planningStyle",
    question: "How do you want your plan to feel?",
    helper: "This controls how tasks and milestones are structured.",
    options: [
      { id: "daily_checklist", label: "Clear daily checklist" },
      { id: "weekly_sprints", label: "Weekly sprint style" },
      { id: "habit_routine", label: "Habit-based routine" },
      { id: "deep_work_blocks", label: "Deep-work blocks" },
      { id: "something_else", label: "Something else" },
    ],
  },
  {
    id: "biggestConstraint",
    question: "What is your biggest blocker right now?",
    helper: "We will adapt the roadmap around this.",
    options: [
      { id: "time_limit", label: "Limited time" },
      { id: "clarity_gap", label: "Not sure what to do next" },
      { id: "consistency_gap", label: "Hard to stay consistent" },
      { id: "skill_gap", label: "Need to learn missing skills" },
      { id: "focus_energy_gap", label: "Low focus or energy" },
      { id: "something_else", label: "Something else" },
    ],
  },
  {
    id: "preferredSupport",
    question: "What kind of support do you want from this app?",
    helper: "Select the style of help you prefer.",
    options: [
      { id: "step_by_step_tasks", label: "Step-by-step tasks" },
      { id: "milestones_with_dates", label: "Milestones with deadlines" },
      { id: "resources_templates", label: "Resources and templates" },
      { id: "accountability_nudges", label: "Accountability nudges" },
      { id: "balanced_mix", label: "Balanced mix" },
      { id: "something_else", label: "Something else" },
    ],
  },
]

export const GOAL_ECOSYSTEM_QUESTION_IDS = GOAL_ECOSYSTEM_QUESTIONS.map((item) => item.id)

export function createEmptyGoalEcosystemAnswers(): GoalEcosystemAnswers {
  return GOAL_ECOSYSTEM_QUESTIONS.reduce((acc, question) => {
    acc[question.id] = {
      optionId: "",
      customText: "",
    }

    return acc
  }, {} as GoalEcosystemAnswers)
}
