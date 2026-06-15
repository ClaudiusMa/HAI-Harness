import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/profiles'
import { CreateProfileForm } from '@/components/create-profile-form'

export default async function CreateMissingProfilePage() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Check if profile already exists
  const existingProfile = await getCurrentUserProfile()
  
  if (existingProfile) {
    // Profile already exists, redirect to protected page
    redirect('/protected')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Create Your Profile</h1>
          <p className="text-muted-foreground">
            Your profile wasn&apos;t automatically created. Let&apos;s set it up now.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Profiles are normally created automatically when you sign up.
            If you&apos;re seeing this page, the database trigger may not be working properly.
          </p>
        </div>

        <CreateProfileForm userEmail={user.email || ''} userId={user.id} />
        
        <div className="text-sm text-muted-foreground">
          <a href="/protected" className="text-blue-500 hover:underline">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
