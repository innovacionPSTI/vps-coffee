'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ProductWithVariants } from '@vps/database'

const ROASTS = ['claro', 'medio', 'oscuro']
const WEIGHTS = ['250g', '500g', '1kg']
const METHODS = ['espresso', 'filtrado', 'cold_brew']
const SORTS = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
]

interface Props {
  products: ProductWithVariants[]
  searchParams: Record<string, string | string[] | undefined>
}

export default function ShopClient({ products, searchParams }: Props) {
  const [roast, setRoast] = useState<string | null>(
    (searchParams.tueste as string) ?? null
  )
  const [weight, setWeight] = useState<string | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const [sort, setSort] = useState('destacados')
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (roast && !p.variants.some((v) => v.roast === roast && v.active)) return false
      if (weight && !p.variants.some((v) => v.weight === weight && v.active)) return false
      if (method && !p.variants.some((v) => v.brew_method === method && v.active)) return false
      return true
    })

    if (sort === 'precio-asc') {
      list = [...list].sort((a, b) => {
        const pa = Math.min(...a.variants.map((v) => v.price))
        const pb = Math.min(...b.variants.map((v) => v.price))
        return pa - pb
      })
    } else if (sort === 'precio-desc') {
      list = [...list].sort((a, b) => {
        const pa = Math.min(...a.variants.map((v) => v.price))
        const pb = Math.min(...b.variants.map((v) => v.price))
        return pb - pa
      })
    } else {
      list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }

    return list
  }, [products, roast, weight, method, sort])

  function FilterBadge({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className={`rounded-full px-3 py-1 text-sm font-brand border transition-colors ${
          active
            ? 'bg-brand-primary text-brand-cream border-brand-primary'
            : 'bg-brand-yellow/30 text-brand-text border-brand-primary/20 hover:border-brand-primary'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="font-display text-brand-primary text-section">
            Nuestro Café
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-brand text-sm text-brand-primary/50">
              {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="font-brand text-sm border border-brand-primary/20 rounded-full px-4 py-2 bg-white text-brand-primary focus:outline-none focus:border-brand-primary"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-brand text-sm font-semibold text-brand-primary/60">Tueste:</span>
            {ROASTS.map((r) => (
              <FilterBadge
                key={r}
                label={r.charAt(0).toUpperCase() + r.slice(1)}
                active={roast === r}
                onClick={() => setRoast(roast === r ? null : r)}
              />
            ))}
          </div>
          <div className="w-px h-5 bg-brand-primary/10 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-brand text-sm font-semibold text-brand-primary/60">Peso:</span>
            {WEIGHTS.map((w) => (
              <FilterBadge
                key={w}
                label={w}
                active={weight === w}
                onClick={() => setWeight(weight === w ? null : w)}
              />
            ))}
          </div>
          <div className="w-px h-5 bg-brand-primary/10 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-brand text-sm font-semibold text-brand-primary/60">Método:</span>
            {METHODS.map((m) => (
              <FilterBadge
                key={m}
                label={m.replace('_', ' ')}
                active={method === m}
                onClick={() => setMethod(method === m ? null : m)}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-brand text-brand-primary/40 text-xl">
              No hay productos con estos filtros.
            </p>
            <button
              onClick={() => { setRoast(null); setWeight(null); setMethod(null) }}
              className="mt-4 font-brand text-sm text-brand-primary underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product) => {
              const defaultVariant = product.variants.find((v) => v.active) ?? product.variants[0]
              const image = product.images[0]
              return (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                  <Link href={`/tienda/${product.slug}`}>
                    <div className="relative h-60 bg-brand-cream overflow-hidden">
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.alt || product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-brand-primary/10 text-5xl">VPS</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[60%]" />
                    </div>
                  </Link>
                  <div className="p-5 pt-2">
                    <Link href={`/tienda/${product.slug}`}>
                      <p className="font-brand text-xs text-brand-primary/50 uppercase tracking-wider">
                        {product.category?.name ?? ''} · {defaultVariant?.weight ?? ''}
                      </p>
                      <h3 className="font-brand text-lg font-semibold text-brand-primary mt-0.5 group-hover:text-brand-dark transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-brand font-bold text-brand-primary">
                        {defaultVariant ? fmt(defaultVariant.price) : '—'}
                      </span>
                      <button
                        onClick={() => {
                          if (!defaultVariant) return
                          addItem({
                            variantId: defaultVariant.id,
                            productSlug: product.slug,
                            productName: product.name,
                            variantLabel: [defaultVariant.weight, defaultVariant.grind, defaultVariant.roast].filter(Boolean).join(' · '),
                            price: defaultVariant.price,
                            qty: 1,
                            imageUrl: image?.url,
                            weight: defaultVariant.weight ?? '500g',
                          })
                        }}
                        className="rounded-full border border-brand-primary text-brand-primary px-4 py-1.5 text-sm font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
