import { STORIES } from "@/lib/worldcup/content"
import { StoryCard } from "@/components/worldcup/story-card"
import { categoryLabel } from "@/lib/worldcup/utils"

const CATEGORIES = ["explainer", "rules", "match", "team", "culture", "highlight"] as const

export default function StoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Axios-style coverage
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Stories & explainers</h1>
        <p className="mt-3 text-lg text-white/60">
          Short, smart takes on the tournament. Why it matters first, details second.
          Audio and video clips included.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60"
          >
            {categoryLabel(cat)}
          </span>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {STORIES.map((story, i) => (
          <StoryCard key={story.id} story={story} featured={i === 0} />
        ))}
      </div>
    </div>
  )
}
