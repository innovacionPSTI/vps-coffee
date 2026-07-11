import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mis pedidos' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Preparando', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'En camino', color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default async function PedidosPage() {
  // TODO: const orders = await getOrdersByCustomer(userId)
  const orders: any[] = []

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/mi-cuenta" className="text-brand-primary/50 hover:text-brand-primary transition-colors">
            ← Mi cuenta
          </Link>
          <h1 className="font-display text-brand-primary text-3xl">Mis pedidos</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <div className="text-brand-primary/20 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="font-brand text-brand-primary/50 mb-4">Aún no tienes pedidos</p>
            <Link href="/tienda" className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-brand font-semibold text-brand-primary">{order.order_number}</p>
                    <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-brand text-xs font-semibold rounded-full px-3 py-1 ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="font-brand font-bold text-brand-primary">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.total)}
                    </span>
                    {order.tracking_number && (
                      <p className="font-brand text-xs text-brand-primary/50">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
