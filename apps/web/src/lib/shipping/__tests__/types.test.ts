/**
 * Unit tests for shipping utilities (pure functions in types.ts).
 * calculateParcel is now the canonical implementation — replaces the old
 * quotations.ts version.
 */

import { calculateParcel, type ShippingParcel } from '../types'

describe('calculateParcel', () => {
  it('caja pequeña: un ítem 250g → 0.3 kg (≤ 0.7)', () => {
    const parcel = calculateParcel([{ weight: '250g', qty: 1 }])
    expect(parcel).toEqual<ShippingParcel>({
      length: 20, width: 15, height: 8,
      weight: expect.closeTo(0.3, 4),
    })
  })

  it('caja pequeña: dos ítems 250g → 0.6 kg (≤ 0.7)', () => {
    const parcel = calculateParcel([{ weight: '250g', qty: 2 }])
    expect(parcel.length).toBe(20)
    expect(parcel.weight).toBeCloseTo(0.6)
  })

  it('caja pequeña: un ítem 500g → 0.6 kg (≤ 0.7)', () => {
    const parcel = calculateParcel([{ weight: '500g', qty: 1 }])
    expect(parcel.length).toBe(20)
    expect(parcel.weight).toBeCloseTo(0.6)
  })

  it('caja mediana: dos ítems 500g → 1.2 kg (> 0.7 y ≤ 1.5)', () => {
    const parcel = calculateParcel([{ weight: '500g', qty: 2 }])
    expect(parcel).toMatchObject({ length: 25, width: 20, height: 10 })
    expect(parcel.weight).toBeCloseTo(1.2)
  })

  it('caja mediana: un ítem 1kg + un ítem 250g → 1.4 kg (≤ 1.5)', () => {
    const parcel = calculateParcel([{ weight: '1kg', qty: 1 }, { weight: '250g', qty: 1 }])
    expect(parcel.length).toBe(25)
    expect(parcel.weight).toBeCloseTo(1.4)
  })

  it('caja grande: tres ítems 1kg → 3.3 kg (> 1.5)', () => {
    const parcel = calculateParcel([{ weight: '1kg', qty: 3 }])
    expect(parcel).toMatchObject({ length: 35, width: 25, height: 15 })
    expect(parcel.weight).toBeCloseTo(3.3)
  })

  it('pesos mixtos: 1×250g + 1×500g + 1×1kg → 2.0 kg (caja grande)', () => {
    const parcel = calculateParcel([
      { weight: '250g', qty: 1 },
      { weight: '500g', qty: 1 },
      { weight: '1kg',  qty: 1 },
    ])
    expect(parcel.length).toBe(35)
    expect(parcel.weight).toBeCloseTo(2.0)
  })

  it('peso desconocido usa 0.5 kg como valor por defecto', () => {
    const parcel = calculateParcel([{ weight: 'unknown' as never, qty: 1 }])
    expect(parcel.weight).toBeCloseTo(0.5)
    expect(parcel.length).toBe(20) // ≤ 0.7 → caja pequeña
  })

  it('carrito vacío → peso 0 y caja pequeña', () => {
    const parcel = calculateParcel([])
    expect(parcel.weight).toBe(0)
    expect(parcel.length).toBe(20)
  })

  it('respeta qty como multiplicador', () => {
    const p1 = calculateParcel([{ weight: '500g', qty: 1 }])
    const p2 = calculateParcel([{ weight: '500g', qty: 3 }])
    expect(p2.weight).toBeCloseTo(p1.weight * 3, 4)
  })
})
