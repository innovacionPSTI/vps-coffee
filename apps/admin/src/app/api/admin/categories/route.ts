import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, description, active = true } = body

  if (!name?.trim() || !slug?.trim())
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug: slug.trim(), description: description ?? null, active })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
