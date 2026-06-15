"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { forkThreadAction, refreshChannelAction } from "@/app/actions/workspace"
import type {
  AgentStatus,
  Channel,
  ChannelAgent,
  ChannelContextVersion,
  InstructionVersion,
  Message,
  SharedAsset,
  WorkflowAnnotation,
  WorkspaceAgent,
} from "@/types/agent-workspace"
import { isMultiplayerChannel } from "@/lib/agents/expertise"
import {
  patchChannelAgentStatus,
  useWorkspaceRealtime,
} from "@/lib/workspace/use-workspace-realtime"
import { MessageList } from "./message-list"
import { MessageComposer } from "./message-composer"
import { ChannelContextPanel } from "./channel-context-panel"
import { AgentStatusIndicator } from "./agent-status-indicator"
import { RealtimeStatus } from "./realtime-status"
import { Hash, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChannelViewProps {
  channel: Channel
  messages: Message[]
  channelAgents: ChannelAgent[]
  agents: WorkspaceAgent[]
  assets: SharedAsset[]
  contextHistory: ChannelContextVersion[]
  instructionHistory: InstructionVersion[]
  threads?: Channel[]
  annotations?: WorkflowAnnotation[]
}

function mergeMessage(list: Message[], incoming: Message, event: "INSERT" | "UPDATE" | "DELETE") {
  if (event === "DELETE") {
    return list.filter((m) => m.id !== incoming.id)
  }
  const idx = list.findIndex((m) => m.id === incoming.id)
  if (idx >= 0) {
    const next = [...list]
    next[idx] = incoming
    return next
  }
  return [...list, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function ChannelView({
  channel,
  messages: initialMessages,
  channelAgents: initialChannelAgents,
  agents,
  assets,
  contextHistory,
  instructionHistory,
  threads = [],
  annotations: initialAnnotations = [],
}: ChannelViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [liveChannelAgents, setLiveChannelAgents] = useState(initialChannelAgents)
  const [annotations, setAnnotations] = useState(initialAnnotations)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [thinkingAgent, setThinkingAgent] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages, channel.id])

  useEffect(() => {
    setLiveChannelAgents(initialChannelAgents)
  }, [initialChannelAgents, channel.id])

  useEffect(() => {
    setAnnotations(initialAnnotations)
  }, [initialAnnotations, channel.id])

  const multiplayer = isMultiplayerChannel(liveChannelAgents.length, channel.slug)

  const refresh = useCallback(() => {
    startTransition(async () => {
      await refreshChannelAction(channel.id)
      router.refresh()
    })
  }, [channel.id, router])

  const { connectionStatus } = useWorkspaceRealtime({
    channelId: channel.id,
    channelAgents: liveChannelAgents,
    onMessage: (message, event) => {
      setMessages((prev) => mergeMessage(prev, message, event))

      if (message.authorType === "agent" && event === "INSERT") {
        setThinkingAgent(null)
        if (message.messageType === "design_system_update") {
          refresh()
        }
      }
    },
    onAgentStatusChange: ({ channelAgentId, status }) => {
      setLiveChannelAgents((prev) => patchChannelAgentStatus(prev, channelAgentId, status))

      if (status === "thinking") {
        const agent = liveChannelAgents.find((ca) => ca.id === channelAgentId)
        if (agent) setThinkingAgent(agent.roleAlias)
      }
      if (status === "idle") {
        setThinkingAgent(null)
      }
    },
    onContextChange: refresh,
    onAnnotation: (annotation, event) => {
      if (event === "DELETE") {
        setAnnotations((prev) => prev.filter((a) => a.id !== annotation.id))
        return
      }
      setAnnotations((prev) => {
        const idx = prev.findIndex((a) => a.id === annotation.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = annotation
          return next
        }
        return [annotation, ...prev]
      })
    },
  })

  function handleForkThread(messageId: string) {
    startTransition(async () => {
      const result = await forkThreadAction({ channelId: channel.id, messageId })
      if (result.success && result.data) {
        setActiveThreadId(result.data.threadId)
        refresh()
      }
    })
  }

  const threadMessages = activeThreadId
    ? messages.filter((m) => m.threadId === activeThreadId)
    : messages.filter((m) => !m.threadId)

  const activeThread = threads.find((t) => t.id === activeThreadId)

  const composerAgents = liveChannelAgents.length
    ? liveChannelAgents
        .filter((ca) => ca.agent)
        .map((ca) => ({
          ...ca.agent!,
          definition: ca.agent!.definition,
          customName: ca.roleAlias,
        }))
    : agents

  const displayThinking =
    thinkingAgent ??
    (liveChannelAgents.find((ca) => ca.status === "thinking")?.roleAlias ?? null)

  return (
    <div className="flex h-full flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-6 py-4">
          {channel.channelType === "group" ? (
            <Hash className="size-5 text-muted-foreground" />
          ) : (
            <MessageSquare className="size-5 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {activeThread ? activeThread.name : channel.name}
              </h2>
              {channel.domain && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {channel.domain}
                </span>
              )}
              {multiplayer && (
                <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">
                  Cohort live
                </span>
              )}
              <RealtimeStatus status={connectionStatus} />
            </div>
            {(activeThread?.description ?? channel.description) && (
              <p className="truncate text-sm text-muted-foreground">
                {activeThread?.description ?? channel.description}
              </p>
            )}
            {liveChannelAgents.length > 0 && !activeThreadId && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {liveChannelAgents.map((ca) => (
                  <span
                    key={ca.id}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-xs"
                  >
                    <AgentStatusIndicator status={ca.status as AgentStatus} />
                    @{ca.roleAlias}
                  </span>
                ))}
              </div>
            )}
          </div>
          {activeThreadId && (
            <Button variant="ghost" size="sm" onClick={() => setActiveThreadId(null)}>
              Back to channel
            </Button>
          )}
        </header>

        <MessageList
          messages={threadMessages}
          channelId={channel.id}
          onAssetExport={refresh}
          onForkThread={activeThreadId ? undefined : handleForkThread}
          onOpenThread={(messageId) => {
            const thread = threads.find((t) => t.forkedFromMessageId === messageId)
            if (thread) setActiveThreadId(thread.id)
          }}
          isLoading={isPending}
          thinkingAgent={displayThinking}
        />

        <MessageComposer
          channelId={channel.id}
          threadId={activeThreadId}
          agents={composerAgents}
          channelAgents={liveChannelAgents}
          assets={assets.filter((a) => !a.channelId || a.channelId === channel.id)}
          onAgentThinking={setThinkingAgent}
          multiplayer={multiplayer}
          placeholder={
            multiplayer
              ? "Describe the workflow task… all agents respond in their lanes"
              : channel.channelType === "direct"
                ? "Message this agent…"
                : "Describe the task… @Alex @Writer @Analyst"
          }
        />
      </div>

      {channel.channelType === "group" && (
        <ChannelContextPanel
          channel={channel}
          channelAgents={liveChannelAgents}
          assets={assets}
          contextHistory={contextHistory}
          instructionHistory={instructionHistory}
          annotations={annotations}
          multiplayer={multiplayer}
          thinkingAgent={displayThinking}
          onUpdated={refresh}
        />
      )}
    </div>
  )
}
