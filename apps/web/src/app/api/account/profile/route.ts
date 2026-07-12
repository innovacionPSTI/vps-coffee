import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient } from '@vps/database'

/**
 * GET /api/account/profile
 * Devuelve nombre y teléfono del customer logueado.
 *
 * PATCH /api/account/profile
 * Actualiza nombre y teléfono del customer.
 * Body: { name?: string; phone?: string }
 */

export async function GET() {
  try {
    let user = null
    try { user = await stackServerApp.getUser() } catch { /* no session */ }
    if (!user?.primaryEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()
    const { data: customer } = await supabase
      .from('customers')
      .select('name, phone, email')
      .or(`stack_id.eq.${user.id},email.eq.${user.primaryEmail}`)
      .maybeSingle()

    return NextResponse.json({
      name:  customer?.name  ?? user.displayName ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? user.primaryEmail,
    })
  } catch (err) {
    console.error('[account/profile GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let user = null
    try { user = await stackServerApp.getUser() } catch { /* no session */ }
    if (!user?.primaryEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { name?: string; phone?: string }

    const supabase = createServerClient()

    // Update customer row
    const { error } = await supabase
      .from('customers')
      .update({
        name:       body.name  ?? undefined,
        phone:      body.phone ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .or(`stack_id.eq.${user.id},email.eq.${user.primaryEmail}`)

    if (error) throw error

    // Also update Stack Auth displayName if name changed
    if (body.name) {
      try {
        await user.update({ displayName: body.name })
      } catch {
        // non-critical
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/profile PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
