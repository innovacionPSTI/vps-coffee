/**
 * Unit tests — validateCoupon (pure function)
 *
 * validateCoupon does NOT hit the DB; it receives a coupon object
 * and an orderSubtotal, and returns {valid, coupon, discount} or {valid, error}.
 */

import { validateCoupon } from '../coupons'
import type { Coupon } from '../../types'

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 1,
    code: 'TEST20',
    type: 'percentage',
    value: 20,
    min_order_amount: 0,
    max_uses: null,
    used_count: 0,
    expires_at: null,
    active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('validateCoupon — tipo percentage', () => {
  it('devuelve discount correcto para 20% sobre 100,000', () => {
    const result = validateCoupon(makeCoupon({ type: 'percentage', value: 20 }), 100_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.discount).toBe(20_000)
  })

  it('descuento no supera el subtotal', () => {
    const result = validateCoupon(makeCoupon({ type: 'percentage', value: 100 }), 50_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.discount).toBe(50_000)
  })
})

describe('validateCoupon — tipo fixed', () => {
  it('devuelve discount fijo en pesos', () => {
    const result = validateCoupon(makeCoupon({ type: 'fixed', value: 15_000 }), 80_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.discount).toBe(15_000)
  })

  it('descuento fijo no supera el subtotal', () => {
    const result = validateCoupon(makeCoupon({ type: 'fixed', value: 200_000 }), 50_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.discount).toBe(50_000)
  })
})

describe('validateCoupon — cupón inactivo', () => {
  it('rechaza cupón con active=false', () => {
    const result = validateCoupon(makeCoupon({ active: false }), 100_000)
    expect(result.valid).toBe(false)
  })
})

describe('validateCoupon — cupón expirado', () => {
  it('rechaza cupón con expires_at en el pasado', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const result = validateCoupon(makeCoupon({ expires_at: past }), 100_000)
    expect(result.valid).toBe(false)
  })

  it('acepta cupón con expires_at en el futuro', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const result = validateCoupon(makeCoupon({ expires_at: future }), 100_000)
    expect(result.valid).toBe(true)
  })
})

describe('validateCoupon — usos agotados', () => {
  it('rechaza cuando used_count >= max_uses', () => {
    const result = validateCoupon(makeCoupon({ max_uses: 10, used_count: 10 }), 100_000)
    expect(result.valid).toBe(false)
  })

  it('acepta cuando used_count < max_uses', () => {
    const result = validateCoupon(makeCoupon({ max_uses: 10, used_count: 9 }), 100_000)
    expect(result.valid).toBe(true)
  })

  it('acepta cuando max_uses es null (ilimitado)', () => {
    const result = validateCoupon(makeCoupon({ max_uses: null, used_count: 9999 }), 100_000)
    expect(result.valid).toBe(true)
  })
})

describe('validateCoupon — mínimo de pedido', () => {
  it('rechaza cuando subtotal < min_order_amount', () => {
    const result = validateCoupon(makeCoupon({ min_order_amount: 100_000 }), 50_000)
    expect(result.valid).toBe(false)
  })

  it('acepta cuando subtotal >= min_order_amount', () => {
    const result = validateCoupon(makeCoupon({ min_order_amount: 100_000 }), 100_000)
    expect(result.valid).toBe(true)
  })

  it('acepta cuando min_order_amount es 0', () => {
    const result = validateCoupon(makeCoupon({ min_order_amount: 0 }), 1_000)
    expect(result.valid).toBe(true)
  })
})

describe('validateCoupon — edge cases', () => {
  it('coupon reference está disponible en resultado válido', () => {
    const coupon = makeCoupon({ code: 'VERANO30' })
    const result = validateCoupon(coupon, 100_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.coupon.code).toBe('VERANO30')
  })

  it('discount nunca es negativo', () => {
    const result = validateCoupon(makeCoupon({ type: 'fixed', value: 0 }), 100_000)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.discount).toBeGreaterThanOrEqual(0)
  })
})
