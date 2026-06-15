"use server"

import { revalidatePath } from "next/cache"
import {
  createChannelAgentsForChannel,
  getChannelById,
  getCurrentUserId,
  getOrCreateWorkspace,
} from "@/lib/workspace/queries"
import { createClient } from "@/lib/supabase/server"
import type { AssetType, ChannelType, MessageType } from "@/types/agent-workspace"
import type { AssetExportFormat, AssetSyncStatus, ExternalDesignTool } from "@/types/asset-sync"
import { ensureTrackingMetadata } from "@/lib/design-system/asset-export"
import { metadataToRecord, appendSyncHistory } from "@/lib/design-system/asset-sync"
import { parseAssetExportMetadata } from "@/types/asset-sync"

interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

export async function sendMessageAction(input: {
  channelId: string
  content: string
  threadId?: string | null
  assetIds?: string[]
  messageType?: MessageType
}): Promise<ActionResult<{ messageId: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in to send messages." }

  const content = input.content.trim()
  if (!content) return { success: false, error: "Message cannot be empty." }

  const supabase = await createClient()

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      channel_id: input.channelId,
      thread_id: input.threadId ?? null,
      author_type: "user",
      user_id: userId,
      content,
      message_type: input.messageType ?? "normal",
    })
    .select()
    .single()

  if (error || !message) {
    return { success: false, error: "Failed to send message." }
  }

  if (input.assetIds?.length) {
    await supabase.from("message_assets").insert(
      input.assetIds.map((assetId) => ({
        message_id: message.id,
        asset_id: assetId,
      }))
    )
  }

  revalidatePath("/workspace")
  revalidatePath(`/workspace/channels/${input.channelId}`)

  return { success: true, data: { messageId: message.id } }
}

export async function forkThreadAction(input: {
  channelId: string
  messageId: string
  name?: string
}): Promise<ActionResult<{ threadId: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in to fork threads." }

  const supabase = await createClient()
  const channel = await getChannelById(input.channelId)
  if (!channel) return { success: false, error: "Channel not found." }

  const { data: sourceMessage } = await supabase
    .from("messages")
    .select("content")
    .eq("id", input.messageId)
    .single()

  const threadName =
    input.name ?? `Thread: ${(sourceMessage?.content ?? "discussion").slice(0, 40)}`
  const slug = `${slugify(threadName)}-${Date.now().toString(36)}`

  const { data: thread, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: channel.workspaceId,
      name: threadName,
      slug,
      channel_type: "thread" as ChannelType,
      parent_channel_id: input.channelId,
      forked_from_message_id: input.messageId,
      created_by: userId,
    })
    .select()
    .single()

  if (error || !thread) {
    return { success: false, error: "Failed to create thread." }
  }

  await supabase.from("messages").insert({
    channel_id: input.channelId,
    thread_id: thread.id,
    author_type: "system",
    message_type: "normal",
    content: `Thread started: ${threadName}`,
    metadata: { threadId: thread.id },
  })

  revalidatePath("/workspace")
  revalidatePath(`/workspace/channels/${input.channelId}`)

  return { success: true, data: { threadId: thread.id } }
}

export async function createChannelAction(input: {
  name: string
  description?: string
  domain?: string
  agentIds?: string[]
}): Promise<ActionResult<{ channelId: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in to create channels." }

  const workspace = await getOrCreateWorkspace(userId)
  if (!workspace) return { success: false, error: "Workspace not found." }

  const name = input.name.trim()
  if (!name) return { success: false, error: "Channel name is required." }

  const supabase = await createClient()
  const slug = `${slugify(name)}-${Date.now().toString(36)}`

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: workspace.id,
      name,
      slug,
      channel_type: "group",
      domain: input.domain ?? null,
      description: input.description ?? null,
      context_summary: input.description ? `Project: ${input.description}` : "",
      created_by: userId,
    })
    .select()
    .single()

  if (error || !channel) {
    return { success: false, error: "Failed to create channel." }
  }

  await supabase.from("channel_members").insert({
    channel_id: channel.id,
    member_type: "user",
    user_id: userId,
  })

  if (input.agentIds?.length) {
    const { data: workspaceAgents } = await supabase
      .from("workspace_agents")
      .select("*, agent_definitions(*)")
      .in("id", input.agentIds)

    if (workspaceAgents?.length) {
      await supabase.from("channel_members").insert(
        workspaceAgents.map((a) => ({
          channel_id: channel.id,
          member_type: "agent" as const,
          workspace_agent_id: a.id,
        }))
      )
      await createChannelAgentsForChannel(channel.id, workspaceAgents)
    }
  }

  revalidatePath("/workspace")
  return { success: true, data: { channelId: channel.id } }
}

