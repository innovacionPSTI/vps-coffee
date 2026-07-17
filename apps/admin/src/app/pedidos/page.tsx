import { createServerClient } from '@vps/database'
import type { OrderStatus } from '@vps/database'
import Link from 'next/link'
import type { Metadata } from 'next'
import PickupModal from '@/components/pedidos/PickupModal'
import PedidosSearch from './PedidosSearch'

export const metadata: Metadata = { title: 'Pedidos' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',    color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Procesando',   color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado',      color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',    color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado',    color: 'bg-red-100 text-red-700' },
  exception:  { label: 'Inconveniente',color: 'bg-orange-100 text-orange-700' },
}

export default async function PedidosAdminPage({
  searchParams,
}: {
  // Next.js 15/16: searchParams es un Promise
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const status  = sp.status as OrderStatus | undefined
  const q       = sp.q?.trim() ?? ''
  const page    = Math.max(1, Number(sp.page ?? 1))
  const offset  = (page - 1) * PAGE_SIZE

  const supabase = createServerClient()

  // ── Consulta principal ────────────────────────────────────────────────────
  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, total, status, tracking_number, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  // Búsqueda: order_number, customer_name o customer_email
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
    )
  }

  const { data: orders, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Pickup modal: pedidos enviados con guía Skydropx
  const { data: shippedOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, skydropx_shipment_id, tracking_number')
    .eq('status', 'shipped')
    .not('skydropx_shipment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  // Construye URL para los filtros conservando los demás params
  function filterHref(params: Record<string, string | undefined>) {
    const merged = { status, q: q || undefined, ...params }
    const qs = Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join('&')
    return `/pedidos${qs ? '?' + qs : ''}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-brand-primary text-3xl">Pedidos</h1>
        <PickupModal shippedOrders={(shippedOrders ?? []) as unknown as Parameters<typeof PickupModal>[0]['shippedOrders']} />
      </div>

      {/* Búsqueda */}
      <PedidosSearch defaultQ={q} />

      {/* Filtros de estado */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href={filterHref({ status: undefined, page: undefined })}
          className={`font-brand text-sm rounded-full px-4 py-1.5 border transition-colors ${!status ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-gray-200 text-brand-primary/60 hover:border-brand-primary'}`}
        >
          Todos {!status && count !== null && <span className="ml-1 opacity-60">({count})</span>}
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
          <Link
            key={key}
            href={filterHref({ status: key, page: undefined })}
            className={`font-brand text-sm rounded-full px-4 py-1.5 border transition-colors ${status === key ? 'bg-brand-primary text-brand-cream border-brand-primary' : 'border-gray-200 text-brand-primary/60 hover:border-brand-primary'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['#', 'Cliente', 'Fecha', 'Total', 'Estado', 'Tracking', ''].map((h) => (
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
                  {q ? `Sin resultados para "${q}"` : 'No hay pedidos'}
                </td>
              </tr>
            ) : (
              (orders as any[]).map((order) => {
                const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
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
                      <span className={`font-brand text-xs font-semibold rounded-full px-3 py-1 ${st.color}`}>
                        {st.label}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="font-brand text-xs text-brand-primary/40">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, count ?? 0)} de {count} pedidos
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={filterHref({ page: String(page - 1) })}
                className="font-brand text-sm border border-gray-200 rounded-full px-4 py-1.5 text-brand-primary/60 hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={filterHref({ page: String(page + 1) })}
                className="font-brand text-sm border border-gray-200 rounded-full px-4 py-1.5 text-brand-primary/60 hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
