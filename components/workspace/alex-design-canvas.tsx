"use client"

import type { ChannelAgent, DesignSystemState } from "@/types/agent-workspace"
import { buildTailwindV4ThemeSnippet } from "@/lib/agents/alex-design-system"
import { AgentStatusIndicator } from "./agent-status-indicator"
import { AgentVersionBadge } from "./agent-version-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlexDesignCanvasProps {
  state: DesignSystemState
  alexAgent?: ChannelAgent
  className?: string
}

function ArtboardStatus({ status }: { status: DesignSystemState["artboards"][0]["status"] }) {
  if (status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Synced
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Clock className="size-3" />
        Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
      <Clock className="size-3" />
      Stale
    </span>
  )
}

export function AlexDesignCanvas({ state, alexAgent, className }: AlexDesignCanvasProps) {
  const themeSnippet = buildTailwindV4ThemeSnippet(state)

  return (
    <div className={cn("space-y-4", className)}>
      {alexAgent && (
        <div className="rounded-lg border bg-background p-3">
          <div className="mb-1 flex items-center gap-2">
            <Palette className="size-4 text-pink-500" />
            <span className="text-sm font-semibold">@{alexAgent.roleAlias}</span>
            <AgentStatusIndicator status={alexAgent.status} />
            <AgentVersionBadge version={state.version} />
          </div>
          {alexAgent.agent?.definition && (
            <p className="text-xs text-muted-foreground">
              {alexAgent.agent.definition.name} · {alexAgent.agent.definition.role}
            </p>
          )}
        </div>
      )}

      {state.brandStrategy && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brand strategy
          </p>
          <p className="text-xs leading-relaxed">{state.brandStrategy}</p>
        </div>
      )}

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Color tokens
        </p>
        {state.colorTokens.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not defined yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {state.colorTokens.map((token) => (
              <li
                key={token.name}
                className="flex items-center justify-between rounded-md border bg-background px-2 py-1.5 text-xs"
              >
                <span className="font-mono">{token.name}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-3 rounded-full border"
                    style={{ backgroundColor: token.value }}
                    aria-hidden
                  />
                  {token.value}
                  <Badge variant="outline" className="text-[10px]">
                    v{token.version.toFixed(1)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Typography
        </p>
        {state.typography.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not defined yet.</p>
        ) : (
          <ul className="space-y-1">
            {state.typography.map((t) => (
              <li key={t.role} className="rounded-md border bg-background px-2 py-1.5 text-xs">
                <span className="font-medium">{t.role}</span>
                <span className="text-muted-foreground"> · {t.spec}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Components (shadcn/ui)
        </p>
        {state.components.length === 0 ? (
          <p className="text-xs text-muted-foreground">Awaiting token + typography baseline.</p>
        ) : (
          <ul className="space-y-2">
            {state.components.map((c) => (
              <li key={c.name} className="rounded-md border bg-background p-2 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    v{c.version.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{c.variants.join(", ")}</p>
                {c.note && <p className="mt-1 text-muted-foreground">{c.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Linked artboards
        </p>
        <ul className="space-y-1">
          {state.artboards.map((a) => (
            <li
              key={a.name}
              className="flex items-center justify-between rounded-md border bg-background px-2 py-1.5 text-xs"
            >
              <span>{a.name}</span>
              <ArtboardStatus status={a.status} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tailwind v4 @theme
        </p>
        <pre className="max-h-40 overflow-auto rounded-md border bg-muted/30 p-2 font-mono text-[10px] leading-relaxed">
          {themeSnippet}
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full text-xs"
          onClick={() => navigator.clipboard.writeText(themeSnippet)}
        >
          Copy theme snippet
        </Button>
      </section>

      {state.activityLog.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recent activity
          </p>
          <ul className="space-y-1">
            {[...state.activityLog].reverse().slice(0, 6).map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {entry.version != null ? `v${entry.version.toFixed(1)}` : "—"}
                </span>
                {" · "}
                {entry.action}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
