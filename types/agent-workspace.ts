export type ChannelType = "direct" | "group" | "thread"
export type ChannelStatus = "active" | "archived" | "paused"
export type AuthorType = "user" | "agent" | "system"
export type MemberType = "user" | "agent"
export type AssetType =
  | "image"
  | "file"
  | "link"
  | "code"
  | "text"
  | "document"
  | "audio"
  | "video"
export type MessageType =
  | "normal"
  | "update"
  | "blocker"
  | "task_complete"
  | "design_system_update"
  | "asset_exported"
  | "external_sync"
  | "annotation"
export type AgentStatus = "idle" | "thinking" | "working" | "blocked" | "offline"

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

export type AnnotationSeverity = "info" | "suggestion" | "issue" | "approval"

export interface AgentDefinition {
  id: string
  slug: string
  name: string
  role: string
  tagline: string
  personality: string
  systemPrompt: string
  avatarColor: string
  icon: string
  jobs: string[]
  isActive: boolean
  sortOrder: number
}

export interface WorkspaceAgent {
  id: string
  workspaceId: string
  agentDefinitionId: string
  customName: string | null
  memorySummary: string
  context: Record<string, unknown>
  isEnabled: boolean
  status: AgentStatus
  instructionsVersion: number
  currentInstructions: string
  agentState: Record<string, unknown>
  definition?: AgentDefinition
}

export interface ChannelAgent {
  id: string
  channelId: string
  workspaceAgentId: string
  roleAlias: string
  instructions: string
  instructionsVersion: number
  status: AgentStatus
  agent?: WorkspaceAgent
}

export interface InstructionVersion {
  id: string
  version: number
  instructions: string
  changeReason: string | null
  createdAt: string
  channelAgentId?: string | null
  workspaceAgentId?: string | null
}

export interface ChannelContextVersion {
  id: string
  channelId: string
  contextSummary: string
  version: number
  createdAt: string
}

export interface Workspace {
  id: string
  ownerId: string
  name: string
  createdAt: string
}

export interface DesignSystemActivity {
  action: string
  version?: number
  at: string
}

export interface DesignToken {
  name: string
  value: string
  version: number
}

export interface TypographyToken {
  role: string
  spec: string
  version: number
}

export interface DesignComponent {
  name: string
  version: number
  variants: string[]
  note: string
}

export interface LinkedArtboard {
  name: string
  status: "synced" | "pending" | "stale"
}

export interface DesignSystemState {
  version: number
  brandStrategy: string
  colorTokens: DesignToken[]
  typography: TypographyToken[]
  components: DesignComponent[]
  artboards: LinkedArtboard[]
  activityLog: DesignSystemActivity[]
}

export interface Channel {
  id: string
  workspaceId: string
  name: string
  slug: string
  channelType: ChannelType
  description: string | null
  domain: string | null
  contextSummary: string
  designSystemState: DesignSystemState
  status: ChannelStatus
  parentChannelId: string | null
  forkedFromMessageId: string | null
  defaultAgentId: string | null
  createdAt: string
  replyCount?: number
  assignedAgents?: ChannelAgent[]
}

export interface MessageAuthor {
  type: AuthorType
  id: string
  name: string
  avatarColor?: string
  icon?: string
  role?: string
  version?: number
  roleAlias?: string
}

export interface SharedAsset {
  id: string
  workspaceId: string
  channelId: string | null
  name: string
  assetType: AssetType
  url: string | null
  content: string | null
  mimeType: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface Message {
  id: string
  channelId: string
  threadId: string | null
  authorType: AuthorType
  userId: string | null
  workspaceAgentId: string | null
  content: string
  messageType: MessageType
  metadata: Record<string, unknown>
  parentMessageId: string | null
  createdAt: string
  author?: MessageAuthor
  assets?: SharedAsset[]
  replyCount?: number
}

export interface WorkflowAnnotation {
  id: string
  channelId: string
  workspaceId: string
  sessionId: string
  triggerMessageId: string | null
  workspaceAgentId: string
  messageId: string | null
  expertiseDomain: ExpertiseDomain
  targetRef: string
  targetLabel: string
  content: string
  severity: AnnotationSeverity
  metadata: Record<string, unknown>
  createdAt: string
  author?: MessageAuthor
}

export interface ChannelDetail {
  channel: Channel
  messages: Message[]
  channelAgents: ChannelAgent[]
  assets: SharedAsset[]
  contextHistory: ChannelContextVersion[]
  instructionHistory: InstructionVersion[]
  threads: Channel[]
  annotations: WorkflowAnnotation[]
}

export interface WorkspaceSnapshot {
  workspace: Workspace
  agents: WorkspaceAgent[]
  channels: Channel[]
  assets: SharedAsset[]
}
