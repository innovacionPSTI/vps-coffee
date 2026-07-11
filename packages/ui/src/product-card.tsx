import * as React from 'react'
import { cn } from './cn'

interface ProductCardProps {
  name: string
  origin?: string
  roast?: string
  price: number
  imageUrl?: string
  slug: string
  className?: string
  onAddToCart?: () => void
}

export function ProductCard({
  name,
  origin,
  roast,
  price,
  imageUrl,
  slug,
  className,
  onAddToCart,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price)

  return (
    <div
      className={cn(
        'group flex flex-col bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300',
        className
      )}
    >
      {/* Imagen en arco estilo Pergamino */}
      <div className="relative overflow-hidden bg-brand-cream h-56">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-primary/20">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l1.65-3.8A9 9 0 1 1 11 21H2zm9-2a7 7 0 1 0-5.1-2.2L5 19h6z"/>
            </svg>
          </div>
        )}
        {/* Arco decorativo */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-[50%]" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 pt-2 gap-3">
        <div>
          <p className="font-brand text-sm text-brand-primary/60">
            {[origin, roast].filter(Boolean).join(' · ')}
          </p>
          <h3 className="font-brand text-card font-semibold text-brand-primary mt-0.5 leading-tight">
            {name}
          </h3>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="font-brand font-bold text-brand-primary text-lg">
            {formattedPrice}
          </span>
          <button
            onClick={onAddToCart}
            className="rounded-full border border-brand-primary text-brand-primary px-4 py-1.5 text-sm font-brand hover:bg-brand-primary hover:text-brand-cream transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}
