import Link from "next/link"
import type { Story } from "@/types/worldcup"
import { Badge } from "@/components/ui/badge"
import { categoryLabel } from "@/lib/worldcup/utils"
import { Clock, Headphones, Play } from "lucide-react"

interface StoryCardProps {
  story: Story
  featured?: boolean
}

export function StoryCard({ story, featured = false }: StoryCardProps) {
  const hasVideo = story.media?.some((m) => m.type === "video")
  const hasAudio = story.media?.some((m) => m.type === "audio")

  return (
    <article
      className={
        featured
          ? "rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2744] to-[#0f1729] p-6"
          : "rounded-xl border border-white/10 bg-[#0f1729] p-5 transition-colors hover:border-white/20"
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="accent" className="text-[10px] uppercase tracking-wider">
          {categoryLabel(story.category)}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          {story.readTimeMinutes} min read
        </span>
        {hasVideo && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Play className="h-3 w-3" />
            Video
          </span>
        )}
        {hasAudio && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Headphones className="h-3 w-3" />
            Audio
          </span>
        )}
      </div>

      <Link href={`/worldcup/stories/${story.slug}`}>
        <h3
          className={
            featured
              ? "mb-2 text-2xl font-bold leading-tight text-white group-hover:underline"
              : "mb-2 text-lg font-bold leading-snug text-white"
          }
        >
          {story.headline}
        </h3>
      </Link>

      <p className="mb-3 border-l-2 border-emerald-500 pl-3 text-sm font-medium leading-snug text-emerald-300/90">
        {story.whyItMatters}
      </p>

      <p className="line-clamp-3 text-sm leading-relaxed text-white/60">
        {story.body.replace(/\*\*/g, "")}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {story.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}
