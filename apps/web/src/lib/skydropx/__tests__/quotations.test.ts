/**
 * @jest-environment node
 */
/**
 * Unit tests for Skydropx quotation helpers.
 *
 * - calculateParcel: pure function — no mocks needed.
 * - createQuotation / getQuotationRates: mock skydropxFetch.
 */

import {
  calculateParcel,
  createQuotation,
  getQuotationRates,
  type AddressTo,
  type ShipmentParcel,
} from '../quotations'

// Mock the auth module so no real OAuth calls are made
jest.mock('../auth', () => ({
  skydropxFetch: jest.fn(),
}))

import { skydropxFetch } from '../auth'
const mockFetch = skydropxFetch as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  process.env.SKYDROPX_ADDRESS_FROM_ID = 'warehouse-bogota-01'
})

afterEach(() => {
  delete process.env.SKYDROPX_ADDRESS_FROM_ID
})

// ─────────────────────────────────────────────
// calculateParcel — pure unit tests
// ─────────────────────────────────────────────
describe('calculateParcel', () => {
  it('caja pequeña: un ítem 250g → ≤ 0.7 kg', () => {
    const parcel = calculateParcel([{ weight: '250g', qty: 1 }])
    expect(parcel).toEqual<ShipmentParcel>({
      length: 20, width: 15, height: 8,
      weight: expect.closeTo(0.3, 4),
    })
  })

  it('caja pequeña: dos ítems 250g → 0.6 kg (≤ 0.7)', () => {
    const parcel = calculateParcel([{ weight: '250g', qty: 2 }])
    expect(parcel.length).toBe(20)
    expect(parcel.weight).toBeCloseTo(0.6)
  })

  it('caja mediana: un ítem 500g → 0.6 kg (≤ 0.7)', () => {
    // 0.6 ≤ 0.7 → caja pequeña
    const parcel = calculateParcel([{ weight: '500g', qty: 1 }])
    expect(parcel.length).toBe(20) // caja pequeña
    expect(parcel.weight).toBeCloseTo(0.6)
  })

  it('caja mediana: dos ítems 500g → 1.2 kg (> 0.7 y ≤ 1.5)', () => {
    const parcel = calculateParcel([{ weight: '500g', qty: 2 }])
    expect(parcel).toMatchObject({ length: 25, width: 20, height: 10 })
    expect(parcel.weight).toBeCloseTo(1.2)
  })

  it('caja grande: tres ítems 1kg → 3.3 kg (> 1.5)', () => {
    const parcel = calculateParcel([{ weight: '1kg', qty: 3 }])
    expect(parcel).toMatchObject({ length: 35, width: 25, height: 15 })
    expect(parcel.weight).toBeCloseTo(3.3)
  })

  it('pesos mixtos: 1×250g + 1×500g + 1×1kg → 2.0 kg (> 1.5)', () => {
    const parcel = calculateParcel([
      { weight: '250g', qty: 1 }, // 0.3
      { weight: '500g', qty: 1 }, // 0.6
      { weight: '1kg',  qty: 1 }, // 1.1
    ])
    expect(parcel.length).toBe(35) // caja grande
    expect(parcel.weight).toBeCloseTo(2.0)
  })

  it('ítem con peso desconocido usa valor por defecto (0.5 kg)', () => {
    const parcel = calculateParcel([{ weight: 'unknown' as never, qty: 1 }])
    expect(parcel.weight).toBeCloseTo(0.5)
  })

  it('carrito vacío retorna peso 0 y dimensiones de caja pequeña', () => {
    const parcel = calculateParcel([])
    expect(parcel.weight).toBe(0)
    expect(parcel.length).toBe(20)
  })

  it('respeta la cantidad (qty) como multiplicador', () => {
    const parcel1 = calculateParcel([{ weight: '500g', qty: 1 }])
    const parcel2 = calculateParcel([{ weight: '500g', qty: 2 }])
    expect(parcel2.weight).toBeCloseTo(parcel1.weight * 2)
  })
})

