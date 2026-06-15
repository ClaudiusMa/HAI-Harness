import { PITCH_REPLAYS } from "@/lib/worldcup/pitch-replays"
import { PitchReplayCard } from "@/components/worldcup/pitch/pitch-replay-card"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"

export default function PitchRoomPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-emerald-400">
          <LayoutGrid className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">The Pitch Room</span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          See the play. Hear the strategy.
        </h1>
        <p className="mt-3 text-lg text-white/60">
          During stoppages and after key moments, step onto a tactical field view. Scrub through
          set pieces, counters, and free kicks frame by frame — with commentary from former stars
          explaining what you&apos;re watching and why it worked.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-950/20 p-5">
        <p className="text-sm text-white/70">
          <strong className="text-red-300">New — What Would The Pros Do:</strong> Manning Cast-style
          alternate feed with ex-stars in the corner, live telestrator, and rules school.{" "}
          <Link href="/worldcup/pro-cast" className="font-medium text-red-400 underline hover:text-red-300">
            Try Pro Cast →
          </Link>
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
        <p className="text-sm text-white/70">
          <strong className="text-emerald-300">How to use it:</strong> Press play and watch players
          and the ball move on the pitch. Commentary syncs to the timeline — click any beat to jump
          to that moment. Perfect for learning corners, walls, and counter patterns without a
          tactics degree.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PITCH_REPLAYS.map((replay) => (
          <PitchReplayCard key={replay.id} replay={replay} />
        ))}
      </div>
    </div>
  )
}
