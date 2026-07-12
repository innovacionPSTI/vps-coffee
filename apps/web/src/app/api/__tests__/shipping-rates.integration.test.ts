/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/shipping/rates (v2 — multi-provider)
 *
 * The route now uses getShippingProvider() factory instead of calling
 * Skydropx directly. Tests verify:
 *   - The factory is called once per request
 *   - The provider's getRates is called with the correct ShippingAddress and parcel
 *   - The response includes { provider, rates }
 *   - Error paths return 500
 */

import { NextRequest } from 'next/server'

// Mock the shipping abstraction layer
jest.mock('@/lib/shipping', () => ({
  getShippingProvider: jest.fn(),
  calculateParcel: jest.fn(),
}))

import { getShippingProvider, calculateParcel } from '@/lib/shipping'
import { POST } from '../shipping/rates/route'

const mockGetShippingProvider = getShippingProvider as jest.MockedFunction<typeof getShippingProvider>
const mockCalculateParcel = calculateParcel as jest.MockedFunction<typeof calculateParcel>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/shipping/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validAddress = {
  name: 'María López',
  street: 'Carrera 7 #71-21',
  city: 'Bogotá',
  department: 'Bogotá D.C.',
  postal_code: '110221',
  phone: '3009876543',
  email: 'maria@example.com',
}

const validItems = [{ weight: '500g', qty: 2 }, { weight: '1kg', qty: 1 }]
const mockParcel = { length: 35, width: 25, height: 15, weight: 2.3 }

const fixedRates = [{ id: 'fixed-rate', provider: 'fixed', carrier_name: 'Tarifa fija', service_name: 'Envío estándar', currency: 'COP', total_price: 8000, days: 5 }]
const skydropxRates = [
  { id: 'r1', provider: 'skydropx', carrier_name: 'Servientrega', service_name: 'Estándar', currency: 'COP', total_price: 18000, days: 2 },
  { id: 'r2', provider: 'skydropx', carrier_name: 'Coordinadora',  service_name: 'Económico', currency: 'COP', total_price: 14000, days: 3 },
]

function makeProviderMock(name: string, rates: typeof fixedRates) {
  return { name, getRates: jest.fn().mockResolvedValue(rates) }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCalculateParcel.mockReturnValue(mockParcel)
})

// ─────────────────────────────────────────────
// Routing to provider
// ─────────────────────────────────────────────
describe('POST /api/shipping/rates — routing', () => {
  it('retorna tarifas de FixedRateProvider cuando es el proveedor activo', async () => {
    mockGetShippingProvider.mockResolvedValueOnce(makeProviderMock('fixed', fixedRates) as never)

    const res = await POST(makeRequest({ address: validAddress, items: validItems }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.provider).toBe('fixed')
    expect(data.rates).toEqual(fixedRates)
  })

  it('retorna tarifas de SkydropxProvider cuando es el proveedor activo', async () => {
    mockGetShippingProvider.mockResolvedValueOnce(makeProviderMock('skydropx', skydropxRates) as never)

    const res = await POST(makeRequest({ address: validAddress, items: validItems }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.provider).toBe('skydropx')
    expect(data.rates).toHaveLength(2)
  })

  it('la respuesta siempre incluye { provider, rates }', async () => {
    mockGetShippingProvider.mockResolvedValueOnce(makeProviderMock('fixed', fixedRates) as never)

    const res = await POST(makeRequest({ address: validAddress, items: validItems }))
    const data = await res.json()

    expect(data).toHaveProperty('provider')
    expect(data).toHaveProperty('rates')
    expect(Array.isArray(data.rates)).toBe(true)
  })
})

// ─────────────────────────────────────────────
// ShippingAddress construction
// ─────────────────────────────────────────────
describe('POST /api/shipping/rates — address mapping', () => {
  it('mapea correctamente los campos de address al formato ShippingAddress', async () => {
    const providerMock = makeProviderMock('fixed', fixedRates)
    mockGetShippingProvider.mockResolvedValueOnce(providerMock as never)

    await POST(makeRequest({ address: validAddress, items: validItems }))

    expect(providerMock.getRates).toHaveBeenCalledWith(
      expect.objectContaining({
        name:         'María López',
        street1:      'Carrera 7 #71-21',
        postal_code:  '110221',
        area_level1:  'Bogotá D.C.',
        area_level2:  'Bogotá',
        country_code: 'CO',
        phone:        '3009876543',
        email:        'maria@example.com',
      }),
      mockParcel
    )
  })

  it('usa "000000" como postal_code si no se provee', async () => {
    const providerMock = makeProviderMock('fixed', fixedRates)
    mockGetShippingProvider.mockResolvedValueOnce(providerMock as never)

    await POST(makeRequest({ address: { ...validAddress, postal_code: undefined }, items: validItems }))

    expect(providerMock.getRates).toHaveBeenCalledWith(
      expect.objectContaining({ postal_code: '000000' }),
      mockParcel
    )
  })

  it('pasa el parcel calculado al provider', async () => {
    const providerMock = makeProviderMock('fixed', fixedRates)
    mockGetShippingProvider.mockResolvedValueOnce(providerMock as never)

    await POST(makeRequest({ address: validAddress, items: validItems }))

    expect(mockCalculateParcel).toHaveBeenCalledWith(validItems)
    expect(providerMock.getRates).toHaveBeenCalledWith(expect.anything(), mockParcel)
  })
})

// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────
describe('POST /api/shipping/rates — errores', () => {
  it('retorna 500 si getShippingProvider lanza un error', async () => {
    mockGetShippingProvider.mockRejectedValueOnce(new Error('DB down'))

    const res = await POST(makeRequest({ address: validAddress, items: validItems }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/tarifas/i)
  })

  it('retorna 500 si getRates lanza un error inesperado', async () => {
    const brokenProvider = { name: 'broken', getRates: jest.fn().mockRejectedValueOnce(new Error('unexpected')) }
    mockGetShippingProvider.mockResolvedValueOnce(brokenProvider as never)

    const res = await POST(makeRequest({ address: validAddress, items: validItems }))
    expect(res.status).toBe(500)
  })
})
