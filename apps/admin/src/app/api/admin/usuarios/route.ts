import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { ASSIGNABLE_ROLES } from '@/lib/roles'
import type { AssignableRole } from '@/lib/roles'
import { stackServerApp } from '@/stack'

/** GET /api/admin/usuarios — Lista todos los usuarios (incluyendo miembros sin rol asignado) */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('role', ['super_admin', 'admin', 'vendedor', 'gestor_tienda', 'miembro'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/**
 * POST /api/admin/usuarios — Crea un nuevo usuario del panel.
 *
 * Flujo:
 * 1. Crea (o recupera) el usuario en Stack Auth
 * 2. Crea la fila en profiles con rol 'miembro' (sin acceso)
 * 3. Envía email para que el usuario establezca su contraseña
 *
 * El rol real lo asigna el admin después vía PATCH.
 */
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, full_name } = body as { email?: string; full_name?: string }

  if (!email) {
    return NextResponse.json({ error: 'email es requerido' }, { status: 400 })
  }

  // ── 1. Crear usuario en Stack Auth ─────────────────────────────────────────
  // Si el usuario ya existe en Stack Auth no lanzamos error — solo continuamos.
  let stackUserCreated = false
  try {
    await stackServerApp.createUser({
      primaryEmail: email,
      displayName: full_name ?? undefined,
      primaryEmailAuthEnabled: true,
      primaryEmailVerified: false,
    })
    stackUserCreated = true
  } catch (err: unknown) {
    // USER_EMAIL_ALREADY_EXISTS → el usuario ya tiene cuenta Stack Auth.
    // En ese caso continuamos: actualizamos el profile y re-enviamos el email.
    const code = (err as { errorCode?: string })?.errorCode ?? ''
    const message = (err as { message?: string })?.message ?? ''
    const isAlreadyExists =
      code === 'USER_EMAIL_ALREADY_EXISTS' ||
      message.toLowerCase().includes('already exists') ||
      message.toLowerCase().includes('email')

    if (!isAlreadyExists) {
      console.error('[usuarios] createUser error:', err)
      return NextResponse.json(
        { error: 'No se pudo crear el usuario en Stack Auth' },
        { status: 500 },
      )
    }
    // Usuario ya existe → continuamos normalmente
  }

  // ── 2. Insert / update en profiles con rol 'miembro' ─────────────────────
  // Se genera el UUID en el servidor para evitar depender del DEFAULT de la BD
  // (puede no estar disponible si la tabla profiles preexistía antes de la migración).
  // En caso de conflicto por email, se actualiza solo el nombre — nunca el id ni el rol.
  const supabase = createServerClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  let profile: { id: string; email: string | null; full_name: string | null; role: string; created_at: string } | null = null
  let dbError: { message: string } | null = null

  if (existingProfile) {
    // Perfil ya existe → actualizar solo el nombre (el rol lo gestiona el admin después)
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: full_name ?? null })
      .eq('email', email)
      .select('id, email, full_name, role, created_at')
      .single()
    profile = data
    dbError = error
  } else {
    // Perfil nuevo → insertar con UUID generado en servidor
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id:         randomUUID(),
        email,
        full_name:  full_name ?? null,
        role:       'miembro',
        created_at: new Date().toISOString(),
      })
      .select('id, email, full_name, role, created_at')
      .single()
    profile = data
    dbError = error
  }

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // ── 3. Enviar email de invitación (establece contraseña) ───────────────────
  // Usa el endpoint público de Stack Auth para enviar un enlace de reset.
  // El usuario hace clic → llega al /handler del admin → establece contraseña.
  const emailSent = await sendPasswordSetupEmail(email)
  if (!emailSent) {
    // No es un error fatal: el perfil ya fue creado.
    // El super_admin puede indicarle al usuario que use "¿Olvidaste tu contraseña?".
    console.warn('[usuarios] No se pudo enviar el email de invitación a:', email)
  }

  return NextResponse.json(
    {
      ...profile,
      inviteEmailSent: emailSent,
      stackUserCreated,
    },
    { status: 201 },
  )
}

/** PATCH /api/admin/usuarios — Cambia el rol de un usuario existente */
export async function PATCH(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role } = body as { email?: string; role?: AssignableRole }

  if (!email || !role) {
    return NextResponse.json({ error: 'email y role son requeridos' }, { status: 400 })
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol no asignable' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (target?.role === 'super_admin') {
    return NextResponse.json({ error: 'No se puede modificar a un super_admin' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('email', email)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE /api/admin/usuarios — Elimina el acceso al admin (borra la fila de profiles) */
export async function DELETE(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email } = (await request.json()) as { email?: string }
  if (!email) {
    return NextResponse.json({ error: 'email requerido' }, { status: 400 })
  }

  if (email === adminUser.email) {
    return NextResponse.json({ error: 'No puedes revocar tu propio acceso' }, { status: 403 })
  }

  const supabase = createServerClient()

  const { data: target } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (target?.role === 'super_admin') {
    return NextResponse.json({ error: 'No se puede revocar a un super_admin' }, { status: 403 })
  }

  const { error } = await supabase.from('profiles').delete().eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Llama al endpoint público de Stack Auth para enviar un enlace de
 * "establece tu contraseña" (password reset) al nuevo usuario.
 *
 * El enlace redirige al /handler del admin donde el usuario puede
 * crear su contraseña por primera vez.
 */
async function sendPasswordSetupEmail(email: string): Promise<boolean> {
  try {
    const stackApiUrl =
      process.env.NEXT_PUBLIC_STACK_API_URL ?? 'https://api.stack-auth.com'

    const adminUrl =
      (process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001').replace(/\/$/, '')

    const res = await fetch(`${stackApiUrl}/api/v1/auth/password/send-reset-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stack-project-id':    process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID!,
        'x-stack-secret-server-key': process.env.HEXCLAVE_SECRET_SERVER_KEY!,
        'x-stack-access-type':   'server',
      },
      body: JSON.stringify({
        email,
        redirect_url: `${adminUrl}/handler/password-reset`,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[usuarios] send-reset-email failed:', res.status, body)
    }

    return res.ok
  } catch (err) {
    console.error('[usuarios] send-reset-email error:', err)
    return false
  }
}
