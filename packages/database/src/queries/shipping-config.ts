import { createServerClient } from '../client'
import type { ShippingProviderType } from '../types'

export type ShippingConfig = {
  id: number
  provider: ShippingProviderType
  fixed_rate: number
  free_shipping_enabled: boolean
  free_shipping_min_amount: number
  skydropx_client_id: string | null
  skydropx_client_secret: string | null
  skydropx_address_from_id: string | null
  skydropx_base_url: string
  origin_name: string | null
  origin_street: string | null
  origin_neighborhood: string | null
  origin_city: string | null
  origin_department: string | null
  origin_postal_code: string | null
  origin_phone: string | null
  origin_email: string | null
  updated_at: string
}

export type UpdateShippingConfigInput = Partial<Omit<ShippingConfig, 'id' | 'updated_at'>>

/**
 * Reads the singleton shipping_config row.
 * Falls back to a safe default if the table is empty (e.g. before migration runs).
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('shipping_config')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) {
    // Safe fallback — fixed rate, no external provider
    return {
      id: 0,
      provider: 'fixed',
      fixed_rate: 8000,
      free_shipping_enabled: true,
      free_shipping_min_amount: 100000,
      skydropx_client_id: null,
      skydropx_client_secret: null,
      skydropx_address_from_id: null,
      skydropx_base_url: 'https://app.skydropx.com',
      origin_name: null,
      origin_street: null,
      origin_neighborhood: null,
      origin_city: null,
      origin_department: null,
      origin_postal_code: null,
      origin_phone: null,
      origin_email: null,
      updated_at: new Date().toISOString(),
    }
  }

  return data as ShippingConfig
}

/**
 * Updates the singleton shipping_config row.
 * Requires service_role key (admin context).
 */
export async function updateShippingConfig(
  input: UpdateShippingConfigInput
): Promise<ShippingConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('shipping_config')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data as ShippingConfig
}
