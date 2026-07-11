import { createServerClient } from '@vps/database'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog' }
export const dynamic = 'force-dynamic'

export default async function BlogAdminPage() {
  const supabase = createServerClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Blog</h1>
        <Link
          href="/blog/nuevo"
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors"
        >
          + Nuevo artículo
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Título', 'Categoría', 'Fecha', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-6 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!posts?.length ? (
              <tr>
                <td colSpan={5} className="font-brand text-brand-primary/40 text-center py-12">
                  No hay artículos. <Link href="/blog/nuevo" className="underline">Crear el primero →</Link>
                </td>
              </tr>
            ) : (
              posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-brand font-semibold text-brand-primary text-sm">{post.title}</p>
                    <p className="font-brand text-xs text-brand-primary/40">/blog/{post.slug}</p>
                  </td>
                  <td className="px-6 py-3 font-brand text-sm text-brand-primary/60 capitalize">{post.category ?? '—'}</td>
                  <td className="px-6 py-3 font-brand text-sm text-brand-primary/50">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`font-brand text-xs font-semibold rounded-full px-3 py-1 ${post.published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {post.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <Link href={`/blog/${post.id}`} className="font-brand text-xs border border-brand-primary/20 text-brand-primary rounded-full px-3 py-1 hover:bg-brand-primary hover:text-brand-cream transition-colors">
                        Editar
                      </Link>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-brand text-xs text-brand-primary/50 border border-gray-200 rounded-full px-3 py-1 hover:border-brand-primary transition-colors"
                      >
                        Vista previa
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
