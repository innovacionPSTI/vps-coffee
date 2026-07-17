import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getCartItems, replaceCart, clearCart } from '@vps/database'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@vps/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('stack_id', userId)
    .single()
  return data?.id ?? null
}

/** GET /api/account/cart — returns DB cart for logged-in user */
export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const customerId = await getCustomerId(user.id)
  if (!customerId) return NextResponse.json({ items: [] })

  const items = await getCartItems(customerId)
  return NextResponse.json({ items })
}

/** POST /api/account/cart — replace entire cart in DB */
export async function POST(req: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const customerId = await getCustomerId(user.id)
  if (!customerId) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const { items } = await req.json()
  if (!Array.isArray(items)) return NextResponse.json({ error: 'items requerido' }, { status: 400 })

  // Skip items missing valid IDs — they can't satisfy the FK constraints
  // (productId is optional on CartItem for legacy reasons; variantId=0 is also invalid)
  const validItems = items.filter(
    (i) => i.productId && i.productId > 0 && i.variantId && i.variantId > 0
  )

  await replaceCart(
    customerId,
    validItems.map((i) => ({
      customer_id: customerId,
      variant_id: i.variantId,
      product_id: i.productId,
      product_name: i.productName,
      variant_label: i.variantLabel,
      qty: i.qty,
      price: i.price,
      image_url: i.imageUrl ?? null,
    }))
  )

  return NextResponse.json({ ok: true })
}

/** DELETE /api/account/cart — clear entire cart in DB */
export async function DELETE() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const customerId = await getCustomerId(user.id)
  if (!customerId) return NextResponse.json({ ok: true })

  await clearCart(customerId)
  return NextResponse.json({ ok: true })
}
