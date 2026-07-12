import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { key } = await params
  const body = await req.json() as { enabled?: boolean }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Campo "enabled" requerido (boolean)' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('section_settings')
    .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ section: data })
}
