/**
 * SkydropxProvider — Skydropx PRO API (OAuth 2.0, app.skydropx.com)
 *
 * Implements ShippingProvider (getRates) and adds createShipment for
 * post-payment label generation.
 *
 * Quotation flow (async):
 *   POST /api/v1/quotations → poll GET until is_completed → pick cheapest rate
 *
 * Shipment flow:
 *   POST /api/v1/shipments with rate_id → extract tracking_number + label_url from included[0]
 *
 * Rate format differences (PRO API vs legacy):
 *   PRO field           → internal field
 *   id                  → id  (rate_id for shipment creation)
 *   provider_name       → carrier_name
 *   provider_service_name → service_name
 *   currency_code       → currency
 *   total               → total_price
 *   days                → days
 */

import { skydropxFetch, type SkydropxCredentials } from './auth'
import type { ShippingProvider, ShippingAddress, ShippingParcel, ShippingRate } from '../../types'

// ─── Config ──────────────────────────────────────────────────────────────────

export interface SkydropxOriginAddress {
  name: string          // Sender name / company
  street: string        // Street address (street1)
  neighborhood: string  // Barrio (area_level3)
  city: string          // City (area_level2)
  department: string    // Department (area_level1)
  postalCode: string    // 6-digit postal code
  phone: string
  email: string
}

export interface SkydropxConfig extends SkydropxCredentials {
  origin: SkydropxOriginAddress
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface SkydropxShipmentResult {
  shipmentId: string
  trackingNumber: string
  labelUrl: string
  carrierName: string
  serviceName: string
  total: number
}

// ─── Internal API types ───────────────────────────────────────────────────────

interface ProRate {
  id: string
  success: boolean
  provider_name: string
  provider_display_name: string
  provider_service_name: string
  currency_code: string
  total: string | number
  days: number
  estimated_delivery?: string
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class SkydropxProvider implements ShippingProvider {
  readonly name = 'skydropx'

  constructor(private readonly config: SkydropxConfig) {}

  // ── ShippingProvider interface ─────────────────────────────────────────────

  async getRates(address: ShippingAddress, parcel: ShippingParcel): Promise<ShippingRate[]> {
    try {
      const quotationId = await this._createQuotation(address, parcel)
      const proRates = await this._pollRates(quotationId)
      return proRates
        .filter((r) => r.success)
        .map((r) => ({
          id: r.id,
          provider: this.name,
          carrier_name: r.provider_display_name ?? r.provider_name,
          service_name: r.provider_service_name,
          currency: r.currency_code,
          total_price: Number(r.total),
          days: r.days,
          estimated_delivery: r.estimated_delivery,
        }))
    } catch (err) {
      console.error('[SkydropxProvider] getRates error:', err)
      return []
    }
  }

  // ── Shipment creation ──────────────────────────────────────────────────────

  /**
   * Creates a shipping label for the given destination address and parcel.
   * Internally: creates a quotation, polls for rates, picks the cheapest,
   * then creates the shipment and extracts tracking_number + label_url.
   */
  async createShipment(
    destination: ShippingAddress,
    parcel: ShippingParcel
  ): Promise<SkydropxShipmentResult> {
    // 1. Get cheapest rate
    const quotationId = await this._createQuotation(destination, parcel)
    const proRates = await this._pollRates(quotationId)
    const successRates = proRates.filter((r) => r.success)
    if (!successRates.length) throw new Error('No hay tarifas disponibles de Skydropx')

    const cheapest = successRates.reduce((a, b) =>
      Number(a.total) <= Number(b.total) ? a : b
    )

    // 2. Create shipment
    const { origin } = this.config
    const body = {
      shipment: {
        rate_id: cheapest.id,
        printing_format: 'thermal',
        address_from: {
          name: origin.name,
          street1: origin.street,
          city: origin.city,
          province: origin.department,
          zip: origin.postalCode,
          country_code: 'CO',
          phone: origin.phone,
          email: origin.email,
        },
        address_to: {
          name: destination.name,
          street1: destination.street1,
          city: destination.area_level2,
          province: destination.area_level1,
          zip: destination.postal_code,
          country_code: 'CO',
          phone: destination.phone,
          email: destination.email,
          ...(destination.reference ? { reference: destination.reference } : {}),
        },
        parcels: [{
          weight: parcel.weight,
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
        }],
      },
    }

    const res = await skydropxFetch('/api/v1/shipments', this.config, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Skydropx createShipment failed ${res.status}: ${text}`)
    }

    const data = await res.json()

    // Tracking and label live in included[0].attributes (not data.attributes)
    const pkg = data.included?.[0]?.attributes
    const trackingNumber: string = pkg?.tracking_number ?? data.data?.attributes?.tracking_number ?? ''
    const labelUrl: string = pkg?.label_url ?? data.data?.attributes?.label_url ?? ''
    const shipmentId: string = data.data?.id ?? ''

    return {
      shipmentId,
      trackingNumber,
      labelUrl,
      carrierName: cheapest.provider_display_name ?? cheapest.provider_name,
      serviceName: cheapest.provider_service_name,
      total: Number(cheapest.total),
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _createQuotation(
    address: ShippingAddress,
    parcel: ShippingParcel
  ): Promise<string> {
    const { origin } = this.config
    const body = {
      quotation: {
        address_from: {
          country_code: 'CO',
          area_level1: origin.department,
          area_level2: origin.city,
          // postal_code omitted — Skydropx CO works with area_level1+area_level2 only
          ...(origin.neighborhood ? { area_level3: origin.neighborhood } : {}),
        },
        address_to: {
          country_code: 'CO',
          area_level1: address.area_level1,
          area_level2: address.area_level2,
          // postal_code omitted — Skydropx CO rejects unrecognised codes
          ...(address.area_level3 ? { area_level3: address.area_level3 } : {}),
        },
        parcel: {
          weight: parcel.weight,
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
        },
        // Required by Skydropx PRO — declared value of goods in COP
        declared_amount: parcel.declaredAmount ?? 50000,
      },
    }

    const res = await skydropxFetch('/api/v1/quotations', this.config, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '(no body)')
      throw new Error(`Skydropx createQuotation failed: ${res.status} — ${errBody}`)
    }
    const data = await res.json()
    // PRO API returns { id, is_completed, ... } directly
    return (data.id ?? data.data?.id) as string
  }

  private async _pollRates(quotationId: string): Promise<ProRate[]> {
    const MAX_ATTEMPTS = 15
    const DELAY_MS = 600

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const res = await skydropxFetch(`/api/v1/quotations/${quotationId}`, this.config)
      const data = await res.json()

      // PRO API: { id, is_completed, rates: [...] }
      // Legacy:  { data: { attributes: { is_completed, rates: [...] } } }
      const isCompleted = data.is_completed ?? data.data?.attributes?.is_completed
      const rates = data.rates ?? data.data?.attributes?.rates

      if (isCompleted) {
        return (rates ?? []) as ProRate[]
      }

      await new Promise((r) => setTimeout(r, DELAY_MS))
    }

    throw new Error(`Skydropx quotation ${quotationId} did not complete in time`)
  }
}
