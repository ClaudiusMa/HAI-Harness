import type { Team } from "@/types/worldcup"

export const HOST_TEAMS: Team[] = [
  { code: "USA", name: "United States", flag: "🇺🇸", confederation: "CONCACAF", fifaRank: 11, isHost: true },
  { code: "MEX", name: "Mexico", flag: "🇲🇽", confederation: "CONCACAF", fifaRank: 14, isHost: true },
  { code: "CAN", name: "Canada", flag: "🇨🇦", confederation: "CONCACAF", fifaRank: 41, isHost: true },
]

export const SAMPLE_TEAMS: Team[] = [
  ...HOST_TEAMS,
  { code: "BRA", name: "Brazil", flag: "🇧🇷", confederation: "CONMEBOL", fifaRank: 3 },
  { code: "ARG", name: "Argentina", flag: "🇦🇷", confederation: "CONMEBOL", fifaRank: 1 },
  { code: "FRA", name: "France", flag: "🇫🇷", confederation: "UEFA", fifaRank: 2 },
  { code: "ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA", fifaRank: 4 },
  { code: "ESP", name: "Spain", flag: "🇪🇸", confederation: "UEFA", fifaRank: 8 },
  { code: "GER", name: "Germany", flag: "🇩🇪", confederation: "UEFA", fifaRank: 13 },
  { code: "JPN", name: "Japan", flag: "🇯🇵", confederation: "AFC", fifaRank: 17 },
  { code: "KOR", name: "South Korea", flag: "🇰🇷", confederation: "AFC", fifaRank: 23 },
  { code: "MAR", name: "Morocco", flag: "🇲🇦", confederation: "CAF", fifaRank: 12 },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", confederation: "CAF", fifaRank: 18 },
  { code: "AUS", name: "Australia", flag: "🇦🇺", confederation: "AFC", fifaRank: 24 },
  { code: "COL", name: "Colombia", flag: "🇨🇴", confederation: "CONMEBOL", fifaRank: 9 },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", confederation: "CONMEBOL", fifaRank: 15 },
  { code: "NED", name: "Netherlands", flag: "🇳🇱", confederation: "UEFA", fifaRank: 7 },
  { code: "POR", name: "Portugal", flag: "🇵🇹", confederation: "UEFA", fifaRank: 6 },
]

export function getTeamByCode(code: string): Team | undefined {
  return SAMPLE_TEAMS.find((t) => t.code === code)
}
