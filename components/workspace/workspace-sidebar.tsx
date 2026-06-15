"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Channel, WorkspaceAgent } from "@/types/agent-workspace"
import { CohortLogo } from "./cohort-logo"
import { AgentAvatar } from "./agent-avatar"
import { AgentStatusIndicator } from "./agent-status-indicator"
import { Hash, MessageSquare, Plus, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WorkspaceSidebarProps {
  workspaceName: string
  channels: Channel[]
  agents: WorkspaceAgent[]
  onCreateChannel?: () => void
}

export function WorkspaceSidebar({
  workspaceName,
  channels,
  agents,
  onCreateChannel,
}: WorkspaceSidebarProps) {
  const pathname = usePathname()

  const projectChannels = channels.filter((c) => c.channelType === "group")
  const directChannels = channels.filter((c) => c.channelType === "direct")

  function isActive(channelId: string) {
    return pathname.includes(channelId)
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href="/workspace" className="mb-2 block">
          <CohortLogo size="md" />
        </Link>
        <p className="text-xs text-muted-foreground">{workspaceName}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <section>
          <div className="mb-1.5 flex items-center justify-between px-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Projects
            </span>
            {onCreateChannel && (
              <Button variant="ghost" size="icon" className="size-6" onClick={onCreateChannel}>
                <Plus className="size-3.5" />
              </Button>
            )}
          </div>
          <ul className="space-y-1">
            {projectChannels.map((channel) => (
              <li key={channel.id}>
                <Link
                  href={`/workspace/channels/${channel.id}`}
                  className={cn(
                    "block rounded-md px-2 py-1.5 transition-colors",
                    isActive(channel.id)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="size-4 shrink-0 opacity-60" />
                    <span className="truncate text-sm font-medium">{channel.name}</span>
                  </div>
                  {channel.assignedAgents && channel.assignedAgents.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 pl-6">
                      {channel.assignedAgents.map((ca) => (
                        <span
                          key={ca.id}
                          className="inline-flex items-center gap-1 rounded-full bg-background/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <AgentStatusIndicator status={ca.status} className="size-1.5" />
                          @{ca.roleAlias}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-1.5 px-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Direct messages
            </span>
          </div>
          <ul className="space-y-0.5">
            {directChannels.map((channel) => {
              const agent = agents.find((a) => a.id === channel.defaultAgentId)
              const def = agent?.definition
              const channelAgent = channel.assignedAgents?.[0]
              return (
                <li key={channel.id}>
                  <Link
                    href={`/workspace/channels/${channel.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive(channel.id)
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/60"
                    )}
                  >
                    {def ? (
                      <div className="relative">
                        <AgentAvatar
                          author={{
                            type: "agent",
                            id: agent!.id,
                            name: def.name,
                            avatarColor: def.avatarColor,
                            icon: def.icon,
                          }}
                          size="sm"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <AgentStatusIndicator
                            status={channelAgent?.status ?? agent?.status ?? "idle"}
                            className="size-2 ring-2 ring-sidebar"
                          />
                        </span>
                      </div>
                    ) : (
                      <MessageSquare className="size-4 shrink-0 opacity-60" />
                    )}
                    <span className="truncate">{channel.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-auto border-t border-sidebar-border pt-3">
          <Link
            href="/workspace/agents"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent/60"
          >
            <Users className="size-4 opacity-60" />
            Agent registry
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent/60"
          >
            <Settings className="size-4 opacity-60" />
            Settings
          </Link>
        </section>
      </nav>
    </aside>
  )
}
