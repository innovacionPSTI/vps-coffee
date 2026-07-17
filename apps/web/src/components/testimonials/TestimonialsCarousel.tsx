'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SectionItem } from '@vps/database'

const STARS = [1, 2, 3, 4, 5]
const AUTO_ADVANCE_MS = 5000

interface Props {
  items: SectionItem[]
}

export default function TestimonialsCarousel({ items }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const total = items.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total)
  }, [total])

  const prev = () => setCurrent((c) => (c - 1 + total) % total)

  useEffect(() => {
    if (paused || total <= 1) return
    const id = setInterval(next, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [paused, total, next])

  if (total === 0) return null

  // Show up to 3 visible cards centered on `current`
  const visibleCount = Math.min(total, 3)
  const indices = Array.from({ length: visibleCount }, (_, i) => (current + i) % total)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {indices.map((idx, pos) => {
          const item   = items[idx]
          const meta   = item.metadata as Record<string, unknown> | null | undefined
          const rating = typeof meta?.rating === 'number' ? meta.rating : 5
          const role   = typeof meta?.role   === 'string' ? meta.role   : null
          const isCenter = pos === 0 || visibleCount === 1
          return (
            <div
              key={item.id}
              className={`bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 transition-all duration-300 ${
                isCenter ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
              }`}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {STARS.map((s) => (
                  <span key={s} className={`text-lg ${s <= rating ? 'text-amber-400' : 'text-white/20'}`}>★</span>
                ))}
              </div>

              {/* Content */}
              <p className="font-brand text-brand-cream/90 text-sm leading-relaxed mb-6 line-clamp-5">
                &ldquo;{item.description ?? ''}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.title ?? ''}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-cream/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-cream/20 flex items-center justify-center font-brand font-semibold text-brand-cream text-sm flex-shrink-0">
                    {(item.title ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-brand text-sm font-semibold text-brand-cream">{item.title}</p>
                  {role && (
                    <p className="font-brand text-xs text-brand-cream/50">{role}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-brand-cream/20 text-brand-cream/60 hover:text-brand-cream hover:border-brand-cream/60 transition-colors flex items-center justify-center"
            aria-label="Anterior"
          >
            ‹
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${
                  i === current
                    ? 'w-6 h-2 bg-brand-cream'
                    : 'w-2 h-2 bg-brand-cream/30 hover:bg-brand-cream/60'
                }`}
                aria-label={`Ir a testimonio ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-brand-cream/20 text-brand-cream/60 hover:text-brand-cream hover:border-brand-cream/60 transition-colors flex items-center justify-center"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
