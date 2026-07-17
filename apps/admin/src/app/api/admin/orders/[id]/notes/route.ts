/**
 * PATCH /api/admin/orders/[id]/notes
 * Actualiza las notas internas de un pedido.
 * Accesible por super_admin, admin y vendedor.
 */
import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

async function requireVendedor() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  const allowed = ['super_admin', 'admin', 'vendedor']
  if (!allowed.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireVendedor()
  if (error) return error

  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const notes = typeof body.internal_notes === 'string' ? body.internal_notes : null

  const supabase = createServerClient()
  const { data, error: dbError } = await supabase
    .from('orders')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ internal_notes: notes } as any)
    .eq('id', orderId)
    .select('id, internal_notes')
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json(data)
}
