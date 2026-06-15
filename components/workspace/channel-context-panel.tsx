"use client"

import { useState, useTransition } from "react"
import {
  updateChannelAgentInstructionsAction,
  updateChannelContextAction,
  createAssetAction,
} from "@/app/actions/workspace"
import type {
  Channel,
  ChannelAgent,
  ChannelContextVersion,
  InstructionVersion,
  SharedAsset,
  WorkflowAnnotation,
} from "@/types/agent-workspace"
import { AgentStatusIndicator } from "./agent-status-indicator"
import { AgentVersionBadge } from "./agent-version-badge"
import { AlexDesignCanvas } from "./alex-design-canvas"
import { AgentCohortPanel } from "./agent-cohort-panel"
import { WorkflowAnnotationsPanel } from "./workflow-annotations-panel"
import { ExternalSyncPanel } from "./external-sync-panel"
import { ArtifactPreview } from "./artifact-preview"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronDown, ChevronUp, History, Layers, Palette, Plus, RefreshCw, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChannelContextPanelProps {
  channel: Channel
  channelAgents: ChannelAgent[]
  assets: SharedAsset[]
  contextHistory: ChannelContextVersion[]
  instructionHistory: InstructionVersion[]
  annotations?: WorkflowAnnotation[]
  multiplayer?: boolean
  thinkingAgent?: string | null
  onUpdated?: () => void
}

export function ChannelContextPanel({
  channel,
  channelAgents,
  assets,
  contextHistory,
  instructionHistory,
  annotations = [],
  multiplayer = false,
  thinkingAgent,
  onUpdated,
}: ChannelContextPanelProps) {
  const [tab, setTab] = useState<
    "context" | "agents" | "artifacts" | "history" | "system" | "sync" | "cohort"
  >(multiplayer ? "cohort" : "context")
  const [contextDraft, setContextDraft] = useState(channel.contextSummary)
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null)
  const [instructionDraft, setInstructionDraft] = useState("")
  const [isPending, startTransition] = useTransition()

  const channelAssets = assets.filter(
    (a) => a.channelId === channel.id || a.channelId === null
  )

  function saveContext() {
    startTransition(async () => {
      await updateChannelContextAction({
        channelId: channel.id,
        contextSummary: contextDraft,
      })
      onUpdated?.()
    })
  }

  function saveInstructions(channelAgentId: string) {
    startTransition(async () => {
      await updateChannelAgentInstructionsAction({
        channelAgentId,
        instructions: instructionDraft,
        changeReason: "Supervisor update",
      })
      setEditingAgentId(null)
      onUpdated?.()
    })
  }

  function addArtifact() {
    startTransition(async () => {
      await createAssetAction({
        name: `Channel note — ${new Date().toLocaleDateString()}`,
        assetType: "text",
        content: contextDraft.slice(0, 500) || "Shared project artifact",
        channelId: channel.id,
      })
      onUpdated?.()
    })
  }

  const alexChannelAgent = channelAgents.find(
    (ca) =>
      ca.roleAlias.toLowerCase() === "alex" ||
      ca.agent?.definition?.slug === "alex" ||
      ca.agent?.definition?.role.toLowerCase().includes("design system")
  )
  const hasDesignSystem =
    Boolean(alexChannelAgent) ||
    channel.designSystemState.colorTokens.length > 0 ||
    channel.designSystemState.components.length > 0

  const tabs = [
    ...(multiplayer
      ? [{ id: "cohort" as const, label: "Cohort", icon: Users }]
      : []),
    { id: "context" as const, label: "Context", icon: BookOpen },
    ...(hasDesignSystem
      ? [{ id: "system" as const, label: "System", icon: Palette }]
      : []),
    { id: "agents" as const, label: "Agents", icon: Layers },
    { id: "artifacts" as const, label: "Artifacts", icon: Plus },
    { id: "sync" as const, label: "Sync", icon: RefreshCw },
    { id: "history" as const, label: "History", icon: History },
  ]

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l bg-muted/10 xl:flex">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Canvas</h3>
        <p className="truncate text-xs text-muted-foreground">
          {channel.domain ? `${channel.domain} · ` : ""}#{channel.name}
        </p>
      </div>

      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-xs transition-colors",
              tab === t.id
                ? "border-b-2 border-primary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-3" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "cohort" && multiplayer && (
          <div className="space-y-6">
            <AgentCohortPanel
              channelAgents={channelAgents}
              thinkingAgent={thinkingAgent}
            />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workflow annotations
              </p>
              <WorkflowAnnotationsPanel annotations={annotations} />
            </div>
          </div>
        )}

        {tab === "context" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Channel memory
              </label>
              <textarea
                value={contextDraft}
                onChange={(e) => setContextDraft(e.target.value)}
                rows={8}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Key decisions, goals, and learnings for this project…"
              />
            </div>
            <Button size="sm" className="w-full" onClick={saveContext} disabled={isPending}>
              Save context
            </Button>
            {channel.description && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium">Project brief</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "system" && hasDesignSystem && (
          <AlexDesignCanvas
            state={channel.designSystemState}
            alexAgent={alexChannelAgent}
          />
        )}

        {tab === "agents" && (
          <div className="space-y-3">
            {channelAgents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No agents assigned. @mention an agent or summon from the registry.
              </p>
            ) : (
              channelAgents.map((ca) => (
                <div key={ca.id} className="rounded-lg border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AgentStatusIndicator status={ca.status} />
                      <span className="text-sm font-medium">@{ca.roleAlias}</span>
                      <AgentVersionBadge version={ca.instructionsVersion} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAgentId(editingAgentId === ca.id ? null : ca.id)
                        setInstructionDraft(ca.instructions)
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {editingAgentId === ca.id ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                  </div>
                  {ca.agent?.definition && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      {ca.agent.definition.name} · {ca.agent.definition.role}
                    </p>
                  )}
                  {editingAgentId === ca.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={instructionDraft}
                        onChange={(e) => setInstructionDraft(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/30"
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => saveInstructions(ca.id)}
                        disabled={isPending}
                      >
                        Update → v{(ca.instructionsVersion + 0.1).toFixed(1)}
                      </Button>
                    </div>
                  ) : (
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {ca.instructions || "No instructions set."}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "artifacts" && (
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={addArtifact}>
              <Plus className="size-3.5" />
              Add artifact
            </Button>
            {channelAssets.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Artifacts shared in this channel appear here and inline in messages.
              </p>
            ) : (
              channelAssets.map((asset) => (
                <ArtifactPreview
                  key={asset.id}
                  asset={asset}
                  channelId={channel.id}
                  compact
                  onExport={onUpdated}
                />
              ))
            )}
          </div>
        )}

        {tab === "sync" && (
          <ExternalSyncPanel
            channelId={channel.id}
            assets={channelAssets}
            onReported={onUpdated}
          />
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Context versions
              </p>
              {contextHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                contextHistory.map((h) => (
                  <div key={h.id} className="mb-2 rounded-md border p-2">
                    <p className="text-xs font-medium">v{h.version}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {h.contextSummary}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Instruction changes
              </p>
              {instructionHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No instruction updates yet.</p>
              ) : (
                instructionHistory.map((h) => (
                  <div key={h.id} className="mb-2 rounded-md border p-2">
                    <p className="text-xs font-medium">
                      v{h.version.toFixed(1)}
                      {h.changeReason ? ` · ${h.changeReason}` : ""}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {h.instructions}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