// ─────────────────────────────────────────────
// createQuotation
// ─────────────────────────────────────────────
describe('createQuotation', () => {
  const sampleAddress: AddressTo = {
    name: 'Ana García',
    street1: 'Calle 93 #15-10',
    postal_code: '110221',
    area_level1: 'Bogotá D.C.',
    area_level2: 'Bogotá',
    country_code: 'CO',
    phone: '3001234567',
    email: 'ana@example.com',
  }

  const sampleParcel: ShipmentParcel = { length: 25, width: 20, height: 10, weight: 1.2 }

  it('llama a skydropxFetch con el path y body correctos', async () => {
    const mockQuotation = { id: 'quot-abc123', type: 'quotations' }
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: mockQuotation }),
    })

    const result = await createQuotation(sampleAddress, sampleParcel)

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/quotations', {
      method: 'POST',
      body: JSON.stringify({
        quotation: {
          address_from_id: 'warehouse-bogota-01',
          address_to: sampleAddress,
          parcel: sampleParcel,
        },
      }),
    })
    expect(result).toEqual(mockQuotation)
  })

  it('retorna data.data de la respuesta de la API', async () => {
    const quotationData = { id: 'quot-xyz', attributes: { is_completed: false } }
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ data: quotationData }),
    })

    const result = await createQuotation(sampleAddress, sampleParcel)
    expect(result).toStrictEqual(quotationData)
  })
})

// ─────────────────────────────────────────────
// getQuotationRates — polling
// ─────────────────────────────────────────────
describe('getQuotationRates', () => {
  const mockRates = [
    { id: 'rate-1', carrier_name: 'Servientrega', total_price: 18000, days: 2 },
    { id: 'rate-2', carrier_name: 'Coordinadora',  total_price: 15000, days: 3 },
  ]

  /** Advance timers and flush microtask queue to drive async polling loops. */
  async function advanceAndFlush(ms: number, rounds = 3) {
    jest.advanceTimersByTime(ms)
    for (let i = 0; i < rounds; i++) await Promise.resolve()
  }

  beforeEach(() => {
    // Reset (not just clear) so queued mockResolvedValueOnce calls don't leak between tests
    mockFetch.mockReset()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('retorna las tarifas cuando is_completed es true en el primer intento', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        data: { attributes: { is_completed: true, rates: mockRates } },
      }),
    })

    const promise = getQuotationRates('quot-abc')
    jest.runAllTimers()
    const rates = await promise

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(rates).toEqual(mockRates)
  })

  it('re-intenta hasta que is_completed es true', async () => {
    const pendingResponse = {
      json: async () => ({ data: { attributes: { is_completed: false } } }),
    }
    const completedResponse = {
      json: async () => ({
        data: { attributes: { is_completed: true, rates: mockRates } },
      }),
    }

    mockFetch
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValueOnce(completedResponse)

    const promise = getQuotationRates('quot-abc')
    for (let i = 0; i < 8; i++) {
      await advanceAndFlush(600)
    }

    const rates = await promise
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(rates).toEqual(mockRates)
  })

  it('lanza un error si la cotización nunca se completa en 10 intentos', async () => {
    const pendingResponse = {
      json: async () => ({ data: { attributes: { is_completed: false } } }),
    }
    mockFetch.mockResolvedValue(pendingResponse)

    const promise = getQuotationRates('quot-timeout')

    // 10 retries × 500ms delay = 5000ms total
    for (let i = 0; i < 15; i++) {
      await advanceAndFlush(600)
    }

    await expect(promise).rejects.toThrow('Cotización no completada en tiempo esperado')
    expect(mockFetch).toHaveBeenCalledTimes(10)
  }, 15000)

  it('usa el quotationId en el path de la petición', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        data: { attributes: { is_completed: true, rates: [] } },
      }),
    })

    const promise = getQuotationRates('quot-my-id-123')
    jest.runAllTimers()
    await promise

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/quotations/quot-my-id-123')
  })
})
