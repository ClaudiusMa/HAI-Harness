import { cn } from "@/lib/utils"
import type { AgentStatus } from "@/types/agent-workspace"

interface AgentStatusIndicatorProps {
  status: AgentStatus
  className?: string
}

const STATUS_STYLES: Record<AgentStatus, { color: string; label: string }> = {
  idle: { color: "bg-muted-foreground/40", label: "Idle" },
  thinking: { color: "bg-blue-500 animate-pulse", label: "Thinking" },
  working: { color: "bg-emerald-500 animate-pulse", label: "Working" },
  blocked: { color: "bg-amber-500", label: "Blocked" },
  offline: { color: "bg-muted-foreground/20", label: "Offline" },
}

export function AgentStatusIndicator({ status, className }: AgentStatusIndicatorProps) {
  const config = STATUS_STYLES[status]

  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", config.color, className)}
      title={config.label}
      aria-label={config.label}
    />
  )
}
