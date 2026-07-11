import { getProducts } from '@vps/database'
import ShopClient from '@/components/shop/ShopClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Explora nuestra selección de cafés de especialidad colombianos.',
}

export const revalidate = 60

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const products = await getProducts().catch(() => [])
  return <ShopClient products={products} searchParams={searchParams} />
}
