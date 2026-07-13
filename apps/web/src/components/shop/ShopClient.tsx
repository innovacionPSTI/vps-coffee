'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/store/cart'
import type { ProductWithVariants } from '@vps/database'
import { getProductOptions, getVariantAttrs, getVariantLabel, isColorValue, COLOR_HEX } from '@/lib/variant-utils'

const SORTS = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'precio-asc',  label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre',      label: 'A–Z' },
]

interface Props {
  products: ProductWithVariants[]
  searchParams: Record<string, string | string[] | undefined>
}

function Chip({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs font-brand border transition-colors ${
        active
          ? 'bg-brand-primary text-brand-cream border-brand-primary'
          : disabled
            ? 'bg-transparent text-brand-primary/20 border-brand-primary/10 cursor-not-allowed'
            : 'bg-white text-brand-primary border-brand-primary/20 hover:border-brand-primary'
      }`}
    >
      {label}
    </button>
  )
}

export default function ShopClient({ products, searchParams }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.categoria ? Number(searchParams.categoria) : null
  )
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
  const [sort, setSort] = useState('destacados')
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Derive categories from products
  const categories = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((p) => { if (p.category) map.set(p.category.id, p.category.name) })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [products])

  // Derive attribute option filters from products
  const attrFilters = useMemo(() => {
    const optionMap = new Map<string, Set<string>>()
    products.forEach((p) => {
      const opts = getProductOptions(p)
      opts.forEach((opt) => {
        if (!optionMap.has(opt)) optionMap.set(opt, new Set())
        p.variants.filter((v) => v.active).forEach((v) => {
          const attrs = getVariantAttrs(v, opts)
          if (attrs[opt]) optionMap.get(opt)!.add(attrs[opt])
        })
      })
    })
    return [...optionMap.entries()]
      .filter(([, vals]) => vals.size >= 2)
      .map(([name, vals]) => ({ name, values: [...vals] }))
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedCategory && p.category?.id !== selectedCategory) return false
      const opts = getProductOptions(p)
      for (const [opt, val] of Object.entries(selectedAttrs)) {
        if (!val) continue
        const hasVariant = p.variants.some((v) => {
          if (!v.active) return false
          return getVariantAttrs(v, opts)[opt] === val
        })
        if (!hasVariant) return false
      }
      return true
    })

    switch (sort) {
      case 'precio-asc':
        list = [...list].sort((a, b) =>
          Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price))
        )
        break
      case 'precio-desc':
        list = [...list].sort((a, b) =>
          Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price))
        )
        break
      case 'nombre':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      default:
        list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
    return list
  }, [products, selectedCategory, selectedAttrs, sort])

  const hasFilters = selectedCategory !== null || Object.values(selectedAttrs).some(Boolean)

  function clearFilters() {
    setSelectedCategory(null)
    setSelectedAttrs({})
  }

  function toggleAttr(opt: string, val: string) {
    setSelectedAttrs((prev) => ({ ...prev, [opt]: prev[opt] === val ? '' : val }))
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-brand-primary text-section">Catálogo</h1>
            <p className="font-brand text-sm text-brand-primary/50 mt-1">
              {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="font-brand text-sm border border-brand-primary/20 rounded-full px-4 py-2 bg-white text-brand-primary focus:outline-none focus:border-brand-primary self-start sm:self-auto"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Filters */}
        {(categories.length > 1 || attrFilters.length > 0) && (
          <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm space-y-3">
            {/* Category */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-brand text-xs font-semibold text-brand-primary/50 w-20 shrink-0">Categoría</span>
                <Chip label="Todos" active={selectedCategory === null} onClick={() => setSelectedCategory(null)} />
                {categories.map((c) => (
                  <Chip key={c.id} label={c.name} active={selectedCategory === c.id} onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)} />
                ))}
              </div>
            )}
            {/* Dynamic attribute filters */}
            {attrFilters.map((f) => (
              <div key={f.name} className="flex items-center gap-2 flex-wrap">
                <span className="font-brand text-xs font-semibold text-brand-primary/50 w-20 shrink-0">{f.name}</span>
                {f.values.map((v) => (
                  isColorValue(v) ? (
                    <button
                      key={v}
                      onClick={() => toggleAttr(f.name, v)}
                      title={v}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${selectedAttrs[f.name] === v ? 'border-brand-primary scale-110' : 'border-transparent hover:border-brand-primary/40'}`}
                      style={{ backgroundColor: COLOR_HEX[v.toLowerCase()] ?? v }}
                    />
                  ) : (
                    <Chip key={v} label={v} active={selectedAttrs[f.name] === v} onClick={() => toggleAttr(f.name, v)} />
                  )
                ))}
              </div>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary underline">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-brand text-brand-primary/40 text-xl mb-4">No hay productos con estos filtros.</p>
            <button onClick={clearFilters} className="font-brand text-sm text-brand-primary underline">Limpiar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => <ProductCard key={product.id} product={product} fmt={fmt} addItem={addItem} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, fmt, addItem }: { product: ProductWithVariants; fmt: (n: number) => string; addItem: (item: CartItem) => void }) {
  const image = product.images[0]
  const activeVariants = product.variants.filter((v) => v.active)
  const defaultVariant = activeVariants[0] ?? product.variants[0]
  const opts = getProductOptions(product)

  const prices = activeVariants.map((v) => v.price)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const hasMultiplePrices = minPrice !== maxPrice

  // Color option swatches
  const colorOpt = opts.find((o) => o.toLowerCase().includes('color') || o.toLowerCase().includes('colour'))
  const colorValues = colorOpt
    ? [...new Set(activeVariants.map((v) => getVariantAttrs(v, opts)[colorOpt]).filter(Boolean))]
    : []

  // First non-color option chips (e.g. Talla, Peso)
  const chipOpt = opts.find((o) => o !== colorOpt)
  const chipValues = chipOpt
    ? [...new Set(activeVariants.map((v) => getVariantAttrs(v, opts)[chipOpt]).filter(Boolean))].slice(0, 4)
    : []

  const canQuickAdd = activeVariants.length === 1

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Image */}
      <Link href={`/tienda/${product.slug}`} className="block relative overflow-hidden bg-brand-cream-warm h-56">
        {image?.url ? (
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-brand-primary/10 text-6xl">▲</span>
          </div>
        )}
        {product.featured && (
          <span className="absolute top-3 left-3 bg-brand-primary text-brand-cream text-[10px] font-brand font-semibold px-2 py-0.5 rounded-full">
            Destacado
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[60%]" />
      </Link>

      {/* Info */}
      <div className="p-4 pt-1">
        <Link href={`/tienda/${product.slug}`}>
          <p className="font-brand text-[10px] text-brand-primary/40 uppercase tracking-wider">{product.category?.name ?? ''}</p>
          <h3 className="font-brand text-base font-semibold text-brand-primary mt-0.5 group-hover:text-brand-dark transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Color swatches */}
        {colorValues.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {colorValues.slice(0, 6).map((v) => (
              <div
                key={v}
                title={v}
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: COLOR_HEX[v.toLowerCase()] ?? v }}
              />
            ))}
            {colorValues.length > 6 && <span className="font-brand text-[10px] text-brand-primary/40">+{colorValues.length - 6}</span>}
          </div>
        )}

        {/* Attribute chips */}
        {chipValues.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {chipValues.map((v) => (
              <span key={v} className="font-brand text-[10px] border border-brand-primary/20 text-brand-primary/60 rounded px-1.5 py-0.5">
                {v}
              </span>
            ))}
            {chipOpt && activeVariants.length > chipValues.length && (
              <span className="font-brand text-[10px] text-brand-primary/30">+{activeVariants.length - chipValues.length}</span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-brand text-[10px] text-brand-primary/40">
              {hasMultiplePrices ? 'Desde' : ''}
            </span>
            <p className="font-brand font-bold text-brand-primary leading-tight">
              {defaultVariant ? fmt(minPrice) : '—'}
            </p>
          </div>
          {canQuickAdd ? (
            <button
              onClick={() => {
                if (!defaultVariant) return
                addItem({
                  variantId: defaultVariant.id,
                  productSlug: product.slug,
                  productName: product.name,
                  variantLabel: getVariantLabel(defaultVariant, opts),
                  price: defaultVariant.price,
                  qty: 1,
                  imageUrl: image?.url,
                  weight: (defaultVariant.weight ?? '500g') as '250g' | '500g' | '1kg',
                  weight_kg: defaultVariant.weight_kg ?? null,
                  length_cm: defaultVariant.length_cm ?? null,
                  width_cm: defaultVariant.width_cm ?? null,
                  height_cm: defaultVariant.height_cm ?? null,
                })
              }}
              className="rounded-full border border-brand-primary text-brand-primary px-3 py-1 text-xs font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
            >
              Agregar
            </button>
          ) : (
            <Link
              href={`/tienda/${product.slug}`}
              className="rounded-full border border-brand-primary text-brand-primary px-3 py-1 text-xs font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
            >
              Ver opciones
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
