import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig } from '@vps/database'
import { getMercadoPagoPayment, mapMercadoPagoStatus } from '@/lib/mercadopago'
import { sendOrderConfirmation, sendShippingNotification, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de MercadoPago — notificaciones IPN/Webhooks
 * Docs: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Body: { type: "payment", data: { id: "12345678" } }
 * Se consulta el estado real del pago con la API de MP.
 *
 * El access_token se carga desde la tabla payment_config.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = body.type as string | undefined
  if (type !== 'payment') return NextResponse.json({ ok: true })

  const data = body.data as Record<string, unknown> | undefined
  const paymentId = data?.id as string | undefined
  if (!paymentId) return NextResponse.json({ ok: true })

  // Cargar access_token desde la BD
  const paymentConfig = await getPaymentConfig().catch(() => null)
  if (!paymentConfig?.mercadopago_access_token) {
    console.error('[webhook/mercadopago] access_token no configurado en BD')
    return NextResponse.json({ error: 'MP not configured' }, { status: 503 })
  }

  let payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>
  try {
    payment = await getMercadoPagoPayment(paymentConfig.mercadopago_access_token, paymentId)
  } catch (err) {
    console.error('[webhook/mercadopago] Error consultando pago:', err)
    return NextResponse.json({ error: 'MP fetch error' }, { status: 500 })
  }

  const { status: mpStatus, external_reference: reference } = payment
  if (!reference) {
    console.warn('[webhook/mercadopago] Pago sin external_reference:', paymentId)
    return NextResponse.json({ ok: true })
  }

  const paymentStatus = mapMercadoPagoStatus(mpStatus)
  const supabase = createServerClient()

  const updatePayload: OrderUpdate = {
    payment_status: paymentStatus,
    payment_id: String(payment.id),
    updated_at: new Date().toISOString(),
    ...(paymentStatus === 'approved' ? { status: 'processing' as const } : {}),
  }

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('order_number', reference)
    .select()
    .single()

  if (error) {
    console.error('[webhook/mercadopago] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  if (paymentStatus === 'approved' && updatedOrder) {
    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name)
      : null

    // Email de confirmación de pago
    if (emailConfig) {
      try {
        await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig)
      } catch (err) {
        console.error('[webhook/mercadopago] Error email confirmación:', err)
      }
    }

    // Generar guía Skydropx (no bloquea — falla silenciosa)
    const shipment = await createShipmentForOrder(reference)
    if (shipment && emailConfig) {
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
          console.error('[webhook/mercadopago] Error email tracking:', err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
