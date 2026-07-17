import { createServerClient } from '@vps/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import OrderStatusUpdater from './OrderStatusUpdater'
import OrderNotes from './OrderNotes'

export const metadata: Metadata = { title: 'Detalle de pedido' }

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Pedido recibido' },
  { status: 'processing', label: 'Preparando' },
  { status: 'shipped', label: 'Enviado' },
  { status: 'delivered', label: 'Entregado' },
]
const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered']

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (!order) notFound()

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const currentStep = STATUS_ORDER.indexOf(order.status)

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/pedidos" className="text-brand-primary/50 hover:text-brand-primary transition-colors font-brand text-sm">
          ← Pedidos
        </Link>
        <h1 className="font-display text-brand-primary text-3xl">{order.order_number}</h1>
        <span className="font-brand text-xs font-semibold bg-brand-cream rounded-full px-3 py-1 text-brand-primary">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles */}
        <div className="lg:col-span-2 space-y-5">
          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-brand font-semibold text-brand-primary mb-4">Estado del pedido</h2>
            <div className="flex items-center gap-2">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= currentStep
                const isLast = i === TIMELINE_STEPS.length - 1
                return (
                  <div key={step.status} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? 'bg-brand-primary text-brand-cream' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p className={`font-brand text-xs mt-1 text-center ${done ? 'text-brand-primary font-semibold' : 'text-brand-primary/40'}`}>
                        {step.label}
                      </p>
                    </div>
                    {!isLast && <div className={`h-px flex-1 ${i < currentStep ? 'bg-brand-primary' : 'bg-gray-200'}`} />}
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-brand font-semibold text-brand-primary mb-4">Productos</h2>
            <div className="space-y-3">
              {(order.items as any[]).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-brand text-sm font-semibold text-brand-primary">{item.product_name}</p>
                    <p className="font-brand text-xs text-brand-primary/50">{item.variant_label} × {item.qty}</p>
                  </div>
                  <span className="font-brand font-bold text-brand-primary text-sm">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-sm font-brand">
              <div className="flex justify-between"><span className="text-brand-primary/50">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-primary/50">Envío</span><span>{fmt(order.shipping_cost)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-green-600">Descuento</span><span className="text-green-600">-{fmt(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-brand-primary"><span>Total</span><span>{fmt(order.total)}</span></div>
            </div>
          </div>

          {/* Envío Skydropx */}
          {order.tracking_number && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-brand font-semibold text-brand-primary mb-4">Estado de envío</h2>
              <div className="space-y-2 font-brand text-sm">
                <div className="flex justify-between"><span className="text-brand-primary/50">Transportadora</span><span className="capitalize">{order.carrier_name}</span></div>
                <div className="flex justify-between"><span className="text-brand-primary/50">Tracking</span><span className="font-mono">{order.tracking_number}</span></div>
              </div>
              {order.label_url && (
                <a
                  href={order.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 border border-brand-primary text-brand-primary rounded-full px-4 py-2 font-brand text-sm hover:bg-brand-primary hover:text-brand-cream transition-colors"
                >
                  🖨 Descargar guía PDF
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          {/* Cliente */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3">Cliente</h3>
            <div className="space-y-1.5 font-brand text-sm">
              <p className="font-semibold text-brand-primary">{order.customer_name}</p>
              <p className="text-brand-primary/60">{order.customer_email}</p>
              {order.customer_phone && <p className="text-brand-primary/60">{order.customer_phone}</p>}
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3">Dirección de envío</h3>
            <div className="font-brand text-sm text-brand-primary/70 space-y-1">
              {(() => {
                const addr = order.shipping_addr as any
                return (
                  <>
                    <p>{addr.address}</p>
                    <p>{addr.city}, {addr.department}</p>
                    {addr.postal_code && <p>CP: {addr.postal_code}</p>}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Pago */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-brand font-semibold text-brand-primary mb-3">Pago</h3>
            <div className="font-brand text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brand-primary/50">Método</span>
                <span className="text-brand-primary capitalize">{order.payment_method ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary/50">Estado</span>
                <span className={`font-semibold ${order.payment_status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Notas internas */}
          <OrderNotes orderId={order.id} initialNotes={(order as any).internal_notes ?? null} />
        </div>
      </div>
    </div>
  )
}
