'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

const CATEGORIES = [
  { value: 'origenes',    label: 'Orígenes' },
  { value: 'preparacion', label: 'Preparación' },
  { value: 'novedades',   label: 'Novedades' },
  { value: 'cultura',     label: 'Cultura' },
]

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface Post {
  id?: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string | null
  published: boolean
  published_at: string | null
  seo_title: string | null
  seo_desc: string | null
}

interface Props {
  post?: Post
}

export default function BlogPostForm({ post }: Props) {
  const router = useRouter()
  const isEdit = !!post?.id

  const [form, setForm] = useState({
    title:       post?.title       ?? '',
    slug:        post?.slug        ?? '',
    excerpt:     post?.excerpt     ?? '',
    content:     post?.content     ?? '',
    cover_image: post?.cover_image ?? '',
    category:    post?.category    ?? 'origenes',
    published:   post?.published   ?? false,
    seo_title:   post?.seo_title   ?? '',
    seo_desc:    post?.seo_desc    ?? '',
  })
  const [slugManual, setSlugManual] = useState(isEdit)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  function setTitle(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugManual ? f.slug : toSlug(title),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title:       form.title.trim(),
      slug:        form.slug.trim(),
      excerpt:     form.excerpt     || null,
      content:     form.content     || null,
      cover_image: form.cover_image || null,
      category:    form.category    || null,
      published:   form.published,
      // Si se publica por primera vez, fija published_at; si se despublica, lo limpia
      published_at: form.published
        ? (post?.published_at ?? new Date().toISOString())
        : null,
      seo_title:   form.seo_title || null,
      seo_desc:    form.seo_desc  || null,
    }

    const url    = isEdit ? `/api/admin/blog/${post!.id}` : '/api/admin/blog'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }

    router.push('/blog')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return
    setSaving(true)
    const res = await fetch(`/api/admin/blog/${post!.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
      setSaving(false)
      return
    }
    router.push('/blog')
    router.refresh()
  }

  const fieldClass =
    'w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* Título + Slug */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Cómo el terroir define el sabor del café"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">
            Slug (URL)
            {form.slug && (
              <span className="ml-2 text-brand-primary/30">
                /blog/<strong>{form.slug}</strong>
              </span>
            )}
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true)
              setForm((f) => ({ ...f, slug: e.target.value }))
            }}
            required
            placeholder="como-el-terroir-define-el-sabor"
            className={`${fieldClass} font-mono`}
          />
        </div>
      </div>

      {/* Imagen de portada */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <ImageUpload
          value={form.cover_image}
          onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))}
          bucket="blog"
          label="Imagen de portada"
          sizeClass="aspect-video"
        />
      </div>

      {/* Categoría + Estado */}
      <div className="bg-white rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary"
            />
            <span className="font-brand text-sm font-semibold text-brand-primary">Publicado</span>
          </label>
          <p className="font-brand text-xs text-brand-primary/30 mt-1 ml-7">
            {form.published ? 'Visible en el sitio público' : 'Borrador — no visible en el sitio'}
          </p>
        </div>
      </div>

      {/* Extracto */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <label className="font-brand text-xs text-brand-primary/50 block mb-1">
          Extracto <span className="text-brand-primary/30">— resumen corto que aparece en la lista del blog</span>
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          rows={3}
          placeholder="Un párrafo breve que resume el artículo..."
          className={`${fieldClass} resize-y`}
        />
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <label className="font-brand text-xs text-brand-primary/50 block mb-1">
          Contenido <span className="text-brand-primary/30">— Markdown</span>
        </label>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={24}
          placeholder={`# Título del artículo\n\nEscribe aquí el contenido del artículo en Markdown.\n\n## Sección 1\n\nTexto...`}
          className={`${fieldClass} resize-y font-mono text-xs leading-relaxed`}
        />
        <p className="font-brand text-xs text-brand-primary/30 mt-2">
          Soporta Markdown: ## títulos, **negrita**, *cursiva*, - listas, [texto](url), ![alt](imagen)
        </p>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-brand font-semibold text-brand-primary text-sm">SEO (opcional)</h3>
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Meta título</label>
          <input
            type="text"
            value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
            placeholder={form.title || 'Título para buscadores — si se deja vacío se usa el título del artículo'}
            className={fieldClass}
            maxLength={70}
          />
          {form.seo_title && (
            <p className="font-brand text-xs text-brand-primary/30 mt-1 text-right">
              {form.seo_title.length}/70 caracteres
            </p>
          )}
        </div>
        <div>
          <label className="font-brand text-xs text-brand-primary/50 block mb-1">Meta descripción</label>
          <textarea
            value={form.seo_desc}
            onChange={(e) => setForm((f) => ({ ...f, seo_desc: e.target.value }))}
            rows={2}
            placeholder="Descripción breve para motores de búsqueda (140–160 caracteres recomendados)"
            className={`${fieldClass} resize-none`}
            maxLength={160}
          />
          {form.seo_desc && (
            <p className="font-brand text-xs text-brand-primary/30 mt-1 text-right">
              {form.seo_desc.length}/160 caracteres
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="font-brand text-xs text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pb-8">
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="font-brand text-sm text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            Eliminar artículo
          </button>
        )}
        <div className="flex-1" />
        {form.slug && (
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-brand text-sm border border-brand-primary/20 text-brand-primary px-4 py-2.5 rounded-xl hover:bg-brand-cream transition-colors"
          >
            Vista previa ↗
          </a>
        )}
        <button
          type="submit"
          disabled={saving || !form.title || !form.slug}
          className="font-brand text-sm bg-brand-primary text-brand-cream px-6 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear artículo'}
        </button>
      </div>
    </form>
  )
}
