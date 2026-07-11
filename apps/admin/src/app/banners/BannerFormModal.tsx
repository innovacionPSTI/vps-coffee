'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

const SECTIONS = [
  { value: 'hero',      label: 'Hero (carrusel principal)' },
  { value: 'maquila',   label: 'Sección Maquila' },
  { value: 'asesorias', label: 'Sección Asesorías' },
]

// Dimensiones recomendadas por sección
const DIMENSIONS: Record<string, { web: string; mobile: string }> = {
  hero:      { web: '1920 × 600 px',  mobile: '750 × 1000 px' },
  maquila:   { web: '1440 × 700 px',  mobile: '750 × 900 px' },
  asesorias: { web: '1440 × 700 px',  mobile: '750 × 900 px' },
}

interface Banner {
  id?: number
  section: string
  title: string | null
  subtitle: string | null
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  image_url_mobile: string | null
  bg_color: string | null
  active: boolean
}

interface Props {
  banner?: Banner
  defaultSection?: string
  onClose: () => void
}

export default function BannerFormModal({ banner, defaultSection = 'hero', onClose }: Props) {
  const router = useRouter()
  const isEdit = !!banner?.id

  const [form, setForm] = useState({
    section:          banner?.section          ?? defaultSection,
    title:            banner?.title            ?? '',
    subtitle:         banner?.subtitle         ?? '',
    cta_text:         banner?.cta_text         ?? '',
    cta_url:          banner?.cta_url          ?? '',
    image_url:        banner?.image_url        ?? '',
    image_url_mobile: banner?.image_url_mobile ?? '',
    bg_color:         banner?.bg_color         ?? '#614A2A',
    active:           banner?.active           ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const dims = DIMENSIONS[form.section] ?? DIMENSIONS.hero

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url    = isEdit ? `/api/admin/banners/${banner!.id}` : '/api/admin/banners'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title:            form.title            || null,
        subtitle:         form.subtitle         || null,
        cta_text:         form.cta_text         || null,
        cta_url:          form.cta_url          || null,
        image_url:        form.image_url        || null,
        image_url_mobile: form.image_url_mobile || null,
        bg_color:         form.bg_color         || null,
      }),
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
    if (!confirm('¿Eliminar este banner?')) return
    setSaving(true)
    const res = await fetch(`/api/admin/banners/${banner!.id}`, { method: 'DELETE' })
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-brand-primary text-xl">
            {isEdit ? 'Editar banner' : 'Nuevo banner'}
          </h2>
          <button onClick={onClose} className="text-brand-primary/30 hover:text-brand-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Sección */}
          <div>
            <label className="font-brand text-xs text-brand-primary/50 block mb-1">Sección *</label>
            <select
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Imágenes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Web */}
            <div className="space-y-1">
              <ImageUpload
                value={form.image_url}
                onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                bucket="banners"
                label="Imagen Web / Escritorio"
                sizeClass="h-44"
              />
              <p className="font-brand text-xs text-brand-primary/30 flex items-center gap-1">
                <span>🖥️</span>
                Recomendado: <strong>{dims.web}</strong>
              </p>
            </div>

            {/* Mobile */}
            <div className="space-y-1">
              <ImageUpload
                value={form.image_url_mobile}
                onChange={(url) => setForm((f) => ({ ...f, image_url_mobile: url }))}
                bucket="banners"
                label="Imagen Mobile (opcional)"
                sizeClass="h-44"
              />
              <p className="font-brand text-xs text-brand-primary/30 flex items-center gap-1">
                <span>📱</span>
                Recomendado: <strong>{dims.mobile}</strong>
              </p>
              {!form.image_url_mobile && (
                <p className="font-brand text-xs text-brand-primary/20 italic">
                  Si no se sube, se usa la imagen web en móvil.
                </p>
              )}
            </div>
          </div>

          {/* Título y subtítulo */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder="Café de Especialidad Colombiano"
              />
            </div>
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Subtítulo</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder="Del campo a tu taza"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Texto del botón</label>
              <input
                type="text"
                value={form.cta_text}
                onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder="Ver tienda"
              />
            </div>
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">URL del botón</label>
              <input
                type="text"
                value={form.cta_url}
                onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder="/tienda"
              />
            </div>
          </div>

          {/* Color de fondo */}
          <div className="flex items-center gap-3">
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Color de fondo</label>
              <input
                type="color"
                value={form.bg_color}
                onChange={(e) => setForm((f) => ({ ...f, bg_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
              />
            </div>
            <p className="font-brand text-xs text-brand-primary/40 mt-4">
              Se usa cuando no hay imagen
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary"
            />
            <span className="font-brand text-sm text-brand-primary">Banner activo</span>
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
              className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 py-2 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-brand text-sm bg-brand-primary text-brand-cream px-5 py-2 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
