"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { PitchReplay } from "@/types/worldcup-exclusives"
import { PitchField, PitchMarker } from "./pitch-field"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Headphones, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"

interface PitchReplayPlayerProps {
  replay: PitchReplay
}

export function PitchReplayPlayer({ replay }: PitchReplayPlayerProps) {
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeCommentaryIndex, setActiveCommentaryIndex] = useState(0)

  const homeTeam = getTeamByCode(replay.homeTeamCode)
  const awayTeam = getTeamByCode(replay.awayTeamCode)

  const currentFrame = useMemo(() => {
    let frame = replay.frames[0]
    for (const f of replay.frames) {
      if (f.time <= time) frame = f
    }
    return frame
  }, [replay.frames, time])

  const activeCommentary = useMemo(() => {
    let idx = 0
    replay.commentary.forEach((c, i) => {
      if (c.time <= time) idx = i
    })
    return { beat: replay.commentary[idx], index: idx }
  }, [replay.commentary, time])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setTime((t) => {
        if (t >= replay.durationSeconds) {
          setIsPlaying(false)
          return replay.durationSeconds
        }
        return t + 0.1
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, replay.durationSeconds])

  useEffect(() => {
    setActiveCommentaryIndex(activeCommentary.index)
  }, [activeCommentary.index])

  const seek = useCallback((t: number) => {
    setTime(Math.max(0, Math.min(replay.durationSeconds, t)))
  }, [replay.durationSeconds])

  const restart = () => {
    setTime(0)
    setIsPlaying(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Field */}
      <div className="lg:col-span-3">
        <PitchField>
          {currentFrame.players.map((p) => (
            <PitchMarker
              key={p.id}
              x={p.x}
              y={p.y}
              team={p.team}
              label={p.label}
            />
          ))}
          <PitchMarker
            x={currentFrame.ball.x}
            y={currentFrame.ball.y}
            team="home"
            isBall
          />
        </PitchField>

        {/* Phase label */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              {currentFrame.phase ?? "Replay"}
            </span>
            <p className="text-sm text-white/50">{replay.matchLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              {homeTeam?.code ?? replay.homeTeamCode}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              {awayTeam?.code ?? replay.awayTeamCode}
            </span>
          </div>
        </div>

        {/* Scrubber */}
        <div className="mt-4 space-y-2">
          <input
            type="range"
            min={0}
            max={replay.durationSeconds}
            step={0.1}
            value={time}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-500"
            aria-label="Replay timeline"
          />
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{time.toFixed(1)}s</span>
            <span>{replay.durationSeconds}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => seek(time - 1)} className="border-white/20 text-white">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => seek(time + 1)} className="border-white/20 text-white">
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={restart} className="gap-1 text-white/60">
            <RotateCcw className="h-4 w-4" />
            Restart
          </Button>

          {/* Frame markers */}
          <div className="ml-auto flex gap-1">
            {replay.frames.map((f) => (
              <button
                key={f.time}
                onClick={() => seek(f.time)}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  time >= f.time ? "bg-emerald-500" : "bg-white/20"
                )}
                aria-label={`Jump to ${f.phase}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Commentary panel */}
      <div className="lg:col-span-2">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              <Headphones className="h-4 w-4" />
              Pitch Room · Star commentary
            </div>

            <div className="mb-4 min-h-[120px]">
              <p className="text-lg font-bold text-white">{activeCommentary.beat.speaker}</p>
              <p className="text-xs text-white/50">{activeCommentary.beat.speakerTitle}</p>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                &ldquo;{activeCommentary.beat.text}&rdquo;
              </p>
              <span
                className={cn(
                  "mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  activeCommentary.beat.type === "strategy" && "bg-blue-500/20 text-blue-300",
                  activeCommentary.beat.type === "story" && "bg-purple-500/20 text-purple-300",
                  activeCommentary.beat.type === "reaction" && "bg-red-500/20 text-red-300"
                )}
              >
                {activeCommentary.beat.type}
              </span>
            </div>

            {/* Commentary timeline */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              {replay.commentary.map((beat, i) => (
                <button
                  key={i}
                  onClick={() => seek(beat.time)}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeCommentaryIndex === i
                      ? "bg-emerald-500/10 text-white"
                      : "text-white/50 hover:bg-white/5"
                  )}
                >
                  <span className="font-mono text-xs text-emerald-400">{beat.time}s</span>
                  <span className="ml-2 line-clamp-1">{beat.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Takeaway
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{replay.takeaway}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
