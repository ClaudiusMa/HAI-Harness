"use client"

import { cn } from "@/lib/utils"
import type { ChannelAgent, ExpertiseDomain } from "@/types/agent-workspace"
import { EXPERTISE_LABELS, getAgentExpertise } from "@/lib/agents/expertise"
import { AgentAvatar } from "./agent-avatar"
import { AgentStatusIndicator } from "./agent-status-indicator"

interface AgentCohortPanelProps {
  channelAgents: ChannelAgent[]
  thinkingAgent?: string | null
  className?: string
}

const DOMAIN_COLORS: Record<ExpertiseDomain, string> = {
  design_system: "border-pink-500/30 bg-pink-500/5",
  motion: "border-purple-500/30 bg-purple-500/5",
  accessibility: "border-teal-500/30 bg-teal-500/5",
  brand: "border-orange-500/30 bg-orange-500/5",
  design_leadership: "border-indigo-500/30 bg-indigo-500/5",
  engineering: "border-violet-500/30 bg-violet-500/5",
  research: "border-sky-500/30 bg-sky-500/5",
  strategy: "border-emerald-500/30 bg-emerald-500/5",
  communications: "border-amber-500/30 bg-amber-500/5",
  operations: "border-red-500/30 bg-red-500/5",
}

export function AgentCohortPanel({
  channelAgents,
  thinkingAgent,
  className,
}: AgentCohortPanelProps) {
  if (channelAgents.length < 2) return null

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Live cohort · {channelAgents.length} agents
      </p>
      <div className="grid gap-2">
        {channelAgents.map((ca) => {
          const slug = ca.agent?.definition?.slug
          const expertise = getAgentExpertise(slug)
          const domain = expertise?.primaryDomain ?? "design_system"
          const isActive =
            ca.status === "thinking" ||
            ca.status === "working" ||
            (thinkingAgent && ca.roleAlias.toLowerCase() === thinkingAgent.toLowerCase())

          return (
            <div
              key={ca.id}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2.5 transition-colors",
                DOMAIN_COLORS[domain],
                isActive && "ring-2 ring-primary/20"
              )}
            >
              {ca.agent?.definition && (
                <AgentAvatar
                  author={{
                    type: "agent",
                    id: ca.agent.id,
                    name: ca.roleAlias,
                    icon: ca.agent.definition.icon,
                    avatarColor: ca.agent.definition.avatarColor,
                    role: ca.agent.definition.role,
                    roleAlias: ca.roleAlias,
                  }}
                  size="sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <AgentStatusIndicator status={ca.status} />
                  <span className="text-sm font-medium">@{ca.roleAlias}</span>
                  {isActive && (
                    <span className="text-[10px] text-primary animate-pulse">
                      {ca.status === "working" ? "working…" : "thinking…"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {EXPERTISE_LABELS[domain]} · annotates{" "}
                  {expertise?.annotateDomains
                    .slice(0, 2)
                    .map((d) => EXPERTISE_LABELS[d])
                    .join(", ") ?? domain}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Each agent executes tasks in their lane and adds expertise-scoped annotations only.
      </p>
    </div>
  )
}
