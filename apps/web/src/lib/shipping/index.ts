/**
 * Shipping Provider Factory
 *
 * Reads the active shipping configuration from the database and returns
 * the appropriate ShippingProvider instance.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  shipping_config.provider  │  Returned provider              │
 * ├──────────────────────────────────────────────────────────────┤
 * │  'fixed'                   │  FixedRateProvider(fixed_rate)  │
 * │  'skydropx' + credentials  │  SkydropxProvider(credentials)  │
 * │  'skydropx' + missing creds│  FixedRateProvider (fallback)   │
 * │  DB error / no row         │  FixedRateProvider(8000)        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Adding a new provider:
 *   1. Add the slug to `shipping_provider_type` enum in the DB migration.
 *   2. Add columns for its credentials to `shipping_config`.
 *   3. Create `src/lib/shipping/providers/<name>/index.ts` implementing ShippingProvider.
 *   4. Add a case to the switch below.
 *   5. Update the admin configuración UI.
 */

import { getShippingConfig } from '@vps/database'
import { FixedRateProvider } from './providers/fixed-rate'
import { SkydropxProvider } from './providers/skydropx'
import type { ShippingProvider } from './types'

export type { ShippingProvider, ShippingRate, ShippingAddress, ShippingParcel } from './types'
export { calculateParcel } from './types'
export { SkydropxProvider } from './providers/skydropx'
export type { SkydropxConfig, SkydropxOriginAddress, SkydropxShipmentResult } from './providers/skydropx'

/**
 * Factory — call once per request. Do NOT cache the returned provider
 * across requests since the admin can change the config at any time.
 */
export async function getShippingProvider(): Promise<ShippingProvider> {
  let config
  try {
    config = await getShippingConfig()
  } catch {
    console.warn('[shipping] Could not load shipping_config — using fixed rate fallback')
    return new FixedRateProvider(8000)
  }

  switch (config.provider) {
    case 'skydropx': {
      const {
        skydropx_client_id,
        skydropx_client_secret,
        skydropx_base_url,
        origin_name,
        origin_street,
        origin_neighborhood,
        origin_city,
        origin_department,
        origin_postal_code,
        origin_phone,
        origin_email,
      } = config

      if (!skydropx_client_id || !skydropx_client_secret) {
        console.warn('[shipping] Skydropx: faltan credenciales — usando tarifa fija')
        return new FixedRateProvider(config.fixed_rate)
      }

      const hasOrigin = origin_name && origin_street && origin_city &&
                        origin_department && origin_postal_code && origin_phone && origin_email

      if (!hasOrigin) {
        console.warn('[shipping] Skydropx: dirección de origen incompleta — usando tarifa fija')
        return new FixedRateProvider(config.fixed_rate)
      }

      return new SkydropxProvider({
        clientId: skydropx_client_id,
        clientSecret: skydropx_client_secret,
        baseUrl: skydropx_base_url ?? 'https://app.skydropx.com',
        origin: {
          name: origin_name!,
          street: origin_street!,
          neighborhood: origin_neighborhood ?? '',
          city: origin_city!,
          department: origin_department!,
          postalCode: origin_postal_code!,
          phone: origin_phone!,
          email: origin_email!,
        },
      })
    }

    // 'fixed' and any unknown future value → FixedRateProvider
    default:
      return new FixedRateProvider(config.fixed_rate)
  }
}
