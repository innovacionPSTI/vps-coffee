import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@vps/database'

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

    const order = await createOrder({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_addr: address,
      items,
      subtotal,
      shipping_cost: shipping_cost ?? 0,
      total,
      payment_method,
    })

    // TODO: Iniciar flujo de pago con Wompi o MercadoPago
    // y redirigir al widget de pago antes de confirmar la orden

    return NextResponse.json({ order_number: order.order_number, order_id: order.id })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
