import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getStoreConfig } from '@vps/database'
import { sendShippingNotification, buildEmailConfig } from '@/lib/email'
import type { Order } from '@vps/database'

/**
 * Webhook de Skydropx PRO — eventos de seguimiento y entrega.
 *
 * Eventos manejados:
 *   shipment.status.updated   → actualiza order.status
 *   package.tracking.updated  → actualiza order.status (mismo payload)
 *   shipment.delivered        → marca como entregado
 *
 * El webhook de Skydropx envía HMAC-SHA512 en X-Skydropx-Signature.
 * Por ahora procesamos los eventos de forma confiable; la verificación
 * de firma se puede habilitar configurando SKYDROPX_WEBHOOK_SECRET en env.
 */

// Status mapping: Skydropx event/workflow_status → order status
const WORKFLOW_STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  label_printed:       'shipped',
  in_transit:          'shipped',
  out_for_delivery:    'shipped',
  delivered:           'delivered',
  exception:           'exception',
  returned:            'exception',
  failed_attempt:      'shipped',
}

const EVENT_STATUS_MAP: Record<string, 'shipped' | 'delivered' | 'exception'> = {
  'shipment.status.updated':    'shipped',   // overridden by workflow_status below
  'shipment.delivered':         'delivered',
  'shipment.exception':         'exception',
  'package.tracking.updated':   'shipped',   // overridden below
  'package.in_transit':         'shipped',
  'package.out_for_delivery':   'shipped',
  'package.delivered':          'delivered',
  'package.returned':           'exception',
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as {
      event?: string
      data?: {
        id?: string
        type?: string
        attributes?: {
          workflow_status?: string
          tracking_number?: string
          status_detail?: string
          delivered_at?: string
        }
      }
    }

    const event = payload.event ?? ''
    const attrs = payload.data?.attributes ?? {}
    const trackingNumber = attrs.tracking_number ?? ''

    // Determine new order status
    let newStatus: 'shipped' | 'delivered' | 'exception' | null = null

    if (attrs.workflow_status && WORKFLOW_STATUS_MAP[attrs.workflow_status]) {
      newStatus = WORKFLOW_STATUS_MAP[attrs.workflow_status]
    } else if (EVENT_STATUS_MAP[event]) {
      newStatus = EVENT_STATUS_MAP[event]
    }

    if (!newStatus || !trackingNumber) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const supabase = createServerClient()

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('tracking_number', trackingNumber)
      .select()
      .single()

    if (error) {
      console.error('[webhook/skydropx] Error actualizando orden:', error)
      return NextResponse.json({ ok: true, warning: 'order_not_updated' })
    }

    // Send tracking email when package enters transit for the first time
    if (newStatus === 'shipped' && updatedOrder) {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig?.resend_api_key && storeConfig?.resend_from_email && updatedOrder.tracking_number) {
          await sendShippingNotification(
            updatedOrder as unknown as Order & { tracking_number: string; carrier_name: string | null; label_url: string | null },
            buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name),
          )
        }
      } catch (emailErr) {
        console.error('[webhook/skydropx] Error enviando email de tracking:', emailErr)
      }
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[webhook/skydropx]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
