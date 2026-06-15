import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { ProfileDisplay } from '@/components/profile-display'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/profiles'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  // Get the user's profile
  const profile = await getCurrentUserProfile()
  
  // Debug logging
  console.log('User ID:', data.user.id)
  console.log('Profile:', profile)

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Protected Dashboard</h1>
          <LogoutButton />
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium">{data.user.email}</span>!
          </p>
          
          <ProfileDisplay initialProfile={profile} />
          
          <div className="text-sm text-muted-foreground">
            <p>✅ Your profile was automatically created when you signed up</p>
            <p>✅ Row Level Security is protecting your data</p>
            <p>✅ You can only see and modify your own profile</p>
          </div>
        </div>
      </div>
    </div>
  )
}
