import type {
  ChannelAgent,
  DesignSystemState,
  Message,
  MessageType,
  WorkspaceAgent,
  ExpertiseDomain,
  AnnotationSeverity,
} from "@/types/agent-workspace"
import {
  classifyAgentParticipation,
  EXPERTISE_LABELS,
  getAgentExpertise,
} from "./expertise"
import { generateAgentResponse } from "./orchestrator"
import { buildDesignTeamResponse, isDesignTeamAgent } from "./design-team"
import { isAlexAgent } from "./alex-design-system"

export interface CollaborationParticipant {
  agent: WorkspaceAgent
  channelAgent?: ChannelAgent
  mode: "task" | "annotation"
  domain: ExpertiseDomain
  reason: string
}

export interface CollaborationResult {
  content: string
  messageType: MessageType
  memoryDelta?: string
  channelContextDelta?: string
  artifactSuggestion?: { name: string; type: string; content: string }
  designSystemState?: DesignSystemState
  annotation?: {
    domain: ExpertiseDomain
    targetRef: string
    targetLabel: string
    severity: "info" | "suggestion" | "issue" | "approval"
  }
}

export function resolveCollaborationParticipants(
  userMessage: string,
  channelAgents: ChannelAgent[],
  isMultiplayer: boolean
): CollaborationParticipant[] {
  const enabled = channelAgents.filter((ca) => ca.agent?.isEnabled)

  const participants: CollaborationParticipant[] = []

  for (const ca of enabled) {
    const slug = ca.agent?.definition?.slug
    if (!slug || !ca.agent) continue

    const participation = classifyAgentParticipation(slug, userMessage, isMultiplayer)
    if (!participation) continue

    participants.push({
      agent: ca.agent,
      channelAgent: ca,
      mode: participation.mode,
      domain: participation.domain,
      reason: participation.reason,
    })
  }

  if (participants.length === 0 && enabled.length > 0) {
    const fallback = enabled.find((ca) => ca.agent?.definition?.slug === "alex") ?? enabled[0]
    if (fallback.agent) {
      participants.push({
        agent: fallback.agent,
        channelAgent: fallback,
        mode: "task",
        domain: getAgentExpertise(fallback.agent.definition?.slug)?.primaryDomain ?? "design_system",
        reason: "Default channel owner",
      })
    }
  }

  return participants
}

