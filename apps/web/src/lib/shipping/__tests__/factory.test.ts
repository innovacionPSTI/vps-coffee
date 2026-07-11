/**
 * Unit tests for the shipping provider factory (getShippingProvider).
 *
 * Verifies that the factory reads shipping_config from the DB and
 * returns the correct provider instance based on the config.
 */

jest.mock('@vps/database', () => ({
  getShippingConfig: jest.fn(),
}))

import { getShippingConfig } from '@vps/database'
import { getShippingProvider } from '../index'
import { FixedRateProvider } from '../providers/fixed-rate'
import { SkydropxProvider } from '../providers/skydropx'

const mockGetShippingConfig = getShippingConfig as jest.MockedFunction<typeof getShippingConfig>

const BASE_CONFIG = {
  id: 1,
  fixed_rate: 8000,
  skydropx_base_url: 'https://api-pro.skydropx.com',
  updated_at: new Date().toISOString(),
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Fixed rate provider
// ─────────────────────────────────────────────
describe('getShippingProvider — provider = "fixed"', () => {
  it('retorna FixedRateProvider cuando provider = "fixed"', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'fixed',
      skydropx_client_id: null, skydropx_client_secret: null, skydropx_address_from_id: null,
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
    expect(provider.name).toBe('fixed')
  })

  it('usa fixed_rate de la BD (no 8000 hardcodeado)', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'fixed', fixed_rate: 12000,
      skydropx_client_id: null, skydropx_client_secret: null, skydropx_address_from_id: null,
    })
    const provider = await getShippingProvider()
    // getRates should return 12000
    const rates = await provider.getRates(
      { name: 'T', street1: 'C1', postal_code: '000', area_level1: 'X', area_level2: 'Y', country_code: 'CO', phone: '0', email: 'e@e.com' },
      { length: 20, width: 15, height: 8, weight: 0.3 }
    )
    expect(rates[0].total_price).toBe(12000)
  })
})

// ─────────────────────────────────────────────
// Skydropx provider
// ─────────────────────────────────────────────
describe('getShippingProvider — provider = "skydropx"', () => {
  it('retorna SkydropxProvider cuando las credenciales están completas', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: 'secret', skydropx_address_from_id: 'wh-01',
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(SkydropxProvider)
    expect(provider.name).toBe('skydropx')
  })

  it('hace fallback a FixedRateProvider si falta client_id', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: null, skydropx_client_secret: 'secret', skydropx_address_from_id: 'wh-01',
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
  })

  it('hace fallback a FixedRateProvider si falta client_secret', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: null, skydropx_address_from_id: 'wh-01',
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
  })

  it('hace fallback a FixedRateProvider si falta address_from_id', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: 'secret', skydropx_address_from_id: null,
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
  })
})

// ─────────────────────────────────────────────
// Error / fallback
// ─────────────────────────────────────────────
describe('getShippingProvider — fallbacks', () => {
  it('retorna FixedRateProvider(8000) si la BD falla', async () => {
    mockGetShippingConfig.mockRejectedValueOnce(new Error('DB connection error'))
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
    const rates = await provider.getRates(
      { name: 'T', street1: 'C1', postal_code: '000', area_level1: 'X', area_level2: 'Y', country_code: 'CO', phone: '0', email: 'e@e.com' },
      { length: 20, width: 15, height: 8, weight: 0.3 }
    )
    expect(rates[0].total_price).toBe(8000)
  })
})
