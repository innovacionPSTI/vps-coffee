import type { Metadata } from 'next'
import { createServerClient } from '@vps/database'
import SeccionesClient from './SeccionesClient'

export const metadata: Metadata = { title: 'Secciones del sitio' }
export const dynamic = 'force-dynamic'

export default async function SeccionesPage() {
  const supabase = createServerClient()

  const [{ data: sections }, { data: servicios }] = await Promise.all([
    supabase.from('section_settings').select('*').order('order_index'),
    supabase.from('banners').select('*').eq('section', 'services').order('order_index'),
  ])

  return (
    <SeccionesClient
      sections={sections ?? []}
      servicios={servicios ?? []}
    />
  )
}
