/**
 * Unit tests for SkydropxProvider.
 *
 * Mocks the auth module so no real OAuth calls are made.
 * Tests: getRates happy path, polling, auth credential injection,
 * and graceful degradation on errors.
 */

import { SkydropxProvider } from '../providers/skydropx'
import type { ShippingAddress, ShippingParcel } from '../types'

jest.mock('../providers/skydropx/auth', () => ({
  skydropxFetch: jest.fn(),
  getSkydropxToken: jest.fn().mockResolvedValue('mock-token'),
  _clearTokenCacheForTests: jest.fn(),
}))

import { skydropxFetch } from '../providers/skydropx/auth'
const mockFetch = skydropxFetch as jest.Mock

const CREDENTIALS = {
  clientId: 'test-client-id',
  clientSecret: 'test-secret',
  addressFromId: 'warehouse-bta-01',
  baseUrl: 'https://api-pro.skydropx.com',
}

const dummyAddress: ShippingAddress = {
  name: 'Ana García', street1: 'Carrera 7 #71-21',
  postal_code: '110221', area_level1: 'Bogotá D.C.', area_level2: 'Bogotá',
  country_code: 'CO', phone: '3009876543', email: 'ana@example.com',
}
const dummyParcel: ShippingParcel = { length: 25, width: 20, height: 10, weight: 1.2 }

const mockRates = [
  { id: 'r1', carrier_name: 'Servientrega', service_name: 'Estándar', currency: 'COP', total_price: 18000, days: 2 },
  { id: 'r2', carrier_name: 'Coordinadora', service_name: 'Económico', currency: 'COP', total_price: 14000, days: 3 },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})
afterEach(() => { jest.useRealTimers() })

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────
describe('SkydropxProvider — happy path', () => {
  it('tiene name = "skydropx"', () => {
    expect(new SkydropxProvider(CREDENTIALS).name).toBe('skydropx')
  })

  it('retorna tarifas con provider = "skydropx" añadido', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'quot-001' } }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { attributes: { is_completed: true, rates: mockRates } } }),
      })

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    const rates = await promise

    expect(rates).toHaveLength(2)
    expect(rates[0].provider).toBe('skydropx')
    expect(rates[0].carrier_name).toBe('Servientrega')
  })

  it('incluye addressFromId en el body de createQuotation', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'quot-002' } }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { attributes: { is_completed: true, rates: [] } } }),
      })

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    await promise

    const [_path, _creds, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.quotation.address_from_id).toBe('warehouse-bta-01')
  })

  it('pasa las credenciales a skydropxFetch', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'quot-003' } }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { attributes: { is_completed: true, rates: [] } } }),
      })

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    await promise

    const [, credentials] = mockFetch.mock.calls[0]
    expect(credentials.clientId).toBe('test-client-id')
    expect(credentials.clientSecret).toBe('test-secret')
  })
})

// ─────────────────────────────────────────────
// Polling
// ─────────────────────────────────────────────
describe('SkydropxProvider — polling', () => {
  it('reintenta hasta que is_completed = true', async () => {
    const pendingResponse = { ok: true, json: async () => ({ data: { attributes: { is_completed: false } } }) }
    const completedResponse = {
      ok: true,
      json: async () => ({ data: { attributes: { is_completed: true, rates: mockRates } } }),
    }

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'q-poll' } }) })
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValueOnce(completedResponse)

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(500)
      await Promise.resolve()
    }
    const rates = await promise
    expect(rates).toHaveLength(2)
    // 1 create + 3 poll attempts
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })
})

// ─────────────────────────────────────────────
// Graceful degradation
// ─────────────────────────────────────────────
describe('SkydropxProvider — degradación graceful', () => {
  it('retorna [] (no lanza) si createQuotation falla con HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    const rates = await promise

    expect(rates).toEqual([])
  })

  it('retorna [] (no lanza) si el polling agota los reintentos', async () => {
    const pendingResponse = { ok: true, json: async () => ({ data: { attributes: { is_completed: false } } }) }
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'q-timeout' } }) })
      .mockResolvedValue(pendingResponse)

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    for (let i = 0; i < 15; i++) {
      jest.advanceTimersByTime(500)
      await Promise.resolve()
    }
    const rates = await promise
    expect(rates).toEqual([])
  })

  it('retorna [] (no lanza) si fetch lanza un error de red', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    const rates = await promise

    expect(rates).toEqual([])
  })
})
