import type { PitchReplay } from "@/types/worldcup-exclusives"

export const PITCH_REPLAYS: PitchReplay[] = [
  {
    id: "replay-usa-corner",
    slug: "usa-corner-breakdown",
    title: "The corner that changed the opener",
    subtitle: "Watch the run, the block, and the second-ball finish frame by frame",
    matchLabel: "USA 2–1 COL · Group A · 67'",
    minute: 67,
    type: "corner",
    homeTeamCode: "USA",
    awayTeamCode: "COL",
    durationSeconds: 12,
    takeaway:
      "The US didn't win the first header — they won the space between Colombia's second line and the keeper. That's set-piece design, not luck.",
    frames: [
      {
        time: 0,
        ball: { x: 98, y: 15 },
        phase: "Corner setup",
        players: [
          { id: "gk-a", team: "away", label: "GK", x: 95, y: 50 },
          { id: "cb1", team: "away", x: 88, y: 42 },
          { id: "cb2", team: "away", x: 88, y: 58 },
          { id: "us9", team: "home", label: "9", x: 82, y: 48 },
          { id: "us10", team: "home", label: "10", x: 78, y: 35 },
          { id: "us7", team: "home", label: "7", x: 75, y: 62 },
        ],
      },
      {
        time: 2,
        ball: { x: 90, y: 44 },
        phase: "Near-post flick",
        players: [
          { id: "gk-a", team: "away", label: "GK", x: 94, y: 46 },
          { id: "cb1", team: "away", x: 87, y: 40 },
          { id: "us9", team: "home", label: "9", x: 86, y: 44 },
          { id: "us10", team: "home", label: "10", x: 84, y: 38 },
          { id: "us7", team: "home", label: "7", x: 80, y: 55 },
        ],
      },
      {
        time: 4,
        ball: { x: 92, y: 52 },
        phase: "Second ball drops",
        players: [
          { id: "gk-a", team: "away", label: "GK", x: 93, y: 50 },
          { id: "us7", team: "home", label: "7", x: 88, y: 52 },
          { id: "us19", team: "home", label: "19", x: 85, y: 58 },
          { id: "cb2", team: "away", x: 86, y: 56 },
        ],
      },
      {
        time: 6,
        ball: { x: 94, y: 54 },
        phase: "Balogun arrives",
        players: [
          { id: "gk-a", team: "away", label: "GK", x: 94, y: 52 },
          { id: "us19", team: "home", label: "19", x: 92, y: 54 },
          { id: "cb2", team: "away", x: 89, y: 53 },
        ],
      },
      {
        time: 8,
        ball: { x: 97, y: 51 },
        phase: "GOAL",
        players: [
          { id: "gk-a", team: "away", label: "GK", x: 96, y: 54 },
          { id: "us19", team: "home", label: "19", x: 95, y: 50 },
        ],
      },
    ],
    commentary: [
      {
        time: 0,
        speaker: "Claudio Reyna",
        speakerTitle: "Former USMNT captain · Set-piece analyst",
        type: "strategy",
        text: "Watch the near-post runner — he's not trying to score. He's trying to disrupt the keeper's line of sight. That's a decoy run.",
      },
      {
        time: 4,
        speaker: "Claudio Reyna",
        speakerTitle: "Former USMNT captain · Set-piece analyst",
        type: "strategy",
        text: "Colombia's second line steps out. That leaves the penalty spot open. Balogun's timing is deliberate — he starts his run when the ball is in the air, not before.",
      },
      {
        time: 8,
        speaker: "Claudio Reyna",
        speakerTitle: "Former USMNT captain · Set-piece analyst",
        type: "reaction",
        text: "That's a rehearsed pattern. The US staff has been drawing this exact sequence on the whiteboard for two weeks.",
      },
    ],
  },
  {
    id: "replay-arg-free-kick",
    slug: "messi-free-kick-wall",
    title: "How Argentina built the wall — and beat it anyway",
    subtitle: "Free kick geometry: spacing, jump timing, and the gap they missed",
    matchLabel: "ARG 3–0 SEN · Group C · 8'",
    minute: 8,
    type: "free_kick",
    homeTeamCode: "ARG",
    awayTeamCode: "SEN",
    durationSeconds: 10,
    takeaway:
      "Senegal's wall jumped too early. Messi struck under it — the oldest trick in the book, executed at World Cup speed.",
    frames: [
      {
        time: 0,
        ball: { x: 72, y: 38 },
        phase: "Free kick · 22 yards",
        players: [
          { id: "wall1", team: "away", x: 78, y: 42 },
          { id: "wall2", team: "away", x: 78, y: 48 },
          { id: "wall3", team: "away", x: 78, y: 54 },
          { id: "gk-s", team: "away", label: "GK", x: 92, y: 50 },
          { id: "messi", team: "home", label: "10", x: 70, y: 40 },
        ],
      },
      {
        time: 3,
        ball: { x: 74, y: 38 },
        phase: "Wall jumps",
        players: [
          { id: "wall1", team: "away", x: 78, y: 38 },
          { id: "wall2", team: "away", x: 78, y: 44 },
          { id: "wall3", team: "away", x: 78, y: 50 },
          { id: "messi", team: "home", label: "10", x: 71, y: 40 },
        ],
      },
      {
        time: 5,
        ball: { x: 82, y: 46 },
        phase: "Ball under wall",
        players: [
          { id: "wall1", team: "away", x: 78, y: 36 },
          { id: "wall2", team: "away", x: 78, y: 42 },
          { id: "gk-s", team: "away", label: "GK", x: 90, y: 48 },
          { id: "messi", team: "home", label: "10", x: 72, y: 40 },
        ],
      },
      {
        time: 8,
        ball: { x: 96, y: 50 },
        phase: "GOAL",
        players: [
          { id: "gk-s", team: "away", label: "GK", x: 95, y: 52 },
          { id: "messi", team: "home", label: "10", x: 74, y: 40 },
        ],
      },
    ],
    commentary: [
      {
        time: 0,
        speaker: "Marta Vieira da Silva",
        speakerTitle: "World Cup legend · Technical analyst",
        type: "strategy",
        text: "The wall is four yards from the ball. Senegal needs one more body — that gap on the near side is exactly where Messi wants it.",
      },
      {
        time: 3,
        speaker: "Marta Vieira da Silva",
        speakerTitle: "World Cup legend · Technical analyst",
        type: "strategy",
        text: "They jump on his first step. He waits half a beat. The ball goes under, not over. That's reading the wall, not just striking.",
      },
      {
        time: 8,
        speaker: "Marta Vieira da Silva",
        speakerTitle: "World Cup legend · Technical analyst",
        type: "reaction",
        text: "Penalty from that range is 80%+ conversion. Messi just made it 81%.",
      },
    ],
  },
  {
    id: "replay-bra-counter",
    slug: "brazil-counter-press",
    title: "Brazil's 8-second counter",
    subtitle: "From Morocco turnover to shot — watch the lanes open",
    matchLabel: "BRA 0–0 MAR · Group B · 52'",
    minute: 52,
    type: "counter",
    homeTeamCode: "BRA",
    awayTeamCode: "MAR",
    durationSeconds: 8,
    takeaway:
      "Counterattacks aren't about speed alone — they're about vertical passes into space before the defense resets.",
    frames: [
      {
        time: 0,
        ball: { x: 35, y: 55 },
        phase: "Turnover in midfield",
        players: [
          { id: "br8", team: "home", label: "8", x: 38, y: 52 },
          { id: "br10", team: "home", label: "10", x: 45, y: 40 },
          { id: "mo7", team: "away", x: 40, y: 58 },
        ],
      },
      {
        time: 2,
        ball: { x: 52, y: 42 },
        phase: "First pass forward",
        players: [
          { id: "br8", team: "home", label: "8", x: 42, y: 50 },
          { id: "br10", team: "home", label: "10", x: 50, y: 42 },
          { id: "br9", team: "home", label: "9", x: 62, y: 38 },
        ],
      },
      {
        time: 4,
        ball: { x: 68, y: 35 },
        phase: "Wide runner",
        players: [
          { id: "br10", team: "home", label: "10", x: 58, y: 40 },
          { id: "br11", team: "home", label: "11", x: 72, y: 28 },
          { id: "br9", team: "home", label: "9", x: 70, y: 48 },
        ],
      },
      {
        time: 6,
        ball: { x: 82, y: 32 },
        phase: "Crossing position",
        players: [
          { id: "br11", team: "home", label: "11", x: 85, y: 30 },
          { id: "br9", team: "home", label: "9", x: 82, y: 48 },
          { id: "gk-m", team: "away", label: "GK", x: 94, y: 50 },
        ],
      },
    ],
    commentary: [
      {
        time: 0,
        speaker: "Thierry Henry",
        speakerTitle: "Former France striker · Counter-attack specialist",
        type: "strategy",
        text: "Morocco commits seven players forward on the corner. When they lose it, the pitch is tilted. Brazil doesn't dribble — they pass through.",
      },
      {
        time: 4,
        speaker: "Thierry Henry",
        speakerTitle: "Former France striker · Counter-attack specialist",
        type: "strategy",
        text: "See the winger? He starts his run when the ball is at his feet, not before. That half-second keeps him onside and stretches the back line.",
      },
    ],
  },
]

export function getPitchReplayBySlug(slug: string): PitchReplay | undefined {
  return PITCH_REPLAYS.find((r) => r.slug === slug)
}
