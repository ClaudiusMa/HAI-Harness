import type { DesignSystemState } from "@/types/agent-workspace"

export const EMPTY_DESIGN_SYSTEM_STATE: DesignSystemState = {
  version: 1.0,
  brandStrategy: "",
  colorTokens: [],
  typography: [],
  components: [],
  artboards: [],
  activityLog: [],
}

/** TerraTech brand — seed aligned to design-system/terratech/tokens.js */
export function createTerraTechSeed(brandStrategy?: string): DesignSystemState {
  return {
    version: 1.0,
    brandStrategy:
      brandStrategy ??
      "TerraTech — Sustainable Electronics. Tone: clean, reliable, innovative.",
    colorTokens: [
      { name: "primary", value: "hsl(142 45% 38%)", version: 1.0 },
      { name: "primary-foreground", value: "hsl(0 0% 98%)", version: 1.0 },
      { name: "secondary", value: "hsl(38 35% 72%)", version: 1.0 },
      { name: "destructive", value: "hsl(0 55% 48%)", version: 1.0 },
      { name: "accent", value: "hsl(85 30% 88%)", version: 1.0 },
      { name: "neutral-950", value: "hsl(28 22% 10%)", version: 1.0 },
    ],
    typography: [
      { role: "Font family (base)", spec: "'Terra Sans', sans-serif", version: 1.0 },
      { role: "H1", spec: "2.25rem, font-bold", version: 1.0 },
      { role: "Body", spec: "1rem, font-regular", version: 1.0 },
    ],
    components: [],
    artboards: [
      { name: "TerraTech Homepage (/terratech)", status: "pending" },
      { name: "TerraTech Products (/terratech/products)", status: "pending" },
      { name: "Newsletter Dialog", status: "pending" },
    ],
    activityLog: [
      {
        action: "Design system initialized for TerraTech",
        version: 1.0,
        at: new Date().toISOString(),
      },
    ],
  }
}

/** @deprecated Use createTerraTechSeed */
export function createSustainableInnovationSeed(brandStrategy?: string): DesignSystemState {
  return createTerraTechSeed(brandStrategy)
}

export function parseDesignSystemState(raw: unknown): DesignSystemState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_DESIGN_SYSTEM_STATE }
  const o = raw as Partial<DesignSystemState>
  return {
    version: Number(o.version ?? 1),
    brandStrategy: o.brandStrategy ?? "",
    colorTokens: Array.isArray(o.colorTokens) ? o.colorTokens : [],
    typography: Array.isArray(o.typography) ? o.typography : [],
    components: Array.isArray(o.components) ? o.components : [],
    artboards: Array.isArray(o.artboards) ? o.artboards : [],
    activityLog: Array.isArray(o.activityLog) ? o.activityLog : [],
  }
}

interface EvolveInput {
  state: DesignSystemState
  userMessage: string
  agentVersion: number
}

interface EvolveResult {
  state: DesignSystemState
  headline: string
  body: string
  artifactContent: string
}

