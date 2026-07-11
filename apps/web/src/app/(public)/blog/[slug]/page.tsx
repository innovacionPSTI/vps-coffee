import { getBlogPostBySlug, getBlogPosts } from '@vps/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug).catch(() => null)
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
  const post = await getBlogPostBySlug(params.slug).catch(() => null)
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
          <a
            href={`https://wa.me/?text=${encodeURIComponent(post.title + ' - ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>
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
