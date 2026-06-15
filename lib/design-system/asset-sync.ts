import type {
  AssetExportMetadata,
  AssetSyncStatus,
  ExternalDesignTool,
} from "@/types/asset-sync"

export function buildSyncAckResponse(input: {
  agentName: string
  alias: string
  trackingId: string
  status: AssetSyncStatus
  tool?: ExternalDesignTool
  notes?: string
  fileUrl?: string
}): string {
  const statusLine =
    input.status === "synced_back"
      ? "Synced back — I'll reconcile tokens and artboard status."
      : input.status === "edited_externally"
        ? "Noted external edit — I'll compare against our source of truth."
        : "Tracking update recorded."

  return [
    `**${input.agentName}** [@${input.alias}]`,
    `[EXTERNAL SYNC · ${input.trackingId}]`,
    "",
    statusLine,
    "",
    input.tool ? `**Tool:** ${input.tool}` : "",
    input.fileUrl ? `**File:** ${input.fileUrl}` : "",
    input.notes ? `**Notes:** ${input.notes}` : "",
    "",
    "**Next:**",
    "- Artboard status updated in Canvas",
    "- Drift check vs tokens.js / theme.css",
    input.status === "synced_back"
      ? "- If tokens changed, I'll bump design system version"
      : "- Waiting for your sync-back message when Figma edits are final",
  ]
    .filter(Boolean)
    .join("\n")
}

export function extractTrackingId(text: string): string | null {
  const match = text.match(/tt-[a-f0-9]{8}/i)
  return match?.[0] ?? null
}

export function inferSyncStatus(text: string): AssetSyncStatus {
  const lower = text.toLowerCase()
  if (lower.includes("synced back") || lower.includes("imported from figma")) return "synced_back"
  if (lower.includes("edited") || lower.includes("updated in figma")) return "edited_externally"
  if (lower.includes("needs review") || lower.includes("please review")) return "needs_review"
  return "edited_externally"
}

export function inferExternalTool(text: string): ExternalDesignTool | undefined {
  const lower = text.toLowerCase()
  if (lower.includes("figma")) return "figma"
  if (lower.includes("sketch")) return "sketch"
  if (lower.includes("xd") || lower.includes("adobe")) return "adobe-xd"
  if (lower.includes("penpot")) return "penpot"
  return undefined
}

export function appendSyncHistory(
  meta: AssetExportMetadata,
  entry: {
    status: AssetSyncStatus
    tool?: ExternalDesignTool
    notes?: string
    by: "user" | "agent"
  }
): AssetExportMetadata {
  const at = new Date().toISOString()
  return {
    ...meta,
    syncStatus: entry.status,
    externalTool: entry.tool ?? meta.externalTool,
    lastSyncReportAt: at,
    lastExternalEditAt:
      entry.status === "edited_externally" ? at : meta.lastExternalEditAt,
    externalEditNotes: entry.notes ?? meta.externalEditNotes,
    syncHistory: [...(meta.syncHistory ?? []), { ...entry, at }],
  }
}

export function metadataToRecord(meta: AssetExportMetadata): Record<string, unknown> {
  return { ...meta }
}
