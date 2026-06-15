"use client"

import { useState, useTransition } from "react"
import { reportExternalSyncAction } from "@/app/actions/workspace"
import type { ExternalDesignTool } from "@/types/asset-sync"
import type { SharedAsset } from "@/types/agent-workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

interface ExternalSyncPanelProps {
  channelId: string
  assets: SharedAsset[]
  onReported?: () => void
}

const TOOLS: { id: ExternalDesignTool; label: string }[] = [
  { id: "figma", label: "Figma" },
  { id: "sketch", label: "Sketch" },
  { id: "adobe-xd", label: "Adobe XD" },
  { id: "penpot", label: "Penpot" },
  { id: "other", label: "Other" },
]

export function ExternalSyncPanel({
  channelId,
  assets,
  onReported,
}: ExternalSyncPanelProps) {
  const [trackingId, setTrackingId] = useState("")
  const [tool, setTool] = useState<ExternalDesignTool>("figma")
  const [fileUrl, setFileUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [syncType, setSyncType] = useState<"edited_externally" | "synced_back">(
    "synced_back"
  )
  const [isPending, startTransition] = useTransition()

  const trackedAssets = assets.filter((a) => a.metadata?.trackingId)

  function submit() {
    startTransition(async () => {
      const result = await reportExternalSyncAction({
        channelId,
        trackingId: trackingId.trim(),
        tool,
        status: syncType,
        notes: notes.trim(),
        fileUrl: fileUrl.trim() || undefined,
      })
      if (result.success) {
        setNotes("")
        setFileUrl("")
        onReported?.()

        if (result.data?.messageId) {
          void fetch("/api/agents/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channelId,
              messageId: result.data.messageId,
              content: result.data.agentPrompt ?? notes,
            }),
          })
        }
      }
    })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">External edit sync</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Edited in Figma or another tool? Report back here — agents track progress even
        outside this thread. Use the asset tracking ID from export.
      </p>

      {trackedAssets.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Tracked assets</Label>
          <div className="flex flex-wrap gap-1">
            {trackedAssets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setTrackingId(String(a.metadata?.trackingId ?? ""))
                }
                className="rounded border bg-muted/50 px-2 py-0.5 font-mono text-[10px] hover:bg-muted"
              >
                {String(a.metadata?.trackingId)} · {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="sync-tracking" className="text-xs">
          Tracking ID
        </Label>
        <Input
          id="sync-tracking"
          placeholder="tt-a1b2c3d4"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="flex gap-1">
        {(["synced_back", "edited_externally"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            variant={syncType === t ? "default" : "outline"}
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => setSyncType(t)}
          >
            {t === "synced_back" ? "Synced back" : "Edited externally"}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {TOOLS.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tool === t.id ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTool(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sync-url" className="text-xs">
          Figma / file URL (optional)
        </Label>
        <Input
          id="sync-url"
          placeholder="https://figma.com/file/…"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <textarea
        placeholder="What changed? e.g. Primary green shifted to #3d9a5a on homepage artboard"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full rounded-md border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/30"
      />

      <Button
        size="sm"
        className="w-full"
        disabled={isPending || !trackingId.trim() || !notes.trim()}
        onClick={submit}
      >
        Report sync — notify agents
      </Button>
    </div>
  )
}
