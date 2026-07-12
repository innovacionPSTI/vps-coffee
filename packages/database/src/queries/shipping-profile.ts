import { createServerClient } from '../client'

export interface ShippingProfile {
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  department: string | null
  postal_code: string | null
  updated_at: string
}

export type ShippingProfileInput = Omit<ShippingProfile, 'updated_at'>

export async function getShippingProfile(email: string): Promise<ShippingProfile | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('shipping_profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data as ShippingProfile | null
}

export async function upsertShippingProfile(input: ShippingProfileInput): Promise<ShippingProfile> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('shipping_profiles')
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    .select()
    .single()

  if (error) throw error
  return data as ShippingProfile
}
