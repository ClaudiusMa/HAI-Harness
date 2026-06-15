import type { AssetExportFormat, AssetExportMetadata } from "@/types/asset-sync"
import { createTrackingId } from "@/types/asset-sync"

interface TerraTechTokenInput {
  primary: string
  secondary: string
  background: string
  foreground: string
  fontFamily: string
  fontSizeBase: string
}

/** Figma Tokens / Tokens Studio compatible JSON */
export function buildFigmaTokensJson(tokens: TerraTechTokenInput): string {
  return JSON.stringify(
    {
      terratech: {
        color: {
          primary: { value: tokens.primary, type: "color" },
          secondary: { value: tokens.secondary, type: "color" },
          background: { value: tokens.background, type: "color" },
          foreground: { value: tokens.foreground, type: "color" },
        },
        typography: {
          fontFamily: { value: tokens.fontFamily, type: "fontFamilies" },
          fontSizeBase: { value: tokens.fontSizeBase, type: "fontSizes" },
        },
      },
    },
    null,
    2
  )
}

/** W3C Design Tokens Community Group format */
export function buildW3cTokensJson(tokens: TerraTechTokenInput): string {
  return JSON.stringify(
    {
      $schema: "https://design-tokens.github.io/community-group/format/",
      primary: { $value: tokens.primary, $type: "color" },
      secondary: { $value: tokens.secondary, $type: "color" },
      background: { $value: tokens.background, $type: "color" },
      foreground: { $value: tokens.foreground, $type: "color" },
      fontFamily: { $value: tokens.fontFamily, $type: "fontFamily" },
      fontSizeBase: { $value: tokens.fontSizeBase, $type: "dimension" },
    },
    null,
    2
  )
}

export function buildCssVariablesExport(tokens: TerraTechTokenInput): string {
  return [
    "/* TerraTech — import via Figma plugin or dev handoff */",
    ":root {",
    `  --tt-primary: ${tokens.primary};`,
    `  --tt-secondary: ${tokens.secondary};`,
    `  --tt-background: ${tokens.background};`,
    `  --tt-foreground: ${tokens.foreground};`,
    `  --tt-font-sans: ${tokens.fontFamily};`,
    `  --tt-text-base: ${tokens.fontSizeBase};`,
    "}",
  ].join("\n")
}

export function buildExportManifest(input: {
  trackingId: string
  assetName: string
  formats: AssetExportFormat[]
  figmaImportHint: string
}): string {
  return JSON.stringify(
    {
      trackingId: input.trackingId,
      assetName: input.assetName,
      exportedAt: new Date().toISOString(),
      formats: input.formats,
      figma: {
        svg: "File → Place image → select .svg (or drag onto canvas)",
        tokens: "Install Tokens Studio → Import JSON → select figma-tokens file",
        syncBack: `Reply in workspace with: "Synced back from Figma — tracking ${input.trackingId}"`,
      },
      sketch: { svg: "Insert → Vector → Import SVG" },
      penpot: { svg: "Import → SVG file" },
      ...input.figmaImportHint ? { notes: input.figmaImportHint } : {},
    },
    null,
    2
  )
}

export function defaultTerraTechTokens(): TerraTechTokenInput {
  return {
    primary: "hsl(142 45% 38%)",
    secondary: "hsl(38 35% 72%)",
    background: "hsl(45 20% 97%)",
    foreground: "hsl(28 20% 14%)",
    fontFamily: "'Terra Sans', system-ui, sans-serif",
    fontSizeBase: "1rem",
  }
}

export function ensureTrackingMetadata(
  existing: Record<string, unknown> | undefined
): AssetExportMetadata {
  const parsed = existing?.trackingId
    ? (existing as unknown as AssetExportMetadata)
    : null
  if (parsed?.trackingId) {
    return {
      trackingId: parsed.trackingId,
      syncStatus: parsed.syncStatus ?? "draft",
      exportedAt: parsed.exportedAt,
      exportedFormats: parsed.exportedFormats,
      externalTool: parsed.externalTool,
      lastExternalEditAt: parsed.lastExternalEditAt,
      lastSyncReportAt: parsed.lastSyncReportAt,
      externalEditNotes: parsed.externalEditNotes,
      externalFileUrl: parsed.externalFileUrl,
      syncHistory: parsed.syncHistory ?? [],
    }
  }
  return {
    trackingId: createTrackingId(),
    syncStatus: "draft",
    syncHistory: [],
  }
}

export function buildExportBundleForAsset(asset: {
  name: string
  content: string | null
  assetType: string
  metadata?: Record<string, unknown>
}): Array<{ format: AssetExportFormat; filename: string; mimeType: string; body: string }> {
  const tracking = ensureTrackingMetadata(asset.metadata)
  const base = asset.name.replace(/\.[^.]+$/, "")
  const tokens = defaultTerraTechTokens()
  const bundle: Array<{ format: AssetExportFormat; filename: string; mimeType: string; body: string }> = []

  if (asset.content?.trim().startsWith("<svg") || asset.assetType === "image") {
    const svg = asset.content?.trim().startsWith("<svg")
      ? asset.content
      : `<!-- Placeholder — replace with exported SVG -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50">${asset.name}</text></svg>`
    bundle.push({
      format: "svg",
      filename: `${base}.svg`,
      mimeType: "image/svg+xml",
      body: svg,
    })
  }

  bundle.push(
    {
      format: "figma-tokens",
      filename: `${base}-figma-tokens.json`,
      mimeType: "application/json",
      body: buildFigmaTokensJson(tokens),
    },
    {
      format: "w3c-tokens",
      filename: `${base}-w3c-tokens.json`,
      mimeType: "application/json",
      body: buildW3cTokensJson(tokens),
    },
    {
      format: "css",
      filename: `${base}-tokens.css`,
      mimeType: "text/css",
      body: buildCssVariablesExport(tokens),
    },
    {
      format: "json",
      filename: `${base}-export-manifest.json`,
      mimeType: "application/json",
      body: buildExportManifest({
        trackingId: tracking.trackingId,
        assetName: asset.name,
        formats: ["svg", "figma-tokens", "w3c-tokens", "css", "json"],
        figmaImportHint: "Use tracking ID when reporting edits back to agents.",
      }),
    }
  )

  return bundle
}

export function downloadTextFile(filename: string, mimeType: string, body: string): void {
  const blob = new Blob([body], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildFigmaImportGuide(trackingId: string): string {
  return [
    "## Import to Figma",
    "",
    "1. **SVG artboard/logo:** File → Place image → select the `.svg` file",
    "2. **Color & type tokens:** Install [Tokens Studio](https://tokens.studio/) → Import → `*-figma-tokens.json`",
    "3. **Edit freely** in Figma — changes stay external until you sync back",
    "",
    `4. **Sync back:** In workspace, post:`,
    `   \`Synced back from Figma — tracking ${trackingId}. Updated primary to …\``,
    "",
    "Agents will update artboard status and flag drift from TerraTech tokens.",
  ].join("\n")
}
