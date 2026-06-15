import type {
  AgentDefinition,
  AgentStatus,
  Channel,
  ChannelAgent,
  ChannelContextVersion,
  InstructionVersion,
  Message,
  MessageAuthor,
  MessageType,
  SharedAsset,
  WorkflowAnnotation,
  Workspace,
  WorkspaceAgent,
} from "@/types/agent-workspace"
import { parseDesignSystemState } from "@/lib/agents/alex-design-system"

export function mapAgentDefinition(row: any): AgentDefinition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    tagline: row.tagline,
    personality: row.personality,
    systemPrompt: row.system_prompt,
    avatarColor: row.avatar_color,
    icon: row.icon,
    jobs: Array.isArray(row.jobs) ? row.jobs : [],
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

export function mapWorkspace(row: any): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    createdAt: row.created_at,
  }
}

export function mapWorkspaceAgent(row: any, definition?: AgentDefinition): WorkspaceAgent {
  const def =
    definition ??
    (row.agent_definitions ? mapAgentDefinition(row.agent_definitions) : undefined)
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    agentDefinitionId: row.agent_definition_id,
    customName: row.custom_name,
    memorySummary: row.memory_summary ?? "",
    context: (row.context as Record<string, unknown>) ?? {},
    isEnabled: row.is_enabled,
    status: (row.status as AgentStatus) ?? "idle",
    instructionsVersion: Number(row.instructions_version ?? 1),
    currentInstructions: row.current_instructions ?? "",
    agentState: (row.agent_state as Record<string, unknown>) ?? {},
    definition: def,
  }
}

export function mapChannel(row: Record<string, unknown>): Channel {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    slug: row.slug as string,
    channelType: row.channel_type as Channel["channelType"],
    description: (row.description as string | null) ?? null,
    domain: (row.domain as string | null) ?? null,
    contextSummary: (row.context_summary as string) ?? "",
    designSystemState: parseDesignSystemState(row.design_system_state),
    status: (row.status as Channel["status"]) ?? "active",
    parentChannelId: (row.parent_channel_id as string | null) ?? null,
    forkedFromMessageId: (row.forked_from_message_id as string | null) ?? null,
    defaultAgentId: (row.default_agent_id as string | null) ?? null,
    createdAt: row.created_at as string,
    replyCount: row.reply_count as number | undefined,
  }
}

export function mapChannelAgent(row: any, agent?: WorkspaceAgent): ChannelAgent {
  const wa =
    agent ??
    (row.workspace_agents
      ? mapWorkspaceAgent(
          row.workspace_agents,
          row.workspace_agents.agent_definitions
            ? mapAgentDefinition(row.workspace_agents.agent_definitions)
            : undefined
        )
      : undefined)
  return {
    id: row.id,
    channelId: row.channel_id,
    workspaceAgentId: row.workspace_agent_id,
    roleAlias: row.role_alias,
    instructions: row.instructions ?? "",
    instructionsVersion: Number(row.instructions_version ?? 1),
    status: (row.status as AgentStatus) ?? "idle",
    agent: wa,
  }
}

export function mapSharedAsset(row: any): SharedAsset {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    channelId: row.channel_id ?? null,
    name: row.name,
    assetType: row.asset_type,
    url: row.url,
    content: row.content,
    mimeType: row.mime_type,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }
}

export function mapMessage(
  row: Record<string, unknown>,
  author?: Message["author"],
  assets?: SharedAsset[],
  replyCount?: number
): Message {
  return {
    id: row.id as string,
    channelId: row.channel_id as string,
    threadId: (row.thread_id as string | null) ?? null,
    authorType: row.author_type as Message["authorType"],
    userId: (row.user_id as string | null) ?? null,
    workspaceAgentId: (row.workspace_agent_id as string | null) ?? null,
    content: row.content as string,
    messageType: ((row.message_type as MessageType) ?? "normal") as MessageType,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    parentMessageId: (row.parent_message_id as string | null) ?? null,
    createdAt: row.created_at as string,
    author,
    assets,
    replyCount: replyCount ?? (row.reply_count as number | undefined),
  }
}

export function mapInstructionVersion(row: any): InstructionVersion {
  return {
    id: row.id,
    version: Number(row.version),
    instructions: row.instructions,
    changeReason: row.change_reason,
    createdAt: row.created_at,
    channelAgentId: row.channel_agent_id,
    workspaceAgentId: row.workspace_agent_id,
  }
}

export function mapChannelContextVersion(row: any): ChannelContextVersion {
  return {
    id: row.id,
    channelId: row.channel_id,
    contextSummary: row.context_summary,
    version: row.version,
    createdAt: row.created_at,
  }
}

export function mapWorkflowAnnotation(
  row: Record<string, unknown>,
  author?: MessageAuthor
): WorkflowAnnotation {
  return {
    id: row.id as string,
    channelId: row.channel_id as string,
    workspaceId: row.workspace_id as string,
    sessionId: row.session_id as string,
    triggerMessageId: (row.trigger_message_id as string | null) ?? null,
    messageId: (row.message_id as string | null) ?? null,
    workspaceAgentId: row.workspace_agent_id as string,
    expertiseDomain: row.expertise_domain as WorkflowAnnotation["expertiseDomain"],
    targetRef: row.target_ref as string,
    targetLabel: row.target_label as string,
    content: row.content as string,
    severity: row.severity as WorkflowAnnotation["severity"],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    author,
  }
}
