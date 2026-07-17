import { getProducts } from '@vps/database'
import ShopClient from '@/components/shop/ShopClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra selección de productos.',
}

export const revalidate = 60

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [products, sp] = await Promise.all([
    getProducts().catch(() => []),
    searchParams,
  ])
  return <ShopClient products={products} searchParams={sp} />
}
