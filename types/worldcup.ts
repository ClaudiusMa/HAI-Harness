export type MatchStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed"

export type TournamentStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final"

export interface Team {
  code: string
  name: string
  flag: string
  confederation: string
  fifaRank?: number
  isHost?: boolean
}

export interface MatchEvent {
  id: string
  minute: number
  type: "goal" | "own_goal" | "penalty" | "yellow_card" | "red_card" | "substitution" | "var"
  teamCode: string
  playerName: string
  detail?: string
}

export interface Match {
  id: string
  stage: TournamentStage
  group?: string
  matchday?: number
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  minute?: number
  kickoffUtc: string
  venue: string
  city: string
  country: "USA" | "MEX" | "CAN"
  events: MatchEvent[]
  /** US-friendly broadcast note */
  broadcastNote?: string
}

export interface GroupStanding {
  group: string
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface StoryMedia {
  type: "video" | "audio" | "image"
  url: string
  thumbnailUrl?: string
  durationSeconds?: number
  caption?: string
}

export interface Story {
  id: string
  slug: string
  category: "explainer" | "match" | "team" | "culture" | "rules" | "highlight"
  headline: string
  /** Axios-style "why it matters" one-liner */
  whyItMatters: string
  body: string
  readTimeMinutes: number
  publishedAt: string
  tags: string[]
  media?: StoryMedia[]
  relatedMatchId?: string
  relatedTeamCode?: string
}

export interface LiveUpdate {
  type: "score" | "event" | "status" | "heartbeat"
  matchId: string
  timestamp: string
  payload: {
    homeScore?: number
    awayScore?: number
    status?: MatchStatus
    minute?: number
    event?: MatchEvent
  }
}

export interface TournamentSnapshot {
  tournament: {
    name: string
    edition: string
    teams: number
    matches: number
    hosts: string[]
    startDate: string
    endDate: string
  }
  matches: Match[]
  standings: GroupStanding[]
  stories: Story[]
  lastUpdated: string
  dataSource: "fifa" | "mock"
}
