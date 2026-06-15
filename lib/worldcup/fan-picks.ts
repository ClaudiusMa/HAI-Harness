import type { FanPickQuestion } from "@/types/worldcup-exclusives"

/** Fan Stakes — social prediction pool (no real money; reputation points only) */

export const FAN_PICK_QUESTIONS: FanPickQuestion[] = [
  {
    id: "pick-group-a-winner",
    label: "Who wins Group A?",
    closesAt: "2026-06-14T23:59:59Z",
    options: [
      { id: "usa", label: "United States", teamCode: "USA" },
      { id: "mex", label: "Mexico", teamCode: "MEX" },
      { id: "can", label: "Canada", teamCode: "CAN" },
      { id: "col", label: "Colombia", teamCode: "COL" },
    ],
  },
  {
    id: "pick-golden-boot",
    label: "Golden Boot (top scorer)",
    closesAt: "2026-06-11T19:00:00Z",
    options: [
      { id: "mbappe", label: "Kylian Mbappé" },
      { id: "haaland", label: "Erling Haaland" },
      { id: "messi", label: "Lionel Messi" },
      { id: "pulisic", label: "Christian Pulisic" },
      { id: "other", label: "Someone else" },
    ],
  },
  {
    id: "pick-usa-knockout",
    label: "How far does the US go?",
    closesAt: "2026-06-11T19:00:00Z",
    options: [
      { id: "group", label: "Out in the group" },
      { id: "r32", label: "Round of 32" },
      { id: "r16", label: "Round of 16" },
      { id: "qf", label: "Quarter-finals or further" },
    ],
  },
  {
    id: "pick-upset",
    label: "Biggest group-stage upset?",
    closesAt: "2026-06-20T23:59:59Z",
    options: [
      { id: "sen-arg", label: "Senegal beats Argentina" },
      { id: "kor-ger", label: "South Korea beats Germany" },
      { id: "aus-fra", label: "Australia beats France" },
      { id: "none", label: "No major upset" },
    ],
  },
  {
    id: "pick-champion",
    label: "Your champion pick (bracket lock)",
    closesAt: "2026-06-11T19:00:00Z",
    options: [
      { id: "bra", label: "Brazil", teamCode: "BRA" },
      { id: "fra", label: "France", teamCode: "FRA" },
      { id: "arg", label: "Argentina", teamCode: "ARG" },
      { id: "eng", label: "England", teamCode: "ENG" },
      { id: "usa", label: "United States", teamCode: "USA" },
      { id: "other", label: "Another team" },
    ],
  },
]

export const DEMO_LEADERBOARD = [
  { rank: 1, name: "MetLifeRegular", points: 420, streak: 5 },
  { rank: 2, name: "xG_Mom", points: 385, streak: 3 },
  { rank: 3, name: "You", points: 340, streak: 2, isUser: true },
  { rank: 4, name: "OffsideOrNot", points: 310, streak: 1 },
  { rank: 5, name: "GroupStageHero", points: 295, streak: 4 },
]

export const FAN_STAKES_RULES = [
  "No real money — Fan Stakes is a reputation game among friends and the Serif community.",
  "Lock picks before kickoff. Late picks don't count.",
  "Points: 10 for group winners, 25 for knockout rounds, 50 for champion.",
  "Streak bonus: +5 for each consecutive matchday with a correct pick.",
]
