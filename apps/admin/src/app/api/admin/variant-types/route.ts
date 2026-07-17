import { NextRequest, NextResponse } from 'next/server'
import { getVariantTypes, createVariantType } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import type { AdminRole } from '@/lib/roles'

/** GET /api/admin/variant-types — Lista todos los tipos de variante */
export async function GET() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role as AdminRole, 'variantes')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await getVariantTypes()
  return NextResponse.json(data)
}

/** POST /api/admin/variant-types — Crea un nuevo tipo de variante */
export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role as AdminRole, 'variantes')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, values, display_type, order_index } = body as {
    name?: string
    values?: string[]
    display_type?: 'pill' | 'swatch'
    order_index?: number
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name es requerido' }, { status: 400 })
  }
  if (!Array.isArray(values) || values.length === 0) {
    return NextResponse.json({ error: 'values debe ser un array con al menos un elemento' }, { status: 400 })
  }

  try {
    const vt = await createVariantType({
      name: name.trim(),
      values: values.map((v) => String(v).trim()).filter(Boolean),
      display_type: display_type ?? 'pill',
      order_index: order_index ?? 0,
    })
    return NextResponse.json(vt, { status: 201 })
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Error al crear'
    const isDuplicate = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')
    return NextResponse.json(
      { error: isDuplicate ? `Ya existe un tipo de variante con el nombre "${name}"` : msg },
      { status: isDuplicate ? 409 : 500 },
    )
  }
}
