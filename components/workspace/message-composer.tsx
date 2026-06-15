"use client"

import { useRef, useState, useTransition } from "react"
import { sendMessageAction } from "@/app/actions/workspace"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ChannelAgent, SharedAsset, WorkspaceAgent } from "@/types/agent-workspace"
import { Paperclip, Send, X } from "lucide-react"

interface MessageComposerProps {
  channelId: string
  threadId?: string | null
  agents: WorkspaceAgent[]
  channelAgents?: ChannelAgent[]
  assets: SharedAsset[]
  onAgentThinking?: (roleAlias: string | null) => void
  placeholder?: string
  multiplayer?: boolean
}

export function MessageComposer({
  channelId,
  threadId,
  agents,
  channelAgents = [],
  assets,
  onAgentThinking,
  placeholder = "Message… use @Writer, @Designer, etc.",
  multiplayer = false,
}: MessageComposerProps) {
  const [content, setContent] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [showAssets, setShowAssets] = useState(false)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentionTargets =
    channelAgents.length > 0
      ? channelAgents.map((ca) => ({
          id: ca.id,
          label: ca.roleAlias,
          mention: ca.roleAlias,
        }))
      : agents
          .filter((a) => a.isEnabled && a.definition)
          .map((a) => ({
            id: a.id,
            label: a.customName ?? a.definition!.name,
            mention: a.definition!.slug,
          }))

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    const mentioned = mentionTargets.find((t) =>
      trimmed.toLowerCase().includes(`@${t.mention.toLowerCase()}`)
    )
    onAgentThinking?.(mentioned?.mention ?? mentionTargets[0]?.mention ?? null)

    startTransition(async () => {
      const result = await sendMessageAction({
        channelId,
        content: trimmed,
        threadId,
        assetIds: selectedAssets.length ? selectedAssets : undefined,
      })

      if (result.success && result.data) {
        setContent("")
        setSelectedAssets([])

        void fetch(multiplayer ? "/api/agents/collaborate" : "/api/agents/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId,
            messageId: result.data.messageId,
            content: trimmed,
            threadId,
          }),
        }).finally(() => {
          onAgentThinking?.(null)
        })
      } else {
        onAgentThinking?.(null)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function insertMention(mention: string) {
    const tag = `@${mention} `
    setContent((prev) => (prev ? `${prev} ${tag}` : tag))
    textareaRef.current?.focus()
  }

  const selectedAssetObjects = assets.filter((a) => selectedAssets.includes(a.id))

  return (
    <div className="border-t bg-background p-4">
      {selectedAssetObjects.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedAssetObjects.map((asset) => (
            <span
              key={asset.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              <Paperclip className="size-3" />
              {asset.name}
              <button
                type="button"
                onClick={() => setSelectedAssets((ids) => ids.filter((id) => id !== asset.id))}
                className="ml-0.5 rounded-full hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {mentionTargets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mentionTargets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => insertMention(t.mention)}
                className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                @{t.mention}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-xl border bg-muted/30 p-2 focus-within:ring-2 focus-within:ring-ring/30">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none",
              "placeholder:text-muted-foreground"
            )}
            disabled={isPending}
          />

          <div className="flex shrink-0 gap-1 pb-1">
            {assets.length > 0 && (
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowAssets(!showAssets)}
                >
                  <Paperclip className="size-4" />
                </Button>
                {showAssets && (
                  <div className="absolute bottom-full right-0 z-10 mb-1 w-56 rounded-lg border bg-popover p-2 shadow-lg">
                    <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
                      Attach artifact
                    </p>
                    {assets.slice(0, 8).map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setSelectedAssets((ids) =>
                            ids.includes(asset.id) ? ids : [...ids, asset.id]
                          )
                          setShowAssets(false)
                        }}
                      >
                        {asset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="icon"
              className="size-8"
              disabled={!content.trim() || isPending}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Enter to send · Shift+Enter for new line ·{" "}
          {multiplayer
            ? "Cohort mode — all agents work their lane and annotate by expertise"
            : "Agents share updates and artifacts autonomously"}
        </p>
      </form>
    </div>
  )
}
