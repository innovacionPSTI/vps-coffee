'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id?: number
  name: string
  slug: string
  description: string | null
  active: boolean
}

interface Props {
  category?: Category
  onClose: () => void
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function CategoryFormModal({ category, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!category?.id

  const [form, setForm] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    active: category?.active ?? true,
  })
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: toSlug(f.name) }))
  }, [form.name, slugTouched])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url = isEdit ? `/api/admin/categories/${category!.id}` : '/api/admin/categories'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }

    router.refresh()
    onClose()
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
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-brand-primary text-xl">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="text-brand-primary/30 hover:text-brand-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
              placeholder="Ej: Electrónica, Ropa, Accesorios"
            />
          </div>

          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: toSlug(e.target.value) })) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary/60 focus:outline-none focus:border-brand-primary"
              placeholder="nombre-categoria"
            />
            <p className="font-brand text-xs text-brand-primary/30 mt-1">URL: /tienda?categoria={form.slug}</p>
          </div>

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

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary"
            />
            <span className="font-brand text-sm text-brand-primary">Categoría activa</span>
          </label>

          {error && <p className="font-brand text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

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
              onClick={onClose}
              className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 py-2 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-brand text-sm bg-brand-primary text-brand-cream px-5 py-2 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
