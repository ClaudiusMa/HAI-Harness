import Link from "next/link"
import { notFound } from "next/navigation"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { STORIES } from "@/lib/worldcup/content"
import { fetchLiveSnapshot } from "@/lib/worldcup/fifa-api"
import { MatchCard } from "@/components/worldcup/match-card"
import { StoryCard } from "@/components/worldcup/story-card"
import { GroupStandings } from "@/components/worldcup/group-standings"
import { ArrowLeft } from "lucide-react"

interface TeamPageProps {
  params: Promise<{ code: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { code } = await params
  const team = getTeamByCode(code.toUpperCase())

  if (!team) notFound()

  const snapshot = await fetchLiveSnapshot()
  const teamMatches = snapshot.matches.filter(
    (m) => m.homeTeam.code === team.code || m.awayTeam.code === team.code
  )
  const relatedStories = STORIES.filter((s) => s.relatedTeamCode === team.code)
  const teamStanding = snapshot.standings.find((s) => s.team.code === team.code)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <span className="text-6xl" aria-hidden>
          {team.flag}
        </span>
        <div>
          <h1 className="text-3xl font-black text-white">{team.name}</h1>
          <p className="text-white/50">
            {team.confederation}
            {team.fifaRank && ` · FIFA Rank #${team.fifaRank}`}
            {team.isHost && " · Host nation"}
          </p>
        </div>
      </div>

      {teamStanding && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">
            Group {teamStanding.group} standing
          </h2>
          <GroupStandings
            standings={snapshot.standings.filter((s) => s.group === teamStanding.group)}
            highlightTeam={team.code}
          />
        </section>
      )}

      {teamMatches.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">Matches</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {teamMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {relatedStories.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">Stories</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
