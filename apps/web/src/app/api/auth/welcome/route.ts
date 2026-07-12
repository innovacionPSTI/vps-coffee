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
 * Body: { name?: string; email?: string; stackId?: string }
 *
 * NOTA: email y stackId se pasan desde el cliente para evitar race conditions
 * donde la cookie de sesión de Stack Auth aún no llega al servidor inmediatamente
 * después del registro. stackServerApp.getUser() se intenta primero; si retorna
 * null se usan los valores del body como fallback.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { name?: string; email?: string; stackId?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Body vacío o inválido — continuar con sesión de Stack Auth
    }

    // ── Obtener datos del usuario ─────────────────────────────────────────────
    // getUser() puede lanzar excepción (credenciales no configuradas, race condition, etc.)
    // Se aísla para que un fallo aquí no impida el upsert en customers.
    let sessionUser = null
    try {
      sessionUser = await stackServerApp.getUser()
    } catch {
      // Continuar con datos del body
    }

    // Fuente de verdad: sesión si existe, body como fallback
    const stackId = sessionUser?.id ?? body.stackId ?? null
    const email   = sessionUser?.primaryEmail ?? body.email ?? null
    const name    = body.name ?? sessionUser?.displayName ?? null

    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 })
    }

    const displayName = name || email.split('@')[0]
    const supabase = createServerClient()

    // ── 1. Upsert en customers ────────────────────────────────────────────────
    // onConflict: 'email' garantiza idempotencia.
    // Si el email ya existe como guest (stack_id null), el upsert actualiza su stack_id.
    console.log('[welcome] upserting customer:', { email, stackId, displayName })

    const { data: customer, error: upsertError } = await supabase
      .from('customers')
      .upsert(
        {
          stack_id: stackId,
          email,
          name: displayName,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error('[welcome] customers upsert error:', JSON.stringify(upsertError))
    } else {
      console.log('[welcome] customer upserted:', customer?.id)
    }

    // ── 2. Vincular pedidos previos del mismo email ───────────────────────────
    if (customer?.id) {
      const { error: linkError } = await supabase
        .from('orders')
        .update({ customer_id: customer.id })
        .eq('customer_email', email)
        .is('customer_id', null)

      if (linkError) {
        console.error('[welcome] orders link error:', linkError.message)
      }
    }

    // ── 3. Email de bienvenida ────────────────────────────────────────────────
    // Solo se envía si hay sesión válida (para no enviar a emails del body no verificados)
    if (sessionUser) {
      const config = await getStoreConfig()
      if (config?.resend_api_key && config?.resend_from_email) {
        await sendWelcomeEmail(email, displayName, {
          apiKey: config.resend_api_key,
          fromEmail: config.resend_from_email,
        })
      }
    }

    return NextResponse.json({ sent: !!sessionUser, synced: !!customer })
  } catch (err) {
    console.error('[welcome] error:', err)
    return NextResponse.json({ sent: false, synced: false }, { status: 200 })
  }
}
