'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'

const ROAST_OPTIONS = ['claro', 'medio', 'oscuro']
const WEIGHT_OPTIONS = ['250g', '500g', '1kg']
const GRIND_OPTIONS = ['grano', 'media', 'fina', 'gruesa']
const BREW_OPTIONS = ['espresso', 'filtrado', 'cold_brew', 'universal']

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface Variant {
  id?: number
  roast: string
  weight: string
  grind: string
  brew_method: string
  price: string
  stock: string
  sku: string
  active: boolean
  _delete?: boolean
}

interface Category { id: number; name: string }

interface Product {
  id?: number
  name: string
  slug: string
  description: string
  category_id: string
  featured: boolean
  active: boolean
  seo_title: string
  seo_desc: string
  images: string[]   // URLs de imágenes
  variants: Variant[]
}

interface Props {
  product?: any
  categories: Category[]
}

const emptyVariant = (): Variant => ({
  roast: 'medio', weight: '250g', grind: 'grano',
  brew_method: 'universal', price: '', stock: '0', sku: '', active: true,
})

export default function ProductForm({ product, categories }: Props) {
  const router = useRouter()
  const isEdit = !!product?.id

  const [form, setForm] = useState<Product>({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    category_id: product?.category_id?.toString() ?? '',
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    seo_title: product?.seo_title ?? '',
    seo_desc: product?.seo_desc ?? '',
    images: product?.images?.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) ?? [''],
    variants: product?.variants?.map((v: any) => ({
      id: v.id,
      roast: v.roast ?? 'medio',
      weight: v.weight ?? '250g',
      grind: v.grind ?? 'grano',
      brew_method: v.brew_method ?? 'universal',
      price: v.price?.toString() ?? '',
      stock: v.stock?.toString() ?? '0',
      sku: v.sku ?? '',
      active: v.active ?? true,
    })) ?? [emptyVariant()],
  })

  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadsInProgress, setUploadsInProgress] = useState(0)
  const [error, setError] = useState('')

  function handleUploadStateChange(uploading: boolean) {
    setUploadsInProgress((n) => uploading ? n + 1 : Math.max(0, n - 1))
  }

  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: toSlug(f.name) }))
  }, [form.name, slugTouched])

  function updateVariant(index: number, field: keyof Variant, value: any) {
    setForm((f) => {
      const variants = [...f.variants]
      variants[index] = { ...variants[index], [field]: value }
      return { ...f, variants }
    })
  }

  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }))
  }

  function removeVariant(index: number) {
    setForm((f) => {
      const variants = [...f.variants]
      if (variants[index].id) {
        // Marcar para eliminar en el servidor
        variants[index] = { ...variants[index], _delete: true }
      } else {
        variants.splice(index, 1)
      }
      return { ...f, variants }
    })
  }

  const visibleVariants = form.variants.filter((v) => !v._delete)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
    if (!form.slug.trim()) {
      setError('El slug es obligatorio')
      return
    }
    if (uploadsInProgress > 0) {
      setError('Espera a que termine de subir la imagen antes de guardar')
      return
    }
    if (visibleVariants.length === 0) {
      setError('Debes agregar al menos una variante')
      return
    }
    const pricesMissing = visibleVariants.some((v) => !v.price || Number(v.price) <= 0)
    if (pricesMissing) {
      setError('Todas las variantes deben tener un precio mayor a 0')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      images: form.images.filter(Boolean).map((url) => ({ url })),
      variants: form.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        stock: Number(v.stock),
      })),
    }

    const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      const msg = data.error ?? 'Error al guardar'
      setError(
        msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')
          ? `El slug "${form.slug}" ya está en uso. Cámbialo manualmente antes de guardar.`
          : msg
      )
      setSaving(false)
      return
    }

    router.push('/productos')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto y todas sus variantes? Esta acción no se puede deshacer.')) return
    setSaving(true)
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al eliminar')
      setSaving(false)
      return
    }
    router.push('/productos')
    router.refresh()
  }

  const fmt = (n: string) => {
    const num = Number(n)
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CO').format(num)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/productos')}
            className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary mb-2 flex items-center gap-1"
          >
            ← Volver a productos
          </button>
          <h1 className="font-display text-brand-primary text-2xl">
            {isEdit ? `Editar: ${product.name}` : 'Nuevo producto'}
          </h1>
        </div>
        <div className="flex gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="font-brand text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              Eliminar
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploadsInProgress > 0}
            className="font-brand text-sm bg-brand-primary text-brand-cream px-5 py-2 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : uploadsInProgress > 0 ? 'Subiendo imagen...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>

      {error && <p className="font-brand text-sm text-red-500 bg-red-50 rounded-xl px-5 py-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos básicos */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-brand font-semibold text-brand-primary">Información general</h2>

            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Nombre del producto *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder="Ej: Geisha Natural — Huila"
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
              />
              <p className="font-brand text-xs text-brand-primary/30 mt-1">URL: /tienda/{form.slug}</p>
            </div>

            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Descripción</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-none"
                placeholder="Descripción del producto, origen, notas de cata..."
              />
            </div>
          </section>

          {/* Imágenes */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-brand font-semibold text-brand-primary">
                Imágenes
                <span className="ml-2 text-xs text-brand-primary/40 font-normal">La primera es la imagen principal</span>
              </h2>
              {form.images.length < 4 && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: [...f.images, ''] }))}
                  className="font-brand text-xs text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  + Agregar imagen
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {form.images.map((url, idx) => (
                <div key={idx} className="relative">
                  <ImageUpload
                    value={url}
                    onChange={(newUrl) => setForm((f) => {
                      const imgs = [...f.images]
                      imgs[idx] = newUrl
                      return { ...f, images: imgs }
                    })}
                    onUploadStateChange={handleUploadStateChange}
                    bucket="products"
                    label={idx === 0 ? 'Imagen principal' : `Imagen ${idx + 1}`}
                    sizeClass="aspect-square"
                  />
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-6 right-1 font-brand text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Variantes */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-brand font-semibold text-brand-primary">
                Variantes
                <span className="ml-2 text-xs text-brand-primary/40 font-normal">({visibleVariants.length})</span>
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="font-brand text-xs text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-cream transition-colors"
              >
                + Agregar variante
              </button>
            </div>

            {visibleVariants.length === 0 && (
              <p className="font-brand text-sm text-brand-primary/30 text-center py-6">
                Agrega al menos una variante para poder guardar el producto.
              </p>
            )}

            <div className="space-y-4">
              {form.variants.map((variant, idx) => {
                if (variant._delete) return null
                return (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-brand text-xs text-brand-primary/40">Variante {idx + 1}</span>
                      {visibleVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="font-brand text-xs text-red-400 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Tueste</label>
                        <select
                          value={variant.roast}
                          onChange={(e) => updateVariant(idx, 'roast', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                        >
                          {ROAST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Peso</label>
                        <select
                          value={variant.weight}
                          onChange={(e) => updateVariant(idx, 'weight', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                        >
                          {WEIGHT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Molienda</label>
                        <select
                          value={variant.grind}
                          onChange={(e) => updateVariant(idx, 'grind', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                        >
                          {GRIND_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Método</label>
                        <select
                          value={variant.brew_method}
                          onChange={(e) => updateVariant(idx, 'brew_method', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                        >
                          {BREW_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Precio (COP) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                          placeholder="45000"
                        />
                        {variant.price && <p className="font-brand text-xs text-brand-primary/30 mt-1">$ {fmt(variant.price)}</p>}
                      </div>

                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">Stock</label>
                        <input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="font-brand text-xs text-brand-primary/40 block mb-1">SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                          placeholder="VPS-001-M"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(e) => updateVariant(idx, 'active', e.target.checked)}
                        className="w-4 h-4 accent-brand-primary"
                      />
                      <span className="font-brand text-xs text-brand-primary/50">Variante activa</span>
                    </label>
                  </div>
                )
              })}
            </div>
          </section>

          {/* SEO */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-brand font-semibold text-brand-primary">SEO</h2>
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Título SEO</label>
              <input
                type="text"
                value={form.seo_title}
                onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                placeholder={form.name || 'Título para Google'}
                maxLength={60}
              />
              <p className="font-brand text-xs text-brand-primary/30 mt-1">{form.seo_title.length}/60 caracteres</p>
            </div>
            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Meta descripción</label>
              <textarea
                rows={2}
                value={form.seo_desc}
                onChange={(e) => setForm((f) => ({ ...f, seo_desc: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-none"
                placeholder="Descripción corta para motores de búsqueda..."
                maxLength={160}
              />
              <p className="font-brand text-xs text-brand-primary/30 mt-1">{form.seo_desc.length}/160 caracteres</p>
            </div>
          </section>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-brand font-semibold text-brand-primary">Publicación</h2>

            <div>
              <label className="font-brand text-xs text-brand-primary/50 block mb-1">Categoría</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="font-brand text-sm text-brand-primary">Producto activo (visible en tienda)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="w-4 h-4 accent-brand-primary"
              />
              <span className="font-brand text-sm text-brand-primary">Destacar en home</span>
            </label>
          </section>

        </div>
      </div>
    </form>
  )
}
