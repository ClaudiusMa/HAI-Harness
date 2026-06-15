import Link from "next/link"
import { PITCH_REPLAYS } from "@/lib/worldcup/pitch-replays"
import { PRO_CAST_SESSIONS } from "@/lib/worldcup/pro-cast"
import { LONGFORM_FEATURES } from "@/lib/worldcup/longform"
import { PLAYER_PROFILES } from "@/lib/worldcup/players"
import { PitchReplayCard } from "@/components/worldcup/pitch/pitch-replay-card"
import { ProCastCard } from "@/components/worldcup/pro-cast/pro-cast-card"
import { LongformCard } from "@/components/worldcup/longform/longform-article"
import { PlayerThreadCard } from "@/components/worldcup/players/player-thread-card"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Headphones,
  LayoutGrid,
  Newspaper,
  Radio,
  Trophy,
  Users,
} from "lucide-react"

const EXCLUSIVE_FEATURES = [
  {
    href: "/worldcup/pro-cast",
    icon: Radio,
    title: "What Would The Pros Do",
    description: "Manning Cast-style alternate feed — Beckham or Zidane in the corner, telestrator live, rules school between plays.",
    badge: "Signature feature",
    color: "red",
  },
  {
    href: "/worldcup/pitch-room",
    icon: LayoutGrid,
    title: "The Pitch Room",
    description: "Scrub through set pieces on a tactical field with synced star commentary.",
    badge: "Tactical replays",
    color: "emerald",
  },
  {
    href: "/worldcup/dispatch",
    icon: Newspaper,
    title: "Serif Dispatch",
    description: "Atlantic-depth essays on hosting, identity, and the 48-team experiment — not hot takes.",
    badge: "Long read",
    color: "amber",
  },
  {
    href: "/worldcup/players",
    icon: Users,
    title: "Player Threads",
    description: "Personal stories, local club roots, and audio clips — connect faces to the tournament.",
    badge: "Audio + profiles",
    color: "purple",
  },
  {
    href: "/worldcup/picks",
    icon: Trophy,
    title: "Fan Stakes",
    description: "Lock bracket picks, climb the leaderboard, stake your reputation — no sportsbook required.",
    badge: "Social picks",
    color: "yellow",
  },
]

export function ExclusiveExperiencesSection() {
  return (
    <section className="border-y border-white/10 bg-[#080c14]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            You won&apos;t find this on ESPN
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">
            Exclusive to this companion
          </h2>
          <p className="mt-3 text-white/60">
            Live scores are everywhere. These experiences aren&apos;t — tactical replays with
            legend commentary, long-form culture writing, player roots, and a fan prediction league.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXCLUSIVE_FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-2xl border border-white/10 bg-[#0f1729] p-5 transition-all hover:border-white/20 hover:bg-[#131d33]"
            >
              <feature.icon className="mb-3 h-6 w-6 text-emerald-400" />
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                {feature.badge}
              </span>
              <h3 className="mt-2 font-bold text-white group-hover:text-emerald-300">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {feature.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        {/* Pro Cast preview */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-400" />
              <h3 className="text-xl font-bold text-white">What Would The Pros Do</h3>
            </div>
            <Link href="/worldcup/pro-cast" className="text-sm text-red-400 hover:text-red-300">
              All Pro Casts →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {PRO_CAST_SESSIONS.slice(0, 2).map((session) => (
              <ProCastCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Pitch Room preview */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">The Pitch Room</h3>
            </div>
            <Link href="/worldcup/pitch-room" className="text-sm text-emerald-400 hover:text-emerald-300">
              All replays →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PITCH_REPLAYS.map((replay) => (
              <PitchReplayCard key={replay.id} replay={replay} />
            ))}
          </div>
        </div>

        {/* Dispatch + Players row */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Serif Dispatch</h3>
              </div>
              <Link href="/worldcup/dispatch" className="text-sm text-amber-400 hover:text-amber-300">
                All features →
              </Link>
            </div>
            <LongformCard feature={LONGFORM_FEATURES[0]} featured />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Player Threads</h3>
              </div>
              <Link href="/worldcup/players" className="text-sm text-purple-400 hover:text-purple-300">
                All profiles →
              </Link>
            </div>
            <div className="space-y-4">
              {PLAYER_PROFILES.slice(0, 2).map((player) => (
                <PlayerThreadCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/worldcup/pro-cast">
            <Button className="gap-2 bg-red-600 hover:bg-red-700">
              <Radio className="h-4 w-4" />
              Watch Pro Cast — Beckham on the corner
            </Button>
          </Link>
          <Link href="/worldcup/picks">
            <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Trophy className="h-4 w-4" />
              Fan Stakes
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
