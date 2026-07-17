import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'

export async function GET() {
  try {
    await getAdminUser()
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('nav_items')
      .select('*')
      .order('order_index')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminUser()
    const body = await req.json()
    const { label, href, enabled, order_index, parent_id } = body
    if (!label) return NextResponse.json({ error: 'label requerido' }, { status: 400 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('nav_items')
      .insert({
        label,
        href: href || null,
        enabled: enabled ?? true,
        order_index: order_index ?? 0,
        parent_id: parent_id ?? null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await getAdminUser()
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('nav_items')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await getAdminUser()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = createServerClient()
    const { error } = await supabase.from('nav_items').delete().eq('id', Number(id))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
