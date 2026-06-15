import type { MessageType } from "@/types/agent-workspace"

export const DESIGN_TEAM_SLUGS = ["mira", "avery", "blake", "jordan"] as const

export type DesignTeamSlug = (typeof DESIGN_TEAM_SLUGS)[number]

export function isDesignTeamAgent(slug?: string): slug is DesignTeamSlug {
  return DESIGN_TEAM_SLUGS.includes(slug as DesignTeamSlug)
}

interface TeamResponse {
  content: string
  messageType: MessageType
  artifact?: { name: string; type: string; content: string }
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
  <rect width="120" height="40" rx="6" fill="hsl(45 20% 97%)"/>
  <circle cx="20" cy="20" r="10" fill="hsl(142 45% 38%)"/>
  <path d="M16 20 L19 23 L24 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <text x="36" y="25" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="hsl(28 20% 14%)">TerraTech</text>
</svg>`

const ARTBOARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" fill="none">
  <rect width="360" height="220" rx="8" fill="hsl(45 20% 97%)" stroke="hsl(38 16% 85%)"/>
  <rect x="16" y="16" width="328" height="32" rx="4" fill="hsl(142 45% 38%)" opacity="0.15"/>
  <rect x="16" y="60" width="200" height="12" rx="2" fill="hsl(28 20% 14%)" opacity="0.2"/>
  <rect x="16" y="80" width="160" height="8" rx="2" fill="hsl(28 10% 42%)" opacity="0.3"/>
  <rect x="16" y="108" width="88" height="28" rx="6" fill="hsl(142 45% 38%)"/>
  <rect x="16" y="152" width="150" height="52" rx="6" fill="white" stroke="hsl(38 16% 85%)"/>
</svg>`

export function buildDesignTeamResponse(
  slug: DesignTeamSlug,
  userMessage: string,
  alias: string
): TeamResponse {
  const preview = userMessage.length > 160 ? `${userMessage.slice(0, 160)}…` : userMessage
  const lower = userMessage.toLowerCase()

  switch (slug) {
    case "mira":
      return {
        messageType: "update",
        content: [
          `**Mira** [@${alias}]`,
          `[MOTION SPEC UPDATED]`,
          "",
          "Documented motion layer for TerraTech components:",
          "",
          "- **Duration tokens:** fast 150ms, base 250ms, slow 400ms",
          "- **Easing:** ease-out for enter, ease-in for exit",
          "- **Button hover:** scale 1.02 + shadow fade (respects reduced-motion)",
          "",
          `> ${preview}`,
          "",
          "Attached: homepage hero entrance timeline + Dialog modal spring spec.",
        ].join("\n"),
        artifact: {
          name: "motion-spec — hero + dialog",
          type: "code",
          content: [
            "/* TerraTech motion tokens */",
            "@media (prefers-reduced-motion: no-preference) {",
            "  .tt-hero { animation: tt-fade-up 400ms ease-out; }",
            "  .tt-dialog { animation: tt-scale-in 250ms cubic-bezier(0.16, 1, 0.3, 1); }",
            "}",
            "@keyframes tt-fade-up { from { opacity: 0; transform: translateY(12px); } }",
          ].join("\n"),
        },
      }

    case "avery":
      return {
        messageType: lower.includes("pass") || lower.includes("approve") ? "task_complete" : "update",
        content: [
          `**Avery** [@${alias}]`,
          `[ACCESSIBILITY AUDIT]`,
          "",
          "WCAG 2.2 AA scan for TerraTech demo pages:",
          "",
          "- Primary green on white: **4.8:1** — passes AA",
          "- Focus rings: visible on Button + Dialog close",
          "- Newsletter Dialog: labels associated, trap focus OK",
          "- **Fix needed:** product card price uses color alone — add weight/icon",
          "",
          `> ${preview}`,
        ].join("\n"),
        artifact: {
          name: "a11y-audit — terratech-pages",
          type: "text",
          content: [
            "# TerraTech accessibility audit",
            "",
            "| Check | Status | Notes |",
            "|-------|--------|-------|",
            "| Contrast primary/background | Pass | 4.8:1 |",
            "| Keyboard nav | Pass | Tab order logical |",
            "| Dialog focus trap | Pass | Radix default |",
            "| Non-color cues | Fail | Price needs icon |",
          ].join("\n"),
        },
      }

    case "blake":
      return {
        messageType: "update",
        content: [
          `**Blake** [@${alias}]`,
          `[BRAND ASSET SHARED]`,
          "",
          "TerraTech brand compliance notes:",
          "",
          "- Logo: min clear space = 1× leaf mark height",
          "- Primary green is **brand hero** — not for body text",
          "- Photography: natural light, repairable products, no stock e-waste clichés",
          "",
          "Attached: master logo SVG + homepage artboard reference.",
          "",
          "Each asset has a **tracking ID** — export to Figma, edit externally, then sync back in workspace.",
          "",
          `> ${preview}`,
        ].join("\n"),
        artifact: {
          name: "terratech-logo-master.svg",
          type: "image",
          content: LOGO_SVG,
        },
      }

    case "jordan":
      return {
        messageType: "update",
        content: [
          `**Jordan** · Design Director`,
          `[WEEKLY DESIGN CRIT — Week 24]`,
          "",
          "**On track**",
          "- @Alex: tokens v1.2 live on /terratech — Button, Card synced",
          "- @Blake: logo mark approved, shared to all channels",
          "",
          "**Needs attention**",
          "- @Mira: hero animation not yet tied to motion tokens file",
          "- @Avery: product card price contrast flagged — assign to @Alex",
          "",
          "**Decisions**",
          "- Keep earthy green primary; no teal shift",
          "- Next crit: verify Dialog + dark mode together",
          "",
          `Supervisor note: ${preview}`,
        ].join("\n"),
        artifact: {
          name: "crit-artboard — homepage-v1.2.fig",
          type: "image",
          content: ARTBOARD_SVG,
        },
      }
  }
}

export function getDesignTeamArtboardAsset(channelSlug: string): {
  name: string
  type: string
  content: string
} | null {
  if (channelSlug.includes("brand")) {
    return { name: "terratech-logo-lockup.svg", type: "image", content: LOGO_SVG }
  }
  if (channelSlug.includes("design-system") || channelSlug.includes("crit")) {
    return { name: "homepage-artboard-v1.2.svg", type: "image", content: ARTBOARD_SVG }
  }
  return null
}
