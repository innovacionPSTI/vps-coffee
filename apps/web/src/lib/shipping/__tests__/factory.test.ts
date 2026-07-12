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

const DESTINATION = { name: 'T', street1: 'C1', postal_code: '000', area_level1: 'X', area_level2: 'Y', country_code: 'CO', phone: '0', email: 'e@e.com' }
const PARCEL      = { length: 20, width: 15, height: 8, weight: 0.3 }

const BASE_CONFIG = {
  id: 1,
  fixed_rate: 8000,
  skydropx_base_url: 'https://app.skydropx.com',
  updated_at: new Date().toISOString(),
  skydropx_client_id: null,
  skydropx_client_secret: null,
  // Origin address fields (replaces skydropx_address_from_id)
  origin_name:        null,
  origin_street:      null,
  origin_neighborhood:null,
  origin_city:        null,
  origin_department:  null,
  origin_postal_code: null,
  origin_phone:       null,
  origin_email:       null,
}

const FULL_ORIGIN = {
  origin_name:        'VPS Coffee',
  origin_street:      'Calle 10 # 5-20',
  origin_neighborhood:'El Centro',
  origin_city:        'Medellín',
  origin_department:  'Antioquia',
  origin_postal_code: '050001',
  origin_phone:       '3001234567',
  origin_email:       'envios@vpscoffee.com',
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Fixed rate provider
// ─────────────────────────────────────────────
describe('getShippingProvider — provider = "fixed"', () => {
  it('retorna FixedRateProvider cuando provider = "fixed"', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({ ...BASE_CONFIG, provider: 'fixed' })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(FixedRateProvider)
    expect(provider.name).toBe('fixed')
  })

  it('usa fixed_rate de la BD (no 8000 hardcodeado)', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({ ...BASE_CONFIG, provider: 'fixed', fixed_rate: 12000 })
    const provider = await getShippingProvider()
    const rates = await provider.getRates(DESTINATION, PARCEL)
    expect(rates[0].total_price).toBe(12000)
  })
})

// ─────────────────────────────────────────────
// Skydropx provider
// ─────────────────────────────────────────────
describe('getShippingProvider — provider = "skydropx"', () => {
  it('retorna SkydropxProvider cuando credenciales y dirección de origen están completas', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: 'secret',
      ...FULL_ORIGIN,
    })
    const provider = await getShippingProvider()
    expect(provider).toBeInstanceOf(SkydropxProvider)
    expect(provider.name).toBe('skydropx')
  })

  it('hace fallback si falta client_id', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: null, skydropx_client_secret: 'secret',
      ...FULL_ORIGIN,
    })
    expect(await getShippingProvider()).toBeInstanceOf(FixedRateProvider)
  })

  it('hace fallback si falta client_secret', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: null,
      ...FULL_ORIGIN,
    })
    expect(await getShippingProvider()).toBeInstanceOf(FixedRateProvider)
  })

  it('hace fallback si falta dirección de origen', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: 'secret',
      // origin fields left null
    })
    expect(await getShippingProvider()).toBeInstanceOf(FixedRateProvider)
  })

  it('hace fallback si origin_city está vacío', async () => {
    mockGetShippingConfig.mockResolvedValueOnce({
      ...BASE_CONFIG, provider: 'skydropx',
      skydropx_client_id: 'cid', skydropx_client_secret: 'secret',
      ...FULL_ORIGIN, origin_city: null,
    })
    expect(await getShippingProvider()).toBeInstanceOf(FixedRateProvider)
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
    const rates = await provider.getRates(DESTINATION, PARCEL)
    expect(rates[0].total_price).toBe(8000)
  })
})
