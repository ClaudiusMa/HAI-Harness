import Link from "next/link"
import { notFound } from "next/navigation"
import { getPlayerBySlug } from "@/lib/worldcup/players"
import { getTeamByCode } from "@/lib/worldcup/teams"
import { MediaClip } from "@/components/worldcup/media-clip"
import { ArrowLeft, Headphones, MapPin } from "lucide-react"

interface PlayerPageProps {
  params: Promise<{ slug: string }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params
  const player = getPlayerBySlug(slug)

  if (!player) notFound()

  const team = getTeamByCode(player.teamCode)

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup/players"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Player Threads
      </Link>

      <header className="mb-8 flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/50 to-[#0a0f1a] text-5xl">
          {team?.flag}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            Player Threads
          </p>
          <h1 className="text-3xl font-black text-white">{player.name}</h1>
          <p className="text-white/50">
            {team?.name} · #{player.number} · {player.position}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/40">
            <MapPin className="h-3.5 w-3.5" />
            {player.hometown}
          </p>
        </div>
      </header>

      <blockquote className="mb-8 border-l-4 border-purple-500 pl-5">
        <p className="text-xl font-medium italic leading-relaxed text-white/90">
          &ldquo;{player.quote}&rdquo;
        </p>
        <footer className="mt-2 text-sm text-white/40">{player.quoteContext}</footer>
      </blockquote>

      {player.audioDurationSeconds && (
        <div className="mb-8">
          <MediaClip
            media={{
              type: "audio",
              url: "#player-thread-audio",
              durationSeconds: player.audioDurationSeconds,
              caption: `${player.name} — Player Threads interview clip`,
            }}
          />
        </div>
      )}

      <section className="mb-8 space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-bold text-white">Local roots</h2>
          <p className="leading-relaxed text-white/70">
            <strong className="text-purple-300">{player.localClub}</strong>
            {" — "}
            {player.localClubStory}
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold text-white">World Cup story</h2>
          <p className="leading-relaxed text-white/70">{player.worldCupStory}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Headphones className="h-5 w-5 text-purple-400" />
          Connections
        </h2>
        <dl className="space-y-3">
          {player.connections.map((c) => (
            <div key={c.label} className="flex gap-4 text-sm">
              <dt className="w-24 shrink-0 font-medium text-white/40">{c.label}</dt>
              <dd className="text-white/80">{c.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {team && (
        <div className="mt-8">
          <Link
            href={`/worldcup/teams/${team.code}`}
            className="text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            View {team.name} team hub →
          </Link>
        </div>
      )}
    </article>
  )
}
