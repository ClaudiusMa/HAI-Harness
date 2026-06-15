import { redirect } from "next/navigation"
import { Fredoka } from "next/font/google"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceSnapshot } from "@/lib/workspace/queries"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"

const cohortFont = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cohort",
})

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/workspace")
  }

  const snapshot = await getWorkspaceSnapshot(user.id)

  if (!snapshot) {
    return (
      <div className={`${cohortFont.variable} flex min-h-screen items-center justify-center p-6`}>
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold">Workspace unavailable</h1>
          <p className="text-sm text-muted-foreground">
            Run the agent workspace migration to enable this feature:
            <code className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
              supabase db push
            </code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cohortFont.variable}>
      <WorkspaceShell
        workspace={snapshot.workspace}
        channels={snapshot.channels}
        agents={snapshot.agents}
      >
        {children}
      </WorkspaceShell>
    </div>
  )
}
