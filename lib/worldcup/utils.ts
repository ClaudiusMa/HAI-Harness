import type { Match, MatchStatus, TournamentStage } from "@/types/worldcup"

const STAGE_LABELS: Record<TournamentStage, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-Final",
  semi_final: "Semi-Final",
  third_place: "Third Place",
  final: "Final",
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "Scheduled",
  live: "LIVE",
  halftime: "HT",
  finished: "FT",
  postponed: "Postponed",
}

export function formatStage(stage: TournamentStage, group?: string): string {
  if (stage === "group" && group) return `Group ${group}`
  return STAGE_LABELS[stage]
}

export function formatStatus(status: MatchStatus): string {
  return STATUS_LABELS[status]
}

export function formatKickoffET(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoUtc))
}

export function formatKickoffTime(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoUtc))
}

export function isLiveMatch(match: Match): boolean {
  return match.status === "live" || match.status === "halftime"
}

export function getScoreDisplay(match: Match): string {
  if (match.homeScore === null || match.awayScore === null) return "–"
  return `${match.homeScore} – ${match.awayScore}`
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    explainer: "Explainer",
    match: "Match",
    team: "Team",
    culture: "Culture",
    rules: "Rules",
    highlight: "Highlight",
  }
  return labels[category] ?? category
}
