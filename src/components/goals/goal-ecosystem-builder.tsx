"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  createEmptyGoalEcosystemAnswers,
  GOAL_ECOSYSTEM_QUESTIONS,
  type GoalEcosystemAnswers,
} from "@/lib/ai/goal-ecosystem-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type GoalEcosystemBuilderProps = {
  goalId: string
  hasRoadmap: boolean
  onCompleted?: () => void
}

export function GoalEcosystemBuilder({ goalId, hasRoadmap, onCompleted }: GoalEcosystemBuilderProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<GoalEcosystemAnswers>(() => createEmptyGoalEcosystemAnswers())
  const [stepIndex, setStepIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const currentQuestion = GOAL_ECOSYSTEM_QUESTIONS[stepIndex]
  const currentAnswer = answers[currentQuestion.id]
  const isLastQuestion = stepIndex === GOAL_ECOSYSTEM_QUESTIONS.length - 1
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / GOAL_ECOSYSTEM_QUESTIONS.length) * 100),
    [stepIndex]
  )

  function updateOption(optionId: string) {
    setError(null)
    setSuccess(null)

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        optionId,
        customText: optionId === "something_else" ? prev[currentQuestion.id]?.customText ?? "" : "",
      },
    }))
  }

  function updateCustomText(value: string) {
    setError(null)
    setSuccess(null)

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        customText: value,
      },
    }))
  }

  function validateCurrentStep(): boolean {
    if (!currentAnswer.optionId) {
      setError("Please choose one option to continue.")
      return false
    }

    if (currentAnswer.optionId === "something_else") {
      const text = currentAnswer.customText?.trim() ?? ""

      if (text.length < 3) {
        setError("Add a short note for Something else.")
        return false
      }
    }

    return true
  }

  function handleBack() {
    setError(null)
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  async function handleNext() {
    if (!validateCurrentStep()) {
      return
    }

    setError(null)

    if (!isLastQuestion) {
      setStepIndex((prev) => prev + 1)
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(`/api/goals/${goalId}/ecosystem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answers),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            ecosystemReady?: boolean
            error?: string
          }
        | null

      if (!response.ok || !payload?.ecosystemReady) {
        throw new Error(payload?.error ?? "Could not build ecosystem right now.")
      }

      if (onCompleted) {
        onCompleted()
      } else {
        setSuccess("Ecosystem is ready. Phases, milestones, and checklists are now generated.")
      }

      router.refresh()
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Could not build ecosystem right now."
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-(--landing-muted)">
          <span>
            Setup step {stepIndex + 1} of {GOAL_ECOSYSTEM_QUESTIONS.length}
          </span>
          <span>{progress}%</span>
        </div>

        <Progress
          value={progress}
          className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-(--landing-ink)">{currentQuestion.question}</p>
        <p className="text-xs text-(--landing-muted)">{currentQuestion.helper}</p>
      </div>

      <div className="grid gap-2">
        {currentQuestion.options.map((option) => {
          const isSelected = currentAnswer.optionId === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => updateOption(option.id)}
              className={
                isSelected
                  ? "w-full rounded-xl border border-(--landing-accent) bg-(--landing-accent-soft) px-3 py-2 text-left text-sm text-(--landing-ink)"
                  : "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-sm text-(--landing-ink) hover:border-(--landing-accent)"
              }
              disabled={isGenerating}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {currentAnswer.optionId === "something_else" ? (
        <div className="space-y-2">
          <p className="text-xs text-(--landing-muted)">Optional details (quick note)</p>
          <Input
            value={currentAnswer.customText ?? ""}
            onChange={(event) => updateCustomText(event.target.value)}
            placeholder="Type your custom preference"
            className="h-10 rounded-xl border-black/15 bg-white px-3 text-sm"
            disabled={isGenerating}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full border-black/15 bg-white px-4 text-sm"
          onClick={handleBack}
          disabled={stepIndex === 0 || isGenerating}
        >
          Back
        </Button>

        <Button
          type="button"
          className="h-10 rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)"
          onClick={() => {
            void handleNext()
          }}
          disabled={isGenerating}
        >
          {isLastQuestion
            ? isGenerating
              ? "Building ecosystem..."
              : hasRoadmap
                ? "Rebuild ecosystem"
                : "Build ecosystem"
            : "Next"}
        </Button>
      </div>
    </div>
  )
}
