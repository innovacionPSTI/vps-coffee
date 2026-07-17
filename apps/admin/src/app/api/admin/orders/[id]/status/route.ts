import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'
import { sendShippingNotification, sendStatusNotification } from '@/lib/email'

const NOTIFIABLE_STATUSES = new Set(['shipped', 'delivered', 'cancelled'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await req.json()
    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', Number(id))
      .select()
      .single()

    if (error) throw error

    // ── Email al cliente — no bloquea la respuesta si falla ──────────────────
    if (NOTIFIABLE_STATUSES.has(status) && order) {
      void (async () => {
        try {
          const { data: cfg } = await supabase
            .from('store_config')
            .select('resend_api_key, resend_from_email, store_name')
            .single()

          if (!cfg?.resend_api_key || !cfg?.resend_from_email) return

          const emailConfig = {
            apiKey:     cfg.resend_api_key,
            fromEmail:  cfg.resend_from_email,
            storeName:  cfg.store_name ?? undefined,
          }

          if (status === 'shipped') {
            await sendShippingNotification(
              {
                order_number:    order.order_number,
                customer_email:  order.customer_email,
                customer_name:   order.customer_name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tracking_number: (order as any).tracking_number ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                carrier_name:    (order as any).carrier_name    ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label_url:       (order as any).label_url       ?? null,
              },
              emailConfig,
            )
          } else if (status === 'delivered' || status === 'cancelled') {
            await sendStatusNotification(
              {
                order_number:   order.order_number,
                customer_email: order.customer_email,
                customer_name:  order.customer_name,
              },
              status,
              emailConfig,
            )
          }
        } catch (emailErr) {
          // Email errors son silenciosos — el cambio de estado ya fue guardado
          console.error('[status/route] email error:', emailErr)
        }
      })()
    }

    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
  }
}
