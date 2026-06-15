"use client"

import { useEffect, useState } from "react"
import type { LiveUpdate, TournamentSnapshot } from "@/types/worldcup"
import { MatchCard } from "./match-card"
import { Badge } from "@/components/ui/badge"
import { isLiveMatch } from "@/lib/worldcup/utils"
import { Radio, Wifi, WifiOff } from "lucide-react"

export function LiveScoresPanel({ initialSnapshot }: { initialSnapshot: TournamentSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(initialSnapshot.lastUpdated)

  useEffect(() => {
    const source = new EventSource("/api/worldcup/live/stream")

    source.addEventListener("open", () => setConnected(true))
    source.addEventListener("snapshot", (e) => {
      const data = JSON.parse(e.data) as TournamentSnapshot
      setSnapshot(data)
      setLastUpdate(data.lastUpdated)
    })
    source.addEventListener("updates", (e) => {
      const updates = JSON.parse(e.data) as LiveUpdate[]
      setSnapshot((prev) => applyUpdates(prev, updates))
      setLastUpdate(new Date().toISOString())
    })
    source.addEventListener("heartbeat", () => {
      setLastUpdate(new Date().toISOString())
    })
    source.addEventListener("error", () => setConnected(false))

    return () => source.close()
  }, [])

  const liveMatches = snapshot.matches.filter(isLiveMatch)
  const upcomingMatches = snapshot.matches.filter((m) => m.status === "scheduled")
  const finishedMatches = snapshot.matches.filter((m) => m.status === "finished")

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-white/40" />
          )}
          <span className="text-sm text-white/60">
            {connected ? "Connected to live feed" : "Connecting…"}
          </span>
          <Badge variant="outline" className="border-white/20 text-white/50">
            {snapshot.dataSource === "fifa" ? "FIFA API" : "Demo mode"}
          </Badge>
        </div>
        <span className="text-xs text-white/30">
          Updated {new Date(lastUpdate).toLocaleTimeString("en-US")}
        </span>
      </div>

      {liveMatches.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Radio className="h-5 w-5 text-red-500" />
            Live Now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {finishedMatches.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white/80">Final</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {finishedMatches.map((match) => (
              <MatchCard key={match.id} match={match} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white/80">Coming Up</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function applyUpdates(snapshot: TournamentSnapshot, updates: LiveUpdate[]): TournamentSnapshot {
  const matches = snapshot.matches.map((match) => {
    const matchUpdates = updates.filter((u) => u.matchId === match.id)
    if (matchUpdates.length === 0) return match

    const updated = { ...match }
    for (const update of matchUpdates) {
      if (update.payload.homeScore !== undefined) updated.homeScore = update.payload.homeScore
      if (update.payload.awayScore !== undefined) updated.awayScore = update.payload.awayScore
      if (update.payload.status) updated.status = update.payload.status
      if (update.payload.minute !== undefined) updated.minute = update.payload.minute
      if (update.payload.event) {
        updated.events = [...updated.events, update.payload.event]
      }
    }
    return updated
  })

  return { ...snapshot, matches, lastUpdated: new Date().toISOString() }
}
