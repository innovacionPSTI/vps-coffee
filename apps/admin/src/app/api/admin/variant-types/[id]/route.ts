import { NextRequest, NextResponse } from 'next/server'
import { updateVariantType, deleteVariantType } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import type { AdminRole } from '@/lib/roles'

interface Params { params: Promise<{ id: string }> }

/** PATCH /api/admin/variant-types/[id] — Actualiza un tipo de variante */
export async function PATCH(request: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role as AdminRole, 'variantes')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const body = await request.json()
  const { name, values, display_type, active, order_index } = body as {
    name?: string
    values?: string[]
    display_type?: 'pill' | 'swatch'
    active?: boolean
    order_index?: number
  }

  try {
    const updated = await updateVariantType(numId, {
      name,
      values: Array.isArray(values) ? values.map((v) => String(v).trim()).filter(Boolean) : undefined,
      display_type,
      active,
      order_index,
    })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Error al actualizar'
    const isDuplicate = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')
    return NextResponse.json(
      { error: isDuplicate ? `Ya existe un tipo de variante con ese nombre` : msg },
      { status: isDuplicate ? 409 : 500 },
    )
  }
}

/** DELETE /api/admin/variant-types/[id] — Elimina un tipo de variante */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role as AdminRole, 'variantes')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    await deleteVariantType(numId)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
