"use client"

import { useState, useTransition } from "react"
import { markAssetExportedAction } from "@/app/actions/workspace"
import {
  buildExportBundleForAsset,
  buildFigmaImportGuide,
  downloadTextFile,
} from "@/lib/design-system/asset-export"
import {
  parseAssetExportMetadata,
  SYNC_STATUS_LABELS,
  type AssetExportFormat,
} from "@/types/asset-sync"
import type { SharedAsset } from "@/types/agent-workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Download, FileDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssetExportMenuProps {
  asset: SharedAsset
  channelId?: string
  compact?: boolean
  onExported?: () => void
}

const FORMAT_LABELS: Record<AssetExportFormat, string> = {
  svg: "SVG",
  "figma-tokens": "Figma Tokens",
  "w3c-tokens": "W3C Tokens",
  css: "CSS",
  json: "Manifest",
}

export function AssetExportMenu({
  asset,
  channelId,
  compact,
  onExported,
}: AssetExportMenuProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const syncMeta = parseAssetExportMetadata(asset.metadata)
  const trackingId = syncMeta?.trackingId
  const bundle = buildExportBundleForAsset({
    name: asset.name,
    content: asset.content,
    assetType: asset.assetType,
    metadata: asset.metadata,
  })

  function exportFormat(format: AssetExportFormat) {
    const file = bundle.find((f) => f.format === format)
    if (!file) return
    downloadTextFile(file.filename, file.mimeType, file.body)
    if (channelId) {
      startTransition(async () => {
        await markAssetExportedAction({ assetId: asset.id, channelId, format })
        onExported?.()
      })
    }
  }

  function exportAll() {
    for (const file of bundle) {
      downloadTextFile(file.filename, file.mimeType, file.body)
    }
    if (trackingId) {
      downloadTextFile(
        "figma-import-guide.md",
        "text/markdown",
        buildFigmaImportGuide(trackingId)
      )
    }
    if (channelId) {
      startTransition(async () => {
        await markAssetExportedAction({
          assetId: asset.id,
          channelId,
          format: "json",
          allFormats: bundle.map((b) => b.format),
        })
        onExported?.()
      })
    }
  }

  function copyTrackingId() {
    if (!trackingId) return
    void navigator.clipboard.writeText(trackingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div className="flex flex-wrap items-center gap-2">
        {syncMeta && (
          <Badge variant="outline" className="text-[10px] font-normal">
            {SYNC_STATUS_LABELS[syncMeta.syncStatus]}
          </Badge>
        )}
        {trackingId && (
          <button
            type="button"
            onClick={copyTrackingId}
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3" />
            {copied ? "Copied" : trackingId}
          </button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <Download className="size-3" />
          {expanded ? "Hide exports" : "Export to Figma"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={exportAll}
          disabled={isPending}
        >
          <FileDown className="size-3" />
          All
        </Button>
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-1.5">
          {bundle.map((file) => (
            <Button
              key={file.format}
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => exportFormat(file.format)}
              disabled={isPending}
            >
              {FORMAT_LABELS[file.format]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
