import { notFound } from 'next/navigation'
import { getBlogBySlug } from '@/lib/blogs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { deleteBlogAction } from '@/app/actions/blogs'
import { DeleteBlogButton } from '@/components/blog/delete-blog-button'
import Image from 'next/image'

interface BlogPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  if (!blog) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/blogs">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blogs
        </Button>
      </Link>

      <article>
        {blog.image && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{blog.title}</CardTitle>
                {blog.subtitle && (
                  <CardDescription className="text-lg">
                    {blog.subtitle}
                  </CardDescription>
                )}
              </div>
              {isAuthenticated && (
                <div className="flex gap-2 ml-4">
                  <Link href={`/blogs/${blog.slug}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <DeleteBlogButton blogId={blog.id} blogSlug={blog.slug} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span>By {blog.author}</span>
              <time dateTime={blog.created_at}>
                {new Date(blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </CardContent>
        </Card>
      </article>
    </div>
  )
}

