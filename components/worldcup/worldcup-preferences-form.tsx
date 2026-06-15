"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SAMPLE_TEAMS } from "@/lib/worldcup/teams"
import { EXPERIENCE_LEVELS } from "@/lib/worldcup/glossary"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import type { ExperienceLevel } from "@/types/worldcup-preferences"
import { Bell, Check, Heart, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
]

export function WorldCupPreferencesForm() {
  const {
    preferences,
    isAuthenticated,
    updatePreferences,
    toggleFollowTeam,
    setFavoriteTeam,
  } = useWorldCupPreferences()

  const [saved, setSaved] = useState(false)

  async function handleToggle(key: keyof typeof preferences, value: boolean) {
    await updatePreferences({ [key]: value })
    flashSaved()
  }

  async function handleExperience(level: ExperienceLevel) {
    await updatePreferences({
      experienceLevel: level,
      showTermTooltips: level === "newcomer",
    })
    flashSaved()
  }

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const favorite = SAMPLE_TEAMS.find((t) => t.code === preferences.favoriteTeamCode)

  return (
    <div className="space-y-8">
      {!isAuthenticated && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <LogIn className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-white">
              Preferences saved on this device
            </p>
            <p className="mt-1 text-sm text-white/60">
              <Link href="/auth/sign-up" className="text-emerald-400 hover:underline">
                Create a free account
              </Link>{" "}
              to sync your team and alerts everywhere.
            </p>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
          <Check className="h-4 w-4" />
          Saved
        </div>
      )}

      {/* Favorite team */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-bold text-white">Favorite team</h2>
        </div>
        {favorite && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-4">
            <span className="text-3xl">{favorite.flag}</span>
            <div>
              <p className="font-semibold text-white">{favorite.name}</p>
              <p className="text-sm text-white/50">{favorite.confederation}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {SAMPLE_TEAMS.map((team) => (
            <button
              key={team.code}
              onClick={() => {
                void setFavoriteTeam(team.code)
                flashSaved()
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors",
                preferences.favoriteTeamCode === team.code
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20"
              )}
              aria-label={`Set ${team.name} as favorite`}
            >
              <span className="text-xl">{team.flag}</span>
              <span className="text-[10px] font-medium text-white/70">{team.code}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Follow additional teams */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Also follow</h2>
        <p className="mb-4 text-sm text-white/50">
          Get their scores highlighted on the live page
        </p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEAMS.filter((t) => t.code !== preferences.favoriteTeamCode).map(
            (team) => {
              const followed = preferences.followedTeamCodes.includes(team.code)
              return (
                <button
                  key={team.code}
                  onClick={() => {
                    void toggleFollowTeam(team.code)
                    flashSaved()
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    followed
                      ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/20"
                  )}
                >
                  <span>{team.flag}</span>
                  {team.code}
                  {followed && <Check className="h-3 w-3 text-emerald-400" />}
                </button>
              )
            }
          )}
        </div>
      </section>

      {/* Experience level */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Your experience level</h2>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => handleExperience(level.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                preferences.experienceLevel === level.id
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <span className="text-xl">{level.emoji}</span>
              <div>
                <p className="font-medium text-white">{level.label}</p>
                <p className="text-sm text-white/50">{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Alerts</h2>
        </div>
        <p className="mb-4 text-sm text-white/50">
          In-app indicators for now — push notifications coming soon
        </p>
        <div className="space-y-4">
          {[
            {
              key: "notifyMatchStart" as const,
              label: "Match kickoffs",
              desc: "When your teams' games are about to start",
            },
            {
              key: "notifyGoals" as const,
              label: "Goals",
              desc: "When your team scores (or concedes)",
            },
            {
              key: "notifyFinalScores" as const,
              label: "Final scores",
              desc: "Full-time results for followed teams",
            },
            {
              key: "showTermTooltips" as const,
              label: "Explain soccer terms",
              desc: "Hover tips for HT, GD, xG, and other jargon",
            },
          ].map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 p-4 hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(e) => handleToggle(key, e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <p className="font-medium text-white">{label}</p>
                <p className="text-sm text-white/50">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Timezone */}
      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Timezone</h2>
        <select
          value={preferences.timezone}
          onChange={(e) => {
            void updatePreferences({ timezone: e.target.value })
            flashSaved()
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value} className="bg-[#0f1729]">
              {tz.label}
            </option>
          ))}
        </select>
      </section>

      <Button
        variant="outline"
        onClick={() => {
          void updatePreferences({ onboardingCompleted: false })
          window.location.reload()
        }}
        className="border-white/20 text-white/60 hover:bg-white/5"
      >
        Restart onboarding tour
      </Button>
    </div>
  )
}
