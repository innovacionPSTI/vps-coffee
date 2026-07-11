'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cart'

export default function CarritoPage() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCartStore()

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const shippingCost = subtotal() >= 100_000 ? 0 : 8_000
  const total = subtotal() + shippingCost

  if (items.length === 0) {
    return (
      <div className="bg-brand-cream min-h-screen pt-20 flex flex-col items-center justify-center gap-6">
        <div className="text-brand-primary/20">
          <svg className="w-24 h-24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="font-display text-brand-primary text-3xl">Tu carrito está vacío</h1>
        <p className="font-brand text-brand-primary/50">Agrega algunos cafés para continuar</p>
        <Link href="/tienda" className="bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors">
          Explorar tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-brand-primary text-section mb-10">Mi Carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="bg-white rounded-2xl p-5 shadow-sm flex gap-5">
                <div className="w-20 h-20 rounded-xl bg-brand-cream flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-yellow/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-brand font-semibold text-brand-primary">{item.productName}</p>
                  <p className="font-brand text-xs text-brand-primary/50 mt-0.5">{item.variantLabel}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-brand font-bold text-brand-primary">{fmt(item.price * item.qty)}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-brand-primary/20 rounded-full px-3 py-1">
                        <button onClick={() => updateQty(item.variantId, item.qty - 1)} className="text-brand-primary font-bold">−</button>
                        <span className="font-brand text-sm w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.variantId, item.qty + 1)} className="text-brand-primary font-bold">+</button>
                      </div>
                      <button onClick={() => removeItem(item.variantId)} className="text-brand-primary/30 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2">
              <Link href="/tienda" className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary transition-colors">
                ← Seguir comprando
              </Link>
              <button onClick={clearCart} className="font-brand text-sm text-red-400 hover:text-red-600 transition-colors">
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit sticky top-24">
            <h2 className="font-brand font-semibold text-brand-primary text-lg mb-5">Resumen del pedido</h2>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between font-brand text-sm">
                <span className="text-brand-primary/60">Subtotal</span>
                <span className="text-brand-primary font-medium">{fmt(subtotal())}</span>
              </div>
              <div className="flex justify-between font-brand text-sm">
                <span className="text-brand-primary/60">Envío</span>
                <span className="text-brand-primary font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : fmt(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="font-brand text-xs text-brand-primary/40">
                  Envío gratis en compras +$100.000
                </p>
              )}
              <hr className="border-brand-primary/10" />
              <div className="flex justify-between font-brand font-bold text-brand-primary text-lg">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* Cupón */}
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="Código de cupón"
                className="flex-1 border border-brand-primary/20 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
              <button className="border border-brand-primary text-brand-primary rounded-xl px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors">
                Aplicar
              </button>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-brand-primary text-brand-cream rounded-full py-3.5 font-brand font-medium hover:bg-brand-dark transition-colors"
            >
              Proceder al pago
            </Link>

            <div className="mt-4 flex flex-col gap-1">
              <p className="font-brand text-xs text-brand-primary/40 text-center">🔒 Pago seguro</p>
              <div className="flex justify-center gap-3 mt-1">
                <span className="font-brand text-xs text-brand-primary/40">Wompi</span>
                <span className="font-brand text-xs text-brand-primary/40">·</span>
                <span className="font-brand text-xs text-brand-primary/40">MercadoPago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
