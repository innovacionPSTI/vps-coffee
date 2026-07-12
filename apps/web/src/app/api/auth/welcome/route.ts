import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient, getStoreConfig } from '@vps/database'
import { sendWelcomeEmail } from '@/lib/email'

/**
 * POST /api/auth/welcome
 *
 * Llamado desde el cliente justo después de un registro exitoso en Stack Auth.
 * Realiza tres acciones en orden:
 *
 * 1. Upsert en `customers` — crea o actualiza el registro del nuevo cliente
 *    en Supabase usando stack_id + email como claves de enlace.
 *
 * 2. Vincula pedidos previos — si el cliente ya había comprado como invitado
 *    con el mismo email, actualiza orders.customer_id para que su historial
 *    quede visible en /mi-cuenta/pedidos desde el primer día.
 *
 * 3. Email de bienvenida — envía el correo de bienvenida vía Resend
 *    (silencioso si Resend no está configurado).
 *
 * Body (opcional): { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = user.primaryEmail
    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 })
    }

    // El nombre puede venir del body (más fresco) o del user de Stack Auth
    let name = user.displayName ?? ''
    try {
      const body = await request.json() as { name?: string }
      if (body.name) name = body.name
    } catch {
      // Body vacío o mal formado — usamos el displayName del user
    }

    const displayName = name || email.split('@')[0]
    const supabase = createServerClient()

    // ── 1. Upsert en customers ────────────────────────────────────────────────
    // onConflict: 'stack_id' garantiza idempotencia aunque se llame dos veces.
    // Si el email ya existe como guest (stack_id null), el upsert por email
    // actualizará su stack_id ahora que tiene cuenta.
    const { data: customer, error: upsertError } = await supabase
      .from('customers')
      .upsert(
        {
          stack_id: user.id,
          email,
          name: displayName || null,
        },
        { onConflict: 'email' },   // el email puede existir de un guest previo
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error('[welcome] customers upsert error:', upsertError.message)
      // No bloqueamos el flujo: el email de bienvenida igual se envía
    }

    // ── 2. Vincular pedidos previos del mismo email ───────────────────────────
    // Si el cliente compró antes como invitado, sus órdenes quedan vinculadas
    // a su nueva cuenta sin que él tenga que hacer nada.
    if (customer?.id) {
      const { error: linkError } = await supabase
        .from('orders')
        .update({ customer_id: customer.id })
        .eq('customer_email', email)
        .is('customer_id', null)   // solo órdenes que aún no tienen vínculo

      if (linkError) {
        console.error('[welcome] orders link error:', linkError.message)
      }
    }

    // ── 3. Email de bienvenida ────────────────────────────────────────────────
    const config = await getStoreConfig()
    if (!config?.resend_api_key || !config?.resend_from_email) {
      return NextResponse.json({ sent: false, reason: 'email_not_configured' })
    }

    await sendWelcomeEmail(email, displayName, {
      apiKey: config.resend_api_key,
      fromEmail: config.resend_from_email,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[welcome] error:', err)
    // Error silencioso — el registro fue exitoso de todas formas
    return NextResponse.json({ sent: false }, { status: 200 })
  }
}
