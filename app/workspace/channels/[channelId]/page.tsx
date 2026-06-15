import { notFound } from "next/navigation"
import { getChannelDetail, getWorkspaceSnapshot } from "@/lib/workspace/queries"
import { ChannelView } from "@/components/workspace/channel-view"
import { createClient } from "@/lib/supabase/server"

interface ChannelPageProps {
  params: Promise<{ channelId: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const [detail, snapshot] = await Promise.all([
    getChannelDetail(channelId),
    getWorkspaceSnapshot(user.id),
  ])

  if (!detail || !snapshot) notFound()

  return (
    <ChannelView
      channel={detail.channel}
      messages={detail.messages}
      channelAgents={detail.channelAgents}
      agents={snapshot.agents}
      assets={detail.assets}
      contextHistory={detail.contextHistory}
      instructionHistory={detail.instructionHistory}
      threads={detail.threads}
      annotations={detail.annotations}
    />
  )
}
