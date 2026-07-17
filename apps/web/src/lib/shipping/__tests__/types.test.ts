/**
 * Unit tests for shipping utilities (pure functions in types.ts).
 * calculateParcel accepts weight_kg (primary) or a legacy weight string (fallback).
 */

import { calculateParcel, type ShippingParcel } from '../types'

describe('calculateParcel — weight_kg (ruta principal)', () => {
  it('usa weight_kg cuando está disponible', () => {
    const parcel = calculateParcel([{ weight_kg: 0.3, qty: 1 }])
    expect(parcel.weight).toBeCloseTo(0.3)
    expect(parcel.length).toBe(20) // ≤ 0.7 → caja pequeña
  })

  it('weight_kg tiene prioridad sobre weight string legacy', () => {
    // weight_kg=1.0 debe usarse, ignorando el string
    const parcel = calculateParcel([{ weight_kg: 1.0, weight: '250g', qty: 1 }])
    expect(parcel.weight).toBeCloseTo(1.0)
  })

  it('usa dimensiones reales cuando todos los ítems las tienen', () => {
    const parcel = calculateParcel([
      { weight_kg: 0.5, length_cm: 30, width_cm: 20, height_cm: 10, qty: 1 },
    ])
    expect(parcel).toEqual<ShippingParcel>({ length: 30, width: 20, height: 10, weight: 0.5 })
  })

  it('caja grande cuando weight_kg acumula > 1.5 kg', () => {
    const parcel = calculateParcel([{ weight_kg: 0.6, qty: 3 }])
    expect(parcel.length).toBe(35)
    expect(parcel.weight).toBeCloseTo(1.8)
  })

  it('carrito vacío → peso 0 y caja pequeña', () => {
    const parcel = calculateParcel([])
    expect(parcel.weight).toBe(0)
    expect(parcel.length).toBe(20)
  })
})

describe('calculateParcel — fallback legacy weight string', () => {
  it('caja pequeña: 250g → 0.3 kg', () => {
    const parcel = calculateParcel([{ weight: '250g', qty: 1 }])
    expect(parcel).toEqual<ShippingParcel>({
      length: 20, width: 15, height: 8,
      weight: expect.closeTo(0.3, 4),
    })
  })

  it('caja mediana: dos ítems 500g → 1.2 kg', () => {
    const parcel = calculateParcel([{ weight: '500g', qty: 2 }])
    expect(parcel).toMatchObject({ length: 25, width: 20, height: 10 })
    expect(parcel.weight).toBeCloseTo(1.2)
  })

  it('caja grande: tres ítems 1kg → 3.3 kg', () => {
    const parcel = calculateParcel([{ weight: '1kg', qty: 3 }])
    expect(parcel).toMatchObject({ length: 35, width: 25, height: 15 })
    expect(parcel.weight).toBeCloseTo(3.3)
  })

  it('string desconocido usa 0.5 kg como fallback', () => {
    const parcel = calculateParcel([{ weight: 'unknown', qty: 1 }])
    expect(parcel.weight).toBeCloseTo(0.5)
    expect(parcel.length).toBe(20)
  })

  it('sin weight ni weight_kg usa 0.5 kg como fallback', () => {
    const parcel = calculateParcel([{ qty: 1 }])
    expect(parcel.weight).toBeCloseTo(0.5)
  })

  it('respeta qty como multiplicador', () => {
    const p1 = calculateParcel([{ weight: '500g', qty: 1 }])
    const p2 = calculateParcel([{ weight: '500g', qty: 3 }])
    expect(p2.weight).toBeCloseTo(p1.weight * 3, 4)
  })
})