export async function updateChannelAgentInstructionsAction(input: {
  channelAgentId: string
  instructions: string
  changeReason?: string
}): Promise<ActionResult> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in required." }

  const supabase = await createClient()

  const { data: channelAgent } = await supabase
    .from("channel_agents")
    .select("*")
    .eq("id", input.channelAgentId)
    .single()

  if (!channelAgent) return { success: false, error: "Channel agent not found." }

  const newVersion = Number(channelAgent.instructions_version) + 0.1

  await supabase
    .from("channel_agents")
    .update({
      instructions: input.instructions.trim(),
      instructions_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.channelAgentId)

  await supabase.from("agent_instruction_history").insert({
    channel_agent_id: input.channelAgentId,
    version: newVersion,
    instructions: input.instructions.trim(),
    change_reason: input.changeReason ?? "Manual update",
    created_by: userId,
  })

  revalidatePath("/workspace")
  revalidatePath(`/workspace/channels/${channelAgent.channel_id}`)

  return { success: true }
}

export async function updateChannelContextAction(input: {
  channelId: string
  contextSummary: string
}): Promise<ActionResult> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in required." }

  const supabase = await createClient()

  const { data: history } = await supabase
    .from("channel_context_history")
    .select("version")
    .eq("channel_id", input.channelId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (history?.version ?? 0) + 1

  await supabase
    .from("channels")
    .update({
      context_summary: input.contextSummary.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.channelId)

  await supabase.from("channel_context_history").insert({
    channel_id: input.channelId,
    context_summary: input.contextSummary.trim(),
    version: nextVersion,
    created_by: userId,
  })

  revalidatePath(`/workspace/channels/${input.channelId}`)
  return { success: true }
}

export async function summonAgentToChannelAction(input: {
  channelId: string
  workspaceAgentId: string
  roleAlias?: string
  instructions?: string
}): Promise<ActionResult> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in required." }

  const supabase = await createClient()

  const { data: agent } = await supabase
    .from("workspace_agents")
    .select("*, agent_definitions(slug, name)")
    .eq("id", input.workspaceAgentId)
    .single()

  if (!agent) return { success: false, error: "Agent not found." }

  const def = agent.agent_definitions as { slug: string; name: string } | null
  const roleAlias = input.roleAlias ?? def?.name ?? "Agent"

  await supabase.from("channel_members").insert({
    channel_id: input.channelId,
    member_type: "agent",
    workspace_agent_id: input.workspaceAgentId,
  })

  const { error } = await supabase.from("channel_agents").upsert(
    {
      channel_id: input.channelId,
      workspace_agent_id: input.workspaceAgentId,
      role_alias: roleAlias,
      instructions: input.instructions ?? "",
      instructions_version: 1.0,
      status: "idle",
    },
    { onConflict: "channel_id,workspace_agent_id" }
  )

  if (error) return { success: false, error: "Failed to summon agent." }

  revalidatePath(`/workspace/channels/${input.channelId}`)
  return { success: true }
}

export async function createAssetAction(input: {
  name: string
  assetType: AssetType
  content?: string
  url?: string
  channelId?: string
}): Promise<ActionResult<{ assetId: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in to share assets." }

  const workspace = await getOrCreateWorkspace(userId)
  if (!workspace) return { success: false, error: "Workspace not found." }

  const supabase = await createClient()

  const { data: asset, error } = await supabase
    .from("shared_assets")
    .insert({
      workspace_id: workspace.id,
      channel_id: input.channelId ?? null,
      uploaded_by: userId,
      name: input.name.trim(),
      asset_type: input.assetType,
      content: input.content ?? null,
      url: input.url ?? null,
      metadata: metadataToRecord(ensureTrackingMetadata(undefined)),
    })
    .select()
    .single()

  if (error || !asset) {
    return { success: false, error: "Failed to create asset." }
  }

  revalidatePath("/workspace")
  if (input.channelId) revalidatePath(`/workspace/channels/${input.channelId}`)
  return { success: true, data: { assetId: asset.id } }
}

