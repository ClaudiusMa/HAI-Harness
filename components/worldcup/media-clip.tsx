import type { StoryMedia } from "@/types/worldcup"
import { Headphones, Play } from "lucide-react"

interface MediaClipProps {
  media: StoryMedia
}

export function MediaClip({ media }: MediaClipProps) {
  if (media.type === "video") {
    const isYoutube = media.url.includes("youtube.com") || media.url.includes("youtu.be")
    const isPlaceholder = media.url.startsWith("#") || media.url === ""

    return (
      <figure className="overflow-hidden rounded-xl border border-white/10">
        {isPlaceholder ? (
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[#1a2744] to-[#0a0f1a]">
            <div className="text-center px-6">
              <Play className="mx-auto h-12 w-12 text-white/30" />
              <p className="mt-3 text-sm font-medium text-white/60">
                {media.caption ?? "Highlight clip"}
              </p>
              <p className="mt-1 text-xs text-white/30">
                FIFA highlight · {media.durationSeconds ?? 0}s
              </p>
            </div>
          </div>
        ) : isYoutube ? (
          <div className="relative aspect-video bg-black">
            <iframe
              src={media.url}
              title={media.caption ?? "Video clip"}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            src={media.url}
            controls
            poster={media.thumbnailUrl}
            className="aspect-video w-full bg-black"
          />
        )}
        {media.caption && (
          <figcaption className="flex items-center gap-2 bg-white/5 px-4 py-2 text-xs text-white/60">
            <Play className="h-3 w-3" />
            {media.caption}
            {media.durationSeconds && (
              <span className="ml-auto text-white/30">
                {media.durationSeconds}s
              </span>
            )}
          </figcaption>
        )}
      </figure>
    )
  }

  if (media.type === "audio") {
    return (
      <figure className="rounded-xl border border-white/10 bg-white/5 p-4">
        <figcaption className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
          <Headphones className="h-4 w-4 text-emerald-400" />
          {media.caption ?? "Audio clip"}
          {media.durationSeconds && (
            <span className="ml-auto text-xs text-white/40">
              {media.durationSeconds}s
            </span>
          )}
        </figcaption>
        <audio src={media.url} controls className="w-full" preload="metadata">
          Your browser does not support audio playback.
        </audio>
      </figure>
    )
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.url}
        alt={media.caption ?? ""}
        className="aspect-video w-full object-cover"
      />
      {media.caption && (
        <figcaption className="px-4 py-2 text-xs text-white/60">{media.caption}</figcaption>
      )}
    </figure>
  )
}
