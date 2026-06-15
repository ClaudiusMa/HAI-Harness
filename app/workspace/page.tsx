import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceSnapshot } from "@/lib/workspace/queries"

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/workspace")

  const snapshot = await getWorkspaceSnapshot(user.id)
  if (!snapshot?.channels.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        No channels yet. Create one from the sidebar.
      </div>
    )
  }

  const firstProject =
    snapshot.channels.find((c) => c.slug === "terratech-design-system") ??
    snapshot.channels.find((c) => c.slug === "new-product-launch-design") ??
    snapshot.channels.find((c) => c.slug === "design-system") ??
    snapshot.channels.find((c) => c.channelType === "group") ??
    snapshot.channels[0]

  redirect(`/workspace/channels/${firstProject.id}`)
}
