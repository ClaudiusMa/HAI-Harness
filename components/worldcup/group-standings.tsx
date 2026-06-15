"use client"

import type { GroupStanding } from "@/types/worldcup"
import { TermTooltip } from "./term-tooltip"
import { useWorldCupPreferences } from "./worldcup-preferences-provider"

interface GroupStandingsProps {
  standings: GroupStanding[]
  highlightTeam?: string
}

export function GroupStandings({ standings, highlightTeam }: GroupStandingsProps) {
  const { preferences } = useWorldCupPreferences()
  const effectiveHighlight = highlightTeam ?? preferences.favoriteTeamCode ?? undefined
  const groups = [...new Set(standings.map((s) => s.group))].sort()

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const rows = standings
          .filter((s) => s.group === group)
          .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)

        return (
          <div
            key={group}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#0f1729]"
          >
            <div className="border-b border-white/10 bg-white/5 px-4 py-2">
              <h3 className="text-sm font-bold text-white">Group {group}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-white/40">
                  <th className="px-3 py-2 font-medium">Team</th>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">
                    <TermTooltip term="GD" />
                  </th>
                  <th className="px-3 py-2 text-center font-medium">
                    <TermTooltip term="Pts" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const qualified = idx < 2
                  const highlighted = effectiveHighlight === row.team.code
                  return (
                    <tr
                      key={row.team.code}
                      className={
                        highlighted
                          ? "bg-emerald-500/10"
                          : qualified
                            ? "border-l-2 border-emerald-500/50"
                            : ""
                      }
                    >
                      <td className="px-3 py-2">
                        <span className="mr-1.5" aria-hidden>
                          {row.team.flag}
                        </span>
                        <span className="font-medium text-white/90">{row.team.code}</span>
                      </td>
                      <td className="px-2 py-2 text-center text-white/60">{row.played}</td>
                      <td className="px-2 py-2 text-center text-white/60">
                        {row.goalDifference > 0 ? "+" : ""}
                        {row.goalDifference}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-white">
                        {row.points}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
