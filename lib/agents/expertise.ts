/** Expertise domains agents may own or annotate within */
export type ExpertiseDomain =
  | "design_system"
  | "motion"
  | "accessibility"
  | "brand"
  | "design_leadership"
  | "engineering"
  | "research"
  | "strategy"
  | "communications"
  | "operations"

export type CollaborationMode = "task" | "annotation"

export interface AgentExpertiseProfile {
  slug: string
  primaryDomain: ExpertiseDomain
  /** Domains this agent may annotate on others' work */
  annotateDomains: ExpertiseDomain[]
  taskKeywords: string[]
  annotateKeywords: string[]
}

export const EXPERTISE_LABELS: Record<ExpertiseDomain, string> = {
  design_system: "Design system",
  motion: "Motion",
  accessibility: "Accessibility",
  brand: "Brand",
  design_leadership: "Design leadership",
  engineering: "Engineering",
  research: "Research",
  strategy: "Strategy",
  communications: "Communications",
  operations: "Operations",
}

export const AGENT_EXPERTISE: Record<string, AgentExpertiseProfile> = {
  alex: {
    slug: "alex",
    primaryDomain: "design_system",
    annotateDomains: ["design_system"],
    taskKeywords: [
      "token",
      "component",
      "design system",
      "shadcn",
      "tailwind",
      "theme",
      "typography",
      "spacing",
      "button",
      "dialog",
      "card",
      "terratech",
      "artboard",
    ],
    annotateKeywords: ["token", "component", "system"],
  },
  mira: {
    slug: "mira",
    primaryDomain: "motion",
    annotateDomains: ["motion", "design_system"],
    taskKeywords: [
      "motion",
      "animation",
      "easing",
      "transition",
      "micro-interaction",
      "duration",
      "spring",
      "hero entrance",
    ],
    annotateKeywords: ["motion", "animation", "transition", "hover", "enter", "exit"],
  },
  avery: {
    slug: "avery",
    primaryDomain: "accessibility",
    annotateDomains: ["accessibility", "design_system", "motion", "brand"],
    taskKeywords: [
      "accessibility",
      "a11y",
      "wcag",
      "contrast",
      "keyboard",
      "focus",
      "screen reader",
      "aria",
    ],
    annotateKeywords: ["contrast", "focus", "keyboard", "label", "color alone", "aria"],
  },
  blake: {
    slug: "blake",
    primaryDomain: "brand",
    annotateDomains: ["brand", "design_system"],
    taskKeywords: ["brand", "logo", "voice", "photography", "guideline", "mark", "lockup"],
    annotateKeywords: ["brand", "logo", "voice", "green", "photography", "visual"],
  },
  jordan: {
    slug: "jordan",
    primaryDomain: "design_leadership",
    annotateDomains: [
      "design_leadership",
      "design_system",
      "motion",
      "accessibility",
      "brand",
    ],
    taskKeywords: ["crit", "review", "direction", "weekly", "align", "decision", "priority"],
    annotateKeywords: ["risk", "drift", "blocker", "decision", "align", "on track"],
  },
  nova: {
    slug: "nova",
    primaryDomain: "engineering",
    annotateDomains: ["engineering"],
    taskKeywords: ["code", "implement", "bug", "pr", "frontend", "api", "deploy"],
    annotateKeywords: ["implementation", "performance", "bundle"],
  },
  atlas: {
    slug: "atlas",
    primaryDomain: "research",
    annotateDomains: ["research", "strategy"],
    taskKeywords: ["research", "analyze", "compare", "data", "survey", "competitor"],
    annotateKeywords: ["evidence", "source", "benchmark"],
  },
  sage: {
    slug: "sage",
    primaryDomain: "strategy",
    annotateDomains: ["strategy", "design_leadership"],
    taskKeywords: ["strategy", "roadmap", "prioritize", "metric", "goal", "spec"],
    annotateKeywords: ["goal", "scope", "priority", "metric"],
  },
  echo: {
    slug: "echo",
    primaryDomain: "communications",
    annotateDomains: ["communications", "brand"],
    taskKeywords: ["copy", "write", "announcement", "email", "headline", "tone"],
    annotateKeywords: ["copy", "tone", "voice", "messaging"],
  },
  scout: {
    slug: "scout",
    primaryDomain: "operations",
    annotateDomains: ["operations", "design_leadership"],
    taskKeywords: ["task", "deadline", "status", "coordinate", "handoff", "blocker"],
    annotateKeywords: ["timeline", "handoff", "status", "blocked"],
  },
}

export function getAgentExpertise(slug?: string): AgentExpertiseProfile | null {
  if (!slug) return null
  return AGENT_EXPERTISE[slug.toLowerCase()] ?? null
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

export interface AgentParticipation {
  mode: CollaborationMode
  domain: ExpertiseDomain
  reason: string
}

/** Decide whether an agent executes their lane or adds an expertise-scoped annotation */
export function classifyAgentParticipation(
  slug: string,
  userMessage: string,
  isMultiplayer: boolean
): AgentParticipation | null {
  const profile = getAgentExpertise(slug)
  if (!profile) return null

  const isPrimaryTask = matchesKeywords(userMessage, profile.taskKeywords)

  if (isPrimaryTask) {
    return {
      mode: "task",
      domain: profile.primaryDomain,
      reason: `Primary owner of ${EXPERTISE_LABELS[profile.primaryDomain]}`,
    }
  }

  if (!isMultiplayer) return null

  const canAnnotate =
    matchesKeywords(userMessage, profile.annotateKeywords) ||
    profile.slug === "jordan" ||
    profile.slug === "avery"

  if (canAnnotate && profile.annotateDomains.length > 0) {
    const domain =
      profile.annotateDomains.find((d) =>
        matchesKeywords(userMessage, profile.annotateKeywords)
      ) ?? profile.primaryDomain

    return {
      mode: "annotation",
      domain,
      reason: `${EXPERTISE_LABELS[profile.primaryDomain]} feedback only`,
    }
  }

  if (profile.slug === "jordan") {
    return {
      mode: "annotation",
      domain: "design_leadership",
      reason: "Cross-team workflow synthesis",
    }
  }

  return null
}

export function isMultiplayerChannel(agentCount: number, channelSlug?: string): boolean {
  if (channelSlug?.includes("studio") || channelSlug?.includes("cohort")) return true
  return agentCount >= 3
}
