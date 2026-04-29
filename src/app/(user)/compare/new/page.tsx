"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createComparisonAction } from "@/app/(user)/compare/actions"
import type { ComparisonCategory } from "@/lib/db"
import { ArrowRight, Home } from "lucide-react"

const categories: { value: ComparisonCategory; label: string; icon: string; description: string }[] = [
  { value: "product", label: "Products", icon: "📦", description: "Gadgets, phones, laptops, cameras" },
  { value: "finance", label: "Finance", icon: "💰", description: "Loans, cards, investments, insurance" },
  { value: "housing", label: "Housing", icon: "🏠", description: "Apartments, homes, locations" },
  { value: "career", label: "Career", icon: "💼", description: "Job offers, roles, companies" },
  { value: "education", label: "Education", icon: "🎓", description: "Schools, courses, programs" },
  { value: "software", label: "Software", icon: "⚙️", description: "Apps, tools, platforms" },
  { value: "travel", label: "Travel", icon: "✈️", description: "Destinations, routes, plans" },
  { value: "healthcare", label: "Healthcare", icon: "⚕️", description: "Treatments, providers, plans" },
  { value: "services", label: "Services", icon: "🔧", description: "Contractors, providers, vendors" },
  { value: "custom", label: "Custom", icon: "🎯", description: "Anything else" },
]

export default function NewComparisonPage() {
  const router = useRouter()
  const [context, setContext] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ComparisonCategory>("product")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!context.trim()) {
      setError("Please enter what you're comparing")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.set("context", context.trim())
      formData.set("category", selectedCategory)
      
      await createComparisonAction(formData)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-blue-950/5 to-zinc-950 text-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-4xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover:text-blue-300 transition-colors">
            <Home className="size-5" />
            <span className="text-sm font-semibold">Home</span>
          </Link>
          <h1 className="text-lg font-bold">New Comparison</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-4xl px-4 py-12 space-y-8">
        <form onSubmit={handleCreate} className="space-y-8">
          {/* Step 1: Enter title */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>What are you comparing?</CardTitle>
              <CardDescription>Be specific. Example: "Gaming laptops under $1,500"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="e.g., iPhone 16 vs Samsung Galaxy S25"
                value={context}
                onChange={(e) => {
                  setContext(e.target.value)
                  setError("")
                }}
                className="border-white/10 bg-white/5 text-lg"
              />
            </CardContent>
          </Card>

          {/* Step 2: Select category */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>What category?</CardTitle>
              <CardDescription>This helps AI generate the right criteria and questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`rounded-lg border-2 p-3 text-center transition-all ${
                      selectedCategory === cat.value
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <p className="text-xs font-semibold">{cat.label}</p>
                    <p className="text-xs text-zinc-500 mt-1">{cat.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* CTA Button */}
          <div className="flex gap-4">
            <Button asChild variant="outline" className="border-white/20">
              <Link href="/">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={!context.trim() || isLoading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-500/30 font-semibold gap-2"
            >
              {isLoading ? "Creating..." : "Start Comparing"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>

        {/* Helpful text */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-400">
          <p>🎯 Next: Add your options, generate criteria, and compare side-by-side.</p>
          <p className="mt-2 text-xs text-zinc-500">No signup required to start. Save and export your comparison by signing up.</p>
        </div>
      </div>
    </main>
  )
}
