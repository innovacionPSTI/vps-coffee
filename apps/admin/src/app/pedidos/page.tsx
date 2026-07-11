import { createServerClient } from '@vps/database'
import type { OrderStatus } from '@vps/database'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pedidos' }
export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  exception:  { label: 'Inconveniente', color: 'bg-orange-100 text-orange-700' },
}

export default async function PedidosAdminPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  const supabase = createServerClient()
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.status) {
    query = query.eq('status', searchParams.status as OrderStatus)
  }

  const { data: orders } = await query

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Pedidos</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/pedidos"
          className={`font-brand text-sm rounded-full px-4 py-1.5 border transition-colors ${!searchParams.status ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-gray-200 text-brand-primary/60 hover:border-brand-primary'}`}
        >
          Todos
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <Link
            key={key}
            href={`/pedidos?status=${key}`}
            className={`font-brand text-sm rounded-full px-4 py-1.5 border transition-colors ${searchParams.status === key ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-gray-200 text-brand-primary/60 hover:border-brand-primary'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['#', 'Cliente', 'Fecha', 'Total', 'Estado', 'Tracking', 'Acción'].map((h) => (
                <th key={h} className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-4 py-3 first:pl-6 last:pr-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!orders?.length ? (
              <tr>
                <td colSpan={7} className="font-brand text-brand-primary/40 text-center py-12">
                  No hay pedidos
                </td>
              </tr>
            ) : (
              orders.map((order: any) => {
                const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 pl-6">
                      <Link href={`/pedidos/${order.id}`} className="font-brand font-semibold text-brand-primary text-sm hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-brand text-sm text-brand-primary">{order.customer_name}</p>
                      <p className="font-brand text-xs text-brand-primary/40">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/50">
                      {new Date(order.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 font-brand font-bold text-brand-primary text-sm">
                      {fmt(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-brand text-xs font-semibold rounded-full px-3 py-1 ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-brand text-xs text-brand-primary/50">
                      {order.tracking_number ?? '—'}
                    </td>
                    <td className="px-4 py-3 pr-6">
                      <Link
                        href={`/pedidos/${order.id}`}
                        className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-full px-3 py-1 hover:bg-brand-primary hover:text-brand-cream transition-colors"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
