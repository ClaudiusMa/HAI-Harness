"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createChannelAction } from "@/app/actions/workspace"
import type { Channel, WorkspaceAgent } from "@/types/agent-workspace"
import { WorkspaceSidebar } from "./workspace-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface WorkspaceShellProps {
  workspace: { id: string; name: string }
  channels: Channel[]
  agents: WorkspaceAgent[]
  children: React.ReactNode
}

export function WorkspaceShell({
  workspace,
  channels,
  agents,
  children,
}: WorkspaceShellProps) {
  const router = useRouter()
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [channelName, setChannelName] = useState("")
  const [domain, setDomain] = useState("")
  const [description, setDescription] = useState("")
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  function toggleAgent(agentId: string) {
    setSelectedAgentIds((ids) =>
      ids.includes(agentId) ? ids.filter((id) => id !== agentId) : [...ids, agentId]
    )
  }

  function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!channelName.trim()) return

    startTransition(async () => {
      const result = await createChannelAction({
        name: channelName.trim(),
        domain: domain.trim() || undefined,
        description: description.trim() || undefined,
        agentIds: selectedAgentIds.length ? selectedAgentIds : undefined,
      })
      if (result.success && result.data) {
        setShowCreateChannel(false)
        setChannelName("")
        setDomain("")
        setDescription("")
        setSelectedAgentIds([])
        router.push(`/workspace/channels/${result.data.channelId}`)
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-background">
      <WorkspaceSidebar
        workspaceName={workspace.name}
        channels={channels}
        agents={agents}
        onCreateChannel={() => {
          setShowCreateChannel(true)
          setSelectedAgentIds(agents.filter((a) => a.isEnabled).slice(0, 3).map((a) => a.id))
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold">New project channel</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Create a domain for agents to collaborate — like #marketing-campaign-q3
            </p>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <Input
                placeholder="Channel name (e.g. marketing-campaign-q3)"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                autoFocus
              />
              <Input
                placeholder="Domain (e.g. Marketing, Product, Support)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <textarea
                placeholder="Project brief — what should agents focus on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Summon agents to this channel
                </p>
                <div className="flex flex-wrap gap-2">
                  {agents
                    .filter((a) => a.definition)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAgent(a.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selectedAgentIds.includes(a.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        {a.definition!.name}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateChannel(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !channelName.trim()}>
                  Create channel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
