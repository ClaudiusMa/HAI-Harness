import Link from "next/link"
import type { PitchReplay } from "@/types/worldcup-exclusives"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Play } from "lucide-react"

interface PitchReplayCardProps {
  replay: PitchReplay
}

const TYPE_LABELS: Record<PitchReplay["type"], string> = {
  corner: "Corner kick",
  free_kick: "Free kick",
  counter: "Counter attack",
  penalty: "Penalty",
  build_up: "Build-up play",
}

export function PitchReplayCard({ replay }: PitchReplayCardProps) {
  const home = getTeamByCode(replay.homeTeamCode)
  const away = getTeamByCode(replay.awayTeamCode)

  return (
    <Link
      href={`/worldcup/pitch-room/${replay.slug}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729] transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/10"
    >
      {/* Mini pitch preview */}
      <div className="relative aspect-[68/105] bg-gradient-to-br from-emerald-900/40 to-[#0a0f1a]">
        <div className="absolute inset-4 rounded border border-white/20" />
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
        <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-5 w-5 fill-white text-white" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-300">
          {TYPE_LABELS[replay.type]}
        </span>
      </div>

      <div className="p-5">
        <p className="text-xs text-white/40">{replay.matchLabel}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-white group-hover:text-emerald-300">
          {replay.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/60">{replay.subtitle}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
          <span>{home?.flag}</span>
          <span>{home?.code}</span>
          <span>vs</span>
          <span>{away?.flag}</span>
          <span>{away?.code}</span>
          <span className="ml-auto">{replay.durationSeconds}s replay</span>
        </div>
      </div>
    </Link>
  )
}
