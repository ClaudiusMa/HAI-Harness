import type { LongformFeature } from "@/types/worldcup-exclusives"

export const LONGFORM_FEATURES: LongformFeature[] = [
  {
    id: "lf-host-nation",
    slug: "what-hosting-does-to-a-country",
    headline: "What hosting a World Cup actually does to a country",
    dek: "The 1994 tournament didn't make America a soccer nation overnight. 2026 won't either — but the shape of the change will be different.",
    author: "Elena Vasquez",
    authorRole: "Serif Dispatch · Culture & sport",
    readTimeMinutes: 14,
    publishedAt: "2026-05-28T08:00:00Z",
    relatedTeamCodes: ["USA", "MEX", "CAN"],
    sections: [
      {
        type: "paragraph",
        content:
          "Every four years, someone writes that this World Cup will finally convert America. They wrote it in 1994, when the Rose Bowl filled and Diana Ross missed a penalty in the opening ceremony. They wrote it again in 2014, when record TV ratings followed the USMNT out of the group. The conversion never came — or rather, it came in fragments, unevenly, in ways that don't fit a single headline.",
      },
      {
        type: "pullquote",
        content:
          "Hosting doesn't create fans. It creates permission — permission to care in public, to learn the rules without embarrassment, to treat a month as a civic event.",
      },
      {
        type: "paragraph",
        content:
          "The 2026 tournament is structurally different from anything that came before. Three countries, sixteen cities, forty-eight teams, and a knockout round that begins with thirty-two nations still standing. For the United States specifically, the novelty isn't just scale — it's proximity. Games in New York, Los Angeles, Dallas, and Kansas City mean that millions of Americans will experience a World Cup match not as a television event from Qatar or South Africa, but as something happening in their metro area, with the traffic and the prices and the fan zones that come with it.",
      },
      {
        type: "heading",
        content: "The infrastructure of fandom",
      },
      {
        type: "paragraph",
        content:
          "In 1994, youth soccer enrollment spiked and then plateaued. What persisted was institutional: MLS launched two years later, not because Americans suddenly understood the offside rule, but because investors saw proof of demand. The 2026 version of that proof won't look like a single league expansion. It will look like municipal investment in pitches, in school programs funded by World Cup legacy grants, in the slow normalization of the sport as something your city hosts rather than something your weird cousin plays.",
      },
      {
        type: "list",
        content: [
          "Fan Fests in every host city lower the barrier to first-time attendance",
          "Co-hosting with Mexico and Canada creates a North American narrative arc the tournament has never had",
          "The 48-team format means more nations with diaspora communities in US cities — more reasons for local bars to open early",
        ],
      },
      {
        type: "paragraph",
        content:
          "Mexico carries a different weight. For Mexican Americans, a World Cup partially hosted in Mexico City and Guadalajara isn't abstract — it's family, language, and a tournament that finally feels like it belongs on the continent where the game has always mattered most in this hemisphere. Canada, the often-forgotten third host, enters with a golden generation and a point to prove. The story of 2026 may be less about converting skeptics and more about deepening the fandom that already exists in pockets — and connecting those pockets to each other.",
      },
    ],
  },
  {
    id: "lf-third-place",
    slug: "the-third-place-industrial-complex",
    headline: "The third-place industrial complex",
    dek: "Eight teams will survive as the 'best losers.' The math is brutal, the drama is real, and nobody saw it coming until FIFA expanded the field.",
    author: "Marcus Okonkwo",
    authorRole: "Serif Dispatch · Tournament design",
    readTimeMinutes: 11,
    publishedAt: "2026-06-03T14:00:00Z",
    sections: [
      {
        type: "paragraph",
        content:
          "On the third matchday of the group stage, you will watch a game that has been rendered meaningless for the two teams on the pitch — and simultaneously one of the most consequential games of the entire tournament for six other nations sitting in hotels, refreshing their phones, doing arithmetic they never trained for.",
      },
      {
        type: "pullquote",
        content:
          "Third-place advancement turns the final group games into a spreadsheet with grass and feelings.",
      },
      {
        type: "paragraph",
        content:
          "The eight best third-place finishers advance to a Round of 32 that didn't exist in any previous World Cup. Tiebreakers cascade through points, goal difference, goals scored, fair play, and finally the drawing of lots. Coaches who spent careers preparing for one knockout path now need analysts tracking five other groups simultaneously.",
      },
      {
        type: "heading",
        content: "Why this changes how you watch",
      },
      {
        type: "paragraph",
        content:
          "If you're new to the tournament, ignore the third-place table until matchday three. Then become obsessed with it. A 2-2 draw between Switzerland and Cameroon can vault a team you haven't thought about since the draw ceremony into the knockout round. The emotion is genuine even when the logic feels invented — which, in a sense, it was.",
      },
    ],
  },
  {
    id: "lf-pulisic",
    slug: "pulisic-and-the-weight-of-a-nation",
    headline: "Christian Pulisic and the weight of a nation that still doesn't know what it wants from him",
    dek: "He scored the goal that mattered. He always does. The question is whether America can let him be a winger instead of a symbol.",
    author: "Jordan Lee",
    authorRole: "Serif Dispatch · Profiles",
    readTimeMinutes: 12,
    publishedAt: "2026-06-09T06:00:00Z",
    relatedTeamCodes: ["USA"],
    sections: [
      {
        type: "paragraph",
        content:
          "Christian Pulisic has been the face of American soccer since he was nineteen, which is a sentence that sounds impressive until you sit with what it actually means: he has never played a World Cup match on home soil without also carrying the projection of an entire country's sporting identity crisis.",
      },
      {
        type: "pullquote",
        content:
          "In Milan he's a winger. In America he's a referendum.",
      },
      {
        type: "paragraph",
        content:
          "The opener at MetLife will be his fifth World Cup match and his first in front of a home crowd that includes people who discovered his name two weeks ago and people who tracked his Chelsea minutes like weather. Both groups will expect the same thing: proof that the investment was worth it.",
      },
      {
        type: "paragraph",
        content:
          "What gets lost is the player — the one who drifts inside from the left, who makes the run that doesn't get the highlight because the pass came second, who has spent a decade being compared to athletes from sports with completely different developmental pipelines. Pulisic didn't choose to be a symbol. The tournament doesn't care. Neither does the country.",
      },
    ],
  },
]

export function getLongformBySlug(slug: string): LongformFeature | undefined {
  return LONGFORM_FEATURES.find((f) => f.slug === slug)
}
