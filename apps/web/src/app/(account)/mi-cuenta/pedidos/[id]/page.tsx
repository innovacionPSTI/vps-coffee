import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { stackServerApp } from '@/stack'
import { getOrderById } from '@vps/database'

export const metadata: Metadata = { title: 'Detalle del pedido' }
export const dynamic = 'force-dynamic'

// ── Status helpers ────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'pending',    label: 'Pedido recibido',   desc: 'Tu pedido fue registrado y el pago está siendo procesado.' },
  { key: 'processing', label: 'En preparación',    desc: 'Estamos empacando tu pedido con mucho cuidado.' },
  { key: 'shipped',    label: 'En camino',          desc: 'Tu pedido fue despachado y está en camino a tu dirección.' },
  { key: 'delivered',  label: 'Entregado',          desc: '¡Tu pedido llegó! Esperamos que lo disfrutes.' },
]

const STATUS_COLORS: Record<string, { badge: string; dot: string; ring: string }> = {
  pending:    { badge: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-400',   ring: 'ring-amber-300' },
  processing: { badge: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-400',    ring: 'ring-blue-300' },
  shipped:    { badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-400',  ring: 'ring-violet-300' },
  delivered:  { badge: 'bg-green-50 text-green-700',   dot: 'bg-green-400',   ring: 'ring-green-300' },
  cancelled:  { badge: 'bg-red-50 text-red-600',       dot: 'bg-red-400',     ring: 'ring-red-300' },
  exception:  { badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-400',  ring: 'ring-orange-300' },
}

function statusIndex(s: string): number {
  return STATUS_STEPS.findIndex((step) => step.key === s)
}

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params

  const user = await stackServerApp.getUser()
  if (!user) redirect('/login')

  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) notFound()

  const order = await getOrderById(orderId).catch(() => null)

  // Verificar que el pedido pertenece al usuario autenticado
  if (!order || order.customer_email !== user.primaryEmail) notFound()

  const st = STATUS_COLORS[order.status] ?? STATUS_COLORS['pending']
  const currentStep = statusIndex(order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'exception'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/mi-cuenta/pedidos"
          className="w-8 h-8 rounded-full border border-brand-primary/10 flex items-center justify-center hover:border-brand-primary/30 transition-colors"
        >
          <svg className="w-4 h-4 text-brand-primary/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider">Pedido</p>
          <h1 className="font-display text-brand-primary text-2xl leading-tight">{order.order_number}</h1>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 font-brand text-xs font-medium rounded-full px-3 py-1 ${st.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {order.status === 'pending' ? 'Pendiente' :
           order.status === 'processing' ? 'En preparación' :
           order.status === 'shipped' ? 'En camino' :
           order.status === 'delivered' ? 'Entregado' :
           order.status === 'cancelled' ? 'Cancelado' : 'Excepción'}
        </span>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary mb-6">Estado del pedido</h2>
          <div className="relative">
            {/* Línea de fondo */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-brand-primary/10" />
            {/* Línea de progreso */}
            {currentStep > 0 && (
              <div
                className="absolute left-4 top-4 w-0.5 bg-brand-primary transition-all duration-500"
                style={{ height: `calc(${(currentStep / (STATUS_STEPS.length - 1)) * 100}% - 2rem)` }}
              />
            )}

            <div className="space-y-6">
              {STATUS_STEPS.map((step, i) => {
                const done    = i <= currentStep
                const current = i === currentStep
                return (
                  <div key={step.key} className="relative flex gap-5 pl-0">
                    {/* Dot */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                      done
                        ? `bg-brand-primary ${current ? `ring-2 ring-offset-2 ${st.ring}` : ''}`
                        : 'bg-white border-2 border-brand-primary/15'
                    }`}>
                      {done ? (
                        current ? (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/20" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-1 pb-2 min-h-[2rem]">
                      <p className={`font-brand font-semibold text-sm ${done ? 'text-brand-primary' : 'text-brand-primary/30'}`}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="font-brand text-xs text-brand-primary/50 mt-0.5">{step.desc}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_number && (
            <div className="mt-5 pt-5 border-t border-brand-primary/8">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-brand-primary/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2m8-12h3l3 4v4h-2m-4 0H9" />
                </svg>
                <div>
                  <p className="font-brand text-xs text-brand-primary/40">Número de guía</p>
                  <p className="font-brand font-semibold text-brand-primary font-mono tracking-wide">
                    {order.tracking_number}
                  </p>
                </div>
                {order.carrier_name && (
                  <span className="ml-auto font-brand text-xs text-brand-primary/50 bg-brand-cream/60 rounded-lg px-2 py-1">
                    {order.carrier_name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <p className="font-brand font-semibold text-red-700">
            {order.status === 'cancelled' ? 'Pedido cancelado' : 'Excepción en el envío'}
          </p>
          <p className="font-brand text-sm text-red-600/80 mt-1">
            Si tienes preguntas, contáctanos con el número de pedido <strong>{order.order_number}</strong>.
          </p>
        </div>
      )}

      {/* Resumen del pedido */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-brand font-semibold text-brand-primary mb-4">Productos</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-brand font-medium text-brand-primary text-sm truncate">{item.product_name}</p>
                <p className="font-brand text-xs text-brand-primary/40">{item.variant_label} × {item.qty}</p>
              </div>
              <p className="font-brand text-sm font-semibold text-brand-primary tabular-nums flex-shrink-0">
                {COP.format(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-brand-primary/8 space-y-1.5">
          <div className="flex justify-between font-brand text-sm text-brand-primary/60">
            <span>Subtotal</span>
            <span>{COP.format(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between font-brand text-sm text-green-600">
              <span>Descuento</span>
              <span>−{COP.format(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-brand text-sm text-brand-primary/60">
            <span>Envío</span>
            <span>{order.shipping_cost === 0 ? 'Gratis' : COP.format(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between font-brand font-bold text-brand-primary pt-1.5 border-t border-brand-primary/8">
            <span>Total</span>
            <span>{COP.format(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Dirección de envío */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-brand font-semibold text-brand-primary mb-3">Dirección de entrega</h2>
        <p className="font-brand text-sm text-brand-primary font-medium">{order.customer_name}</p>
        <p className="font-brand text-sm text-brand-primary/60 mt-0.5">
          {order.shipping_addr.address}
        </p>
        <p className="font-brand text-sm text-brand-primary/60">
          {order.shipping_addr.city}, {order.shipping_addr.department}
          {order.shipping_addr.postal_code ? ` — ${order.shipping_addr.postal_code}` : ''}
        </p>
      </div>

      {/* Info de pago */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-brand font-semibold text-brand-primary mb-3">Información de pago</h2>
        <div className="space-y-1.5 font-brand text-sm">
          <div className="flex justify-between">
            <span className="text-brand-primary/50">Estado</span>
            <span className={`font-medium ${order.payment_status === 'approved' ? 'text-green-600' : order.payment_status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
              {order.payment_status === 'approved' ? 'Aprobado' :
               order.payment_status === 'rejected' ? 'Rechazado' :
               order.payment_status === 'refunded' ? 'Reembolsado' : 'Pendiente'}
            </span>
          </div>
          {order.payment_method && (
            <div className="flex justify-between">
              <span className="text-brand-primary/50">Método</span>
              <span className="text-brand-primary font-medium capitalize">{order.payment_method}</span>
            </div>
          )}
          {order.payment_id && (
            <div className="flex justify-between">
              <span className="text-brand-primary/50">Referencia</span>
              <span className="text-brand-primary font-mono text-xs">{order.payment_id}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-brand-primary/50">Fecha</span>
            <span className="text-brand-primary">{fmt(order.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
