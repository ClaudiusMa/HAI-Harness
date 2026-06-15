"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ProCastSession } from "@/types/worldcup-exclusives"
import { PitchField, PitchMarker } from "@/components/worldcup/pitch/pitch-field"
import { PitchTelestrator, getActiveAnnotationIds } from "./pitch-telestrator"
import { HostPip, HostBanner } from "./host-pip"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Lightbulb,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react"

interface ProCastPlayerProps {
  session: ProCastSession
}

const BEAT_LABELS: Record<string, string> = {
  strategy: "Tactics",
  story: "Story",
  reaction: "Reaction",
  rule: "Rules school",
  what_if: "What would I do?",
  first_wc: "First World Cup",
}

const BEAT_ICONS: Record<string, typeof Lightbulb> = {
  rule: BookOpen,
  what_if: Sparkles,
  first_wc: MessageCircle,
  strategy: Lightbulb,
}

export function ProCastPlayer({ session }: ProCastPlayerProps) {
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showTelestrator, setShowTelestrator] = useState(true)

  const homeTeam = getTeamByCode(session.homeTeamCode)
  const awayTeam = getTeamByCode(session.awayTeamCode)

  const currentFrame = useMemo(() => {
    let frame = session.frames[0]
    for (const f of session.frames) {
      if (f.time <= time) frame = f
    }
    return frame
  }, [session.frames, time])

  const activeBeat = useMemo(() => {
    let idx = 0
    session.commentary.forEach((c, i) => {
      if (c.time <= time) idx = i
    })
    return { beat: session.commentary[idx], index: idx }
  }, [session.commentary, time])

  const activeAnnotationIds = useMemo(() => {
    if (!showTelestrator) return []
    return getActiveAnnotationIds(
      session.annotations,
      time,
      activeBeat.beat.telestratorIds
    )
  }, [session.annotations, time, activeBeat.beat.telestratorIds, showTelestrator])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setTime((t) => {
        if (t >= session.durationSeconds) {
          setIsPlaying(false)
          return session.durationSeconds
        }
        return t + 0.1
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, session.durationSeconds])

  const seek = useCallback(
    (t: number) => setTime(Math.max(0, Math.min(session.durationSeconds, t))),
    [session.durationSeconds]
  )

  const BeatIcon = BEAT_ICONS[activeBeat.beat.type] ?? MessageCircle

  return (
    <div className="space-y-6">
      <HostBanner host={session.host} />

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Pitch + PIP */}
        <div className="xl:col-span-3">
          <div className="relative">
            <PitchField>
              {showTelestrator && (
                <PitchTelestrator
                  annotations={session.annotations}
                  activeIds={activeAnnotationIds}
                />
              )}
              {currentFrame.players.map((p) => (
                <PitchMarker key={p.id} x={p.x} y={p.y} team={p.team} label={p.label} />
              ))}
              <PitchMarker
                x={currentFrame.ball.x}
                y={currentFrame.ball.y}
                team="home"
                isBall
              />
            </PitchField>

            <HostPip
              host={session.host}
              isSpeaking={isPlaying || time > 0}
              currentText={activeBeat.beat.text}
            />

            {/* Cast badge */}
            <div className="absolute left-3 top-3 z-40 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                What Would The Pros Do
              </p>
              <p className="text-xs text-white/70">{session.castTagline}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                {currentFrame.phase}
              </span>
              <p className="text-sm text-white/50">{session.matchLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>{homeTeam?.flag} {homeTeam?.code}</span>
              <span>{awayTeam?.flag} {awayTeam?.code}</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-emerald-400">
                <input
                  type="checkbox"
                  checked={showTelestrator}
                  onChange={(e) => setShowTelestrator(e.target.checked)}
                  className="rounded"
                />
                Telestrator
              </label>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-4 space-y-2">
            <input
              type="range"
              min={0}
              max={session.durationSeconds}
              step={0.1}
              value={time}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-red-500"
              aria-label="Pro Cast timeline"
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{time.toFixed(1)}s</span>
              <span>{session.durationSeconds}s</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-1.5 bg-red-600 hover:bg-red-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Play Pro Cast"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => seek(time - 1)} className="border-white/20 text-white">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => seek(time + 1)} className="border-white/20 text-white">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setTime(0); setIsPlaying(true) }}
              className="gap-1 text-white/60"
            >
              <RotateCcw className="h-4 w-4" />
              Restart
            </Button>
          </div>
        </div>

        {/* Conversation panel */}
        <div className="xl:col-span-2">
          <div className="sticky top-20 space-y-4">
            {/* Active beat */}
            <div className="rounded-2xl border border-red-500/20 bg-[#0f1729] p-5">
              <div className="mb-3 flex items-center gap-2">
                <BeatIcon className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                  {BEAT_LABELS[activeBeat.beat.type] ?? "Commentary"}
                </span>
              </div>
              <p className="text-lg leading-relaxed text-white">
                &ldquo;{activeBeat.beat.text}&rdquo;
              </p>
              <p className="mt-3 text-sm text-white/40">— {session.host.name}</p>
            </div>

            {/* First WC story */}
            {session.host.firstWorldCup && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                  First World Cup memory
                </p>
                <p className="mt-2 text-sm italic leading-relaxed text-white/70">
                  &ldquo;{session.host.firstWorldCup}&rdquo;
                </p>
              </div>
            )}

            {/* Beat timeline */}
            <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                Conversation timeline
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {session.commentary.map((beat, i) => (
                  <button
                    key={i}
                    onClick={() => seek(beat.time)}
                    className={cn(
                      "flex w-full gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeBeat.index === i
                        ? "bg-red-500/10 text-white"
                        : "text-white/50 hover:bg-white/5"
                    )}
                  >
                    <span className="shrink-0 font-mono text-xs text-red-400">{beat.time}s</span>
                    <span className="line-clamp-2">{beat.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-400">Takeaway</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{session.takeaway}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
