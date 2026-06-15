"use client"

import { BEGINNER_TIPS } from "@/lib/worldcup/glossary"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import { Lightbulb } from "lucide-react"

export function BeginnerTipsPanel() {
  const { preferences } = useWorldCupPreferences()
  const tips =
    BEGINNER_TIPS[preferences.experienceLevel] ?? BEGINNER_TIPS.newcomer

  if (preferences.experienceLevel === "diehard") return null

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">
          {preferences.experienceLevel === "newcomer"
            ? "Quick tips for new fans"
            : "Worth knowing"}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tips.map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl border border-white/5 bg-white/5 p-4"
          >
            <h3 className="mb-1 text-sm font-semibold text-emerald-300">{tip.title}</h3>
            <p className="text-sm leading-relaxed text-white/60">{tip.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
