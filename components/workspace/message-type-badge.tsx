import { cn } from "@/lib/utils"
import type { MessageType } from "@/types/agent-workspace"
import { AlertCircle, CheckCircle2, Download, Info, MessageSquare, Palette, RefreshCw, StickyNote } from "lucide-react"

interface MessageTypeBadgeProps {
  type: MessageType
  className?: string
}

const CONFIG: Record<
  MessageType,
  { label: string; icon: typeof Info; className: string }
> = {
  normal: {
    label: "",
    icon: MessageSquare,
    className: "",
  },
  update: {
    label: "Update",
    icon: Info,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  blocker: {
    label: "Blocked",
    icon: AlertCircle,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  task_complete: {
    label: "Complete",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  design_system_update: {
    label: "Design system",
    icon: Palette,
    className: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  },
  asset_exported: {
    label: "Exported",
    icon: Download,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
  external_sync: {
    label: "External sync",
    icon: RefreshCw,
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  },
  annotation: {
    label: "Annotation",
    icon: StickyNote,
    className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
  },
}

export function MessageTypeBadge({ type, className }: MessageTypeBadgeProps) {
  if (type === "normal") return null

  const config = CONFIG[type]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  )
}
