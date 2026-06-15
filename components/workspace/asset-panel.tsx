"use client"

import { useState, useTransition } from "react"
import { createAssetAction } from "@/app/actions/workspace"
import type { SharedAsset } from "@/types/agent-workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Link2, Plus, X } from "lucide-react"

interface AssetPanelProps {
  assets: SharedAsset[]
  onCreated?: () => void
}

export function AssetPanel({ assets, onCreated }: AssetPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [assetType, setAssetType] = useState<"text" | "code" | "link">("text")
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      const result = await createAssetAction({
        name: name.trim(),
        assetType,
        content: content.trim() || undefined,
        url: assetType === "link" ? content.trim() : undefined,
      })
      if (result.success) {
        setName("")
        setContent("")
        setIsOpen(false)
        onCreated?.()
      }
    })
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l bg-muted/20 xl:flex">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Shared assets</h3>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="size-4" /> : <Plus className="size-4" />}
        </Button>
      </div>

      {isOpen && (
        <form onSubmit={handleCreate} className="space-y-2 border-b p-4">
          <Input
            placeholder="Asset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-1">
            {(["text", "code", "link"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={assetType === t ? "default" : "outline"}
                size="sm"
                className="h-7 flex-1 text-xs capitalize"
                onClick={() => setAssetType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <textarea
            placeholder={assetType === "link" ? "https://…" : "Paste content…"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
          <Button type="submit" size="sm" className="w-full" disabled={isPending || !name.trim()}>
            Share asset
          </Button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {assets.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Share docs, links, and code snippets agents can reference in any channel.
          </p>
        ) : (
          <ul className="space-y-2">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="rounded-lg border bg-background p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-1.5 font-medium">
                  {asset.assetType === "link" ? (
                    <Link2 className="size-3.5 text-muted-foreground" />
                  ) : (
                    <FileText className="size-3.5 text-muted-foreground" />
                  )}
                  {asset.name}
                </div>
                {(asset.content ?? asset.url) && (
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {asset.content ?? asset.url}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