export async function refreshChannelAction(channelId: string): Promise<ActionResult> {
  revalidatePath(`/workspace/channels/${channelId}`)
  revalidatePath("/workspace")
  return { success: true }
}

export async function markAssetExportedAction(input: {
  assetId: string
  channelId: string
  format: AssetExportFormat
  allFormats?: AssetExportFormat[]
}): Promise<ActionResult> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in required." }

  const supabase = await createClient()
  const { data: asset } = await supabase
    .from("shared_assets")
    .select("*")
    .eq("id", input.assetId)
    .maybeSingle()

  if (!asset) return { success: false, error: "Asset not found." }

  const meta = appendSyncHistory(ensureTrackingMetadata(asset.metadata as Record<string, unknown>), {
    status: "exported",
    by: "user",
    notes: `Exported ${input.allFormats?.join(", ") ?? input.format}`,
  })

  meta.exportedAt = meta.exportedAt ?? new Date().toISOString()
  meta.exportedFormats = input.allFormats ?? [
    ...new Set([...(meta.exportedFormats ?? []), input.format]),
  ]
  meta.syncStatus = "exported"

  await supabase
    .from("shared_assets")
    .update({ metadata: metadataToRecord(meta) })
    .eq("id", input.assetId)

  await supabase.from("messages").insert({
    channel_id: input.channelId,
    author_type: "system",
    message_type: "asset_exported",
    content: `Asset exported for external editing — tracking **${meta.trackingId}** (${meta.exportedFormats?.join(", ")}). Edit in Figma and report back via External edit sync.`,
    metadata: { trackingId: meta.trackingId, assetId: input.assetId },
  })

  revalidatePath(`/workspace/channels/${input.channelId}`)
  return { success: true }
}

export async function reportExternalSyncAction(input: {
  channelId: string
  trackingId: string
  tool: ExternalDesignTool
  status: AssetSyncStatus
  notes: string
  fileUrl?: string
}): Promise<ActionResult<{ messageId: string; agentPrompt: string }>> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Sign in required." }

  const supabase = await createClient()
  const channel = await getChannelById(input.channelId)
  if (!channel) return { success: false, error: "Channel not found." }

  const { data: assets } = await supabase
    .from("shared_assets")
    .select("*")
    .eq("workspace_id", channel.workspaceId)

  const matched = (assets ?? []).find(
    (a) =>
      parseAssetExportMetadata(a.metadata as Record<string, unknown>)?.trackingId ===
      input.trackingId
  )

  if (matched) {
    const meta = appendSyncHistory(
      ensureTrackingMetadata(matched.metadata as Record<string, unknown>),
      {
        status: input.status,
        tool: input.tool,
        notes: input.notes,
        by: "user",
      }
    )
    if (input.fileUrl) meta.externalFileUrl = input.fileUrl
    await supabase
      .from("shared_assets")
      .update({ metadata: metadataToRecord(meta) })
      .eq("id", matched.id)
  }

  const agentPrompt = [
    `Synced back from ${input.tool} — tracking ${input.trackingId}.`,
    input.status === "synced_back" ? "Changes are ready to merge." : "Work in progress externally.",
    input.notes,
    input.fileUrl ? `File: ${input.fileUrl}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  const { data: message } = await supabase
    .from("messages")
    .insert({
      channel_id: input.channelId,
      author_type: "user",
      user_id: userId,
      content: agentPrompt,
      message_type: "external_sync",
      metadata: {
        trackingId: input.trackingId,
        tool: input.tool,
        syncStatus: input.status,
        externalFileUrl: input.fileUrl,
      },
    })
    .select("id")
    .single()

  if (!message) return { success: false, error: "Failed to post sync report." }

  revalidatePath(`/workspace/channels/${input.channelId}`)
  return {
    success: true,
    data: { messageId: message.id, agentPrompt },
  }
}
