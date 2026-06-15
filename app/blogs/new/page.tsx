import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/profiles'
import { BlogForm } from '@/components/blog/blog-form'

export default async function NewBlogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getCurrentUserProfile()
  const authorName = profile?.first_name || user.email?.split('@')[0] || 'Anonymous'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogForm author={authorName} />
    </div>
  )
}

