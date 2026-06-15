import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The blog post you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/blogs">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blogs
          </Button>
        </Link>
      </div>
    </div>
  )
}

