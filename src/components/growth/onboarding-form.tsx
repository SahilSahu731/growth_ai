"use client"

import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react"

import { completeOnboardingAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const lifeAreas = [
  ["health", "Health", "Energy, movement, and your body"],
  ["career", "Career", "Work that feels useful and sustainable"],
  ["relationships", "Relationships", "Connection, presence, and boundaries"],
  ["learning", "Learning", "Curiosity, skills, and understanding"],
  ["finances", "Finances", "Calmer and more intentional choices"],
  ["creativity", "Creativity", "Making, expressing, and experimenting"],
  ["wellbeing", "Wellbeing", "Rest, emotional space, and balance"],
  ["personal", "Something personal", "A direction only you can name"],
] as const

const steps = [
  { label: "Choose a focus", detail: "Begin with one part of life." },
  { label: "Describe the change", detail: "Say what better means to you." },
  { label: "Pick a next step", detail: "Make starting feel possible." },
  { label: "Set your support", detail: "Choose how GrowthAI shows up." },
] as const

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function GrowthOnboardingForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [state, action, pending] = useActionState(completeOnboardingAction, {} as GrowthActionState)
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", [])

  useEffect(() => {
    if (!state.projectId) return
    router.replace("/dashboard")
    router.refresh()
  }, [router, state.projectId])

  function goForward() {
    const panel = formRef.current?.querySelector<HTMLElement>(`[data-onboarding-step="${step}"]`)
    const requiredFields = Array.from(
      panel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[required]") ?? []
    )
    const invalid = requiredFields.find((field) => !field.checkValidity())

    if (invalid) {
      invalid.reportValidity()
      invalid.focus()
      return
    }

    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  function preventIncompleteSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < steps.length - 1) {
      event.preventDefault()
      goForward()
    }
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="h-[min(680px,calc(100dvh-1.5rem))] w-[min(720px,calc(100vw-1.5rem))] max-w-none gap-0 overflow-hidden rounded-2xl border border-white/[.12] bg-[#212121] p-0 text-white shadow-[0_24px_90px_rgba(0,0,0,.7)] ring-0 sm:max-w-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Set up your GrowthAI space</DialogTitle>
          <DialogDescription>Four short steps to personalize your first growth intention.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} onSubmit={preventIncompleteSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="timezone" value={timezone} />
          <input type="hidden" name="checkInMinute" value="0" />

          <header className="border-b border-white/[.09] px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between gap-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground">
                  G
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Set up your space</p>
                  <p className="mt-0.5 truncate text-[11px] text-white/45">{steps[step].label}</p>
                </div>
              </div>
              <p className="shrink-0 text-xs font-medium tabular-nums text-white/45">
                {step + 1} <span className="text-white/20">/</span> {steps.length}
              </p>
            </div>
            <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-white/[.08]">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </header>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-10 sm:py-9">
            <section data-onboarding-step="0" className={step === 0 ? "animate-in fade-in duration-200" : "hidden"}>
              <StepHeading title="Where would you like to grow?" description={steps[0].detail} />
              <fieldset className="mt-8">
                <legend className="sr-only">Choose a part of life</legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {lifeAreas.map(([value, label, description]) => (
                    <label
                      key={value}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[.09] bg-white/[.035] px-4 py-3.5 transition-colors hover:bg-white/[.07] has-checked:border-primary/65 has-checked:bg-primary/[.10]"
                    >
                      <input
                        type="radio"
                        name="lifeArea"
                        value={value}
                        defaultChecked={value === "wellbeing"}
                        required
                        className="sr-only"
                      />
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/20 transition group-has-checked:border-primary group-has-checked:bg-primary">
                        <Check className="size-3 text-primary-foreground opacity-0 group-has-checked:opacity-100" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">{label}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-white/40">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <section data-onboarding-step="1" className={step === 1 ? "animate-in fade-in duration-200" : "hidden"}>
              <StepHeading title="What would feel different?" description={steps[1].detail} />
              <div className="mt-8 space-y-5">
                <Field label="Name this intention" htmlFor="name">
                  <Input
                    id="name"
                    name="name"
                    placeholder="Feel at home in my body again"
                    minLength={3}
                    maxLength={80}
                    required
                    className="onboarding-input"
                  />
                </Field>
                <Field label="What would meaningful growth look like?" htmlFor="description">
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the change in your own words. Leave room for real life—not perfection."
                    minLength={12}
                    maxLength={600}
                    required
                    className="onboarding-textarea"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Why does this matter now?" htmlFor="whyItMatters">
                    <Textarea
                      id="whyItMatters"
                      name="whyItMatters"
                      placeholder="The honest reason this matters."
                      minLength={8}
                      maxLength={500}
                      required
                      className="onboarding-textarea min-h-24"
                    />
                  </Field>
                  <Field label="How will you notice progress?" htmlFor="definitionOfShipped">
                    <Textarea
                      id="definitionOfShipped"
                      name="definitionOfShipped"
                      placeholder="What will be different in real life?"
                      minLength={8}
                      maxLength={300}
                      required
                      className="onboarding-textarea min-h-24"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section data-onboarding-step="2" className={step === 2 ? "animate-in fade-in duration-200" : "hidden"}>
              <StepHeading title="What can you actually do next?" description={steps[2].detail} />
              <div className="mt-8 space-y-5">
                <Field label="Smallest meaningful next step" htmlFor="currentNextAction">
                  <Input
                    id="currentNextAction"
                    name="currentNextAction"
                    placeholder="Take a 20-minute walk before lunch"
                    minLength={4}
                    maxLength={240}
                    required
                    className="onboarding-input"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Reflection date" htmlFor="targetShipDate" hint="A checkpoint, not a deadline">
                    <Input
                      id="targetShipDate"
                      name="targetShipDate"
                      type="date"
                      min={futureDate(1)}
                      defaultValue={futureDate(30)}
                      required
                      className="onboarding-input"
                    />
                  </Field>
                  <Field label="When will you begin?" htmlFor="nextActionDueAt" hint="Optional">
                    <Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" className="onboarding-input" />
                  </Field>
                </div>
                <div className="flex gap-3 rounded-xl bg-primary/[.09] p-4 text-primary">
                  <Sparkles className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs leading-5">
                    Make it specific and forgiving. A useful step should still feel possible on an ordinary day.
                  </p>
                </div>
              </div>
            </section>

            <section data-onboarding-step="3" className={step === 3 ? "animate-in fade-in duration-200" : "hidden"}>
              <StepHeading title="How should we support you?" description={steps[3].detail} />
              <div className="mt-8 space-y-6">
                <fieldset>
                  <legend className="mb-3 text-xs font-semibold text-white/65">Conversation style</legend>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {[
                      ["supportive", "Supportive", "Warm and gentle"],
                      ["balanced", "Balanced", "Clear and kind"],
                      ["blunt", "Direct", "Straightforward"],
                    ].map(([value, title, description]) => (
                      <label
                        key={value}
                        className="cursor-pointer rounded-xl border border-white/[.09] bg-white/[.035] p-4 transition-colors hover:bg-white/[.07] has-checked:border-primary/65 has-checked:bg-primary/[.10]"
                      >
                        <input
                          type="radio"
                          name="coachTone"
                          value={value}
                          defaultChecked={value === "balanced"}
                          required
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-white">{title}</span>
                        <span className="mt-1 block text-[11px] text-white/40">{description}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Reflection rhythm" htmlFor="checkInCadence">
                    <select id="checkInCadence" name="checkInCadence" defaultValue="daily" required className="onboarding-select">
                      <option value="daily">Every day</option>
                      <option value="every_other_day">Every other day</option>
                    </select>
                  </Field>
                  <Field label="A good local time" htmlFor="checkInHour">
                    <select id="checkInHour" name="checkInHour" defaultValue="20" required className="onboarding-select">
                      <option value="7">7:00 AM · Morning</option>
                      <option value="12">12:00 PM · Midday</option>
                      <option value="18">6:00 PM · Evening</option>
                      <option value="20">8:00 PM · Evening</option>
                      <option value="21">9:00 PM · Night</option>
                    </select>
                  </Field>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[.09] bg-white/[.035] p-4 transition-colors hover:bg-white/[.07] has-checked:border-primary/50 has-checked:bg-primary/[.08]">
                  <input name="emailNotifications" type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[#72e7ff]" />
                  <span>
                    <span className="block text-sm font-semibold text-white">Gentle email prompts</span>
                    <span className="mt-1 block text-[11px] leading-5 text-white/40">A quiet reminder at your chosen rhythm. No motivational spam.</span>
                  </span>
                </label>
              </div>
            </section>

            {state.error ? (
              <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-200">
                {state.error}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-white/[.09] px-5 py-4 sm:px-8">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || pending}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="h-11 rounded-xl px-4 text-sm font-medium text-white/55 hover:bg-white/[.06] hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                key="next"
                type="button"
                onClick={goForward}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_rgba(114,231,255,.16)] hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                key="submit"
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_28px_rgba(114,231,255,.16)] hover:bg-primary/90"
              >
                {pending ? "Creating your space…" : "Finish setup"}
                <Sparkles className="size-4" />
              </Button>
            )}
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="max-w-2xl text-[clamp(2.15rem,6vw,3.35rem)] font-semibold leading-[1.02] tracking-[-.045em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-xs font-semibold text-white/65">
          {label}
        </Label>
        {hint ? <span className="text-[10px] text-white/30">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
