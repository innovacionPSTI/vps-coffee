/**
 * Integration tests — POST /api/checkout/coupon
 *
 * Tests: coupon not found, invalid (expired/inactive/min-order), valid response.
 */

import { NextRequest } from 'next/server'
import { POST } from '../checkout/coupon/route'

// ── Mocks ──────────────────────────────────────
const mockGetCouponByCode = jest.fn()
const mockValidateCoupon = jest.fn()

jest.mock('@vps/database', () => ({
  getCouponByCode: (...args: unknown[]) => mockGetCouponByCode(...args),
  validateCoupon: (...args: unknown[]) => mockValidateCoupon(...args),
}))

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/checkout/coupon', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => jest.clearAllMocks())

// ── Tests ──────────────────────────────────────
describe('POST /api/checkout/coupon', () => {
  it('devuelve 404 cuando el cupón no existe', async () => {
    mockGetCouponByCode.mockResolvedValueOnce(null)

    const res = await POST(makeReq({ code: 'NOEXISTE', subtotal: 100_000 }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('devuelve 422 cuando el cupón existe pero no es válido', async () => {
    const coupon = { id: 1, code: 'INACTIVO', type: 'percentage', value: 10, active: false }
    mockGetCouponByCode.mockResolvedValueOnce(coupon)
    mockValidateCoupon.mockReturnValueOnce({ valid: false, error: 'Cupón inactivo' })

    const res = await POST(makeReq({ code: 'INACTIVO', subtotal: 100_000 }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('Cupón inactivo')
  })

  it('devuelve 200 con discount cuando el cupón es válido', async () => {
    const coupon = { id: 1, code: 'VPS20', type: 'percentage', value: 20 }
    mockGetCouponByCode.mockResolvedValueOnce(coupon)
    mockValidateCoupon.mockReturnValueOnce({ valid: true, coupon, discount: 20_000 })

    const res = await POST(makeReq({ code: 'vps20', subtotal: 100_000 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe('VPS20')
    expect(body.discount).toBe(20_000)
    expect(body.type).toBe('percentage')
    expect(body.value).toBe(20)
  })

  it('normaliza el código a mayúsculas antes de buscar', async () => {
    mockGetCouponByCode.mockResolvedValueOnce(null)

    await POST(makeReq({ code: '  vps20  ', subtotal: 50_000 }))

    expect(mockGetCouponByCode).toHaveBeenCalledWith('VPS20')
  })
})
