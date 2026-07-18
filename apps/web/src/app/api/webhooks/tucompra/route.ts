import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getPaymentConfig, getStoreConfig, TuCompraGateway } from '@vps/database'
import { sendOrderConfirmation, buildEmailConfig } from '@/lib/email'
import { createShipmentForOrder } from '@/lib/shipping/shipments'
import type { Order, Database } from '@vps/database'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

/**
 * Webhook de Tu Compra — confirmación de pago (POST form-encoded)
 * Tu Compra envía los datos como application/x-www-form-urlencoded.
 *
 * Campos relevantes:
 *   factura    — order_number (referencia)
 *   resultado  — 1=approved, 2=rejected, 3=pending
 *   firma      — MD5 de verificación
 *   ref_payco  — ID de transacción (opcional)
 */
export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Cargar credenciales desde la BD
  const paymentConfig = await getPaymentConfig().catch(() => null)

  if (!paymentConfig?.tucompra_active || !paymentConfig.tucompra_merchant_id || !paymentConfig.tucompra_secret_key) {
    console.warn('[webhook/tucompra] Tu Compra no configurado')
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 503 })
  }

  const gateway = new TuCompraGateway({
    merchantId: paymentConfig.tucompra_merchant_id,
    secretKey:  paymentConfig.tucompra_secret_key,
    sandbox:    paymentConfig.tucompra_sandbox ?? true,
  })

  // Verificar firma
  if (!gateway.verifyWebhook(rawBody, {})) {
    console.warn('[webhook/tucompra] Firma inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const webhookData = gateway.extractWebhookData(rawBody)
  if (!webhookData) {
    return NextResponse.json({ ok: true })
  }

  const { orderReference, rawStatus, paymentId } = webhookData
  const paymentStatus = gateway.mapStatus(rawStatus)

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
    .eq('order_number', orderReference)
    .select()
    .single()

  if (error) {
    console.error('[webhook/tucompra] Error actualizando orden:', error)
    return NextResponse.json({ ok: true, warning: 'order_not_updated' })
  }

  // Pago aprobado: confirmación + guía de envío
  if (paymentStatus === 'approved' && updatedOrder) {
    const storeConfig = await getStoreConfig().catch(() => null)
    const emailConfig = storeConfig?.resend_api_key && storeConfig?.resend_from_email
      ? buildEmailConfig(
          storeConfig.resend_api_key,
          storeConfig.resend_from_email,
          storeConfig.store_name,
          storeConfig.email_provider,
        )
      : null

    if (emailConfig) {
      try {
        await sendOrderConfirmation(updatedOrder as unknown as Order, emailConfig)
      } catch (err) {
        console.error('[webhook/tucompra] Error email confirmación:', err)
      }
    }

    // Generar guía de envío (falla silenciosa)
    const shipment = await createShipmentForOrder(orderReference)
    if (shipment && emailConfig) {
      const { data: shippedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderReference)
        .single()
      if (shippedOrder?.tracking_number) {
        try {
          const { sendShippingNotification } = await import('@/lib/email')
          await sendShippingNotification(shippedOrder as unknown as Order, emailConfig)
        } catch (err) {
          console.error('[webhook/tucompra] Error email envío:', err)
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
