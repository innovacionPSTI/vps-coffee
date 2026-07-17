import { getProductBySlug, getProducts, getStoreConfig } from '@vps/database'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/shop/ProductDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug).catch(() => null)
  if (!product) return {}

  const title       = product.seo_title ?? product.name
  const description = product.seo_desc ?? product.description ?? undefined
  const firstImage  = product.images?.[0]
  const imageUrl    = firstImage?.url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: firstImage?.alt ?? title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, storeConfig] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getStoreConfig().catch(() => null),
  ])
  if (!product) notFound()

  const related = await getProducts()
    .then((all) => all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 3))
    .catch(() => [])

  const trustBadges = (storeConfig?.trust_badges ?? []).filter((b) => b.enabled)

  return <ProductDetail product={product} related={related} trustBadges={trustBadges} />
}
