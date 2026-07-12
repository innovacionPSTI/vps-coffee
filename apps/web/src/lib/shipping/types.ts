/**
 * Core shipping abstraction types.
 *
 * Any shipping provider (Skydropx, FedEx, Deprisa, fixed-rate, etc.)
 * must implement the `ShippingProvider` interface and return `ShippingRate[]`.
 * The rest of the application only depends on these types, never on a
 * specific provider implementation.
 */

// ─── Address & Parcel ─────────────────────────────────────────────────────────

export interface ShippingAddress {
  name: string
  street1: string
  postal_code: string
  /** Department / state (area_level1) */
  area_level1: string
  /** City / municipality (area_level2) */
  area_level2: string
  /** Neighborhood / barrio (area_level3) — optional, used in Skydropx quotations */
  area_level3?: string
  country_code: 'CO'
  phone: string
  email: string
  reference?: string
}

export interface ShippingParcel {
  length: number  // cm
  width: number   // cm
  height: number  // cm
  weight: number  // kg
}

// ─── Rate ─────────────────────────────────────────────────────────────────────

export interface ShippingRate {
  /** Unique rate identifier (provider-scoped) */
  id: string
  /** Provider slug: 'skydropx' | 'fixed' | future providers */
  provider: string
  carrier_name: string
  service_name: string
  /** ISO 4217 currency code */
  currency: string
  /** Price in the smallest unit of the currency (COP cents = COP, no decimals) */
  total_price: number
  /** Estimated business days */
  days: number
  estimated_delivery?: string
}

// ─── Provider interface ───────────────────────────────────────────────────────

/**
 * All shipping providers implement this interface.
 *
 * `getRates` is the only required method. Providers that support
 * shipment creation, label generation, and pickup scheduling should
 * extend this interface in their own module without breaking the core contract.
 */
export interface ShippingProvider {
  /** Human-readable slug for logging / analytics */
  readonly name: string

  /**
   * Returns available shipping rates for the given address and parcel.
   * Must never throw — return an empty array or a single fallback rate
   * if the underlying service is unavailable.
   */
  getRates(address: ShippingAddress, parcel: ShippingParcel): Promise<ShippingRate[]>
}

// ─── Parcel utility ───────────────────────────────────────────────────────────

/**
 * Calculates the shipment parcel dimensions and total weight
 * from the cart items. Used by all providers.
 *
 * Weight tiers (kg):
 *   ≤ 0.7  → small box  20×15×8 cm
 *   ≤ 1.5  → medium box 25×20×10 cm
 *   > 1.5  → large box  35×25×15 cm
 */
export function calculateParcel(
  items: { weight: string; qty: number }[]
): ShippingParcel {
  const WEIGHT_MAP: Record<string, number> = {
    '250g': 0.3,
    '500g': 0.6,
    '1kg':  1.1,
  }

  const totalWeight = items.reduce((sum, item) => {
    return sum + (WEIGHT_MAP[item.weight] ?? 0.5) * item.qty
  }, 0)

  if (totalWeight <= 0.7) return { length: 20, width: 15, height: 8,  weight: totalWeight }
  if (totalWeight <= 1.5) return { length: 25, width: 20, height: 10, weight: totalWeight }
  return                         { length: 35, width: 25, height: 15, weight: totalWeight }
}
