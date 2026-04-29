import { neon } from "@neondatabase/serverless"

export type AppUser = {
  id: string
  name: string
  email: string
  passwordHash: string | null
  authProvider: string
  createdAt: string
  updatedAt: string
}

export type GoalStatus = "active" | "paused" | "completed" | "archived"
export type GoalSource = "manual" | "ai"
export type DeveloperPersona = "solo_builder" | "job_seeker" | "working_developer"
export type DeveloperLevel = "beginner" | "intermediate" | "advanced"
export type DeveloperGoalType = "ship_project" | "learn_skill" | "interview_prep" | "career_growth" | "work_performance"
export type ProjectStatus = "idea" | "building" | "shipped" | "paused" | "archived"
export type CodingSessionType = "deep_work" | "debugging" | "learning" | "interview_prep" | "planning" | "review"

export type AppGoal = {
  id: string
  userId: string
  title: string
  category: string
  whyItMatters: string
  nextStep: string
  weeklyCommitmentHours: number
  targetDate: string
  progress: number
  status: GoalStatus
  source: GoalSource
  developerTrack: DeveloperPersona | null
  goalType: DeveloperGoalType | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}

export type DeveloperProfile = {
  userId: string
  persona: DeveloperPersona
  targetTrack: string
  currentLevel: DeveloperLevel
  weeklyCodingHours: number
  primaryGoalType: DeveloperGoalType
  preferredPlanningStyle: string
  createdAt: string
  updatedAt: string
}

export type DeveloperSkill = {
  id: string
  userId: string
  name: string
  category: string
  currentLevel: number
  targetLevel: number
  confidence: number
  evidenceCount: number
  updatedAt: string
}

export type AppProject = {
  id: string
  userId: string
  goalId: string | null
  title: string
  projectType: DeveloperGoalType
  status: ProjectStatus
  stack: string
  repoUrl: string
  liveUrl: string
  portfolioReadiness: number
  createdAt: string
  updatedAt: string
}

export type CodingSession = {
  id: string
  userId: string
  goalId: string | null
  projectId: string | null
  sessionType: CodingSessionType
  durationMinutes: number
  completedSummary: string
  blockers: string
  energyRating: number
  focusRating: number
  sessionDate: string
  createdAt: string
}

export type WeeklyReview = {
  id: string
  userId: string
  weekStart: string
  shippedSummary: string
  blockers: string
  skillMovement: string
  nextSprint: string
  highLeverageAction: string
  aiReviewText: string
  modelName: string
  createdAt: string
}

export type ComparisonCategory =
  | "product"
  | "finance"
  | "housing"
  | "career"
  | "education"
  | "software"
  | "travel"
  | "healthcare"
  | "services"
  | "custom"

export type ComparisonStatus = "draft" | "needs_info" | "ready" | "decided" | "archived"
export type InsightType = "hidden_cost" | "risk" | "question" | "negotiation" | "recommendation" | "missing_info"
export type RiskSeverity = "low" | "medium" | "high"
export type EvidenceType = "text" | "url" | "pdf" | "image" | "document"
export type UsageMode = "guest" | "free" | "pro"

export type Comparison = {
  id: string
  userId: string | null
  title: string
  category: ComparisonCategory
  status: ComparisonStatus
  context: string
  finalRecommendation: string
  usageMode: UsageMode
  createdAt: string
  updatedAt: string
}

export type ComparisonOption = {
  id: string
  comparisonId: string
  name: string
  description: string
  price: string
  sourceUrl: string
  notes: string
  totalScore: number
  createdAt: string
  updatedAt: string
}

export type ComparisonCriterion = {
  id: string
  comparisonId: string
  name: string
  description: string
  weight: number
  categoryRelevance: string
  createdAt: string
  updatedAt: string
}

export type OptionScore = {
  id: string
  optionId: string
  criterionId: string
  score: number
  reason: string
}

export type ComparisonInsight = {
  id: string
  comparisonId: string
  optionId: string | null
  insightType: InsightType
  title: string
  content: string
  severity: RiskSeverity
  createdAt: string
}

export type ComparisonEvidence = {
  id: string
  comparisonId: string
  fileName: string
  fileType: EvidenceType
  fileUrl: string
  fileKey: string
  extractedText: string
  evidenceSummary: string
  createdAt: string
}

export type ComparisonSource = {
  id: string
  comparisonId: string
  url: string
  title: string
  snippet: string
  fetchedAt: string
  confidence: number
  claimSupported: string
}

export type UsageCounter = {
  userId: string
  usageMonth: string
  planTier: UsageMode
  comparisonsUsed: number
  uploadsUsed: number
  researchCallsUsed: number
}

export type ComparisonReport = {
  comparison: Comparison
  options: ComparisonOption[]
  criteria: ComparisonCriterion[]
  scores: OptionScore[]
  insights: ComparisonInsight[]
  evidence: ComparisonEvidence[]
  sources: ComparisonSource[]
}

export type GoalRoadmapPhase = {
  id: string
  goalId: string
  title: string
  objective: string
  phaseOrder: number
  startDate: string
  endDate: string
}

export type GoalRoadmapMilestone = {
  id: string
  goalId: string
  phaseId: string | null
  title: string
  dueDate: string
  status: "pending" | "completed"
  milestoneOrder: number
}

export type GoalRoadmapTask = {
  id: string
  goalId: string
  phaseId: string | null
  milestoneId: string | null
  title: string
  details: string
  dueDate: string
  isCompleted: boolean
  taskOrder: number
}

export type GoalRoadmap = {
  phases: GoalRoadmapPhase[]
  milestones: GoalRoadmapMilestone[]
  tasks: GoalRoadmapTask[]
}

export type CreateAiGoalRoadmapInput = {
  userId: string
  modelName: string
  answers: Record<string, unknown>
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
    status?: "pending" | "completed"
  }>
  tasks: Array<{
    title: string
    details: string
    dueDate: string
    phaseOrder: number
    taskOrder: number
    milestoneOrder?: number
    isCompleted?: boolean
  }>
}

export type UpsertAiGoalRoadmapForGoalInput = {
  goalId: string
  userId: string
  modelName: string
  answers: Record<string, unknown>
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
    status?: "pending" | "completed"
  }>
  tasks: Array<{
    title: string
    details: string
    dueDate: string
    phaseOrder: number
    taskOrder: number
    milestoneOrder?: number
    isCompleted?: boolean
  }>
}

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.")
  }

  // Guard against default placeholder values that look set but are unusable.
  if (databaseUrl.includes("<user>") || databaseUrl.includes("<password>") || databaseUrl.includes("<host>")) {
    throw new Error("DATABASE_URL is still using placeholder values.")
  }

  return neon(databaseUrl)
}

let isAuthSchemaReady = false
let isGoalsSchemaReady = false
let isGoalRoadmapSchemaReady = false
let isDeveloperSchemaReady = false
let isComparisonSchemaReady = false

