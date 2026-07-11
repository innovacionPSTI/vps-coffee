import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getStats() {
  const supabase = createServerClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ordersToday, pendingOrders, products] = await Promise.all([
    supabase.from('orders').select('total').gte('created_at', today.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
  ])

  const salesTotal = ordersToday.data?.reduce((sum, o) => sum + o.total, 0) ?? 0
  return {
    salesTotal,
    ordersCount: ordersToday.data?.length ?? 0,
    pendingCount: pendingOrders.count ?? 0,
    productsCount: products.count ?? 0,
  }
}

async function getRecentOrders() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('orders')
    .select('order_number, customer_name, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getStats().catch(() => ({ salesTotal: 0, ordersCount: 0, pendingCount: 0, productsCount: 0 })),
    getRecentOrders().catch(() => []),
  ])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const statCards = [
    { label: 'Ventas hoy', value: fmt(stats.salesTotal), icon: '💰', sub: `${stats.ordersCount} pedidos` },
    { label: 'Pedidos pendientes', value: stats.pendingCount.toString(), icon: '📦', href: '/pedidos?status=pending' },
    { label: 'Productos activos', value: stats.productsCount.toString(), icon: '☕', href: '/productos' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Dashboard</h1>
        <p className="font-brand text-sm text-brand-primary/40 capitalize">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="font-brand text-sm text-brand-primary/50">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="font-brand font-bold text-brand-primary text-2xl">{card.value}</p>
            {card.sub && <p className="font-brand text-xs text-brand-primary/40 mt-1">{card.sub}</p>}
            {card.href && (
              <Link href={card.href} className="font-brand text-xs text-brand-primary underline mt-2 block">
                Ver →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-brand font-semibold text-brand-primary">Pedidos recientes</h2>
          <Link href="/pedidos" className="font-brand text-sm text-brand-primary underline">
            Ver todos
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="font-brand text-brand-primary/40 text-center py-12">Sin pedidos aún</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['#', 'Cliente', 'Fecha', 'Total', 'Estado'].map((h) => (
                  <th key={h} className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => (
                <tr key={order.order_number} className="hover:bg-gray-50 transition-colors">
                  <td className="font-brand text-sm text-brand-primary font-medium px-6 py-4">
                    <Link href={`/pedidos/${order.order_number}`} className="hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="font-brand text-sm text-brand-primary/70 px-6 py-4">{order.customer_name}</td>
                  <td className="font-brand text-sm text-brand-primary/50 px-6 py-4">
                    {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="font-brand text-sm font-semibold text-brand-primary px-6 py-4">{fmt(order.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-brand text-xs font-semibold rounded-full px-3 py-1 ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
