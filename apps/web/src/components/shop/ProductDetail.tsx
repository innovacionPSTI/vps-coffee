'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { ProductWithVariants, TrustBadge } from '@vps/database'
import { getProductOptions, getVariantAttrs, getVariantLabel, isColorValue, COLOR_HEX } from '@/lib/variant-utils'

interface Props {
  product: ProductWithVariants
  related: ProductWithVariants[]
  /** Badges de confianza configurados en admin → Configuración → General. Solo se pasan los activos. */
  trustBadges?: TrustBadge[]
}

export default function ProductDetail({ product, related, trustBadges = [] }: Props) {
  const variantOpts = getProductOptions(product)
  const activeVariants = product.variants.filter((v) => v.active)

  // Initialize selected attrs.
  //
  // Starting with ALL attrs from V1 is too restrictive: for a product whose
  // variants don't form a full cartesian matrix (e.g. V1={Color:Rojo,Talla:S},
  // V2={Color:Azul,Talla:M}), pre-selecting V1 would make Color:Azul AND
  // Talla:M both appear blocked because neither pairing with the OTHER V1 attr
  // exists. Instead:
  //   • 1 active variant → pre-select all (nothing to choose).
  //   • Multi-variant → only pre-select dims that have exactly 1 unique value
  //     across all active variants (there's genuinely no choice for those).
  //     All other dims start empty; isValueAvailable then correctly shows every
  //     option as reachable.
  const initAttrs = (): Record<string, string> => {
    if (activeVariants.length === 1) {
      return getVariantAttrs(activeVariants[0], variantOpts)
    }
    const init: Record<string, string> = {}
    for (const opt of variantOpts) {
      const uniqueVals = [
        ...new Set(
          activeVariants.map((v) => getVariantAttrs(v, variantOpts)[opt]).filter(Boolean)
        ),
      ]
      if (uniqueVals.length === 1) init[opt] = uniqueVals[0]
    }
    return init
  }

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(initAttrs)
  const [qty, setQty] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Values for each option, in the order they first appear across active variants
  const optionValues = useMemo<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {}
    for (const opt of variantOpts) {
      const seen: string[] = []
      for (const v of activeVariants) {
        const val = getVariantAttrs(v, variantOpts)[opt]
        if (val && !seen.includes(val)) seen.push(val)
      }
      result[opt] = seen
    }
    return result
  }, [product.variants, variantOpts])

  // The fully-matched variant for current selections
  const selectedVariant = useMemo(() => {
    return activeVariants.find((v) => {
      const attrs = getVariantAttrs(v, variantOpts)
      return variantOpts.every((opt) => attrs[opt] === selectedAttrs[opt])
    }) ?? null
  }, [selectedAttrs, product.variants, variantOpts])

  // Is a specific value still available given the OTHER currently-selected attrs?
  function isValueAvailable(opt: string, value: string): boolean {
    const test = { ...selectedAttrs, [opt]: value }
    return activeVariants.some((v) => {
      const attrs = getVariantAttrs(v, variantOpts)
      return variantOpts.every((o) => !test[o] || attrs[o] === test[o])
    })
  }

  // Available values for an option given remaining selected attrs (excluding that option)
  const getAvailableValues = useCallback((opt: string, attrs: Record<string, string>): string[] => {
    const others = { ...attrs }
    delete others[opt]
    return (optionValues[opt] ?? []).filter((val) =>
      activeVariants.some((v) => {
        const vAttrs = getVariantAttrs(v, variantOpts)
        return vAttrs[opt] === val &&
          Object.entries(others).every(([o, ov]) => !ov || vAttrs[o] === ov)
      })
    )
  }, [activeVariants, optionValues, variantOpts])

  // Select an attribute value with cascading auto-resolution
  function handleSelectAttr(opt: string, val: string) {
    setSelectedAttrs((prev) => {
      if (prev[opt] === val) return prev  // no change

      const next: Record<string, string> = { ...prev, [opt]: val }

      // Clear any other attr whose current value is no longer compatible.
      // Iterate variantOpts explicitly — never Object.entries(next) — so that
      // non-option fields (sku, notes, etc.) don't corrupt the compatibility check.
      for (const o of variantOpts) {
        if (o === opt) continue
        const cur = next[o]
        if (!cur) continue
        const stillOk = activeVariants.some((v) => {
          const attrs = getVariantAttrs(v, variantOpts)
          return variantOpts.every((k) => !next[k] || attrs[k] === next[k])
        })
        if (!stillOk) delete next[o]
      }

      // Auto-select attrs that have only one available value
      let changed = true
      while (changed) {
        changed = false
        for (const o of variantOpts) {
          if (next[o]) continue
          const avail = getAvailableValues(o, next)
          if (avail.length === 1) {
            next[o] = avail[0]
            changed = true
          }
        }
      }

      return next
    })
  }

  const isFullySelected = variantOpts.every((o) => selectedAttrs[o])
  const missingAttrs = variantOpts.filter((o) => !selectedAttrs[o])

  // Price display: show selected variant price, or a range if not fully selected
  const priceDisplay = useMemo(() => {
    if (selectedVariant) return fmt(selectedVariant.price)
    const prices = activeVariants.map((v) => v.price)
    if (prices.length === 0) return '—'
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? fmt(min) : `Desde ${fmt(min)}`
  }, [selectedVariant, activeVariants])

  const stockWarning =
    selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5
      ? `Solo quedan ${selectedVariant.stock} unidades`
      : null
  const isOutOfStock = selectedVariant && selectedVariant.stock === 0

  function handleAddToCart() {
    if (!selectedVariant || isOutOfStock) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantLabel: getVariantLabel(selectedVariant, variantOpts),
      price: selectedVariant.price,
      qty,
      imageUrl: product.images[0]?.url,
      weight: selectedVariant.weight ?? undefined,
      weight_kg: selectedVariant.weight_kg ?? null,
      length_cm: selectedVariant.length_cm ?? null,
      width_cm:  selectedVariant.width_cm  ?? null,
      height_cm: selectedVariant.height_cm ?? null,
    })
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
  }

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="font-brand text-sm text-brand-primary/50 flex gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/tienda" className="hover:text-brand-primary transition-colors">Tienda</Link>
          <span>/</span>
          <span className="text-brand-primary">{product.name}</span>
        </nav>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* ── Galería ─────────────────────────────────────────── */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-brand-cream-warm mb-4 shadow-card">
              {product.images[selectedImage]?.url ? (
                <img
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt ?? product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display text-brand-primary/10 text-8xl">▲</span>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === selectedImage
                        ? 'border-brand-primary shadow-sm'
                        : 'border-transparent hover:border-brand-primary/40'
                    }`}
                  >
                    <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info & selección ─────────────────────────────────── */}
          <div className="flex flex-col">
            {/* Categoría + nombre */}
            <p className="font-brand text-sm text-brand-primary/50 uppercase tracking-wider mb-1">
              {product.category?.name ?? ''}
            </p>
            <h1
              className="font-display text-brand-primary leading-none mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              {product.name}
            </h1>

            {product.description && (
              <p className="font-brand text-brand-primary/70 text-sm leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <hr className="border-brand-primary/10 mb-6" />

            {/* ── Selectores de variante ──────────────────────────── */}
            {variantOpts.length > 0 && (
              <div className="space-y-5 mb-6">
                {variantOpts.map((opt) => {
                  const values = optionValues[opt] ?? []
                  if (values.length === 0) return null
                  const currentVal = selectedAttrs[opt]
                  const allColor = values.every((v) => isColorValue(v))

                  return (
                    <div key={opt}>
                      {/* Label con valor seleccionado inline */}
                      <div className="flex items-baseline gap-2 mb-2.5">
                        <span className="font-brand text-sm font-semibold text-brand-primary">
                          {opt}
                        </span>
                        {currentVal ? (
                          <span className="font-brand text-sm text-brand-primary/60">
                            — {currentVal}
                          </span>
                        ) : (
                          <span className="font-brand text-xs text-amber-600 font-medium">
                            · Selecciona una opción
                          </span>
                        )}
                      </div>

                      {/* Pills o swatches */}
                      <div className="flex gap-2 flex-wrap">
                        {values.map((val) => {
                          const available = isValueAvailable(opt, val)
                          const selected = currentVal === val

                          if (allColor) {
                            const hex = COLOR_HEX[val.toLowerCase()] ?? val
                            return (
                              <button
                                key={val}
                                title={val}
                                onClick={() => handleSelectAttr(opt, val)}
                                aria-label={`${opt}: ${val}`}
                                aria-pressed={selected}
                                className={`w-9 h-9 rounded-full border-2 transition-all ${
                                  selected
                                    ? 'border-brand-primary scale-110 shadow-md'
                                    : available
                                      ? 'border-transparent hover:border-brand-primary/50 hover:scale-105'
                                      : 'border-transparent opacity-40 hover:opacity-70 hover:scale-105'
                                }`}
                                style={{ backgroundColor: hex }}
                              />
                            )
                          }

                          return (
                            <button
                              key={val}
                              onClick={() => handleSelectAttr(opt, val)}
                              aria-pressed={selected}
                              className={`
                                relative rounded-full px-4 py-2 text-sm font-brand border transition-all
                                min-h-[2.25rem] min-w-[3rem]
                                ${selected
                                  ? 'bg-brand-primary text-brand-cream border-brand-primary shadow-sm'
                                  : available
                                    ? 'border-brand-primary/30 text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5'
                                    : 'border-brand-primary/10 text-brand-primary/30 hover:border-brand-primary/30 hover:text-brand-primary/50'
                                }
                              `}
                            >
                              {!available && !selected && (
                                <span
                                  aria-hidden
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                  <span className="absolute w-full h-px bg-brand-primary/15 rotate-[-12deg]" />
                                </span>
                              )}
                              {val}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Resumen de selección actual */}
            {variantOpts.length > 0 && (
              <div className="mb-6">
                {isFullySelected && selectedVariant ? (
                  <p className="font-brand text-xs text-brand-primary/40">
                    {getVariantLabel(selectedVariant, variantOpts)}
                    {selectedVariant.sku ? ` · SKU ${selectedVariant.sku}` : ''}
                  </p>
                ) : missingAttrs.length > 0 ? (
                  <p className="font-brand text-xs text-amber-600/80">
                    Selecciona: {missingAttrs.join(', ')}
                  </p>
                ) : null}
              </div>
            )}

            <hr className="border-brand-primary/10 mb-6" />

            {/* Precio */}
            <p className="font-brand font-bold text-brand-primary text-3xl mb-1">
              {priceDisplay}
            </p>
            {stockWarning && (
              <p className="font-brand text-xs text-amber-600 mb-4">{stockWarning}</p>
            )}
            {isOutOfStock && (
              <p className="font-brand text-xs text-red-500 mb-4">Sin stock disponible</p>
            )}
            {!stockWarning && !isOutOfStock && <div className="mb-6" />}

            {/* Cantidad */}
            <div className="flex items-center gap-4 mb-6">
              <p className="font-brand text-sm font-semibold text-brand-primary">Cantidad</p>
              <div className="flex items-center gap-3 border border-brand-primary/20 rounded-full px-4 py-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  aria-label="Reducir cantidad"
                  className="text-brand-primary font-bold text-lg leading-none w-5 flex items-center justify-center"
                >
                  −
                </button>
                <span className="font-brand font-semibold text-brand-primary w-6 text-center select-none">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  aria-label="Aumentar cantidad"
                  className="text-brand-primary font-bold text-lg leading-none w-5 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!isFullySelected || !!isOutOfStock}
                className={`w-full rounded-full py-4 font-brand font-medium transition-all ${
                  addedFeedback
                    ? 'bg-green-600 text-white'
                    : 'bg-brand-primary text-brand-cream hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {addedFeedback
                  ? '✓ Agregado al carrito'
                  : isOutOfStock
                    ? 'Sin stock'
                    : !isFullySelected
                      ? `Selecciona ${missingAttrs[0] ?? 'una opción'}`
                      : 'Agregar al carrito'}
              </button>
              <Link
                href="/checkout"
                onClick={handleAddToCart}
                className={`w-full text-center border border-brand-primary text-brand-primary rounded-full py-4 font-brand font-medium transition-colors ${
                  isFullySelected && !isOutOfStock
                    ? 'hover:bg-brand-primary hover:text-brand-cream'
                    : 'opacity-40 pointer-events-none'
                }`}
              >
                Comprar ahora
              </Link>
            </div>

            {/* Badges de confianza — configurados en admin → Configuración → General */}
            {trustBadges.length > 0 && (
              <div className="flex flex-col gap-2">
                {trustBadges.map((badge) => (
                  <p key={badge.text} className="font-brand text-sm text-brand-primary/60">
                    {badge.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Productos relacionados ──────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-brand-primary text-section mb-8">
              También te puede gustar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => {
                const relatedOpts = getProductOptions(p)
                const prices = p.variants.filter((pv) => pv.active).map((pv) => pv.price)
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                const hasRange = prices.length > 1 && Math.max(...prices) !== minPrice
                const firstVariant = p.variants.find((v) => v.active)
                return (
                  <Link
                    key={p.id}
                    href={`/tienda/${p.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="h-48 bg-brand-cream overflow-hidden">
                      {p.images[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-brand-primary/10 text-4xl">▲</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-brand font-semibold text-brand-primary">{p.name}</p>
                      {prices.length > 0 && (
                        <p className="font-brand font-bold text-brand-primary mt-1">
                          {hasRange ? 'Desde ' : ''}{fmt(minPrice)}
                        </p>
                      )}
                      {firstVariant && (
                        <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
                          {getVariantLabel(firstVariant, relatedOpts)}
                        </p>
                      )}
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
