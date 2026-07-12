'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ProductWithVariants } from '@vps/database'

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
            const defaultVariant = product.variants.find((v) => v.active) ?? product.variants[0]
            const image = product.images[0]

            return (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
                {/* Imagen arch */}
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
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-white rounded-t-[60%]" />
                  </div>
                </Link>

                <div className="p-6 pt-2">
                  <Link href={`/tienda/${product.slug}`}>
                    <p className="font-brand text-xs text-brand-primary/50 uppercase tracking-wider">
                      {product.category?.name ?? 'Sin categoría'}
                    </p>
                    <h3 className="font-brand text-xl font-semibold text-brand-primary mt-1 group-hover:text-brand-dark transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-brand font-bold text-brand-primary text-lg">
                      {defaultVariant ? fmt(defaultVariant.price) : '—'}
                    </span>
                    <button
                      onClick={() => {
                        if (!defaultVariant) return
                        addItem({
                          variantId: defaultVariant.id,
                          productSlug: product.slug,
                          productName: product.name,
                          variantLabel: [defaultVariant.weight, defaultVariant.grind, defaultVariant.roast]
                            .filter(Boolean)
                            .join(' · '),
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
      </div>
    </section>
  )
}
