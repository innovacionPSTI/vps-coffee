import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getPaymentConfig, createServerClient, getPaymentGateway } from '@vps/database'
import { stackServerApp } from '@/stack'

// ── Rate limiting (best-effort, per-instance) ──────────────────────────────────
// Allows MAX_REQUESTS per IP within WINDOW_MS. In Vercel's serverless model
// each function instance maintains its own in-memory store; this provides
// basic DoS protection. For production-grade limiting use @upstash/ratelimit.
const WINDOW_MS      = 60_000  // 1 minute
const MAX_REQUESTS   = 10      // max checkout attempts per IP per window

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REQUESTS
}

/**
 * Auto-guarda la dirección de envío en customer_addresses para el usuario logueado.
 * Se llama silenciosamente después de crear la orden — nunca bloquea el checkout.
 */
async function saveAddressForUser(
  stackUserId: string,
  userEmail: string,
  shipping: { name: string; phone: string | null; address: string; city: string; department: string | null; postal_code: string | null }
) {
  try {
    const supabase = createServerClient()

    // Buscar el customer
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stack_id', stackUserId)
      .maybeSingle()

    if (!customer) {
      const { data: byEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()
      customer = byEmail
    }

    if (!customer?.id) return

    // Verificar si ya existe una dirección igual para no duplicar
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('address', shipping.address)
      .eq('city', shipping.city)
      .maybeSingle()

    if (existing) return // Ya guardada, no duplicar

    // Si no tiene dirección default, esta será la default
    const { data: hasDefault } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('is_default', true)
      .maybeSingle()

    const isDefault = !hasDefault

    await supabase.from('customer_addresses').insert({
      customer_id: customer.id,
      full_name: shipping.name,
      phone: shipping.phone,
      address: shipping.address,
      city: shipping.city,
      department: shipping.department,
      postal_code: shipping.postal_code,
      is_default: isDefault,
    })
  } catch {
    // Non-critical — never block the checkout
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Window': String(WINDOW_MS / 1000),
        },
      },
    )
  }

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
      discount,
      coupon_code,
      shipping_rate,
    } = body

    // Extract carrier info from the rate the user selected
    const skydropx_rate_id: string | null = shipping_rate?.id ?? null
    const carrier_name: string | null = shipping_rate?.carrier_name ?? null

    if (!email || !name || !address || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Cargar configuración de pagos desde la BD
    const paymentConfig = await getPaymentConfig()
    if (!paymentConfig) {
      console.error('[checkout] 503: no existe fila en payment_config (id=1). Ejecuta el seed local o configura en admin → Configuración → Pagos.')
      return NextResponse.json({ error: 'Configuración de pagos no disponible' }, { status: 503 })
    }

    const method = (payment_method ?? 'wompi') as 'wompi' | 'mercadopago' | string

    // Validar pasarela via factory (lanza si está inactiva o faltan credenciales)
    let gateway
    try {
      gateway = getPaymentGateway(method, paymentConfig)
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Pasarela de pago no disponible'
      console.error(`[checkout] 503: getPaymentGateway("${method}") — ${reason}`)
      return NextResponse.json({ error: reason }, { status: 503 })
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
      payment_method: method as 'wompi' | 'mercadopago' | 'tucompra',
      skydropx_rate_id,
      carrier_name,
    })

    // Auto-guardar dirección para el usuario logueado (silencioso, no bloquea)
    try {
      const sessionUser = await stackServerApp.getUser()
      if (sessionUser?.id && sessionUser?.primaryEmail) {
        saveAddressForUser(sessionUser.id, sessionUser.primaryEmail, {
          name,
          phone: phone ?? null,
          address: address.address,
          city: address.city,
          department: address.department ?? null,
          postal_code: address.postal_code ?? null,
        })
      }
    } catch { /* non-critical */ }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
    const confirmUrl = `${siteUrl}/checkout/confirmacion?order=${order.order_number}`

    const payment_url = await gateway.createPaymentUrl({
      orderNumber: order.order_number,
      amountInCents: Math.round(total * 100),
      currency: 'COP',
      customerEmail: email,
      customerName: name,
      customerPhone: phone ?? undefined,
      items: (items as Array<{ variant_id: number; product_name: string; qty: number; price: number }>).map((i) => ({
        id: String(i.variant_id),
        title: i.product_name,
        quantity: i.qty,
        unit_price: i.price,
      })),
      redirectUrl: confirmUrl,
      webhookUrl: `${siteUrl}/api/webhooks/${method}`,
    })

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
