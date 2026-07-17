import { createServerClient } from '../client'

export interface AdminConfig {
  id: number
  /** Color hex del acento (botones, nav activo, links). Ej: '#4F46E5' */
  accent_color: string
  /** Color hex de fondo del sidebar. Ej: '#0F172A' */
  sidebar_color: string
  updated_at: string
}

export type UpdateAdminConfigInput = Partial<Pick<AdminConfig, 'accent_color' | 'sidebar_color'>>

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  id: 1,
  accent_color: '#4F46E5',
  sidebar_color: '#0F172A',
  updated_at: new Date().toISOString(),
}

export async function getAdminConfig(): Promise<AdminConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('admin_config')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) return DEFAULT_ADMIN_CONFIG
  return data as AdminConfig
}

export async function updateAdminConfig(input: UpdateAdminConfigInput): Promise<AdminConfig> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('admin_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ id: 1, ...input, updated_at: new Date().toISOString() } as any)
    .select()
    .single()

  if (error) throw error
  return data as AdminConfig
}
