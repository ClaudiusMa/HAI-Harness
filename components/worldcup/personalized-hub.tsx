"use client"

import Link from "next/link"
import type { Match, Story } from "@/types/worldcup"
import { MatchCard } from "./match-card"
import { StoryCard } from "./story-card"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bell, Heart, Settings2 } from "lucide-react"

interface PersonalizedHubProps {
  matches: Match[]
  stories: Story[]
}

export function PersonalizedHub({ matches, stories }: PersonalizedHubProps) {
  const { preferences } = useWorldCupPreferences()
  const favorite = preferences.favoriteTeamCode
    ? getTeamByCode(preferences.favoriteTeamCode)
    : null

  const myMatches = favorite
    ? matches.filter(
        (m) =>
          m.homeTeam.code === favorite.code || m.awayTeam.code === favorite.code
      )
    : []

  const myStories = favorite
    ? stories.filter(
        (s) =>
          s.relatedTeamCode === favorite.code ||
          s.tags.some((t) => t.toUpperCase() === favorite.code)
      ).slice(0, 2)
    : []

  if (!favorite) return null

  return (
    <section className="border-b border-white/10 bg-gradient-to-b from-emerald-950/40 to-transparent">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden>
              {favorite.flag}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Your team
              </p>
              <h2 className="text-2xl font-black text-white">{favorite.name}</h2>
              <p className="text-sm text-white/50">
                Matches and stories picked for you
              </p>
            </div>
          </div>
          <Link href="/worldcup/my-team">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
          </Link>
        </div>

        {myMatches.length > 0 ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myMatches.map((match) => (
              <MatchCard key={match.id} match={match} isFavoriteTeam />
            ))}
          </div>
        ) : (
          <p className="mb-8 text-sm text-white/50">No matches scheduled yet for your team.</p>
        )}

        {myStories.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {myStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/worldcup/teams/${favorite.code}`}>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Heart className="h-4 w-4" />
              Team hub
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {preferences.notifyMatchStart && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/50">
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
              Match alerts on
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
