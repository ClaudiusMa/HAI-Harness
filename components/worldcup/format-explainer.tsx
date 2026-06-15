import { FORMAT_GROUPS } from "@/lib/worldcup/seed-data"
import { getTeamByCode } from "@/lib/worldcup/teams"

const KNOCKOUT_ROUNDS = [
  { round: "Round of 32", teams: 32, note: "Top 2 per group + 8 best 3rd-place teams" },
  { round: "Round of 16", teams: 16, note: "Winners advance" },
  { round: "Quarter-Finals", teams: 8, note: "The serious business begins" },
  { round: "Semi-Finals", teams: 4, note: "Two games from the final" },
  { round: "Third Place", teams: 2, note: "Bronze medal match" },
  { round: "Final", teams: 2, note: "MetLife Stadium, July 19" },
]

export function FormatExplainer() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { stat: "48", label: "Teams", detail: "Up from 32 in 2022" },
          { stat: "12", label: "Groups", detail: "4 teams each" },
          { stat: "104", label: "Matches", detail: "Most in World Cup history" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-[#0f1729] p-6 text-center"
          >
            <div className="text-4xl font-black text-emerald-400">{item.stat}</div>
            <div className="mt-1 text-lg font-bold text-white">{item.label}</div>
            <div className="mt-1 text-sm text-white/50">{item.detail}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">How advancement works</h2>
        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-6">
          <ol className="space-y-4">
            {[
              "12 groups of 4 teams play 3 matches each (round-robin within the group).",
              "Top 2 teams from each group automatically advance (24 teams).",
              "The 8 best third-place teams also advance — ranked by points, goal difference, goals scored.",
              "32 teams enter the knockout bracket: Round of 32 → Round of 16 → Quarters → Semis → Final.",
              "Knockout games tied after 90 minutes go to 30 minutes of extra time, then penalties.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4 text-white/80">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">Knockout bracket</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KNOCKOUT_ROUNDS.map((round) => (
            <div
              key={round.round}
              className="rounded-xl border border-white/10 bg-[#0f1729] p-4"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-white">{round.round}</h3>
                <span className="text-2xl font-black text-white/20">{round.teams}</span>
              </div>
              <p className="mt-1 text-sm text-white/50">{round.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-white">Sample groups (A–L)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FORMAT_GROUPS.map((group) => (
            <div
              key={group.letter}
              className="rounded-xl border border-white/10 bg-[#0f1729] p-4"
            >
              <h3 className="mb-3 text-sm font-bold text-emerald-400">
                Group {group.letter}
              </h3>
              <ul className="space-y-2">
                {group.teams.map((code) => {
                  const team = getTeamByCode(code)
                  return (
                    <li key={code} className="flex items-center gap-2 text-sm text-white/80">
                      <span>{team?.flag ?? "🏳️"}</span>
                      <span>{team?.name ?? code}</span>
                      {team?.isHost && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
                          Host
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          Sample group assignments for illustration. Official draw determines final groups.
        </p>
      </section>
    </div>
  )
}
