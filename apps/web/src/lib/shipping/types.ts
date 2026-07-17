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
  /** Declared value of goods in COP — required by Skydropx PRO */
  declaredAmount?: number
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
 * Item shape accepted by calculateParcel.
 * If weight_kg / dimensions are set they are used directly.
 * Otherwise falls back to the legacy `weight` string ('250g', '500g', '1kg').
 */
export interface ParcelItem {
  /** Actual weight in kg from product_variants.weight_kg */
  weight_kg?: number | null
  /** Packed length in cm from product_variants.length_cm */
  length_cm?: number | null
  /** Packed width in cm from product_variants.width_cm */
  width_cm?: number | null
  /** Packed height in cm from product_variants.height_cm */
  height_cm?: number | null
  /** Legacy label weight ('250g' | '500g' | '1kg') — used only when weight_kg is absent */
  weight?: string
  qty: number
}

/**
 * Calculates the shipment parcel dimensions and total weight from cart items.
 *
 * Priority:
 *   1. Real dimensions (weight_kg / *_cm) stored per variant → use them.
 *   2. Fallback: weight tiers from the variant label string.
 *
 * Weight tiers (fallback, kg):
 *   ≤ 0.7  → small box  20×15×8 cm
 *   ≤ 1.5  → medium box 25×20×10 cm
 *   > 1.5  → large box  35×25×15 cm
 */
export function calculateParcel(items: ParcelItem[]): ShippingParcel {
  // Legacy weight-string → kg map. Only used when weight_kg is not set on the variant.
  // These values are left for backwards compatibility with old cart items stored in
  // localStorage. New variants should always have weight_kg configured.
  // Unknown strings fall back to 0.5 kg.
  const LEGACY_WEIGHT_MAP: Record<string, number> = {
    '250g': 0.3,
    '500g': 0.6,
    '1kg':  1.1,
    '2kg':  2.1,
  }

  // Total weight: use weight_kg when available, else fall back to legacy label
  const totalWeight = items.reduce((sum, item) => {
    const kg = (item.weight_kg != null && item.weight_kg > 0)
      ? item.weight_kg
      : (LEGACY_WEIGHT_MAP[item.weight ?? ''] ?? 0.5)
    return sum + kg * item.qty
  }, 0)

  // Use real dimensions if ALL items with qty > 0 have them set
  const hasRealDimensions = items
    .filter((i) => i.qty > 0)
    .every((i) => i.length_cm && i.width_cm && i.height_cm)

  if (hasRealDimensions && items.length > 0) {
    // Total box = max dimensions across all items (single shipment box)
    const length = Math.max(...items.map((i) => i.length_cm ?? 0))
    const width  = Math.max(...items.map((i) => i.width_cm  ?? 0))
    const height = Math.max(...items.map((i) => i.height_cm ?? 0))
    return { length, width, height, weight: totalWeight }
  }

  // Fallback: size tiers based on total weight
  if (totalWeight <= 0.7) return { length: 20, width: 15, height: 8,  weight: totalWeight }
  if (totalWeight <= 1.5) return { length: 25, width: 20, height: 10, weight: totalWeight }
  return                         { length: 35, width: 25, height: 15, weight: totalWeight }
}
