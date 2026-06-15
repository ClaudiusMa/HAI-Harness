import type { PlayerProfile } from "@/types/worldcup-exclusives"

export const PLAYER_PROFILES: PlayerProfile[] = [
  {
    id: "player-pulisic",
    slug: "christian-pulisic",
    name: "Christian Pulisic",
    teamCode: "USA",
    position: "Winger",
    number: 10,
    hometown: "Hershey, Pennsylvania",
    localClub: "PA Classics → Borussia Dortmund academy",
    localClubStory:
      "Pulisic grew up in Hershey, PA — yes, the chocolate town — playing for PA Classics and later joining Dortmund's youth system at 16. His dad coached at Leeds United's American academy. The path from central Pennsylvania to the World Cup stage is not typical, even for American soccer.",
    worldCupStory:
      "Scored in his World Cup debut at 19. Now 27, he returns as captain for a home tournament — the player this US generation was built around, finally playing in front of the country that has debated his legacy for a decade.",
    quote:
      "I'm not trying to save American soccer. I'm trying to win a game. The rest is noise.",
    quoteContext: "Press conference before the Colombia opener, June 2026",
    audioDurationSeconds: 94,
    connections: [
      { label: "Club", detail: "AC Milan · Serie A" },
      { label: "Youth", detail: "Dortmund academy graduate" },
      { label: "Local tie-in", detail: "Pennsylvania Youth Soccer Association hall of fame, 2024" },
    ],
  },
  {
    id: "player-davies",
    slug: "alphonso-davies",
    name: "Alphonso Davies",
    teamCode: "CAN",
    position: "Left back / Winger",
    number: 19,
    hometown: "Edmonton, Alberta (via Ghana/Buduburam refugee camp)",
    localClub: "Edmonton Internationals → Whitecaps FC academy",
    localClubStory:
      "Davies was born in a refugee camp in Ghana, moved to Edmonton at age 5, and joined the Whitecaps residency program in Vancouver. Edmonton claims him. Vancouver developed him. Canada gets to watch him at home.",
    worldCupStory:
      "Scored Canada's first-ever World Cup goal in 2022. In 2026, he plays on home soil in a group with the US and Mexico — the CONCACAF reckoning everyone saw coming.",
    quote:
      "I represent a lot of people who never got this chance. That's heavier than any game.",
    quoteContext: "Interview with Serif Player Threads, May 2026",
    audioDurationSeconds: 112,
    connections: [
      { label: "Club", detail: "Bayern Munich" },
      { label: "Path", detail: "Refugee → Edmonton → Vancouver Whitecaps → Bundesliga" },
      { label: "Local tie-in", detail: "Edmonton city mural on Whyte Avenue; Whitecaps retire his academy number" },
    ],
  },
  {
    id: "player-gimenez",
    slug: "santiago-gimenez",
    name: "Santiago Giménez",
    teamCode: "MEX",
    position: "Striker",
    number: 11,
    hometown: "Buenos Aires, Argentina (Mexican parentage)",
    localClub: "Cruz Azul youth → Feyenoord",
    localClubStory:
      "Son of a Mexican league legend, Giménez came through Cruz Azul's system before Feyenoord made him a European name. Mexico sees him as the finisher this generation lacked — the poacher who makes a half-chance count.",
    worldCupStory:
      "His goal against Canada in the group opener wasn't pretty. Strikers don't care. Mexico needs nine more like it.",
    quote:
      "My father scored in Liga MX. I want to score where it echoes.",
    quoteContext: "Player Threads audio, June 2026",
    audioDurationSeconds: 78,
    connections: [
      { label: "Club", detail: "Feyenoord → AC Milan (2025)" },
      { label: "Family", detail: "Father Christian Giménez · 168 Liga MX goals" },
      { label: "Local tie-in", detail: "Cruz Azul academy product · Estadio Azteca crowd favorite" },
    ],
  },
  {
    id: "player-messi",
    slug: "lionel-messi",
    name: "Lionel Messi",
    teamCode: "ARG",
    position: "Forward",
    number: 10,
    hometown: "Rosario, Argentina",
    localClub: "Newell's Old Boys → Barcelona La Masia",
    localClubStory:
      "Messi's story begins at Newell's Old Boys in Rosario, where he was so small as a child that local clubs hesitated. Barcelona's La Masia bet on growth hormone treatment. The bet paid off.",
    worldCupStory:
      "World Cup winner in 2022 at 35. In 2026, at 38, he's playing the final act — still the reference point for every touch, every free kick, every moment Argentina expects magic.",
    quote:
      "The World Cup doesn't belong to one player. But sometimes one player belongs to the World Cup.",
    quoteContext: "Documentary excerpt · Serif licensed clip",
    audioDurationSeconds: 65,
    connections: [
      { label: "Club", detail: "Inter Miami CF" },
      { label: "Legacy", detail: "2022 World Cup champion · 8 Ballon d'Or" },
      { label: "Local tie-in", detail: "Inter Miami's Fort Lauderdale training base — 90 min from Miami World Cup host city" },
    ],
  },
]

export function getPlayerBySlug(slug: string): PlayerProfile | undefined {
  return PLAYER_PROFILES.find((p) => p.slug === slug)
}

export function getPlayersByTeam(teamCode: string): PlayerProfile[] {
  return PLAYER_PROFILES.filter((p) => p.teamCode === teamCode)
}
