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

/** GET /api/admin/themes — lista todos los temas */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('themes')
    .select('*')
    .order('created_at', { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ themes: data ?? [] })
}

/** POST /api/admin/themes — crea un nuevo tema */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const {
    name,
    color_primary, color_dark, color_cream, color_cream_warm,
    color_yellow, color_yellow_pale, color_text,
    font_display, font_body,
  } = body

  if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('themes')
    .insert({
      name,
      is_active: false,
      color_primary:     color_primary     ?? '#614A2A',
      color_dark:        color_dark        ?? '#604B30',
      color_cream:       color_cream       ?? '#FFF0D1',
      color_cream_warm:  color_cream_warm  ?? '#FFF1D3',
      color_yellow:      color_yellow      ?? '#FFF6B8',
      color_yellow_pale: color_yellow_pale ?? '#FDF8B9',
      color_text:        color_text        ?? '#2D1A0A',
      font_display:      font_display      ?? 'cormorant',
      font_body:         font_body         ?? 'dm-sans',
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ theme: data }, { status: 201 })
}
