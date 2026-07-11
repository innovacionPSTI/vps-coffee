import { getProductBySlug, getProducts } from '@vps/database'
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
  return {
    title: product.seo_title ?? product.name,
    description: product.seo_desc ?? product.description ?? undefined,
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug).catch(() => null)
  if (!product) notFound()

  const related = await getProducts()
    .then((all) => all.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 3))
    .catch(() => [])

  return <ProductDetail product={product} related={related} />
}
