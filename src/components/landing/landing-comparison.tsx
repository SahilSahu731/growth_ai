"use client"

import { Button } from "@/components/ui/button"
import { Session } from "next-auth"
import Link from "next/link"

export function LandingComparison({ session }: { session: Session | null }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
      <div className="text-center mb-16">
        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-widest">
          See it in Action
        </p>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Your comparison in 60 seconds</h2>
      </div>

      {/* Demo comparison table */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-left font-semibold text-white">Criteria</th>
                <th className="px-6 py-4 text-center font-semibold text-white">
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Option A</span>
                    <span className="text-xs font-normal text-zinc-500">(Weight: 40%)</span>
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold text-white">
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xs bg-cyan-500 text-white px-2 py-1 rounded">Option B</span>
                    <span className="text-xs font-normal text-zinc-500">(Weight: 30%)</span>
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-semibold text-white">
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Option C</span>
                    <span className="text-xs font-normal text-zinc-500">(Weight: 30%)</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Price", a: "8/10", b: "6/10", c: "9/10" },
                { name: "Performance", a: "9/10", b: "9/10", c: "7/10" },
                { name: "Battery Life", a: "8/10", b: "10/10", c: "7/10" },
                { name: "Support", a: "7/10", b: "8/10", c: "9/10" },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                  <td className="px-6 py-4 text-center text-blue-300">{row.a}</td>
                  <td className="px-6 py-4 text-center text-cyan-300">{row.b}</td>
                  <td className="px-6 py-4 text-center text-purple-300">{row.c}</td>
                </tr>
              ))}
              <tr className="bg-white/5 font-bold">
                <td className="px-6 py-4 text-white">Final Score</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300">
                    7.9
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300">
                    8.4
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 font-bold">
                    8.2
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Demo insights footer */}
        <div className="grid md:grid-cols-3 gap-4 border-t border-white/10 p-6 bg-white/[0.02]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">💰 Hidden Costs Not Included</p>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• AppleCare: +$4.99/mo</li>
              <li>• Setup fees: +$50</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">⚠️ Key Risks</p>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• Battery degradation (Year 2)</li>
              <li>• Warranty void if repaired</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">🎯 AI Recommendation</p>
            <p className="text-sm text-cyan-300 font-semibold">Option B: Best overall value with excellent support</p>
          </div>
        </div>
      </div>

      {/* CTA to create comparison */}
      <div className="mt-12 text-center">
        <p className="text-zinc-400 mb-6">
          Ready to make a smarter decision? Start your first comparison now.
        </p>
        <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-500/30 font-semibold px-8">
          <Link href={session?.user ? "/compare/new" : "/signup"}>
            Create comparison
          </Link>
        </Button>
      </div>
    </section>
  )
}
