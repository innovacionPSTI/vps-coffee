import { createServerClient } from '../client'

export type StoreConfig = {
  id: number
  whatsapp_number: string | null
  store_name: string
  store_email: string | null
  logo_url: string | null
  updated_at: string
}

export type UpdateStoreConfigInput = Partial<Omit<StoreConfig, 'id' | 'updated_at'>>

const DEFAULT_CONFIG: StoreConfig = {
  id: 1,
  whatsapp_number: null,
  store_name: 'VPS Coffee',
  store_email: null,
  logo_url: null,
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

export async function updateStoreConfig(
  input: UpdateStoreConfigInput
): Promise<StoreConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('store_config')
    .upsert({ id: 1, ...input, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data as StoreConfig
}
