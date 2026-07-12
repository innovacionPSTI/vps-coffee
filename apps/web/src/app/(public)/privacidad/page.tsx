import type { Metadata } from 'next'
import { getStoreConfig } from '@vps/database'
import LegalPage from '@/components/legal/LegalPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig().catch(() => null)
  return {
    title: `Política de privacidad | ${config?.store_name ?? 'VPS Coffee'}`,
    robots: { index: true, follow: true },
  }
}

export default async function PrivacidadPage() {
  const config = await getStoreConfig().catch(() => null)

  return (
    <LegalPage
      title="Política de privacidad"
      content={config?.privacy_content ?? null}
      storeName={config?.store_name ?? 'VPS Coffee'}
    />
  )
}
