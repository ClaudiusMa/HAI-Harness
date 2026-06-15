import Link from "next/link"
import { notFound } from "next/navigation"
import { getProCastBySlug, PRO_CAST_SESSIONS } from "@/lib/worldcup/pro-cast"
import { ProCastPlayer } from "@/components/worldcup/pro-cast/pro-cast-player"
import { ArrowLeft } from "lucide-react"

interface ProCastSessionPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProCastSessionPage({ params }: ProCastSessionPageProps) {
  const { slug } = await params
  const session = getProCastBySlug(slug)

  if (!session) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup/pro-cast"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        What Would The Pros Do
      </Link>

      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
          {session.castTagline}
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">{session.title}</h1>
        <p className="mt-2 text-lg text-white/60">{session.subtitle}</p>
      </header>

      <ProCastPlayer session={session} />

      <section className="mt-12 border-t border-white/10 pt-8">
        <h2 className="mb-4 text-lg font-bold text-white">More Pro Casts</h2>
        <div className="flex flex-wrap gap-2">
          {PRO_CAST_SESSIONS.filter((s) => s.slug !== slug).map((s) => (
            <Link
              key={s.id}
              href={`/worldcup/pro-cast/${s.slug}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:border-red-500/30 hover:text-white"
            >
              {s.host.name}: {s.title.slice(0, 40)}…
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
