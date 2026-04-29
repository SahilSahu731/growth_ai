"use client"

import { useMemo, useState } from "react"

import { AI_GOAL_QUESTIONS, type AiGoalAnswers, type AiGoalQuestionId } from "@/lib/ai/goal-architect"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

type AiGoalArchitectFormProps = {
  onSuccess: (goalId: string) => void
}

function createInitialAnswers(): AiGoalAnswers {
  return AI_GOAL_QUESTIONS.reduce((acc, item) => {
    acc[item.id] = ""
    return acc
  }, {} as Record<AiGoalQuestionId, string>)
}

export function AiGoalArchitectForm({ onSuccess }: AiGoalArchitectFormProps) {
  const [answers, setAnswers] = useState<AiGoalAnswers>(() => createInitialAnswers())
  const [stepIndex, setStepIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = AI_GOAL_QUESTIONS[stepIndex]
  const isLastQuestion = stepIndex === AI_GOAL_QUESTIONS.length - 1
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / AI_GOAL_QUESTIONS.length) * 100),
    [stepIndex]
  )

  function updateAnswer(value: string) {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  function goBack() {
    setError(null)
    setStepIndex((prev) => Math.max(0, prev - 1))
  }

  async function handleNext() {
    const value = answers[currentQuestion.id].trim()

    if (value.length < 6) {
      setError("Please add a little more detail before continuing.")
      return
    }

    setError(null)

    if (!isLastQuestion) {
      setStepIndex((prev) => prev + 1)
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/goal-architect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answers),
      })

      const payload = (await response.json().catch(() => null)) as { goalId?: string; error?: string } | null

      if (!response.ok || !payload?.goalId) {
        throw new Error(payload?.error ?? "AI generation failed. Please try again.")
      }

      onSuccess(payload.goalId)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "AI generation failed. Please try again."
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
            Question {stepIndex + 1} of {AI_GOAL_QUESTIONS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-(--landing-ink)">{currentQuestion.question}</p>
        <p className="text-xs text-(--landing-muted)">{currentQuestion.helper}</p>
      </div>

      <Textarea
        value={answers[currentQuestion.id]}
        onChange={(event) => updateAnswer(event.target.value)}
        placeholder={currentQuestion.placeholder}
        className="min-h-28 rounded-xl border-black/15 bg-white px-3 py-2 text-sm"
        disabled={isGenerating}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full border-black/15 bg-white px-4 text-sm"
          onClick={goBack}
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
          {isLastQuestion ? (isGenerating ? "Generating roadmap..." : "Generate AI roadmap") : "Next question"}
        </Button>
      </div>
    </div>
  )
}
