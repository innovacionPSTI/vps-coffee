/**
 * SkydropxProvider
 *
 * Implements ShippingProvider using the Skydropx API.
 * Credentials are injected at construction time (loaded from shipping_config).
 *
 * Flow:
 *   1. POST /api/v1/quotations  → get quotation ID
 *   2. Poll GET /api/v1/quotations/:id until is_completed = true (max 10 × 500ms)
 *   3. Return the available rates
 *
 * Falls back to an empty array on any error so the caller can decide
 * whether to use the FixedRateProvider as a fallback.
 */

import { skydropxFetch, type SkydropxCredentials } from './auth'
import type { ShippingProvider, ShippingAddress, ShippingParcel, ShippingRate } from '../../types'

export interface SkydropxConfig extends SkydropxCredentials {
  addressFromId: string
}

interface SkydropxRate {
  id: string
  carrier_name: string
  service_name: string
  currency: string
  total_price: number
  days: number
  estimated_delivery: string
}

export class SkydropxProvider implements ShippingProvider {
  readonly name = 'skydropx'

  constructor(private readonly config: SkydropxConfig) {}

  async getRates(address: ShippingAddress, parcel: ShippingParcel): Promise<ShippingRate[]> {
    try {
      const quotation = await this._createQuotation(address, parcel)
      const rawRates = await this._pollRates(quotation.id)
      return rawRates.map((r) => ({ ...r, provider: this.name }))
    } catch (err) {
      console.error('[SkydropxProvider] getRates error:', err)
      return []
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _createQuotation(
    address: ShippingAddress,
    parcel: ShippingParcel
  ): Promise<{ id: string }> {
    const res = await skydropxFetch(
      '/api/v1/quotations',
      this.config,
      {
        method: 'POST',
        body: JSON.stringify({
          quotation: {
            address_from_id: this.config.addressFromId,
            address_to: address,
            parcel,
          },
        }),
      }
    )

    if (!res.ok) throw new Error(`Skydropx createQuotation failed: ${res.status}`)
    const data = await res.json()
    return data.data as { id: string }
  }

  private async _pollRates(quotationId: string): Promise<SkydropxRate[]> {
    const MAX_ATTEMPTS = 10
    const DELAY_MS = 500

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await skydropxFetch(`/api/v1/quotations/${quotationId}`, this.config)
      const data = await res.json()

      if (data.data?.attributes?.is_completed) {
        return (data.data.attributes.rates ?? []) as SkydropxRate[]
      }

      await new Promise((r) => setTimeout(r, DELAY_MS))
    }

    throw new Error(`Skydropx quotation ${quotationId} did not complete after ${MAX_ATTEMPTS} attempts`)
  }
}
