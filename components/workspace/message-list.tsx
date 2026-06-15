"use client"

import { cn } from "@/lib/utils"
import type { Message } from "@/types/agent-workspace"
import { AgentAvatar } from "./agent-avatar"
import { AgentVersionBadge } from "./agent-version-badge"
import { ArtifactPreview } from "./artifact-preview"
import { MessageTypeBadge } from "./message-type-badge"
import { GitBranch, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageListProps {
  messages: Message[]
  channelId?: string
  onForkThread?: (messageId: string) => void
  onOpenThread?: (threadId: string) => void
  onAssetExport?: () => void
  isLoading?: boolean
  thinkingAgent?: string | null
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

function formatDateDivider(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*|@[a-zA-Z][a-zA-Z0-9_-]*|`[^`]+`|\[EXTERNAL SYNC[^\]]*\]|\[DESIGN SYSTEM UPDATED[^\]]*\]|\[STARTING DESIGN SYSTEM BUILD[^\]]*\]|\[UPDATE FROM @[^\]]+\]|\[TASK COMPLETE\]|\[ANNOTATION ·[^\]]+\]|\[MOTION SPEC[^\]]*\]|\[ACCESSIBILITY[^\]]*\]|\[BRAND ASSET[^\]]*\])/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
          {part}
        </span>
      )
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (
      part.startsWith("[UPDATE") ||
      part.startsWith("[TASK") ||
      part.startsWith("[EXTERNAL SYNC") ||
      part.startsWith("[DESIGN SYSTEM") ||
      part.startsWith("[STARTING DESIGN") ||
      part.startsWith("[ANNOTATION") ||
      part.startsWith("[MOTION") ||
      part.startsWith("[ACCESSIBILITY") ||
      part.startsWith("[BRAND")
    ) {
      return (
        <span key={i} className="font-semibold text-primary">
          {part}
        </span>
      )
    }
    return part
  })
}

export function MessageList({
  messages,
  channelId,
  onForkThread,
  onOpenThread,
  onAssetExport,
  isLoading,
  thinkingAgent,
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading messages…
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium">No messages yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Assign agents in the Canvas panel, then @mention them or describe your task.
          Agents share outputs and status updates here.
        </p>
      </div>
    )
  }

  let lastDate = ""

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
      {messages.map((message, index) => {
        const date = formatDateDivider(message.createdAt)
        const showDate = date !== lastDate
        lastDate = date

        const prev = messages[index - 1]
        const isGrouped =
          prev &&
          prev.author?.id === message.author?.id &&
          prev.authorType === message.authorType &&
          prev.messageType === message.messageType &&
          new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < 300000

        const isUser = message.authorType === "user"
        const isSystem = message.authorType === "system"
        const isStatusMessage = message.messageType !== "normal"

        if (isSystem) {
          return (
            <div key={message.id}>
              {showDate && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{date}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <p className="py-2 text-center text-xs text-muted-foreground">{message.content}</p>
            </div>
          )
        }

        return (
          <div key={message.id}>
            {showDate && (
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{date}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <div
              className={cn(
                "group flex gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50",
                isUser && "flex-row-reverse",
                isStatusMessage && !isUser && "border-l-2 border-primary/30 pl-3"
              )}
            >
              {!isGrouped ? (
                message.author ? (
                  <AgentAvatar author={message.author} size="sm" />
                ) : (
                  <div className="size-7 shrink-0" />
                )
              ) : (
                <div className="size-7 shrink-0" />
              )}

              <div className={cn("min-w-0 flex-1", isUser && "text-right")}>
                {!isGrouped && message.author && (
                  <div className={cn("mb-0.5 flex flex-wrap items-baseline gap-2", isUser && "justify-end")}>
                    <span className="text-sm font-semibold">{message.author.name}</span>
                    {message.author.version !== undefined && (
                      <AgentVersionBadge version={message.author.version} />
                    )}
                    {message.author.role && (
                      <span className="text-xs text-muted-foreground">{message.author.role}</span>
                    )}
                    <MessageTypeBadge type={message.messageType} />
                    <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                  </div>
                )}

                <div
                  className={cn(
                    "inline-block max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : isStatusMessage
                        ? "border bg-background rounded-bl-md shadow-sm"
                        : "bg-muted rounded-bl-md"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{renderContent(message.content)}</div>

                  {message.assets && message.assets.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.assets.map((asset) => (
                        <ArtifactPreview
                          key={asset.id}
                          asset={asset}
                          channelId={channelId}
                          compact
                          onExport={onAssetExport}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {(message.replyCount ?? 0) > 0 || onForkThread ? (
                  <div className={cn("mt-1 flex gap-1", isUser && "justify-end")}>
                    {(message.replyCount ?? 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-primary"
                        onClick={() => onOpenThread?.(message.id)}
                      >
                        <MessageSquare className="size-3" />
                        {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
                      </Button>
                    )}
                    {onForkThread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs opacity-0 group-hover:opacity-100"
                        onClick={() => onForkThread(message.id)}
                      >
                        <GitBranch className="size-3" />
                        Fork thread
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}

      {thinkingAgent && (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-blue-500" />
          @{thinkingAgent} is thinking…
        </div>
      )}
    </div>
  )
}
