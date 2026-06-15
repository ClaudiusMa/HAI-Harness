interface AgentVersionBadgeProps {
  version: number
  className?: string
}

export function AgentVersionBadge({ version, className }: AgentVersionBadgeProps) {
  return (
    <span
      className={`rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ${className ?? ""}`}
    >
      v{version.toFixed(1)}
    </span>
  )
}
