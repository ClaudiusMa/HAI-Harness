import type { Story } from "@/types/worldcup"

export const STORIES: Story[] = [
  {
    id: "story-48-teams",
    slug: "48-teams-explained",
    category: "explainer",
    headline: "48 teams, 104 matches — here's what changed",
    whyItMatters:
      "The biggest World Cup ever means more games, more drama, and a knockout round that starts with 32 teams instead of 16.",
    body: `For decades, the World Cup had **32 teams** in **8 groups of 4**. Starting in 2026, FIFA expanded to **48 teams** in **12 groups of 4**.

**How you advance:** The top 2 teams from each group (24 teams) plus the **8 best third-place finishers** move on — that's **32 teams** in the knockout stage.

**What that means for you:** More matches to watch, more underdog stories, and the US gets **more home games** as a co-host. The tournament runs **39 days** across **16 host cities** in the US, Mexico, and Canada.

**The knockout bracket is new too.** Round of 32 → Round of 16 → Quarters → Semis → Final. It's the most games in World Cup history.`,
    readTimeMinutes: 3,
    publishedAt: "2026-06-01T12:00:00Z",
    tags: ["format", "beginner", "2026"],
    media: [
      {
        type: "video",
        url: "#format-video",
        thumbnailUrl: "/worldcup/format-bracket.jpg",
        durationSeconds: 90,
        caption: "How the 48-team bracket works in 90 seconds",
      },
    ],
  },
  {
    id: "story-offside",
    slug: "offside-in-60-seconds",
    category: "rules",
    headline: "Offside, explained without the yelling",
    whyItMatters:
      "It's the call that confuses every new fan — and it's simpler than the TV replays make it look.",
    body: `**Offside** stops attackers from camping next to the goal waiting for a long pass.

**Simple version:** When the ball is played to an attacker, they can't be **past the second-to-last defender** (usually the last outfield player before the keeper) unless the ball or a teammate is level with them.

**Why VAR makes it dramatic:** Cameras draw freeze-frame lines. Margins are tiny. A toe can be offside.

**What to watch for:** If the flag goes up before a goal, wait — VAR may overturn it. If you're new, trust the ref on the pitch first, then the screen.`,
    readTimeMinutes: 2,
    publishedAt: "2026-06-02T09:00:00Z",
    tags: ["rules", "beginner", "offside"],
    media: [
      {
        type: "audio",
        url: "/worldcup/audio/offside-explainer.mp3",
        durationSeconds: 62,
        caption: "60-second audio: offside for American sports fans",
      },
    ],
  },
  {
    id: "story-usmnt-opener",
    slug: "usmnt-opener-preview",
    category: "match",
    headline: "USMNT opens at MetLife — what to expect",
    whyItMatters:
      "The home opener sets the tone for the entire tournament. Here's the tactical and emotional stakes.",
    body: `The **United States** kicks off the 2026 World Cup at **MetLife Stadium** in New Jersey — the first time the US has hosted a men's World Cup opener on home soil since 1994.

**The vibe:** Expect a packed stadium, heavy security, and a crowd that knows chants but may still be learning the finer points of the game. That's fine. This tournament is built for you.

**Tactical note:** The US typically presses high in home games. Watch the **wingbacks** — they'll be key in a 4-3-3.

**Watch party tip:** Arrive early. FIFA fan fests nearby will have big screens and shorter lines before kickoff.`,
    readTimeMinutes: 4,
    publishedAt: "2026-06-10T14:00:00Z",
    tags: ["USMNT", "preview", "MetLife"],
    relatedMatchId: "wc26-001",
    relatedTeamCode: "USA",
    media: [
      {
        type: "video",
        url: "#metlife-walkthrough",
        durationSeconds: 45,
        caption: "MetLife Stadium walkthrough for first-timers",
      },
    ],
  },
  {
    id: "story-group-a",
    slug: "group-a-storylines",
    category: "team",
    headline: "Group A: hosts, neighbors, and a CONCACAF grudge match",
    whyItMatters:
      "The US shares a group with Mexico and Canada — the first time all three hosts land in the same group.",
    body: `**Group A** is the story of the tournament before a ball is kicked.

**USA vs Mexico** isn't just a rivalry — it's the most-watched soccer match in North America whenever they meet. A World Cup group stage clash is unprecedented at this scale.

**Canada** enters as the defending **2025 Gold Cup** surprise. Don't sleep on them.

**For new fans:** Group stage games award **3 points for a win, 1 for a draw**. You need results, not just vibes. Top 2 advance automatically; 3rd place might still survive.`,
    readTimeMinutes: 3,
    publishedAt: "2026-06-05T10:00:00Z",
    tags: ["Group A", "USMNT", "Mexico", "Canada"],
    relatedTeamCode: "USA",
  },
  {
    id: "story-penalties",
    slug: "penalty-shootout-guide",
    category: "rules",
    headline: "Penalty shootouts: the NFL field goal of soccer",
    whyItMatters:
      "Knockout games that are tied after 90 minutes (+ extra time) end here. Know the rules before your heart rate spikes.",
    body: `If a knockout match is **tied after extra time**, it goes to **penalties** — five kicks per team, then sudden death.

**Key differences from hockey shootouts:** All kicks are from the same spot (12 yards out). Players who were on the pitch at the final whistle can take kicks. Substitutes included.

**Drama factor:** Goalkeepers who save two often become national heroes. Misses haunt careers. It's cruel and perfect.

**US angle:** The US has a mixed shootout history. If you're watching with casual friends, this is the moment to explain that **it's not random** — it's nerve management.`,
    readTimeMinutes: 2,
    publishedAt: "2026-06-03T11:00:00Z",
    tags: ["rules", "knockout", "beginner"],
    media: [
      {
        type: "audio",
        url: "/worldcup/audio/penalties-explainer.mp3",
        durationSeconds: 55,
        caption: "Penalty shootout rules in under a minute",
      },
    ],
  },
  {
    id: "story-fan-fest",
    slug: "fan-fest-guide",
    category: "culture",
    headline: "Fan Fests: the best seat when you don't have a ticket",
    whyItMatters:
      "Official FIFA Fan Fest sites are the easiest on-ramp for new fans — big screens, food, and zero need to know the offside rule.",
    body: `Every host city runs a **FIFA Fan Fest** — free or low-cost public viewing with giant screens, music, and local food.

**Best for newcomers:** Atmosphere without $400 tickets. Arrive 2 hours before kickoff for US matches.

**Host cities with Fan Fests:** Atlanta, Boston, Dallas, Houston, Kansas City, Los Angeles, Miami, New York/New Jersey, Philadelphia, San Francisco Bay Area, Seattle, and Toronto, Vancouver, Mexico City, Guadalajara, Monterrey.

**Pro tip:** Download the official FIFA app for live scores even when you're in the crowd. Cell networks get crushed.`,
    readTimeMinutes: 3,
    publishedAt: "2026-06-04T08:00:00Z",
    tags: ["fan fest", "travel", "beginner"],
  },
  {
    id: "story-xg",
    slug: "expected-goals-for-new-fans",
    category: "explainer",
    headline: "xG: the stat that tells you if a game was \"deserved\"",
    whyItMatters:
      "Expected goals (xG) helps you sound smart at the watch party without pretending you watched every minute.",
    body: `**Expected goals (xG)** measures the quality of chances — not just shots on target.

A tap-in from 2 yards might be **0.8 xG** (80% chance of scoring). A 35-yard screamer might be **0.02 xG**.

**Why it matters:** A team can lose 1-0 while having **2.1 xG** vs their opponent's **0.4 xG**. They were unlucky, not necessarily bad.

**For US fans coming from baseball:** Think of xG like **FIP** for pitchers — it strips out luck to show underlying performance.`,
    readTimeMinutes: 2,
    publishedAt: "2026-06-06T15:00:00Z",
    tags: ["stats", "xG", "beginner"],
  },
  {
    id: "story-highlight-goal",
    slug: "goal-of-the-day-template",
    category: "highlight",
    headline: "⚽ Goal of the Day: Pulisic curls one into the far corner",
    whyItMatters:
      "A 23-yard strike that silenced MetLife — and put the US on top in the opener.",
    body: `**67' — Christian Pulisic (USA)**

Pulisic cuts inside on his right foot, beats one defender, and **curls a shot into the top corner**. The keeper had no chance.

**Context:** The US had been pinned for 10 minutes. This was their first shot on target in the half. Classic counter-punch.

**Watch the clip** below — 18 seconds of pure noise.`,
    readTimeMinutes: 1,
    publishedAt: "2026-06-11T22:30:00Z",
    tags: ["highlight", "USMNT", "Pulisic"],
    relatedMatchId: "wc26-001",
    relatedTeamCode: "USA",
    media: [
      {
        type: "video",
        url: "#pulisic-goal",
        durationSeconds: 18,
        caption: "Pulisic goal — 18 sec highlight",
      },
    ],
  },
]

export function getStoryBySlug(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug)
}

export function getStoriesByCategory(category: Story["category"]): Story[] {
  return STORIES.filter((s) => s.category === category)
}
