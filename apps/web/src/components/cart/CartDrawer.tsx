'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQty, subtotal } = useCartStore()

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-brand-text/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-brand-cream shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/10">
          <h2 className="font-display text-brand-primary text-2xl">
            Mi Carrito
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-brand-primary/60 hover:text-brand-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-brand-primary/40">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-brand text-sm">Tu carrito está vacío</p>
              <button onClick={onClose} className="font-brand text-sm text-brand-primary underline">
                Explorar tienda
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 bg-white rounded-xl p-4 shadow-sm"
              >
                {/* Imagen */}
                <div className="w-16 h-16 rounded-lg bg-brand-cream flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-yellow/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-brand font-semibold text-brand-primary text-sm truncate">
                    {item.productName}
                  </p>
                  <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
                    {item.variantLabel}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-brand font-bold text-brand-primary">
                      {fmt(item.price * item.qty)}
                    </span>
                    {/* Qty */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.variantId, item.qty - 1)}
                        className="w-6 h-6 rounded-full border border-brand-primary/30 text-brand-primary flex items-center justify-center text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        −
                      </button>
                      <span className="font-brand text-sm w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.variantId, item.qty + 1)}
                        className="w-6 h-6 rounded-full border border-brand-primary/30 text-brand-primary flex items-center justify-center text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="self-start p-1 text-brand-primary/30 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-brand-primary/10 space-y-3 bg-brand-cream">
            <div className="flex justify-between font-brand">
              <span className="text-brand-primary/60">Subtotal</span>
              <span className="font-bold text-brand-primary">{fmt(subtotal())}</span>
            </div>
            <p className="font-brand text-xs text-brand-primary/40">
              Envío calculado en el checkout
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full text-center bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium hover:bg-brand-dark transition-colors"
            >
              Proceder al pago
            </Link>
            <Link
              href="/carrito"
              onClick={onClose}
              className="block w-full text-center border border-brand-primary text-brand-primary rounded-full py-3 font-brand font-medium hover:bg-brand-primary hover:text-brand-cream transition-colors"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
