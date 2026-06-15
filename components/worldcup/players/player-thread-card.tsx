import Link from "next/link"
import type { PlayerProfile } from "@/types/worldcup-exclusives"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Headphones, MapPin } from "lucide-react"

interface PlayerThreadCardProps {
  player: PlayerProfile
}

export function PlayerThreadCard({ player }: PlayerThreadCardProps) {
  const team = getTeamByCode(player.teamCode)

  return (
    <Link
      href={`/worldcup/players/${player.slug}`}
      className="group block rounded-2xl border border-white/10 bg-[#0f1729] p-6 transition-all hover:border-purple-500/30"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/50 to-[#0a0f1a] text-3xl">
          {team?.flag ?? "⚽"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-purple-400">
            Player Threads
          </p>
          <h3 className="mt-1 text-xl font-bold text-white group-hover:text-purple-200">
            {player.name}
          </h3>
          <p className="text-sm text-white/50">
            {team?.name} · #{player.number} · {player.position}
          </p>
        </div>
      </div>

      <blockquote className="mt-4 border-l-2 border-purple-500/50 pl-4 text-sm italic leading-relaxed text-white/70">
        &ldquo;{player.quote}&rdquo;
      </blockquote>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/40">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {player.hometown}
        </span>
        {player.audioDurationSeconds && (
          <span className="inline-flex items-center gap-1 text-purple-400/80">
            <Headphones className="h-3 w-3" />
            {player.audioDurationSeconds}s clip
          </span>
        )}
      </div>
    </Link>
  )
}
