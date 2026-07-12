/**
 * POST /api/checkout/coupon
 * Valida un código de cupón y retorna el descuento calculado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCouponByCode, validateCoupon } from '@vps/database'

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'Se requiere code y subtotal' }, { status: 400 })
    }

    const coupon = await getCouponByCode(code.trim())
    if (!coupon) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 })
    }

    const result = validateCoupon(coupon, subtotal)
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: result.discount,
    })
  } catch (err) {
    console.error('[api/checkout/coupon]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
