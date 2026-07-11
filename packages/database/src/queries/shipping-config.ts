import { createServerClient } from '../client'
import type { ShippingProviderType } from '../types'

export type ShippingConfig = {
  id: number
  provider: ShippingProviderType
  fixed_rate: number
  skydropx_client_id: string | null
  skydropx_client_secret: string | null
  skydropx_address_from_id: string | null
  skydropx_base_url: string
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
      skydropx_client_id: null,
      skydropx_client_secret: null,
      skydropx_address_from_id: null,
      skydropx_base_url: 'https://api-pro.skydropx.com',
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
