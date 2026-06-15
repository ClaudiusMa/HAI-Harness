import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DebugProfilePage() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData?.user) {
    redirect('/auth/login')
  }

  // Try to get profile with detailed error handling
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  // Get all profiles (for debugging)
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('*')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">User Information</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              id: userData.user.id,
              email: userData.user.email,
              created_at: userData.user.created_at,
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Profile Query Result</h2>
          <p><strong>Error:</strong> {profileError ? JSON.stringify(profileError, null, 2) : 'None'}</p>
          <p><strong>Data:</strong></p>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">All Profiles (for debugging)</h2>
          <p><strong>Error:</strong> {allProfilesError ? JSON.stringify(allProfilesError, null, 2) : 'None'}</p>
          <p><strong>Count:</strong> {allProfiles?.length || 0}</p>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(allProfiles, null, 2)}
          </pre>
        </div>

        <div className="mt-6">
          <a href="/protected" className="text-blue-500 hover:underline">← Back to Protected Page</a>
        </div>
      </div>
    </div>
  )
}
