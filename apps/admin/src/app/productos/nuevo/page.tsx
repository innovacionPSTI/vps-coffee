import { createServerClient } from '@vps/database'
import { getVariantTypes } from '@vps/database'
import type { Metadata } from 'next'
import ProductForm from '../ProductForm'

export const metadata: Metadata = { title: 'Nuevo producto' }
export const dynamic = 'force-dynamic'

export default async function NuevoProductoPage() {
  const supabase = createServerClient()
  const [{ data: categories }, variantTypes] = await Promise.all([
    supabase.from('categories').select('id, name').eq('active', true).order('name'),
    getVariantTypes(true),
  ])

  return (
    <div>
      <ProductForm categories={categories ?? []} variantTypes={variantTypes} />
    </div>
  )
}
