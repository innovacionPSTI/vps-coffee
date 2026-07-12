import { getBlogPosts } from '@vps/database'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Novedades, tutoriales y contenido de interés para nuestra comunidad.',
}

export const revalidate = 60

const CATEGORIES = ['Novedades', 'Tutoriales', 'Cultura', 'Empresa']

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { categoria: category } = await searchParams
  const posts = await getBlogPosts({ category, limit: 20 }).catch(() => [])
  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <h1 className="font-display text-brand-primary text-section">
            Blog
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`rounded-full px-4 py-1.5 font-brand text-sm border transition-colors ${!category ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-brand-primary/20 text-brand-primary hover:border-brand-primary'}`}
            >
              Todos
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/blog?categoria=${cat.toLowerCase()}`}
                className={`rounded-full px-4 py-1.5 font-brand text-sm border transition-colors ${category === cat.toLowerCase() ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-brand-primary/20 text-brand-primary hover:border-brand-primary'}`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="font-brand text-brand-primary/40 text-center py-24 text-xl">
            No hay artículos publicados aún.
          </p>
        ) : (
          <>
            {/* Artículo destacado */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="group block mb-12 bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-1/2 h-64 lg:h-auto bg-brand-cream overflow-hidden">
                    {featured.cover_image ? (
                      <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-brand-primary/10 text-6xl">VPS</span>
                      </div>
                    )}
                  </div>
                  <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <span className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-3">
                      Artículo destacado
                    </span>
                    <h2 className="font-brand font-semibold text-brand-primary text-2xl lg:text-3xl mb-4 group-hover:text-brand-dark transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="font-brand text-brand-primary/60 text-sm leading-relaxed mb-6 line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="font-brand text-xs text-brand-primary/40">
                        {featured.published_at
                          ? new Date(featured.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </p>
                      <span className="font-brand text-sm text-brand-primary underline">Leer más →</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid de artículos */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                    <div className="h-48 bg-brand-cream overflow-hidden">
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-brand-primary/10 text-4xl">VPS</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="font-brand text-xs text-brand-primary/40 mb-1">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                          : ''}
                      </p>
                      <h3 className="font-brand font-semibold text-brand-primary mb-2 group-hover:text-brand-dark transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <span className="font-brand text-xs text-brand-primary/60 underline">Leer más →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
