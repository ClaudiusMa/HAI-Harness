import { ExclusiveExperiencesSection } from "@/components/worldcup/exclusive-experiences-section"
import Link from "next/link"
import { fetchLiveSnapshot } from "@/lib/worldcup/fifa-api"
import { LiveScoreTicker } from "@/components/worldcup/live-score-ticker"
import { MatchCard } from "@/components/worldcup/match-card"
import { StoryCard } from "@/components/worldcup/story-card"
import { GroupStandings } from "@/components/worldcup/group-standings"
import { PersonalizedHub } from "@/components/worldcup/personalized-hub"
import { BeginnerTipsPanel } from "@/components/worldcup/beginner-tips-panel"
import { Button } from "@/components/ui/button"
import { isLiveMatch } from "@/lib/worldcup/utils"
import { ArrowRight, BookOpen, MapPin, Radio, User } from "lucide-react"

export default async function WorldCupHomePage() {
  const snapshot = await fetchLiveSnapshot()
  const liveMatches = snapshot.matches.filter(isLiveMatch)
  const featuredStory = snapshot.stories[0]
  const moreStories = snapshot.stories.slice(1, 4)

  return (
    <>
      <LiveScoreTicker initialSnapshot={snapshot} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-red-900/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
              FIFA World Cup 2026 · USA · Mexico · Canada
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Soccer&apos;s biggest party is here.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              New to the World Cup? We&apos;ve got you. Live scores, plain-English explainers,
              and short stories that help you follow every match — no soccer PhD required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/worldcup/live">
                <Button className="gap-2 bg-red-600 hover:bg-red-700">
                  <Radio className="h-4 w-4" />
                  Watch Live Scores
                </Button>
              </Link>
              <Link href="/worldcup/my-team">
                <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <User className="h-4 w-4" />
                  Pick My Team
                </Button>
              </Link>
              <Link href="/worldcup/format">
                <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <BookOpen className="h-4 w-4" />
                  48-Team Guide
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 sm:max-w-md">
            {[
              { value: "48", label: "teams" },
              { value: "104", label: "matches" },
              { value: "16", label: "host cities" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-black text-white sm:text-3xl">{item.value}</div>
                <div className="text-xs uppercase tracking-wide text-white/40">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ExclusiveExperiencesSection />

      <PersonalizedHub matches={snapshot.matches} stories={snapshot.stories} />

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Live right now</h2>
            <Link
              href="/worldcup/live"
              className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              All scores <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Featured story + more */}
      <section className="border-t border-white/10 bg-[#0d1424]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Smart Brevity
              </p>
              <h2 className="text-2xl font-bold text-white">Stories & explainers</h2>
            </div>
            <Link
              href="/worldcup/stories"
              className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              All stories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {featuredStory && <StoryCard story={featuredStory} featured />}
            <div className="space-y-4">
              {moreStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beginner tips */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <BeginnerTipsPanel />
      </section>

      {/* Standings preview */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Group standings</h2>
          <Link
            href="/worldcup/standings"
            className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Full table <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GroupStandings standings={snapshot.standings} />
      </section>

      {/* Host cities CTA */}
      <section className="border-t border-white/10 bg-gradient-to-r from-emerald-950/30 to-[#0a0f1a]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-6 w-6 shrink-0 text-emerald-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Hosting across North America</h2>
                <p className="mt-1 max-w-lg text-sm text-white/60">
                  11 US cities, plus Mexico City, Guadalajara, Monterrey, Toronto, and Vancouver.
                  Fan Fests in every host city — the easiest way to catch a game without a ticket.
                </p>
              </div>
            </div>
            <Link href="/worldcup/stories/fan-fest-guide">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                Fan Fest guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
