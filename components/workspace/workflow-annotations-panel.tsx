"use client"

import { cn } from "@/lib/utils"
import type { WorkflowAnnotation } from "@/types/agent-workspace"
import { EXPERTISE_LABELS } from "@/lib/agents/expertise"
import { AgentAvatar } from "./agent-avatar"
import { AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react"

interface WorkflowAnnotationsPanelProps {
  annotations: WorkflowAnnotation[]
  className?: string
}

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    className: "border-border bg-muted/30 text-muted-foreground",
  },
  suggestion: {
    icon: Lightbulb,
    className: "border-blue-500/20 bg-blue-500/5 text-blue-800 dark:text-blue-200",
  },
  issue: {
    icon: AlertCircle,
    className: "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200",
  },
  approval: {
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
  },
} as const

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function WorkflowAnnotationsPanel({
  annotations,
  className,
}: WorkflowAnnotationsPanelProps) {
  if (annotations.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Annotations from the cohort appear here as agents review the workflow in their
        expertise lanes.
      </p>
    )
  }

  const grouped = annotations.reduce<Map<string, WorkflowAnnotation[]>>((acc, ann) => {
    const key = ann.sessionId
    const list = acc.get(key) ?? []
    list.push(ann)
    acc.set(key, list)
    return acc
  }, new Map())

  return (
    <div className={cn("space-y-4", className)}>
      {[...grouped.entries()].map(([sessionId, sessionAnnotations]) => (
        <div key={sessionId} className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Session · {sessionAnnotations.length} annotation
            {sessionAnnotations.length === 1 ? "" : "s"}
          </p>
          {sessionAnnotations.map((ann) => {
            const config = SEVERITY_CONFIG[ann.severity]
            const Icon = config.icon
            const preview = ann.content.replace(/\*\*/g, "").split("\n").slice(0, 4).join(" ")

            return (
              <article
                key={ann.id}
                className={cn("rounded-lg border p-3 text-xs leading-relaxed", config.className)}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {ann.author && (
                      <AgentAvatar author={ann.author} size="sm" />
                    )}
                    <div>
                      <p className="font-medium">{ann.author?.name ?? "Agent"}</p>
                      <p className="text-[10px] opacity-80">
                        {EXPERTISE_LABELS[ann.expertiseDomain]} · {ann.targetLabel}
                      </p>
                    </div>
                  </div>
                  <Icon className="size-3.5 shrink-0 opacity-70" />
                </div>
                <p className="line-clamp-4">{preview}</p>
                <p className="mt-2 text-[10px] opacity-60">{formatTime(ann.createdAt)}</p>
              </article>
            )
          })}
        </div>
      ))}
    </div>
  )
}
