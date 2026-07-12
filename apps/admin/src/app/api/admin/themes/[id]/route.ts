import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'gestor_tienda') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

type Params = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/themes/[id]
 * Acepta campos de color/fuente para actualizar, y/o:
 *   { setActive: true } → activa este tema (desactiva todos los demás)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const themeId = parseInt(id, 10)
  if (isNaN(themeId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await req.json()
  const supabase = createServerClient()

  // Activar tema: desactivar todos primero, luego activar éste
  if (body.setActive === true) {
    await supabase.from('themes').update({ is_active: false }).eq('is_active', true)
    const { error: activateErr } = await supabase
      .from('themes')
      .update({ is_active: true })
      .eq('id', themeId)
    if (activateErr) return NextResponse.json({ error: activateErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Actualización de campos
  const allowed = [
    'name',
    'color_primary', 'color_dark', 'color_cream', 'color_cream_warm',
    'color_yellow', 'color_yellow_pale', 'color_text',
    'font_display', 'font_body',
  ]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { data, error: dbError } = await supabase
    .from('themes')
    .update(updates)
    .eq('id', themeId)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ theme: data })
}

/** DELETE /api/admin/themes/[id] — elimina un tema no activo y no por defecto */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const themeId = parseInt(id, 10)
  if (isNaN(themeId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const supabase = createServerClient()

  const { data: theme } = await supabase
    .from('themes')
    .select('is_active, is_default')
    .eq('id', themeId)
    .maybeSingle()

  if (!theme) return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 })
  if (theme.is_active) return NextResponse.json({ error: 'No se puede eliminar el tema activo' }, { status: 400 })
  if (theme.is_default) return NextResponse.json({ error: 'No se puede eliminar el tema por defecto' }, { status: 400 })

  const { error: dbError } = await supabase.from('themes').delete().eq('id', themeId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
