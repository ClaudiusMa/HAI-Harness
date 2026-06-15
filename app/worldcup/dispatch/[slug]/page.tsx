import Link from "next/link"
import { notFound } from "next/navigation"
import { getLongformBySlug } from "@/lib/worldcup/longform"
import { LongformArticle } from "@/components/worldcup/longform/longform-article"
import { ArrowLeft } from "lucide-react"

interface DispatchArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function DispatchArticlePage({ params }: DispatchArticlePageProps) {
  const { slug } = await params
  const feature = getLongformBySlug(slug)

  if (!feature) notFound()

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/worldcup/dispatch"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Serif Dispatch
        </Link>
        <LongformArticle feature={feature} />
      </div>
    </div>
  )
}
