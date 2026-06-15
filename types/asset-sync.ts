/** Tracks design assets exported for external tools (Figma, Sketch, etc.) */

export type AssetSyncStatus =
  | "draft"
  | "exported"
  | "edited_externally"
  | "synced_back"
  | "needs_review"

export type ExternalDesignTool = "figma" | "sketch" | "adobe-xd" | "penpot" | "other"

export type AssetExportFormat =
  | "svg"
  | "figma-tokens"
  | "w3c-tokens"
  | "css"
  | "json"

export interface AssetExportMetadata {
  trackingId: string
  syncStatus: AssetSyncStatus
  exportedAt?: string
  exportedFormats?: AssetExportFormat[]
  externalTool?: ExternalDesignTool
  lastExternalEditAt?: string
  lastSyncReportAt?: string
  externalEditNotes?: string
  externalFileUrl?: string
  syncHistory?: Array<{
    at: string
    status: AssetSyncStatus
    tool?: ExternalDesignTool
    notes?: string
    by: "user" | "agent"
  }>
}

export const SYNC_STATUS_LABELS: Record<AssetSyncStatus, string> = {
  draft: "Draft",
  exported: "Exported",
  edited_externally: "Edited externally",
  synced_back: "Synced back",
  needs_review: "Needs review",
}

export function createTrackingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tt-${crypto.randomUUID().slice(0, 8)}`
  }
  return `tt-${Math.random().toString(16).slice(2, 10)}`
}

export function parseAssetExportMetadata(
  metadata: Record<string, unknown> | undefined
): AssetExportMetadata | null {
  if (!metadata?.trackingId || typeof metadata.trackingId !== "string") return null
  return {
    trackingId: metadata.trackingId,
    syncStatus: (metadata.syncStatus as AssetSyncStatus) ?? "draft",
    exportedAt: metadata.exportedAt as string | undefined,
    exportedFormats: metadata.exportedFormats as AssetExportFormat[] | undefined,
    externalTool: metadata.externalTool as ExternalDesignTool | undefined,
    lastExternalEditAt: metadata.lastExternalEditAt as string | undefined,
    lastSyncReportAt: metadata.lastSyncReportAt as string | undefined,
    externalEditNotes: metadata.externalEditNotes as string | undefined,
    externalFileUrl: metadata.externalFileUrl as string | undefined,
    syncHistory: metadata.syncHistory as AssetExportMetadata["syncHistory"],
  }
}

export function isExternalSyncMessage(content: string): boolean {
  const lower = content.toLowerCase()
  return (
    lower.includes("synced back") ||
    lower.includes("edited in figma") ||
    lower.includes("edited externally") ||
    lower.includes("figma update") ||
    lower.includes("tt-") ||
    lower.includes("tracking id") ||
    lower.includes("imported from figma") ||
    lower.includes("external edit")
  )
}
