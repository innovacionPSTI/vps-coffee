'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { SectionItem } from '@vps/database'

interface HeroCarouselProps {
  items: SectionItem[]
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % items.length),
    [items.length]
  )
  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length)

  // Autoplay 5s
  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next, items.length])

  if (!items.length) {
    // Fallback si no hay slides en BD
    return (
      <section
        className="relative h-[100vh] min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{ background: '#614A2A' }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-hero font-display text-brand-cream leading-none mb-6">
            Café de<br />Especialidad
          </h1>
          <p className="font-brand text-brand-cream/80 text-xl mb-10">
            Trazabilidad completa desde el origen hasta tu taza
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/tienda" className="bg-brand-cream text-brand-primary rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-yellow transition-colors">
              Comprar ahora →
            </Link>
            <Link href="/nosotros" className="border border-brand-cream text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-cream/10 transition-colors">
              Conocer más
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const slide = items[current]
  const meta  = slide.metadata as Record<string, string> | null | undefined
  const bgColor = meta?.bg_color ?? '#614A2A'

  return (
    <section className="relative h-[100vh] min-h-[600px] flex items-center overflow-hidden">
      {/* Slides */}
      {items.map((item, i) => {
        const itemMeta = item.metadata as Record<string, string> | null | undefined
        const bg = itemMeta?.bg_color ?? '#614A2A'
        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {item.image_url ? (
              <>
                <picture className="w-full h-full">
                  {item.image_url_mobile && (
                    <source media="(max-width: 768px)" srcSet={item.image_url_mobile} />
                  )}
                  <img
                    src={item.image_url}
                    alt={item.title ?? ''}
                    className="w-full h-full object-cover"
                  />
                </picture>
                <div className="absolute inset-0 bg-brand-text/40" />
              </>
            ) : (
              <div className="w-full h-full" style={{ background: bg }} />
            )}
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <h1 className="text-hero font-display text-brand-cream leading-none mb-6">
            {slide.title}
          </h1>
          {slide.description && (
            <p className="font-brand text-brand-cream/80 text-xl mb-10">
              {slide.description}
            </p>
          )}
          <div className="flex gap-4 flex-wrap">
            {slide.cta_text && slide.link_url && (
              <Link
                href={slide.link_url}
                className="bg-brand-cream text-brand-primary rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-yellow transition-colors"
              >
                {slide.cta_text} →
              </Link>
            )}
            <Link
              href="/nosotros"
              className="border border-brand-cream text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-cream/10 transition-colors"
            >
              Conocer más
            </Link>
          </div>
        </div>
      </div>

      {/* Controles */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-brand-cream/10 hover:bg-brand-cream/20 rounded-full text-brand-cream transition-colors backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-brand-cream/10 hover:bg-brand-cream/20 rounded-full text-brand-cream transition-colors backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 h-2 bg-brand-cream'
                    : 'w-2 h-2 bg-brand-cream/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
