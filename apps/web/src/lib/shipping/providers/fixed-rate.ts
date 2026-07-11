/**
 * FixedRateProvider
 *
 * The default shipping provider. Returns a single flat-rate option
 * (configurable from the admin panel) without calling any external API.
 *
 * Used:
 *   - When no external provider is configured.
 *   - As a fallback when the active provider fails (timeout, auth error, etc.).
 *   - In development / staging to avoid consuming API quota.
 */

import type { ShippingProvider, ShippingAddress, ShippingParcel, ShippingRate } from '../types'

export class FixedRateProvider implements ShippingProvider {
  readonly name = 'fixed'

  constructor(
    /** Flat shipping cost in COP (from shipping_config.fixed_rate) */
    private readonly rate: number = 8000
  ) {}

  async getRates(
    _address: ShippingAddress,
    _parcel: ShippingParcel
  ): Promise<ShippingRate[]> {
    // If rate is 0 it means free shipping — still return a rate object
    // so the checkout UI has something to display.
    return [
      {
        id: 'fixed-rate',
        provider: this.name,
        carrier_name: 'Tarifa fija',
        service_name: this.rate === 0 ? 'Envío gratuito' : 'Envío estándar',
        currency: 'COP',
        total_price: this.rate,
        days: 5,
        estimated_delivery: undefined,
      },
    ]
  }
}
