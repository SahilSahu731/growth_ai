"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Download, Save } from "lucide-react"
import type {
  Comparison,
  ComparisonOption,
  ComparisonCriterion,
  OptionScore,
  ComparisonInsight,
} from "@/lib/db"

interface ComparisonWorkspaceProps {
  comparison: Comparison
  options: ComparisonOption[]
  criteria: ComparisonCriterion[]
  scores: OptionScore[]
  insights: ComparisonInsight[]
  onAddOption: (name: string) => void
  onAddCriterion: (name: string, weight: number) => void
  onSetScore: (optionId: string, criterionId: string, score: number) => void
  onUpdateWeight: (criterionId: string, weight: number) => void
}

export function ComparisonWorkspace({
  comparison,
  options,
  criteria,
  scores,
  insights,
  onAddOption,
  onAddCriterion,
  onSetScore,
  onUpdateWeight,
}: ComparisonWorkspaceProps) {
  const [newOptionName, setNewOptionName] = useState("")
  const [newCriterionName, setNewCriterionName] = useState("")
  const [weights, setWeights] = useState<Record<string, number>>(
    criteria.reduce((acc, c) => ({ ...acc, [c.id]: c.weight }), {})
  )

  // Calculate weighted scores for each option
  const calculateOptionScore = (optionId: string): number => {
    const optionScores = scores.filter((s) => s.optionId === optionId)
    if (optionScores.length === 0) return 0

    let totalWeighted = 0
    let totalWeight = 0

    for (const criterion of criteria) {
      const score = optionScores.find((s) => s.criterionId === criterion.id)
      const weight = weights[criterion.id] || criterion.weight || 0

      if (score) {
        totalWeighted += (score.score * weight) / 100
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? (totalWeighted / totalWeight) * 10 : 0
  }

  const hiddenCosts = insights.filter((i) => i.insightType === "hidden_cost")
  const risks = insights.filter((i) => i.insightType === "risk")
  const questions = insights.filter((i) => i.insightType === "question")
  const recommendation = insights.find((i) => i.insightType === "recommendation")

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{comparison.title}</h1>
          <p className="text-zinc-400 mt-1">{comparison.category} • {comparison.status}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2 bg-blue-500 hover:bg-blue-600">
            <Save className="size-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Left: Options Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-2 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{option.name}</p>
                      {option.price && <p className="text-xs text-zinc-500">{option.price}</p>}
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-bold">
                      {calculateOptionScore(option.id).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add option..."
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  className="border-white/10 bg-white/5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newOptionName.trim()) {
                      onAddOption(newOptionName)
                      setNewOptionName("")
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    if (newOptionName.trim()) {
                      onAddOption(newOptionName)
                      setNewOptionName("")
                    }
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Scoring Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comparison Matrix</CardTitle>
              <CardDescription className="text-xs">Drag sliders to adjust weights • Scores update instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-2 text-left font-semibold">Criterion</th>
                      {options.map((opt) => (
                        <th key={opt.id} className="px-3 py-2 text-center font-semibold text-xs min-w-16">
                          <span className="truncate">{opt.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-b border-white/5 hover:bg-white/3">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{criterion.name}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={weights[criterion.id] || 0}
                                onChange={(e) => {
                                  const newWeight = Number(e.target.value)
                                  setWeights((prev) => ({ ...prev, [criterion.id]: newWeight }))
                                  onUpdateWeight(criterion.id, newWeight)
                                }}
                                className="w-16 h-1 rounded cursor-pointer"
                              />
                              <span className="text-xs text-zinc-400 w-6 text-right">
                                {weights[criterion.id] || 0}%
                              </span>
                            </div>
                          </div>
                        </td>
                        {options.map((option) => {
                          const score = scores.find((s) => s.optionId === option.id && s.criterionId === criterion.id)
                          return (
                            <td key={option.id} className="px-3 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={score?.score || 0}
                                onChange={(e) => {
                                  const newScore = Math.min(10, Math.max(0, Number(e.target.value)))
                                  onSetScore(option.id, criterion.id, newScore)
                                }}
                                className="w-12 h-8 rounded border border-white/10 bg-white/5 text-center text-sm"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr className="bg-blue-500/10 border-t border-blue-500/50">
                      <td className="px-4 py-3 font-bold">TOTAL SCORE</td>
                      {options.map((option) => (
                        <td key={option.id} className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold">
                            {calculateOptionScore(option.id).toFixed(1)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Add criterion..."
                  value={newCriterionName}
                  onChange={(e) => setNewCriterionName(e.target.value)}
                  className="border-white/10 bg-white/5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCriterionName.trim()) {
                      onAddCriterion(newCriterionName, 10)
                      setNewCriterionName("")
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    if (newCriterionName.trim()) {
                      onAddCriterion(newCriterionName, 10)
                      setNewCriterionName("")
                    }
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Insights Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="recommendation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
              <TabsTrigger value="recommendation">Rec.</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendation" className="space-y-2">
              {recommendation && (
                <Card className="border-green-500/50 bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-300">Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-zinc-400">{recommendation.content}</CardContent>
                </Card>
              )}

              {hiddenCosts.length > 0 && (
                <Card className="border-orange-500/50 bg-orange-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-orange-300">Hidden Costs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {hiddenCosts.map((cost) => (
                      <div key={cost.id} className="text-xs">
                        <p className="font-medium text-orange-200">{cost.title}</p>
                        <p className="text-zinc-500">{cost.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="risks" className="space-y-2">
              {risks.length > 0 ? (
                risks.map((risk) => (
                  <Card key={risk.id} className="border-red-500/50 bg-red-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-300">{risk.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-zinc-400">{risk.content}</CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-xs text-zinc-500">No major risks identified.</p>
              )}
            </TabsContent>
          </Tabs>

          {questions.length > 0 && (
            <Card className="border-blue-500/50 bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-300">Questions to Ask</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {questions.slice(0, 3).map((q) => (
                  <p key={q.id} className="text-xs text-blue-200">• {q.content}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom: Report Preview */}
      <Card className="mt-6 border-white/10 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-lg">Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-300">Top Option</p>
              <p className="text-zinc-400">{options[0]?.name || "No options yet"}</p>
            </div>
            <div>
              <p className="font-semibold text-blue-300">Status</p>
              <p className="text-zinc-400 capitalize">{comparison.status}</p>
            </div>
          </div>
          <Button className="mt-4 w-full bg-blue-500 hover:bg-blue-600">
            Download Full Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
