/**
 * @BrandAI — lightweight brand knowledge bot for Alex's TerraTech channel.
 * Returns canonical brand values when queried in workspace conversation.
 */

export interface BrandGuidelines {
  name: string
  tagline: string
  tone: string[]
  colors: Record<string, string>
  typography: { font: string; body: string; headings: string }
  voice: string[]
}

export const TERRATECH_BRAND: BrandGuidelines = {
  name: "TerraTech",
  tagline: "Sustainable Electronics",
  tone: ["clean", "reliable", "innovative", "earthy", "approachable"],
  colors: {
    primary: "hsl(142 45% 38%) — earthy green, vibrant but natural",
    secondary: "hsl(38 35% 72%) — warm sand / clay accent",
    neutral: "hsl(28 20% 14%) foreground on hsl(45 20% 97%) background",
    error: "hsl(0 55% 48%) — muted red, accessible contrast",
  },
  typography: {
    font: "Terra Sans (Figtree stand-in in demo)",
    body: "1rem / regular — readable, calm",
    headings: "Bold scale 2.25rem–3rem — confident, not shouty",
  },
  voice: [
    "Lead with sustainability outcomes, not specs",
    "Prefer repair and longevity over novelty",
    "Use plain language; avoid greenwashing",
  ],
}

export function queryBrandAI(question: string): string {
  const q = question.toLowerCase()
  const b = TERRATECH_BRAND

  if (q.includes("color") || q.includes("palette") || q.includes("green")) {
    return [
      `**${b.name} color palette**`,
      "",
      ...Object.entries(b.colors).map(([k, v]) => `- **${k}:** ${v}`),
      "",
      "Alex maps these to Tailwind tokens in `design-system/terratech/tokens.js`.",
    ].join("\n")
  }

  if (q.includes("font") || q.includes("typography") || q.includes("terra sans")) {
    return [
      `**${b.name} typography**`,
      "",
      `- **Font:** ${b.typography.font}`,
      `- **Body:** ${b.typography.body}`,
      `- **Headings:** ${b.typography.headings}`,
    ].join("\n")
  }

  if (q.includes("tone") || q.includes("voice") || q.includes("brand")) {
    return [
      `**${b.name} — ${b.tagline}**`,
      "",
      `**Tone:** ${b.tone.join(", ")}`,
      "",
      "**Voice guidelines:**",
      ...b.voice.map((v) => `- ${v}`),
    ].join("\n")
  }

  return [
    `**BrandAI** · ${b.name}`,
    "",
    `I know TerraTech's colors, typography (Terra Sans), and voice.`,
    "",
    "Try: `@BrandAI what are our brand colors?` or `@BrandAI typography guidelines`",
  ].join("\n")
}

export function isBrandAIQuery(content: string): boolean {
  return /@brandai\b/i.test(content)
}
