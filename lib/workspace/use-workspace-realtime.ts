"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  mapMessage,
  mapSharedAsset,
  mapWorkflowAnnotation,
} from "@/lib/workspace/mappers"
import type {
  AgentStatus,
  ChannelAgent,
  Message,
  MessageAuthor,
  WorkflowAnnotation,
} from "@/types/agent-workspace"

export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface BroadcastPayload {
  table?: string
  record?: Record<string, unknown>
  old_record?: Record<string, unknown>
  new?: Record<string, unknown>
  old?: Record<string, unknown>
}

export function workspaceChannelTopic(channelId: string): string {
  return `workspace:channel:${channelId}`
}

function resolveAuthorFromRow(
  row: Record<string, unknown>,
  channelAgents: ChannelAgent[]
): MessageAuthor | undefined {
  if (row.author_type === "system") {
    return { type: "system", id: "system", name: "System" }
  }

  if (row.author_type === "user") {
    return { type: "user", id: row.user_id as string, name: "You" }
  }

  if (row.author_type === "agent" && row.workspace_agents) {
    const wa = row.workspace_agents as {
      id: string
      custom_name: string | null
      instructions_version: number
      agent_definitions: {
        name: string
        slug: string
        role: string
        avatar_color: string
        icon: string
      } | null
    }
    const def = wa.agent_definitions
    const channelAgent = channelAgents.find((ca) => ca.workspaceAgentId === wa.id)
    return {
      type: "agent",
      id: wa.id,
      name: channelAgent?.roleAlias ?? wa.custom_name ?? def?.name ?? "Agent",
      avatarColor: def?.avatar_color,
      icon: def?.icon,
      role: def?.role,
      version: channelAgent?.instructionsVersion ?? Number(wa.instructions_version ?? 1),
      roleAlias: channelAgent?.roleAlias,
    }
  }

  return undefined
}

async function fetchMessageWithDetails(
  messageId: string,
  channelAgents: ChannelAgent[]
): Promise<Message | null> {
  const supabase = createClient()

  const { data: row } = await supabase
    .from("messages")
    .select(`
      *,
      workspace_agents(id, custom_name, instructions_version, agent_definitions(name, slug, role, avatar_color, icon))
    `)
    .eq("id", messageId)
    .maybeSingle()

  if (!row) return null

  const { data: assetLinks } = await supabase
    .from("message_assets")
    .select("shared_assets(*)")
    .eq("message_id", messageId)

  const assets = (assetLinks ?? [])
    .map((l) => l.shared_assets)
    .filter(Boolean)
    .map((a) => mapSharedAsset(a))

  return mapMessage(row as Record<string, unknown>, resolveAuthorFromRow(row, channelAgents), assets)
}

async function fetchAnnotationWithDetails(
  annotationId: string,
  channelAgents: ChannelAgent[]
): Promise<WorkflowAnnotation | null> {
  const supabase = createClient()

  const { data: row } = await supabase
    .from("workflow_annotations")
    .select(`
      *,
      workspace_agents(id, custom_name, instructions_version, agent_definitions(name, slug, role, avatar_color, icon))
    `)
    .eq("id", annotationId)
    .maybeSingle()

  if (!row) return null

  let author: MessageAuthor | undefined
  if (row.workspace_agents) {
    const wa = row.workspace_agents as {
      id: string
      custom_name: string | null
      instructions_version: number
      agent_definitions: {
        name: string
        slug: string
        role: string
        avatar_color: string
        icon: string
      } | null
    }
    const def = wa.agent_definitions
    const channelAgent = channelAgents.find((ca) => ca.workspaceAgentId === wa.id)
    author = {
      type: "agent",
      id: wa.id,
      name: channelAgent?.roleAlias ?? wa.custom_name ?? def?.name ?? "Agent",
      avatarColor: def?.avatar_color,
      icon: def?.icon,
      role: def?.role,
      roleAlias: channelAgent?.roleAlias,
    }
  }

  return mapWorkflowAnnotation(row as Record<string, unknown>, author)
}

