import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import BannersClient from './BannersClient'

export const metadata: Metadata = { title: 'Banners' }
export const dynamic = 'force-dynamic'

export default async function BannersPage() {
  const supabase = createServerClient()
  const { data: allBanners } = await supabase.from('banners').select('*').order('order_index')

  const heroBanners = allBanners?.filter((b) => b.section === 'hero') ?? []

  return <BannersClient heroBanners={heroBanners} />
}
