import { fetchLiveSnapshot } from "@/lib/worldcup/fifa-api"
import { GroupStandings } from "@/components/worldcup/group-standings"

export default async function StandingsPage() {
  const snapshot = await fetchLiveSnapshot()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Group Standings</h1>
        <p className="mt-2 text-white/60">
          Top 2 from each group advance. 8 best third-place teams join them in the Round of 32.
        </p>
      </div>
      <GroupStandings standings={snapshot.standings} />
    </div>
  )
}
