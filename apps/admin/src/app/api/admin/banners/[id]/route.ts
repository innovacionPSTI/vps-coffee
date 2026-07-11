import { createServerClient } from '@vps/database'
import type { Database } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

type BannerUpdate = Database['public']['Tables']['banners']['Update']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as BannerUpdate
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('banners')
    .update(body)
    .eq('id', Number(id))
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()
  const { error } = await supabase.from('banners').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
