import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, description, category_id, featured, active, seo_title, seo_desc, images = [], variants = [] } = body

  if (!name?.trim() || !slug?.trim())
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
  if (variants.length === 0)
    return NextResponse.json({ error: 'El producto debe tener al menos una variante' }, { status: 400 })

  const supabase = createServerClient()

  // Crear producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description || null,
      category_id: category_id || null,
      featured: featured ?? false,
      active: active ?? true,
      seo_title: seo_title || null,
      seo_desc: seo_desc || null,
      images: Array.isArray(images) ? images : [],
    })
    .select()
    .single()

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  // Crear variantes
  const variantRows = variants.map((v: any) => ({
    product_id: product.id,
    roast: v.roast || null,
    weight: v.weight || null,
    grind: v.grind || null,
    brew_method: v.brew_method || null,
    price: Number(v.price),
    stock: Number(v.stock ?? 0),
    sku: v.sku || null,
    active: v.active ?? true,
  }))

  const { error: variantError } = await supabase.from('product_variants').insert(variantRows)
  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })

  return NextResponse.json(product, { status: 201 })
}
