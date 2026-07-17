import { createServerClient } from '@vps/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ email: string }>
}): Promise<Metadata> {
  const { email } = await params
  return { title: `Cliente · ${decodeURIComponent(email)}` }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Procesando',  color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado',     color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',   color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 text-red-600' },
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: encodedEmail } = await params
  const email = decodeURIComponent(encodedEmail).toLowerCase()

  const supabase = createServerClient()

  // Perfil registrado (puede no existir si compró como invitado)
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, email, phone, created_at')
    .eq('email', email)
    .maybeSingle()

  // Todos los pedidos del cliente
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, total, payment_status, items')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  // Si no existe en customers ni tiene pedidos → 404
  if (!customer && (!orders || orders.length === 0)) notFound()

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const totalSpent   = (orders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const totalOrders  = orders?.length ?? 0
  const displayName  = customer?.name ?? orders?.[0]?.['customer_name' as keyof typeof orders[0]] ?? email

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/clientes"
          className="text-brand-primary/50 hover:text-brand-primary transition-colors font-brand text-sm"
        >
          ← Clientes
        </Link>
        <div>
          <h1 className="font-display text-brand-primary text-3xl leading-tight">
            {typeof displayName === 'string' ? displayName : email}
          </h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-0.5">{email}</p>
        </div>
        {customer ? (
          <span className="ml-auto font-brand text-xs font-semibold bg-green-100 text-green-700 rounded-full px-3 py-1">
            Con cuenta
          </span>
        ) : (
          <span className="ml-auto font-brand text-xs font-semibold bg-gray-100 text-gray-500 rounded-full px-3 py-1">
            Invitado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar info */}
        <div className="space-y-5">
          {/* Datos de contacto */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3">Contacto</h3>
            <div className="space-y-2 font-brand text-sm">
              <div>
                <p className="text-brand-primary/40 text-xs uppercase tracking-wide">Email</p>
                <p className="text-brand-primary">{email}</p>
              </div>
              {customer?.phone && (
                <div>
                  <p className="text-brand-primary/40 text-xs uppercase tracking-wide">Teléfono</p>
                  <p className="text-brand-primary">{customer.phone}</p>
                </div>
              )}
              {customer?.created_at && (
                <div>
                  <p className="text-brand-primary/40 text-xs uppercase tracking-wide">Registrado</p>
                  <p className="text-brand-primary">{fmtDate(customer.created_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-brand text-sm text-brand-primary/60">Pedidos</span>
                <span className="font-brand font-bold text-brand-primary text-lg">{totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-brand text-sm text-brand-primary/60">Total gastado</span>
                <span className="font-brand font-bold text-brand-primary">{fmt(totalSpent)}</span>
              </div>
              {totalOrders > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-brand text-sm text-brand-primary/60">Ticket promedio</span>
                  <span className="font-brand text-brand-primary">{fmt(Math.round(totalSpent / totalOrders))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historial de pedidos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-brand font-semibold text-brand-primary">
                Pedidos {totalOrders > 0 && <span className="text-brand-primary/40 font-normal">({totalOrders})</span>}
              </h2>
            </div>

            {!orders?.length ? (
              <div className="py-12 text-center font-brand text-brand-primary/40">
                Sin pedidos registrados
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Pedido', 'Fecha', 'Productos', 'Total', 'Estado', ''].map((h) => (
                      <th
                        key={h}
                        className="font-brand text-xs font-semibold text-brand-primary/50 text-left px-4 py-3 first:pl-6 last:pr-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const st = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
                    const itemCount = Array.isArray(order.items) ? order.items.length : 0
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 pl-6">
                          <span className="font-brand font-semibold text-brand-primary text-sm">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                          {fmtDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                          {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                        </td>
                        <td className="px-4 py-3 font-brand font-semibold text-brand-primary text-sm">
                          {fmt(order.total ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-brand text-xs font-semibold rounded-full px-2.5 py-1 ${st.color}`}>
                            {st.label}
                          </span>
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
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
