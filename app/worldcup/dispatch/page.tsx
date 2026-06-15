import { LONGFORM_FEATURES } from "@/lib/worldcup/longform"
import { LongformCard } from "@/components/worldcup/longform/longform-article"
import { Newspaper } from "lucide-react"

export default function DispatchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-amber-400">
          <Newspaper className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">Serif Dispatch</span>
        </div>
        <h1 className="font-serif text-4xl font-black text-white">
          The tournament, in depth
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-white/60">
          Not recaps. Not rankings. Long-form writing on what this World Cup means — the culture,
          the format, the players carrying weight nobody sees on TV. Think The Atlantic meets The
          Ringer, obsessed with 2026.
        </p>
      </div>

      <div className="space-y-8">
        <LongformCard feature={LONGFORM_FEATURES[0]} featured />
        {LONGFORM_FEATURES.slice(1).map((feature) => (
          <LongformCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  )
}
