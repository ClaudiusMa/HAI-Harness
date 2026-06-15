import { PLAYER_PROFILES } from "@/lib/worldcup/players"
import { PlayerThreadCard } from "@/components/worldcup/players/player-thread-card"
import { Headphones } from "lucide-react"

export default function PlayersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-purple-400">
          <Headphones className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">Player Threads</span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Faces, roots, and stories behind the roster
        </h1>
        <p className="mt-3 text-lg text-white/60">
          Where they came from, which local club shaped them, and what they&apos;re carrying into
          this tournament. Audio clips and quotes — the human layer live broadcasts skip.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {PLAYER_PROFILES.map((player) => (
          <PlayerThreadCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
