import { NextRequest, NextResponse } from 'next/server'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '@vps/database'
import { getAdminUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const coupons = await getCoupons()
    return NextResponse.json({ coupons })
  } catch (err) {
    console.error('[admin/coupons GET]', err)
    return NextResponse.json({ error: 'Error obteniendo cupones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { code, type, value, min_order_amount, max_uses, expires_at, active } = body

    if (!code || !type || !value) {
      return NextResponse.json({ error: 'code, type y value son requeridos' }, { status: 400 })
    }

    const coupon = await createCoupon({
      code: String(code).toUpperCase().trim(),
      type,
      value: Number(value),
      min_order_amount: Number(min_order_amount ?? 0),
      max_uses: max_uses ? Number(max_uses) : null,
      expires_at: expires_at || null,
      active: active !== false,
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creando cupón'
    // código único violado
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Ya existe un cupón con ese código' }, { status: 409 })
    }
    console.error('[admin/coupons POST]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const coupon = await updateCoupon(Number(id), updates)
    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('[admin/coupons PATCH]', err)
    return NextResponse.json({ error: 'Error actualizando cupón' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await deleteCoupon(Number(id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/coupons DELETE]', err)
    return NextResponse.json({ error: 'Error eliminando cupón' }, { status: 500 })
  }
}
