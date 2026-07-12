import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@vps/database'
import BlogPostForm from '../BlogPostForm'

export const metadata: Metadata = { title: 'Editar artículo — Blog' }
export const dynamic = 'force-dynamic'

export default async function BlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  const supabase = createServerClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link
          href="/blog"
          className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
        >
          ← Blog
        </Link>
        <span className="text-brand-primary/20">/</span>
        <h1 className="font-display text-brand-primary text-2xl truncate max-w-md">
          {post.title}
        </h1>
      </div>
      <BlogPostForm post={post} />
    </div>
  )
}
