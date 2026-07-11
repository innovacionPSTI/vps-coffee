import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'
import ProductForm from '../ProductForm'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NuevoProductoPage() {
  const supabase = createServerClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div>
      <ProductForm categories={categories ?? []} />
    </div>
  )
}
