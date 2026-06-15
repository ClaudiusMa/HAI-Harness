import { cn } from "@/lib/utils"
import {
  Bot,
  ClipboardList,
  Code2,
  Compass,
  Palette,
  PenLine,
  Search,
  User,
} from "lucide-react"
import type { MessageAuthor } from "@/types/agent-workspace"

const ICON_MAP = {
  search: Search,
  code: Code2,
  compass: Compass,
  pen: PenLine,
  clipboard: ClipboardList,
  palette: Palette,
  bot: Bot,
} as const

interface AgentAvatarProps {
  author: MessageAuthor
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
}

const iconSizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

export function AgentAvatar({ author, size = "md", className }: AgentAvatarProps) {
  const Icon =
    author.type === "user"
      ? User
      : ICON_MAP[(author.icon as keyof typeof ICON_MAP) ?? "bot"] ?? Bot

  const isUser = author.type === "user"
  const isSystem = author.type === "system"

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-semibold",
        sizeClasses[size],
        isUser && "bg-primary text-primary-foreground",
        isSystem && "bg-muted text-muted-foreground",
        className
      )}
      style={
        !isUser && !isSystem && author.avatarColor
          ? { backgroundColor: author.avatarColor, color: "#fff" }
          : undefined
      }
    >
      <Icon className={iconSizes[size]} />
    </div>
  )
}
