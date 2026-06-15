import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserWorldCupPreferences } from "@/lib/worldcup/preferences"
import { WorldCupHeader } from "@/components/worldcup/worldcup-header"
import { WorldCupPreferencesProvider } from "@/components/worldcup/worldcup-preferences-provider"
import { OnboardingWizard } from "@/components/worldcup/onboarding-wizard"

export const metadata: Metadata = {
  title: "World Cup 2026 Companion | Serif",
  description:
    "Your guide to the 48-team FIFA World Cup 2026. Live scores, explainers, and Axios-style stories for US fans new to the beautiful game.",
}

export default async function WorldCupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const serverPreferences = user ? await getCurrentUserWorldCupPreferences() : null

  return (
    <WorldCupPreferencesProvider
      initialPreferences={serverPreferences}
      isAuthenticated={Boolean(user)}
    >
      <div className="wc-theme min-h-screen bg-[#0a0f1a] text-white">
        <WorldCupHeader />
        <main>{children}</main>
        <OnboardingWizard />
      </div>
    </WorldCupPreferencesProvider>
  )
}