function buildExpertiseAnnotation(
  slug: string,
  alias: string,
  userMessage: string,
  domain: ExpertiseDomain,
  peerSummaries: string[]
): CollaborationResult {
  const preview = userMessage.length > 120 ? `${userMessage.slice(0, 120)}…` : userMessage
  const peerNote =
    peerSummaries.length > 0
      ? `\n\n**In context:** ${peerSummaries.slice(-2).join(" · ")}`
      : ""

  const domainLabel = EXPERTISE_LABELS[domain]

  const templates: Record<
    string,
    {
      severity: AnnotationSeverity
      body: string
      targetRef: string
      targetLabel: string
    }
  > = {
    mira: {
      severity: "suggestion",
      targetRef: "workflow:motion",
      targetLabel: "Motion layer",
      body: [
        `[ANNOTATION · ${domainLabel}]`,
        "",
        `Reviewing workflow from a **motion-only** lens — not changing tokens or brand:`,
        "",
        "- Hero entrance should use `duration-slow` (400ms) with ease-out",
        "- Product card hover: respect `prefers-reduced-motion` — opacity only fallback",
        "- Dialog spring spec should reference shared motion tokens file",
        "",
        `> ${preview}${peerNote}`,
      ].join("\n"),
    },
    avery: {
      severity: "issue",
      targetRef: "workflow:a11y",
      targetLabel: "Accessibility pass",
      body: [
        `[ANNOTATION · ${domainLabel}]`,
        "",
        `Scoped **WCAG 2.2 AA** feedback — not proposing visual redesign:`,
        "",
        "- Product card price relies on color alone — add icon or weight (1.4.1)",
        "- Focus ring on Dialog close meets 3:1 against surface",
        "- Hero CTA contrast passes; verify dark mode variant before ship",
        "",
        `> ${preview}${peerNote}`,
      ].join("\n"),
    },
    blake: {
      severity: "suggestion",
      targetRef: "workflow:brand",
      targetLabel: "Brand compliance",
      body: [
        `[ANNOTATION · ${domainLabel}]`,
        "",
        `**Brand-only** review — logo, voice, and photography rules:`,
        "",
        "- Primary green is hero accent; keep body text on neutral foreground",
        "- Hero photography: natural light, repairable products — no stock e-waste clichés",
        "- Logo clear space = 1× leaf mark height on any co-branded lockup",
        "",
        `> ${preview}${peerNote}`,
      ].join("\n"),
    },
    jordan: {
      severity: "info",
      targetRef: "workflow:leadership",
      targetLabel: "Cross-team synthesis",
      body: [
        `[ANNOTATION · ${domainLabel}]`,
        "",
        "**Workflow synthesis** — not executing specialist tasks:",
        "",
        "**On track:** token + component work progressing in #terratech-design-system",
        "**Watch:** motion tokens not yet linked to hero spec (@Mira follow-up)",
        "**Decision needed:** ship product cards before or after a11y fix?",
        "",
        peerSummaries.length
          ? `**Agent activity this turn:** ${peerSummaries.join(" · ")}`
          : `> ${preview}`,
      ].join("\n"),
    },
    alex: {
      severity: "info",
      targetRef: "workflow:design_system",
      targetLabel: "Design system note",
      body: [
        `[ANNOTATION · ${domainLabel}]`,
        "",
        "System-level note from @Alex — staying in token/component lane:",
        "",
        "- Button + Card variants match tokens v1.2",
        "- Pending: wire product card price styling to semantic `foreground` token",
        "",
        `> ${preview}${peerNote}`,
      ].join("\n"),
    },
  }

  const template = templates[slug] ?? {
    severity: "info" as const,
    targetRef: `workflow:${domain}`,
    targetLabel: domainLabel,
    body: [
      `[ANNOTATION · ${domainLabel}]`,
      "",
      `@${alias} — expertise-scoped feedback only:`,
      "",
      `> ${preview}${peerNote}`,
    ].join("\n"),
  }

  return {
    content: `**${alias}**\n${template.body}`,
    messageType: "annotation",
    channelContextDelta: `@${alias} annotated (${domainLabel})`,
    annotation: {
      domain,
      targetRef: template.targetRef,
      targetLabel: template.targetLabel,
      severity: template.severity,
    },
  }
}

export async function generateCollaborationResponse(
  participant: CollaborationParticipant,
  input: {
    userMessage: string
    recentMessages: Message[]
    channelContext?: string
    channelMemory?: string
    designSystemState?: DesignSystemState
    peerSummaries: string[]
  }
): Promise<CollaborationResult> {
  const { agent, channelAgent, mode, domain } = participant
  const slug = agent.definition?.slug
  const alias = channelAgent?.roleAlias ?? agent.customName ?? agent.definition?.name ?? "Agent"

  if (mode === "annotation") {
    if (slug && isDesignTeamAgent(slug)) {
      return buildExpertiseAnnotation(slug, alias, input.userMessage, domain, input.peerSummaries)
    }
    if (slug && isAlexAgent(slug, agent.definition?.role, alias)) {
      return buildExpertiseAnnotation("alex", alias, input.userMessage, domain, input.peerSummaries)
    }
    return buildExpertiseAnnotation(slug ?? "agent", alias, input.userMessage, domain, input.peerSummaries)
  }

  const response = await generateAgentResponse({
    agent,
    channelAgent,
    userMessage: input.userMessage,
    recentMessages: input.recentMessages,
    channelContext: input.channelContext,
    channelMemory: input.channelMemory,
    designSystemState: input.designSystemState,
  })

  if (slug && isDesignTeamAgent(slug) && mode === "task") {
    const team = buildDesignTeamResponse(slug, input.userMessage, alias)
    return {
      content: team.content,
      messageType: team.messageType,
      artifactSuggestion: team.artifact,
      memoryDelta: `${alias}: task on ${EXPERTISE_LABELS[domain]}`,
      channelContextDelta: `@${alias} completed ${EXPERTISE_LABELS[domain]} task`,
    }
  }

  return {
    ...response,
    channelContextDelta: response.channelContextDelta ?? `@${alias} — ${EXPERTISE_LABELS[domain]} task`,
  }
}

export function summarizePeerActivity(
  alias: string,
  mode: CollaborationParticipant["mode"],
  domain: ExpertiseDomain
): string {
  return `@${alias} (${mode === "task" ? "task" : "note"}:${EXPERTISE_LABELS[domain]})`
}
