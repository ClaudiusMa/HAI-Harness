import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchMatch } from "@/lib/worldcup/fifa-api"
import { STORIES } from "@/lib/worldcup/content"
import { Badge } from "@/components/ui/badge"
import { StoryCard } from "@/components/worldcup/story-card"
import {
  formatKickoffET,
  formatStage,
  formatStatus,
  isLiveMatch,
} from "@/lib/worldcup/utils"
import { ArrowLeft } from "lucide-react"

interface MatchPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params
  const match = await fetchMatch(id)

  if (!match) notFound()

  const live = isLiveMatch(match)
  const relatedStories = STORIES.filter((s) => s.relatedMatchId === id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup/live"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Live scores
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium uppercase tracking-wide text-white/50">
          {formatStage(match.stage, match.group)}
        </span>
        {live ? (
          <Badge variant="live">
            {formatStatus(match.status)}
            {match.minute ? ` ${match.minute}'` : ""}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-white/10 text-white/70">
            {formatStatus(match.status)}
          </Badge>
        )}
      </div>

      {/* Scoreboard */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-8">
        <div className="flex items-center justify-between gap-4">
          <TeamBlock team={match.homeTeam} score={match.homeScore} align="left" />
          <div className="text-center">
            {match.homeScore !== null ? (
              <div className="text-5xl font-black tabular-nums text-white">
                {match.homeScore}
                <span className="mx-2 text-white/30">–</span>
                {match.awayScore}
              </div>
            ) : (
              <div className="text-2xl font-bold text-white/40">vs</div>
            )}
            <p className="mt-2 text-sm text-white/40">{formatKickoffET(match.kickoffUtc)}</p>
          </div>
          <TeamBlock team={match.awayTeam} score={match.awayScore} align="right" />
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/50">
          <p>{match.venue}</p>
          <p>{match.city}</p>
          {match.broadcastNote && (
            <p className="mt-1 text-emerald-400/80">{match.broadcastNote}</p>
          )}
        </div>
      </div>

      {/* Events timeline */}
      {match.events.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-white">Match events</h2>
          <ul className="space-y-2">
            {match.events.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm"
              >
                <span className="w-8 shrink-0 font-mono font-bold text-white/40">
                  {event.minute}&apos;
                </span>
                <span className="text-lg" aria-hidden>
                  {event.type === "goal" || event.type === "penalty"
                    ? "⚽"
                    : event.type === "yellow_card"
                      ? "🟨"
                      : event.type === "red_card"
                        ? "🟥"
                        : "•"}
                </span>
                <span className="text-white/80">
                  <strong className="text-white">{event.playerName}</strong>
                  {event.detail && ` — ${event.detail}`}
                </span>
                <span className="ml-auto text-white/40">{event.teamCode}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedStories.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-white">Related stories</h2>
          <div className="space-y-4">
            {relatedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TeamBlock({
  team,
  score,
  align,
}: {
  team: { flag: string; name: string; code: string }
  score: number | null
  align: "left" | "right"
}) {
  return (
    <div className={`flex flex-1 flex-col ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <span className="text-4xl" aria-hidden>
        {team.flag}
      </span>
      <span className="mt-2 text-lg font-bold text-white">{team.name}</span>
      <span className="text-sm text-white/40">{team.code}</span>
      {score !== null && (
        <span className="mt-1 text-3xl font-black text-white/20 sm:hidden">{score}</span>
      )}
    </div>
  )
}
