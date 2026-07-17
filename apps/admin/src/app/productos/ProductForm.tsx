'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import type { VariantType } from '@vps/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Genera el producto cartesiano de los arrays dados.
 * Ej: [['Claro','Oscuro'],['250g','500g']] → [['Claro','250g'],['Claro','500g'],['Oscuro','250g'],…]
 */
function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]]
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((prev) => arr.map((val) => [...prev, val])),
    [[]]
  )
}

/**
 * Construye el label legible de una variante a partir de sus atributos.
 * ej: { Tueste: 'Claro', Peso: '250g' } → "Claro / 250g"
 */
function buildLabel(attrs: Record<string, string>): string {
  return Object.values(attrs).join(' / ')
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Variant {
  id?: number
  attributes: Record<string, string>  // { "Tueste": "Claro", "Peso": "250g" }
  price: string
  stock: string
  sku: string
  active: boolean
  weight_kg: string
  length_cm: string
  width_cm: string
  height_cm: string
  _delete?: boolean
}

interface Category { id: number; name: string }

interface ProductForm {
  name: string
  slug: string
  description: string
  category_id: string
  featured: boolean
  active: boolean
  seo_title: string
  seo_desc: string
  images: string[]
  selectedTypeIds: number[]   // IDs de los VariantType elegidos para este producto
  variants: Variant[]
}

interface Props {
  product?: any
  categories: Category[]
  variantTypes: VariantType[]
}

// ── Estado vacío ──────────────────────────────────────────────────────────────

function emptyVariant(attrs: Record<string, string> = {}): Variant {
  return { attributes: attrs, price: '', stock: '0', sku: '', active: true, weight_kg: '', length_cm: '', width_cm: '', height_cm: '' }
}

function parseExistingTypeIds(product: any, variantTypes: VariantType[]): number[] {
  const opts: string[] = Array.isArray(product?.variant_options) ? product.variant_options : []
  if (opts.length === 0) return []
  return variantTypes.filter((vt) => opts.includes(vt.name)).map((vt) => vt.id)
}

function parseExistingVariants(product: any): Variant[] {
  if (!product?.variants?.length) return []
  return product.variants.map((v: any) => ({
    id: v.id,
    attributes: v.attributes ?? {},
    price: v.price?.toString() ?? '',
    stock: v.stock?.toString() ?? '0',
    sku: v.sku ?? '',
    active: v.active ?? true,
    weight_kg: v.weight_kg?.toString() ?? '',
    length_cm: v.length_cm?.toString() ?? '',
    width_cm:  v.width_cm?.toString()  ?? '',
    height_cm: v.height_cm?.toString() ?? '',
  }))
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProductForm({ product, categories, variantTypes }: Props) {
  const router = useRouter()
  const isEdit = !!product?.id

  const [form, setForm] = useState<ProductForm>(() => ({
    name:          product?.name ?? '',
    slug:          product?.slug ?? '',
    description:   product?.description ?? '',
    category_id:   product?.category_id?.toString() ?? '',
    featured:      product?.featured ?? false,
    active:        product?.active ?? true,
    seo_title:     product?.seo_title ?? '',
    seo_desc:      product?.seo_desc ?? '',
    images:        product?.images?.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean) ?? [''],
    selectedTypeIds: parseExistingTypeIds(product, variantTypes),
    variants:      parseExistingVariants(product).length > 0
      ? parseExistingVariants(product)
      : [emptyVariant()],
  }))

  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [saving, setSaving]           = useState(false)
  const [uploadsInProgress, setUploadsInProgress] = useState(0)
  const [error, setError]             = useState('')
  const [showDims, setShowDims]       = useState(false)

  // Auto-slug
  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, slug: toSlug(f.name) }))
  }, [form.name, slugTouched])

  // ── Selección de tipos ─────────────────────────────────────────────────────

  function toggleType(id: number) {
    setForm((f) => {
      const next = f.selectedTypeIds.includes(id)
        ? f.selectedTypeIds.filter((x) => x !== id)
        : [...f.selectedTypeIds, id]
      return { ...f, selectedTypeIds: next }
    })
  }

  /** Tipos seleccionados en orden de selección */
  const selectedTypes = form.selectedTypeIds
    .map((id) => variantTypes.find((vt) => vt.id === id))
    .filter(Boolean) as VariantType[]

  // ── Generación de combinaciones ─────────────────────────────────────────────

  const generateMatrix = useCallback(() => {
    if (selectedTypes.length === 0) {
      setForm((f) => ({ ...f, variants: [emptyVariant()] }))
      return
    }

    const typeValues = selectedTypes.map((t) => t.values)
    const combos = cartesian(typeValues)

    setForm((f) => {
      // Preservar datos de variantes existentes que coincidan por atributos
      const existing = f.variants.filter((v) => !v._delete)

      const newVariants: Variant[] = combos.map((combo) => {
        const attrs: Record<string, string> = {}
        selectedTypes.forEach((t, i) => { attrs[t.name] = combo[i] })

        // Buscar si ya hay una variante con estos atributos exactos
        const match = existing.find((v) =>
          Object.entries(attrs).every(([k, val]) => v.attributes[k] === val)
        )

        return match
          ? { ...match, attributes: attrs }
          : emptyVariant(attrs)
      })

      return { ...f, variants: newVariants }
    })
  }, [selectedTypes])

  // ── Edición de variantes ───────────────────────────────────────────────────

  function updateVariant(index: number, field: keyof Variant, value: any) {
    setForm((f) => {
      const variants = [...f.variants]
      variants[index] = { ...variants[index], [field]: value }
      return { ...f, variants }
    })
  }

  function removeVariant(index: number) {
    setForm((f) => {
      const variants = [...f.variants]
      if (variants[index].id) {
        variants[index] = { ...variants[index], _delete: true }
      } else {
        variants.splice(index, 1)
      }
      return { ...f, variants }
    })
  }

  function addManualVariant() {
    const attrs: Record<string, string> = {}
    selectedTypes.forEach((t) => { attrs[t.name] = '' })
    setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant(attrs)] }))
  }

  const visibleVariants = form.variants.filter((v) => !v._delete)

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleUploadStateChange(uploading: boolean) {
    setUploadsInProgress((n) => uploading ? n + 1 : Math.max(0, n - 1))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre del producto es obligatorio'); return }
    if (!form.slug.trim()) { setError('El slug es obligatorio'); return }
    if (uploadsInProgress > 0) { setError('Espera a que termine de subir la imagen'); return }
    if (visibleVariants.length === 0) { setError('Debes agregar al menos una variante'); return }
    const pricesMissing = visibleVariants.some((v) => !v.price || Number(v.price) <= 0)
    if (pricesMissing) { setError('Todas las variantes deben tener un precio mayor a 0'); return }

    setSaving(true)
    setError('')

    const variantOptions = selectedTypes.map((t) => t.name)

    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      images: form.images.filter(Boolean).map((url) => ({ url })),
      variant_options: variantOptions,
      variants: form.variants.map((v) => ({
        ...v,
        price:     Number(v.price),
        stock:     Number(v.stock),
        weight_kg: v.weight_kg ? Number(v.weight_kg) : null,
        length_cm: v.length_cm ? Number(v.length_cm) : null,
        width_cm:  v.width_cm  ? Number(v.width_cm)  : null,
        height_cm: v.height_cm ? Number(v.height_cm) : null,
        attributes: Object.keys(v.attributes).length > 0 ? v.attributes : null,
        // Limpiar campos legacy si usamos variantes genéricas
        ...(variantOptions.length > 0 ? { roast: null, weight: null, grind: null, brew_method: null } : {}),
      })),
    }

    const url    = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products'
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
        msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('duplicate')
          ? `El slug "${form.slug}" ya está en uso. Cámbialo manualmente.`
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

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {/* ── Columna principal ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Información general */}
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
                placeholder="Nombre del producto"
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
                placeholder="Descripción del producto..."
              />
            </div>
          </section>

          {/* Tipos de variante */}
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-brand font-semibold text-brand-primary">Tipos de variante</h2>
                <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
                  Selecciona los atributos que diferencian las variantes de este producto.
                </p>
              </div>
              <a
                href="/variantes"
                target="_blank"
                className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                Gestionar tipos ↗
              </a>
            </div>

            {variantTypes.length === 0 ? (
              <p className="font-brand text-sm text-brand-primary/40 text-center py-4">
                No hay tipos de variante. <a href="/variantes" className="text-brand-primary underline">Crea uno primero.</a>
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {variantTypes.map((vt) => {
                    const selected = form.selectedTypeIds.includes(vt.id)
                    return (
                      <button
                        key={vt.id}
                        type="button"
                        onClick={() => toggleType(vt.id)}
                        className={`font-brand text-sm px-4 py-2 rounded-xl border-2 transition-all ${
                          selected
                            ? 'border-brand-primary bg-brand-primary text-brand-cream'
                            : 'border-gray-200 bg-white text-brand-primary/60 hover:border-brand-primary/40'
                        }`}
                      >
                        {vt.name}
                        {selected && (
                          <span className="ml-1.5 text-xs opacity-70">
                            ({vt.values.slice(0, 2).join(', ')}{vt.values.length > 2 ? '…' : ''})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {selectedTypes.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={generateMatrix}
                      className="w-full font-brand text-sm bg-brand-cream text-brand-primary border-2 border-dashed border-brand-primary/30 px-4 py-3 rounded-xl hover:bg-brand-primary/5 hover:border-brand-primary/60 transition-all"
                    >
                      ✦ Generar combinaciones automáticamente
                      <span className="ml-2 text-xs text-brand-primary/40">
                        ({selectedTypes.reduce((acc, t) => acc * t.values.length, 1)} combinaciones)
                      </span>
                    </button>
                    <p className="font-brand text-xs text-brand-primary/30 mt-1.5 text-center">
                      Genera todas las combinaciones posibles. Puedes ajustar precio y stock individualmente.
                    </p>
                  </div>
                )}
              </>
            )}
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDims((v) => !v)}
                  className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                >
                  {showDims ? 'Ocultar' : 'Mostrar'} dimensiones
                </button>
                <button
                  type="button"
                  onClick={addManualVariant}
                  className="font-brand text-xs text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-cream transition-colors"
                >
                  + Agregar variante
                </button>
              </div>
            </div>

            {visibleVariants.length === 0 ? (
              <p className="font-brand text-sm text-brand-primary/30 text-center py-6">
                Usa "Generar combinaciones" o agrega una variante manualmente.
              </p>
            ) : (
              <>
                {/* Cabecera de la tabla */}
                <div className={`grid gap-2 text-xs font-brand text-brand-primary/40 px-1 ${
                  selectedTypes.length > 0
                    ? `grid-cols-[1fr_repeat(${selectedTypes.length},100px)_80px_80px_80px_28px]`
                    : 'grid-cols-[1fr_80px_80px_80px_28px]'
                }`}>
                  <span>Variante</span>
                  {selectedTypes.map((t) => <span key={t.id}>{t.name}</span>)}
                  <span>Precio*</span>
                  <span>Stock</span>
                  <span>SKU</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {form.variants.map((variant, idx) => {
                    if (variant._delete) return null
                    const label = selectedTypes.length > 0
                      ? buildLabel(variant.attributes)
                      : `Variante ${idx + 1}`

                    return (
                      <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-3">
                        {/* Fila principal: atributos + precio/stock/sku */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Etiqueta de la combinación */}
                          <div className="flex-1 min-w-[120px]">
                            {selectedTypes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {selectedTypes.map((t) => (
                                  <span key={t.id} className="font-brand text-xs bg-brand-cream text-brand-primary px-2 py-0.5 rounded-full">
                                    {variant.attributes[t.name] || <span className="text-red-400">sin valor</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="font-brand text-sm text-brand-primary/60">{label}</span>
                            )}
                          </div>

                          {/* Si no hay tipos elegidos, mostrar inputs de atributos libres */}
                          {selectedTypes.length === 0 && (
                            <input
                              type="text"
                              value={variant.attributes['label'] ?? ''}
                              onChange={(e) => updateVariant(idx, 'attributes', { label: e.target.value })}
                              placeholder="ej: Talla M"
                              className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
                            />
                          )}

                          {/* Precio */}
                          <div className="w-24">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-brand text-xs text-brand-primary/30">$</span>
                              <input
                                type="number"
                                required
                                min={0}
                                value={variant.price}
                                onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg font-brand text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
                                placeholder="0"
                              />
                            </div>
                            {variant.price && Number(variant.price) > 0 && (
                              <p className="font-brand text-[10px] text-brand-primary/30 mt-0.5 text-right">
                                ${fmt(variant.price)}
                              </p>
                            )}
                          </div>

                          {/* Stock */}
                          <input
                            type="number"
                            min={0}
                            value={variant.stock}
                            onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
                            placeholder="0"
                          />

                          {/* SKU */}
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
                          />

                          {/* Activo + eliminar */}
                          <div className="flex items-center gap-2 ml-auto">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={variant.active}
                                onChange={(e) => updateVariant(idx, 'active', e.target.checked)}
                                className="w-3.5 h-3.5 accent-brand-primary"
                              />
                              <span className="font-brand text-[10px] text-brand-primary/40">Activa</span>
                            </label>
                            {visibleVariants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(idx)}
                                className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dimensiones de envío (colapsables) */}
                        {showDims && (
                          <div className="pt-1 border-t border-gray-100">
                            <p className="font-brand text-[10px] text-brand-primary/30 mb-2">
                              Dimensiones para Skydropx (opcionales)
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { field: 'weight_kg', label: 'Peso kg', placeholder: '0.35' },
                                { field: 'length_cm', label: 'Largo cm', placeholder: '20' },
                                { field: 'width_cm',  label: 'Ancho cm', placeholder: '15' },
                                { field: 'height_cm', label: 'Alto cm',  placeholder: '8'  },
                              ].map(({ field, label, placeholder }) => (
                                <div key={field}>
                                  <label className="font-brand text-[10px] text-brand-primary/30 block mb-1">{label}</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={(variant as any)[field]}
                                    onChange={(e) => updateVariant(idx, field as keyof Variant, e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
                                    placeholder={placeholder}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
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
              <p className="font-brand text-xs text-brand-primary/30 mt-1">{form.seo_title.length}/60</p>
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
              <p className="font-brand text-xs text-brand-primary/30 mt-1">{form.seo_desc.length}/160</p>
            </div>
          </section>
        </div>

        {/* ── Columna lateral ── */}
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
              <span className="font-brand text-sm text-brand-primary">Producto activo</span>
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

          {/* Resumen de tipos elegidos */}
          {selectedTypes.length > 0 && (
            <section className="bg-brand-cream/50 rounded-2xl p-5 space-y-3">
              <h3 className="font-brand text-xs font-semibold text-brand-primary">Tipos seleccionados</h3>
              {selectedTypes.map((t) => (
                <div key={t.id} className="space-y-1">
                  <p className="font-brand text-xs text-brand-primary font-semibold">{t.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.values.map((v) => (
                      <span key={v} className="font-brand text-[11px] bg-white text-brand-primary/70 border border-brand-primary/10 px-2 py-0.5 rounded-full">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <p className="font-brand text-[11px] text-brand-primary/40">
                Total: {selectedTypes.reduce((acc, t) => acc * t.values.length, 1)} combinaciones posibles
              </p>
            </section>
          )}
        </div>
      </div>
    </form>
  )
}
