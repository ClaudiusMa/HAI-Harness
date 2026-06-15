"use client"

import { useEffect, useState } from "react"
import {
  DEMO_LEADERBOARD,
  FAN_PICK_QUESTIONS,
  FAN_STAKES_RULES,
} from "@/lib/worldcup/fan-picks"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Lock, Trophy, Users } from "lucide-react"

const STORAGE_KEY = "serif-fan-picks"

function loadPicks(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function savePicks(picks: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
}

export function FanStakesBoard() {
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setPicks(loadPicks())
    setIsLoaded(true)
  }, [])

  function selectPick(questionId: string, optionId: string) {
    const next = { ...picks, [questionId]: optionId }
    setPicks(next)
    savePicks(next)
  }

  const lockedCount = Object.keys(picks).length
  const totalQuestions = FAN_PICK_QUESTIONS.length

  if (!isLoaded) return null

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
          <p className="text-sm leading-relaxed text-white/70">
            <strong className="text-amber-300">Fan Stakes</strong> is a social prediction pool —
            no real money, all reputation. Lock your picks before kickoff and climb the leaderboard
            with friends. (Real-money betting requires licensed partners — this is the fan-only
            version.)
          </p>
        </div>

        {FAN_PICK_QUESTIONS.map((question) => {
          const selected = picks[question.id]
          const isClosed = new Date(question.closesAt) < new Date()

          return (
            <div
              key={question.id}
              className="rounded-2xl border border-white/10 bg-[#0f1729] p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-white">{question.label}</h3>
                {selected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                ) : isClosed ? (
                  <span className="text-xs text-red-400">Closed</span>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const team = option.teamCode ? getTeamByCode(option.teamCode) : null
                  const isSelected = selected === option.id

                  return (
                    <button
                      key={option.id}
                      disabled={isClosed && !isSelected}
                      onClick={() => !isClosed && selectPick(question.id, option.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10 text-white"
                          : "border-white/10 text-white/70 hover:border-white/20",
                        isClosed && !isSelected && "opacity-40"
                      )}
                    >
                      {team && <span>{team.flag}</span>}
                      <span className="flex-1 font-medium">{option.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white">Your standing</h3>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-amber-400">340</div>
            <p className="text-sm text-white/50">points · 2-day streak</p>
            <p className="mt-1 text-xs text-white/40">
              {lockedCount}/{totalQuestions} picks locked
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-white/50" />
            <h3 className="font-bold text-white">Leaderboard</h3>
          </div>
          <ul className="space-y-2">
            {DEMO_LEADERBOARD.map((entry) => (
              <li
                key={entry.rank}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                  entry.isUser ? "bg-amber-500/10 text-white" : "text-white/60"
                )}
              >
                <span>
                  <span className="mr-2 font-mono text-white/40">#{entry.rank}</span>
                  {entry.name}
                </span>
                <span className="font-bold text-amber-400">{entry.points}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
          <h3 className="mb-3 font-bold text-white">How it works</h3>
          <ul className="space-y-2">
            {FAN_STAKES_RULES.map((rule, i) => (
              <li key={i} className="text-sm leading-relaxed text-white/60">
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="outline"
          className="w-full border-white/20 text-white/60"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setPicks({})
          }}
        >
          Reset my picks
        </Button>
      </div>
    </div>
  )
}
