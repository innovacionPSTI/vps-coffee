import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getPaymentConfig } from '@vps/database'
import { buildWompiCheckoutUrl } from '@/lib/wompi'
import {
  createMercadoPagoPreference,
  isMercadoPagoSandbox,
  type MPItem,
} from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      email,
      name,
      phone,
      address,
      items,
      subtotal,
      shipping_cost,
      total,
      payment_method,
    } = body

    if (!email || !name || !address || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Cargar configuración de pagos desde la BD
    const paymentConfig = await getPaymentConfig()

    const method: 'wompi' | 'mercadopago' = payment_method ?? 'wompi'

    // Validar que la pasarela seleccionada esté activa y configurada
    if (method === 'wompi') {
      if (!paymentConfig?.wompi_active) {
        return NextResponse.json(
          { error: 'Wompi no está activo. Configura las credenciales en el panel admin.' },
          { status: 503 },
        )
      }
      if (!paymentConfig.wompi_public_key || !paymentConfig.wompi_integrity_secret) {
        return NextResponse.json(
          { error: 'Wompi: faltan credenciales (public_key o integrity_secret).' },
          { status: 503 },
        )
      }
    }

    if (method === 'mercadopago') {
      if (!paymentConfig?.mercadopago_active) {
        return NextResponse.json(
          { error: 'MercadoPago no está activo. Configura las credenciales en el panel admin.' },
          { status: 503 },
        )
      }
      if (!paymentConfig.mercadopago_access_token) {
        return NextResponse.json(
          { error: 'MercadoPago: falta el access token.' },
          { status: 503 },
        )
      }
    }

    // Crear la orden en la BD (payment_status: 'pending')
    const order = await createOrder({
      customer_name: name,
      customer_email: email,
      customer_phone: phone ?? null,
      shipping_addr: address,
      items,
      subtotal,
      shipping_cost: shipping_cost ?? 0,
      total,
      payment_method: method,
    })

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vpscoffee.com').replace(/\/$/, '')
    const confirmUrl = `${siteUrl}/checkout/confirmacion?order=${order.order_number}`

    let payment_url: string

    if (method === 'mercadopago') {
      const preference = await createMercadoPagoPreference(
        paymentConfig!.mercadopago_access_token!,
        {
          externalReference: order.order_number,
          items: (items as Array<{ variant_id: number; product_name: string; qty: number; price: number }>).map(
            (i): MPItem => ({
              id: String(i.variant_id),
              title: i.product_name,
              quantity: i.qty,
              unit_price: i.price,
              currency_id: 'COP',
            }),
          ),
          payerEmail: email,
          backUrls: {
            success: confirmUrl,
            failure: `${siteUrl}/checkout?error=pago_rechazado`,
            pending: `${confirmUrl}&status=pending`,
          },
          notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
        },
      )
      payment_url = isMercadoPagoSandbox(paymentConfig!.mercadopago_access_token!)
        ? preference.sandbox_init_point
        : preference.init_point
    } else {
      // Wompi
      payment_url = buildWompiCheckoutUrl({
        publicKey: paymentConfig!.wompi_public_key!,
        integritySecret: paymentConfig!.wompi_integrity_secret!,
        reference: order.order_number,
        amountInCents: Math.round(total * 100),
        redirectUrl: confirmUrl,
        customerData: {
          email,
          fullName: name,
          phoneNumber: phone ?? undefined,
        },
      })
    }

    return NextResponse.json({
      order_number: order.order_number,
      order_id: order.id,
      payment_url,
    })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
