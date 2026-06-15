"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SAMPLE_TEAMS } from "@/lib/worldcup/teams"
import { EXPERIENCE_LEVELS } from "@/lib/worldcup/glossary"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import type { ExperienceLevel } from "@/types/worldcup-preferences"
import { ArrowRight, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
]

export function OnboardingWizard() {
  const { showOnboarding, isLoaded, completeOnboarding, dismissOnboarding } =
    useWorldCupPreferences()
  const [step, setStep] = useState(0)
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("newcomer")
  const [favoriteTeam, setFavoriteTeam] = useState("USA")
  const [timezone, setTimezone] = useState("America/New_York")
  const [isSaving, setIsSaving] = useState(false)

  if (!isLoaded || !showOnboarding) return null

  const steps = [
    {
      title: "Welcome to the World Cup",
      subtitle: "2026 is the biggest tournament ever — 48 teams, 104 matches. We'll tailor the app to you.",
    },
    {
      title: "How familiar are you with soccer?",
      subtitle: "No wrong answers. We'll adjust tips and jargon to match.",
    },
    {
      title: "Pick your team",
      subtitle: "We'll highlight their matches, standings, and stories on your home screen.",
    },
  ]

  async function handleFinish() {
    setIsSaving(true)
    await completeOnboarding({
      experienceLevel,
      favoriteTeamCode: favoriteTeam,
      followedTeamCodes: [favoriteTeam],
      timezone,
      showTermTooltips: experienceLevel === "newcomer",
    })
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729] shadow-2xl"
      >
        <button
          onClick={dismissOnboarding}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
          aria-label="Skip onboarding"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-white/10 bg-gradient-to-r from-emerald-900/30 to-transparent px-6 py-5">
          <div className="mb-3 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-emerald-500" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <Sparkles className="mb-2 h-5 w-5 text-emerald-400" />
          <h2 id="onboarding-title" className="text-xl font-bold text-white">
            {steps[step].title}
          </h2>
          <p className="mt-1 text-sm text-white/60">{steps[step].subtitle}</p>
        </div>

        <div className="px-6 py-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { n: "48", l: "teams" },
                  { n: "12", l: "groups" },
                  { n: "32", l: "in Round of 32" },
                ].map((item) => (
                  <div key={item.l} className="rounded-xl bg-white/5 p-3">
                    <div className="text-2xl font-black text-emerald-400">{item.n}</div>
                    <div className="text-xs text-white/50">{item.l}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                This is a new format — even longtime fans are learning. We&apos;ll explain terms,
                highlight your team, and keep stories short and clear.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setExperienceLevel(level.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    experienceLevel === level.id
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {level.emoji}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{level.label}</div>
                    <div className="text-sm text-white/60">{level.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {SAMPLE_TEAMS.map((team) => (
                  <button
                    key={team.code}
                    onClick={() => setFavoriteTeam(team.code)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                      favoriteTeam === team.code
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <span className="text-2xl">{team.flag}</span>
                    <span className="text-xs font-medium text-white/80">{team.code}</span>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="timezone" className="mb-2 block text-sm font-medium text-white/70">
                  Your timezone (for kickoff times)
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-[#0f1729]">
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="text-white/60 hover:text-white"
            >
              Back
            </Button>
          ) : (
            <button
              onClick={dismissOnboarding}
              className="text-sm text-white/40 hover:text-white/70"
            >
              Skip for now
            </button>
          )}

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSaving}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? "Saving…" : "Let's go"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="border-t border-white/5 px-6 py-3 text-center text-xs text-white/30">
          <Link href="/auth/sign-up" className="text-emerald-400 hover:underline">
            Sign up
          </Link>{" "}
          to sync preferences across devices
        </p>
      </div>
    </div>
  )
}
