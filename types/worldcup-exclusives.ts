/** Coordinates on a 0–100 pitch (left=own goal, right=opponent goal) */

export interface PitchPoint {
  x: number
  y: number
}

export interface PitchPlayer {
  id: string
  team: "home" | "away"
  label?: string
  x: number
  y: number
}

export interface PitchFrame {
  time: number
  ball: PitchPoint
  players: PitchPlayer[]
  phase?: string
}

export interface CommentaryBeat {
  time: number
  speaker: string
  speakerTitle: string
  text: string
  type: "strategy" | "story" | "reaction" | "rule" | "what_if" | "first_wc"
  telestratorIds?: string[]
}

export type TelestratorType =
  | "arrow"
  | "circle"
  | "line"
  | "zone"
  | "offside_line"
  | "run_path"

export interface TelestratorAnnotation {
  id: string
  startTime: number
  endTime: number
  type: TelestratorType
  from?: PitchPoint
  to?: PitchPoint
  center?: PitchPoint
  radius?: number
  points?: PitchPoint[]
  label?: string
  color?: string
}

export interface ProCastHost {
  name: string
  title: string
  initials: string
  accentColor: string
  firstWorldCup?: string
  bio: string
}

export interface ProCastSession {
  id: string
  slug: string
  title: string
  subtitle: string
  matchLabel: string
  minute: number
  type: "corner" | "free_kick" | "counter" | "penalty" | "build_up" | "offside"
  homeTeamCode: string
  awayTeamCode: string
  durationSeconds: number
  host: ProCastHost
  frames: PitchFrame[]
  annotations: TelestratorAnnotation[]
  commentary: CommentaryBeat[]
  takeaway: string
  /** Manning Cast-style hook */
  castTagline: string
}

export interface PitchReplay {
  id: string
  slug: string
  title: string
  subtitle: string
  matchLabel: string
  minute: number
  type: "corner" | "free_kick" | "counter" | "penalty" | "build_up"
  homeTeamCode: string
  awayTeamCode: string
  durationSeconds: number
  frames: PitchFrame[]
  commentary: CommentaryBeat[]
  takeaway: string
}

export interface LongformFeature {
  id: string
  slug: string
  headline: string
  dek: string
  author: string
  authorRole: string
  readTimeMinutes: number
  publishedAt: string
  heroImage?: string
  sections: LongformSection[]
  relatedTeamCodes?: string[]
}

export interface LongformSection {
  type: "paragraph" | "pullquote" | "heading" | "list"
  content: string | string[]
}

export interface PlayerProfile {
  id: string
  slug: string
  name: string
  teamCode: string
  position: string
  number: number
  hometown: string
  localClub: string
  localClubStory: string
  worldCupStory: string
  quote: string
  quoteContext: string
  audioClipUrl?: string
  audioDurationSeconds?: number
  connections: PlayerConnection[]
}

export interface PlayerConnection {
  label: string
  detail: string
}

export interface FanPickQuestion {
  id: string
  label: string
  options: { id: string; label: string; teamCode?: string }[]
  closesAt: string
}

export interface FanPickEntry {
  questionId: string
  optionId: string
  submittedAt: string
}

export interface FanPickPool {
  userPoints: number
  rank: number
  totalPlayers: number
  streak: number
}
