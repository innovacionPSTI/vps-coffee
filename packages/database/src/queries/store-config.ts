import { createServerClient } from '../client'

/** Un badge de confianza que aparece en la página de producto. */
export interface TrustBadge {
  /** Texto completo del badge, incluyendo emoji si se desea. */
  text: string
  /** Si está activo, se muestra en la tienda. */
  enabled: boolean
}

export type StoreConfig = {
  id: number
  whatsapp_number: string | null
  store_name: string
  store_description: string | null
  seo_keywords: string | null
  store_email: string | null
  logo_url: string | null
  favicon_url: string | null
  resend_api_key: string | null
  resend_from_email: string | null
  terms_content: string | null
  privacy_content: string | null
  instagram_url: string | null
  instagram_enabled: boolean
  facebook_url: string | null
  facebook_enabled: boolean
  tiktok_url: string | null
  tiktok_enabled: boolean
  maintenance_mode: boolean
  analytics_enabled: boolean
  /** Badges de confianza mostrados en la página de producto. */
  trust_badges: TrustBadge[]
  /** Visibilidad de columnas del footer. */
  footer_show_store: boolean
  footer_show_blog: boolean
  footer_show_legal: boolean
  /** Toggles del navbar. */
  nav_show_cart: boolean
  nav_show_auth: boolean
  /** Proveedor de email activo ('resend' por defecto). */
  email_provider: string
  updated_at: string
}

export type UpdateStoreConfigInput = Partial<Omit<StoreConfig, 'id' | 'updated_at'>>

const DEFAULT_CONFIG: StoreConfig = {
  id: 1,
  whatsapp_number: null,
  store_name: 'Mi Tienda',
  store_description: null,
  seo_keywords: null,
  store_email: null,
  logo_url: null,
  favicon_url: null,
  resend_api_key: null,
  resend_from_email: null,
  terms_content: null,
  privacy_content: null,
  instagram_url: null,
  instagram_enabled: true,
  facebook_url: null,
  facebook_enabled: true,
  tiktok_url: null,
  tiktok_enabled: true,
  maintenance_mode: false,
  analytics_enabled: false,
  trust_badges: [],
  footer_show_store: true,
  footer_show_blog: true,
  footer_show_legal: true,
  nav_show_cart: true,
  nav_show_auth: true,
  email_provider: 'resend',
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
  // Cast through unknown because Supabase types trust_badges as Json (no index sig)
  // but at runtime it is always TrustBadge[] thanks to the migration default.
  return {
    ...(data as unknown as StoreConfig),
    trust_badges: Array.isArray((data as any).trust_badges)
      ? ((data as any).trust_badges as TrustBadge[])
      : [],
  }
}

export async function updateStoreConfig(input: UpdateStoreConfigInput): Promise<StoreConfig> {
  const supabase = createServerClient()

  // No sobreescribir resend_api_key si viene vacío
  const sanitized: Record<string, unknown> = { ...input }
  if (sanitized['resend_api_key'] === '') delete sanitized['resend_api_key']

  const { data, error } = await supabase
    .from('store_config')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ id: 1, ...sanitized, updated_at: new Date().toISOString() } as any)
    .select()
    .single()

  if (error) throw error
  return {
    ...(data as unknown as StoreConfig),
    trust_badges: Array.isArray((data as any).trust_badges)
      ? ((data as any).trust_badges as TrustBadge[])
      : [],
  }
}
