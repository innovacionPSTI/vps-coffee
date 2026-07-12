/**
 * Unit tests for SkydropxProvider.
 *
 * Mocks the auth module so no real OAuth calls are made.
 * Tests: getRates happy path, polling, credential/origin injection,
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

// Updated to use SkydropxConfig with `origin` (replaces legacy `addressFromId`)
const CREDENTIALS = {
  clientId:     'test-client-id',
  clientSecret: 'test-secret',
  baseUrl:      'https://app.skydropx.com',
  origin: {
    name:         'VPS Coffee',
    street:       'Calle 10 # 5-20',
    neighborhood: 'El Centro',
    city:         'Medellín',
    department:   'Antioquia',
    postalCode:   '050001',
    phone:        '3001234567',
    email:        'envios@vpscoffee.com',
  },
}

const dummyAddress: ShippingAddress = {
  name: 'Ana García', street1: 'Carrera 7 #71-21',
  postal_code: '110221', area_level1: 'Bogotá D.C.', area_level2: 'Bogotá',
  country_code: 'CO', phone: '3009876543', email: 'ana@example.com',
}
const dummyParcel: ShippingParcel = { length: 25, width: 20, height: 10, weight: 1.2 }

// ProRate format expected by SkydropxProvider
const mockProRates = [
  {
    id: 'r1', success: true,
    provider_name: 'Servientrega', provider_display_name: 'Servientrega',
    provider_service_name: 'Estándar', currency_code: 'COP', total: 18000, days: 2,
  },
  {
    id: 'r2', success: true,
    provider_name: 'Coordinadora', provider_display_name: 'Coordinadora',
    provider_service_name: 'Económico', currency_code: 'COP', total: 14000, days: 3,
  },
]

const quotationCreatedResponse = (id = 'quot-001') => ({
  ok: true,
  json: async () => ({ data: { id } }),
})

const ratesCompletedResponse = (rates = mockProRates) => ({
  ok: true,
  json: async () => ({ data: { attributes: { is_completed: true, rates } } }),
})

const pendingPollResponse = {
  ok: true,
  json: async () => ({ data: { attributes: { is_completed: false } } }),
}

/** Advance timers and flush microtask queue multiple times to drive async polling loops. */
async function advanceAndFlush(ms: number, flushRounds = 3) {
  jest.advanceTimersByTime(ms)
  for (let i = 0; i < flushRounds; i++) {
    await Promise.resolve()
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})
afterEach(() => jest.useRealTimers())

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────
describe('SkydropxProvider — happy path', () => {
  it('tiene name = "skydropx"', () => {
    expect(new SkydropxProvider(CREDENTIALS).name).toBe('skydropx')
  })

  it('retorna tarifas mapeadas con provider = "skydropx"', async () => {
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse())
      .mockResolvedValueOnce(ratesCompletedResponse())

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    const rates = await promise

    expect(rates).toHaveLength(2)
    expect(rates[0].provider).toBe('skydropx')
    expect(rates[0].carrier_name).toBe('Servientrega')
    expect(rates[0].total_price).toBe(18000)
  })

  it('envía address_from como objeto (no address_from_id)', async () => {
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse('quot-002'))
      .mockResolvedValueOnce(ratesCompletedResponse([]))

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    await promise

    const [_path, _creds, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.quotation.address_from).toBeDefined()
    expect(body.quotation.address_from.postal_code).toBe('050001')
    expect(body.quotation.address_from_id).toBeUndefined()
  })

  it('pasa las credenciales a skydropxFetch', async () => {
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse('quot-003'))
      .mockResolvedValueOnce(ratesCompletedResponse([]))

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    await promise

    const [, credentials] = mockFetch.mock.calls[0]
    expect(credentials.clientId).toBe('test-client-id')
    expect(credentials.clientSecret).toBe('test-secret')
  })

  it('filtra tarifas donde success = false', async () => {
    const mixedRates = [
      { ...mockProRates[0], success: false },
      { ...mockProRates[1], success: true },
    ]
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse())
      .mockResolvedValueOnce(ratesCompletedResponse(mixedRates))

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    const rates = await promise

    expect(rates).toHaveLength(1)
    expect(rates[0].carrier_name).toBe('Coordinadora')
  })
})

// ─────────────────────────────────────────────
// Polling
// ─────────────────────────────────────────────
describe('SkydropxProvider — polling', () => {
  it('reintenta hasta que is_completed = true', async () => {
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse('q-poll'))
      .mockResolvedValueOnce(pendingPollResponse)
      .mockResolvedValueOnce(pendingPollResponse)
      .mockResolvedValueOnce(ratesCompletedResponse())

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    for (let i = 0; i < 12; i++) {
      await advanceAndFlush(700)
    }
    const rates = await promise

    expect(rates).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledTimes(4) // 1 create + 3 polls
  })

  it('retorna [] si el polling agota los reintentos (degradación graceful)', async () => {
    mockFetch
      .mockResolvedValueOnce(quotationCreatedResponse('q-timeout'))
      .mockResolvedValue(pendingPollResponse)

    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    // Advance enough to exhaust 15 retries × 600ms = 9000ms
    for (let i = 0; i < 25; i++) {
      await advanceAndFlush(700)
    }
    const rates = await promise
    expect(rates).toEqual([])
  }, 15000)
})

// ─────────────────────────────────────────────
// Graceful degradation
// ─────────────────────────────────────────────
describe('SkydropxProvider — degradación graceful', () => {
  it('retorna [] si createQuotation falla con HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    expect(await promise).toEqual([])
  })

  it('retorna [] si fetch lanza error de red', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const provider = new SkydropxProvider(CREDENTIALS)
    const promise = provider.getRates(dummyAddress, dummyParcel)
    jest.runAllTimers()
    expect(await promise).toEqual([])
  })
})
