'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ProductWithVariants, ProductVariant } from '@vps/database'

interface Props {
  product: ProductWithVariants
  related: ProductWithVariants[]
}

export default function ProductDetail({ product, related }: Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.find((v) => v.active) ?? null
  )
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Agrupar variantes por tipo
  const roasts = [...new Set(product.variants.filter(v => v.active && v.roast).map(v => v.roast!))]
  const weights = [...new Set(product.variants.filter(v => v.active && v.weight).map(v => v.weight!))]
  const grinds = [...new Set(product.variants.filter(v => v.active && v.grind).map(v => v.grind!))]

  function handleAddToCart() {
    if (!selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: [selectedVariant.weight, selectedVariant.grind, selectedVariant.roast].filter(Boolean).join(' · '),
      price: selectedVariant.price,
      qty,
      imageUrl: product.images[0]?.url,
      weight: selectedVariant.weight ?? '500g',
    })
  }

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="font-brand text-sm text-brand-primary/50 flex gap-2">
          <Link href="/" className="hover:text-brand-primary">Inicio</Link>
          <span>/</span>
          <Link href="/tienda" className="hover:text-brand-primary">Tienda</Link>
          <span>/</span>
          <span className="text-brand-primary">{product.name}</span>
        </nav>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Galería */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-brand-cream-warm mb-4">
              {product.images[selectedImage]?.url ? (
                <img
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-brand-primary/10 text-8xl">VPS</span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-brand-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-brand text-sm text-brand-primary/50 uppercase tracking-wider mb-1">
              VPS Coffee Roasting House
            </p>
            <h1 className="font-display text-brand-primary leading-none mb-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              {product.name}
            </h1>

            {/* Atributos del café */}
            {product.description && (
              <p className="font-brand text-brand-primary/70 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <hr className="border-brand-primary/10 mb-6" />

            {/* Selector de variantes */}
            {roasts.length > 0 && (
              <div className="mb-4">
                <p className="font-brand text-sm font-semibold text-brand-primary mb-2">Tueste:</p>
                <div className="flex gap-2 flex-wrap">
                  {roasts.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        const v = product.variants.find(
                          (v) => v.roast === r && v.active && (!selectedVariant?.weight || v.weight === selectedVariant.weight)
                        )
                        if (v) setSelectedVariant(v)
                      }}
                      className={`rounded-full px-4 py-1.5 text-sm font-brand border transition-colors ${
                        selectedVariant?.roast === r
                          ? 'bg-brand-primary text-brand-cream border-brand-primary'
                          : 'border-brand-primary/30 text-brand-primary hover:border-brand-primary'
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {weights.length > 0 && (
              <div className="mb-4">
                <p className="font-brand text-sm font-semibold text-brand-primary mb-2">Peso:</p>
                <div className="flex gap-2 flex-wrap">
                  {weights.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        const v = product.variants.find(
                          (v) => v.weight === w && v.active && (!selectedVariant?.roast || v.roast === selectedVariant.roast)
                        )
                        if (v) setSelectedVariant(v)
                      }}
                      className={`rounded-full px-4 py-1.5 text-sm font-brand border transition-colors ${
                        selectedVariant?.weight === w
                          ? 'bg-brand-primary text-brand-cream border-brand-primary'
                          : 'border-brand-primary/30 text-brand-primary hover:border-brand-primary'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {grinds.length > 0 && (
              <div className="mb-6">
                <p className="font-brand text-sm font-semibold text-brand-primary mb-2">Molienda:</p>
                <div className="flex gap-2 flex-wrap">
                  {grinds.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        const v = product.variants.find(
                          (v) => v.grind === g && v.active
                        )
                        if (v) setSelectedVariant(v)
                      }}
                      className={`rounded-full px-4 py-1.5 text-sm font-brand border transition-colors ${
                        selectedVariant?.grind === g
                          ? 'bg-brand-primary text-brand-cream border-brand-primary'
                          : 'border-brand-primary/30 text-brand-primary hover:border-brand-primary'
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-brand-primary/10 mb-6" />

            {/* Precio */}
            <p className="font-brand font-bold text-brand-primary text-3xl mb-6">
              {selectedVariant ? fmt(selectedVariant.price) : '—'}
            </p>

            {/* Cantidad */}
            <div className="flex items-center gap-4 mb-6">
              <p className="font-brand text-sm font-semibold text-brand-primary">Cantidad:</p>
              <div className="flex items-center gap-3 border border-brand-primary/20 rounded-full px-4 py-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-brand-primary font-bold text-lg leading-none"
                >
                  −
                </button>
                <span className="font-brand font-semibold text-brand-primary w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="text-brand-primary font-bold text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant}
                className="w-full bg-brand-primary text-brand-cream rounded-full py-4 font-brand font-medium hover:bg-brand-dark transition-colors disabled:opacity-40"
              >
                Agregar al carrito
              </button>
              <Link
                href="/checkout"
                onClick={handleAddToCart}
                className="w-full text-center border border-brand-primary text-brand-primary rounded-full py-4 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors"
              >
                Comprar ahora
              </Link>
            </div>

            {/* Badges de confianza */}
            <div className="flex flex-col gap-2">
              {[
                '🚚 Envío gratis en compras mayores a $100.000',
                '✓ Tueste artesanal garantizado',
                '↩ Devoluciones en 30 días',
              ].map((text) => (
                <p key={text} className="font-brand text-sm text-brand-primary/60">{text}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-brand-primary text-section mb-8">
              También te puede gustar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => {
                const v = p.variants.find((v) => v.active)
                return (
                  <Link key={p.id} href={`/tienda/${p.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                    <div className="h-48 bg-brand-cream overflow-hidden">
                      {p.images[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-brand-primary/10 text-4xl">VPS</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-brand font-semibold text-brand-primary">{p.name}</p>
                      <p className="font-brand font-bold text-brand-primary mt-1">{v ? fmt(v.price) : ''}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