/** Deterministic evolution for offline/demo — mirrors Alex v1.0 → v1.3 workflow */
export function evolveAlexDesignSystem(input: EvolveInput): EvolveResult {
  const { userMessage, agentVersion } = input
  const state: DesignSystemState = {
    ...input.state,
    colorTokens: [...input.state.colorTokens],
    typography: [...input.state.typography],
    components: [...input.state.components],
    artboards: [...input.state.artboards],
    activityLog: [...input.state.activityLog],
  }
  const lower = userMessage.toLowerCase()
  const now = new Date().toISOString()
  let headline = `[UPDATE FROM @Alex]`
  const lines: string[] = []

  if (
    state.version <= 1.0 &&
    (lower.includes("build") ||
      lower.includes("design system") ||
      lower.includes("eco-friendly") ||
      lower.includes("sustainable") ||
      lower.includes("terratech"))
  ) {
    headline = `[STARTING DESIGN SYSTEM BUILD]`
    lines.push(
      "Hello team! Alex here, ready to build the TerraTech design system for Sustainable Electronics.",
      "",
      "**Next steps:**",
      "1. Propose earthy green primary + neutral palette in `design-system/terratech/tokens.js`.",
      "2. Set Terra Sans typography and responsive spacing scale.",
      "",
      "Demo pages at `/terratech` will hot-reload as we define each layer."
    )
    state.activityLog.push({ action: "Started TerraTech design system build", version: 1.0, at: now })
  } else if (
    lower.includes("terra sans") ||
    lower.includes("veridian") ||
    lower.includes("font") ||
    (lower.includes("green") && lower.includes("vibrant"))
  ) {
    state.version = 1.1
    headline = `[DESIGN SYSTEM UPDATED - v1.1]`
    state.colorTokens = state.colorTokens.map((t) =>
      t.name === "primary"
        ? { ...t, value: "hsl(142 50% 42%)", version: 1.1 }
        : { ...t, version: 1.1 }
    )
    state.typography = [
      { role: "Font family (base)", spec: "'Terra Sans', sans-serif", version: 1.1 },
      { role: "H1", spec: "2.25rem, font-bold", version: 1.1 },
      { role: "H2", spec: "1.875rem, font-semibold", version: 1.1 },
      { role: "H3", spec: "1.5rem, font-semibold", version: 1.1 },
      { role: "Body", spec: "1rem, font-regular", version: 1.1 },
    ]
    lines.push(
      "Incorporating Terra Sans and refining the earthy primary green.",
      "",
      "**Design system updates:**",
      "- Color tokens updated — vibrant, natural green",
      "- Semantic destructive/error color defined",
      "- Typography scales for H1–H3 and body",
      "",
      "Edit `theme.css` `--tt-primary` to see `/terratech` pages update via HMR."
    )
    state.activityLog.push(
      { action: "Updated color tokens", version: 1.1, at: now },
      { action: "Updated typography", version: 1.1, at: now }
    )
  } else if (
    lower.includes("button") ||
    !state.components.some((c) => c.name === "Button")
  ) {
    state.version = 1.2
    headline = `[DESIGN SYSTEM UPDATED - v1.2]`
    state.components = [
      ...state.components.filter((c) => c.name !== "Button"),
      {
        name: "Button",
        version: 1.2,
        variants: ["primary", "secondary", "outline", "destructive", "ghost", "link"],
        note: "shadcn/ui + CVA; responsive sm/default/lg",
      },
    ]
    state.artboards = state.artboards.map((a) =>
      a.name.includes("Homepage") || a.name.includes("TerraTech Homepage")
        ? { ...a, status: "synced" as const }
        : a
    )
    lines.push(
      "Core `Button` component ready — uses Terra Sans and TerraTech tokens.",
      "",
      "**Artboard sync:** TerraTech homepage + product cards updated.",
      "",
      "Responsive across sm/md/lg/xl breakpoints."
    )
    state.activityLog.push(
      { action: "Created Button component", version: 1.2, at: now },
      { action: "Synced Product Page artboards", version: 1.2, at: now }
    )
  } else if (lower.includes("dialog") || lower.includes("signup") || lower.includes("modal")) {
    state.version = 1.3
    headline = `[DESIGN SYSTEM UPDATED - v1.3]`
    if (!state.components.some((c) => c.name === "Input")) {
      state.components.push({
        name: "Input",
        version: 1.3,
        variants: ["default"],
        note: "Terra Sans; themeable via CSS variables",
      })
    }
    state.components = [
      ...state.components.filter((c) => c.name !== "Dialog"),
      {
        name: "Dialog",
        version: 1.3,
        variants: ["default"],
        note: "Composes Button + Input; Radix; responsive",
      },
    ]
    state.artboards = state.artboards.map((a) =>
      a.name.includes("Homepage") ||
      a.name.includes("Newsletter") ||
      a.name.includes("Products")
        ? { ...a, status: "synced" as const }
        : a
    )
    lines.push(
      "`Dialog` component implemented for newsletter signup on TerraTech.",
      "",
      "**Automatic update:** `/terratech` newsletter dialog + products page synced.",
      "",
      "Dark mode tokens included in `theme.css`."
    )
    state.activityLog.push(
      { action: "Created Dialog component", version: 1.3, at: now },
      { action: "Synced Homepage artboards", version: 1.3, at: now }
    )
  } else {
    state.version = Math.round((agentVersion + 0.1) * 10) / 10
    headline = `[DESIGN SYSTEM UPDATED - v${state.version.toFixed(1)}]`
    lines.push(
      "Reviewed against current tokens and components.",
      "",
      `> ${userMessage.slice(0, 200)}`,
      "",
      "**Plan:** Extend shadcn/ui in `@/components/ui`, map to `design-system/terratech/tokens.js` + `theme.css`, propagate to `/terratech` demo pages."
    )
    state.activityLog.push({
      action: `Processed: ${userMessage.slice(0, 60)}`,
      version: state.version,
      at: now,
    })
  }

  return {
    state,
    headline,
    body: lines.join("\n"),
    artifactContent: buildTailwindV4ThemeSnippet(state),
  }
}

export function buildTailwindV4ThemeSnippet(state: DesignSystemState): string {
  const primary = state.colorTokens.find((t) => t.name === "primary")?.value ?? "hsl(130, 50%, 42%)"
  const secondary =
    state.colorTokens.find((t) => t.name === "secondary")?.value ?? "hsl(80, 60%, 70%)"
  const destructive =
    state.colorTokens.find((t) => t.name === "destructive")?.value ?? "hsl(0, 60%, 50%)"
  const font =
    state.typography.find((t) => t.role.includes("Font"))?.spec ?? "system-ui, sans-serif"

  return [
    `/* TerraTech design system v${state.version.toFixed(1)} — see design-system/terratech/ */`,
    `/* HMR demo: edit tokens.js colors.primary or theme.css --tt-primary */`,
    "",
    "@theme inline {",
    `  --font-sans: ${font};`,
    `  --color-primary: ${primary};`,
    `  --color-secondary: ${secondary};`,
    `  --color-destructive: ${destructive};`,
    "  --radius-md: 0.5rem;",
    "  --spacing-page: clamp(1rem, 4vw, 2rem);",
    "}",
    "",
    ...state.components.map(
      (c) => `/* ${c.name} v${c.version}: ${c.variants.join(", ")} — ${c.note} */`
    ),
    "",
    ...state.artboards.map((a) => {
      const icon = a.status === "synced" ? "✓" : a.status === "pending" ? "…" : "!"
      return `/* [${icon}] ${a.name} */`
    }),
  ].join("\n")
}

export function isAlexAgent(slug?: string, role?: string, alias?: string): boolean {
  return (
    slug === "alex" ||
    role?.toLowerCase().includes("design system") === true ||
    alias?.toLowerCase() === "alex"
  )
}
