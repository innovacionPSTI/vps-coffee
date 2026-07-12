import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId, 10)
    const body = await request.json()
    const {
      title, slug, excerpt, content, cover_image,
      category, published, published_at, seo_title, seo_desc,
    } = body

    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'title y slug son requeridos' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('blog_posts')
      .update({
        title:       title.trim(),
        slug:        slug.trim(),
        excerpt:     excerpt     ?? null,
        content:     content     ?? null,
        cover_image: cover_image ?? null,
        category:    category    ?? null,
        published:   published   ?? false,
        published_at: published_at ?? null,
        seo_title:   seo_title   ?? null,
        seo_desc:    seo_desc    ?? null,
      })
      .eq('id', id)

    if (error) {
      console.error('[blog PATCH]', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un artículo con ese slug' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[blog PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId, 10)
    const supabase = createServerClient()
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) {
      console.error('[blog DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[blog DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
