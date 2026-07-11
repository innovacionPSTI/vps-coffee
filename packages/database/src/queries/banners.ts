import { createServerClient } from '../client'
import type { Banner } from '../types'

export async function getBanners(section: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('section', section)
    .eq('active', true)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as Banner[]
}
