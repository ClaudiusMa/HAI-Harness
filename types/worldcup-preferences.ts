export type ExperienceLevel = "newcomer" | "casual" | "diehard"

export interface WorldCupPreferences {
  favoriteTeamCode: string | null
  followedTeamCodes: string[]
  experienceLevel: ExperienceLevel
  timezone: string
  notifyMatchStart: boolean
  notifyGoals: boolean
  notifyFinalScores: boolean
  showTermTooltips: boolean
  onboardingCompleted: boolean
}

export const DEFAULT_WORLDCUP_PREFERENCES: WorldCupPreferences = {
  favoriteTeamCode: "USA",
  followedTeamCodes: ["USA"],
  experienceLevel: "newcomer",
  timezone: "America/New_York",
  notifyMatchStart: true,
  notifyGoals: true,
  notifyFinalScores: true,
  showTermTooltips: true,
  onboardingCompleted: false,
}

export interface WorldCupPreferencesRow {
  id: number
  user_id: string
  favorite_team_code: string | null
  followed_team_codes: string[]
  experience_level: ExperienceLevel
  timezone: string
  notify_match_start: boolean
  notify_goals: boolean
  notify_final_scores: boolean
  show_term_tooltips: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export function rowToPreferences(row: WorldCupPreferencesRow): WorldCupPreferences {
  return {
    favoriteTeamCode: row.favorite_team_code,
    followedTeamCodes: row.followed_team_codes ?? [],
    experienceLevel: row.experience_level,
    timezone: row.timezone,
    notifyMatchStart: row.notify_match_start,
    notifyGoals: row.notify_goals,
    notifyFinalScores: row.notify_final_scores,
    showTermTooltips: row.show_term_tooltips,
    onboardingCompleted: row.onboarding_completed,
  }
}

export function preferencesToRow(prefs: Partial<WorldCupPreferences>) {
  return {
    favorite_team_code: prefs.favoriteTeamCode ?? null,
    followed_team_codes: prefs.followedTeamCodes,
    experience_level: prefs.experienceLevel,
    timezone: prefs.timezone,
    notify_match_start: prefs.notifyMatchStart,
    notify_goals: prefs.notifyGoals,
    notify_final_scores: prefs.notifyFinalScores,
    show_term_tooltips: prefs.showTermTooltips,
    onboarding_completed: prefs.onboardingCompleted,
  }
}
