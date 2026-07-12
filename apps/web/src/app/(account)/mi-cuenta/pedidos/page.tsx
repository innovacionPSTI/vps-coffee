import type { Metadata } from 'next'
import Link from 'next/link'
import { stackServerApp } from '@/stack'
import { getOrdersByCustomerEmail } from '@vps/database'

export const metadata: Metadata = { title: 'Mis pedidos' }

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-400' },
  processing: { label: 'Preparando', color: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-400' },
  shipped:    { label: 'En camino',  color: 'bg-violet-50 text-violet-700', dot: 'bg-violet-400' },
  delivered:  { label: 'Entregado',  color: 'bg-green-50 text-green-700',   dot: 'bg-green-400' },
  cancelled:  { label: 'Cancelado',  color: 'bg-red-50 text-red-600',       dot: 'bg-red-400' },
}

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export default async function PedidosPage() {
  const user = await stackServerApp.getUser()
  const email = user?.primaryEmail ?? ''
  const orders = email ? await getOrdersByCustomerEmail(email).catch(() => []) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-brand-primary text-3xl lg:text-4xl">Mis pedidos</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          {orders.length > 0
            ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en tu historial`
            : 'Tu historial de compras aparecerá aquí'}
        </p>
      </div>

      {orders.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-primary/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="font-brand font-semibold text-brand-primary mb-1">Aún no tienes pedidos</p>
          <p className="font-brand text-sm text-brand-primary/50 mb-6">
            Explora nuestro catálogo y encuentra tu café ideal
          </p>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors"
          >
            Ir a la tienda
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS[order.status] ?? { label: order.status, color: 'bg-gray-50 text-gray-600', dot: 'bg-gray-400' }

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Fila principal */}
                <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  {/* Número + fecha */}
                  <div>
                    <p className="font-brand font-semibold text-brand-primary tracking-wide">
                      {order.order_number}
                    </p>
                    <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Estado + total */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 font-brand text-xs font-medium rounded-full px-3 py-1 ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <span className="font-brand font-bold text-brand-primary tabular-nums">
                      {COP.format(order.total)}
                    </span>
                  </div>
                </div>

                {/* Tracking (solo si existe) */}
                {order.tracking_number && (
                  <div className="px-5 py-3 bg-brand-cream/50 border-t border-brand-primary/6 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-brand-primary/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2m8-12h3l3 4v4h-2m-4 0H9" />
                    </svg>
                    <p className="font-brand text-xs text-brand-primary/50">
                      Guía:{' '}
                      <span className="font-semibold text-brand-primary font-mono">
                        {order.tracking_number}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
