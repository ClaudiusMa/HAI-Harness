import Link from "next/link"
import { notFound } from "next/navigation"
import { getStoryBySlug } from "@/lib/worldcup/content"
import { StoryBody } from "@/components/worldcup/story-body"
import { MediaClip } from "@/components/worldcup/media-clip"
import { Badge } from "@/components/ui/badge"
import { categoryLabel } from "@/lib/worldcup/utils"
import { ArrowLeft, Clock } from "lucide-react"

interface StoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params
  const story = getStoryBySlug(slug)

  if (!story) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/worldcup/stories"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All stories
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="accent">{categoryLabel(story.category)}</Badge>
        <span className="flex items-center gap-1 text-sm text-white/40">
          <Clock className="h-3.5 w-3.5" />
          {story.readTimeMinutes} min read
        </span>
      </div>

      <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
        {story.headline}
      </h1>

      <p className="mt-4 border-l-4 border-emerald-500 pl-4 text-lg font-medium leading-snug text-emerald-300">
        {story.whyItMatters}
      </p>

      {story.media && story.media.length > 0 && (
        <div className="my-8 space-y-4">
          {story.media.map((clip, i) => (
            <MediaClip key={i} media={clip} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <StoryBody body={story.body} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-6">
        {story.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {(story.relatedMatchId || story.relatedTeamCode) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {story.relatedMatchId && (
            <Link
              href={`/worldcup/matches/${story.relatedMatchId}`}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View related match →
            </Link>
          )}
          {story.relatedTeamCode && (
            <Link
              href={`/worldcup/teams/${story.relatedTeamCode}`}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View {story.relatedTeamCode} →
            </Link>
          )}
        </div>
      )}
    </article>
  )
}
