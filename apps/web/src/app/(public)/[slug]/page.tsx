/**
 * Ruta dinámica para páginas CMS gestionadas desde el admin.
 *
 * Funcionamiento:
 *   1. Busca la página por slug en la tabla `pages`
 *   2. Carga sus secciones + ítems con getPageWithSections()
 *   3. Renderiza cada sección con SectionRenderer
 *
 * Las rutas explícitas (/, /tienda, /blog, /checkout, /mi-cuenta…)
 * tienen prioridad sobre esta ruta dinámica en Next.js.
 *
 * No contiene ningún string específico de café o dominio.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageWithSections, getStoreConfig } from '@vps/database'
import SectionRenderer from '@/components/sections/SectionRenderer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageWithSections(slug).catch(() => null)
  if (!page) return {}

  return {
    title: page.meta_title ?? page.label,
    description: page.meta_description ?? undefined,
  }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params
  const [pageData, config] = await Promise.all([
    getPageWithSections(slug, true).catch(() => null),
    getStoreConfig().catch(() => null),
  ])

  if (!pageData) notFound()

  return (
    <div className="bg-brand-cream min-h-screen pt-16">
      {pageData.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          pageKey={pageData.key}
          whatsappNumber={config?.whatsapp_number}
        />
      ))}
    </div>
  )
}
