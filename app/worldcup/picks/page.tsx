import { FanStakesBoard } from "@/components/worldcup/picks/fan-stakes-board"
import { Trophy } from "lucide-react"

export default function FanPicksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-amber-400">
          <Trophy className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">Fan Stakes</span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Stake your reputation, not your wallet
        </h1>
        <p className="mt-3 text-lg text-white/60">
          Lock picks on groups, upsets, and your champion. Climb the leaderboard with friends.
          Real-money betting needs a licensed partner — Fan Stakes is the social layer that makes
          watching every matchday matter.
        </p>
      </div>

      <FanStakesBoard />
    </div>
  )
}
