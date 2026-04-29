"use client"

export function LandingFeatures() {
  const features = [
    {
      icon: "📊",
      title: "Weighted Scoring",
      description: "Assign importance to each criterion. See exactly why one option wins with transparent calculations you can adjust anytime.",
    },
    {
      icon: "💰",
      title: "Hidden Cost Detector",
      description: "Uncover taxes, fees, lock-in costs, maintenance, commute, cancellation penalties, and other gotchas you'd miss.",
    },
    {
      icon: "🔍",
      title: "Live Web Research",
      description: "Instant access to current data. Sources are attached to every research finding so you know where insights come from.",
    },
    {
      icon: "❓",
      title: "Smart Questions",
      description: "Get a list of must-ask questions for sellers, landlords, employers, or providers based on what you're comparing.",
    },
    {
      icon: "📋",
      title: "Negotiation Helper",
      description: "Generate polite and firm message templates to negotiate better terms or prices based on your comparison.",
    },
    {
      icon: "📈",
      title: "Decision Reports",
      description: "Export a beautiful PDF report with your comparison, recommendation, risks, and research findings. Share or archive.",
    },
    {
      icon: "📤",
      title: "File Uploads",
      description: "Upload receipts, quotes, job letters, or screenshots. AI extracts text and uses evidence in your comparison.",
    },
    {
      icon: "💡",
      title: "Smart Recommendations",
      description: "AI considers your priorities and hidden factors to recommend the best choice, not the most obvious one.",
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-widest">
          Core Features
        </p>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Everything you need to choose right</h2>
        <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
          Beyond simple comparisons. We dig into hidden costs, risks, research, and give you the questions to ask.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm text-zinc-400 leading-6">{feature.description}</p>

            {/* Subtle hover accent */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/5 via-transparent to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </div>
        ))}
      </div>
    </section>
  )
}
