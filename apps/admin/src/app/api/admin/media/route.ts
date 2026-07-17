import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'
import { getAdminUser } from '@/lib/auth'

async function requireEditor() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const allowed = ['super_admin', 'admin', 'gestor_tienda']
  if (!allowed.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

/** GET /api/admin/media — lista de assets */
export async function GET(req: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mimeFilter = searchParams.get('mime') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 200

  const supabase = createServerClient()
  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (mimeFilter) query = query.ilike('mime_type', `${mimeFilter}%`)

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ assets: data ?? [] })
}

/** DELETE /api/admin/media?key=xxx — eliminar asset */
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { error: dbError } = await supabase.from('media_assets').delete().eq('key', key)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** PATCH /api/admin/media — actualizar alt_text */
export async function PATCH(req: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const body = await req.json() as { key: string; alt_text: string }
  if (!body.key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('media_assets')
    .update({ alt_text: body.alt_text ?? null, updated_at: new Date().toISOString() })
    .eq('key', body.key)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
