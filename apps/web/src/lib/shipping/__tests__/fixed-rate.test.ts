/**
 * Unit tests for FixedRateProvider.
 */

import { FixedRateProvider } from '../providers/fixed-rate'
import type { ShippingAddress, ShippingParcel } from '../types'

const dummyAddress: ShippingAddress = {
  name: 'Test User', street1: 'Calle 1', postal_code: '110111',
  area_level1: 'Bogotá D.C.', area_level2: 'Bogotá',
  country_code: 'CO', phone: '3001234567', email: 'test@vps.co',
}
const dummyParcel: ShippingParcel = { length: 20, width: 15, height: 8, weight: 0.3 }

describe('FixedRateProvider', () => {
  it('tiene name = "fixed"', () => {
    expect(new FixedRateProvider().name).toBe('fixed')
  })

  it('retorna exactamente una tarifa', async () => {
    const rates = await new FixedRateProvider(8000).getRates(dummyAddress, dummyParcel)
    expect(rates).toHaveLength(1)
  })

  it('retorna la tarifa configurada en el constructor', async () => {
    const rates = await new FixedRateProvider(12500).getRates(dummyAddress, dummyParcel)
    expect(rates[0].total_price).toBe(12500)
  })

  it('usa 8000 COP como tarifa por defecto si no se provee', async () => {
    const rates = await new FixedRateProvider().getRates(dummyAddress, dummyParcel)
    expect(rates[0].total_price).toBe(8000)
  })

  it('retorna currency = "COP"', async () => {
    const rates = await new FixedRateProvider(5000).getRates(dummyAddress, dummyParcel)
    expect(rates[0].currency).toBe('COP')
  })

  it('retorna provider = "fixed"', async () => {
    const rates = await new FixedRateProvider(5000).getRates(dummyAddress, dummyParcel)
    expect(rates[0].provider).toBe('fixed')
  })

  it('rate = 0 → service_name es "Envío gratuito"', async () => {
    const rates = await new FixedRateProvider(0).getRates(dummyAddress, dummyParcel)
    expect(rates[0].total_price).toBe(0)
    expect(rates[0].service_name).toBe('Envío gratuito')
  })

  it('rate > 0 → service_name es "Envío estándar"', async () => {
    const rates = await new FixedRateProvider(8000).getRates(dummyAddress, dummyParcel)
    expect(rates[0].service_name).toBe('Envío estándar')
  })

  it('ignora la dirección y el parcel (tarifa es siempre la misma)', async () => {
    const provider = new FixedRateProvider(8000)
    const rates1 = await provider.getRates(dummyAddress, dummyParcel)
    const rates2 = await provider.getRates(
      { ...dummyAddress, area_level2: 'Medellín' },
      { ...dummyParcel, weight: 5 }
    )
    expect(rates1[0].total_price).toBe(rates2[0].total_price)
  })

  it('nunca lanza una excepción', async () => {
    await expect(
      new FixedRateProvider(8000).getRates(dummyAddress, dummyParcel)
    ).resolves.not.toThrow()
  })
})
