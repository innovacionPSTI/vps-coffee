import { getBlogPostBySlug, getBlogPosts } from '@vps/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ShareWhatsApp from '@/components/blog/ShareWhatsApp'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug).catch(() => null)
  if (!post) return {}
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_desc ?? post.excerpt ?? undefined,
  }
}

export async function generateStaticParams() {
  const posts = await getBlogPosts().catch(() => [])
  return posts.map((p) => ({ slug: p.slug }))
}

export const revalidate = 60

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug).catch(() => null)
  if (!post) notFound()

  const related = await getBlogPosts({ category: post.category ?? undefined, limit: 3 })
    .then((posts) => posts.filter((p) => p.id !== post.id).slice(0, 2))
    .catch(() => [])

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {/* Hero imagen */}
      {post.cover_image && (
        <div className="h-[50vh] min-h-80 overflow-hidden bg-brand-primary">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Breadcrumb */}
        <nav className="font-brand text-sm text-brand-primary/50 flex gap-2 mb-8">
          <Link href="/blog" className="hover:text-brand-primary">Blog</Link>
          {post.category && (
            <>
              <span>/</span>
              <Link href={`/blog?categoria=${post.category}`} className="hover:text-brand-primary capitalize">
                {post.category}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-brand-primary truncate">{post.title}</span>
        </nav>

        {/* Artículo */}
        <article>
          <p className="font-brand text-sm text-brand-primary/40 mb-3">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString('es-CO', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })
              : ''}
          </p>
          <h1 className="font-display text-brand-primary leading-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="font-brand text-brand-primary/70 text-lg leading-relaxed mb-8 border-l-4 border-brand-primary/20 pl-4">
              {post.excerpt}
            </p>
          )}
          {post.content && (
            <div
              className="prose prose-stone max-w-none font-brand text-brand-primary/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}
        </article>

        {/* Compartir */}
        <div className="mt-12 pt-8 border-t border-brand-primary/10 flex items-center gap-4">
          <p className="font-brand text-sm text-brand-primary/50">Compartir:</p>
          <ShareWhatsApp title={post.title} />
        </div>

        {/* Artículos relacionados */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-brand-primary text-2xl mb-6">Artículos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-card transition-shadow">
                  <p className="font-brand font-semibold text-brand-primary group-hover:text-brand-dark transition-colors mb-1">
                    {p.title}
                  </p>
                  <p className="font-brand text-xs text-brand-primary/40">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
