import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProfileSettings from "@/components/settings/profile-settings"
import PreferencesSettings from "@/components/settings/preferences-settings"
import SecuritySettings from "@/components/settings/security-settings"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="#profile"
                  className="flex w-full justify-start px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Profile
                </a>
                <a 
                  href="#preferences"
                  className="flex w-full justify-start px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Preferences
                </a>
                <a 
                  href="#security"
                  className="flex w-full justify-start px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Security
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-8">
            <Suspense fallback={<div>Loading profile settings...</div>}>
              <div id="profile">
                <ProfileSettings user={user} />
              </div>
            </Suspense>

            <Suspense fallback={<div>Loading preferences...</div>}>
              <div id="preferences">
                <PreferencesSettings />
              </div>
            </Suspense>

            <Suspense fallback={<div>Loading security settings...</div>}>
              <div id="security">
                <SecuritySettings />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
