import { createServerClient } from '../client'

export type StoreConfig = {
  id: number
  whatsapp_number: string | null
  store_name: string
  store_email: string | null
  logo_url: string | null
  resend_api_key: string | null
  resend_from_email: string | null
  updated_at: string
}

export type UpdateStoreConfigInput = Partial<Omit<StoreConfig, 'id' | 'updated_at'>>

const DEFAULT_CONFIG: StoreConfig = {
  id: 1,
  whatsapp_number: null,
  store_name: 'VPS Coffee',
  store_email: null,
  logo_url: null,
  resend_api_key: null,
  resend_from_email: 'pedidos@vpscoffee.com',
  updated_at: new Date().toISOString(),
}

export async function getStoreConfig(): Promise<StoreConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_config')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) return DEFAULT_CONFIG
  return data as StoreConfig
}

export async function updateStoreConfig(input: UpdateStoreConfigInput): Promise<StoreConfig> {
  const supabase = createServerClient()

  // No sobreescribir resend_api_key si viene vacío
  const sanitized = { ...input }
  if (sanitized.resend_api_key === '') delete sanitized.resend_api_key

  const { data, error } = await supabase
    .from('store_config')
    .upsert({ id: 1, ...sanitized, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data as StoreConfig
}
