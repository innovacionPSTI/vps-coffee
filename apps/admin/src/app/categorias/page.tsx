import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import CategoriasClient from './CategoriasClient'

export const metadata: Metadata = { title: 'Categorías' }
export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const supabase = createServerClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('order_index')

  return <CategoriasClient categories={categories ?? []} />
}
