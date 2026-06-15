import Link from "next/link"
import type { LongformFeature } from "@/types/worldcup-exclusives"

interface LongformCardProps {
  feature: LongformFeature
  featured?: boolean
}

export function LongformCard({ feature, featured = false }: LongformCardProps) {
  return (
    <article
      className={
        featured
          ? "group rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#0f1729] p-8"
          : "group rounded-xl border border-white/10 bg-[#0f1729] p-6 transition-colors hover:border-white/20"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
        Serif Dispatch
      </p>
      <Link href={`/worldcup/dispatch/${feature.slug}`}>
        <h3
          className={
            featured
              ? "mt-3 font-serif text-3xl font-bold leading-tight text-white group-hover:text-amber-100"
              : "mt-2 font-serif text-xl font-bold leading-snug text-white group-hover:text-amber-100"
          }
        >
          {feature.headline}
        </h3>
      </Link>
      <p className="mt-3 text-base leading-relaxed text-white/60">{feature.dek}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/40">
        <span>{feature.author}</span>
        <span>·</span>
        <span>{feature.readTimeMinutes} min read</span>
      </div>
    </article>
  )
}

interface LongformArticleProps {
  feature: LongformFeature
}

export function LongformArticle({ feature }: LongformArticleProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-10 border-b border-white/10 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Serif Dispatch · Long read
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
          {feature.headline}
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-white/60">{feature.dek}</p>
        <div className="mt-6 flex items-center gap-4 text-sm text-white/40">
          <div>
            <span className="font-medium text-white/70">{feature.author}</span>
            <span className="block text-xs">{feature.authorRole}</span>
          </div>
          <span>·</span>
          <span>{feature.readTimeMinutes} min read</span>
        </div>
      </header>

      <div className="longform-body space-y-6">
        {feature.sections.map((section, i) => {
          if (section.type === "paragraph") {
            return (
              <p
                key={i}
                className={`text-lg leading-[1.8] text-white/80 ${i === 0 ? "longform-dropcap" : ""}`}
              >
                {section.content as string}
              </p>
            )
          }
          if (section.type === "pullquote") {
            return (
              <blockquote
                key={i}
                className="my-10 border-l-4 border-amber-500/60 py-2 pl-6 font-serif text-2xl font-medium leading-snug text-white/90"
              >
                {section.content as string}
              </blockquote>
            )
          }
          if (section.type === "heading") {
            return (
              <h2 key={i} className="pt-4 font-serif text-2xl font-bold text-white">
                {section.content as string}
              </h2>
            )
          }
          if (section.type === "list") {
            return (
              <ul key={i} className="space-y-2 pl-6">
                {(section.content as string[]).map((item, j) => (
                  <li key={j} className="list-disc text-lg leading-relaxed text-white/80">
                    {item}
                  </li>
                ))}
              </ul>
            )
          }
          return null
        })}
      </div>
    </article>
  )
}
