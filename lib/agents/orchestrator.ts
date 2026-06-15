import type {
  ChannelAgent,
  DesignSystemState,
  Message,
  MessageType,
  WorkspaceAgent,
} from "@/types/agent-workspace"
import {
  createTerraTechSeed,
  evolveAlexDesignSystem,
  isAlexAgent,
  parseDesignSystemState,
} from "./alex-design-system"
import { buildDesignTeamResponse, isDesignTeamAgent } from "./design-team"
import {
  buildSyncAckResponse,
  extractTrackingId,
  inferExternalTool,
  inferSyncStatus,
} from "@/lib/design-system/asset-sync"
import { isExternalSyncMessage } from "@/types/asset-sync"
import { parseMentionedAgentSlugs } from "./registry"

interface GenerateResponseInput {
  agent: WorkspaceAgent
  channelAgent?: ChannelAgent
  userMessage: string
  recentMessages: Message[]
  channelContext?: string
  channelMemory?: string
  designSystemState?: DesignSystemState
}

interface AgentResponse {
  content: string
  messageType: MessageType
  memoryDelta?: string
  channelContextDelta?: string
  artifactSuggestion?: { name: string; type: string; content: string }
  designSystemState?: DesignSystemState
}

export function buildExternalSyncResponse(
  agent: WorkspaceAgent,
  channelAgent: ChannelAgent | undefined,
  userMessage: string
): AgentResponse {
  const name = agent.customName ?? agent.definition?.name ?? "Agent"
  const alias = channelAgent?.roleAlias ?? agent.definition?.slug ?? name
  const trackingId = extractTrackingId(userMessage) ?? "unknown"
  const status = inferSyncStatus(userMessage)
  const tool = inferExternalTool(userMessage)

  return {
    content: buildSyncAckResponse({
      agentName: name,
      alias,
      trackingId,
      status,
      tool,
      notes: userMessage.slice(0, 200),
    }),
    messageType: "external_sync",
    channelContextDelta: `External sync ${trackingId}: ${status}`,
  }
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

/** Route to agents by @slug, @RoleAlias, or channel default */
export function resolveRespondingAgents(
  content: string,
  channelAgents: ChannelAgent[],
  allAgents: WorkspaceAgent[],
  defaultAgentId?: string | null
): Array<{ agent: WorkspaceAgent; channelAgent?: ChannelAgent }> {
  const mentions = parseMentionedAgentSlugs(content).map((m) => m.toLowerCase())
  const enabledChannelAgents = channelAgents.filter((ca) => ca.agent?.isEnabled)

  if (mentions.length > 0) {
    const matched = enabledChannelAgents.filter((ca) => {
      const slug = ca.agent?.definition?.slug.toLowerCase()
      const alias = ca.roleAlias.toLowerCase()
      return mentions.some((m) => m === slug || m === alias)
    })
    if (matched.length > 0) {
      return matched.map((ca) => ({ agent: ca.agent!, channelAgent: ca }))
    }

    const globalMatched = allAgents.filter(
      (a) =>
        a.isEnabled &&
        a.definition &&
        mentions.includes(a.definition.slug.toLowerCase())
    )
    if (globalMatched.length > 0) {
      return globalMatched.map((agent) => ({
        agent,
        channelAgent: channelAgents.find((ca) => ca.workspaceAgentId === agent.id),
      }))
    }
  }

  if (defaultAgentId) {
    const ca = channelAgents.find((c) => c.workspaceAgentId === defaultAgentId)
    const agent = allAgents.find((a) => a.id === defaultAgentId)
    if (agent) return [{ agent, channelAgent: ca }]
  }

  if (enabledChannelAgents.length > 0) {
    const strategist = enabledChannelAgents.find(
      (ca) =>
        ca.roleAlias.toLowerCase() === "strategist" ||
        ca.agent?.definition?.slug === "sage"
    )
    const pick = strategist ?? enabledChannelAgents[0]
    return [{ agent: pick.agent!, channelAgent: pick }]
  }

  const sage = allAgents.find((a) => a.definition?.slug === "sage" && a.isEnabled)
  return sage ? [{ agent: sage }] : allAgents.filter((a) => a.isEnabled).slice(0, 1).map((a) => ({ agent: a }))
}

function buildConversationHistory(recentMessages: Message[], limit = 12): OpenAIMessage[] {
  return recentMessages.slice(-limit).map((msg) => ({
    role: msg.authorType === "user" ? "user" : "assistant",
    content: msg.author?.name ? `[${msg.author.name}]: ${msg.content}` : msg.content,
  }))
}

function inferMessageType(content: string, role: string): MessageType {
  const lower = content.toLowerCase()
  if (
    lower.includes("blocked") ||
    lower.includes("need input") ||
    lower.includes("waiting on")
  ) {
    return "blocker"
  }
  if (
    lower.includes("task complete") ||
    lower.includes("ready for approval") ||
    lower.includes("all done") ||
    lower.includes("finished")
  ) {
    return "task_complete"
  }
  if (lower.includes("update") || lower.includes("progress") || role.includes("Coordinator")) {
    return "update"
  }
  return "normal"
}

export async function generateAgentResponse(
  input: GenerateResponseInput
): Promise<AgentResponse> {
  const {
    agent,
    channelAgent,
    userMessage,
    recentMessages,
    channelContext,
    channelMemory,
  } = input
  const def = agent.definition

  if (isExternalSyncMessage(userMessage)) {
    return buildExternalSyncResponse(agent, channelAgent, userMessage)
  }

  if (!def) {
    return {
      content: "I'm not fully configured yet. Please check my agent definition.",
      messageType: "normal",
    }
  }

  const apiKey = process.env.OPENAI_API_KEY
  const name = channelAgent?.roleAlias ?? agent.customName ?? def.name
  const version = channelAgent?.instructionsVersion ?? agent.instructionsVersion
  const instructions =
    channelAgent?.instructions ||
    agent.currentInstructions ||
    def.systemPrompt

  const systemParts = [
    def.systemPrompt,
    `\n\nCurrent instructions (v${version}):\n${instructions}`,
    agent.memorySummary ? `\n\nAgent memory:\n${agent.memorySummary}` : "",
    channelMemory ? `\n\nChannel context:\n${channelMemory}` : "",
    channelContext ? `\n\nProject: ${channelContext}` : "",
    `\n\nPersonality: ${def.personality}`,
    `\nRespond as ${name} (${def.role}). Signal blockers or completion clearly. The supervisor reviews your work.`,
  ]

  if (apiKey) {
    try {
      const messages: OpenAIMessage[] = [
        { role: "system", content: systemParts.join("") },
        ...buildConversationHistory(recentMessages),
        { role: "user", content: userMessage },
      ]

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages,
          max_tokens: 900,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: { message?: { content?: string } }[]
        }
        const content = data.choices?.[0]?.message?.content?.trim()
        if (content) {
          return {
            content,
            messageType: inferMessageType(content, def.role),
            memoryDelta: `${name}: ${userMessage.slice(0, 80)}`,
            channelContextDelta: `Discussed with @${name}: ${userMessage.slice(0, 60)}`,
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  const offline = buildOfflineResponse(
    name,
    version,
    def.role,
    def.personality,
    userMessage,
    def.jobs,
    channelAgent?.roleAlias,
    def.slug,
    input.designSystemState
  )

  return {
    ...offline,
    memoryDelta: `${name}: ${userMessage.slice(0, 80)}`,
    channelContextDelta: `Discussed with @${name}: ${userMessage.slice(0, 60)}`,
  }
}

function buildOfflineResponse(
  name: string,
  version: number,
  role: string,
  personality: string,
  userMessage: string,
  jobs: string[],
  roleAlias?: string,
  slug?: string,
  designSystemState?: DesignSystemState
): AgentResponse {
  const preview = userMessage.length > 180 ? `${userMessage.slice(0, 180)}…` : userMessage
  const alias = roleAlias ?? name
  const isDesignSystem = isAlexAgent(slug, role, alias)

  if (isDesignSystem) {
    const current = designSystemState ?? parseDesignSystemState({})
    const evolved = evolveAlexDesignSystem({
      state: current.version > 0 && current.colorTokens.length ? current : {
        ...current,
        ...parseDesignSystemState(createTerraTechSeed()),
      },
      userMessage,
      agentVersion: version,
    })

    const isComplete =
      userMessage.toLowerCase().includes("final") ||
      userMessage.toLowerCase().includes("approve")

    const content = [
      `**${name}** (v${evolved.state.version.toFixed(1)})`,
      evolved.headline,
      "",
      evolved.body,
    ].join("\n")

    return {
      content,
      messageType: isComplete ? "task_complete" : "design_system_update",
      designSystemState: evolved.state,
      artifactSuggestion: {
        name: `Design tokens v${evolved.state.version.toFixed(1)} — Tailwind @theme`,
        type: "code",
        content: evolved.artifactContent,
      },
    }
  }

  if (slug && isDesignTeamAgent(slug)) {
    const team = buildDesignTeamResponse(slug, userMessage, alias)
    return {
      content: team.content,
      messageType: team.messageType,
      artifactSuggestion: team.artifact,
    }
  }

  const artifactContent = [
        `# ${alias} Output`,
        "",
        `Task: ${preview}`,
        "",
        `## Draft deliverable`,
        `- Primary recommendation based on ${role} analysis`,
        `- Next steps outlined for supervisor review`,
        "",
        `_Generated by ${name} v${version}_`,
      ].join("\n")

  const isComplete =
    userMessage.toLowerCase().includes("final") ||
    userMessage.toLowerCase().includes("approve")
  const messageType: MessageType = isComplete ? "task_complete" : "update"

  const content = [
    `**${name}** (v${version})`,
    messageType === "task_complete" ? `[TASK COMPLETE]` : `[UPDATE FROM @${alias}]`,
    "",
    `Here's my work on this:`,
    "",
    `> ${preview}`,
    "",
    `**Approach:** ${personality.split(".")[0]}. Working autonomously — will flag blockers if needed.`,
    "",
    `**Capabilities:** ${jobs.slice(0, 3).join(" · ")}`,
  ].join("\n")

  return {
    content,
    messageType,
    artifactSuggestion: {
      name: `${alias} — ${new Date().toISOString().slice(0, 10)} output`,
      type: role.includes("Engineer") ? "code" : "text",
      content: artifactContent,
    },
  }
}
