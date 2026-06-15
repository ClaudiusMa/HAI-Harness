"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { TournamentSnapshot } from "@/types/worldcup"
import { isLiveMatch } from "@/lib/worldcup/utils"

export function LiveScoreTicker({ initialSnapshot }: { initialSnapshot: TournamentSnapshot }) {
  const [matches, setMatches] = useState(
    initialSnapshot.matches.filter(isLiveMatch)
  )

  useEffect(() => {
    const source = new EventSource("/api/worldcup/live/stream")

    source.addEventListener("snapshot", (e) => {
      const data = JSON.parse(e.data) as TournamentSnapshot
      setMatches(data.matches.filter(isLiveMatch))
    })
    source.addEventListener("updates", () => {
      fetch("/api/worldcup/live")
        .then((r) => r.json())
        .then((data: TournamentSnapshot) => {
          setMatches(data.matches.filter(isLiveMatch))
        })
        .catch(() => {})
    })

    return () => source.close()
  }, [])

  if (matches.length === 0) return null

  return (
    <div className="overflow-hidden border-b border-red-500/20 bg-red-950/30">
      <div className="wc-ticker flex animate-[ticker_30s_linear_infinite] gap-8 whitespace-nowrap py-2">
        {[...matches, ...matches].map((match, i) => (
          <Link
            key={`${match.id}-${i}`}
            href={`/worldcup/matches/${match.id}`}
            className="inline-flex items-center gap-2 px-2 text-sm text-white hover:text-emerald-300"
          >
            <span className="font-bold text-red-400">LIVE</span>
            <span>{match.homeTeam.flag}</span>
            <span className="font-medium">{match.homeTeam.code}</span>
            <span className="font-mono font-bold">
              {match.homeScore}–{match.awayScore}
            </span>
            <span className="font-medium">{match.awayTeam.code}</span>
            <span>{match.awayTeam.flag}</span>
            {match.minute && (
              <span className="text-white/50">{match.minute}&apos;</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
