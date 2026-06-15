import Link from "next/link"
import type { ProCastSession } from "@/types/worldcup-exclusives"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { Mic, Play, Radio } from "lucide-react"

interface ProCastCardProps {
  session: ProCastSession
  featured?: boolean
}

export function ProCastCard({ session, featured = false }: ProCastCardProps) {
  const home = getTeamByCode(session.homeTeamCode)
  const away = getTeamByCode(session.awayTeamCode)

  return (
    <Link
      href={`/worldcup/pro-cast/${session.slug}`}
      className={
        featured
          ? "group block overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 to-[#0f1729] transition-all hover:border-red-500/50"
          : "group block overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729] transition-all hover:border-red-500/30"
      }
    >
      <div className="relative aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0a0f1a]">
        {/* Mock split screen: pitch + host PIP */}
        <div className="absolute inset-3 rounded border border-white/10 bg-emerald-900/20" />
        <div
          className="absolute bottom-5 right-5 flex h-16 w-24 items-center justify-center rounded-lg border-2 sm:h-20 sm:w-28"
          style={{ borderColor: session.host.accentColor, backgroundColor: `${session.host.accentColor}22` }}
        >
          <span className="text-lg font-black text-white">{session.host.initials}</span>
        </div>
        <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
          <Radio className="h-3 w-3" />
          Pro Cast
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
            <Play className="h-7 w-7 fill-white text-white" />
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: session.host.accentColor }}
          >
            {session.host.initials}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{session.host.name}</p>
            <p className="text-[10px] text-white/40">What Would The Pros Do</p>
          </div>
        </div>
        <h3 className="text-lg font-bold leading-snug text-white group-hover:text-red-300">
          {session.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/60">{session.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
          <Mic className="h-3 w-3" />
          <span>{session.matchLabel}</span>
          <span>·</span>
          <span>{home?.flag} vs {away?.flag}</span>
        </div>
      </div>
    </Link>
  )
}
