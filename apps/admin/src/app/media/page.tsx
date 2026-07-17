import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import MediaClient from './MediaClient'

export const metadata: Metadata = { title: 'Media' }
export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-brand-primary">Archivos</h1>
        <p className="text-sm text-gray-500 mt-1">Imágenes y archivos subidos al almacenamiento</p>
      </div>

      <MediaClient initialAssets={data ?? []} />
    </div>
  )
}
