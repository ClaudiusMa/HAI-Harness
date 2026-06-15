import Link from 'next/link'
import { getAllBlogs } from '@/lib/blogs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function BlogsPage() {
  const blogs = await getAllBlogs()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
          <p className="text-muted-foreground">
            Discover our latest articles and insights
          </p>
        </div>
        {isAuthenticated && (
          <Link href="/blogs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {blogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No blog posts yet. Be the first to create one!
              </p>
              {isAuthenticated && (
                <Link href="/blogs/new">
                  <Button>Create Your First Post</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <Link key={blog.id} href={`/blogs/${blog.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {blog.image && (
                  <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                  {blog.subtitle && (
                    <CardDescription className="line-clamp-2">
                      {blog.subtitle}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{blog.author}</span>
                    <time dateTime={blog.created_at}>
                      {new Date(blog.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