export async function ensureAuthSchema(): Promise<void> {
  if (isAuthSchemaReady) return

  const sql = getSqlClient()

  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'credentials',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'credentials';
  `

  await sql`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `

  await sql`
    ALTER TABLE app_users
    ALTER COLUMN password_hash DROP NOT NULL;
  `

  isAuthSchemaReady = true
}

export async function ensureGoalsSchema(): Promise<void> {
  if (isGoalsSchemaReady) return

  await ensureAuthSchema()

  const sql = getSqlClient()

  await sql`
    CREATE TABLE IF NOT EXISTS app_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      why_it_matters TEXT NOT NULL,
      next_step TEXT NOT NULL,
      weekly_commitment_hours INTEGER NOT NULL DEFAULT 4,
      target_date DATE NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT app_goals_progress_range CHECK (progress >= 0 AND progress <= 100),
      CONSTRAINT app_goals_commitment_range CHECK (weekly_commitment_hours >= 1 AND weekly_commitment_hours <= 80),
      CONSTRAINT app_goals_status_valid CHECK (status IN ('active', 'paused', 'completed', 'archived'))
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goals_user_id
    ON app_goals (user_id);
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goals_user_target_date
    ON app_goals (user_id, target_date);
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS why_it_matters TEXT NOT NULL DEFAULT '';
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS next_step TEXT NOT NULL DEFAULT '';
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS weekly_commitment_hours INTEGER NOT NULL DEFAULT 4;
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS developer_track TEXT;
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS goal_type TEXT;
  `

  await sql`
    ALTER TABLE app_goals
    ADD COLUMN IF NOT EXISTS project_id TEXT;
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_goal_phases (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES app_goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      phase_order INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (goal_id, phase_order)
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goal_phases_goal_id
    ON app_goal_phases (goal_id);
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_goal_milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES app_goals(id) ON DELETE CASCADE,
      phase_id TEXT REFERENCES app_goal_phases(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      milestone_order INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT app_goal_milestones_status_valid CHECK (status IN ('pending', 'completed'))
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goal_milestones_goal_id
    ON app_goal_milestones (goal_id);
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_goal_tasks (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES app_goals(id) ON DELETE CASCADE,
      phase_id TEXT REFERENCES app_goal_phases(id) ON DELETE SET NULL,
      milestone_id TEXT REFERENCES app_goal_milestones(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      due_date DATE NOT NULL,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      task_order INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goal_tasks_goal_id
    ON app_goal_tasks (goal_id);
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_goal_ai_sessions (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL UNIQUE REFERENCES app_goals(id) ON DELETE CASCADE,
      model_name TEXT NOT NULL,
      prompt_version TEXT NOT NULL DEFAULT 'v1',
      answers_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_app_goal_ai_sessions_goal_id
    ON app_goal_ai_sessions (goal_id);
  `

  isGoalsSchemaReady = true
  isGoalRoadmapSchemaReady = true
}

async function ensureGoalRoadmapSchema(): Promise<void> {
  if (isGoalRoadmapSchemaReady) return

  await ensureGoalsSchema()
  isGoalRoadmapSchemaReady = true
}

export async function ensureDeveloperSchema(): Promise<void> {
  if (isDeveloperSchemaReady) return

  await ensureGoalsSchema()

  const sql = getSqlClient()

  await sql`
    CREATE TABLE IF NOT EXISTS app_developer_profiles (
      user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      persona TEXT NOT NULL,
      target_track TEXT NOT NULL,
      current_level TEXT NOT NULL,
      weekly_coding_hours INTEGER NOT NULL,
      primary_goal_type TEXT NOT NULL,
      preferred_planning_style TEXT NOT NULL DEFAULT 'weekly_sprints',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_developer_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      current_level INTEGER NOT NULL DEFAULT 1,
      target_level INTEGER NOT NULL DEFAULT 4,
      confidence INTEGER NOT NULL DEFAULT 50,
      evidence_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, name)
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      goal_id TEXT REFERENCES app_goals(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      project_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idea',
      stack TEXT NOT NULL DEFAULT '',
      repo_url TEXT NOT NULL DEFAULT '',
      live_url TEXT NOT NULL DEFAULT '',
      portfolio_readiness INTEGER NOT NULL DEFAULT 15,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_coding_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      goal_id TEXT REFERENCES app_goals(id) ON DELETE SET NULL,
      project_id TEXT REFERENCES app_projects(id) ON DELETE SET NULL,
      session_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed_summary TEXT NOT NULL,
      blockers TEXT NOT NULL DEFAULT '',
      energy_rating INTEGER NOT NULL DEFAULT 3,
      focus_rating INTEGER NOT NULL DEFAULT 3,
      session_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_weekly_reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      week_start DATE NOT NULL,
      shipped_summary TEXT NOT NULL,
      blockers TEXT NOT NULL,
      skill_movement TEXT NOT NULL,
      next_sprint TEXT NOT NULL,
      high_leverage_action TEXT NOT NULL,
      ai_review_text TEXT NOT NULL,
      model_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, week_start)
    );
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_app_projects_user_id ON app_projects (user_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_app_coding_sessions_user_date ON app_coding_sessions (user_id, session_date);`
  await sql`CREATE INDEX IF NOT EXISTS idx_app_weekly_reviews_user_week ON app_weekly_reviews (user_id, week_start);`

  isDeveloperSchemaReady = true
}

export async function ensureComparisonSchema(): Promise<void> {
  if (isComparisonSchemaReady) return

  await ensureAuthSchema()

  const sql = getSqlClient()

  await sql`
    CREATE TABLE IF NOT EXISTS comparisons (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'custom',
      status TEXT NOT NULL DEFAULT 'draft',
      context TEXT NOT NULL DEFAULT '',
      final_recommendation TEXT NOT NULL DEFAULT '',
      usage_mode TEXT NOT NULL DEFAULT 'free',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comparison_options (
      id TEXT PRIMARY KEY,
      comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      total_score NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comparison_criteria (
      id TEXT PRIMARY KEY,
      comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      weight INTEGER NOT NULL DEFAULT 20,
      category_relevance TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS option_scores (
      id TEXT PRIMARY KEY,
      option_id TEXT NOT NULL REFERENCES comparison_options(id) ON DELETE CASCADE,
      criterion_id TEXT NOT NULL REFERENCES comparison_criteria(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 5,
      reason TEXT NOT NULL DEFAULT '',
      UNIQUE (option_id, criterion_id)
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comparison_insights (
      id TEXT PRIMARY KEY,
      comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
      option_id TEXT REFERENCES comparison_options(id) ON DELETE CASCADE,
      insight_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comparison_evidence (
      id TEXT PRIMARY KEY,
      comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'text',
      file_url TEXT NOT NULL DEFAULT '',
      file_key TEXT NOT NULL DEFAULT '',
      extracted_text TEXT NOT NULL DEFAULT '',
      evidence_summary TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS comparison_sources (
      id TEXT PRIMARY KEY,
      comparison_id TEXT NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      snippet TEXT NOT NULL DEFAULT '',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confidence INTEGER NOT NULL DEFAULT 60,
      claim_supported TEXT NOT NULL DEFAULT ''
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS usage_counters (
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      usage_month TEXT NOT NULL,
      plan_tier TEXT NOT NULL DEFAULT 'free',
      comparisons_used INTEGER NOT NULL DEFAULT 0,
      uploads_used INTEGER NOT NULL DEFAULT 0,
      research_calls_used INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, usage_month)
    );
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON comparisons (user_id, updated_at DESC);`
  await sql`CREATE INDEX IF NOT EXISTS idx_comparison_options_comparison_id ON comparison_options (comparison_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_comparison_criteria_comparison_id ON comparison_criteria (comparison_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_comparison_insights_comparison_id ON comparison_insights (comparison_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_comparison_evidence_comparison_id ON comparison_evidence (comparison_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_comparison_sources_comparison_id ON comparison_sources (comparison_id);`

  isComparisonSchemaReady = true
}

type GoalRow = {
  id: string
  user_id: string
  title: string
  category: string
  why_it_matters: string
  next_step: string
  weekly_commitment_hours: number
  target_date: string | Date
  progress: number
  status: GoalStatus
  source: string
  developer_track: string | null
  goal_type: string | null
  project_id: string | null
  created_at: string | Date
  updated_at: string | Date
}

const DEVELOPER_PERSONAS = new Set(["solo_builder", "job_seeker", "working_developer"])
const DEVELOPER_GOAL_TYPES = new Set(["ship_project", "learn_skill", "interview_prep", "career_growth", "work_performance"])

function normalizeDeveloperPersona(value: string | null): DeveloperPersona | null {
  return value && DEVELOPER_PERSONAS.has(value) ? (value as DeveloperPersona) : null
}

function normalizeDeveloperGoalType(value: string | null): DeveloperGoalType | null {
  return value && DEVELOPER_GOAL_TYPES.has(value) ? (value as DeveloperGoalType) : null
}

function normalizeDateOnly(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ""
    return value.toISOString().slice(0, 10)
  }

  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ""

  return parsed.toISOString().slice(0, 10)
}

function normalizeTimestamp(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ""
    return value.toISOString()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toISOString()
}

function mapGoalRow(goal: GoalRow): AppGoal {
  return {
    id: goal.id,
    userId: goal.user_id,
    title: goal.title,
    category: goal.category,
    whyItMatters: goal.why_it_matters,
    nextStep: goal.next_step,
    weeklyCommitmentHours: goal.weekly_commitment_hours,
    targetDate: normalizeDateOnly(goal.target_date),
    progress: goal.progress,
    status: goal.status,
    source: goal.source === "ai" ? "ai" : "manual",
    developerTrack: normalizeDeveloperPersona(goal.developer_track),
    goalType: normalizeDeveloperGoalType(goal.goal_type),
    projectId: goal.project_id,
    createdAt: normalizeTimestamp(goal.created_at),
    updatedAt: normalizeTimestamp(goal.updated_at),
  }
}

export async function listGoalsByUserId(userId: string): Promise<AppGoal[]> {
  await ensureGoalsSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    SELECT
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      created_at,
      updated_at
    FROM app_goals
    WHERE user_id = ${userId}
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'paused' THEN 1
        WHEN 'completed' THEN 2
        ELSE 3
      END,
      target_date ASC,
      created_at DESC;
  `) as GoalRow[]

  return rows.map(mapGoalRow)
}

export async function getGoalByIdForUser(input: {
  goalId: string
  userId: string
}): Promise<AppGoal | null> {
  await ensureGoalsSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    SELECT
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      created_at,
      updated_at
    FROM app_goals
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId}
    LIMIT 1;
  `) as GoalRow[]

  const row = rows[0]

  return row ? mapGoalRow(row) : null
}

export async function createGoal(input: {
  id: string
  userId: string
  title: string
  category: string
  whyItMatters: string
  nextStep: string
  weeklyCommitmentHours: number
  targetDate: string
  source?: GoalSource
  developerTrack?: DeveloperPersona | null
  goalType?: DeveloperGoalType | null
  projectId?: string | null
}): Promise<AppGoal> {
  await ensureGoalsSchema()

  const sql = getSqlClient()
  const source = input.source ?? "manual"

  const rows = (await sql`
    INSERT INTO app_goals (
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      updated_at
    )
    VALUES (
      ${input.id},
      ${input.userId},
      ${input.title},
      ${input.category},
      ${input.whyItMatters},
      ${input.nextStep},
      ${input.weeklyCommitmentHours},
      ${input.targetDate},
      0,
      'active',
      ${source},
      ${input.developerTrack ?? null},
      ${input.goalType ?? null},
      ${input.projectId ?? null},
      NOW()
    )
    RETURNING
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      created_at,
      updated_at;
  `) as GoalRow[]

  return mapGoalRow(rows[0])
}

export async function updateGoalProgress(input: {
  goalId: string
  userId: string
  progress: number
}): Promise<AppGoal | null> {
  await ensureGoalsSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    UPDATE app_goals
    SET
      progress = ${input.progress},
      status = CASE
        WHEN ${input.progress} >= 100 AND status <> 'archived' THEN 'completed'
        WHEN ${input.progress} < 100 AND status = 'completed' THEN 'active'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId}
    RETURNING
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      created_at,
      updated_at;
  `) as GoalRow[]

  const row = rows[0]

  return row ? mapGoalRow(row) : null
}

export async function updateGoalStatus(input: {
  goalId: string
  userId: string
  status: GoalStatus
}): Promise<AppGoal | null> {
  await ensureGoalsSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    UPDATE app_goals
    SET
      status = ${input.status},
      progress = CASE
        WHEN ${input.status} = 'completed' THEN 100
        ELSE progress
      END,
      updated_at = NOW()
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId}
    RETURNING
      id,
      user_id,
      title,
      category,
      why_it_matters,
      next_step,
      weekly_commitment_hours,
      target_date,
      progress,
      status,
      source,
      developer_track,
      goal_type,
      project_id,
      created_at,
      updated_at;
  `) as GoalRow[]

  const row = rows[0]

  return row ? mapGoalRow(row) : null
}

export async function deleteGoal(input: {
  goalId: string
  userId: string
}): Promise<boolean> {
  await ensureGoalsSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    DELETE FROM app_goals
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId}
    RETURNING id;
  `) as Array<{ id: string }>

  return rows.length > 0
}

type GoalPhaseRow = {
  id: string
  goal_id: string
  title: string
  objective: string
  phase_order: number
  start_date: string | Date
  end_date: string | Date
}

type GoalMilestoneRow = {
  id: string
  goal_id: string
  phase_id: string | null
  title: string
  due_date: string | Date
  status: "pending" | "completed"
  milestone_order: number
}

type GoalTaskRow = {
  id: string
  goal_id: string
  phase_id: string | null
  milestone_id: string | null
  title: string
  details: string
  due_date: string | Date
  is_completed: boolean
  task_order: number
}

function mapGoalPhaseRow(row: GoalPhaseRow): GoalRoadmapPhase {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    objective: row.objective,
    phaseOrder: row.phase_order,
    startDate: normalizeDateOnly(row.start_date),
    endDate: normalizeDateOnly(row.end_date),
  }
}

function mapGoalMilestoneRow(row: GoalMilestoneRow): GoalRoadmapMilestone {
  return {
    id: row.id,
    goalId: row.goal_id,
    phaseId: row.phase_id,
    title: row.title,
    dueDate: normalizeDateOnly(row.due_date),
    status: row.status,
    milestoneOrder: row.milestone_order,
  }
}

function mapGoalTaskRow(row: GoalTaskRow): GoalRoadmapTask {
  return {
    id: row.id,
    goalId: row.goal_id,
    phaseId: row.phase_id,
    milestoneId: row.milestone_id,
    title: row.title,
    details: row.details,
    dueDate: normalizeDateOnly(row.due_date),
    isCompleted: row.is_completed,
    taskOrder: row.task_order,
  }
}

export async function createAiGoalWithRoadmap(input: CreateAiGoalRoadmapInput): Promise<AppGoal> {
  await ensureGoalRoadmapSchema()

  const goal = await createGoal({
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.goal.title,
    category: input.goal.category,
    whyItMatters: input.goal.whyItMatters,
    nextStep: input.goal.nextStep,
    weeklyCommitmentHours: input.goal.weeklyCommitmentHours,
    targetDate: input.goal.targetDate,
    source: "ai",
  })

  const sql = getSqlClient()
  const phaseIdByOrder = new Map<number, string>()
  const milestoneIdByKey = new Map<string, string>()

  const phases = [...input.phases].sort((left, right) => left.phaseOrder - right.phaseOrder)
  const milestones = [...input.milestones].sort((left, right) => left.milestoneOrder - right.milestoneOrder)
  const tasks = [...input.tasks].sort((left, right) => left.taskOrder - right.taskOrder)

  for (const phase of phases) {
    const phaseId = crypto.randomUUID()
    phaseIdByOrder.set(phase.phaseOrder, phaseId)

    await sql`
      INSERT INTO app_goal_phases (
        id,
        goal_id,
        title,
        objective,
        phase_order,
        start_date,
        end_date
      )
      VALUES (
        ${phaseId},
        ${goal.id},
        ${phase.title},
        ${phase.objective},
        ${phase.phaseOrder},
        ${phase.startDate},
        ${phase.endDate}
      );
    `
  }

  for (const milestone of milestones) {
    const milestoneId = crypto.randomUUID()
    const phaseId = phaseIdByOrder.get(milestone.phaseOrder) ?? null

    if (!phaseId) continue

    milestoneIdByKey.set(`${milestone.phaseOrder}:${milestone.milestoneOrder}`, milestoneId)

    await sql`
      INSERT INTO app_goal_milestones (
        id,
        goal_id,
        phase_id,
        title,
        due_date,
        status,
        milestone_order,
        updated_at
      )
      VALUES (
        ${milestoneId},
        ${goal.id},
        ${phaseId},
        ${milestone.title},
        ${milestone.dueDate},
        ${milestone.status ?? "pending"},
        ${milestone.milestoneOrder},
        NOW()
      );
    `
  }

  for (const task of tasks) {
    const phaseId = phaseIdByOrder.get(task.phaseOrder) ?? null
    const milestoneId =
      typeof task.milestoneOrder === "number"
        ? milestoneIdByKey.get(`${task.phaseOrder}:${task.milestoneOrder}`) ?? null
        : null

    if (!phaseId) continue

    await sql`
      INSERT INTO app_goal_tasks (
        id,
        goal_id,
        phase_id,
        milestone_id,
        title,
        details,
        due_date,
        is_completed,
        task_order,
        updated_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${goal.id},
        ${phaseId},
        ${milestoneId},
        ${task.title},
        ${task.details},
        ${task.dueDate},
        ${task.isCompleted ?? false},
        ${task.taskOrder},
        NOW()
      );
    `
  }

  await sql`
    INSERT INTO app_goal_ai_sessions (
      id,
      goal_id,
      model_name,
      prompt_version,
      answers_json
    )
    VALUES (
      ${crypto.randomUUID()},
      ${goal.id},
      ${input.modelName},
      'v1',
      ${JSON.stringify(input.answers)}::jsonb
    )
    ON CONFLICT (goal_id)
    DO UPDATE SET
      model_name = EXCLUDED.model_name,
      answers_json = EXCLUDED.answers_json;
  `

  return goal
}

export async function upsertAiGoalRoadmapForGoal(input: UpsertAiGoalRoadmapForGoalInput): Promise<boolean> {
  await ensureGoalRoadmapSchema()

  const sql = getSqlClient()

  const ownershipRows = (await sql`
    SELECT id
    FROM app_goals
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId}
    LIMIT 1;
  `) as Array<{ id: string }>

  if (ownershipRows.length === 0) {
    return false
  }

  await sql`
    UPDATE app_goals
    SET
      why_it_matters = ${input.insights.whyItMatters},
      next_step = ${input.insights.nextStep},
      weekly_commitment_hours = ${input.insights.weeklyCommitmentHours},
      source = 'ai',
      updated_at = NOW()
    WHERE id = ${input.goalId}
      AND user_id = ${input.userId};
  `

  // Replace existing ecosystem in dependency order.
  await sql`
    DELETE FROM app_goal_tasks
    WHERE goal_id = ${input.goalId};
  `

  await sql`
    DELETE FROM app_goal_milestones
    WHERE goal_id = ${input.goalId};
  `

  await sql`
    DELETE FROM app_goal_phases
    WHERE goal_id = ${input.goalId};
  `

  const phaseIdByOrder = new Map<number, string>()
  const milestoneIdByKey = new Map<string, string>()

  const phases = [...input.phases].sort((left, right) => left.phaseOrder - right.phaseOrder)
  const milestones = [...input.milestones].sort((left, right) => {
    if (left.phaseOrder !== right.phaseOrder) {
      return left.phaseOrder - right.phaseOrder
    }

    return left.milestoneOrder - right.milestoneOrder
  })
  const tasks = [...input.tasks].sort((left, right) => {
    if (left.phaseOrder !== right.phaseOrder) {
      return left.phaseOrder - right.phaseOrder
    }

    return left.taskOrder - right.taskOrder
  })

  for (const phase of phases) {
    const phaseId = crypto.randomUUID()
    phaseIdByOrder.set(phase.phaseOrder, phaseId)

    await sql`
      INSERT INTO app_goal_phases (
        id,
        goal_id,
        title,
        objective,
        phase_order,
        start_date,
        end_date
      )
      VALUES (
        ${phaseId},
        ${input.goalId},
        ${phase.title},
        ${phase.objective},
        ${phase.phaseOrder},
        ${phase.startDate},
        ${phase.endDate}
      );
    `
  }

  for (const milestone of milestones) {
    const milestoneId = crypto.randomUUID()
    const phaseId = phaseIdByOrder.get(milestone.phaseOrder) ?? null

    if (!phaseId) continue

    milestoneIdByKey.set(`${milestone.phaseOrder}:${milestone.milestoneOrder}`, milestoneId)

    await sql`
      INSERT INTO app_goal_milestones (
        id,
        goal_id,
        phase_id,
        title,
        due_date,
        status,
        milestone_order,
        updated_at
      )
      VALUES (
        ${milestoneId},
        ${input.goalId},
        ${phaseId},
        ${milestone.title},
        ${milestone.dueDate},
        ${milestone.status ?? "pending"},
        ${milestone.milestoneOrder},
        NOW()
      );
    `
  }

  for (const task of tasks) {
    const phaseId = phaseIdByOrder.get(task.phaseOrder) ?? null
    const milestoneId =
      typeof task.milestoneOrder === "number"
        ? milestoneIdByKey.get(`${task.phaseOrder}:${task.milestoneOrder}`) ?? null
        : null

    if (!phaseId) continue

    await sql`
      INSERT INTO app_goal_tasks (
        id,
        goal_id,
        phase_id,
        milestone_id,
        title,
        details,
        due_date,
        is_completed,
        task_order,
        updated_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${input.goalId},
        ${phaseId},
        ${milestoneId},
        ${task.title},
        ${task.details},
        ${task.dueDate},
        ${task.isCompleted ?? false},
        ${task.taskOrder},
        NOW()
      );
    `
  }

  await sql`
    INSERT INTO app_goal_ai_sessions (
      id,
      goal_id,
      model_name,
      prompt_version,
      answers_json
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.goalId},
      ${input.modelName},
      'v2',
      ${JSON.stringify(input.answers)}::jsonb
    )
    ON CONFLICT (goal_id)
    DO UPDATE SET
      model_name = EXCLUDED.model_name,
      prompt_version = EXCLUDED.prompt_version,
      answers_json = EXCLUDED.answers_json;
  `

  return true
}

export async function getGoalRoadmapByGoalIdForUser(input: {
  goalId: string
  userId: string
}): Promise<GoalRoadmap> {
  await ensureGoalRoadmapSchema()

  const sql = getSqlClient()

  const phases = (await sql`
    SELECT
      p.id,
      p.goal_id,
      p.title,
      p.objective,
      p.phase_order,
      p.start_date,
      p.end_date
    FROM app_goal_phases p
    INNER JOIN app_goals g ON g.id = p.goal_id
    WHERE p.goal_id = ${input.goalId}
      AND g.user_id = ${input.userId}
    ORDER BY p.phase_order ASC;
  `) as GoalPhaseRow[]

  const milestones = (await sql`
    SELECT
      m.id,
      m.goal_id,
      m.phase_id,
      m.title,
      m.due_date,
      m.status,
      m.milestone_order
    FROM app_goal_milestones m
    INNER JOIN app_goals g ON g.id = m.goal_id
    LEFT JOIN app_goal_phases p ON p.id = m.phase_id
    WHERE m.goal_id = ${input.goalId}
      AND g.user_id = ${input.userId}
    ORDER BY COALESCE(p.phase_order, 999), m.milestone_order ASC;
  `) as GoalMilestoneRow[]

  const tasks = (await sql`
    SELECT
      t.id,
      t.goal_id,
      t.phase_id,
      t.milestone_id,
      t.title,
      t.details,
      t.due_date,
      t.is_completed,
      t.task_order
    FROM app_goal_tasks t
    INNER JOIN app_goals g ON g.id = t.goal_id
    LEFT JOIN app_goal_phases p ON p.id = t.phase_id
    WHERE t.goal_id = ${input.goalId}
      AND g.user_id = ${input.userId}
    ORDER BY COALESCE(p.phase_order, 999), t.task_order ASC;
  `) as GoalTaskRow[]

  return {
    phases: phases.map(mapGoalPhaseRow),
    milestones: milestones.map(mapGoalMilestoneRow),
    tasks: tasks.map(mapGoalTaskRow),
  }
}

export async function setGoalTaskCompletion(input: {
  goalId: string
  taskId: string
  userId: string
  isCompleted: boolean
}): Promise<boolean> {
  await ensureGoalRoadmapSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    UPDATE app_goal_tasks AS t
    SET
      is_completed = ${input.isCompleted},
      updated_at = NOW()
    FROM app_goals AS g
    WHERE t.id = ${input.taskId}
      AND t.goal_id = ${input.goalId}
      AND g.id = t.goal_id
      AND g.user_id = ${input.userId}
    RETURNING t.id;
  `) as Array<{ id: string }>

  return rows.length > 0
}

type DeveloperProfileRow = {
  user_id: string
  persona: DeveloperPersona
  target_track: string
  current_level: DeveloperLevel
  weekly_coding_hours: number
  primary_goal_type: DeveloperGoalType
  preferred_planning_style: string
  created_at: string | Date
  updated_at: string | Date
}

type DeveloperSkillRow = {
  id: string
  user_id: string
  name: string
  category: string
  current_level: number
  target_level: number
  confidence: number
  evidence_count: number
  updated_at: string | Date
}

type ProjectRow = {
  id: string
  user_id: string
  goal_id: string | null
  title: string
  project_type: DeveloperGoalType
  status: ProjectStatus
  stack: string
  repo_url: string
  live_url: string
  portfolio_readiness: number
  created_at: string | Date
  updated_at: string | Date
}

type CodingSessionRow = {
  id: string
  user_id: string
  goal_id: string | null
  project_id: string | null
  session_type: CodingSessionType
  duration_minutes: number
  completed_summary: string
  blockers: string
  energy_rating: number
  focus_rating: number
  session_date: string | Date
  created_at: string | Date
}

type WeeklyReviewRow = {
  id: string
  user_id: string
  week_start: string | Date
  shipped_summary: string
  blockers: string
  skill_movement: string
  next_sprint: string
  high_leverage_action: string
  ai_review_text: string
  model_name: string
  created_at: string | Date
}

function mapDeveloperProfileRow(row: DeveloperProfileRow): DeveloperProfile {
  return {
    userId: row.user_id,
    persona: row.persona,
    targetTrack: row.target_track,
    currentLevel: row.current_level,
    weeklyCodingHours: row.weekly_coding_hours,
    primaryGoalType: row.primary_goal_type,
    preferredPlanningStyle: row.preferred_planning_style,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapDeveloperSkillRow(row: DeveloperSkillRow): DeveloperSkill {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    currentLevel: row.current_level,
    targetLevel: row.target_level,
    confidence: row.confidence,
    evidenceCount: row.evidence_count,
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapProjectRow(row: ProjectRow): AppProject {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    title: row.title,
    projectType: row.project_type,
    status: row.status,
    stack: row.stack,
    repoUrl: row.repo_url,
    liveUrl: row.live_url,
    portfolioReadiness: row.portfolio_readiness,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapCodingSessionRow(row: CodingSessionRow): CodingSession {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    projectId: row.project_id,
    sessionType: row.session_type,
    durationMinutes: row.duration_minutes,
    completedSummary: row.completed_summary,
    blockers: row.blockers,
    energyRating: row.energy_rating,
    focusRating: row.focus_rating,
    sessionDate: normalizeDateOnly(row.session_date),
    createdAt: normalizeTimestamp(row.created_at),
  }
}

function mapWeeklyReviewRow(row: WeeklyReviewRow): WeeklyReview {
  return {
    id: row.id,
    userId: row.user_id,
    weekStart: normalizeDateOnly(row.week_start),
    shippedSummary: row.shipped_summary,
    blockers: row.blockers,
    skillMovement: row.skill_movement,
    nextSprint: row.next_sprint,
    highLeverageAction: row.high_leverage_action,
    aiReviewText: row.ai_review_text,
    modelName: row.model_name,
    createdAt: normalizeTimestamp(row.created_at),
  }
}

export async function getDeveloperProfile(userId: string): Promise<DeveloperProfile | null> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT user_id, persona, target_track, current_level, weekly_coding_hours, primary_goal_type, preferred_planning_style, created_at, updated_at
    FROM app_developer_profiles
    WHERE user_id = ${userId}
    LIMIT 1;
  `) as DeveloperProfileRow[]

  return rows[0] ? mapDeveloperProfileRow(rows[0]) : null
}

export async function upsertDeveloperProfile(input: {
  userId: string
  persona: DeveloperPersona
  targetTrack: string
  currentLevel: DeveloperLevel
  weeklyCodingHours: number
  primaryGoalType: DeveloperGoalType
  preferredPlanningStyle: string
}): Promise<DeveloperProfile> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    INSERT INTO app_developer_profiles (
      user_id, persona, target_track, current_level, weekly_coding_hours, primary_goal_type, preferred_planning_style, updated_at
    )
    VALUES (
      ${input.userId}, ${input.persona}, ${input.targetTrack}, ${input.currentLevel}, ${input.weeklyCodingHours},
      ${input.primaryGoalType}, ${input.preferredPlanningStyle}, NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      persona = EXCLUDED.persona,
      target_track = EXCLUDED.target_track,
      current_level = EXCLUDED.current_level,
      weekly_coding_hours = EXCLUDED.weekly_coding_hours,
      primary_goal_type = EXCLUDED.primary_goal_type,
      preferred_planning_style = EXCLUDED.preferred_planning_style,
      updated_at = NOW()
    RETURNING user_id, persona, target_track, current_level, weekly_coding_hours, primary_goal_type, preferred_planning_style, created_at, updated_at;
  `) as DeveloperProfileRow[]

  await seedDeveloperSkills(input.userId, input.persona, input.primaryGoalType)

  return mapDeveloperProfileRow(rows[0])
}

async function seedDeveloperSkills(userId: string, persona: DeveloperPersona, primaryGoalType: DeveloperGoalType): Promise<void> {
  const skillNames =
    persona === "job_seeker"
      ? ["DSA", "System Design", "JavaScript", "SQL", "Communication"]
      : persona === "working_developer"
        ? ["Architecture", "Testing", "Debugging", "Code Review", "Delivery"]
        : ["Product Engineering", "Next.js", "TypeScript", "Databases", "Launch Systems"]

  const sql = getSqlClient()

  for (const [index, name] of skillNames.entries()) {
    await sql`
      INSERT INTO app_developer_skills (id, user_id, name, category, current_level, target_level, confidence, evidence_count, updated_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${name}, ${primaryGoalType}, ${Math.max(1, 2 - (index % 2))}, 4, ${45 + index * 7}, 0, NOW())
      ON CONFLICT (user_id, name) DO NOTHING;
    `
  }
}

export async function listDeveloperSkills(userId: string): Promise<DeveloperSkill[]> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, name, category, current_level, target_level, confidence, evidence_count, updated_at
    FROM app_developer_skills
    WHERE user_id = ${userId}
    ORDER BY category ASC, name ASC;
  `) as DeveloperSkillRow[]

  return rows.map(mapDeveloperSkillRow)
}

export async function listProjectsByUserId(userId: string): Promise<AppProject[]> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, goal_id, title, project_type, status, stack, repo_url, live_url, portfolio_readiness, created_at, updated_at
    FROM app_projects
    WHERE user_id = ${userId}
    ORDER BY
      CASE status WHEN 'building' THEN 0 WHEN 'idea' THEN 1 WHEN 'shipped' THEN 2 WHEN 'paused' THEN 3 ELSE 4 END,
      updated_at DESC;
  `) as ProjectRow[]

  return rows.map(mapProjectRow)
}

export async function createProject(input: {
  userId: string
  goalId?: string | null
  title: string
  projectType: DeveloperGoalType
  status: ProjectStatus
  stack: string
  repoUrl: string
  liveUrl: string
  portfolioReadiness: number
}): Promise<AppProject> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const projectId = crypto.randomUUID()
  const rows = (await sql`
    INSERT INTO app_projects (
      id, user_id, goal_id, title, project_type, status, stack, repo_url, live_url, portfolio_readiness, updated_at
    )
    VALUES (
      ${projectId}, ${input.userId}, ${input.goalId ?? null}, ${input.title}, ${input.projectType}, ${input.status},
      ${input.stack}, ${input.repoUrl}, ${input.liveUrl}, ${input.portfolioReadiness}, NOW()
    )
    RETURNING id, user_id, goal_id, title, project_type, status, stack, repo_url, live_url, portfolio_readiness, created_at, updated_at;
  `) as ProjectRow[]

  return mapProjectRow(rows[0])
}

export async function createCodingSession(input: {
  userId: string
  goalId?: string | null
  projectId?: string | null
  sessionType: CodingSessionType
  durationMinutes: number
  completedSummary: string
  blockers: string
  energyRating: number
  focusRating: number
  sessionDate: string
}): Promise<CodingSession> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    INSERT INTO app_coding_sessions (
      id, user_id, goal_id, project_id, session_type, duration_minutes, completed_summary, blockers,
      energy_rating, focus_rating, session_date
    )
    VALUES (
      ${crypto.randomUUID()}, ${input.userId}, ${input.goalId ?? null}, ${input.projectId ?? null}, ${input.sessionType},
      ${input.durationMinutes}, ${input.completedSummary}, ${input.blockers}, ${input.energyRating}, ${input.focusRating}, ${input.sessionDate}
    )
    RETURNING id, user_id, goal_id, project_id, session_type, duration_minutes, completed_summary, blockers, energy_rating, focus_rating, session_date, created_at;
  `) as CodingSessionRow[]

  return mapCodingSessionRow(rows[0])
}

export async function listCodingSessionsByUserId(userId: string, limit = 50): Promise<CodingSession[]> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, goal_id, project_id, session_type, duration_minutes, completed_summary, blockers, energy_rating, focus_rating, session_date, created_at
    FROM app_coding_sessions
    WHERE user_id = ${userId}
    ORDER BY session_date DESC, created_at DESC
    LIMIT ${limit};
  `) as CodingSessionRow[]

  return rows.map(mapCodingSessionRow)
}

export async function upsertWeeklyReview(input: {
  userId: string
  weekStart: string
  shippedSummary: string
  blockers: string
  skillMovement: string
  nextSprint: string
  highLeverageAction: string
  aiReviewText: string
  modelName: string
}): Promise<WeeklyReview> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    INSERT INTO app_weekly_reviews (
      id, user_id, week_start, shipped_summary, blockers, skill_movement, next_sprint, high_leverage_action, ai_review_text, model_name
    )
    VALUES (
      ${crypto.randomUUID()}, ${input.userId}, ${input.weekStart}, ${input.shippedSummary}, ${input.blockers}, ${input.skillMovement},
      ${input.nextSprint}, ${input.highLeverageAction}, ${input.aiReviewText}, ${input.modelName}
    )
    ON CONFLICT (user_id, week_start)
    DO UPDATE SET
      shipped_summary = EXCLUDED.shipped_summary,
      blockers = EXCLUDED.blockers,
      skill_movement = EXCLUDED.skill_movement,
      next_sprint = EXCLUDED.next_sprint,
      high_leverage_action = EXCLUDED.high_leverage_action,
      ai_review_text = EXCLUDED.ai_review_text,
      model_name = EXCLUDED.model_name
    RETURNING id, user_id, week_start, shipped_summary, blockers, skill_movement, next_sprint, high_leverage_action, ai_review_text, model_name, created_at;
  `) as WeeklyReviewRow[]

  return mapWeeklyReviewRow(rows[0])
}

export async function listWeeklyReviewsByUserId(userId: string, limit = 8): Promise<WeeklyReview[]> {
  await ensureDeveloperSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, week_start, shipped_summary, blockers, skill_movement, next_sprint, high_leverage_action, ai_review_text, model_name, created_at
    FROM app_weekly_reviews
    WHERE user_id = ${userId}
    ORDER BY week_start DESC
    LIMIT ${limit};
  `) as WeeklyReviewRow[]

  return rows.map(mapWeeklyReviewRow)
}

type ComparisonRow = {
  id: string
  user_id: string | null
  title: string
  category: ComparisonCategory
  status: ComparisonStatus
  context: string
  final_recommendation: string
  usage_mode: UsageMode
  created_at: string | Date
  updated_at: string | Date
}

type ComparisonOptionRow = {
  id: string
  comparison_id: string
  name: string
  description: string
  price: string
  source_url: string
  notes: string
  total_score: string | number
  created_at: string | Date
  updated_at: string | Date
}

type ComparisonCriterionRow = {
  id: string
  comparison_id: string
  name: string
  description: string
  weight: number
  category_relevance: string
  created_at: string | Date
  updated_at: string | Date
}

type OptionScoreRow = {
  id: string
  option_id: string
  criterion_id: string
  score: number
  reason: string
}

type ComparisonInsightRow = {
  id: string
  comparison_id: string
  option_id: string | null
  insight_type: InsightType
  title: string
  content: string
  severity: RiskSeverity
  created_at: string | Date
}

type ComparisonEvidenceRow = {
  id: string
  comparison_id: string
  file_name: string
  file_type: EvidenceType
  file_url: string
  file_key: string
  extracted_text: string
  evidence_summary: string
  created_at: string | Date
}

type ComparisonSourceRow = {
  id: string
  comparison_id: string
  url: string
  title: string
  snippet: string
  fetched_at: string | Date
  confidence: number
  claim_supported: string
}

function mapComparisonRow(row: ComparisonRow): Comparison {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    status: row.status,
    context: row.context,
    finalRecommendation: row.final_recommendation,
    usageMode: row.usage_mode,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapComparisonOptionRow(row: ComparisonOptionRow): ComparisonOption {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    name: row.name,
    description: row.description,
    price: row.price,
    sourceUrl: row.source_url,
    notes: row.notes,
    totalScore: Number(row.total_score) || 0,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapComparisonCriterionRow(row: ComparisonCriterionRow): ComparisonCriterion {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    name: row.name,
    description: row.description,
    weight: row.weight,
    categoryRelevance: row.category_relevance,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  }
}

function mapOptionScoreRow(row: OptionScoreRow): OptionScore {
  return {
    id: row.id,
    optionId: row.option_id,
    criterionId: row.criterion_id,
    score: row.score,
    reason: row.reason,
  }
}

function mapComparisonInsightRow(row: ComparisonInsightRow): ComparisonInsight {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    optionId: row.option_id,
    insightType: row.insight_type,
    title: row.title,
    content: row.content,
    severity: row.severity,
    createdAt: normalizeTimestamp(row.created_at),
  }
}

function mapComparisonEvidenceRow(row: ComparisonEvidenceRow): ComparisonEvidence {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileKey: row.file_key,
    extractedText: row.extracted_text,
    evidenceSummary: row.evidence_summary,
    createdAt: normalizeTimestamp(row.created_at),
  }
}

function mapComparisonSourceRow(row: ComparisonSourceRow): ComparisonSource {
  return {
    id: row.id,
    comparisonId: row.comparison_id,
    url: row.url,
    title: row.title,
    snippet: row.snippet,
    fetchedAt: normalizeTimestamp(row.fetched_at),
    confidence: row.confidence,
    claimSupported: row.claim_supported,
  }
}

export async function createComparison(input: {
  userId?: string | null
  title: string
  category: ComparisonCategory
  context: string
  usageMode?: UsageMode
}): Promise<Comparison> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    INSERT INTO comparisons (id, user_id, title, category, status, context, usage_mode, updated_at)
    VALUES (${crypto.randomUUID()}, ${input.userId ?? null}, ${input.title}, ${input.category}, 'draft', ${input.context}, ${input.usageMode ?? "free"}, NOW())
    RETURNING id, user_id, title, category, status, context, final_recommendation, usage_mode, created_at, updated_at;
  `) as ComparisonRow[]

  return mapComparisonRow(rows[0])
}

export async function getComparison(comparisonId: string): Promise<Comparison | null> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, title, category, status, context, final_recommendation, usage_mode, created_at, updated_at
    FROM comparisons
    WHERE id = ${comparisonId}
    LIMIT 1;
  `) as ComparisonRow[]

  if (!rows[0]) return null
  return mapComparisonRow(rows[0])
}

export async function listComparisonsByUserId(userId: string): Promise<Comparison[]> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const rows = (await sql`
    SELECT id, user_id, title, category, status, context, final_recommendation, usage_mode, created_at, updated_at
    FROM comparisons
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC;
  `) as ComparisonRow[]

  return rows.map(mapComparisonRow)
}

export async function getComparisonReportForUser(input: {
  comparisonId: string
  userId: string
}): Promise<ComparisonReport | null> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const comparisonRows = (await sql`
    SELECT id, user_id, title, category, status, context, final_recommendation, usage_mode, created_at, updated_at
    FROM comparisons
    WHERE id = ${input.comparisonId}
      AND user_id = ${input.userId}
    LIMIT 1;
  `) as ComparisonRow[]

  const comparison = comparisonRows[0]

  if (!comparison) return null

  const options = (await sql`
    SELECT id, comparison_id, name, description, price, source_url, notes, total_score, created_at, updated_at
    FROM comparison_options
    WHERE comparison_id = ${input.comparisonId}
    ORDER BY total_score DESC, created_at ASC;
  `) as ComparisonOptionRow[]

  const criteria = (await sql`
    SELECT id, comparison_id, name, description, weight, category_relevance, created_at, updated_at
    FROM comparison_criteria
    WHERE comparison_id = ${input.comparisonId}
    ORDER BY weight DESC, created_at ASC;
  `) as ComparisonCriterionRow[]

  const scores = (await sql`
    SELECT id, option_id, criterion_id, score, reason
    FROM option_scores
    WHERE option_id IN (SELECT id FROM comparison_options WHERE comparison_id = ${input.comparisonId});
  `) as OptionScoreRow[]

  const insights = (await sql`
    SELECT id, comparison_id, option_id, insight_type, title, content, severity, created_at
    FROM comparison_insights
    WHERE comparison_id = ${input.comparisonId}
    ORDER BY created_at ASC;
  `) as ComparisonInsightRow[]

  const evidence = (await sql`
    SELECT id, comparison_id, file_name, file_type, file_url, file_key, extracted_text, evidence_summary, created_at
    FROM comparison_evidence
    WHERE comparison_id = ${input.comparisonId}
    ORDER BY created_at DESC;
  `) as ComparisonEvidenceRow[]

  const sources = (await sql`
    SELECT id, comparison_id, url, title, snippet, fetched_at, confidence, claim_supported
    FROM comparison_sources
    WHERE comparison_id = ${input.comparisonId}
    ORDER BY fetched_at DESC;
  `) as ComparisonSourceRow[]

  return {
    comparison: mapComparisonRow(comparison),
    options: options.map(mapComparisonOptionRow),
    criteria: criteria.map(mapComparisonCriterionRow),
    scores: scores.map(mapOptionScoreRow),
    insights: insights.map(mapComparisonInsightRow),
    evidence: evidence.map(mapComparisonEvidenceRow),
    sources: sources.map(mapComparisonSourceRow),
  }
}

export async function addComparisonOption(input: {
  comparisonId: string
  userId: string
  name: string
  description: string
  price: string
  sourceUrl: string
  notes: string
}): Promise<ComparisonOption | null> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const owner = (await sql`
    SELECT id FROM comparisons WHERE id = ${input.comparisonId} AND user_id = ${input.userId} LIMIT 1;
  `) as Array<{ id: string }>

  if (!owner[0]) return null

  const rows = (await sql`
    INSERT INTO comparison_options (id, comparison_id, name, description, price, source_url, notes, updated_at)
    VALUES (${crypto.randomUUID()}, ${input.comparisonId}, ${input.name}, ${input.description}, ${input.price}, ${input.sourceUrl}, ${input.notes}, NOW())
    RETURNING id, comparison_id, name, description, price, source_url, notes, total_score, created_at, updated_at;
  `) as ComparisonOptionRow[]

  await sql`UPDATE comparisons SET updated_at = NOW() WHERE id = ${input.comparisonId};`

  return mapComparisonOptionRow(rows[0])
}

export async function addComparisonEvidence(input: {
  comparisonId: string
  userId: string
  fileName: string
  fileType: EvidenceType
  fileUrl: string
  fileKey: string
  extractedText: string
  evidenceSummary: string
}): Promise<ComparisonEvidence | null> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const owner = (await sql`
    SELECT id FROM comparisons WHERE id = ${input.comparisonId} AND user_id = ${input.userId} LIMIT 1;
  `) as Array<{ id: string }>

  if (!owner[0]) return null

  const rows = (await sql`
    INSERT INTO comparison_evidence (id, comparison_id, file_name, file_type, file_url, file_key, extracted_text, evidence_summary)
    VALUES (${crypto.randomUUID()}, ${input.comparisonId}, ${input.fileName}, ${input.fileType}, ${input.fileUrl}, ${input.fileKey}, ${input.extractedText}, ${input.evidenceSummary})
    RETURNING id, comparison_id, file_name, file_type, file_url, file_key, extracted_text, evidence_summary, created_at;
  `) as ComparisonEvidenceRow[]

  await sql`UPDATE comparisons SET updated_at = NOW() WHERE id = ${input.comparisonId};`

  return mapComparisonEvidenceRow(rows[0])
}

export async function replaceComparisonAnalysis(input: {
  comparisonId: string
  userId: string
  status: ComparisonStatus
  finalRecommendation: string
  criteria: Array<{ name: string; description: string; weight: number; categoryRelevance: string }>
  scores: Array<{ optionName: string; criterionName: string; score: number; reason: string }>
  insights: Array<{ optionName?: string; insightType: InsightType; title: string; content: string; severity: RiskSeverity }>
  sources: Array<{ url: string; title: string; snippet: string; confidence: number; claimSupported: string }>
}): Promise<boolean> {
  await ensureComparisonSchema()

  const sql = getSqlClient()
  const report = await getComparisonReportForUser({ comparisonId: input.comparisonId, userId: input.userId })

  if (!report) return false

  await sql`DELETE FROM option_scores WHERE option_id IN (SELECT id FROM comparison_options WHERE comparison_id = ${input.comparisonId});`
  await sql`DELETE FROM comparison_criteria WHERE comparison_id = ${input.comparisonId};`
  await sql`DELETE FROM comparison_insights WHERE comparison_id = ${input.comparisonId};`
  await sql`DELETE FROM comparison_sources WHERE comparison_id = ${input.comparisonId};`

  const criterionIds = new Map<string, string>()
  const optionIds = new Map(report.options.map((option) => [option.name.toLowerCase(), option.id]))

  for (const criterion of input.criteria) {
    const criterionId = crypto.randomUUID()
    criterionIds.set(criterion.name.toLowerCase(), criterionId)
    await sql`
      INSERT INTO comparison_criteria (id, comparison_id, name, description, weight, category_relevance, updated_at)
      VALUES (${criterionId}, ${input.comparisonId}, ${criterion.name}, ${criterion.description}, ${criterion.weight}, ${criterion.categoryRelevance}, NOW());
    `
  }

  for (const score of input.scores) {
    const optionId = optionIds.get(score.optionName.toLowerCase())
    const criterionId = criterionIds.get(score.criterionName.toLowerCase())
    if (!optionId || !criterionId) continue

    await sql`
      INSERT INTO option_scores (id, option_id, criterion_id, score, reason)
      VALUES (${crypto.randomUUID()}, ${optionId}, ${criterionId}, ${score.score}, ${score.reason})
      ON CONFLICT (option_id, criterion_id)
      DO UPDATE SET score = EXCLUDED.score, reason = EXCLUDED.reason;
    `
  }

  for (const option of report.options) {
    const scoreRows = input.scores.filter((score) => score.optionName.toLowerCase() === option.name.toLowerCase())
    const weightedTotal = input.criteria.reduce((total, criterion) => {
      const match = scoreRows.find((score) => score.criterionName.toLowerCase() === criterion.name.toLowerCase())
      return total + ((match?.score ?? 0) * criterion.weight) / 10
    }, 0)
    await sql`UPDATE comparison_options SET total_score = ${Math.round(weightedTotal * 10) / 10}, updated_at = NOW() WHERE id = ${option.id};`
  }

  for (const insight of input.insights) {
    const optionId = insight.optionName ? optionIds.get(insight.optionName.toLowerCase()) ?? null : null
    await sql`
      INSERT INTO comparison_insights (id, comparison_id, option_id, insight_type, title, content, severity)
      VALUES (${crypto.randomUUID()}, ${input.comparisonId}, ${optionId}, ${insight.insightType}, ${insight.title}, ${insight.content}, ${insight.severity});
    `
  }

  for (const source of input.sources) {
    if (!source.url) continue
    await sql`
      INSERT INTO comparison_sources (id, comparison_id, url, title, snippet, confidence, claim_supported)
      VALUES (${crypto.randomUUID()}, ${input.comparisonId}, ${source.url}, ${source.title}, ${source.snippet}, ${source.confidence}, ${source.claimSupported});
    `
  }

  await sql`
    UPDATE comparisons
    SET status = ${input.status}, final_recommendation = ${input.finalRecommendation}, updated_at = NOW()
    WHERE id = ${input.comparisonId}
      AND user_id = ${input.userId};
  `

  return true
}

export async function incrementUsageCounter(input: {
  userId: string
  comparisons?: number
  uploads?: number
  researchCalls?: number
}): Promise<void> {
  await ensureComparisonSchema()

  const month = new Date().toISOString().slice(0, 7)
  const sql = getSqlClient()

  await sql`
    INSERT INTO usage_counters (user_id, usage_month, comparisons_used, uploads_used, research_calls_used)
    VALUES (${input.userId}, ${month}, ${input.comparisons ?? 0}, ${input.uploads ?? 0}, ${input.researchCalls ?? 0})
    ON CONFLICT (user_id, usage_month)
    DO UPDATE SET
      comparisons_used = usage_counters.comparisons_used + ${input.comparisons ?? 0},
      uploads_used = usage_counters.uploads_used + ${input.uploads ?? 0},
      research_calls_used = usage_counters.research_calls_used + ${input.researchCalls ?? 0};
  `
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  await ensureAuthSchema()

  const sql = getSqlClient()
  const normalizedEmail = email.trim().toLowerCase()

  const rows = (await sql`
    SELECT id, name, email, password_hash, auth_provider, created_at, updated_at
    FROM app_users
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `) as Array<{
    id: string
    name: string
    email: string
    password_hash: string | null
    auth_provider: string
    created_at: string
    updated_at: string
  }>

  const user = rows[0]

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    authProvider: user.auth_provider,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export async function createUser(input: {
  id: string
  name: string
  email: string
  passwordHash: string
}): Promise<AppUser> {
  await ensureAuthSchema()

  const sql = getSqlClient()
  const normalizedEmail = input.email.trim().toLowerCase()

  const rows = (await sql`
    INSERT INTO app_users (id, name, email, password_hash, auth_provider, updated_at)
    VALUES (${input.id}, ${input.name}, ${normalizedEmail}, ${input.passwordHash}, 'credentials', NOW())
    RETURNING id, name, email, password_hash, auth_provider, created_at, updated_at;
  `) as Array<{
    id: string
    name: string
    email: string
    password_hash: string | null
    auth_provider: string
    created_at: string
    updated_at: string
  }>

  const user = rows[0]

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    authProvider: user.auth_provider,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export async function upsertOAuthUser(input: {
  email: string
  name?: string | null
  provider: "google"
}): Promise<AppUser> {
  await ensureAuthSchema()

  const sql = getSqlClient()
  const normalizedEmail = input.email.trim().toLowerCase()
  const fallbackName = normalizedEmail.split("@")[0] || "User"
  const safeName = (input.name ?? "").trim() || fallbackName

  const rows = (await sql`
    INSERT INTO app_users (id, name, email, password_hash, auth_provider, updated_at)
    VALUES (${crypto.randomUUID()}, ${safeName}, ${normalizedEmail}, NULL, ${input.provider}, NOW())
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      auth_provider = EXCLUDED.auth_provider,
      updated_at = NOW()
    RETURNING id, name, email, password_hash, auth_provider, created_at, updated_at;
  `) as Array<{
    id: string
    name: string
    email: string
    password_hash: string | null
    auth_provider: string
    created_at: string
    updated_at: string
  }>

  const user = rows[0]

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    authProvider: user.auth_provider,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

// ============================================
// RESEARCH SOURCES
// ============================================

export async function addResearchSource(input: {
  comparisonId: string
  url: string
  title: string
  snippet: string
  confidence?: number
  claimSupported?: string
}): Promise<ComparisonSource | null> {
  await ensureComparisonSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    INSERT INTO comparison_sources (id, comparison_id, url, title, snippet, confidence, claim_supported, fetched_at)
    VALUES (${crypto.randomUUID()}, ${input.comparisonId}, ${input.url}, ${input.title}, ${input.snippet}, ${input.confidence ?? 0.7}, ${input.claimSupported ?? ""}, NOW())
    RETURNING id, comparison_id, url, title, snippet, fetched_at, confidence, claim_supported;
  `) as Array<{
    id: string
    comparison_id: string
    url: string
    title: string
    snippet: string
    fetched_at: string
    confidence: number
    claim_supported: string
  }>

  if (rows.length === 0) return null

  const row = rows[0]

  return {
    id: row.id,
    comparisonId: row.comparison_id,
    url: row.url,
    title: row.title,
    snippet: row.snippet,
    fetchedAt: row.fetched_at,
    confidence: row.confidence,
    claimSupported: row.claim_supported,
  }
}

export async function getResearchSources(comparisonId: string): Promise<ComparisonSource[]> {
  await ensureComparisonSchema()

  const sql = getSqlClient()

  const rows = (await sql`
    SELECT id, comparison_id, url, title, snippet, fetched_at, confidence, claim_supported
    FROM comparison_sources
    WHERE comparison_id = ${comparisonId}
    ORDER BY fetched_at DESC;
  `) as Array<{
    id: string
    comparison_id: string
    url: string
    title: string
    snippet: string
    fetched_at: string
    confidence: number
    claim_supported: string
  }>

  return rows.map((row) => ({
    id: row.id,
    comparisonId: row.comparison_id,
    url: row.url,
    title: row.title,
    snippet: row.snippet,
    fetchedAt: row.fetched_at,
    confidence: row.confidence,
    claimSupported: row.claim_supported,
  }))
}
