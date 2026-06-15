import Link from "next/link"
import { notFound } from "next/navigation"
import { getPitchReplayBySlug, PITCH_REPLAYS } from "@/lib/worldcup/pitch-replays"
import { PitchReplayPlayer } from "@/components/worldcup/pitch/pitch-replay-player"
import { ArrowLeft } from "lucide-react"

interface PitchReplayPageProps {
  params: Promise<{ slug: string }>
}

export default async function PitchReplayPage({ params }: PitchReplayPageProps) {
  const { slug } = await params
  const replay = getPitchReplayBySlug(slug)

  if (!replay) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup/pitch-room"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        The Pitch Room
      </Link>

      <header className="mb-8 max-w-2xl">
        <p className="text-sm text-white/40">{replay.matchLabel}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{replay.title}</h1>
        <p className="mt-2 text-lg text-white/60">{replay.subtitle}</p>
      </header>

      <PitchReplayPlayer replay={replay} />

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="mb-4 text-lg font-bold text-white">More replays</h2>
        <div className="flex flex-wrap gap-2">
          {PITCH_REPLAYS.filter((r) => r.slug !== slug).map((r) => (
            <Link
              key={r.id}
              href={`/worldcup/pitch-room/${r.slug}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:border-emerald-500/30 hover:text-white"
            >
              {r.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
