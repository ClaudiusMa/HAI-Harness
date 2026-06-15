"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteBlogAction } from '@/app/actions/blogs'

interface DeleteBlogButtonProps {
  blogId: number
  blogSlug: string
}

export function DeleteBlogButton({ blogId, blogSlug }: DeleteBlogButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteBlogAction(blogId)
    
    if (result.success) {
      router.push('/blogs')
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete blog')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )
}

