export interface GlossaryTerm {
  term: string
  short: string
  example?: string
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  HT: {
    term: "HT",
    short: "Halftime — the 15-minute break after the first 45 minutes.",
    example: "Mexico 1–1 Canada at HT means the score at the break.",
  },
  FT: {
    term: "FT",
    short: "Full time — the match is over after 90 minutes (plus stoppage time).",
  },
  GD: {
    term: "GD",
    short: "Goal difference — goals scored minus goals allowed. Used to break ties in the group table.",
    example: "+3 means a team scored 3 more than they conceded.",
  },
  Pts: {
    term: "Pts",
    short: "Points in the group stage: 3 for a win, 1 for a draw, 0 for a loss.",
  },
  "Round of 32": {
    term: "Round of 32",
    short: "First knockout round in 2026. 32 teams remain from 48 — new for this tournament.",
  },
  xG: {
    term: "xG",
    short: "Expected goals — measures chance quality, not just shots. Higher xG usually means a team deserved more goals.",
  },
  VAR: {
    term: "VAR",
    short: "Video Assistant Referee — officials review key calls on video. Delays can happen; the on-field ref makes the final call.",
  },
  "Group stage": {
    term: "Group stage",
    short: "Each team plays 3 round-robin games. Top 2 in each group advance, plus 8 best third-place teams.",
  },
  "Extra time": {
    term: "Extra time",
    short: "Two 15-minute halves added when a knockout game is tied after 90 minutes.",
  },
  "Penalty shootout": {
    term: "Penalty shootout",
    short: "If still tied after extra time, each team takes alternating penalty kicks from 12 yards until a winner emerges.",
  },
}

export const BEGINNER_TIPS = {
  newcomer: [
    {
      title: "Start with your team's group",
      body: "Each team plays 3 group games. Wins are worth 3 points, draws 1. You don't need to understand every rule on day one — just follow the scoreboard.",
    },
    {
      title: "Halftime is 15 minutes",
      body: "Unlike American football, the clock keeps running. Stoppage time at the end of each half makes up for delays.",
    },
    {
      title: "48 teams is new",
      body: "More teams means more stories. The knockout round now starts with 32 teams, not 16 — that's the biggest format change since 1998.",
    },
  ],
  casual: [
    {
      title: "Watch the third-place race",
      body: "Eight third-place teams advance. Goal difference and goals scored decide who squeaks through.",
    },
    {
      title: "Home advantage matters",
      body: "USA, Mexico, and Canada co-host. Crowd energy and travel fatigue can swing tight games.",
    },
  ],
  diehard: [
    {
      title: "Track xG in close games",
      body: "Expected goals reveal whether a 1–0 result was tight or a fluke. Useful for bracket picks.",
    },
  ],
} as const

export const EXPERIENCE_LEVELS = [
  {
    id: "newcomer" as const,
    label: "New to soccer",
    description: "Show me the basics — I'll learn as I watch.",
    emoji: "🌱",
  },
  {
    id: "casual" as const,
    label: "Casual fan",
    description: "I watch big games but skip the fine print.",
    emoji: "⚽",
  },
  {
    id: "diehard" as const,
    label: "Diehard",
    description: "Give me stats, tactics, and minimal hand-holding.",
    emoji: "🔥",
  },
]
