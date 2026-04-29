"use client"

export function LandingCTA() {
  const steps = [
    {
      number: 1,
      title: "Describe what you're comparing",
      description: "Tell us what decision you're facing—a laptop, job offer, apartment, loan, course, anything.",
    },
    {
      number: 2,
      title: "AI asks smart follow-up questions",
      description: "We find gaps in your thinking. Budget constraints? Timeline? Must-haves? We ask once, learn everything.",
    },
    {
      number: 3,
      title: "Add your options",
      description: "Type them manually, paste URLs for auto-research, or upload files and screenshots. We parse everything.",
    },
    {
      number: 4,
      title: "AI generates criteria and scores",
      description: "Category-specific scoring starts instantly. Apartments: rent, commute, safety. Job offers: salary, growth, culture.",
    },
    {
      number: 5,
      title: "Adjust weights, see new results",
      description: "Drag sliders to show what matters most. Scores update live. Find hidden costs and risks as you go.",
    },
    {
      number: 6,
      title: "Get your decision report",
      description: "Top recommendation, ranked options, risks, questions to ask sellers/employers, negotiation drafts, all in one report.",
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-widest">
          How It Works
        </p>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">From confusion to confidence in 6 steps</h2>
      </div>

      {/* Steps grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div key={step.number} className="relative">
            {/* Connector line for desktop */}
            {step.number < steps.length && (
              <div className="hidden lg:block absolute right-0 top-12 w-16 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
            )}

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 hover:border-blue-500/50 transition-all duration-300">
              {/* Step number badge */}
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold mb-4">
                {step.number}
              </div>

              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-6">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Social proof / Success metrics */}
      <div className="mt-24 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-12 text-center">
        <h3 className="text-2xl font-bold text-white mb-12">Join people making better decisions</h3>

        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              10K+
            </p>
            <p className="text-zinc-400 mt-2">Comparisons created</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              $2M+
            </p>
            <p className="text-zinc-400 mt-2">Better decisions made</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              98%
            </p>
            <p className="text-zinc-400 mt-2">Would recommend</p>
          </div>
        </div>
      </div>
    </section>
  )
}
