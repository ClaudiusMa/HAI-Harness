"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TipTapEditor } from './tiptap-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBlogAction, updateBlogAction } from '@/app/actions/blogs'
import type { Blog } from '@/types/blog'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BlogFormProps {
  blog?: Blog
  author: string
}

export function BlogForm({ blog, author }: BlogFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: blog?.title || '',
    subtitle: blog?.subtitle || '',
    image: blog?.image || '',
    content: blog?.content || '',
    author: blog?.author || author,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.content.trim()) {
      setError('Content is required')
      return
    }

    startTransition(async () => {
      if (blog) {
        // Update existing blog
        const result = await updateBlogAction(blog.id, {
          title: formData.title,
          subtitle: formData.subtitle || undefined,
          image: formData.image || undefined,
          content: formData.content,
          author: formData.author,
        })

        if (result.success && result.blog) {
          router.push(`/blogs/${result.blog.slug}`)
          router.refresh()
        } else {
          setError(result.error || 'Failed to update blog')
        }
      } else {
        // Create new blog
        const result = await createBlogAction({
          title: formData.title,
          subtitle: formData.subtitle || undefined,
          image: formData.image || undefined,
          content: formData.content,
          author: formData.author,
        })

        if (result.success && result.blog) {
          router.push(`/blogs/${result.blog.slug}`)
          router.refresh()
        } else {
          setError(result.error || 'Failed to create blog')
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Blog Details</CardTitle>
          <CardDescription>
            Fill in the basic information for your blog post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Optional subtitle"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Cover Image URL</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content *</CardTitle>
          <CardDescription>
            Write your blog post content. Use the formatting toolbar that appears when you select text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TipTapEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Start writing your blog post..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending
            ? blog
              ? 'Updating...'
              : 'Creating...'
            : blog
              ? 'Update Blog Post'
              : 'Create Blog Post'}
        </Button>
        <Link href={blog ? `/blogs/${blog.slug}` : '/blogs'}>
          <Button type="button" variant="outline" disabled={isPending}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}

