import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateAgentResponse, resolveRespondingAgents } from "@/lib/agents/orchestrator"
import { isBrandAIQuery, queryBrandAI } from "@/lib/agents/brand-ai"
import { ensureTrackingMetadata } from "@/lib/design-system/asset-export"
import { metadataToRecord } from "@/lib/design-system/asset-sync"
import { parseMentionedAgentSlugs } from "@/lib/agents/registry"
import {
  appendAgentMemory,
  appendChannelContext,
  getChannelAgents,
  getChannelById,
  getChannelMessages,
  setAgentStatus,
} from "@/lib/workspace/queries"
import { mapAgentDefinition, mapWorkspaceAgent } from "@/lib/workspace/mappers"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    channelId?: string
    messageId?: string
    content?: string
    threadId?: string | null
  }

  const { channelId, messageId, content, threadId } = body

  if (!channelId || !content) {
    return NextResponse.json({ error: "Missing channelId or content" }, { status: 400 })
  }

  const channel = await getChannelById(channelId)
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const [channelAgents, agentRows, recentMessages] = await Promise.all([
    getChannelAgents(channelId),
    supabase
      .from("workspace_agents")
      .select("*, agent_definitions(*)")
      .eq("workspace_id", channel.workspaceId),
    getChannelMessages(channelId, { threadId: threadId ?? null }),
  ])

  const agents = (agentRows.data ?? []).map((row) =>
    mapWorkspaceAgent(
      row,
      row.agent_definitions ? mapAgentDefinition(row.agent_definitions) : undefined
    )
  )

  const responding = resolveRespondingAgents(
    content,
    channelAgents,
    agents,
    channel.defaultAgentId
  )

  const createdIds: string[] = []
  const channelContext = [channel.description, channel.contextSummary]
    .filter(Boolean)
    .join("\n")

  const mentions = parseMentionedAgentSlugs(content).map((m) => m.toLowerCase())
  const mentionsBrandAI = isBrandAIQuery(content)
  const onlyBrandAI =
    mentions.length > 0 && mentions.every((m) => m === "brandai")

  if (mentionsBrandAI) {
    const hostAgent =
      agents.find((a) => a.definition?.slug === "sage") ??
      agents.find((a) => a.definition?.slug === "alex") ??
      agents[0]

    if (hostAgent) {
      const { data: brandMessage } = await supabase
        .from("messages")
        .insert({
          channel_id: channelId,
          thread_id: threadId ?? null,
          author_type: "agent",
          workspace_agent_id: hostAgent.id,
          content: `**BrandAI**\n\n${queryBrandAI(content)}`,
          message_type: "update",
          metadata: {
            inReplyTo: messageId ?? null,
            roleAlias: "BrandAI",
            virtualAgent: true,
          },
        })
        .select("id")
        .single()

      if (brandMessage) createdIds.push(brandMessage.id)
    }

    if (onlyBrandAI) {
      return NextResponse.json({ success: true, messageIds: createdIds })
    }
  }

  for (const { agent, channelAgent } of responding) {
    await setAgentStatus(agent.id, "thinking", channelAgent?.id)

    const response = await generateAgentResponse({
      agent,
      channelAgent,
      userMessage: content,
      recentMessages,
      channelContext,
      channelMemory: channel.contextSummary,
      designSystemState: channel.designSystemState,
    })

    const { data: agentMessage } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        thread_id: threadId ?? null,
        author_type: "agent",
        workspace_agent_id: agent.id,
        content: response.content,
        message_type: response.messageType,
        metadata: {
          inReplyTo: messageId ?? null,
          roleAlias: channelAgent?.roleAlias,
          version: channelAgent?.instructionsVersion ?? agent.instructionsVersion,
        },
      })
      .select("id")
      .single()

    if (agentMessage) {
      createdIds.push(agentMessage.id)

      if (response.artifactSuggestion) {
        const tracking = ensureTrackingMetadata(undefined)
        const { data: asset } = await supabase
          .from("shared_assets")
          .insert({
            workspace_id: channel.workspaceId,
            channel_id: channelId,
            name: response.artifactSuggestion.name,
            asset_type: response.artifactSuggestion.type,
            content: response.artifactSuggestion.content,
            metadata: metadataToRecord(tracking),
          })
          .select("id")
          .single()

        if (asset) {
          await supabase.from("message_assets").insert({
            message_id: agentMessage.id,
            asset_id: asset.id,
          })
        }
      }
    }

    if (response.memoryDelta) {
      await appendAgentMemory(agent.id, response.memoryDelta)
    }

    if (response.channelContextDelta) {
      await appendChannelContext(channelId, response.channelContextDelta, user.id)
    }

    if (response.designSystemState) {
      await supabase
        .from("channels")
        .update({ design_system_state: response.designSystemState })
        .eq("id", channelId)
    }

    await setAgentStatus(agent.id, "idle", channelAgent?.id)
  }

  return NextResponse.json({ success: true, messageIds: createdIds })
}
