import type { Metadata } from 'next'
import { getStoreConfig } from '@vps/database'
import LegalPage from '@/components/legal/LegalPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig().catch(() => null)
  return {
    title: `Términos y condiciones | ${config?.store_name ?? 'Mi Tienda'}`,
    robots: { index: true, follow: true },
  }
}

export default async function TerminosPage() {
  const config = await getStoreConfig().catch(() => null)

  return (
    <LegalPage
      title="Términos y condiciones"
      content={config?.terms_content ?? null}
      storeName={config?.store_name ?? 'Mi Tienda'}
    />
  )
}
