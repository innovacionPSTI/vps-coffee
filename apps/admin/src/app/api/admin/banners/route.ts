import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { section, title, subtitle, cta_text, cta_url, image_url, bg_color, order_index, active } = body

  if (!section) return NextResponse.json({ error: 'section es requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('banners')
    .insert({ section, title, subtitle, cta_text, cta_url, image_url, bg_color, order_index: order_index ?? 0, active: active ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
