import { createServerClient, getVariantTypes } from '@vps/database'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductForm from '../ProductForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase.from('products').select('name').eq('id', Number(id)).single()
  return { title: data ? `Editar: ${data.name}` : 'Producto' }
}

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const [{ data: product }, { data: categories }, variantTypes] = await Promise.all([
    supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', Number(id))
      .single(),
    supabase
      .from('categories')
      .select('id, name')
      .eq('active', true)
      .order('name'),
    getVariantTypes(true),
  ])

  if (!product) notFound()

  return (
    <div>
      <ProductForm product={product} categories={categories ?? []} variantTypes={variantTypes} />
    </div>
  )
}
