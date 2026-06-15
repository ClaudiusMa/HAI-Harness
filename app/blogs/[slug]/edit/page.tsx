import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBlogBySlug } from '@/lib/blogs'
import { BlogForm } from '@/components/blog/blog-form'

interface EditBlogPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
      <BlogForm blog={blog} author={blog.author} />
    </div>
  )
}

