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

// ── Sidebar filter panel ──────────────────────────────────────────────────────

interface FilterPanelProps {
  categories: { id: number; name: string }[]
  attrFilters: { name: string; values: string[] }[]
  selectedCategory: number | null
  selectedAttrs: Record<string, string>
  onSelectCategory: (id: number | null) => void
  onToggleAttr: (opt: string, val: string) => void
  onClearFilters: () => void
  hasFilters: boolean
}

function FilterPanel({
  categories, attrFilters, selectedCategory, selectedAttrs,
  onSelectCategory, onToggleAttr, onClearFilters, hasFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="font-brand font-semibold text-brand-primary text-sm">Filtros</h2>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary underline transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Categorías */}
      {categories.length > 1 && (
        <div>
          <p className="font-brand text-xs font-semibold text-brand-primary/50 uppercase tracking-wider mb-3">
            Categoría
          </p>
          <div className="space-y-1.5">
            <FilterRow
              label="Todas"
              active={selectedCategory === null}
              onClick={() => onSelectCategory(null)}
            />
            {categories.map((c) => (
              <FilterRow
                key={c.id}
                label={c.name}
                active={selectedCategory === c.id}
                onClick={() => onSelectCategory(selectedCategory === c.id ? null : c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Atributos dinámicos */}
      {attrFilters.map((f) => (
        <div key={f.name}>
          <p className="font-brand text-xs font-semibold text-brand-primary/50 uppercase tracking-wider mb-3">
            {f.name}
          </p>
          {f.values.every((v) => isColorValue(v)) ? (
            // Color swatches
            <div className="flex flex-wrap gap-2">
              {f.values.map((v) => (
                <button
                  key={v}
                  onClick={() => onToggleAttr(f.name, v)}
                  title={v}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedAttrs[f.name] === v
                      ? 'border-brand-primary scale-110 shadow-md'
                      : 'border-transparent hover:border-brand-primary/40'
                  }`}
                  style={{ backgroundColor: COLOR_HEX[v.toLowerCase()] ?? v }}
                />
              ))}
            </div>
          ) : (
            // Pills
            <div className="space-y-1.5">
              {f.values.map((v) => (
                <FilterRow
                  key={v}
                  label={v}
                  active={selectedAttrs[f.name] === v}
                  onClick={() => onToggleAttr(f.name, v)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FilterRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 font-brand text-sm px-3 py-2 rounded-xl transition-colors ${
        active
          ? 'bg-brand-primary text-brand-cream'
          : 'text-brand-primary hover:bg-brand-primary/5'
      }`}
    >
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
        active ? 'border-brand-cream bg-brand-cream' : 'border-brand-primary/20'
      }`}>
        {active && (
          <svg className="w-2.5 h-2.5 text-brand-primary" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ShopClient({ products, searchParams }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.categoria ? Number(searchParams.categoria) : null
  )
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
  const [sort, setSort] = useState('destacados')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Derive categories from products
  const categories = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach((p) => { if (p.category) map.set(p.category.id, p.category.name) })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [products])

  // Derive attribute filters from all active variants across all products
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
  const hasAnyFilters = categories.length > 1 || attrFilters.length > 0
  const activeFilterCount = (selectedCategory ? 1 : 0) + Object.values(selectedAttrs).filter(Boolean).length

  function clearFilters() {
    setSelectedCategory(null)
    setSelectedAttrs({})
  }

  function toggleAttr(opt: string, val: string) {
    setSelectedAttrs((prev) => ({ ...prev, [opt]: prev[opt] === val ? '' : val }))
  }

  const filterPanelProps: FilterPanelProps = {
    categories,
    attrFilters,
    selectedCategory,
    selectedAttrs,
    hasFilters,
    onSelectCategory: setSelectedCategory,
    onToggleAttr: toggleAttr,
    onClearFilters: clearFilters,
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-brand-primary text-section">Catálogo</h1>
            <p className="font-brand text-sm text-brand-primary/50 mt-1">
              {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
              {hasFilters && <span className="ml-1 text-brand-primary/40">filtrados</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile: filtros button */}
            {hasAnyFilters && (
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden relative font-brand text-sm border border-brand-primary/20 bg-white text-brand-primary rounded-full px-4 py-2 flex items-center gap-2 hover:border-brand-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75 2.25 2.25m0 0 2.25 2.25M15.75 12l2.25 2.25M12 20.25l2.25-2.25" />
                </svg>
                Filtros
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-brand-primary text-brand-cream text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="font-brand text-sm border border-brand-primary/20 rounded-full px-4 py-2 bg-white text-brand-primary focus:outline-none focus:border-brand-primary"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Main layout: sidebar + grid */}
        <div className="flex gap-8 items-start">

          {/* ── Desktop sidebar ── */}
          {hasAnyFilters && (
            <aside className="hidden lg:block w-56 shrink-0 sticky top-28 bg-white rounded-2xl shadow-sm p-5">
              <FilterPanel {...filterPanelProps} />
            </aside>
          )}

          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-brand text-brand-primary/40 text-xl mb-4">No hay productos con estos filtros.</p>
                <button onClick={clearFilters} className="font-brand text-sm text-brand-primary underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} fmt={fmt} addItem={addItem} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-brand font-semibold text-brand-primary">Filtros</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="font-brand text-sm text-brand-primary/40 hover:text-brand-primary"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <FilterPanel {...filterPanelProps} />
            </div>
            <div className="sticky bottom-0 border-t border-gray-100 p-4 bg-white">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full font-brand text-sm bg-brand-primary text-brand-cream py-3 rounded-xl hover:bg-brand-dark transition-colors"
              >
                Ver {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, fmt, addItem }: {
  product: ProductWithVariants
  fmt: (n: number) => string
  addItem: (item: CartItem) => void
}) {
  const image = product.images[0]
  const activeVariants = product.variants.filter((v) => v.active)
  const defaultVariant = activeVariants[0] ?? product.variants[0]
  const opts = getProductOptions(product)

  const prices = activeVariants.map((v) => v.price)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const hasMultiplePrices = minPrice !== maxPrice

  const colorOpt = opts.find((o) => o.toLowerCase().includes('color') || o.toLowerCase().includes('colour'))
  const colorValues = colorOpt
    ? [...new Set(activeVariants.map((v) => getVariantAttrs(v, opts)[colorOpt]).filter(Boolean))]
    : []

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
            {colorValues.length > 6 && (
              <span className="font-brand text-[10px] text-brand-primary/40">+{colorValues.length - 6}</span>
            )}
          </div>
        )}

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

        <div className="flex items-center justify-between mt-3">
          <div>
            {hasMultiplePrices && (
              <span className="font-brand text-[10px] text-brand-primary/40">Desde</span>
            )}
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
                  productId: product.id,
                  productSlug: product.slug,
                  productName: product.name,
                  variantLabel: getVariantLabel(defaultVariant, opts),
                  price: defaultVariant.price,
                  qty: 1,
                  imageUrl: image?.url,
                  weight: defaultVariant.weight ?? undefined,
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