interface UseWorkspaceRealtimeOptions {
  channelId: string
  channelAgents: ChannelAgent[]
  onMessage?: (message: Message, event: "INSERT" | "UPDATE" | "DELETE") => void
  onAgentStatusChange?: (update: {
    channelAgentId: string
    workspaceAgentId: string
    status: AgentStatus
  }) => void
  onAnnotation?: (annotation: WorkflowAnnotation, event: "INSERT" | "UPDATE" | "DELETE") => void
  onContextChange?: () => void
}

export function useWorkspaceRealtime({
  channelId,
  channelAgents,
  onMessage,
  onAgentStatusChange,
  onAnnotation,
  onContextChange,
}: UseWorkspaceRealtimeOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("connecting")
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  )
  const channelAgentsRef = useRef(channelAgents)
  channelAgentsRef.current = channelAgents

  const onMessageRef = useRef(onMessage)
  const onAgentStatusRef = useRef(onAgentStatusChange)
  const onAnnotationRef = useRef(onAnnotation)
  const onContextChangeRef = useRef(onContextChange)
  onMessageRef.current = onMessage
  onAgentStatusRef.current = onAgentStatusChange
  onAnnotationRef.current = onAnnotation
  onContextChangeRef.current = onContextChange

  useEffect(() => {
    const supabase = createClient()
    const topic = workspaceChannelTopic(channelId)
    let cancelled = false

    async function handleBroadcast(event: string, payload: BroadcastPayload) {
      const table = payload.table
      const record =
        payload.record ??
        payload.new ??
        payload.old_record ??
        payload.old
      if (!table || !record) return

      if (table === "messages") {
        if (event === "DELETE") {
          onMessageRef.current?.(mapMessage(record), "DELETE")
          return
        }

        const message = await fetchMessageWithDetails(
          record.id as string,
          channelAgentsRef.current
        )
        if (message && !cancelled) {
          onMessageRef.current?.(message, event as "INSERT" | "UPDATE")
        }
        return
      }

      if (table === "workflow_annotations") {
        if (event === "DELETE") {
          onAnnotationRef.current?.(
            mapWorkflowAnnotation(record),
            "DELETE"
          )
          return
        }

        const annotation = await fetchAnnotationWithDetails(
          record.id as string,
          channelAgentsRef.current
        )
        if (annotation && !cancelled) {
          onAnnotationRef.current?.(annotation, event as "INSERT" | "UPDATE")
        }
        return
      }

      if (table === "channel_agents" && event === "UPDATE") {
        const status = record.status as AgentStatus
        onAgentStatusRef.current?.({
          channelAgentId: record.id as string,
          workspaceAgentId: record.workspace_agent_id as string,
          status,
        })
        if (status === "idle") {
          onContextChangeRef.current?.()
        }
      }
    }

    async function subscribe() {
      setConnectionStatus("connecting")

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      try {
        await supabase.realtime.setAuth()
      } catch {
        setConnectionStatus("error")
        return
      }

      const realtimeChannel = supabase.channel(topic, {
        config: {
          private: true,
          broadcast: { self: true },
        },
      })

      channelRef.current = realtimeChannel

      realtimeChannel
        .on("broadcast", { event: "INSERT" }, ({ payload }) => {
          void handleBroadcast("INSERT", payload as BroadcastPayload)
        })
        .on("broadcast", { event: "UPDATE" }, ({ payload }) => {
          void handleBroadcast("UPDATE", payload as BroadcastPayload)
        })
        .on("broadcast", { event: "DELETE" }, ({ payload }) => {
          void handleBroadcast("DELETE", payload as BroadcastPayload)
        })
        .subscribe((status, err) => {
          if (cancelled) return

          switch (status) {
            case "SUBSCRIBED":
              setConnectionStatus("connected")
              break
            case "CHANNEL_ERROR":
              setConnectionStatus("error")
              console.error("[workspace-realtime]", err)
              break
            case "CLOSED":
            case "TIMED_OUT":
              setConnectionStatus("disconnected")
              break
            default:
              break
          }
        })
    }

    void subscribe()

    return () => {
      cancelled = true
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [channelId])

  return { connectionStatus }
}

export function patchChannelAgentStatus(
  agents: ChannelAgent[],
  channelAgentId: string,
  status: AgentStatus
): ChannelAgent[] {
  return agents.map((ca) =>
    ca.id === channelAgentId ? { ...ca, status } : ca
  )
}
