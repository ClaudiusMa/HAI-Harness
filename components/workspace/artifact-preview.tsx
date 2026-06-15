"use client"

import { cn } from "@/lib/utils"
import type { SharedAsset } from "@/types/agent-workspace"
import { AssetExportMenu } from "./asset-export-menu"
import { ExternalLink, FileText, Film, Image, Music, Code2 } from "lucide-react"

interface ArtifactPreviewProps {
  asset: SharedAsset
  compact?: boolean
  className?: string
  channelId?: string
  onExport?: () => void
}

const TYPE_ICONS = {
  image: Image,
  file: FileText,
  link: ExternalLink,
  code: Code2,
  text: FileText,
  document: FileText,
  audio: Music,
  video: Film,
}

export function ArtifactPreview({ asset, compact, className, channelId, onExport }: ArtifactPreviewProps) {
  const Icon = TYPE_ICONS[asset.assetType] ?? FileText
  const preview = asset.content ?? asset.url ?? ""
  const isInlineSvg = preview.trim().startsWith("<svg")

  if (isInlineSvg) {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
        <div
          className={cn("bg-muted/30 p-3", compact ? "max-h-32" : "max-h-48")}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
        <div className="space-y-2 border-t p-2">
          <p className="text-xs font-medium">{asset.name}</p>
          <AssetExportMenu asset={asset} channelId={channelId} compact onExported={onExport} />
        </div>
      </div>
    )
  }

  if (asset.assetType === "image" && asset.url) {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-background", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt={asset.name}
          className={cn("w-full object-cover", compact ? "max-h-32" : "max-h-48")}
        />
        <p className="border-t px-2 py-1 text-xs text-muted-foreground">{asset.name}</p>
        <div className="px-2 pb-2">
          <AssetExportMenu asset={asset} channelId={channelId} compact onExported={onExport} />
        </div>
      </div>
    )
  }

  if (asset.assetType === "code") {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-zinc-950", className)}>
        <div className="flex items-center gap-1.5 border-b border-zinc-800 px-3 py-1.5">
          <Code2 className="size-3 text-zinc-400" />
          <span className="text-xs text-zinc-400">{asset.name}</span>
        </div>
        <pre
          className={cn(
            "overflow-x-auto p-3 font-mono text-xs text-zinc-200",
            compact ? "max-h-24" : "max-h-40"
          )}
        >
          {preview.slice(0, compact ? 300 : 800)}
          {preview.length > (compact ? 300 : 800) ? "…" : ""}
        </pre>
        <div className="border-t border-zinc-800 p-2">
          <AssetExportMenu asset={asset} channelId={channelId} compact onExported={onExport} />
        </div>
      </div>
    )
  }

  if (asset.assetType === "link" && asset.url) {
    return (
      <a
        href={asset.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-start gap-2 rounded-lg border bg-background p-3 transition-colors hover:bg-muted/50",
          className
        )}
      >
        <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{asset.name}</p>
          <p className="truncate text-xs text-muted-foreground">{asset.url}</p>
        </div>
      </a>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3",
        className
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{asset.name}</span>
        <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-muted-foreground">
          {asset.assetType}
        </span>
      </div>
      {preview && (
        <p
          className={cn(
            "whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground",
            compact ? "line-clamp-3" : "line-clamp-6"
          )}
        >
          {preview}
        </p>
      )}
      <AssetExportMenu asset={asset} channelId={channelId} compact onExported={onExport} />
    </div>
  )
}
