import { NextResponse } from 'next/server'
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

/** GET /api/admin/newsletter — lista de suscriptores */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ subscribers: data ?? [] })
}
