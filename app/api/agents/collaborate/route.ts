import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { isMultiplayerChannel } from "@/lib/agents/expertise"
import {
  generateCollaborationResponse,
  resolveCollaborationParticipants,
  summarizePeerActivity,
} from "@/lib/agents/multiplayer-orchestrator"
import { ensureTrackingMetadata } from "@/lib/design-system/asset-export"
import { metadataToRecord } from "@/lib/design-system/asset-sync"
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

  const multiplayer = isMultiplayerChannel(channelAgents.length, channel.slug)
  const participants = resolveCollaborationParticipants(content, channelAgents, multiplayer)

  if (participants.length === 0) {
    return NextResponse.json({ success: true, messageIds: [], annotationIds: [], sessionId: null })
  }

  const sessionId = randomUUID()
  const createdMessageIds: string[] = []
  const createdAnnotationIds: string[] = []
  const peerSummaries: string[] = []

  const channelContext = [channel.description, channel.contextSummary]
    .filter(Boolean)
    .join("\n")

  const taskFirst = [
    ...participants.filter((p) => p.mode === "task"),
    ...participants.filter((p) => p.mode === "annotation"),
  ]

  for (const participant of taskFirst) {
    const { agent, channelAgent } = participant
    await setAgentStatus(agent.id, "working", channelAgent?.id)

    const response = await generateCollaborationResponse(participant, {
      userMessage: content,
      recentMessages,
      channelContext,
      channelMemory: channel.contextSummary,
      designSystemState: channel.designSystemState,
      peerSummaries,
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
          collaborationMode: participant.mode,
          expertiseDomain: participant.domain,
          sessionId,
        },
      })
      .select("id")
      .single()

    if (agentMessage) {
      createdMessageIds.push(agentMessage.id)

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

      if (participant.mode === "annotation" && response.annotation) {
        const { data: annotation } = await supabase
          .from("workflow_annotations")
          .insert({
            channel_id: channelId,
            workspace_id: channel.workspaceId,
            session_id: sessionId,
            trigger_message_id: messageId ?? null,
            message_id: agentMessage.id,
            workspace_agent_id: agent.id,
            expertise_domain: response.annotation.domain,
            target_ref: response.annotation.targetRef,
            target_label: response.annotation.targetLabel,
            content: response.content,
            severity: response.annotation.severity,
            metadata: {
              roleAlias: channelAgent?.roleAlias,
              collaborationMode: participant.mode,
            },
          })
          .select("id")
          .single()

        if (annotation) createdAnnotationIds.push(annotation.id)
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

    peerSummaries.push(
      summarizePeerActivity(
        channelAgent?.roleAlias ?? agent.definition?.name ?? "Agent",
        participant.mode,
        participant.domain
      )
    )

    await setAgentStatus(agent.id, "idle", channelAgent?.id)
  }

  return NextResponse.json({
    success: true,
    sessionId,
    messageIds: createdMessageIds,
    annotationIds: createdAnnotationIds,
    participantCount: participants.length,
  })
}
