import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceSnapshot } from "@/lib/workspace/queries"
import { AgentAvatar } from "@/components/workspace/agent-avatar"
import { AgentStatusIndicator } from "@/components/workspace/agent-status-indicator"
import { AgentVersionBadge } from "@/components/workspace/agent-version-badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const snapshot = user ? await getWorkspaceSnapshot(user.id) : null

  if (!snapshot) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Link href="/workspace">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Agent registry</h1>
          <p className="text-sm text-muted-foreground">
            Core capabilities, versions, and accumulated memory. Summon agents into project
            channels with role aliases like @Writer or @Analyst.
          </p>
        </div>
      </header>

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.agents
          .filter((a) => a.definition)
          .map((agent) => {
            const def = agent.definition!
            const dmChannel = snapshot.channels.find(
              (c) => c.channelType === "direct" && c.defaultAgentId === agent.id
            )

            const channelRoles =
              snapshot.channels
                .flatMap((c) => c.assignedAgents ?? [])
                .filter((ca) => ca.workspaceAgentId === agent.id)
                .map((ca) => ca.roleAlias) ?? []

            return (
              <article key={agent.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="relative">
                    <AgentAvatar
                      author={{
                        type: "agent",
                        id: agent.id,
                        name: def.name,
                        avatarColor: def.avatarColor,
                        icon: def.icon,
                        role: def.role,
                      }}
                      size="lg"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <AgentStatusIndicator status={agent.status} className="size-2.5 ring-2 ring-card" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{agent.customName ?? def.name}</h2>
                      <AgentVersionBadge version={agent.instructionsVersion} />
                    </div>
                    <p className="text-sm text-muted-foreground">{def.role}</p>
                    <p className="mt-1 text-xs italic text-muted-foreground">{def.tagline}</p>
                  </div>
                </div>

                <p className="mb-3 text-sm leading-relaxed">{def.personality}</p>

                {channelRoles.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Active roles</p>
                    <div className="flex flex-wrap gap-1">
                      {channelRoles.map((role) => (
                        <span key={role} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          @{role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Capabilities
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {def.jobs.map((job) => (
                      <li key={job} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                        {job}
                      </li>
                    ))}
                  </ul>
                </div>

                {agent.currentInstructions && (
                  <div className="mb-3 rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Global instructions
                    </p>
                    <p className="text-xs leading-relaxed">{agent.currentInstructions}</p>
                  </div>
                )}

                {agent.memorySummary && (
                  <div className="mb-4 rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Accumulated context
                    </p>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">
                      {agent.memorySummary}
                    </p>
                  </div>
                )}

                {dmChannel && (
                  <Link href={`/workspace/channels/${dmChannel.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open direct message
                    </Button>
                  </Link>
                )}
              </article>
            )
          })}
      </div>
    </div>
  )
}
