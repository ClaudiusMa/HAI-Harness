import { cn } from "@/lib/utils"
import type { RealtimeConnectionStatus } from "@/lib/workspace/use-workspace-realtime"

interface RealtimeStatusProps {
  status: RealtimeConnectionStatus
  className?: string
}

const LABELS: Record<RealtimeConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  disconnected: "Offline",
  error: "Reconnecting…",
}

const DOT: Record<RealtimeConnectionStatus, string> = {
  connecting: "bg-amber-500 animate-pulse",
  connected: "bg-emerald-500",
  disconnected: "bg-muted-foreground/40",
  error: "bg-amber-500 animate-pulse",
}

export function RealtimeStatus({ status, className }: RealtimeStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground",
        className
      )}
      title={LABELS[status]}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} aria-hidden />
      {LABELS[status]}
    </span>
  )
}
