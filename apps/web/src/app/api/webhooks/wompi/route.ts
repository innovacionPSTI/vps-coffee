import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig } from '@vps/database'
import { verifyWompiWebhook, mapWompiStatus } from '@/lib/wompi'
import { sendOrderConfirmation, sendShippingNotification } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de Wompi — evento transaction.updated
 * Docs: https://docs.wompi.co/docs/en/events
 *
 * Cabeceras:
 *   x-timestamp  — Unix timestamp en milisegundos
 *   x-checksum   — SHA256(payload + timestamp + eventsSecret)
 *
 * Las credenciales (events_secret) se cargan desde la tabla payment_config.
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const timestamp = req.headers.get('x-timestamp') ?? ''
  const checksum = req.headers.get('x-checksum') ?? ''

  // Cargar credenciales desde la BD
  const paymentConfig = await getPaymentConfig().catch(() => null)
  const eventsSecret = paymentConfig?.wompi_events_secret ?? ''

  if (!verifyWompiWebhook(rawBody, timestamp, checksum, eventsSecret)) {
    console.warn('[webhook/wompi] Firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'transaction.updated') {
    return NextResponse.json({ ok: true })
  }

  const data = event.data as Record<string, unknown> | undefined
  const transaction = data?.transaction as Record<string, unknown> | undefined

  if (!transaction) return NextResponse.json({ ok: true })

  const reference = transaction.reference as string | undefined
  const wompiStatus = transaction.status as string | undefined
  const paymentId = transaction.id as string | undefined

  if (!reference || !wompiStatus) return NextResponse.json({ ok: true })

  const paymentStatus = mapWompiStatus(wompiStatus)
  const supabase = createServerClient()

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
    ...(paymentId ? { payment_id: paymentId } : {}),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', reference)
    .select()
    .single()

  if (error) {
    console.error('[webhook/wompi] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  // Pago aprobado: confirmación + guía de envío
  if (paymentStatus === 'approved' && updatedOrder) {
    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? { apiKey: storeConfig.resend_api_key, fromEmail: storeConfig.resend_from_email }
      : null

    // Email de confirmación de pago
    if (emailConfig) {
      try {
        await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig)
      } catch (err) {
        console.error('[webhook/wompi] Error email confirmación:', err)
      }
    }

    // Generar guía Skydropx (no bloquea — falla silenciosa)
    const shipment = await createShipmentForOrder(reference)
    if (shipment && emailConfig) {
      // Reload order para tener tracking_number actualizado
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', reference)
        .single()
      if (shippedOrder?.tracking_number) {
        try {
          await sendShippingNotification(
            shippedOrder as unknown as Order & { tracking_number: string; carrier_name: string | null; label_url: string | null },
            emailConfig,
          )
        } catch (err) {
          console.error('[webhook/wompi] Error email tracking:', err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
