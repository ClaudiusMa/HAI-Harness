import type { Profile } from '@/types/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileDisplayProps {
  initialProfile?: Profile | null
}

export function ProfileDisplay({ initialProfile }: ProfileDisplayProps) {
  // Since server-side requests work but client-side requests get 406 errors,
  // we'll rely entirely on the server-side data passed as initialProfile
  const profile = initialProfile
  const loading = false
  const error = null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading your profile information...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>Your profile wasn&apos;t automatically created during signup.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Expected behavior:</strong> A profile should be automatically created when you sign up.
              This indicates the database trigger may not be working properly.
            </p>
          </div>
          
          <div className="flex gap-2">
            <a 
              href="/create-missing-profile"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Profile Manually
            </a>
            <a 
              href="/debug-profile"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Debug Info
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayName = profile.first_name || profile.email.split('@')[0]
  const initials = profile.first_name 
    ? profile.first_name.charAt(0).toUpperCase()
    : profile.email.charAt(0).toUpperCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Your profile was automatically created when you signed up</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">User ID:</span>
            <p className="text-muted-foreground font-mono text-xs">{profile.user_id}</p>
          </div>
          <div>
            <span className="font-medium">Profile ID:</span>
            <p className="text-muted-foreground">{profile.id}</p>
          </div>
          <div>
            <span className="font-medium">First Name:</span>
            <p className="text-muted-foreground">{profile.first_name || 'Not set'}</p>
          </div>
          <div>
            <span className="font-medium">Avatar URL:</span>
            <p className="text-muted-foreground">{profile.avatar_url || 'Not set'}</p>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <p className="text-muted-foreground">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium">Updated:</span>
            <p className="text-muted-foreground">{new Date(profile.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
