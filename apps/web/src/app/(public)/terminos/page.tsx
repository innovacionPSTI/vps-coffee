import type { Metadata } from 'next'
import { getStoreConfig, getPageWithSections } from '@vps/database'
import LegalPage from '@/components/legal/LegalPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const [config, page] = await Promise.all([
    getStoreConfig().catch(() => null),
    getPageWithSections('terminos').catch(() => null),
  ])
  return {
    title: page?.meta_title ?? `Términos y condiciones | ${config?.store_name ?? 'Mi Tienda'}`,
    description: page?.meta_description ?? undefined,
    robots: { index: true, follow: true },
  }
}

export default async function TerminosPage() {
  const [config, page] = await Promise.all([
    getStoreConfig().catch(() => null),
    getPageWithSections('terminos').catch(() => null),
  ])

  // Extraer contenido del primer section_type='text' (seed de migración 18)
  const textSection = page?.sections?.find((s) => s.section_type === 'text')
  const content = textSection?.body ?? config?.terms_content ?? null

  return (
    <LegalPage
      title={textSection?.title ?? 'Términos y condiciones'}
      content={content}
      storeName={config?.store_name ?? 'Mi Tienda'}
    />
  )
}
