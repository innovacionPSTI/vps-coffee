'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ProductWithVariants } from '@vps/database'
import { getProductOptions, getVariantAttrs, getVariantLabel, COLOR_HEX } from '@/lib/variant-utils'

interface FeaturedProductsProps {
  products: ProductWithVariants[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <section className="bg-brand-cream py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-section font-display text-brand-primary">
            Productos Destacados
          </h2>
          <p className="font-brand text-brand-primary/60 mt-4 max-w-xl mx-auto">
            Descubre nuestra selección de productos. Calidad garantizada en cada artículo.
          </p>
          <Link
            href="/tienda"
            className="inline-block mt-6 border border-brand-primary text-brand-primary rounded-full px-6 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
          >
            Ver todos los productos →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const activeVariants = product.variants.filter((v) => v.active)
            const defaultVariant = activeVariants[0] ?? product.variants[0]
            const image = product.images[0]
            const opts = getProductOptions(product)

            const prices = activeVariants.map((v) => v.price)
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
            const hasMultiplePrices = minPrice !== maxPrice

            // Color swatches
            const colorOpt = opts.find((o) => o.toLowerCase().includes('color') || o.toLowerCase().includes('colour'))
            const colorValues = colorOpt
              ? [...new Set(activeVariants.map((v) => getVariantAttrs(v, opts)[colorOpt]).filter(Boolean))]
              : []

            // Chip option
            const chipOpt = opts.find((o) => o !== colorOpt)
            const chipValues = chipOpt
              ? [...new Set(activeVariants.map((v) => getVariantAttrs(v, opts)[chipOpt]).filter(Boolean))].slice(0, 3)
              : []

            const canQuickAdd = activeVariants.length === 1

            return (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
                {/* Image */}
                <Link href={`/tienda/${product.slug}`}>
                  <div className="relative overflow-hidden bg-brand-cream-warm h-64">
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
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[60%]" />
                  </div>
                </Link>

                <div className="p-6 pt-2">
                  <Link href={`/tienda/${product.slug}`}>
                    <p className="font-brand text-xs text-brand-primary/50 uppercase tracking-wider">
                      {product.category?.name ?? ''}
                    </p>
                    <h3 className="font-brand text-xl font-semibold text-brand-primary mt-1 group-hover:text-brand-dark transition-colors line-clamp-1">
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

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {hasMultiplePrices && (
                        <span className="font-brand text-[10px] text-brand-primary/40 block">Desde</span>
                      )}
                      <span className="font-brand font-bold text-brand-primary text-lg">
                        {defaultVariant ? fmt(minPrice) : '—'}
                      </span>
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
                        className="rounded-full border border-brand-primary text-brand-primary px-4 py-1.5 text-sm font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        Agregar
                      </button>
                    ) : (
                      <Link
                        href={`/tienda/${product.slug}`}
                        className="rounded-full border border-brand-primary text-brand-primary px-4 py-1.5 text-sm font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        Ver opciones
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
