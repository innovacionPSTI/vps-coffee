import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*)')
    .eq('id', Number(id))
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { variants, ...productData } = body

  const supabase = createServerClient()

  // Actualizar datos del producto
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', Number(id))
    .select()
    .single()
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  // Sincronizar variantes si se enviaron
  if (variants) {
    // Eliminar las que tienen _delete: true
    const toDelete = variants.filter((v: any) => v._delete && v.id)
    for (const v of toDelete) {
      await supabase.from('product_variants').delete().eq('id', v.id)
    }

    // Upsert el resto
    const toUpsert = variants
      .filter((v: any) => !v._delete)
      .map((v: any) => ({
        ...(v.id ? { id: v.id } : {}),
        product_id: Number(id),
        roast: v.roast || null,
        weight: v.weight || null,
        grind: v.grind || null,
        brew_method: v.brew_method || null,
        price: Number(v.price),
        stock: Number(v.stock ?? 0),
        sku: v.sku || null,
        active: v.active ?? true,
      }))

    if (toUpsert.length > 0) {
      const { error: variantError } = await supabase
        .from('product_variants')
        .upsert(toUpsert, { onConflict: 'id' })
      if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })
    }
  }

  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  // Eliminar variantes primero (FK)
  await supabase.from('product_variants').delete().eq('product_id', Number(id))

  const { error } = await supabase.from('products').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
