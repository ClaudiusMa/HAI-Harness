import { fetchLiveSnapshot } from "@/lib/worldcup/fifa-api"
import { LiveScoresPanel } from "@/components/worldcup/live-scores-panel"

export default async function LiveScoresPage() {
  const snapshot = await fetchLiveSnapshot()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Live Scores</h1>
        <p className="mt-2 text-white/60">
          Real-time updates streamed from FIFA data. Scores refresh automatically — no need to reload.
        </p>
      </div>
      <LiveScoresPanel initialSnapshot={snapshot} />
    </div>
  )
}
