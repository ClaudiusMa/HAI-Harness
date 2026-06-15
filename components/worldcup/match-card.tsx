"use client"

import Link from "next/link"
import type { Match } from "@/types/worldcup"
import { Badge } from "@/components/ui/badge"
import { TermTooltip } from "./term-tooltip"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import { cn } from "@/lib/utils"
import {
  formatKickoffTime,
  formatStage,
  getScoreDisplay,
  isLiveMatch,
} from "@/lib/worldcup/utils"
import { Heart } from "lucide-react"

interface MatchCardProps {
  match: Match
  variant?: "compact" | "full"
  isFavoriteTeam?: boolean
}

export function MatchCard({ match, variant = "full", isFavoriteTeam = false }: MatchCardProps) {
  const { preferences } = useWorldCupPreferences()
  const live = isLiveMatch(match)
  const isFollowed =
    preferences.followedTeamCodes.includes(match.homeTeam.code) ||
    preferences.followedTeamCodes.includes(match.awayTeam.code)

  return (
    <Link
      href={`/worldcup/matches/${match.id}`}
      className={cn(
        "group block rounded-2xl border transition-all",
        live
          ? "border-red-500/40 bg-gradient-to-br from-red-950/40 to-[#0f1729] shadow-lg shadow-red-900/20"
          : isFavoriteTeam || isFollowed
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-[#0f1729]"
            : "border-white/10 bg-[#0f1729] hover:border-white/20 hover:bg-[#131d33]"
      )}
    >
      <div className={cn("p-4", variant === "compact" && "p-3")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">
            {formatStage(match.stage, match.group)}
          </span>
          <div className="flex items-center gap-2">
            {(isFavoriteTeam || isFollowed) && (
              <Heart className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" aria-hidden />
            )}
            {live ? (
              <Badge variant="live" className="gap-1">
                LIVE
                {match.minute ? ` ${match.minute}'` : ""}
              </Badge>
            ) : match.status === "halftime" ? (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
                <TermTooltip term="HT" />
              </Badge>
            ) : match.status === "finished" ? (
              <Badge variant="secondary" className="bg-white/10 text-white/70">
                <TermTooltip term="FT" />
              </Badge>
            ) : (
              <span className="text-xs text-white/50">{formatKickoffTime(match.kickoffUtc)}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <TeamRow
            team={match.homeTeam}
            score={match.homeScore}
            isFavorite={preferences.favoriteTeamCode === match.homeTeam.code}
            isWinner={
              match.status === "finished" &&
              match.homeScore !== null &&
              match.awayScore !== null &&
              match.homeScore > match.awayScore
            }
          />
          <TeamRow
            team={match.awayTeam}
            score={match.awayScore}
            isFavorite={preferences.favoriteTeamCode === match.awayTeam.code}
            isWinner={
              match.status === "finished" &&
              match.homeScore !== null &&
              match.awayScore !== null &&
              match.awayScore > match.homeScore
            }
          />
        </div>

        {variant === "full" && (
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="truncate text-xs text-white/40">
              {match.venue} · {match.city}
            </span>
            {match.broadcastNote && (
              <span className="shrink-0 text-xs text-emerald-400/80">{match.broadcastNote}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function TeamRow({
  team,
  score,
  isFavorite,
  isWinner,
}: {
  team: Match["homeTeam"]
  score: number | null
  isFavorite: boolean
  isWinner: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-xl leading-none" aria-hidden>
          {team.flag}
        </span>
        <span
          className={cn(
            "truncate text-sm font-medium",
            isWinner ? "text-white" : "text-white/80",
            isFavorite && "text-emerald-300"
          )}
        >
          {team.name}
        </span>
      </div>
      <span
        className={cn(
          "tabular-nums text-lg font-bold",
          isWinner ? "text-white" : "text-white/60"
        )}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  )
}

export function MatchCardScore({ match }: { match: Match }) {
  return (
    <span className="font-mono text-sm font-bold text-white">
      {getScoreDisplay(match)}
    </span>
  )
}
