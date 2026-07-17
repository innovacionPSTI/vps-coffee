'use client'

import { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'

/** Categoría recibida como prop (id es opcional al crear) */
interface CategoryInput {
  id?: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  order_index: number
  active: boolean
}

/** Categoría devuelta por la API (id siempre presente) */
export interface SavedCategory {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  order_index: number
  active: boolean
}

interface Props {
  category?: CategoryInput
  onClose: (updated?: SavedCategory) => void
  onDelete?: (id: number) => void
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function CategoryFormModal({ category, onClose, onDelete }: Props) {
  const isEdit = !!category?.id
  // Ensure returned data is typed as SavedCategory (id always present from API)

  const [form, setForm] = useState({
    name:        category?.name ?? '',
    slug:        category?.slug ?? '',
    description: category?.description ?? '',
    image_url:   category?.image_url ?? '',
    active:      category?.active ?? true,
  })
  const [slugTouched,       setSlugTouched]       = useState(isEdit)
  const [uploadsInProgress, setUploadsInProgress] = useState(0)
  const [saving,            setSaving]            = useState(false)
  const [error,             setError]             = useState('')

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: toSlug(f.name) }))
  }, [form.name, slugTouched])

  function handleUploadStateChange(uploading: boolean) {
    setUploadsInProgress((n) => uploading ? n + 1 : Math.max(0, n - 1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    if (uploadsInProgress > 0) { setError('Espera a que termine de subir la imagen'); return }
    setSaving(true)
    setError('')

    const payload = {
      name:        form.name.trim(),
      slug:        form.slug.trim(),
      description: form.description.trim() || null,
      image_url:   form.image_url || null,
      active:      form.active,
    }

    const url    = isEdit ? `/api/admin/categories/${category!.id}` : '/api/admin/categories'
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

    const data = await res.json() as SavedCategory
    onClose(data)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) return
    setSaving(true)
    const res = await fetch(`/api/admin/categories/${category!.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
      setSaving(false)
      return
    }
    onDelete?.(category!.id!)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onClose()} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-brand-primary text-xl">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={() => onClose()} className="text-brand-primary/30 hover:text-brand-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Imagen */}
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-2">
              Imagen de portada <span className="text-brand-primary/30">(opcional)</span>
            </label>
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              onUploadStateChange={handleUploadStateChange}
              bucket="banners"
              label="Imagen de categoría"
              sizeClass="aspect-video"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
              placeholder="ej: Café de especialidad"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: toSlug(e.target.value) })) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary/60 focus:outline-none focus:border-brand-primary"
              placeholder="cafe-especialidad"
            />
            <p className="font-brand text-xs text-brand-primary/30 mt-1">URL: /tienda?categoria={form.slug}</p>
          </div>

          {/* Descripción */}
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          {/* Activa */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary"
            />
            <span className="font-brand text-sm text-brand-primary">Categoría activa</span>
          </label>

          {error && (
            <p className="font-brand text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="font-brand text-sm text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => onClose()}
              className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploadsInProgress > 0}
              className="font-brand text-sm bg-brand-primary text-brand-cream px-5 py-2 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : uploadsInProgress > 0 ? 'Subiendo...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
